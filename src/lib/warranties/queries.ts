import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import { deriveState } from "./derive";
import { SAMPLE_WARRANTIES } from "./sample-data";
import type { Warranty, WarrantiesBundle } from "./types";

function daysBetween(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export const getWarrantiesBundle = cache(async (): Promise<WarrantiesBundle> => {
  if (!isSupabaseConfigured()) return SAMPLE_WARRANTIES;

  try {
    const supabase = createSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("warranties")
      .select(
        "id, profile_type, warranty_number, product_id, customer_id, serial, seller_name, months, starts_at, expires_at, status, claim_reason, claim_resolution, claimed_at",
      )
      .not("warranty_number", "is", null)
      .order("expires_at", { ascending: true });
    if (error) throw error;

    const productIds = [...new Set((rows ?? []).map((r) => r.product_id).filter(Boolean))];
    const customerIds = [...new Set((rows ?? []).map((r) => r.customer_id).filter(Boolean))];
    const [{ data: prods }, { data: custs }] = await Promise.all([
      productIds.length
        ? supabase.from("products").select("id, name").in("id", productIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      customerIds.length
        ? supabase.from("customers").select("id, full_name").in("id", customerIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    ]);
    const pName = new Map((prods ?? []).map((p) => [p.id, p.name as string]));
    const cName = new Map((custs ?? []).map((c) => [c.id, c.full_name as string]));

    const all: Warranty[] = (rows ?? []).map((r) => {
      const daysLeft = daysBetween(r.expires_at as string);
      const dbStatus = (r.status as Warranty["dbStatus"]) ?? "vigente";
      return {
        id: String(r.id),
        profileType: r.profile_type as ProfileType,
        warrantyNumber: r.warranty_number as string,
        productName: pName.get(r.product_id) ?? "Producto",
        customerName: cName.get(r.customer_id) ?? "Cliente",
        serial: (r.serial as string) ?? null,
        sellerName: (r.seller_name as string) ?? null,
        months: Number(r.months ?? 0),
        startsAt: r.starts_at as string,
        expiresAt: r.expires_at as string,
        dbStatus,
        state: deriveState(dbStatus, daysLeft),
        daysLeft,
        claimReason: (r.claim_reason as string) ?? null,
        claimResolution: (r.claim_resolution as string) ?? null,
        claimedAt: (r.claimed_at as string) ?? null,
      };
    });

    const pick = (p: ProfileType) => all.filter((w) => w.profileType === p);
    return { celulares: pick("celulares"), electronicas: pick("electronicas"), source: "supabase" };
  } catch {
    return SAMPLE_WARRANTIES;
  }
});
