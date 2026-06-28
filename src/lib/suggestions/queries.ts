import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import { SAMPLE_SUGGESTIONS } from "./sample-data";
import type { ProfileSuggestions, Suggestion, SuggestionBundle } from "./types";

function uniqLabels(values: (string | null | undefined)[]): Suggestion[] {
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const v of values) {
    const label = (v ?? "").trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push({ label });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Datos para el autocompletado de TODO el sistema. Una sola consulta; se entrega
 * por perfil (cada tienda con SUS datos), respetando RLS. El cliente usa solo el
 * perfil activo, así que las sugerencias nunca cruzan de tienda.
 */
export const getSuggestionData = cache(async (): Promise<SuggestionBundle> => {
  if (!isSupabaseConfigured()) return SAMPLE_SUGGESTIONS;

  try {
    const supabase = createSupabaseServerClient();
    const [{ data: customers }, { data: products }, { data: suppliers }, { data: employees }] =
      await Promise.all([
        supabase.from("customers").select("id, full_name, phone, cedula, profile_type"),
        supabase.from("products").select("id, name, brand, category, profile_type").eq("active", true),
        supabase.from("suppliers").select("id, name, profile_type").eq("is_active", true),
        supabase.from("employees").select("id, full_name, profile_type").eq("is_active", true),
      ]);

    const build = (p: ProfileType): ProfileSuggestions => {
      const prods = (products ?? []).filter((x) => x.profile_type === p);
      return {
        customers: (customers ?? [])
          .filter((c) => c.profile_type === p)
          .map((c) => ({
            id: c.id,
            label: c.full_name as string,
            sublabel: (c.cedula as string) ?? (c.phone as string) ?? undefined,
          })),
        products: prods.map((x) => ({ id: x.id, label: x.name as string, sublabel: (x.brand as string) ?? undefined })),
        suppliers: (suppliers ?? [])
          .filter((s) => s.profile_type === p)
          .map((s) => ({ id: s.id, label: s.name as string })),
        brands: uniqLabels(prods.map((x) => x.brand as string)),
        categories: uniqLabels(prods.map((x) => x.category as string)),
        technicians: (employees ?? [])
          .filter((e) => e.profile_type === p)
          .map((e) => ({ id: e.id, label: e.full_name as string })),
      };
    };

    return { celulares: build("celulares"), electronicas: build("electronicas"), source: "supabase" };
  } catch {
    return SAMPLE_SUGGESTIONS;
  }
});
