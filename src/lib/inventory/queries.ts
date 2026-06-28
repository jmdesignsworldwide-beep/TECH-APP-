import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import { rowToProduct } from "./map";
import { buildSampleInventory } from "./sample-data";
import type { InventoryBundle, InventoryData, Product } from "./types";

function toData(products: Product[]): InventoryData {
  return {
    products,
    stats: {
      totalProducts: products.length,
      inventoryValue: products.reduce((s, p) => s + p.cost * p.stock, 0),
      lowStockCount: products.filter((p) => p.stock <= p.minStock).length,
    },
  };
}

/**
 * Inventario de AMBOS perfiles (productos activos + stats). Lee de Supabase;
 * cae a la semilla de demo si no está configurado o ante error. Se calcula en
 * el servidor y se pasa como props para que el cambio de perfil sea instantáneo.
 */
export const getInventoryBundle = cache(async (): Promise<InventoryBundle> => {
  if (!isSupabaseConfigured()) return buildSampleInventory();

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const all = (data ?? []).map(rowToProduct);
    const byProfile = (profile: ProfileType) =>
      toData(all.filter((p) => p.profileType === profile));

    return {
      celulares: byProfile("celulares"),
      electronicas: byProfile("electronicas"),
      source: "supabase",
    };
  } catch {
    return buildSampleInventory();
  }
});
