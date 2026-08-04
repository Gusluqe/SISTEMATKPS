// Vincula el usuario de Auth del admin (gustavoluque90@gmail.com) con su ficha
// en technicians (gusprotegersalud@gmail.com) vía auth_user_id, para que el rol
// y los sectores salgan de la tabla en lugar del fallback de app_metadata.
// Uso: node scripts/link-admin.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const AUTH_EMAIL = "gustavoluque90@gmail.com";
const TECH_EMAIL = "gusprotegersalud@gmail.com";

const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
if (usersErr) throw usersErr;

const authUser = usersData.users.find((u) => u.email === AUTH_EMAIL);
if (!authUser) {
  console.error(`No existe usuario de Auth con email ${AUTH_EMAIL}`);
  process.exit(1);
}

const { data: tech, error: techErr } = await supabase
  .from("technicians")
  .update({ auth_user_id: authUser.id })
  .eq("email", TECH_EMAIL)
  .select("id, name, email, role, sectors, auth_user_id")
  .single();
if (techErr) throw techErr;

// Sincronizar el rol en app_metadata para que el proxy enrute correctamente
// (la autorización real igual se resuelve contra la tabla en getAccess)
const { error: metaErr } = await supabase.auth.admin.updateUserById(authUser.id, {
  app_metadata: { role: tech.role === "admin" ? "admin" : "technician" },
});
if (metaErr) throw metaErr;

console.log("Vinculado:", JSON.stringify(tech, null, 2));
