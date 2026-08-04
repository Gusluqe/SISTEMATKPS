import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAccess } from "@/lib/access";
import { slaDeadline } from "@/lib/sla";
import { Ticket } from "@/types";

// Contadores para la campanita del header: tickets con SLA vencido y sin
// asignar, acotados a los sectores del usuario.
export async function GET() {
  try {
    const { access, response } = await requireAccess();
    if (response) return response;

    const supabase = await createAdminClient();
    let query = supabase
      .from("tickets")
      .select("id, created_at, priority, sector, technician_id, status, first_response_at")
      .in("status", ["open", "in_progress", "waiting"]);

    if (access.role !== "admin") {
      query = query.in("sector", access.sectors);
    }

    const { data, error } = await query;
    if (error) throw error;

    const now = Date.now();
    const tickets = (data || []) as Pick<
      Ticket,
      "created_at" | "priority" | "technician_id" | "status" | "first_response_at"
    >[];

    const overdue = tickets.filter(
      (t) => t.status === "open" && !t.first_response_at && now > slaDeadline(t).getTime()
    ).length;
    const unassigned = tickets.filter((t) => !t.technician_id && t.status === "open").length;

    return NextResponse.json({ overdue, unassigned });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}
