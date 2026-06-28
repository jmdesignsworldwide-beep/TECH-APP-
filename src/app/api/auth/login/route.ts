import { NextResponse } from "next/server";
import { isSupabaseConfigured, usernameToEmail } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  resetRateLimit,
} from "@/lib/auth/rate-limit";
import {
  DEMO_COOKIE,
  signDemoSession,
} from "@/lib/auth/demo-session";
import { DEMO_USERS } from "@/lib/auth/session";
import { computeAccess, isBlocked } from "@/lib/access/status";
import type { AppRole, SessionUser } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Login con USUARIO + CONTRASEÑA (sin email). Si hay Supabase, mapea el usuario
 * a un email interno ficticio y autentica contra Supabase Auth. Si no, valida
 * contra las credenciales demo y emite una cookie de sesión firmada.
 *
 * Rate limiting server-side por usuario + IP (throttle anti fuerza bruta).
 */
export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Ingresa usuario y contraseña" },
      { status: 400 },
    );
  }

  // ── Rate limiting (por usuario y por IP) ──────────────────────
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const byUser = checkRateLimit(`login:user:${username}`, 5, 60_000);
  const byIp = checkRateLimit(`login:ip:${ip}`, 15, 60_000);
  if (!byUser.allowed || !byIp.allowed) {
    const retry = Math.max(byUser.retryAfterSec, byIp.retryAfterSec);
    return NextResponse.json(
      {
        error: `Demasiados intentos. Espera ${retry}s e intenta de nuevo.`,
      },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  // ── Supabase real ─────────────────────────────────────────────
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { data: signIn, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 },
      );
    }

    // ── Acceso temporal: bloqueo por vencimiento/revocación EN EL SERVIDOR ──
    // Se valida aquí (y de nuevo en el layout) contra la hora del servidor y el
    // valor en BD; el navegador no puede saltárselo.
    const { data: profile } = await supabase
      .from("app_users")
      .select("role, is_active, access_expires_at")
      .eq("auth_id", signIn.user?.id ?? "")
      .maybeSingle();
    const access = computeAccess(
      (profile?.role as AppRole) ?? "staff",
      profile?.is_active ?? true,
      (profile?.access_expires_at as string) ?? null,
    );
    if (isBlocked(access.status)) {
      await supabase.auth.signOut(); // no dejamos sesión viva si está bloqueado
      const msg =
        access.status === "revoked"
          ? "Tu acceso fue revocado. Contacta a JM Designs."
          : "Tu acceso ha expirado. Contacta a JM Designs para renovarlo.";
      return NextResponse.json(
        { error: msg, access: access.status },
        { status: 403 },
      );
    }

    resetRateLimit(`login:user:${username}`);
    return NextResponse.json({ ok: true });
  }

  // ── Fallback DEMO (preview sin Supabase) ──────────────────────
  const demo = DEMO_USERS[username];
  if (!demo || demo.password !== password) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 },
    );
  }

  const user: SessionUser = {
    id: `demo-${username}`,
    username,
    displayName: demo.displayName,
    role: demo.role,
    source: "demo",
    accessExpiresAt: null,
    isActive: true,
  };
  const token = await signDemoSession(user);

  resetRateLimit(`login:user:${username}`);

  const res = NextResponse.json({ ok: true, demo: true });
  res.cookies.set(DEMO_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
