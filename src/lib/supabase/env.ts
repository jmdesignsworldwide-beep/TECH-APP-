/**
 * Lectura central de configuración de Supabase.
 * Permite que la app arranque en MODO DEMO en el preview cuando aún no hay
 * credenciales (para que el dueño pueda explorar el login/layout), y use
 * Supabase real en cuanto las variables existan.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** ¿Hay credenciales públicas de Supabase configuradas? */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith("http") &&
      supabaseAnonKey.length > 20,
  );
}

/**
 * Dominio para mapear usuario→email ficticio. El usuario NUNCA ve ni escribe
 * email; internamente "juan" se convierte en "juan@jmtech.local".
 */
export const internalEmailDomain =
  process.env.NEXT_PUBLIC_INTERNAL_EMAIL_DOMAIN || "jmtech.local";

/** Convierte un nombre de usuario a su email interno determinista. */
export function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/\s+/g, "");
  return `${clean}@${internalEmailDomain}`;
}
