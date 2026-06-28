"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { Smartphone, Cpu } from "lucide-react";
import { useProfile } from "@/lib/profile/profile-provider";
import { PROFILE_META, type ProfileType } from "@/lib/types";
import { cn } from "@/lib/utils";

const options: { value: ProfileType; icon: typeof Smartphone }[] = [
  { value: "celulares", icon: Smartphone },
  { value: "electronicas", icon: Cpu },
];

/**
 * Conmutador del PERFIL ACTIVO (celulares ⇄ electrónicas). Al cambiarlo, el
 * acento y la aurora de TODO el sistema se desplazan de cian a índigo de forma
 * fluida, y cada módulo muestra los datos de esa tienda. El estado activo usa
 * texto del acento (legible en ambos temas), no relleno sólido con texto oscuro.
 */
export function ProfileSwitch({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { profile, setProfile } = useProfile();
  // layoutId único por instancia: evita que la pastilla "salte" o desaparezca
  // cuando hay dos selectores montados (barra superior + móvil) a la vez.
  const pillId = useId();

  return (
    <div
      role="tablist"
      aria-label="Perfil activo"
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface-2/60 p-1",
        className,
      )}
    >
      {options.map(({ value, icon: Icon }) => {
        const active = profile === value;
        return (
          <button
            key={value}
            role="tab"
            aria-selected={active}
            onClick={() => setProfile(value)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-300",
              active ? "text-accent" : "text-muted hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId={`profile-pill-${pillId}`}
                className="absolute inset-0 -z-10 rounded-full bg-accent/15 ring-1 ring-inset ring-accent/45 shadow-glow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {!compact && PROFILE_META[value].label}
          </button>
        );
      })}
    </div>
  );
}
