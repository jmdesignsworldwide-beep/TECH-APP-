"use client";

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
                layoutId="nav-active"
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
            {item.placeholder && (
              <span
                className={cn(
                  "ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  active
                    ? "bg-black/15 text-accent-fg/80"
                    : "bg-surface-2/80 text-muted/70",
                )}
              >
                pronto
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
