import { createHmac } from "crypto";

// Tokens firmados — SOLO servidor (usa crypto de Node).

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "https://tkps.netlify.app";

// Firmados con la service key: no requieren env vars nuevas y no son
// adivinables sin acceso al servidor.
function hmac(payload: string): string {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
    .update(payload)
    .digest("hex");
}

// Token del link de calificación que viaja en el email de "resuelto".
// Incluye vencimiento firmado: el link expira a los 30 días.
export function ratingToken(ticketId: string, expiresAt: number): string {
  return hmac(`rating:${ticketId}:${expiresAt}`).slice(0, 24);
}

export function ratingUrl(ticketId: string): string {
  const expiresAt = Date.now() + 30 * 86_400_000;
  return `${SITE_URL}/api/tickets/${ticketId}/rating?t=${ratingToken(ticketId, expiresAt)}&e=${expiresAt}`;
}

// Clave que protege el endpoint de cron. Si no hay CRON_SECRET propio se
// deriva de la service key (la scheduled function la recalcula igual).
export function cronKey(): string {
  return process.env.CRON_SECRET || hmac("cron-proteger-salud").slice(0, 32);
}
