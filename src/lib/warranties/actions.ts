"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false, error: "No tienes permiso." };
  return { ok: true };
}

/** Registra un reclamo de garantía: estado → reclamada, con motivo y solución. */
export async function registerClaim(
  id: string,
  reason: string,
  resolution: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured())
    return { ok: false, error: "Modo demo: conecta Supabase para registrar el reclamo." };
  if (!reason.trim()) return { ok: false, error: "Indica el motivo del reclamo." };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("warranties")
    .update({
      status: "reclamada",
      claim_reason: reason.trim(),
      claim_resolution: resolution,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "No se pudo registrar el reclamo." };
  revalidatePath("/garantias");
  return { ok: true };
}
