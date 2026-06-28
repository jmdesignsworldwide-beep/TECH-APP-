import { NextResponse } from "next/server";
import {
  ACTIVE_PROFILE_COOKIE,
  isValidProfile,
} from "@/lib/profile/active-profile";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * Persiste el PERFIL ACTIVO del sistema. Requiere sesión válida (validada en el
 * servidor). Por ahora guarda en cookie; en una tanda posterior puede escribir
 * en `system_settings` de Supabase sin cambiar el contrato de este endpoint.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { profile?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (!isValidProfile(body.profile)) {
    return NextResponse.json({ error: "Perfil inválido" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, profile: body.profile });
  res.cookies.set(ACTIVE_PROFILE_COOKIE, body.profile, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
