import { NextRequest } from "next/server";

// Rate limit en memoria por instancia. En serverless cada instancia tiene su
// propia memoria, así que es solo un freno anti-ráfaga, no un límite global.
const buckets = new Map<string, Map<string, number[]>>();

export function clientIp(request: NextRequest): string {
  // x-forwarded-for es falsificable por el cliente; Netlify agrega la IP real
  // al final de la cadena, así que se toma el último valor.
  const chain = request.headers.get("x-forwarded-for") || "";
  const parts = chain.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || "unknown";
}

export function rateLimited(
  bucket: string,
  key: string,
  max: number,
  windowMs: number
): boolean {
  let log = buckets.get(bucket);
  if (!log) {
    log = new Map();
    buckets.set(bucket, log);
  }

  const now = Date.now();
  const hits = (log.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    log.set(key, hits);
    return true;
  }
  hits.push(now);
  log.set(key, hits);

  // Poda: descartar solo las IPs sin actividad reciente, no todo el estado
  if (log.size > 1000) {
    for (const [k, v] of log) {
      if (v.every((t) => now - t >= windowMs)) log.delete(k);
    }
  }
  return false;
}
