import type { ProfileType } from "@/lib/types";

export interface SupplierPurchase {
  desc: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: string; // recibido | en_camino
}

export interface Supplier {
  id: string;
  profileType: ProfileType;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  supplies: string | null;
  notes: string | null;
  isActive: boolean;
  purchases: SupplierPurchase[];
  /** Total comprado (calculado de purchases). */
  totalPurchased: number;
}

export interface SuppliersBundle {
  celulares: Supplier[];
  electronicas: Supplier[];
  source: "supabase" | "sample";
}
