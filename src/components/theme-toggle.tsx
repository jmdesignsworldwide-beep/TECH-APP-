"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Toggle sol/luna. Recuerda la preferencia (la persiste el ThemeProvider en
 * localStorage). Transición suave del icono; respeta reduced-motion.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const reduce = useReducedMotion();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
      className={cn(
        "group relative grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-surface-2/50 text-fg transition-colors hover:border-accent/60 hover:text-accent",
        className,
      )}
    >
      <motion.span
        key={theme}
        initial={reduce ? false : { rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="grid place-items-center"
      >
        {isDark ? (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        ) : (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
        )}
      </motion.span>
    </button>
  );
}
