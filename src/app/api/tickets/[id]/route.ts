import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTicketStatusChangedEmail, sendTicketPriorityChangedEmail, sendTicketAssignedToTechEmail, sendNewTicketToTeamEmail } from "@/lib/email/resend";
import { UpdateTicketInput } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        technician:technicians(id, name, email, avatar_url),
        comments:ticket_comments(*),
        history:ticket_history(*)
      `
      )
      .order("created_at", { ascending: true, referencedTable: "ticket_comments" })
      .order("created_at", { ascending: true, referencedTable: "ticket_history" })
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!ticket)
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[GET /api/tickets/[id]]", error);
    return NextResponse.json({ error: "Error al obtener ticket" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: UpdateTicketInput & { changed_by?: string } = await request.json();
    const supabase = await createAdminClient();

    // Get current ticket to detect status change
    const { data: current } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (!current)
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });

    const { changed_by = "Admin", ...rawFields } = body;

    // Whitelist: solo campos editables, nada de ticket_number/created_at/etc.
    const ALLOWED = ["status", "priority", "category", "sector", "technician_id", "title", "description", "attachments"];
    const ENUMS: Record<string, string[]> = {
      status: ["open", "in_progress", "waiting", "resolved", "closed"],
      priority: ["low", "medium", "high", "urgent"],
      category: ["hardware", "software", "internet", "printers", "systems", "users", "ecommerce", "maintenance", "woxi", "other"],
      sector: ["sistemas", "ecommerce", "mantenimiento"],
    };

    const updateFields = Object.fromEntries(
      Object.entries(rawFields).filter(([key]) => ALLOWED.includes(key))
    ) as UpdateTicketInput & { attachments?: string[] };

    for (const [field, allowed] of Object.entries(ENUMS)) {
      const value = (updateFields as Record<string, unknown>)[field];
      if (value !== undefined && !allowed.includes(value as string)) {
        return NextResponse.json({ error: `Valor inválido para ${field}` }, { status: 400 });
      }
    }

    // Si cambia el sector, la categoría acompaña para no quedar incoherente
    if (updateFields.sector && !updateFields.category) {
      if (updateFields.sector === "ecommerce" && current.category !== "ecommerce") {
        updateFields.category = "ecommerce";
      } else if (updateFields.sector === "mantenimiento" && current.category !== "maintenance") {
        updateFields.category = "maintenance";
      } else if (updateFields.sector === "sistemas" && ["ecommerce", "maintenance"].includes(current.category)) {
        updateFields.category = "other";
      }
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    if (updateFields.status === "resolved" && !current.resolved_at) {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from("tickets")
      .update(updatePayload)
      .eq("id", id)
      .select(`*, technician:technicians(id, name, email)`)
      .single();

    if (error) throw error;

    // Track history for each changed field (attachments generaría entradas ilegibles)
    const historyEntries = Object.entries(updateFields)
      .filter(([key]) => key !== "changed_by" && key !== "attachments")
      .map(([field, newValue]) => ({
        ticket_id: id,
        changed_by,
        field_changed: field,
        old_value: String((current as Record<string, unknown>)[field] ?? ""),
        new_value: String(newValue ?? ""),
      }));

    if (historyEntries.length > 0) {
      await supabase.from("ticket_history").insert(historyEntries);
    }

    // Send email if status changed
    if (updateFields.status && updateFields.status !== current.status) {
      await sendTicketStatusChangedEmail(updated, current.status, updateFields.status).catch(
        (err) => console.error("[Email] Failed to send status email:", err)
      );
    }

    // Send email if priority changed
    if (updateFields.priority && updateFields.priority !== current.priority) {
      await sendTicketPriorityChangedEmail(updated, current.priority, updateFields.priority).catch(
        (err) => console.error("[Email] Failed to send priority email:", err)
      );
    }

    // Send email to tech when newly assigned
    const techChanged = updateFields.technician_id !== undefined &&
      updateFields.technician_id !== null &&
      updateFields.technician_id !== current.technician_id;

    if (techChanged && updated.technician) {
      await sendTicketAssignedToTechEmail(updated).catch(
        (err) => console.error("[Email] Failed to send tech assignment email:", err)
      );
    }

    // If the ticket was moved to another sector, notify that team
    if (updateFields.sector && updateFields.sector !== current.sector) {
      const { data: team } = await supabase
        .from("technicians")
        .select("email")
        .eq("active", true)
        .contains("sectors", [updateFields.sector]);

      const teamEmails = (team || []).map((t) => t.email);
      if (teamEmails.length > 0) {
        await sendNewTicketToTeamEmail(updated, teamEmails).catch(
          (err) => console.error("[Email] Failed to notify new sector team:", err)
        );
      }
    }

    // Devolver el historial actualizado para que la UI no quede desfasada
    const { data: history } = await supabase
      .from("ticket_history")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ ...updated, history: history || [] });
  } catch (error) {
    console.error("[PATCH /api/tickets/[id]]", error);
    return NextResponse.json({ error: "Error al actualizar ticket" }, { status: 500 });
  }
}
