import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateTicketNumber } from "@/lib/utils";
import { sendTicketCreatedEmail } from "@/lib/email/resend";
import { CreateTicketInput } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("tickets")
      .select(
        `
        *,
        technician:technicians(id, name, email)
      `
      )
      .order("created_at", { ascending: false });

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const limit = searchParams.get("limit");

    if (status && status !== "all") query = query.eq("status", status);
    if (priority && priority !== "all") query = query.eq("priority", priority);
    if (category && category !== "all") query = query.eq("category", category);
    if (limit) query = query.limit(parseInt(limit));

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/tickets]", error);
    return NextResponse.json({ error: "Error al obtener tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTicketInput = await request.json();

    const { requester_name, requester_email, area, priority, category, title, description } = body;

    if (!requester_name || !requester_email || !area || !priority || !category || !title || !description) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const ticket_number = generateTicketNumber();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        ticket_number,
        title,
        description,
        status: "open",
        priority,
        category,
        requester_name,
        requester_email,
        area,
        attachments: body.attachments || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Log initial history entry
    await supabase.from("ticket_history").insert({
      ticket_id: ticket.id,
      changed_by: requester_name,
      field_changed: "status",
      old_value: null,
      new_value: "open",
    });

    // Send confirmation email (non-blocking)
    sendTicketCreatedEmail(ticket).catch((err) =>
      console.error("[Email] Failed to send created email:", err)
    );

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tickets]", error);
    return NextResponse.json({ error: "Error al crear el ticket" }, { status: 500 });
  }
}
