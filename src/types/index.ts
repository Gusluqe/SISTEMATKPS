export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketCategory =
  | "hardware"
  | "software"
  | "internet"
  | "printers"
  | "systems"
  | "users"
  | "ecommerce"
  | "other";

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  requester_name: string;
  requester_email: string;
  area: string;
  technician_id: string | null;
  technician?: Technician;
  attachments: string[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  comments?: TicketComment[];
  history?: TicketHistory[];
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_name: string;
  author_email: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  changed_by: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  total_open: number;
  total_urgent: number;
  total_resolved: number;
  avg_resolution_hours: number;
  by_category: Record<TicketCategory, number>;
  by_status: Record<TicketStatus, number>;
  by_priority: Record<TicketPriority, number>;
  recent_tickets: Ticket[];
}

export interface CreateTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  requester_name: string;
  requester_email: string;
  area: string;
  attachments?: string[];
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  technician_id?: string | null;
  title?: string;
  description?: string;
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Abierto",
  in_progress: "En Proceso",
  waiting: "Esperando Respuesta",
  resolved: "Resuelto",
  closed: "Cerrado",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  hardware: "Hardware",
  software: "Software",
  internet: "Internet",
  printers: "Impresoras",
  systems: "Sistemas",
  users: "Usuarios",
  ecommerce: "E-Commerce",
  other: "Otro",
};

export const AREA_OPTIONS = [
  "Administración",
  "Contabilidad",
  "Recursos Humanos",
  "Sistemas / IT",
  "Ventas",
  "Marketing",
  "Operaciones",
  "Logística",
  "Gerencia",
  "Atención al Cliente",
  "Legal",
  "Finanzas",
  "Otro",
];
