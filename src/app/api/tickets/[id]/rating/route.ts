import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { ratingToken } from "@/lib/tokens";

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
    <div style="margin:0;font-size:15px;color:#94a3b8;line-height:1.6;">${body}</div>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function validToken(id: string, token: string | null, expiresRaw: string | null): boolean {
  const expiresAt = parseInt(expiresRaw || "");
  if (!token || !Number.isInteger(expiresAt)) return false;
  if (Date.now() > expiresAt) return false;
  const expected = Buffer.from(ratingToken(id, expiresAt));
  const provided = Buffer.from(token);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

// GET: solo muestra la confirmación. Los escáneres de links de Gmail/Outlook
// visitan los GET de los emails; el voto real se registra con el POST del botón.
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("t");
    const expires = searchParams.get("e");
    const score = parseInt(searchParams.get("score") || "");

    if (!validToken(id, token, expires)) {
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
    if (ticket.rating) {
      return page(
        "Ya calificaste este ticket",
        `Tu calificación anterior de <strong style="color:#f59e0b;">${"⭐".repeat(ticket.rating)} (${ticket.rating}/5)</strong> ya quedó registrada. ¡Gracias!`
      );
    }
    if (!["resolved", "closed"].includes(ticket.status)) {
      return page("Todavía no", "El ticket aún no está resuelto; vas a poder calificarlo cuando lo esté.", "#f59e0b");
    }

    const stars = "⭐".repeat(score);
    return page(
      "Confirmá tu calificación",
      `Vas a calificar la atención del ticket <strong style="color:#00e5a0;">${ticket.ticket_number}</strong> con
      <strong style="color:#f59e0b;">${stars} (${score}/5)</strong>.
      <form method="POST" action="/api/tickets/${id}/rating" style="margin:24px 0 0;">
        <input type="hidden" name="t" value="${token}" />
        <input type="hidden" name="e" value="${expires}" />
        <input type="hidden" name="score" value="${score}" />
        <button type="submit" style="background:linear-gradient(135deg,#00e5a0,#2563eb);border:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:700;color:#04101f;cursor:pointer;">Confirmar calificación</button>
      </form>`
    );
  } catch (error) {
    console.error("[GET /api/tickets/[id]/rating]", error);
    return page("Error", "No pudimos procesar tu calificación. Probá de nuevo más tarde.", "#ef4444");
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const form = await request.formData();
    const token = String(form.get("t") || "");
    const expires = String(form.get("e") || "");
    const score = parseInt(String(form.get("score") || ""));

    if (!validToken(id, token, expires)) {
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

    // Un solo voto: el update condicional evita pisar una calificación previa
    const { data: updated } = await supabase
      .from("tickets")
      .update({ rating: score })
      .eq("id", id)
      .is("rating", null)
      .select("id");

    if (!updated?.length) {
      return page(
        "Ya calificaste este ticket",
        `Tu calificación anterior ya quedó registrada, no se puede modificar. ¡Gracias!`
      );
    }

    const stars = "⭐".repeat(score);
    return page(
      "¡Gracias por tu opinión!",
      `Registramos tu calificación de <strong style="color:#f59e0b;">${stars} (${score}/5)</strong> para el ticket <strong style="color:#00e5a0;">${ticket.ticket_number}</strong>.`
    );
  } catch (error) {
    console.error("[POST /api/tickets/[id]/rating]", error);
    return page("Error", "No pudimos registrar tu calificación. Probá de nuevo más tarde.", "#ef4444");
  }
}
