"use server";

import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
  usernameToEmail,
} from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AccountResult {
  ok: boolean;
  error?: string;
}

/** Fortaleza mínima razonable: 8+ caracteres con letras y números. */
function weakPassword(pw: string): string | null {
  if (pw.length < 8) return "La nueva contraseña debe tener al menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw))
    return "Usa al menos una letra y un número.";
  return null;
}

/**
 * Cambia la contraseña de la PROPIA cuenta (owner/admin). Todo en el servidor:
 * 1) valida la contraseña ACTUAL re-autenticando con un cliente desechable (sin
 *    tocar la sesión vigente), 2) actualiza la contraseña con la sesión del
 *    usuario. La contraseña nunca se registra ni se expone. Rate-limit por
 *    usuario contra fuerza bruta de la contraseña actual.
 */
export async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
): Promise<AccountResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false, error: "No tienes permiso." };
  if (!isSupabaseConfigured())
    return { ok: false, error: "Modo demo: conecta Supabase para cambiar la contraseña." };
  if (!currentPassword) return { ok: false, error: "Indica tu contraseña actual." };

  const weak = weakPassword(newPassword);
  if (weak) return { ok: false, error: weak };
  if (newPassword === currentPassword)
    return { ok: false, error: "La nueva contraseña debe ser distinta de la actual." };

  // Anti fuerza bruta sobre la contraseña actual.
  const rl = checkRateLimit(`pwchange:${user.id}`, 5, 60_000);
  if (!rl.allowed)
    return { ok: false, error: `Demasiados intentos. Espera ${rl.retryAfterSec}s.` };

  // 1) Verifica la contraseña ACTUAL con un cliente desechable (no persiste
  //    sesión → no interfiere con la cookie de sesión vigente).
  const verifier = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: vErr } = await verifier.auth.signInWithPassword({
    email: usernameToEmail(user.username),
    password: currentPassword,
  });
  if (vErr) return { ok: false, error: "La contraseña actual no es correcta." };

  // 2) Actualiza la contraseña con la sesión del propio usuario.
  const supabase = createSupabaseServerClient();
  const { error: uErr } = await supabase.auth.updateUser({ password: newPassword });
  if (uErr) return { ok: false, error: "No se pudo cambiar la contraseña. Intenta de nuevo." };

  return { ok: true };
}
