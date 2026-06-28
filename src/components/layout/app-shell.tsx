"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileSwitch } from "@/components/profile-switch";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

/**
 * Shell responsive del área autenticada: sidebar premium (escritorio), header
 * conectado y drawer hamburguesa en móvil. El layout se siente como un
 * organismo, no pantallas sueltas.
 *
 * Móvil (≤lg): el sidebar colapsa a hamburguesa con overlay que cierra al tocar
 * fuera, bloquea el scroll de fondo y se cierra al navegar — sin atrapar el
 * toque ni romperse a 390px.
 */
export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  // Cierra el drawer al cambiar de ruta.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloquea el scroll del body cuando el drawer está abierto.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh">
      {/* ── Sidebar de escritorio ─────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-border/60 bg-surface/40 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavLinks />
        </div>
        <div className="border-t border-border/60 p-3">
          <ProfileSwitch className="w-full justify-center" />
        </div>
        <div className="px-4 pb-3">
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted/50">
            <span className="h-1 w-1 rounded-full bg-accent/60" />
            Demostración · JM Designs
          </p>
        </div>
      </aside>

      {/* ── Drawer móvil ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-[300px] flex-col border-r border-border/60 bg-surface/95 backdrop-blur-2xl lg:hidden"
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
            >
              <div className="flex h-16 items-center justify-between px-5">
                <Brand />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Cerrar menú"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 text-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-border/60 p-4">
                <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                  Perfil activo
                </p>
                <ProfileSwitch className="w-full justify-center" />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Columna principal ─────────────────────────────────── */}
      <div className="lg:pl-[260px]">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-bg/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-surface-2/50 text-fg transition-colors hover:border-accent/60 hover:text-accent lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          {/* Indicador de perfil (compacto en móvil) */}
          <div className="hidden sm:block">
            <ProfileSwitch />
          </div>
          <div className="sm:hidden">
            <ProfileSwitch compact />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>

        {/* Contenido */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
