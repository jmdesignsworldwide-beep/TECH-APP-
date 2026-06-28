"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productToRow } from "./map";
import type { ProductInput } from "./types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

/** Roles autorizados a mutar inventario. */
async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida. Vuelve a entrar." };
  if (user.role !== "owner" && user.role !== "admin") {
    return { ok: false, error: "No tienes permiso para esta acción." };
  }
  return { ok: true };
}

function validate(input: ProductInput): string | null {
  if (!input.name?.trim()) return "El nombre es obligatorio.";
  if (!input.brand?.trim()) return "La marca es obligatoria.";
  if (!input.category?.trim()) return "La categoría es obligatoria.";
  if (!(input.price >= 0)) return "El precio de venta no es válido.";
  if (!(input.cost >= 0)) return "El costo no es válido.";
  if (!Number.isFinite(input.stock) || input.stock < 0)
    return "El stock no es válido.";
  return null;
}

function notConfigured(): ActionResult {
  return {
    ok: false,
    error:
      "Modo demo: conecta Supabase (variables en Vercel) para guardar cambios reales.",
  };
}

function revalidate() {
  // El inventario y el dashboard comparten el dato (stock, bajo stock).
  revalidatePath("/inventario");
  revalidatePath("/dashboard");
}

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return notConfigured();

  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert(productToRow(input))
    .select("id")
    .single();

  if (error) {
    if (/duplicate|unique/i.test(error.message))
      return { ok: false, error: "Ya existe un producto con ese código (SKU)." };
    return { ok: false, error: "No se pudo crear el producto." };
  }
  revalidate();
  return { ok: true, id: data.id };
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return notConfigured();

  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update(productToRow(input))
    .eq("id", id);

  if (error) {
    if (/duplicate|unique/i.test(error.message))
      return { ok: false, error: "Ya existe un producto con ese código (SKU)." };
    return { ok: false, error: "No se pudo guardar el producto." };
  }
  revalidate();
  return { ok: true, id };
}

/** Soft-delete: desactiva (no borra) para no romper ventas históricas. */
export async function setProductActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return notConfigured();

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo actualizar el producto." };
  revalidate();
  return { ok: true, id };
}
