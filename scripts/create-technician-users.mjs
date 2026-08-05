// Crea los usuarios de Auth para los técnicos que ya tienen email en la tabla
// technicians pero ninguna cuenta de acceso. Se crean SIN contraseña: cada uno
// define la suya desde "Olvidé mi contraseña" en /admin/login. Vincula
// auth_user_id y sincroniza app_metadata.role (el proxy lo usa para enrutar;
// la autorización real vive en getAccess contra la tabla).
// Uso: node scripts/create-technician-users.mjs
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

const { data: techs, error: techsErr } = await supabase
  .from("technicians")
  .select("id, name, email, role")
  .eq("active", true)
  .not("email", "is", null)
  .is("auth_user_id", null);
if (techsErr) throw techsErr;

if (!techs.length) {
  console.log("No hay técnicos con email pendientes de cuenta.");
  process.exit(0);
}

const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
if (usersErr) throw usersErr;

for (const tech of techs) {
  let authUser = usersData.users.find((u) => u.email === tech.email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: tech.email,
      email_confirm: true,
    });
    if (error) {
      console.error(`ERROR creando ${tech.email}:`, error.message);
      continue;
    }
    authUser = data.user;
    console.log(`Creado usuario de Auth: ${tech.email}`);
  } else {
    console.log(`Ya existía usuario de Auth: ${tech.email}`);
  }

  const role = tech.role === "admin" ? "admin" : "technician";
  const { error: metaErr } = await supabase.auth.admin.updateUserById(authUser.id, {
    app_metadata: { role },
  });
  if (metaErr) throw metaErr;

  const { error: linkErr } = await supabase
    .from("technicians")
    .update({ auth_user_id: authUser.id })
    .eq("id", tech.id);
  if (linkErr) throw linkErr;

  console.log(`Vinculado ${tech.name} (${role}) -> ${authUser.id}`);
}
