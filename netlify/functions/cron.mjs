// Scheduled function de Netlify: dispara las tareas periódicas de la app
// (recordatorios de SLA vencido y auto-cierre de tickets resueltos).
// La clave viaja por header (no queda en logs de acceso) y sale de CRON_SECRET
// o, si no está, se deriva de la service key igual que en src/lib/sla.ts.
import { createHmac } from "node:crypto";

export default async () => {
  const key =
    process.env.CRON_SECRET ||
    createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
      .update("cron-proteger-salud")
      .digest("hex")
      .slice(0, 32);

  const site = process.env.URL || "https://tkps.netlify.app";
  const res = await fetch(`${site}/api/cron`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = await res.json().catch(() => ({}));
  console.log("[cron]", res.status, JSON.stringify(json));
};

export const config = {
  schedule: "*/30 * * * *",
};
