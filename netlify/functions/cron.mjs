// Scheduled function de Netlify: dispara las tareas periódicas de la app
// (recordatorios de SLA vencido y auto-cierre de tickets resueltos).
// La clave se deriva de la service key, igual que en src/lib/sla.ts.
import { createHmac } from "node:crypto";

export default async () => {
  const key = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    .update("cron-proteger-salud")
    .digest("hex")
    .slice(0, 32);

  const site = process.env.URL || "https://tkps.netlify.app";
  const res = await fetch(`${site}/api/cron?key=${key}`);
  const json = await res.json().catch(() => ({}));
  console.log("[cron]", res.status, JSON.stringify(json));
};

export const config = {
  schedule: "*/30 * * * *",
};
