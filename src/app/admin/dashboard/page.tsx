import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CategoryChart, StatusChart } from "@/components/dashboard/Charts";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/server";
import {
  Ticket,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatRelative } from "@/lib/utils";
import Link from "next/link";
import { DashboardMetrics, TicketCategory, TicketStatus, TicketPriority } from "@/types";

async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createAdminClient();
  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, technician:technicians(id, name)")
    .order("created_at", { ascending: false });

  const t = tickets || [];

  const total_open = t.filter((x) => x.status === "open").length;
  const total_urgent = t.filter(
    (x) => x.priority === "urgent" && x.status !== "closed"
  ).length;
  const total_resolved = t.filter(
    (x) => x.status === "resolved" || x.status === "closed"
  ).length;

  const resolved = t.filter((x) => x.resolved_at && x.created_at);
  const avg_resolution_hours =
    resolved.length > 0
      ? Math.round(
          resolved.reduce((acc, x) => {
            const ms =
              new Date(x.resolved_at).getTime() -
              new Date(x.created_at).getTime();
            return acc + ms / 1000 / 3600;
          }, 0) / resolved.length
        )
      : 0;

  const by_category = t.reduce(
    (acc, x) => ({ ...acc, [x.category]: (acc[x.category] || 0) + 1 }),
    {} as Record<TicketCategory, number>
  );
  const by_status = t.reduce(
    (acc, x) => ({ ...acc, [x.status]: (acc[x.status] || 0) + 1 }),
    {} as Record<TicketStatus, number>
  );
  const by_priority = t.reduce(
    (acc, x) => ({ ...acc, [x.priority]: (acc[x.priority] || 0) + 1 }),
    {} as Record<TicketPriority, number>
  );

  return {
    total_open,
    total_urgent,
    total_resolved,
    avg_resolution_hours,
    by_category,
    by_status,
    by_priority,
    recent_tickets: t.slice(0, 6),
  };
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const totalTickets =
    (metrics.by_status.open || 0) +
    (metrics.by_status.in_progress || 0) +
    (metrics.by_status.waiting || 0) +
    metrics.total_resolved;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Visión general del sistema de soporte"
      />
      <main className="flex-1 p-5 lg:p-6 space-y-5 overflow-y-auto animate-fade-in">

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            title="Abiertos"
            value={metrics.total_open}
            subtitle="Pendientes de atención"
            icon={Ticket}
            variant="green"
          />
          <MetricCard
            title="Urgentes activos"
            value={metrics.total_urgent}
            subtitle="Requieren atención inmediata"
            icon={AlertTriangle}
            variant="red"
          />
          <MetricCard
            title="Resueltos"
            value={metrics.total_resolved}
            subtitle={`de ${totalTickets} tickets en total`}
            icon={CheckCircle2}
            variant="violet"
          />
          <MetricCard
            title="Resolución promedio"
            value={metrics.avg_resolution_hours > 0 ? `${metrics.avg_resolution_hours}h` : "—"}
            subtitle={metrics.avg_resolution_hours > 0 ? "Tiempo medio desde apertura" : "Sin datos de resolución aún"}
            icon={Clock}
            variant="blue"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryChart metrics={metrics} />
          <StatusChart metrics={metrics} />
        </div>

        {/* Recent tickets */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#e2e8f0]">Tickets recientes</p>
            <Link
              href="/admin/tickets"
              className="text-xs text-[#475569] hover:text-[#00e5a0] transition-colors"
            >
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {metrics.recent_tickets.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-[#334155]">No hay tickets todavía.</p>
                <p className="text-xs text-[#1e293b] mt-1">
                  Los tickets creados aparecerán aquí.
                </p>
              </div>
            ) : (
              metrics.recent_tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-[#00e5a0] font-semibold">
                        {ticket.ticket_number}
                      </span>
                      <StatusBadge status={ticket.status} size="sm" />
                      <PriorityBadge priority={ticket.priority} size="sm" />
                    </div>
                    <p className="text-sm text-[#cbd5e1] truncate">{ticket.title}</p>
                    <p className="text-xs text-[#475569] mt-0.5">
                      {ticket.requester_name} · {ticket.area}
                    </p>
                  </div>
                  <p className="text-xs text-[#334155] whitespace-nowrap flex-shrink-0">
                    {formatRelative(ticket.created_at)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
