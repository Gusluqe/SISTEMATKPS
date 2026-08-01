import { createClient, createAdminClient } from "@/lib/supabase/server";
import { TicketSector } from "@/types";

const ALL_SECTORS: TicketSector[] = ["sistemas", "ecommerce", "mantenimiento"];

export interface Access {
  role: "admin" | "technician";
  // Sectores (módulos) que el usuario puede ver. Admin ve todos.
  sectors: TicketSector[];
  email: string;
}

// Resuelve permisos del usuario logueado: el rol y los sectores salen de su
// registro en technicians (editable desde /admin/technicians); si no tiene
// registro, cae al rol de Auth (app_metadata) como hasta ahora.
export async function getAccess(): Promise<Access> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email || "";
  let role =
    (((user?.app_metadata?.role ?? user?.user_metadata?.role) as string) ||
      "admin") === "technician"
      ? ("technician" as const)
      : ("admin" as const);
  let sectors: TicketSector[] = ALL_SECTORS;

  if (user) {
    const admin = await createAdminClient();
    const { data: tech } = await admin
      .from("technicians")
      .select("role, sectors")
      .or(`auth_user_id.eq.${user.id},email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    if (tech) {
      role = tech.role === "admin" ? "admin" : "technician";
      sectors =
        role === "admin"
          ? ALL_SECTORS
          : ((tech.sectors?.length ? tech.sectors : ["sistemas"]) as TicketSector[]);
    }
  }

  return { role, sectors, email };
}
