import { cookies } from "next/headers";
import { cache } from "react";
import type { AppRole, SessionUser } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_COOKIE, verifyDemoSession } from "./demo-session";

/**
 * Credenciales del MODO DEMO (solo cuando Supabase no está configurado).
 * Permiten explorar el preview. En cuanto hay Supabase real, esto se ignora.
 */
export const DEMO_USERS: Record<
  string,
  { password: string; displayName: string; role: AppRole }
> = {
  admin: { password: "jmtech", displayName: "JM (Demo)", role: "owner" },
};

/**
 * Resuelve el usuario de la petición actual desde el SERVIDOR.
 * Primero intenta Supabase (auth real); si no está configurado, valida la
 * cookie de sesión demo firmada. Devuelve null si no hay sesión válida.
 *
 * `cache()` evita repetir el trabajo dentro del mismo render.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // El perfil/rol vive en la tabla `app_users` (RLS), enlazada por auth uid.
    // Incluye el ACCESO TEMPORAL (is_active, access_expires_at) para validar el
    // vencimiento en el servidor.
    const { data: profile } = await supabase
      .from("app_users")
      .select("username, display_name, role, is_active, access_expires_at")
      .eq("auth_id", user.id)
      .maybeSingle();

    const username =
      profile?.username ?? user.email?.split("@")[0] ?? "usuario";

    return {
      id: user.id,
      username,
      displayName: profile?.display_name ?? username,
      role: (profile?.role as AppRole) ?? "staff",
      source: "supabase",
      accessExpiresAt: (profile?.access_expires_at as string) ?? null,
      isActive: profile?.is_active ?? true,
    };
  }

  // Fallback DEMO.
  const token = cookies().get(DEMO_COOKIE)?.value;
  const payload = await verifyDemoSession(token);
  if (!payload) return null;
  return {
    id: payload.id,
    username: payload.username,
    displayName: payload.displayName,
    role: payload.role,
    source: "demo",
    accessExpiresAt: null,
    isActive: true,
  };
});
