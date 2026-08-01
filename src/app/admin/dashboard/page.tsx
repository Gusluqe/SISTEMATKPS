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
  Users,
} from "lucide-react";
import { formatRelative } from "@/lib/utils";
import Link from "next/link";
import { DashboardMetrics, TicketCategory, TicketStatus, TicketPriority } from "@/types";

type TechStat = {
  id: string;
  name: string;
  total: number;
  active: number;
  resolved: number;
  rate: number;
  avg_hours: number | null;
};

async function getDashboardData() {
  const supabase = await createAdminClient();
  const [ticketsRes, techsRes] = await Promise.all([
    supabase.from("tickets").select("*, technician:technicians(id, name)").order("created_at", { ascending: false }),
    supabase.from("technicians").select("*").eq("active", true).order("name"),
  ]);

  const t = ticketsRes.data || [];
  const technicians = techsRes.data || [];

  const total_open = t.filter((x) => x.status === "open").length;
  const total_urgent = t.filter((x) => x.priority === "urgent" && x.status !== "closed").length;
  const total_resolved = t.filter((x) => x.status === "resolved" || x.status === "closed").length;

  const resolved = t.filter((x) => x.resolved_at && x.created_at);
  const avg_resolution_hours =
    resolved.length > 0
      ? Math.round(resolved.reduce((acc, x) => acc + (new Date(x.resolved_at).getTime() - new Date(x.created_at).getTime()) / 3_600_000, 0) / resolved.length)
      : 0;

  const by_category = t.reduce((acc, x) => ({ ...acc, [x.category]: (acc[x.category] || 0) + 1 }), {} as Record<TicketCategory, number>);
  const by_status = t.reduce((acc, x) => ({ ...acc, [x.status]: (acc[x.status] || 0) + 1 }), {} as Record<TicketStatus, number>);
  const by_priority = t.reduce((acc, x) => ({ ...acc, [x.priority]: (acc[x.priority] || 0) + 1 }), {} as Record<TicketPriority, number>);

  const metrics: DashboardMetrics = {
    total_open, total_urgent, total_resolved, avg_resolution_hours,
    by_category, by_status, by_priority, recent_tickets: t.slice(0, 6),
  };

  const techStats: TechStat[] = technicians.map((tech) => {
    const techTickets = t.filter((x) => x.technician_id === tech.id);
    const res = techTickets.filter((x) => x.status === "resolved" || x.status === "closed");
    const active = techTickets.filter((x) => ["open", "in_progress", "waiting"].includes(x.status));
    const withTime = res.filter((x) => x.resolved_at);
    const avg_hours = withTime.length > 0
      ? Math.round(withTime.reduce((acc, x) => acc + (new Date(x.resolved_at).getTime() - new Date(x.created_at).getTime()) / 3_600_000, 0) / withTime.length * 10) / 10
      : null;
    return {
      id: tech.id,
      name: tech.name,
      total: techTickets.length,
      active: active.length,
      resolved: res.length,
      rate: techTickets.length > 0 ? Math.round((res.length / techTickets.length) * 100) : 0,
      avg_hours,
    };
  }).sort((a, b) => b.resolved - a.resolved);

  return { metrics, techStats };
}

export default async function DashboardPage() {
  const { metrics, techStats } = await getDashboardData();
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

        {/* Technician performance */}
        {techStats.length > 0 && (
          <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#475569]" />
              <p className="text-sm font-semibold text-[#e2e8f0]">Rendimiento por técnico</p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {techStats.map((tech, i) => (
                <div key={tech.id} className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br ${["from-[#3b82f6] to-[#8b5cf6]","from-[#00e5a0] to-[#3b82f6]","from-[#f59e0b] to-[#ef4444]","from-[#8b5cf6] to-[#ec4899]","from-[#14b8a6] to-[#3b82f6]"][i % 5]}`}>
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#e2e8f0]">{tech.name}</p>
                      <p className="text-xs text-[#475569]">{tech.total} tickets asignados</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-[#00e5a0]">{tech.rate}%</p>
                      <p className="text-[10px] text-[#44597c]">eficacia</p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-2.5">
                    {[
                      { label: "Activos", value: tech.active, color: "text-blue-400" },
                      { label: "Resueltos", value: tech.resolved, color: "text-[#00e5a0]" },
                      { label: "Tiempo prom.", value: tech.avg_hours !== null ? (tech.avg_hours < 1 ? `${Math.round(tech.avg_hours * 60)}m` : `${tech.avg_hours}h`) : "—", color: "text-[#94a3b8]" },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#1c3054] rounded-xl px-2 py-2 text-center">
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-[#475569] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Efficacy bar */}
                  {tech.total > 0 && (
                    <div>
                      <div className="h-1.5 bg-[#1c3054] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${tech.rate}%`,
                            background: tech.rate >= 80 ? "linear-gradient(90deg,#00e5a0,#2563eb)" : tech.rate >= 50 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {tech.total === 0 && (
                    <p className="text-xs text-[#44597c] text-center py-1">Sin tickets asignados aún</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent tickets */}
        <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl">
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
                <p className="text-sm text-[#44597c]">No hay tickets todavía.</p>
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
                  <p className="text-xs text-[#44597c] whitespace-nowrap flex-shrink-0">
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
