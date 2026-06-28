import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_COOKIE } from "@/lib/auth/demo-session";

export const runtime = "nodejs";

/** Cierra sesión: termina la sesión de Supabase y limpia la cookie demo. */
export async function POST() {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
