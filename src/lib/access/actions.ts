"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured, usernameToEmail } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AccessResult {
  ok: boolean;
  error?: string;
}

/** Solo el owner (Marien) gestiona las cuentas de demo. */
async function requireOwner(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (user.role !== "owner")
    return { ok: false, error: "Solo el administrador del demo puede gestionar cuentas." };
  return { ok: true };
}

function demoBlocked(): AccessResult {
  return { ok: false, error: "Modo demo: conecta Supabase para gestionar cuentas." };
}

function expiryFrom(days: number | null, base: number = Date.now()): string | null {
  if (days === null || days <= 0) return null; // sin vencimiento
  return new Date(base + days * 86_400_000).toISOString();
}

/** Crea una cuenta de demo: usuario + contraseña + días de vigencia. */
export async function createDemoAccount(input: {
  username: string;
  password: string;
  days: number | null;
}): Promise<AccessResult> {
  const auth = await requireOwner();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();

  const username = input.username.trim().toLowerCase().replace(/\s+/g, "");
  if (username.length < 3) return { ok: false, error: "El usuario debe tener al menos 3 caracteres." };
  if (!/^[a-z0-9._-]+$/.test(username))
    return { ok: false, error: "Usuario inválido (solo letras, números, . _ -)." };
  if (input.password.length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };

  const admin = createSupabaseAdminClient();

  // ¿Usuario ya existe?
  const { data: existing } = await admin
    .from("app_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) return { ok: false, error: "Ese usuario ya existe." };

  // 1) Crear el usuario de Auth (email interno determinista, confirmado).
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password: input.password,
    email_confirm: true,
  });
  if (authErr || !created.user) {
    return { ok: false, error: "No se pudo crear el acceso (auth)." };
  }

  // 2) Crear el perfil de app con rol 'admin' (cliente que prueba el demo) y
  //    el vencimiento calculado en el servidor.
  const { error: profErr } = await admin.from("app_users").insert({
    auth_id: created.user.id,
    username,
    display_name: username,
    role: "admin",
    is_active: true,
    access_expires_at: expiryFrom(input.days),
  });
  if (profErr) {
    // Rollback del usuario de auth si el perfil falla.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    return { ok: false, error: "No se pudo crear el perfil de la cuenta." };
  }

  revalidatePath("/configuracion");
  return { ok: true };
}

/** Renueva/extiende una cuenta sumando días (reactiva si estaba revocada). */
export async function extendAccount(id: string, addDays: number): Promise<AccessResult> {
  const auth = await requireOwner();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();
  if (!(addDays > 0)) return { ok: false, error: "Indica los días a sumar." };

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("app_users")
    .select("access_expires_at")
    .eq("id", id)
    .maybeSingle();
  // Base: desde el vencimiento futuro si existe, si no desde ahora.
  const current = row?.access_expires_at ? new Date(row.access_expires_at).getTime() : 0;
  const base = Math.max(current, Date.now());
  const { error } = await admin
    .from("app_users")
    .update({ access_expires_at: expiryFrom(addDays, base), is_active: true })
    .eq("id", id)
    .neq("role", "owner");
  if (error) return { ok: false, error: "No se pudo renovar la cuenta." };
  revalidatePath("/configuracion");
  return { ok: true };
}

/** Revoca el acceso de una cuenta ya (la desactiva). */
export async function revokeAccount(id: string): Promise<AccessResult> {
  const auth = await requireOwner();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("app_users")
    .update({ is_active: false })
    .eq("id", id)
    .neq("role", "owner");
  if (error) return { ok: false, error: "No se pudo revocar la cuenta." };
  revalidatePath("/configuracion");
  return { ok: true };
}

/** Reactiva una cuenta revocada (sin tocar el vencimiento). */
export async function reactivateAccount(id: string): Promise<AccessResult> {
  const auth = await requireOwner();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("app_users")
    .update({ is_active: true })
    .eq("id", id)
    .neq("role", "owner");
  if (error) return { ok: false, error: "No se pudo reactivar la cuenta." };
  revalidatePath("/configuracion");
  return { ok: true };
}
