"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ticket,
  Technician,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketSector,
  CATEGORY_LABELS,
  SECTOR_LABELS,
} from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { formatDate, formatRelative } from "@/lib/utils";
import { slaState } from "@/lib/sla";
import { ArrowUpDown, Search, Filter, ChevronRight, SlidersHorizontal, X, Download, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketTableProps {
  tickets: Ticket[];
  technicians?: Technician[];
}

type SortField = "created_at" | "priority" | "status" | "ticket_number";
type SortDir = "asc" | "desc";

const priorityOrder: Record<TicketPriority, number> = {
  urgent: 4, high: 3, medium: 2, low: 1,
};

const statusOrder: Record<TicketStatus, number> = {
  open: 5, in_progress: 4, waiting: 3, resolved: 2, closed: 1,
};

// Estado de SLA visible en la cola: el técnico ve qué está por vencer
// sin tener que ir al dashboard. Solo aplica a tickets activos.
function SlaBadge({ ticket, mounted }: { ticket: Ticket; mounted: boolean }) {
  if (!mounted || ["resolved", "closed"].includes(ticket.status)) return null;
  const state = slaState(ticket);
  if (state === "breached")
    return (
      <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
        SLA vencido
      </span>
    );
  if (state === "at_risk")
    return (
      <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        SLA por vencer
      </span>
    );
  return null;
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-400">
      <Star className="w-3 h-3 fill-amber-400" />
      {rating}/5
    </span>
  );
}

function SortBtn({
  field,
  label,
  sort,
  onToggle,
}: {
  field: SortField;
  label: string;
  sort: { field: SortField; dir: SortDir };
  onToggle: (field: SortField) => void;
}) {
  return (
    <button
      onClick={() => onToggle(field)}
      className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#94a3b8] transition-colors group"
    >
      {label}
      <ArrowUpDown
        className={cn(
          "w-3 h-3 transition-colors",
          sort.field === field
            ? "text-[#00e5a0]"
            : "text-[#44597c] group-hover:text-[#475569]"
        )}
      />
    </button>
  );
}

const PAGE_SIZE = 100;

export function TicketTable({ tickets, technicians = [] }: TicketTableProps) {
  const router = useRouter();
  // Los filtros se inicializan desde la URL: los links del dashboard
  // (?status=open, ?sector=x) y las vistas compartidas funcionan directo.
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">(
    (params.get("status") as TicketStatus) || "all"
  );
  const [filterPriority, setFilterPriority] = useState<TicketPriority | "all">(
    (params.get("priority") as TicketPriority) || "all"
  );
  const [filterCategory, setFilterCategory] = useState<TicketCategory | "all">(
    (params.get("category") as TicketCategory) || "all"
  );
  const [filterSector, setFilterSector] = useState<TicketSector | "all">(
    (params.get("sector") as TicketSector) || "all"
  );
  const [filterSucursal, setFilterSucursal] = useState<string>(params.get("area") || "all");
  const [filterTechnician, setFilterTechnician] = useState<string>(params.get("tech") || "all");
  const [filterSla, setFilterSla] = useState<string>(params.get("sla") || "all");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "created_at",
    dir: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  // El estado de SLA depende de Date.now(): se muestra recién tras hidratar
  // para no generar diferencias entre el HTML del servidor y el cliente.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Paginación atada a los filtros: si cambia cualquier filtro, la clave
  // cambia y se vuelve a la primera página sin necesidad de un effect.
  const filterKey = [filterStatus, filterPriority, filterCategory, filterSector, filterSucursal, filterTechnician, filterSla, search].join("|");
  const [pagination, setPagination] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = pagination.key === filterKey ? pagination.count : PAGE_SIZE;

  // La cola se refresca sola cada 60 s (solo con la pestaña visible)
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => clearInterval(t);
  }, [router]);

  // Refleja los filtros en la URL (sin recargar) para poder compartir la vista
  useEffect(() => {
    const q = new URLSearchParams();
    if (filterStatus !== "all") q.set("status", filterStatus);
    if (filterPriority !== "all") q.set("priority", filterPriority);
    if (filterCategory !== "all") q.set("category", filterCategory);
    if (filterSector !== "all") q.set("sector", filterSector);
    if (filterSucursal !== "all") q.set("area", filterSucursal);
    if (filterTechnician !== "all") q.set("tech", filterTechnician);
    if (filterSla !== "all") q.set("sla", filterSla);
    const qs = q.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filterStatus, filterPriority, filterCategory, filterSector, filterSucursal, filterTechnician, filterSla]);

  const hasActiveFilters =
    filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all" ||
    filterSector !== "all" || filterSucursal !== "all" || filterTechnician !== "all" ||
    filterSla !== "all";

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterCategory("all");
    setFilterSector("all");
    setFilterSucursal("all");
    setFilterTechnician("all");
    setFilterSla("all");
  };

  // Sucursales presentes en los tickets (incluye valores viejos)
  const sucursales = Array.from(new Set(tickets.map((t) => t.area))).sort();

  const filtered = tickets
    .filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.requester_name.toLowerCase().includes(q) ||
        t.requester_email.toLowerCase().includes(q) ||
        t.area.toLowerCase().includes(q) ||
        (t.technician?.name?.toLowerCase().includes(q) ?? false);
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      const matchPriority = filterPriority === "all" || t.priority === filterPriority;
      const matchCategory = filterCategory === "all" || t.category === filterCategory;
      const matchSector = filterSector === "all" || t.sector === filterSector;
      const matchSucursal = filterSucursal === "all" || t.area === filterSucursal;
      const matchTechnician =
        filterTechnician === "all"
          ? true
          : filterTechnician === "unassigned"
          ? !t.technician_id
          : t.technician_id === filterTechnician;
      const matchSla =
        filterSla === "all"
          ? true
          : !["resolved", "closed"].includes(t.status) &&
            (filterSla === "breached"
              ? slaState(t) === "breached"
              : slaState(t) === "at_risk");
      return matchSearch && matchStatus && matchPriority && matchCategory && matchSector && matchSucursal && matchTechnician && matchSla;
    })
    .sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.field === "created_at")
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      if (sort.field === "priority")
        return dir * (priorityOrder[a.priority] - priorityOrder[b.priority]);
      if (sort.field === "status")
        return dir * (statusOrder[a.status] - statusOrder[b.status]);
      if (sort.field === "ticket_number")
        return dir * a.ticket_number.localeCompare(b.ticket_number);
      return 0;
    });

  const exportCSV = () => {
    const escape = (v: string) => {
      let s = String(v ?? "");
      // Anti CSV-injection: Excel ejecuta como fórmula lo que empieza con =+-@
      if (/^[=+\-@]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const STATUS_ES: Record<string, string> = { open: "Abierto", in_progress: "En Proceso", waiting: "Esperando", resolved: "Resuelto", closed: "Cerrado" };
    const PRIORITY_ES: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta", urgent: "Urgente" };

    const headers = ["N° Ticket", "Título", "Estado", "Prioridad", "Sector", "Categoría", "Solicitante", "Email", "Sucursal", "Técnico", "Fecha creación", "Fecha resolución", "Descripción"];
    const rows = filtered.map((t) => [
      t.ticket_number,
      t.title,
      STATUS_ES[t.status] || t.status,
      PRIORITY_ES[t.priority] || t.priority,
      SECTOR_LABELS[t.sector] || t.sector,
      CATEGORY_LABELS[t.category] || t.category,
      t.requester_name,
      t.requester_email,
      t.area,
      t.technician?.name || "Sin asignar",
      formatDate(t.created_at),
      t.resolved_at ? formatDate(t.resolved_at) : "",
      t.description,
    ]);

    const csv = "﻿" + [headers, ...rows].map((r) => r.map(escape).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field: SortField) =>
    setSort((s) =>
      s.field === field
        ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "desc" }
    );

  return (
    <div className="space-y-3">
      {/* Search + filter toggle row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, N°, solicitante, email, técnico..."
            aria-label="Buscar tickets"
            className="w-full bg-[#1c3054] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-[#f8fafc] placeholder:text-[#44597c] focus:outline-none focus:border-[#00e5a0]/40 focus:ring-1 focus:ring-[#00e5a0]/20"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
            showFilters || hasActiveFilters
              ? "bg-[#00e5a0]/10 border-[#00e5a0]/25 text-[#00e5a0]"
              : "bg-[#1c3054] border-white/10 text-[#64748b] hover:text-[#94a3b8]"
          )}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-[#00e5a0] text-[#081428] text-[10px] font-bold flex items-center justify-center">
              {[filterStatus, filterPriority, filterCategory, filterSector, filterSucursal, filterTechnician].filter((f) => f !== "all").length}
            </span>
          )}
        </button>
        <button
          onClick={exportCSV}
          title="Exportar a Excel"
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-[#1c3054] text-sm font-medium text-[#64748b] hover:text-[#94a3b8] transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>

      {/* Filter row — collapsible */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 bg-[#13233f] rounded-xl border border-white/[0.07]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TicketStatus | "all")}
            className="bg-[#1c3054] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En Proceso</option>
            <option value="waiting">Esperando</option>
            <option value="resolved">Resuelto</option>
            <option value="closed">Cerrado</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TicketPriority | "all")}
            className="bg-[#1c3054] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
            aria-label="Filtrar por prioridad"
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value as TicketSector | "all")}
            className="bg-[#1c3054] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
            aria-label="Filtrar por sector"
          >
            <option value="all">Todos los sectores</option>
            {Object.entries(SECTOR_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <select
            value={filterSucursal}
            onChange={(e) => setFilterSucursal(e.target.value)}
            className="bg-[#1c3054] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
            aria-label="Filtrar por sucursal"
          >
            <option value="all">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as TicketCategory | "all")}
            className="bg-[#1c3054] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
            aria-label="Filtrar por categoría"
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          {technicians.length > 0 && (
            <select
              value={filterTechnician}
              onChange={(e) => setFilterTechnician(e.target.value)}
              className="bg-[#1c3054] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
              aria-label="Filtrar por técnico"
            >
              <option value="all">Todos los técnicos</option>
              <option value="unassigned">Sin asignar</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          <select
            value={filterSla}
            onChange={(e) => setFilterSla(e.target.value)}
            className="bg-[#1c3054] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
            aria-label="Filtrar por SLA"
          >
            <option value="all">SLA: todos</option>
            <option value="breached">SLA vencido</option>
            <option value="at_risk">SLA por vencer</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/15 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center gap-2 text-xs text-[#475569]">
        <Filter className="w-3.5 h-3.5" />
        {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        {search && <span>para &ldquo;{search}&rdquo;</span>}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0e1d38]">
                <th className="px-4 py-3 text-left">
                  <SortBtn field="ticket_number" label="N° Ticket" sort={sort} onToggle={toggleSort} />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Título
                </th>
                <th className="px-4 py-3 text-left">
                  <SortBtn field="status" label="Estado" sort={sort} onToggle={toggleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortBtn field="priority" label="Prioridad" sort={sort} onToggle={toggleSort} />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Solicitante
                </th>
                <th className="px-4 py-3 text-left">
                  <SortBtn field="created_at" label="Fecha" sort={sort} onToggle={toggleSort} />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Técnico
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#44597c] text-sm">
                    No se encontraron tickets con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, visibleCount).map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="bg-[#13233f] hover:bg-[#1c3054] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        <span className="font-mono text-xs text-[#00e5a0] font-semibold">
                          {ticket.ticket_number}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        <p className="text-sm text-[#e2e8f0] font-medium truncate">{ticket.title}</p>
                        <p className="text-xs text-[#475569] mt-0.5">{ticket.area}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        <StatusBadge status={ticket.status} size="sm" />
                        <div>
                          <SlaBadge ticket={ticket} mounted={mounted} />
                        </div>
                        <RatingStars rating={ticket.rating} />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        <PriorityBadge priority={ticket.priority} size="sm" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        <span className="text-xs text-[#64748b]">
                          {CATEGORY_LABELS[ticket.category]}
                        </span>
                        <p className="text-[11px] text-[#44597c] mt-0.5">
                          {SECTOR_LABELS[ticket.sector] || ticket.sector}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        <p className="text-xs text-[#94a3b8] font-medium">{ticket.requester_name}</p>
                        <p className="text-[11px] text-[#44597c]">{ticket.requester_email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        <p className="text-xs text-[#64748b]">{formatDate(ticket.created_at)}</p>
                        <p className="text-[11px] text-[#44597c]">{formatRelative(ticket.created_at)}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        {ticket.technician ? (
                          <span className="text-xs text-[#94a3b8]">{ticket.technician.name}</span>
                        ) : (
                          <span className="text-xs text-[#44597c] italic">Sin asignar</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`}>
                        <ChevronRight className="w-4 h-4 text-[#44597c] group-hover:text-[#64748b] transition-colors" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl px-4 py-12 text-center text-[#44597c] text-sm">
            No se encontraron tickets con los filtros aplicados.
          </div>
        ) : (
          filtered.slice(0, visibleCount).map((ticket) => (
            <Link
              key={ticket.id}
              href={`/admin/tickets/${ticket.id}`}
              className="block bg-[#13233f] border border-white/[0.07] rounded-2xl p-4 hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-mono text-xs text-[#00e5a0] font-semibold bg-[#00e5a0]/10 px-2 py-1 rounded-lg">
                  {ticket.ticket_number}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusBadge status={ticket.status} size="sm" />
                  <PriorityBadge priority={ticket.priority} size="sm" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SlaBadge ticket={ticket} mounted={mounted} />
                <RatingStars rating={ticket.rating} />
              </div>
              <p className="text-sm text-[#e2e8f0] font-medium mb-1 line-clamp-2">
                {ticket.title}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-xs text-[#94a3b8]">{ticket.requester_name}</p>
                  <p className="text-[11px] text-[#475569]">{ticket.area}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#64748b]">{SECTOR_LABELS[ticket.sector] || ticket.sector} · {CATEGORY_LABELS[ticket.category]}</p>
                  <p className="text-[11px] text-[#44597c]">{formatRelative(ticket.created_at)}</p>
                </div>
              </div>
              {ticket.technician && (
                <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                    {ticket.technician.name.charAt(0)}
                  </div>
                  <span className="text-xs text-[#64748b]">{ticket.technician.name}</span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Paginación: se muestran de a 100 para no colgar el navegador */}
      {filtered.length > visibleCount && (
        <div className="flex justify-center pt-1">
          <button
            onClick={() => setPagination({ key: filterKey, count: visibleCount + PAGE_SIZE })}
            className="px-4 py-2 rounded-xl border border-white/10 bg-[#1c3054] text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] hover:border-[#00e5a0]/30 transition-colors"
          >
            Mostrar más ({filtered.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
