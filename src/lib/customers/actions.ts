"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import type { Customer } from "./types";

export interface CustomerResult {
  ok: boolean;
  error?: string;
  data?: Customer;
}

export interface SaveCustomerInput {
  id?: string | null;
  profile: ProfileType;
  fullName: string;
  cedula: string;
  phone: string;
  email: string;
  address: string;
  birthday: string;
}

async function requireAdminRole(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false, error: "No tienes permiso." };
  return { ok: true };
}

/** Crea o edita un cliente desde el módulo de Clientes. */
export async function saveCustomer(
  input: SaveCustomerInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured())
    return { ok: false, error: "Modo demo: conecta Supabase para guardar clientes." };
  if (!input.fullName.trim()) return { ok: false, error: "Indica el nombre." };

  const supabase = createSupabaseServerClient();
  const row = {
    full_name: input.fullName.trim(),
    cedula: input.cedula.trim() || null,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    address: input.address.trim() || null,
    birthday: input.birthday || null,
  };

  if (input.id) {
    const { error } = await supabase.from("customers").update(row).eq("id", input.id);
    if (error) return { ok: false, error: "No se pudo guardar el cliente." };
    revalidatePath("/clientes");
    return { ok: true, id: input.id };
  }
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...row, profile_type: input.profile })
    .select("id")
    .single();
  if (error) return { ok: false, error: "No se pudo crear el cliente." };
  revalidatePath("/clientes");
  return { ok: true, id: data.id };
}

export async function setCustomerActive(
  id: string,
  active: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured())
    return { ok: false, error: "Modo demo: conecta Supabase." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("customers").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el cliente." };
  revalidatePath("/clientes");
  return { ok: true };
}

/** Crea un cliente al vuelo desde el POS (rol owner/admin). */
export async function createCustomer(input: {
  fullName: string;
  phone: string;
  cedula: string;
}): Promise<CustomerResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false, error: "No tienes permiso." };
  if (!isSupabaseConfigured())
    return { ok: false, error: "Modo demo: conecta Supabase para guardar clientes." };
  if (!input.fullName.trim()) return { ok: false, error: "Indica el nombre." };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      full_name: input.fullName.trim(),
      phone: input.phone.trim() || null,
      cedula: input.cedula.trim() || null,
    })
    .select("id, full_name, phone, cedula")
    .single();

  if (error) return { ok: false, error: "No se pudo crear el cliente." };
  revalidatePath("/pos");
  return {
    ok: true,
    data: {
      id: data.id,
      fullName: data.full_name,
      phone: data.phone ?? null,
      cedula: data.cedula ?? null,
    },
  };
}
