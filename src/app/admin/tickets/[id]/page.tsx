import { Header } from "@/components/layout/Header";
import { TicketDetail } from "@/components/tickets/TicketDetail";
import { createAdminClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Ticket, Technician } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTicket(id: string): Promise<Ticket | null> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(`
      *,
      technician:technicians(id, name, email, avatar_url),
      comments:ticket_comments(*),
      history:ticket_history(*)
    `)
    .order("created_at", { ascending: true, referencedTable: "ticket_comments" })
    .order("created_at", { ascending: true, referencedTable: "ticket_history" })
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

async function getTechnicians(): Promise<Technician[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("technicians")
    .select("*")
    .eq("active", true)
    .order("name");
  return data || [];
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params;

  const access = await getAccess();
  if (!access) redirect("/admin/login");

  const changedBy = access.name;

  const [ticket, technicians] = await Promise.all([
    getTicket(id),
    getTechnicians(),
  ]);

  if (!ticket) notFound();

  // Un técnico no puede abrir tickets de sectores que no tiene habilitados
  if (access.role === "technician" && !access.sectors.includes(ticket.sector)) {
    redirect("/admin/tickets");
  }

  return (
    <>
      <Header
        title={ticket.ticket_number}
        subtitle={ticket.title}
      />
      <main className="flex-1 p-5 lg:p-6 overflow-y-auto">
        <div className="mb-5">
          <Link
            href="/admin/tickets"
            className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#94a3b8] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Tickets
          </Link>
        </div>
        <TicketDetail ticket={ticket} technicians={technicians} changedBy={changedBy} />
      </main>
    </>
  );
}
