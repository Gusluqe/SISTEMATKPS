import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardMetrics, TicketCategory, TicketStatus, TicketPriority } from "@/types";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("*, technician:technicians(id, name)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const total_open = tickets.filter((t) => t.status === "open").length;
    const total_urgent = tickets.filter((t) => t.priority === "urgent" && t.status !== "closed").length;
    const total_resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

    // Avg resolution in hours
    const resolved = tickets.filter((t) => t.resolved_at && t.created_at);
    const avg_resolution_hours =
      resolved.length > 0
        ? Math.round(
            resolved.reduce((acc, t) => {
              const ms = new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime();
              return acc + ms / 1000 / 3600;
            }, 0) / resolved.length
          )
        : 0;

    // Group by category
    const by_category = tickets.reduce((acc, t) => {
      acc[t.category as TicketCategory] = (acc[t.category as TicketCategory] || 0) + 1;
      return acc;
    }, {} as Record<TicketCategory, number>);

    // Group by status
    const by_status = tickets.reduce((acc, t) => {
      acc[t.status as TicketStatus] = (acc[t.status as TicketStatus] || 0) + 1;
      return acc;
    }, {} as Record<TicketStatus, number>);

    // Group by priority
    const by_priority = tickets.reduce((acc, t) => {
      acc[t.priority as TicketPriority] = (acc[t.priority as TicketPriority] || 0) + 1;
      return acc;
    }, {} as Record<TicketPriority, number>);

    const metrics: DashboardMetrics = {
      total_open,
      total_urgent,
      total_resolved,
      avg_resolution_hours,
      by_category,
      by_status,
      by_priority,
      recent_tickets: tickets.slice(0, 5),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json({ error: "Error al obtener métricas" }, { status: 500 });
  }
}
