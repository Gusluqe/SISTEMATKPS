import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { clientIp, rateLimited } from "@/lib/ratelimit";

// La extensión sale de este mapa (nunca del nombre de archivo del cliente)
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function POST(request: NextRequest) {
  try {
    // 10 archivos por IP cada 10 minutos (endpoint público, anti-abuso)
    if (rateLimited("attachments", clientIp(request), 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiadas subidas seguidas. Esperá unos minutos." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "El archivo no puede superar 5 MB" }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = await createAdminClient();
    const { error } = await supabase.storage
      .from("ticket-attachments")
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from("ticket-attachments").getPublicUrl(filename);
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/attachments]", error);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}
