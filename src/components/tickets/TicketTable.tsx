"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Technician,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  CATEGORY_LABELS,
} from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { formatDate, formatRelative } from "@/lib/utils";
import { ArrowUpDown, Search, Filter, ChevronRight, SlidersHorizontal, X } from "lucide-react";
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

export function TicketTable({ tickets, technicians = [] }: TicketTableProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TicketPriority | "all">("all");
  const [filterCategory, setFilterCategory] = useState<TicketCategory | "all">("all");
  const [filterTechnician, setFilterTechnician] = useState<string>("all");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "created_at",
    dir: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all" || filterTechnician !== "all";

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterCategory("all");
    setFilterTechnician("all");
  };

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
      const matchTechnician =
        filterTechnician === "all"
          ? true
          : filterTechnician === "unassigned"
          ? !t.technician_id
          : t.technician_id === filterTechnician;
      return matchSearch && matchStatus && matchPriority && matchCategory && matchTechnician;
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

  const toggleSort = (field: SortField) =>
    setSort((s) =>
      s.field === field
        ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "desc" }
    );

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#94a3b8] transition-colors group"
    >
      {label}
      <ArrowUpDown
        className={cn(
          "w-3 h-3 transition-colors",
          sort.field === field
            ? "text-[#00e5a0]"
            : "text-[#334155] group-hover:text-[#475569]"
        )}
      />
    </button>
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
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-[#f8fafc] placeholder:text-[#334155] focus:outline-none focus:border-[#00e5a0]/40 focus:ring-1 focus:ring-[#00e5a0]/20"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
            showFilters || hasActiveFilters
              ? "bg-[#00e5a0]/10 border-[#00e5a0]/25 text-[#00e5a0]"
              : "bg-[#1a1a2e] border-white/10 text-[#64748b] hover:text-[#94a3b8]"
          )}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-[#00e5a0] text-[#050509] text-[10px] font-bold flex items-center justify-center">
              {[filterStatus, filterPriority, filterCategory].filter((f) => f !== "all").length}
            </span>
          )}
        </button>
      </div>

      {/* Filter row — collapsible */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 bg-[#12121f] rounded-xl border border-white/[0.07]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TicketStatus | "all")}
            className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
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
            className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
            aria-label="Filtrar por prioridad"
          >
            <option value="all">Todas las prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as TicketCategory | "all")}
            className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
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
              className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#94a3b8] focus:outline-none focus:border-[#00e5a0]/40 flex-1 min-w-[140px]"
              aria-label="Filtrar por técnico"
            >
              <option value="all">Todos los técnicos</option>
              <option value="unassigned">Sin asignar</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

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
              <tr className="border-b border-white/[0.06] bg-[#0d0d1a]">
                <th className="px-4 py-3 text-left">
                  <SortBtn field="ticket_number" label="N° Ticket" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Título
                </th>
                <th className="px-4 py-3 text-left">
                  <SortBtn field="status" label="Estado" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortBtn field="priority" label="Prioridad" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Solicitante
                </th>
                <th className="px-4 py-3 text-left">
                  <SortBtn field="created_at" label="Fecha" />
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
                  <td colSpan={9} className="px-4 py-12 text-center text-[#334155] text-sm">
                    No se encontraron tickets con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="bg-[#12121f] hover:bg-[#1a1a2e] transition-colors cursor-pointer group"
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
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        <p className="text-xs text-[#94a3b8] font-medium">{ticket.requester_name}</p>
                        <p className="text-[11px] text-[#334155]">{ticket.requester_email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        <p className="text-xs text-[#64748b]">{formatDate(ticket.created_at)}</p>
                        <p className="text-[11px] text-[#334155]">{formatRelative(ticket.created_at)}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`} className="block">
                        {ticket.technician ? (
                          <span className="text-xs text-[#94a3b8]">{ticket.technician.name}</span>
                        ) : (
                          <span className="text-xs text-[#334155] italic">Sin asignar</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tickets/${ticket.id}`}>
                        <ChevronRight className="w-4 h-4 text-[#334155] group-hover:text-[#64748b] transition-colors" />
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
          <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl px-4 py-12 text-center text-[#334155] text-sm">
            No se encontraron tickets con los filtros aplicados.
          </div>
        ) : (
          filtered.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/admin/tickets/${ticket.id}`}
              className="block bg-[#12121f] border border-white/[0.07] rounded-2xl p-4 hover:border-white/[0.12] transition-colors"
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
              <p className="text-sm text-[#e2e8f0] font-medium mb-1 line-clamp-2">
                {ticket.title}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-xs text-[#94a3b8]">{ticket.requester_name}</p>
                  <p className="text-[11px] text-[#475569]">{ticket.area}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#64748b]">{CATEGORY_LABELS[ticket.category]}</p>
                  <p className="text-[11px] text-[#334155]">{formatRelative(ticket.created_at)}</p>
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
    </div>
  );
}
