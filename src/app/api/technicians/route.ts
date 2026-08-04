import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAccess } from "@/lib/access";

export async function GET() {
  try {
    const { response } = await requireAccess();
    if (response) return response;

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("technicians")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/technicians]", error);
    return NextResponse.json({ error: "Error al obtener técnicos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAccess("admin");
    if (response) return response;

    const body = await request.json();
    const { name, email, password } = body;
    const validSectors = Array.isArray(body.sectors)
      ? body.sectors.filter((s: string) => ["sistemas", "ecommerce", "mantenimiento"].includes(s))
      : [];
    const sectors: string[] = validSectors.length > 0 ? validSectors : ["sistemas"];
    const role: "admin" | "technician" = body.role === "admin" ? "admin" : "technician";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 12) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 12 caracteres" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Create Supabase Auth user (or link existing one)
    let authUserId: string;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
      // El rol va en app_metadata: el usuario no puede editárselo a sí mismo
      app_metadata: { role },
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // User already exists in Auth — find and link them
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find((u) => u.email === email);
        if (!existing) {
          return NextResponse.json({ error: "No se pudo encontrar el usuario existente" }, { status: 409 });
        }
        authUserId = existing.id;
      } else {
        throw authError;
      }
    } else {
      authUserId = authData.user.id;
    }

    // Insert technician record linked to auth user
    const { data, error } = await supabase
      .from("technicians")
      .insert({ name, email, active: true, sectors, role, auth_user_id: authUserId })
      .select()
      .single();

    if (error) {
      // Rollback: delete auth user if DB insert fails (only if we created it)
      if (authData?.user) await supabase.auth.admin.deleteUser(authData.user.id);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/technicians]", error);
    return NextResponse.json({ error: "Error al crear técnico" }, { status: 500 });
  }
}
