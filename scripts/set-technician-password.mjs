// Setea la contraseña de las cuentas de Auth de los técnicos indicados.
// Necesario porque el email de recuperación de Supabase (plan free) solo
// entrega a miembros del equipo del proyecto, así que "Olvidé mi contraseña"
// no les llega a los técnicos.
// Uso: node scripts/set-technician-password.mjs <password> [email1 email2 ...]
// Sin emails, aplica a todos los técnicos activos con cuenta vinculada
// que NO sean admin.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [password, ...emails] = process.argv.slice(2);
if (!password || password.length < 8) {
  console.error("Uso: node scripts/set-technician-password.mjs <password de 8+ caracteres> [emails...]");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let query = supabase
  .from("technicians")
  .select("name, email, auth_user_id")
  .eq("active", true)
  .not("auth_user_id", "is", null);

query = emails.length ? query.in("email", emails) : query.neq("role", "admin");

const { data: techs, error } = await query;
if (error) throw error;
if (!techs.length) {
  console.log("Ningún técnico coincide (¿tienen cuenta vinculada?).");
  process.exit(0);
}

for (const t of techs) {
  const { error: err } = await supabase.auth.admin.updateUserById(t.auth_user_id, { password });
  console.log(err ? `ERROR ${t.email}: ${err.message}` : `Clave seteada para ${t.name} (${t.email})`);
}
