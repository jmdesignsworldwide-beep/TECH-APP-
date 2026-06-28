import type { AppRole } from "@/lib/types";

export type AccessStatus = "ok" | "expiring" | "expired" | "revoked";

const SOON_DAYS = 3;
const DAY = 86_400_000;

export interface AccessInfo {
  status: AccessStatus;
  daysLeft: number | null; // null = sin vencimiento
}

/**
 * Calcula el estado de acceso de una cuenta. SIEMPRE en el servidor: compara
 * contra la hora del servidor y el valor en BD, no contra el reloj del navegador.
 * El owner nunca expira.
 */
export function computeAccess(
  role: AppRole,
  isActive: boolean,
  expiresAt: string | null,
  now: number = Date.now(),
): AccessInfo {
  if (role === "owner") return { status: "ok", daysLeft: null };
  if (!isActive) return { status: "revoked", daysLeft: null };
  if (!expiresAt) return { status: "ok", daysLeft: null };

  const exp = new Date(expiresAt).getTime();
  const daysLeft = Math.ceil((exp - now) / DAY);
  if (exp <= now) return { status: "expired", daysLeft };
  if (daysLeft <= SOON_DAYS) return { status: "expiring", daysLeft };
  return { status: "ok", daysLeft };
}

/** ¿El acceso bloquea la entrada al sistema? (servidor decide.) */
export function isBlocked(status: AccessStatus): boolean {
  return status === "expired" || status === "revoked";
}
