import { cookies } from "next/headers";
import type { ProfileType } from "@/lib/types";

/**
 * Estado global del PERFIL ACTIVO del sistema (celulares | electronicas).
 *
 * Se lee desde el servidor para que el acento/aurora correctos lleguen ya en el
 * primer render (sin parpadeo). Persistido en cookie por ahora; en una tanda
 * posterior puede moverse a una fila de `system_settings` en Supabase sin
 * cambiar esta firma. El switch de perfil completo se construye después; aquí
 * solo dejamos el cableado del color reactivo.
 */
export const ACTIVE_PROFILE_COOKIE = "jm_active_profile";

const VALID: ProfileType[] = ["celulares", "electronicas"];

export function getActiveProfile(): ProfileType {
  const value = cookies().get(ACTIVE_PROFILE_COOKIE)?.value as
    | ProfileType
    | undefined;
  return value && VALID.includes(value) ? value : "celulares";
}

export function isValidProfile(value: unknown): value is ProfileType {
  return typeof value === "string" && VALID.includes(value as ProfileType);
}
