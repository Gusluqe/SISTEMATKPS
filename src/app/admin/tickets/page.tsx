import { Header } from "@/components/layout/Header";
import { TicketTable } from "@/components/tickets/TicketTable";
import { createAdminClient } from "@/lib/supabase/server";
import { Ticket } from "@/types";

async function getTickets(): Promise<Ticket[]> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*, technician:technicians(id, name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export default async function TicketsPage() {
  const tickets = await getTickets();

  return (
    <>
      <Header
        title="Tickets"
        subtitle={`${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} en total`}
      />
      <main className="flex-1 p-6 overflow-y-auto animate-fade-in">
        <TicketTable tickets={tickets} />
      </main>
    </>
  );
}
