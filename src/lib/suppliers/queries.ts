import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import { SAMPLE_SUPPLIERS } from "./sample-data";
import type { Supplier, SupplierPurchase, SuppliersBundle } from "./types";

function mapPurchases(raw: unknown): SupplierPurchase[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => {
    const o = p as Record<string, unknown>;
    return {
      desc: String(o.desc ?? "Compra"),
      amount: Number(o.amount ?? 0),
      date: String(o.date ?? ""),
      status: String(o.status ?? "recibido"),
    };
  });
}

export const getSuppliersBundle = cache(async (): Promise<SuppliersBundle> => {
  if (!isSupabaseConfigured()) return SAMPLE_SUPPLIERS;

  try {
    const supabase = createSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("is_active", { ascending: false })
      .order("name");
    if (error) throw error;

    const all: Supplier[] = (rows ?? []).map((r) => {
      const purchases = mapPurchases(r.purchases);
      return {
        id: String(r.id),
        profileType: r.profile_type as ProfileType,
        name: String(r.name),
        contact: (r.contact as string) ?? null,
        phone: (r.phone as string) ?? null,
        email: (r.email as string) ?? null,
        supplies: (r.supplies as string) ?? null,
        notes: (r.notes as string) ?? null,
        isActive: Boolean(r.is_active),
        purchases,
        totalPurchased: purchases.reduce((a, p) => a + p.amount, 0),
      };
    });

    const pick = (p: ProfileType) => all.filter((s) => s.profileType === p);
    return { celulares: pick("celulares"), electronicas: pick("electronicas"), source: "supabase" };
  } catch {
    return SAMPLE_SUPPLIERS;
  }
});
