"use client";

import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Lista de navegación compartida por el sidebar de escritorio y el drawer
 * móvil. El item activo lleva glow del acento y una pastilla animada.
 */
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  // layoutId único por instancia (sidebar de escritorio vs. drawer móvil).
  const activeId = useId();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
              active
                ? "text-accent-fg"
                : "text-muted hover:bg-surface-2/60 hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId={`nav-active-${activeId}`}
                className="absolute inset-0 -z-10 rounded-xl bg-accent shadow-glow-sm"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
              )}
              strokeWidth={active ? 2.1 : 1.75}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
