import { Ticket, TicketCategory, CATEGORY_LABELS } from "@/types";

// Ventana de análisis y umbral: 3+ tickets de la misma categoría en la misma
// sucursal en 90 días = falla recurrente
export const RECURRENCE_WINDOW_DAYS = 90;
export const RECURRENCE_THRESHOLD = 3;

// Acción propuesta según el tipo de falla que se repite
export const RECOMMENDATIONS: Record<TicketCategory, string> = {
  printers: "Proponer cambio de impresora",
  hardware: "Proponer cambio de la máquina",
  internet: "Revisar proveedor y cableado de red de la sucursal",
  maintenance: "Proponer una revisión exhaustiva de la sucursal",
  software: "Reinstalar/actualizar el software afectado",
  systems: "Auditar el sistema de gestión en esa sucursal",
  users: "Capacitación al personal de la sucursal",
  ecommerce: "Auditar la tienda online y sus integraciones",
  woxi: "Revisar la instalación de WOXI en la sucursal",
  other: "Hacer una revisión general de la sucursal",
};

export interface RecurrentAction {
  id: string;
  area: string;
  category: TicketCategory;
  action: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RecurrenceAlert {
  area: string;
  category: TicketCategory;
  categoryLabel: string;
  count: number;
  lastAt: string;
  recommendation: string;
}

// Detecta patrones de falla repetida por sucursal + categoría. Si ya se tomó
// una acción para ese patrón, solo cuentan los tickets posteriores a ella
// (así la alerta se apaga al marcar "se cambió" y vuelve si reincide).
export function detectRecurrences(
  tickets: Ticket[],
  actions: RecurrentAction[]
): RecurrenceAlert[] {
  const cutoff = Date.now() - RECURRENCE_WINDOW_DAYS * 86_400_000;

  const lastActionAt = new Map<string, number>();
  for (const a of actions) {
    const key = `${a.area}|${a.category}`;
    const t = new Date(a.created_at).getTime();
    if (t > (lastActionAt.get(key) || 0)) lastActionAt.set(key, t);
  }

  const groups = new Map<string, Ticket[]>();
  for (const t of tickets) {
    const created = new Date(t.created_at).getTime();
    if (created < cutoff) continue;
    const key = `${t.area}|${t.category}`;
    if (created <= (lastActionAt.get(key) || 0)) continue;
    const list = groups.get(key) || [];
    list.push(t);
    groups.set(key, list);
  }

  const alerts: RecurrenceAlert[] = [];
  for (const [key, list] of groups) {
    if (list.length < RECURRENCE_THRESHOLD) continue;
    const [area, category] = key.split("|") as [string, TicketCategory];
    alerts.push({
      area,
      category,
      categoryLabel: CATEGORY_LABELS[category] || category,
      count: list.length,
      lastAt: list.reduce((max, t) => (t.created_at > max ? t.created_at : max), list[0].created_at),
      recommendation: RECOMMENDATIONS[category] || RECOMMENDATIONS.other,
    });
  }

  return alerts.sort((a, b) => b.count - a.count);
}
