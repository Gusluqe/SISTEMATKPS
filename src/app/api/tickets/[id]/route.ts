import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTicketStatusChangedEmail, sendTicketPriorityChangedEmail, sendTicketAssignedToTechEmail } from "@/lib/email/resend";
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
        comments:ticket_comments(*, created_at),
        history:ticket_history(*)
      `
      )
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

    const { changed_by = "Admin", ...updateFields } = body;

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

    // Track history for each changed field
    const historyEntries = Object.entries(updateFields)
      .filter(([key]) => key !== "changed_by")
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/tickets/[id]]", error);
    return NextResponse.json({ error: "Error al actualizar ticket" }, { status: 500 });
  }
}
