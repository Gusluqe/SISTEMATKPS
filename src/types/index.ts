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
  | "maintenance"
  | "woxi"
  | "other";

export type TicketSector = "sistemas" | "ecommerce" | "mantenimiento";

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  sector: TicketSector;
  requester_name: string;
  requester_email: string;
  area: string;
  technician_id: string | null;
  technician?: Technician;
  attachments: string[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  first_response_at: string | null;
  sla_reminder_sent_at: string | null;
  rating: number | null;
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
  // Sin email el técnico no recibe notificaciones; se puede cargar después
  email: string | null;
  avatar_url: string | null;
  active: boolean;
  sectors: TicketSector[];
  role: "admin" | "technician";
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
  sector: TicketSector;
  requester_name: string;
  requester_email: string;
  area: string;
  attachments?: string[];
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  sector?: TicketSector;
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
  maintenance: "Mantenimiento",
  woxi: "WOXI (Turnos)",
  other: "Otro",
};

export const SECTOR_LABELS: Record<TicketSector, string> = {
  sistemas: "Sistemas",
  ecommerce: "E-Commerce",
  mantenimiento: "Mantenimiento",
};

export const SECTOR_DESCRIPTIONS: Record<TicketSector, string> = {
  sistemas: "PCs, internet, impresoras, sistemas y usuarios",
  ecommerce: "Tienda online, pedidos web, publicaciones",
  mantenimiento: "Edilicio: instalaciones, reparaciones, arreglos",
};

// Categorías que aplican a cada sector. Para ecommerce y mantenimiento
// la categoría se fija sola al crear el ticket.
export const SECTOR_CATEGORIES: Record<TicketSector, TicketCategory[]> = {
  sistemas: ["hardware", "software", "internet", "printers", "systems", "users", "woxi", "other"],
  ecommerce: ["ecommerce"],
  mantenimiento: ["maintenance"],
};

// Sucursales agrupadas: el ticket queda asociado a la farmacia/depósito
// desde donde escriben, y así se agrupan por sucursal.
export const SUCURSAL_GROUPS: Record<string, string[]> = {
  Farmacias: [
    "Farmacia Alberdi",
    "Farmacia Altos de Moreno",
    "Farmacia Alvear",
    "Farmacia Axion",
    "Farmacia Belgrano",
    "Farmacia Campos de Alvarez",
    "Farmacia Castelli",
    "Farmacia Catedral",
    "Farmacia Cimerman",
    "Farmacia Del Provincia",
    "Farmacia del Pueblo",
    "Farmacia Palomar",
    "Farmacia Sobredo",
    "Farmacia Vantage Merlo",
  ],
  "Droguería y Depósitos": ["Droguería Caso", "Depósito Catedral", "Depósito Alberdi"],
  Oficinas: ["Administración", "Obras Sociales", "Recursos Humanos"],
};

export const SUCURSALES = Object.values(SUCURSAL_GROUPS).flat();
