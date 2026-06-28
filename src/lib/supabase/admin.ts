import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Cliente con `service_role` — SOLO servidor. Salta RLS, así que NUNCA debe
 * importarse desde código de cliente. La llave vive únicamente en el entorno
 * del servidor (en Vercel marcada como "Sensitive", nunca NEXT_PUBLIC_).
 *
 * Usar con extrema cautela y solo para operaciones administrativas concretas
 * (p. ej. crear usuarios), validando rol/sesión antes.
 */
export function createSupabaseAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada");
  }
  return createClient(supabaseUrl!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
