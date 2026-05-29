"use client";

import { cn } from "@/lib/utils";
import {
  TicketStatus,
  TicketPriority,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/types";
import {
  STATUS_COLORS,
  PRIORITY_COLORS,
  PRIORITY_DOT,
} from "@/lib/utils";

interface StatusBadgeProps {
  status: TicketStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        STATUS_COLORS[status],
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, size = "md" }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        PRIORITY_COLORS[priority],
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_DOT[priority])}
      />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
