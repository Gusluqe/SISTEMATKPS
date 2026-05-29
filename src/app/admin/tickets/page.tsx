import { Header } from "@/components/layout/Header";
import { TicketTable } from "@/components/tickets/TicketTable";
import { createAdminClient } from "@/lib/supabase/server";
import { Ticket, Technician } from "@/types";

async function getData(): Promise<{ tickets: Ticket[]; technicians: Technician[] }> {
  const supabase = await createAdminClient();
  const [ticketsRes, techsRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("*, technician:technicians(id, name, email)")
      .order("created_at", { ascending: false }),
    supabase.from("technicians").select("*").eq("active", true).order("name"),
  ]);

  return {
    tickets: ticketsRes.data || [],
    technicians: techsRes.data || [],
  };
}

export default async function TicketsPage() {
  const { tickets, technicians } = await getData();

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
