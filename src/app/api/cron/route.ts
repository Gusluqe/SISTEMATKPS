import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { cronKey, slaDeadline } from "@/lib/sla";
import { sendSlaReminderEmail } from "@/lib/email/resend";
import { Ticket } from "@/types";

const AUTO_CLOSE_DAYS = 7;

// Tareas periódicas (las dispara netlify/functions/cron.mjs cada 30 min):
// 1. Recordatorio al equipo cuando un ticket vence su SLA sin respuesta.
// 2. Auto-cierre de tickets resueltos sin actividad por 7 días.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== cronKey()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    const now = Date.now();

    // --- 1. Recordatorios de SLA vencido ---
    const { data: unanswered } = await supabase
      .from("tickets")
      .select("*")
      .eq("status", "open")
      .is("first_response_at", null)
      .is("sla_reminder_sent_at", null);

    let reminders = 0;
    for (const ticket of (unanswered || []) as Ticket[]) {
      const deadline = slaDeadline(ticket).getTime();
      if (now <= deadline) continue;

      // Aviso al equipo del sector + admins (los sin email quedan afuera solos)
      const { data: team } = await supabase
        .from("technicians")
        .select("email, role, sectors")
        .eq("active", true);

      const emails = (team || [])
        .filter((t) => t.role === "admin" || (t.sectors || []).includes(ticket.sector))
        .map((t) => t.email);

      const hoursOverdue = Math.max(1, Math.round((now - deadline) / 3_600_000));
      await sendSlaReminderEmail(ticket, emails, hoursOverdue).catch((err) =>
        console.error("[Cron] Failed SLA reminder:", err)
      );

      await supabase
        .from("tickets")
        .update({ sla_reminder_sent_at: new Date().toISOString() })
        .eq("id", ticket.id);
      reminders++;
    }

    // --- 2. Auto-cierre de resueltos viejos ---
    const cutoff = new Date(now - AUTO_CLOSE_DAYS * 86_400_000).toISOString();
    const { data: stale } = await supabase
      .from("tickets")
      .select("id, resolved_at")
      .eq("status", "resolved")
      .lt("resolved_at", cutoff);

    let closed = 0;
    for (const ticket of stale || []) {
      await supabase
        .from("tickets")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", ticket.id);
      await supabase.from("ticket_history").insert({
        ticket_id: ticket.id,
        changed_by: "Sistema (auto-cierre)",
        field_changed: "status",
        old_value: "resolved",
        new_value: "closed",
      });
      closed++;
    }

    return NextResponse.json({ ok: true, reminders, closed });
  } catch (error) {
    console.error("[GET /api/cron]", error);
    return NextResponse.json({ error: "Error en tareas programadas" }, { status: 500 });
  }
}
