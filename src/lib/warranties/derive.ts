import type { WarrantyState } from "@/lib/postventa/status";

export const SOON_DAYS = 30;

/** Estado derivado para la UI a partir del estado en BD y los días restantes. */
export function deriveState(dbStatus: string, daysLeft: number): WarrantyState {
  if (dbStatus === "reclamada") return "reclamada";
  if (dbStatus === "vencida" || daysLeft < 0) return "vencida";
  if (daysLeft <= SOON_DAYS) return "por_vencer";
  return "activa";
}
