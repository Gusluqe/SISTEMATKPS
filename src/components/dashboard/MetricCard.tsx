import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "green" | "blue" | "amber" | "red" | "violet" | "slate";
  trend?: { value: number; label: string };
}

const variantStyles = {
  green:  { icon: "text-[#00e5a0]", bg: "bg-[#00e5a0]/8 border-[#00e5a0]/12", dot: "bg-[#00e5a0]" },
  blue:   { icon: "text-[#3b82f6]", bg: "bg-[#3b82f6]/8 border-[#3b82f6]/12", dot: "bg-[#3b82f6]" },
  amber:  { icon: "text-[#f59e0b]", bg: "bg-[#f59e0b]/8 border-[#f59e0b]/12", dot: "bg-[#f59e0b]" },
  red:    { icon: "text-[#ef4444]", bg: "bg-[#ef4444]/8 border-[#ef4444]/12", dot: "bg-[#ef4444] animate-pulse" },
  violet: { icon: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/8 border-[#8b5cf6]/12", dot: "bg-[#8b5cf6]" },
  slate:  { icon: "text-[#64748b]", bg: "bg-[#64748b]/8 border-[#64748b]/10", dot: "bg-[#64748b]" },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "slate",
  trend,
}: MetricCardProps) {
  const s = variantStyles[variant];
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  return (
    <div className="bg-[#13233f] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3 hover:border-white/[0.10] transition-colors duration-200">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
          <p className="text-xs font-medium text-[#64748b]">{title}</p>
        </div>
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${s.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${s.icon}`} />
        </div>
      </div>

      {/* Value */}
      <div>
        <p className="text-2xl font-bold text-[#f8fafc] tabular-nums leading-none">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-[#475569] mt-1.5 leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Trend */}
      {trend && TrendIcon && (
        <div className="pt-2 border-t border-white/[0.05] flex items-center gap-1.5">
          <TrendIcon
            className={cn(
              "w-3 h-3",
              trend.value > 0
                ? "text-[#00e5a0]"
                : trend.value < 0
                ? "text-red-400"
                : "text-[#475569]"
            )}
          />
          <span
            className={cn(
              "text-[11px] font-medium",
              trend.value > 0
                ? "text-[#00e5a0]"
                : trend.value < 0
                ? "text-red-400"
                : "text-[#475569]"
            )}
          >
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-[11px] text-[#44597c]">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
