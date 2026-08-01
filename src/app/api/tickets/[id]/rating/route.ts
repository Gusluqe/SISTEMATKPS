import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { ratingToken } from "@/lib/sla";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Página mínima que ve el solicitante al tocar una estrella del email
function page(title: string, body: string, accent = "#00e5a0") {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} · Proteger Salud</title>
</head>
<body style="margin:0;background:#081428;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="background:#13233f;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:48px 40px;max-width:420px;margin:20px;text-align:center;">
    <p style="margin:0 0 6px;font-size:11px;color:#44597c;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Proteger Salud · Soporte Técnico</p>
    <h1 style="margin:0 0 12px;font-size:26px;color:${accent};">${title}</h1>
    <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.6;">${body}</p>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("t");
    const score = parseInt(searchParams.get("score") || "");

    if (token !== ratingToken(id)) {
      return page("Link inválido", "Este enlace de calificación no es válido o expiró.", "#ef4444");
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return page("Calificación inválida", "El puntaje debe ser de 1 a 5 estrellas.", "#ef4444");
    }

    const supabase = await createAdminClient();
    const { data: ticket } = await supabase
      .from("tickets")
      .select("id, ticket_number, status, rating")
      .eq("id", id)
      .single();

    if (!ticket) {
      return page("Ticket no encontrado", "No pudimos encontrar el ticket a calificar.", "#ef4444");
    }
    if (!["resolved", "closed"].includes(ticket.status)) {
      return page("Todavía no", "El ticket aún no está resuelto; vas a poder calificarlo cuando lo esté.", "#f59e0b");
    }

    await supabase.from("tickets").update({ rating: score }).eq("id", id);

    const stars = "⭐".repeat(score);
    return page(
      "¡Gracias por tu opinión!",
      `Registramos tu calificación de <strong style="color:#f59e0b;">${stars} (${score}/5)</strong> para el ticket <strong style="color:#00e5a0;">${ticket.ticket_number}</strong>.${ticket.rating ? "<br/><br/><span style='font-size:13px;color:#64748b;'>Reemplazó tu calificación anterior.</span>" : ""}`
    );
  } catch (error) {
    console.error("[GET /api/tickets/[id]/rating]", error);
    return page("Error", "No pudimos registrar tu calificación. Probá de nuevo más tarde.", "#ef4444");
  }
}
