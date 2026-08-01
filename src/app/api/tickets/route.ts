import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateTicketNumber } from "@/lib/utils";
import { sendTicketCreatedEmail, sendNewTicketToTeamEmail } from "@/lib/email/resend";
import { CreateTicketInput, TicketSector } from "@/types";

const VALID_SECTORS: TicketSector[] = ["sistemas", "ecommerce", "mantenimiento"];

export async function GET(request: NextRequest) {
  try {
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
    if (limit) query = query.limit(parseInt(limit));

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
    const body: CreateTicketInput = await request.json();

    const { requester_name, requester_email, area, priority, category, title, description } = body;

    if (!requester_name || !requester_email || !area || !priority || !category || !title || !description) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Sector destino: si no viene (o es inválido) se deriva de la categoría
    const sector: TicketSector = VALID_SECTORS.includes(body.sector)
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

    const teamEmails = (team || []).map((t) => t.email);
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
