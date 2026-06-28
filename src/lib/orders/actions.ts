"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import type { OrderStatus } from "@/lib/postventa/status";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export interface OrderInput {
  profile: ProfileType;
  customerName: string;
  itemDesc: string;
  total: string;
  deposit: string;
  supplier: string;
  expectedAt: string;
  note: string;
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false, error: "No tienes permiso." };
  return { ok: true };
}

const demo = (): ActionResult => ({
  ok: false,
  error: "Modo demo: conecta Supabase para guardar pedidos.",
});

function money(s: string): number {
  const n = parseFloat((s || "").replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Crea un pedido. Asocia o crea el cliente por nombre (básico, demo). */
export async function createOrder(input: OrderInput): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demo();
  if (!input.customerName.trim()) return { ok: false, error: "Indica el cliente." };
  if (!input.itemDesc.trim()) return { ok: false, error: "Indica qué se encargó." };

  const supabase = createSupabaseServerClient();

  // Cliente: reusa si existe por nombre, si no lo crea (flujo de demo).
  let customerId: string | null = null;
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .ilike("full_name", input.customerName.trim())
    .limit(1)
    .maybeSingle();
  if (existing) customerId = existing.id;
  else {
    const { data: created } = await supabase
      .from("customers")
      .insert({ full_name: input.customerName.trim() })
      .select("id")
      .single();
    customerId = created?.id ?? null;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      profile_type: input.profile,
      customer_id: customerId,
      item_desc: input.itemDesc.trim(),
      status: "pendiente",
      total: money(input.total),
      deposit: money(input.deposit),
      supplier: input.supplier.trim() || null,
      note: input.note.trim() || null,
      expected_at: input.expectedAt || null,
      status_history: [{ status: "pendiente", at: now }],
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "No se pudo crear el pedido." };
  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  history: { status: OrderStatus; at: string | null }[],
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demo();

  const supabase = createSupabaseServerClient();
  const nextHistory = [...history, { status, at: new Date().toISOString() }];
  const { error } = await supabase
    .from("orders")
    .update({ status, status_history: nextHistory })
    .eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el pedido." };
  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  return { ok: true };
}
