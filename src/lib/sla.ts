import { Ticket, TicketPriority } from "@/types";

// Lógica pura de SLA — sin dependencias de Node, se puede importar
// tanto en el servidor como en componentes de cliente.

// Tiempos de primera respuesta prometidos en la portada pública
export const SLA_RESPONSE_HOURS: Record<TicketPriority, number> = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 72,
};

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
