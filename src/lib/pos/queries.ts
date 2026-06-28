import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import { PAYMENT_LABELS } from "./payment-methods";
import type { SaleRecord, SalesBundle } from "./types";

const SAMPLE: SalesBundle = {
  celulares: [],
  electronicas: [],
  source: "sample",
};

/**
 * Historial de ventas de ambos perfiles (con detalle: líneas, pagos, vendedor).
 * Lee de Supabase; en modo demo devuelve vacío (las ventas se crean al cobrar).
 */
export const getSalesHistory = cache(async (): Promise<SalesBundle> => {
  if (!isSupabaseConfigured()) return SAMPLE;

  try {
    const supabase = createSupabaseServerClient();
    const { data: sales, error } = await supabase
      .from("sales")
      .select(
        "id, profile_type, total, subtotal, itbis, discount, payment_method, status, seller_id, customer_id, sold_at, void_reason, generates_warranty, ncf, ncf_type",
      )
      .order("sold_at", { ascending: false })
      .limit(80);
    if (error) throw error;

    const ids = (sales ?? []).map((s) => s.id);
    const sellerIds = [
      ...new Set((sales ?? []).map((s) => s.seller_id).filter(Boolean)),
    ];
    const custIds = [
      ...new Set((sales ?? []).map((s) => s.customer_id).filter(Boolean)),
    ];

    const [{ data: items }, { data: payments }, { data: sellers }, { data: customers }] =
      await Promise.all([
        ids.length
          ? supabase
              .from("sale_items")
              .select("sale_id, qty, unit_price, line_total, products(name)")
              .in("sale_id", ids)
          : Promise.resolve({ data: [] as unknown[] }),
        ids.length
          ? supabase
              .from("sale_payments")
              .select("sale_id, method, amount")
              .in("sale_id", ids)
          : Promise.resolve({ data: [] as unknown[] }),
        sellerIds.length
          ? supabase.from("app_users").select("id, display_name").in("id", sellerIds)
          : Promise.resolve({ data: [] as unknown[] }),
        custIds.length
          ? supabase.from("customers").select("id, full_name, phone").in("id", custIds)
          : Promise.resolve({ data: [] as unknown[] }),
      ]);

    const sellerName = new Map(
      (sellers as { id: string; display_name: string }[]).map((s) => [
        s.id,
        s.display_name,
      ]),
    );
    const custName = new Map(
      (customers as { id: string; full_name: string }[]).map((c) => [
        c.id,
        c.full_name,
      ]),
    );
    const custPhone = new Map(
      (customers as { id: string; phone: string | null }[]).map((c) => [
        c.id,
        c.phone ?? null,
      ]),
    );

    const itemsBySale = new Map<string, SaleRecord["items"]>();
    for (const it of (items ?? []) as Record<string, unknown>[]) {
      const arr = itemsBySale.get(it.sale_id as string) ?? [];
      const prod = it.products as { name?: string } | null;
      arr.push({
        name: prod?.name ?? "Producto",
        qty: Number(it.qty),
        unitPrice: Number(it.unit_price),
        lineTotal: Number(it.line_total),
      });
      itemsBySale.set(it.sale_id as string, arr);
    }

    const paymentsBySale = new Map<string, SaleRecord["payments"]>();
    for (const p of (payments ?? []) as Record<string, unknown>[]) {
      const arr = paymentsBySale.get(p.sale_id as string) ?? [];
      arr.push({ method: p.method as string, amount: Number(p.amount) });
      paymentsBySale.set(p.sale_id as string, arr);
    }

    const records: SaleRecord[] = (sales ?? []).map((s) => ({
      id: s.id,
      profileType: s.profile_type as ProfileType,
      folio: s.ncf ?? s.id.slice(0, 8).toUpperCase(),
      ncfType: s.ncf_type ?? null,
      total: Number(s.total),
      subtotal: Number(s.subtotal),
      itbis: Number(s.itbis),
      discount: Number(s.discount ?? 0),
      paymentMethod: PAYMENT_LABELS[s.payment_method] ?? s.payment_method,
      status: (s.status as "completada" | "anulada") ?? "completada",
      seller: s.seller_id ? (sellerName.get(s.seller_id) ?? "—") : "—",
      customer: s.customer_id ? (custName.get(s.customer_id) ?? null) : null,
      customerPhone: s.customer_id ? (custPhone.get(s.customer_id) ?? null) : null,
      soldAt: s.sold_at,
      voidReason: s.void_reason ?? null,
      generatesWarranty: Boolean(s.generates_warranty),
      items: itemsBySale.get(s.id) ?? [],
      payments: paymentsBySale.get(s.id) ?? [],
    }));

    const byProfile = (p: ProfileType) =>
      records.filter((r) => r.profileType === p);

    return {
      celulares: byProfile("celulares"),
      electronicas: byProfile("electronicas"),
      source: "supabase",
    };
  } catch {
    return SAMPLE;
  }
});
