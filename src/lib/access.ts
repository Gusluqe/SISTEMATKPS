import { cache } from "react";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { TicketSector } from "@/types";

const ALL_SECTORS: TicketSector[] = ["sistemas", "ecommerce", "mantenimiento"];

export interface Access {
  role: "admin" | "technician";
  // Sectores (módulos) que el usuario puede ver. Admin ve todos.
  sectors: TicketSector[];
  email: string;
  name: string;
}

// Resuelve permisos del usuario logueado. La ficha en technicians (editable
// desde /admin/technicians) es la fuente de verdad; app_metadata de Auth queda
// como fallback. Sin sesión devuelve null; sin ficha ni metadata el usuario
// queda como técnico sin sectores — nunca admin por omisión.
// cache(): memoiza por request — layout y página comparten el resultado en
// lugar de repetir las llamadas de auth a Supabase.
export const getAccess = cache(async (): Promise<Access | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const email = user.email || "";
  const metaRole = (user.app_metadata?.role ?? user.user_metadata?.role) as
    | string
    | undefined;
  let role: "admin" | "technician" = metaRole === "admin" ? "admin" : "technician";
  let sectors: TicketSector[] = role === "admin" ? ALL_SECTORS : [];
  let name = (user.user_metadata?.name as string) || email;

  const admin = await createAdminClient();
  let { data: tech } = await admin
    .from("technicians")
    .select("name, role, sectors")
    .eq("auth_user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!tech && email) {
    ({ data: tech } = await admin
      .from("technicians")
      .select("name, role, sectors")
      .eq("email", email)
      .limit(1)
      .maybeSingle());
  }

  if (tech) {
    role = tech.role === "admin" ? "admin" : "technician";
    sectors =
      role === "admin"
        ? ALL_SECTORS
        : ((tech.sectors || []) as TicketSector[]);
    name = tech.name || name;
  }

  return { role, sectors, email, name };
});

type Granted = { access: Access; response: null };
type Denied = { access: null; response: NextResponse };

// Guardia para route handlers: 401 sin sesión, 403 si se exige admin y no lo es.
// El proxy es solo un chequeo optimista de UX; la autorización vive acá.
export async function requireAccess(minRole?: "admin"): Promise<Granted | Denied> {
  const access = await getAccess();
  if (!access) {
    return {
      access: null,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }
  if (minRole === "admin" && access.role !== "admin") {
    return {
      access: null,
      response: NextResponse.json(
        { error: "Requiere permisos de administrador" },
        { status: 403 }
      ),
    };
  }
  return { access, response: null };
}

export function canAccessSector(access: Access, sector: string): boolean {
  return access.role === "admin" || access.sectors.includes(sector as TicketSector);
}
