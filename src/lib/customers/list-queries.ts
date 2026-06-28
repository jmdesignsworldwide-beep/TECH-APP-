import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import { SAMPLE_CUSTOMERS } from "./sample-data";
import type {
  CustomerFull,
  CustomerStats,
  CustomersBundle,
  CustomerWithStats,
  TopProduct,
} from "./types";

function mapCustomer(r: Record<string, unknown>): CustomerFull {
  return {
    id: String(r.id),
    fullName: String(r.full_name),
    phone: (r.phone as string) ?? null,
    cedula: (r.cedula as string) ?? null,
    email: (r.email as string) ?? null,
    address: (r.address as string) ?? null,
    birthday: (r.birthday as string) ?? null,
    isActive: r.is_active === undefined ? true : Boolean(r.is_active),
    profileType: (r.profile_type as ProfileType) ?? "celulares",
  };
}

/**
 * Clientes de AMBOS perfiles con su historial de compra REAL calculado por
 * perfil. Un cliente aparece en la tienda donde se registró y/o donde tiene
 * ventas; sus métricas se calculan solo con las ventas de ESA tienda.
 */
export const getCustomersBundle = cache(async (): Promise<CustomersBundle> => {
  if (!isSupabaseConfigured()) return SAMPLE_CUSTOMERS;

  try {
    const supabase = createSupabaseServerClient();
    const [{ data: custRows, error: e1 }, { data: saleRows, error: e2 }] = await Promise.all([
      supabase.from("customers").select("*").order("full_name"),
      supabase
        .from("sales")
        .select("id, customer_id, profile_type, total, sold_at")
        .neq("status", "anulada"),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const sales = (saleRows ?? []).filter((s) => s.customer_id);
    const saleIds = sales.map((s) => s.id);

    // Líneas de venta → top productos por cliente/perfil.
    let items: { sale_id: string; product_id: string; qty: number }[] = [];
    if (saleIds.length) {
      const { data } = await supabase
        .from("sale_items")
        .select("sale_id, product_id, qty")
        .in("sale_id", saleIds);
      items = (data ?? []) as typeof items;
    }
    const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
    const { data: prods } = productIds.length
      ? await supabase.from("products").select("id, name").in("id", productIds)
      : { data: [] as { id: string; name: string }[] };
    const pName = new Map((prods ?? []).map((p) => [p.id, p.name as string]));

    const customers = (custRows ?? []).map(mapCustomer);

    const statsFor = (customerId: string, profile: ProfileType): CustomerStats => {
      const mySales = sales.filter(
        (s) => s.customer_id === customerId && s.profile_type === profile,
      );
      const totalSpent = mySales.reduce((a, s) => a + Number(s.total), 0);
      const lastPurchase = mySales.reduce<string | null>(
        (acc, s) => (!acc || s.sold_at > acc ? (s.sold_at as string) : acc),
        null,
      );
      const mySaleIds = new Set(mySales.map((s) => s.id));
      const byProduct = new Map<string, number>();
      for (const it of items) {
        if (!mySaleIds.has(it.sale_id)) continue;
        byProduct.set(it.product_id, (byProduct.get(it.product_id) ?? 0) + it.qty);
      }
      const topProducts: TopProduct[] = [...byProduct.entries()]
        .map(([pid, qty]) => ({ name: pName.get(pid) ?? "Producto", qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3);
      return { totalSpent, purchaseCount: mySales.length, lastPurchase, topProducts };
    };

    const hasSalesIn = (customerId: string, profile: ProfileType) =>
      sales.some((s) => s.customer_id === customerId && s.profile_type === profile);

    const build = (profile: ProfileType): CustomerWithStats[] =>
      customers
        .filter((c) => c.profileType === profile || hasSalesIn(c.id, profile))
        .map((c) => ({ ...c, stats: statsFor(c.id, profile) }))
        .sort((a, b) => b.stats.totalSpent - a.stats.totalSpent);

    return { celulares: build("celulares"), electronicas: build("electronicas"), source: "supabase" };
  } catch {
    return SAMPLE_CUSTOMERS;
  }
});
