"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Customer } from "./types";

export interface CustomerResult {
  ok: boolean;
  error?: string;
  data?: Customer;
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
