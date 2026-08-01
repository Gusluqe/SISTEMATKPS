import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { TicketPriority, TicketStatus, TicketCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `TK-${year}-${random}`;
}

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  medium: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  high: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  urgent: "text-red-400 bg-red-400/10 border-red-400/20",
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  waiting: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  resolved: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  closed: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

export const CATEGORY_ICONS: Record<TicketCategory, string> = {
  hardware: "💻",
  software: "⚙️",
  internet: "🌐",
  printers: "🖨️",
  systems: "🖥️",
  users: "👤",
  ecommerce: "🛒",
  maintenance: "🔧",
  woxi: "📅",
  other: "📋",
};

export const PRIORITY_DOT: Record<TicketPriority, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-400",
  high: "bg-amber-400",
  urgent: "bg-red-500 animate-pulse",
};
