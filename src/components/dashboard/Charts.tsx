"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DashboardMetrics, CATEGORY_LABELS, STATUS_LABELS } from "@/types";

const STATUS_CHART_COLORS: Record<string, string> = {
  open: "#00e5a0",
  in_progress: "#3b82f6",
  waiting: "#f59e0b",
  resolved: "#8b5cf6",
  closed: "#475569",
};

const CATEGORY_COLORS = [
  "#00e5a0", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6",
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c3054] border border-white/[0.09] rounded-xl px-3.5 py-2.5 shadow-2xl">
      {label && <p className="text-[11px] text-[#475569] mb-1.5 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.value} {p.value === 1 ? "ticket" : "tickets"}
        </p>
      ))}
    </div>
  );
}

interface ChartsProps {
  metrics: DashboardMetrics;
}

export function CategoryChart({ metrics }: ChartsProps) {
  const data = Object.entries(metrics.by_category)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([key, value], i) => ({
      name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] || key,
      value,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  if (data.length === 0) {
    return (
      <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl p-5 flex flex-col items-center justify-center h-[290px]">
        <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">Tickets por categoría</p>
        <p className="text-sm text-[#44597c]">Sin datos todavía</p>
      </div>
    );
  }

  return (
    <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl p-5">
      <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-5">
        Tickets por categoría
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#475569", fontSize: 10, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#475569", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.025)" }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusChart({ metrics }: ChartsProps) {
  const data = Object.entries(metrics.by_status)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS] || key,
      value,
      color: STATUS_CHART_COLORS[key] || "#475569",
    }));

  if (data.length === 0) {
    return (
      <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl p-5 flex flex-col items-center justify-center h-[290px]">
        <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">Distribución por estado</p>
        <p className="text-sm text-[#44597c]">Sin datos todavía</p>
      </div>
    );
  }

  return (
    <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl p-5">
      <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-5">
        Distribución por estado
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={6}
            formatter={(value) => (
              <span style={{ color: "#64748b", fontSize: 11, fontWeight: 500 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
