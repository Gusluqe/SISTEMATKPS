import { Header } from "@/components/layout/Header";
import { TicketTable } from "@/components/tickets/TicketTable";
import { createAdminClient } from "@/lib/supabase/server";
import { getAccess, Access } from "@/lib/access";
import { Ticket, Technician } from "@/types";

async function getData(access: Access): Promise<{ tickets: Ticket[]; technicians: Technician[] }> {
  const supabase = await createAdminClient();

  let ticketsQuery = supabase
    .from("tickets")
    .select("*, technician:technicians(id, name, email)")
    .order("created_at", { ascending: false });

  // Los técnicos solo ven los tickets de sus sectores habilitados
  if (access.role === "technician") {
    ticketsQuery = ticketsQuery.in("sector", access.sectors);
  }

  const [ticketsRes, techsRes] = await Promise.all([
    ticketsQuery,
    supabase.from("technicians").select("*").eq("active", true).order("name"),
  ]);

  return {
    tickets: ticketsRes.data || [],
    technicians: techsRes.data || [],
  };
}

export default async function TicketsPage() {
  const access = await getAccess();
  const { tickets, technicians } = await getData(access);

  return (
    <>
      <Header
        title="Tickets"
        subtitle={`${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} en total`}
      />
      <main className="flex-1 p-6 overflow-y-auto animate-fade-in">
        <TicketTable tickets={tickets} technicians={technicians} />
      </main>
    </>
  );
}
