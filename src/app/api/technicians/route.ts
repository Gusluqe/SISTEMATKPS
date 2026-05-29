import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
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
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
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
      user_metadata: { name, role: "technician" },
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
      .insert({ name, email, active: true, auth_user_id: authUserId })
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
