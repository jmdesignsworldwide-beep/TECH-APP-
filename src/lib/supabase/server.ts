import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Cliente Supabase para Server Components / Route Handlers.
 * Usa la cookie de sesión del usuario (anon key) — respeta RLS.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component sin permiso de escritura de
          // cookies; el middleware refresca la sesión, así que es seguro.
        }
      },
    },
  });
}
