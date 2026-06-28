"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";

export interface CatalogResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, error: "Sesión no válida." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false as const, error: "No tienes permiso." };
  return { ok: true as const };
}

function revalidate() {
  revalidatePath("/pos");
  revalidatePath("/inventario");
}

/** Agrega una categoría madre al perfil. */
export async function addCategory(
  profile: ProfileType,
  name: string,
): Promise<CatalogResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured())
    return { ok: false, error: "Modo demo: conecta Supabase para guardar." };
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Indica el nombre de la categoría." };

  const supabase = createSupabaseServerClient();
  // sort_order al final.
  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("profile_type", profile)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort = (last?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("categories")
    .insert({ profile_type: profile, name: clean, sort_order: sort });
  if (error) {
    if (/duplicate|unique/i.test(error.message))
      return { ok: false, error: "Esa categoría ya existe." };
    return { ok: false, error: "No se pudo crear la categoría." };
  }
  revalidate();
  return { ok: true };
}

/** Agrega una marca al perfil y la asocia a una categoría (para que aparezca). */
export async function addBrand(
  profile: ProfileType,
  category: string,
  name: string,
): Promise<CatalogResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured())
    return { ok: false, error: "Modo demo: conecta Supabase para guardar." };
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Indica el nombre de la marca." };
  if (!category) return { ok: false, error: "Elige primero una categoría." };

  const supabase = createSupabaseServerClient();
  const { error: brandErr } = await supabase
    .from("brands")
    .upsert(
      { profile_type: profile, name: clean },
      { onConflict: "profile_type,name" },
    );
  if (brandErr) return { ok: false, error: "No se pudo crear la marca." };

  const { error: linkErr } = await supabase.from("category_brands").upsert(
    { profile_type: profile, category_name: category, brand_name: clean },
    { onConflict: "profile_type,category_name,brand_name" },
  );
  if (linkErr) return { ok: false, error: "No se pudo asociar la marca." };

  revalidate();
  return { ok: true };
}
