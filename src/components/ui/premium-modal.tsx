"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Ancho máximo del panel. */
  size?: "sm" | "md" | "lg";
}

const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

/**
 * PANEL/MODAL PREMIUM ESTÁNDAR — el patrón único de "clic = más info".
 *
 * Glassmorphism, entrada con spring, fondo difuminado, cierre elegante (X, Esc
 * o clic fuera), scroll interno en móvil y bloqueo del scroll de fondo. TODO el
 * "tocar para revelar más" del sistema debe usar ESTE componente: un solo
 * patrón de detalle, no diez modales distintos.
 *
 * Accesible: role=dialog, foco atrapado básico, cierre con Escape, respeta
 * prefers-reduced-motion.
 */
export function PremiumModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: PremiumModalProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
          {/* Backdrop difuminado. */}
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Panel. En móvil ancla abajo (hoja); en desktop centrado. */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 40, scale: 0.96 }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.97 }
            }
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "glass relative z-10 m-0 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl shadow-glass-lg",
              "sm:m-4 sm:rounded-3xl",
              widths[size],
            )}
          >
            {/* Borde superior con glow del acento. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

            {(title || description) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-6">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold tracking-tight text-fg">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-muted">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/60 text-muted transition-colors hover:border-accent/60 hover:text-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Cuerpo con scroll interno (clave en móvil). */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>

            {footer && (
              <div className="border-t border-border/60 bg-surface/40 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
