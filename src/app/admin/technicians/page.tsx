import { Header } from "@/components/layout/Header";
import { createAdminClient } from "@/lib/supabase/server";
import { Technician } from "@/types";
import { TechnicianManager, TechStats } from "@/components/technicians/TechnicianManager";

async function getData(): Promise<{
  technicians: Technician[];
  stats: Record<string, TechStats>;
}> {
  const supabase = await createAdminClient();

  const [techsResult, ticketsResult] = await Promise.all([
    supabase.from("technicians").select("*").order("name"),
    supabase
      .from("tickets")
      .select("technician_id, status, created_at, resolved_at")
      .not("technician_id", "is", null),
  ]);

  const technicians: Technician[] = techsResult.data || [];
  const tickets = ticketsResult.data || [];

  const stats: Record<string, TechStats> = {};

  for (const tech of technicians) {
    const techTickets = tickets.filter((t) => t.technician_id === tech.id);
    const resolved = techTickets.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    );
    const active = techTickets.filter(
      (t) =>
        t.status === "open" ||
        t.status === "in_progress" ||
        t.status === "waiting"
    );

    const resolvedWithTime = resolved.filter((t) => t.resolved_at);
    const avg_hours =
      resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((acc, t) => {
            return (
              acc +
              (new Date(t.resolved_at as string).getTime() -
                new Date(t.created_at).getTime()) /
                3_600_000
            );
          }, 0) / resolvedWithTime.length
        : null;

    stats[tech.id] = {
      total: techTickets.length,
      active: active.length,
      resolved: resolved.length,
      avg_hours: avg_hours !== null ? Math.round(avg_hours * 10) / 10 : null,
    };
  }

  return { technicians, stats };
}

export default async function TechniciansPage() {
  const { technicians, stats } = await getData();
  const activeCount = technicians.filter((t) => t.active).length;

  return (
    <>
      <Header
        title="Técnicos"
        subtitle={`${activeCount} técnico${activeCount !== 1 ? "s" : ""} activo${activeCount !== 1 ? "s" : ""}`}
      />
      <main className="flex-1 p-5 lg:p-6 overflow-y-auto animate-fade-in">
        <TechnicianManager technicians={technicians} stats={stats} />
      </main>
    </>
  );
}
