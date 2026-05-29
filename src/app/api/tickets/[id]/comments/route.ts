import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendNewCommentEmail } from "@/lib/email/resend";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id: ticket_id } = await params;
    const { author_name, author_email, content, is_internal } =
      await request.json();

    if (!author_name || !content) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

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

    await supabase
      .from("tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ticket_id);

    // Notify requester when comment is public
    if (!is_internal) {
      const { data: ticket } = await supabase
        .from("tickets")
        .select("*, technician:technicians(id, name, email)")
        .eq("id", ticket_id)
        .single();

      if (ticket) {
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
