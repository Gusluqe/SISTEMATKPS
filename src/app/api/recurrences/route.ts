import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, TicketCategory } from "@/types";

// Registra la acción tomada sobre una falla recurrente
// (ej: "Se cambió la impresora de Farmacia Catedral"). Requiere sesión (middleware).
export async function POST(request: NextRequest) {
  try {
    const { area, category, action, note, created_by } = await request.json();

    if (!area || !category || !action) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (!(category in CATEGORY_LABELS)) {
      return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("recurrent_actions")
      .insert({
        area,
        category: category as TicketCategory,
        action,
        note: note || null,
        created_by: created_by || "Admin",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/recurrences]", error);
    return NextResponse.json({ error: "Error al registrar la acción" }, { status: 500 });
  }
}
