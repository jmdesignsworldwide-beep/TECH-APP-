import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Cliente Supabase para el navegador (respeta RLS con la anon key). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
