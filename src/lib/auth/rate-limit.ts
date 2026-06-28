/**
 * Rate limiting básico server-side para el login (throttle por usuario/IP).
 *
 * Implementación en memoria con ventana deslizante. Suficiente para la demo y
 * para una sola instancia; en producción multi-instancia se reemplaza por un
 * store compartido (Upstash/Redis) sin cambiar la firma de `checkRateLimit`.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * @param key      identificador (p. ej. `login:<usuario>` o `login:<ip>`)
 * @param max      intentos permitidos por ventana
 * @param windowMs tamaño de la ventana
 */
export function checkRateLimit(
  key: string,
  max = 5,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: max - bucket.count,
    retryAfterSec: 0,
  };
}

/** Limpia el bucket de una clave (tras un login exitoso). */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}
