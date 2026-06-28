import type { ProfileType } from "@/lib/types";

export interface Customer {
  id: string;
  fullName: string;
  phone: string | null;
  cedula: string | null;
}

/** Cliente completo para el módulo de Clientes. */
export interface CustomerFull extends Customer {
  email: string | null;
  address: string | null;
  birthday: string | null; // date YYYY-MM-DD
  isActive: boolean;
  profileType: ProfileType;
}

export interface TopProduct {
  name: string;
  qty: number;
}

/** Estadísticas REALES de compra de un cliente, dentro del perfil activo. */
export interface CustomerStats {
  totalSpent: number;
  purchaseCount: number;
  lastPurchase: string | null;
  topProducts: TopProduct[];
}

export interface CustomerWithStats extends CustomerFull {
  stats: CustomerStats;
}

export interface CustomersBundle {
  celulares: CustomerWithStats[];
  electronicas: CustomerWithStats[];
  source: "supabase" | "sample";
}
