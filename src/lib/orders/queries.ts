import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import type { OrderStatus } from "@/lib/postventa/status";
import { SAMPLE_ORDERS } from "./sample-data";
import type { Order, OrderStep, OrdersBundle } from "./types";

function mapHistory(raw: unknown): OrderStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => ({
      status: (h as { status?: string }).status as OrderStatus,
      at: ((h as { at?: string }).at as string) ?? null,
    }))
    .filter((h) => h.status);
}

export const getOrdersBundle = cache(async (): Promise<OrdersBundle> => {
  if (!isSupabaseConfigured()) return SAMPLE_ORDERS;

  try {
    const supabase = createSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("orders")
      .select(
        "id, profile_type, customer_id, item_desc, status, total, deposit, supplier, note, created_at, expected_at, status_history",
      )
      .not("item_desc", "is", null)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const customerIds = [...new Set((rows ?? []).map((r) => r.customer_id).filter(Boolean))];
    const { data: custs } = customerIds.length
      ? await supabase.from("customers").select("id, full_name").in("id", customerIds)
      : { data: [] as { id: string; full_name: string }[] };
    const cName = new Map((custs ?? []).map((c) => [c.id, c.full_name as string]));

    const all: Order[] = (rows ?? []).map((r) => {
      const total = Number(r.total ?? 0);
      const deposit = Number(r.deposit ?? 0);
      return {
        id: String(r.id),
        profileType: r.profile_type as ProfileType,
        customerName: cName.get(r.customer_id) ?? "Cliente",
        itemDesc: (r.item_desc as string) ?? "Encargo",
        status: (r.status as OrderStatus) ?? "pendiente",
        total,
        deposit,
        balance: Math.max(0, total - deposit),
        supplier: (r.supplier as string) ?? null,
        note: (r.note as string) ?? null,
        createdAt: r.created_at as string,
        expectedAt: (r.expected_at as string) ?? null,
        history: mapHistory(r.status_history),
      };
    });

    const pick = (p: ProfileType) => all.filter((o) => o.profileType === p);
    return { celulares: pick("celulares"), electronicas: pick("electronicas"), source: "supabase" };
  } catch {
    return SAMPLE_ORDERS;
  }
});
