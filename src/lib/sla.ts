import { createHmac } from "crypto";
import { Ticket, TicketPriority } from "@/types";

// Tiempos de primera respuesta prometidos en la portada pública
export const SLA_RESPONSE_HOURS: Record<TicketPriority, number> = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 72,
};

export const SITE_URL = process.env.URL || "https://tkps.netlify.app";

export function slaDeadline(ticket: Pick<Ticket, "created_at" | "priority">): Date {
  return new Date(
    new Date(ticket.created_at).getTime() + SLA_RESPONSE_HOURS[ticket.priority] * 3_600_000
  );
}

export type SlaState = "met" | "pending" | "at_risk" | "breached";

// Estado de SLA de respuesta: si hubo primera respuesta se compara contra el
// deadline; si no la hubo todavía, depende de cuánto falta para vencer.
export function slaState(
  ticket: Pick<Ticket, "created_at" | "priority" | "first_response_at">
): SlaState {
  const deadline = slaDeadline(ticket).getTime();
  if (ticket.first_response_at) {
    return new Date(ticket.first_response_at).getTime() <= deadline ? "met" : "breached";
  }
  const now = Date.now();
  if (now > deadline) return "breached";
  // "En riesgo" cuando queda menos del 25% del plazo
  const total = SLA_RESPONSE_HOURS[ticket.priority] * 3_600_000;
  return deadline - now < total * 0.25 ? "at_risk" : "pending";
}

// Tokens firmados con la service key: no requieren env vars nuevas y no son
// adivinables sin acceso al servidor.
function hmac(payload: string): string {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    .update(payload)
    .digest("hex");
}

// Token del link de calificación que viaja en el email de "resuelto"
export function ratingToken(ticketId: string): string {
  return hmac(`rating:${ticketId}`).slice(0, 24);
}

export function ratingUrl(ticketId: string): string {
  return `${SITE_URL}/api/tickets/${ticketId}/rating?t=${ratingToken(ticketId)}`;
}

// Clave que protege el endpoint de cron (la scheduled function la recalcula)
export function cronKey(): string {
  return hmac("cron-proteger-salud").slice(0, 32);
}
