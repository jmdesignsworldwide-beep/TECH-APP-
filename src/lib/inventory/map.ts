import type { ProfileType } from "@/lib/types";
import type { Product, ProductCondition } from "./types";

/** Convierte una fila de `products` (Supabase) al tipo Product de la UI. */
export function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: String(r.id),
    profileType: r.profile_type as ProfileType,
    name: (r.name as string) ?? "",
    brand: (r.brand as string) ?? "",
    model: (r.model as string) ?? null,
    category: (r.category as string) ?? "",
    sku: (r.sku as string) ?? null,
    color: (r.color as string) ?? null,
    condition: ((r.condition as string) ?? "nuevo") as ProductCondition,
    price: Number(r.price ?? 0),
    cost: Number(r.cost ?? 0),
    stock: Number(r.stock ?? 0),
    minStock: Number(r.min_stock ?? 0),
    supplier: (r.supplier as string) ?? null,
    warrantyMonths: Number(r.warranty_months ?? 0),
    entryDate: (r.entry_date as string) ?? null,
    active: r.active !== false,
    imageUrl: (r.image_url as string) ?? null,
    attributes: (r.attributes as Record<string, string>) ?? {},
  };
}

/** Producto → fila para insertar/actualizar en `products`. */
export function productToRow(input: {
  profileType: ProfileType;
  name: string;
  brand: string;
  model: string;
  category: string;
  sku: string;
  color: string;
  condition: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  supplier: string;
  warrantyMonths: number;
  entryDate: string;
  attributes: Record<string, string>;
}) {
  return {
    profile_type: input.profileType,
    name: input.name,
    brand: input.brand,
    model: input.model || null,
    category: input.category,
    sku: input.sku || null,
    color: input.color || null,
    condition: input.condition,
    price: input.price,
    cost: input.cost,
    stock: input.stock,
    min_stock: input.minStock,
    supplier: input.supplier || null,
    warranty_months: input.warrantyMonths,
    entry_date: input.entryDate || null,
    attributes: input.attributes ?? {},
  };
}
