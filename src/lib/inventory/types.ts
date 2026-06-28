import type { ProfileType } from "@/lib/types";

export type ProductCondition =
  | "nuevo"
  | "usado"
  | "reacondicionado"
  | "exhibicion";

/** Producto del inventario tal como lo usa la UI. */
export interface Product {
  id: string;
  profileType: ProfileType;
  name: string;
  brand: string;
  model: string | null;
  category: string;
  sku: string | null;
  color: string | null;
  condition: ProductCondition;
  price: number; // RD$
  cost: number; // RD$
  stock: number;
  minStock: number;
  supplier: string | null;
  warrantyMonths: number;
  entryDate: string | null; // ISO date
  active: boolean;
  imageUrl: string | null;
  /** Campos específicos del perfil (imei/storage/ram/network o serial/voltage/specs). */
  attributes: Record<string, string>;
}

export interface InventoryStats {
  totalProducts: number;
  inventoryValue: number; // suma de cost * stock
  lowStockCount: number;
}

export interface InventoryData {
  products: Product[];
  stats: InventoryStats;
}

export interface InventoryBundle {
  celulares: InventoryData;
  electronicas: InventoryData;
  source: "supabase" | "sample";
}

/** Payload para crear/editar (lo que envía el formulario al servidor). */
export interface ProductInput {
  profileType: ProfileType;
  name: string;
  brand: string;
  model: string;
  category: string;
  sku: string;
  color: string;
  condition: ProductCondition;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  supplier: string;
  warrantyMonths: number;
  entryDate: string;
  attributes: Record<string, string>;
}
