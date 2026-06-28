/**
 * Sesión de DEMO firmada (fallback de preview).
 *
 * Cuando Supabase aún no está configurado, el dueño debe poder explorar el
 * login y el layout en el preview de Vercel. Para eso emitimos una cookie de
 * sesión firmada con HMAC-SHA256 (Web Crypto, válida en edge y node). NO es el
 * sistema de auth real — Supabase manda en cuanto hay credenciales — pero es
 * server-side y firmada, no un simple flag en cliente.
 */
import type { SessionUser } from "@/lib/types";

const encoder = new TextEncoder();

/**
 * Llave de firma del modo demo. En PRODUCCIÓN nunca se usa una llave conocida:
 * si falta `DEMO_SESSION_SECRET`, devolvemos null y el modo demo queda
 * fail-closed (no se pueden firmar ni verificar cookies → imposible forjarlas).
 * Solo en desarrollo local se permite una llave de conveniencia.
 */
function getSecret(): string | null {
  const s = process.env.DEMO_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") return null;
  return "jm-tech-demo-insecure-dev-secret"; // solo dev local
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null; // fail-closed en producción sin llave
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64url(sig);
}

export interface DemoSessionPayload extends SessionUser {
  /** Expiración en epoch ms. */
  exp: number;
}

/** Firma un payload de sesión demo → token `payload.signature`. */
export async function signDemoSession(
  user: SessionUser,
  ttlMs = 1000 * 60 * 60 * 12,
): Promise<string> {
  const payload: DemoSessionPayload = { ...user, exp: Date.now() + ttlMs };
  const body = base64url(encoder.encode(JSON.stringify(payload)));
  const sig = await hmac(body);
  if (!sig) throw new Error("DEMO_SESSION_SECRET requerido para el modo demo.");
  return `${body}.${sig}`;
}

/** Verifica el token y devuelve el payload, o null si es inválido/expirado. */
export async function verifyDemoSession(
  token: string | undefined,
): Promise<DemoSessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = await hmac(body);
  if (!expected) return null; // sin llave válida → ninguna sesión demo es válida
  // Comparación de tiempo constante.
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++)
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;

  try {
    const json = new TextDecoder().decode(fromBase64url(body));
    const payload = JSON.parse(json) as DemoSessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}

export const DEMO_COOKIE = "jm_demo_session";
