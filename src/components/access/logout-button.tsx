"use client";

import { useState } from "react";

/** Cierra sesión vía API y vuelve al login. Usado en la pantalla de acceso bloqueado. */
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // no-op
    }
    window.location.href = "/login";
  }
  return (
    <button
      onClick={logout}
      disabled={busy}
      className="w-full rounded-xl border border-border/70 bg-surface-2/50 px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-fg disabled:opacity-60"
    >
      {busy ? "Cerrando…" : "Volver al inicio de sesión"}
    </button>
  );
}
