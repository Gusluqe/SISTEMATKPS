import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { generateTicketNumber } from "@/lib/utils";
import { requireAccess } from "@/lib/access";
import { clientIp, rateLimited } from "@/lib/ratelimit";
import { sendTicketCreatedEmail, sendNewTicketToTeamEmail } from "@/lib/email/mailer";
import { TicketSector, SUCURSALES, CATEGORY_LABELS } from "@/types";

const VALID_SECTORS: TicketSector[] = ["sistemas", "ecommerce", "mantenimiento"];

// Validación de servidor del formulario público: el cliente ya valida con zod,
// pero el endpoint es público y no puede confiar en el body.
const createTicketSchema = z.object({
  requester_name: z.string().trim().min(2).max(120),
  requester_email: z.string().trim().email().max(200),
  area: z.string().refine((a) => SUCURSALES.includes(a), "Sucursal inválida"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.enum(Object.keys(CATEGORY_LABELS) as [string, ...string[]]),
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(5000),
  sector: z.enum(VALID_SECTORS).optional(),
  attachments: z.array(z.string().url().max(500)).max(5).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { access, response } = await requireAccess();
    if (response) return response;

    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("tickets")
      .select(
        `
        *,
        technician:technicians(id, name, email)
      `
      )
      .order("created_at", { ascending: false });

    // Aislamiento por sector: técnicos solo ven los sectores asignados
    if (access.role !== "admin") {
      query = query.in("sector", access.sectors);
    }

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const sector = searchParams.get("sector");
    const area = searchParams.get("area");
    const limit = searchParams.get("limit");

    if (status && status !== "all") query = query.eq("status", status);
    if (priority && priority !== "all") query = query.eq("priority", priority);
    if (category && category !== "all") query = query.eq("category", category);
    if (sector && sector !== "all") query = query.eq("sector", sector);
    if (area && area !== "all") query = query.eq("area", area);

    // Paginación opcional (?page=0&per_page=50); sin ella, tope de seguridad
    const page = parseInt(searchParams.get("page") || "");
    const perPage = Math.min(parseInt(searchParams.get("per_page") || "") || 50, 200);
    if (Number.isInteger(page) && page >= 0) {
      query = query.range(page * perPage, page * perPage + perPage - 1);
    } else {
      query = query.limit(Math.min(parseInt(limit || "") || 1000, 1000));
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/tickets]", error);
    return NextResponse.json({ error: "Error al obtener tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 5 tickets por IP cada 10 minutos (anti-ráfaga, por instancia)
    if (rateLimited("tickets", clientIp(request), 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes seguidas. Esperá unos minutos y volvé a intentar." },
        { status: 429 }
      );
    }

    const parsed = createTicketSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos. Revisá los campos del formulario." },
        { status: 400 }
      );
    }
    const body = parsed.data;
    const { requester_name, requester_email, area, priority, category, title, description } = body;

    // Sector destino: si no viene se deriva de la categoría
    const sector: TicketSector = body.sector
      ? body.sector
      : category === "ecommerce"
      ? "ecommerce"
      : category === "maintenance"
      ? "mantenimiento"
      : "sistemas";

    const supabase = await createAdminClient();

    // Reintentar si el número aleatorio de ticket ya existe (UNIQUE violation)
    let ticket = null;
    let error = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const ticket_number = generateTicketNumber();
      ({ data: ticket, error } = await supabase
        .from("tickets")
        .insert({
          ticket_number,
          title,
          description,
          status: "open",
          priority,
          category,
          sector,
          requester_name,
          requester_email,
          area,
          attachments: body.attachments || [],
        })
        .select()
        .single());

      if (!error || error.code !== "23505") break;
    }

    if (error) throw error;
    if (!ticket) throw new Error("No se pudo crear el ticket");

    // Log initial history entry
    await supabase.from("ticket_history").insert({
      ticket_id: ticket.id,
      changed_by: requester_name,
      field_changed: "status",
      old_value: null,
      new_value: "open",
    });

    // Send confirmation email
    await sendTicketCreatedEmail(ticket).catch((err) =>
      console.error("[Email] Failed to send created email:", err)
    );

    // Notify the team that handles this sector
    const { data: team } = await supabase
      .from("technicians")
      .select("email")
      .eq("active", true)
      .contains("sectors", [sector]);

    const teamEmails = (team || []).map((t) => t.email).filter(Boolean);
    if (teamEmails.length > 0) {
      await sendNewTicketToTeamEmail(ticket, teamEmails).catch((err) =>
        console.error("[Email] Failed to notify sector team:", err)
      );
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tickets]", error);
    return NextResponse.json({ error: "Error al crear el ticket" }, { status: 500 });
  }
}
