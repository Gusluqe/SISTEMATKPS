import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CategoryChart, StatusChart, TrendChart, TrendPoint } from "@/components/dashboard/Charts";
import { RecurrenceSection } from "@/components/dashboard/RecurrenceSection";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import { redirect } from "next/navigation";
import { slaState } from "@/lib/sla";
import { detectRecurrences, RecurrentAction } from "@/lib/recurrence";
import {
  Ticket as TicketIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Star,
  Timer,
  MapPin,
  UserX,
  Hourglass,
} from "lucide-react";
import { formatRelative } from "@/lib/utils";
import Link from "next/link";
import {
  Ticket,
  DashboardMetrics,
  TicketCategory,
  TicketStatus,
  TicketPriority,
  TicketSector,
  SECTOR_LABELS,
  PRIORITY_LABELS,
} from "@/types";

type TechStat = {
  id: string;
  name: string;
  total: number;
  active: number;
  resolved: number;
  rate: number;
  avg_hours: number | null;
  avg_rating: number | null;
};

const PERIODS = [
  { key: "7", label: "7 días" },
  { key: "30", label: "30 días" },
  { key: "90", label: "90 días" },
  { key: "all", label: "Todo" },
] as const;

function weekLabel(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function getDashboardData(period: string) {
  const supabase = await createAdminClient();
  const [ticketsRes, techsRes, actionsRes] = await Promise.all([
    supabase.from("tickets").select("*, technician:technicians(id, name)").order("created_at", { ascending: false }).limit(2000),
    supabase.from("technicians").select("*").eq("active", true).order("name"),
    // Si la tabla aún no existe (migración 004 pendiente) queda vacío y no rompe
    supabase.from("recurrent_actions").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const all = (ticketsRes.data || []) as Ticket[];
  const technicians = techsRes.data || [];
  const recurrentActions = (actionsRes.data || []) as RecurrentAction[];

  // Filtro de período (solo afecta métricas y gráficos; alertas y tendencia usan todo)
  const days = period === "all" ? null : parseInt(period);
  const cutoff = days ? Date.now() - days * 86_400_000 : null;
  const t = cutoff ? all.filter((x) => new Date(x.created_at).getTime() >= cutoff) : all;

  const total_open = t.filter((x) => x.status === "open").length;
  const total_urgent = t.filter((x) => x.priority === "urgent" && x.status !== "closed").length;
  const total_resolved = t.filter((x) => x.status === "resolved" || x.status === "closed").length;

  const resolved = t.filter((x) => x.resolved_at && x.created_at);
  const avg_resolution_hours =
    resolved.length > 0
      ? Math.round(resolved.reduce((acc, x) => acc + (new Date(x.resolved_at!).getTime() - new Date(x.created_at).getTime()) / 3_600_000, 0) / resolved.length)
      : 0;

  const by_category = t.reduce((acc, x) => ({ ...acc, [x.category]: (acc[x.category] || 0) + 1 }), {} as Record<TicketCategory, number>);
  const by_status = t.reduce((acc, x) => ({ ...acc, [x.status]: (acc[x.status] || 0) + 1 }), {} as Record<TicketStatus, number>);
  const by_priority = t.reduce((acc, x) => ({ ...acc, [x.priority]: (acc[x.priority] || 0) + 1 }), {} as Record<TicketPriority, number>);

  const metrics: DashboardMetrics = {
    total_open, total_urgent, total_resolved, avg_resolution_hours,
    by_category, by_status, by_priority, recent_tickets: all.slice(0, 6),
  };

  // --- SLA de primera respuesta ---
  // Cumplidos vs. incumplidos (respondidos tarde o aún sin responder y vencidos)
  let slaMet = 0;
  let slaBreached = 0;
  for (const x of t) {
    const s = slaState(x);
    if (s === "met") slaMet++;
    else if (s === "breached") slaBreached++;
  }
  const slaPct = slaMet + slaBreached > 0 ? Math.round((slaMet / (slaMet + slaBreached)) * 100) : null;

  // Vencidos AHORA (sin filtro de período): abiertos sin respuesta fuera de plazo
  const overdue = all
    .filter((x) => x.status === "open" && !x.first_response_at && slaState(x) === "breached")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // --- Alertas operativas (estado actual, sin filtro) ---
  const unassigned = all.filter((x) => x.status === "open" && !x.technician_id).length;
  const staleWaiting = all.filter(
    (x) => x.status === "waiting" && Date.now() - new Date(x.updated_at).getTime() > 3 * 86_400_000
  ).length;

  // --- Satisfacción ---
  const rated = t.filter((x) => x.rating != null);
  const avgRating = rated.length > 0 ? rated.reduce((acc, x) => acc + (x.rating || 0), 0) / rated.length : null;

  // --- Tendencia: últimas 8 semanas (siempre sobre el total) ---
  const trend: TrendPoint[] = [];
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // lunes de esta semana
  for (let i = 7; i >= 0; i--) {
    const start = new Date(monday.getTime() - i * 7 * 86_400_000);
    const end = new Date(start.getTime() + 7 * 86_400_000);
    trend.push({
      week: weekLabel(start),
      creados: all.filter((x) => {
        const c = new Date(x.created_at).getTime();
        return c >= start.getTime() && c < end.getTime();
      }).length,
      resueltos: all.filter((x) => {
        if (!x.resolved_at) return false;
        const r = new Date(x.resolved_at).getTime();
        return r >= start.getTime() && r < end.getTime();
      }).length,
    });
  }

  // --- Ranking por sucursal ---
  const byArea = t.reduce((acc, x) => {
    acc[x.area] = (acc[x.area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const areaRanking = Object.entries(byArea)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // --- Desglose por sector ---
  const sectors = (Object.keys(SECTOR_LABELS) as TicketSector[]).map((s) => {
    const st = t.filter((x) => x.sector === s);
    return {
      sector: s,
      total: st.length,
      activos: st.filter((x) => ["open", "in_progress", "waiting"].includes(x.status)).length,
    };
  });

  // --- Rendimiento por técnico (siempre sobre el total) ---
  const techStats: TechStat[] = technicians.map((tech) => {
    const techTickets = all.filter((x) => x.technician_id === tech.id);
    const res = techTickets.filter((x) => x.status === "resolved" || x.status === "closed");
    const active = techTickets.filter((x) => ["open", "in_progress", "waiting"].includes(x.status));
    const withTime = res.filter((x) => x.resolved_at);
    const avg_hours = withTime.length > 0
      ? Math.round(withTime.reduce((acc, x) => acc + (new Date(x.resolved_at!).getTime() - new Date(x.created_at).getTime()) / 3_600_000, 0) / withTime.length * 10) / 10
      : null;
    const techRated = techTickets.filter((x) => x.rating != null);
    const avg_rating = techRated.length > 0
      ? Math.round((techRated.reduce((acc, x) => acc + (x.rating || 0), 0) / techRated.length) * 10) / 10
      : null;
    return {
      id: tech.id,
      name: tech.name,
      total: techTickets.length,
      active: active.length,
      resolved: res.length,
      rate: techTickets.length > 0 ? Math.round((res.length / techTickets.length) * 100) : 0,
      avg_hours,
      avg_rating,
    };
  }).sort((a, b) => b.resolved - a.resolved);

  // --- Fallas recurrentes (siempre sobre el total, sin filtro de período) ---
  const recurrenceAlerts = detectRecurrences(all, recurrentActions);

  return { metrics, techStats, slaPct, overdue, unassigned, staleWaiting, avgRating, ratedCount: rated.length, trend, areaRanking, sectors, recurrenceAlerts, recurrentActions };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const access = await getAccess();
  if (!access) redirect("/admin/login");
  if (access.role !== "admin") redirect("/admin/tickets");

  const { p } = await searchParams;
  const period = PERIODS.some((x) => x.key === p) ? (p as string) : "all";
  const {
    metrics, techStats, slaPct, overdue, unassigned, staleWaiting,
    avgRating, ratedCount, trend, areaRanking, sectors,
    recurrenceAlerts, recurrentActions,
  } = await getDashboardData(period);

  const totalTickets =
    (metrics.by_status.open || 0) +
    (metrics.by_status.in_progress || 0) +
    (metrics.by_status.waiting || 0) +
    metrics.total_resolved;

  const maxArea = areaRanking.length > 0 ? areaRanking[0][1] : 1;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Visión general del sistema de soporte"
      />
      <main className="flex-1 p-5 lg:p-6 space-y-5 overflow-y-auto animate-fade-in">

        {/* Period filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#475569] mr-1">Período:</span>
          {PERIODS.map(({ key, label }) => (
            <Link
              key={key}
              href={key === "all" ? "/admin/dashboard" : `/admin/dashboard?p=${key}`}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                period === key
                  ? "bg-[#00e5a0]/10 border-[#00e5a0]/40 text-[#00e5a0]"
                  : "bg-[#13233f] border-white/[0.07] text-[#64748b] hover:border-white/20"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* SLA overdue alert */}
        {overdue.length > 0 && (
          <div className="bg-red-500/[0.06] border border-red-500/25 rounded-2xl">
            <div className="px-5 py-3.5 border-b border-red-500/15 flex items-center gap-2">
              <Timer className="w-4 h-4 text-red-400" />
              <p className="text-sm font-semibold text-red-400">
                SLA vencido — {overdue.length} ticket{overdue.length !== 1 ? "s" : ""} sin respuesta fuera de plazo
              </p>
            </div>
            <div className="divide-y divide-red-500/10">
              {overdue.slice(0, 5).map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-red-500/[0.04] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-red-400 font-semibold">
                        {ticket.ticket_number}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/25 text-red-400 font-semibold">
                        {PRIORITY_LABELS[ticket.priority]}
                      </span>
                    </div>
                    <p className="text-sm text-[#cbd5e1] truncate">{ticket.title}</p>
                  </div>
                  <p className="text-xs text-[#64748b] whitespace-nowrap flex-shrink-0">
                    {formatRelative(ticket.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Fallas recurrentes */}
        <RecurrenceSection alerts={recurrenceAlerts} history={recurrentActions} />

        {/* Operational alert chips */}
        {(unassigned > 0 || staleWaiting > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            {unassigned > 0 && (
              <Link
                href="/admin/tickets?status=open"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs font-medium text-amber-400 hover:bg-amber-500/12 transition-colors"
              >
                <UserX className="w-3.5 h-3.5" />
                {unassigned} abierto{unassigned !== 1 ? "s" : ""} sin asignar
              </Link>
            )}
            {staleWaiting > 0 && (
              <Link
                href="/admin/tickets?status=waiting"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs font-medium text-amber-400 hover:bg-amber-500/12 transition-colors"
              >
                <Hourglass className="w-3.5 h-3.5" />
                {staleWaiting} en espera hace +3 días
              </Link>
            )}
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard
            title="Abiertos"
            value={metrics.total_open}
            subtitle="Pendientes de atención"
            icon={TicketIcon}
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
          <MetricCard
            title="SLA de respuesta"
            value={slaPct !== null ? `${slaPct}%` : "—"}
            subtitle={
              overdue.length > 0
                ? `${overdue.length} vencido${overdue.length !== 1 ? "s" : ""} ahora`
                : slaPct !== null
                ? "Respondidos dentro del plazo"
                : "Sin datos aún"
            }
            icon={Timer}
            variant={overdue.length > 0 ? "red" : "amber"}
          />
          <MetricCard
            title="Satisfacción"
            value={avgRating !== null ? `${avgRating.toFixed(1)} ★` : "—"}
            subtitle={
              avgRating !== null
                ? `${ratedCount} calificación${ratedCount !== 1 ? "es" : ""}`
                : "Aún sin calificaciones"
            }
            icon={Star}
            variant="amber"
          />
        </div>

        {/* Sector breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sectors.map(({ sector, total, activos }) => (
            <Link
              key={sector}
              href={`/admin/tickets?sector=${sector}`}
              className="bg-[#13233f] border border-white/[0.07] rounded-2xl px-5 py-4 hover:border-white/15 transition-colors"
            >
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                {SECTOR_LABELS[sector]}
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#f8fafc] leading-none">{activos}</p>
                  <p className="text-[11px] text-[#475569] mt-1">activos</p>
                </div>
                <p className="text-xs text-[#44597c]">{total} en el período</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CategoryChart metrics={metrics} />
          <StatusChart metrics={metrics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendChart data={trend} />

          {/* Sucursal ranking */}
          <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-4 h-4 text-[#475569]" />
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                Tickets por sucursal
              </p>
            </div>
            {areaRanking.length === 0 ? (
              <p className="text-sm text-[#44597c] text-center py-10">Sin datos todavía</p>
            ) : (
              <div className="space-y-3">
                {areaRanking.map(([area, count]) => (
                  <div key={area}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-[#94a3b8] truncate">{area}</span>
                      <span className="text-xs font-semibold text-[#e2e8f0] ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#1c3054] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#3b82f6] to-[#00e5a0] rounded-full"
                        style={{ width: `${Math.max(6, (count / maxArea) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#e2e8f0]">{tech.name}</p>
                        {tech.avg_rating !== null && (
                          <span className="text-[11px] font-semibold text-amber-400">
                            ★ {tech.avg_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
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
