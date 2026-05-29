import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createAdminClient();

    const { password, ...rest } = body;

    // Update technicians table fields
    const allowed = ["name", "email", "active"];
    const dbUpdate = Object.fromEntries(
      Object.entries(rest).filter(([key]) => allowed.includes(key))
    );

    let updated;
    if (Object.keys(dbUpdate).length > 0) {
      const { data, error } = await supabase
        .from("technicians")
        .update(dbUpdate)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      updated = data;
    } else {
      const { data } = await supabase
        .from("technicians")
        .select()
        .eq("id", id)
        .single();
      updated = data;
    }

    // Update Supabase Auth user if password or email changed
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    if (updated?.auth_user_id) {
      // Auth user already exists — update password/email if provided
      if (password || dbUpdate.email) {
        const authUpdate: Record<string, string> = {};
        if (password) authUpdate.password = password;
        if (dbUpdate.email) authUpdate.email = dbUpdate.email as string;
        await supabase.auth.admin.updateUserById(updated.auth_user_id, authUpdate);
      }
    } else if (password) {
      // No auth user yet — create one and link it
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: updated.email,
        password,
        email_confirm: true,
        user_metadata: { name: updated.name, role: "technician" },
      });
      if (authError) {
        if (authError.message.includes("already been registered")) {
          return NextResponse.json(
            { error: "Ya existe un usuario Auth con ese email. Contactá al administrador." },
            { status: 409 }
          );
        }
        throw authError;
      }
      await supabase
        .from("technicians")
        .update({ auth_user_id: authData.user.id })
        .eq("id", id);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/technicians/[id]]", error);
    return NextResponse.json({ error: "Error al actualizar técnico" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("technicians")
      .update({ active: false })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/technicians/[id]]", error);
    return NextResponse.json({ error: "Error al desactivar técnico" }, { status: 500 });
  }
}
