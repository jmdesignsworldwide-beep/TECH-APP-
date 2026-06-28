"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";

export interface SupplierInput {
  id?: string | null;
  profile: ProfileType;
  name: string;
  contact: string;
  phone: string;
  email: string;
  supplies: string;
  notes: string;
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false, error: "No tienes permiso." };
  return { ok: true };
}

export async function saveSupplier(
  input: SupplierInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured())
    return { ok: false, error: "Modo demo: conecta Supabase para guardar proveedores." };
  if (!input.name.trim()) return { ok: false, error: "Indica el nombre del proveedor." };

  const supabase = createSupabaseServerClient();
  const row = {
    name: input.name.trim(),
    contact: input.contact.trim() || null,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    supplies: input.supplies.trim() || null,
    notes: input.notes.trim() || null,
  };

  if (input.id) {
    const { error } = await supabase.from("suppliers").update(row).eq("id", input.id);
    if (error) return { ok: false, error: "No se pudo guardar el proveedor." };
    revalidatePath("/proveedores");
    return { ok: true, id: input.id };
  }
  const { data, error } = await supabase
    .from("suppliers")
    .insert({ ...row, profile_type: input.profile })
    .select("id")
    .single();
  if (error) return { ok: false, error: "No se pudo crear el proveedor." };
  revalidatePath("/proveedores");
  return { ok: true, id: data.id };
}

export async function setSupplierActive(
  id: string,
  active: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return { ok: false, error: "Modo demo: conecta Supabase." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("suppliers").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el proveedor." };
  revalidatePath("/proveedores");
  return { ok: true };
}
