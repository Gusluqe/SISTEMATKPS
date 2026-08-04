import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAccess } from "@/lib/access";
import { CATEGORY_LABELS, TicketCategory, SUCURSALES } from "@/types";

const recurrenceSchema = z.object({
  area: z.string().refine((a) => SUCURSALES.includes(a), "Sucursal inválida"),
  category: z.enum(Object.keys(CATEGORY_LABELS) as [string, ...string[]]),
  action: z.string().trim().min(3).max(300),
  note: z.string().trim().max(2000).optional().nullable(),
});

// Registra la acción tomada sobre una falla recurrente
// (ej: "Se cambió la impresora de Farmacia Catedral"). Solo admin.
export async function POST(request: NextRequest) {
  try {
    const { access, response } = await requireAccess("admin");
    if (response) return response;

    const parsed = recurrenceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const { area, category, action, note } = parsed.data;

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("recurrent_actions")
      .insert({
        area,
        category: category as TicketCategory,
        action,
        note: note || null,
        // La identidad sale de la sesión, no del body
        created_by: access.name,
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
