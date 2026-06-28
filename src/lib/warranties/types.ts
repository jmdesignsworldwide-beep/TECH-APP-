import type { ProfileType } from "@/lib/types";
import type { WarrantyState } from "@/lib/postventa/status";

export interface Warranty {
  id: string;
  profileType: ProfileType;
  warrantyNumber: string;
  productName: string;
  customerName: string;
  serial: string | null;
  sellerName: string | null;
  months: number;
  startsAt: string; // date
  expiresAt: string; // date
  /** Estado base en la BD. */
  dbStatus: "vigente" | "vencida" | "reclamada";
  /** Estado derivado para la UI (incluye "por_vencer"). */
  state: WarrantyState;
  daysLeft: number;
  claimReason: string | null;
  claimResolution: string | null;
  claimedAt: string | null;
}

export interface WarrantiesBundle {
  celulares: Warranty[];
  electronicas: Warranty[];
  source: "supabase" | "sample";
}
