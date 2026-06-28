"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CheckoutInput, CheckoutResult } from "./types";

export interface PosResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida. Vuelve a entrar." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false, error: "No tienes permiso para cobrar." };
  return { ok: true };
}

function demoBlocked(): PosResult<never> {
  return {
    ok: false,
    error: "Modo demo: conecta Supabase para registrar ventas reales.",
  };
}

function revalidate() {
  // El organismo: una venta toca POS, inventario y dashboard.
  revalidatePath("/pos");
  revalidatePath("/inventario");
  revalidatePath("/dashboard");
}

/** Cobra: registra venta + pagos y descuenta stock, todo atómico en la base. */
export async function checkout(
  input: CheckoutInput,
): Promise<PosResult<CheckoutResult>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();

  if (!input.items.length)
    return { ok: false, error: "El carrito está vacío." };
  const paid = input.payments.reduce((s, p) => s + (p.amount || 0), 0);
  if (paid <= 0) return { ok: false, error: "Falta registrar el pago." };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("pos_checkout", {
    p_profile: input.profile,
    p_customer: null,
    p_items: input.items,
    p_payments: input.payments.map((p) => ({
      method: p.method,
      amount: p.amount,
      tendered: p.tendered ?? null,
      reference: p.reference ?? null,
    })),
    p_discount: input.discount || 0,
    p_generates_warranty: input.generatesWarranty,
    p_fiscal: input.fiscal,
  });

  if (error) {
    // Mensajes de la función (stock insuficiente, etc.) llegan legibles.
    return { ok: false, error: cleanError(error.message) };
  }

  revalidate();
  const r = data as Record<string, unknown>;
  return {
    ok: true,
    data: {
      saleId: String(r.sale_id),
      ncf: String(r.ncf),
      ncfType: String(r.ncf_type),
      subtotal: Number(r.subtotal),
      itbis: Number(r.itbis),
      discount: Number(r.discount),
      total: Number(r.total),
      paid: Number(r.paid),
      change: Number(r.change),
    },
  };
}

/** Anula una venta: repone stock y la marca anulada (no la borra). */
export async function voidSale(
  saleId: string,
  reason: string,
): Promise<PosResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();
  if (!reason.trim()) return { ok: false, error: "Indica el motivo de la anulación." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.rpc("pos_void_sale", {
    p_sale: saleId,
    p_reason: reason.trim(),
  });
  if (error) return { ok: false, error: cleanError(error.message) };

  revalidate();
  return { ok: true };
}

/** Limpia el prefijo técnico de los errores de Postgres. */
function cleanError(msg: string): string {
  return msg.replace(/^.*?:\s*/, "").trim() || "No se pudo completar la operación.";
}
