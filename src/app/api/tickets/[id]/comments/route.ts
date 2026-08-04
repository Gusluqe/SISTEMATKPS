import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAccess, canAccessSector } from "@/lib/access";
import { sendNewCommentEmail, sendNewCommentToTechEmail } from "@/lib/email/mailer";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { access, response } = await requireAccess();
    if (response) return response;

    const { id: ticket_id } = await params;
    const { content, is_internal } = await request.json();

    // La identidad del autor sale de la sesión, nunca del body
    const author_name = access.name;
    const author_email = access.email;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }
    if (content.length > 5000) {
      return NextResponse.json(
        { error: "El comentario es demasiado largo" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    const { data: ticket } = await supabase
      .from("tickets")
      .select("*, technician:technicians(id, name, email)")
      .eq("id", ticket_id)
      .single();

    if (!ticket || !canAccessSector(access, ticket.sector)) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id,
        author_name,
        author_email: author_email || "",
        content,
        is_internal: Boolean(is_internal),
      })
      .select()
      .single();

    if (error) throw error;

    // Un comentario público que no es del solicitante cuenta como primera
    // respuesta del equipo (SLA)
    const isFromRequester =
      !!ticket &&
      !!author_email &&
      author_email.toLowerCase() === (ticket.requester_email || "").toLowerCase();

    const tickerUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (ticket && !is_internal && !isFromRequester && !ticket.first_response_at) {
      tickerUpdate.first_response_at = new Date().toISOString();
    }
    await supabase.from("tickets").update(tickerUpdate).eq("id", ticket_id);

    if (ticket && !is_internal) {
      if (isFromRequester) {
        // El solicitante respondió → avisar al técnico asignado (o al equipo del sector)
        const { data: team } = await supabase
          .from("technicians")
          .select("email")
          .eq("active", true)
          .contains("sectors", [ticket.sector]);
        const fallback = (team || []).map((t) => t.email).filter(Boolean);
        await sendNewCommentToTechEmail(ticket, content, author_name, fallback).catch((err) =>
          console.error("[Email] Failed to send comment-to-tech email:", err)
        );
      } else {
        // El equipo comentó → avisar al solicitante
        await sendNewCommentEmail(ticket, content, author_name).catch((err) =>
          console.error("[Email] Failed to send comment email:", err)
        );
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tickets/[id]/comments]", error);
    return NextResponse.json(
      { error: "Error al agregar comentario" },
      { status: 500 }
    );
  }
}
