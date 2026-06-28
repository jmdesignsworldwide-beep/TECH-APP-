"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import type { RepairStatus } from "@/lib/postventa/status";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export interface RepairInput {
  profile: ProfileType;
  customerName: string;
  device: string;
  identifier: string;
  problem: string;
  budget: string;
  technician: string;
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
  error: "Modo demo: conecta Supabase para guardar órdenes.",
});

function money(s: string): number {
  const n = parseFloat((s || "").replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Genera un número de orden legible por perfil. */
function orderNumber(profile: ProfileType): string {
  const prefix = profile === "celulares" ? "REP-CEL" : "REP-ELE";
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${n}`;
}

export async function createRepair(input: RepairInput): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demo();
  if (!input.customerName.trim()) return { ok: false, error: "Indica el cliente." };
  if (!input.device.trim()) return { ok: false, error: "Indica el equipo." };

  const supabase = createSupabaseServerClient();

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
    .from("repairs")
    .insert({
      profile_type: input.profile,
      order_number: orderNumber(input.profile),
      customer_id: customerId,
      customer_name: input.customerName.trim(),
      device: input.device.trim(),
      identifier: input.identifier.trim() || null,
      problem: input.problem.trim() || null,
      budget: money(input.budget),
      technician: input.technician.trim() || null,
      status: "recibido",
      status_history: [{ status: "recibido", at: now }],
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "No se pudo crear la orden." };
  revalidatePath("/reparaciones");
  return { ok: true, id: data.id };
}

export async function updateRepairStatus(
  id: string,
  status: RepairStatus,
  history: { status: RepairStatus; at: string | null }[],
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demo();

  const supabase = createSupabaseServerClient();
  const nextHistory = [...history, { status, at: new Date().toISOString() }];
  const { error } = await supabase
    .from("repairs")
    .update({ status, status_history: nextHistory })
    .eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar la orden." };
  revalidatePath("/reparaciones");
  return { ok: true };
}
