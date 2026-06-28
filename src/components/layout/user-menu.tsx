"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Indicador de usuario + cierre de sesión. El logout pega contra el servidor
 * (limpia la sesión de Supabase o la cookie demo firmada) y redirige al login.
 */
export function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const initials = user.displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2.5 rounded-xl border border-border/60 bg-surface-2/50 py-1.5 pl-1.5 pr-3 sm:flex">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/15 text-xs font-semibold text-accent">
          {initials || <UserIcon className="h-3.5 w-3.5" />}
        </span>
        <span className="leading-tight">
          <span className="block text-xs font-medium text-fg">
            {user.displayName}
          </span>
          <span className="block text-[10px] capitalize text-muted">
            {user.role}
          </span>
        </span>
      </div>
      <button
        onClick={logout}
        disabled={loading}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-surface-2/50 text-muted transition-colors hover:border-danger/50 hover:text-danger",
          loading && "opacity-60",
        )}
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
    </div>
  );
}
