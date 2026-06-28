"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import type { CashCloseResult } from "./types";

export interface CashResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false, error: "No tienes permiso para operar la caja." };
  return { ok: true };
}

function demoBlocked(): CashResult<never> {
  return {
    ok: false,
    error: "Modo demo: conecta Supabase para operar la caja.",
  };
}

function revalidate() {
  revalidatePath("/caja");
  revalidatePath("/dashboard");
}

function clean(msg: string) {
  return msg.replace(/^.*?:\s*/, "").trim() || "No se pudo completar la operación.";
}

export async function openCash(
  profile: ProfileType,
  opening: number,
): Promise<CashResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.rpc("cash_open", {
    p_profile: profile,
    p_opening: opening || 0,
  });
  if (error) return { ok: false, error: clean(error.message) };
  revalidate();
  return { ok: true };
}

export async function addMovement(
  registerId: string,
  kind: "egreso" | "ingreso",
  amount: number,
  reason: string,
  category: string,
): Promise<CashResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();
  if (!(amount > 0)) return { ok: false, error: "Indica un monto válido." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.rpc("cash_movement", {
    p_register: registerId,
    p_kind: kind,
    p_amount: amount,
    p_reason: reason,
    p_category: category,
  });
  if (error) return { ok: false, error: clean(error.message) };
  revalidate();
  return { ok: true };
}

export async function closeCash(
  registerId: string,
  counted: number,
  notes: string,
): Promise<CashResult<CashCloseResult>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("cash_close", {
    p_register: registerId,
    p_counted: counted || 0,
    p_notes: notes,
  });
  if (error) return { ok: false, error: clean(error.message) };
  revalidate();
  return { ok: true, data: data as CashCloseResult };
}
