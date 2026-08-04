import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { slaDeadline } from "@/lib/sla";
import { cronKey } from "@/lib/tokens";
import { sendSlaReminderEmail } from "@/lib/email/mailer";
import { Ticket } from "@/types";

const AUTO_CLOSE_DAYS = 7;

function authorized(request: NextRequest): boolean {
  const header = request.headers.get("authorization") || "";
  const provided = header.replace(/^Bearer\s+/i, "");
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(cronKey());
  return a.length === b.length && timingSafeEqual(a, b);
}

// Tareas periódicas (las dispara netlify/functions/cron.mjs cada 30 min):
// 1. Recordatorio al equipo cuando un ticket vence su SLA sin respuesta.
// 2. Auto-cierre de tickets resueltos sin actividad por 7 días.
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
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

    const overdue = ((unanswered || []) as Ticket[]).filter(
      (t) => now > slaDeadline(t).getTime()
    );

    let reminders = 0;
    if (overdue.length > 0) {
      // El equipo se carga una sola vez, no por ticket
      const { data: team } = await supabase
        .from("technicians")
        .select("email, role, sectors")
        .eq("active", true);

      for (const ticket of overdue) {
        // Marcar primero: si dos ejecuciones se solapan, solo una manda el aviso
        const { data: claimed } = await supabase
          .from("tickets")
          .update({ sla_reminder_sent_at: new Date().toISOString() })
          .eq("id", ticket.id)
          .is("sla_reminder_sent_at", null)
          .select("id");

        if (!claimed?.length) continue;

        const emails = (team || [])
          .filter((t) => t.role === "admin" || (t.sectors || []).includes(ticket.sector))
          .map((t) => t.email)
          .filter(Boolean);

        const hoursOverdue = Math.max(
          1,
          Math.round((now - slaDeadline(ticket).getTime()) / 3_600_000)
        );
        await sendSlaReminderEmail(ticket, emails, hoursOverdue).catch((err) =>
          console.error("[Cron] Failed SLA reminder:", err)
        );
        reminders++;
      }
    }

    // --- 2. Auto-cierre de resueltos viejos (en lote) ---
    const cutoff = new Date(now - AUTO_CLOSE_DAYS * 86_400_000).toISOString();
    const { data: stale } = await supabase
      .from("tickets")
      .select("id")
      .eq("status", "resolved")
      .lt("resolved_at", cutoff);

    const staleIds = (stale || []).map((t) => t.id);
    if (staleIds.length > 0) {
      await supabase
        .from("tickets")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .in("id", staleIds);
      await supabase.from("ticket_history").insert(
        staleIds.map((id) => ({
          ticket_id: id,
          changed_by: "Sistema (auto-cierre)",
          field_changed: "status",
          old_value: "resolved",
          new_value: "closed",
        }))
      );
    }

    return NextResponse.json({ ok: true, reminders, closed: staleIds.length });
  } catch (error) {
    console.error("[GET /api/cron]", error);
    return NextResponse.json({ error: "Error en tareas programadas" }, { status: 500 });
  }
}
