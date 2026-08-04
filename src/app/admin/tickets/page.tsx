import { Header } from "@/components/layout/Header";
import { TicketTable } from "@/components/tickets/TicketTable";
import { createAdminClient } from "@/lib/supabase/server";
import { getAccess, Access } from "@/lib/access";
import { redirect } from "next/navigation";
import { Ticket, Technician } from "@/types";

async function getData(access: Access): Promise<{ tickets: Ticket[]; technicians: Technician[] }> {
  const supabase = await createAdminClient();

  // PostgREST corta en ~1000 filas sin avisar: se pagina explícitamente
  // para que los tickets viejos no desaparezcan del listado.
  const CHUNK = 1000;
  const MAX_PAGES = 10;
  const tickets: Ticket[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    let query = supabase
      .from("tickets")
      .select("*, technician:technicians(id, name, email)")
      .order("created_at", { ascending: false })
      .range(page * CHUNK, page * CHUNK + CHUNK - 1);

    // Los técnicos solo ven los tickets de sus sectores habilitados
    if (access.role === "technician") {
      query = query.in("sector", access.sectors);
    }

    const { data } = await query;
    tickets.push(...(data || []));
    if (!data || data.length < CHUNK) break;
  }

  const { data: technicians } = await supabase
    .from("technicians")
    .select("*")
    .eq("active", true)
    .order("name");

  return { tickets, technicians: technicians || [] };
}

export default async function TicketsPage() {
  const access = await getAccess();
  if (!access) redirect("/admin/login");
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
