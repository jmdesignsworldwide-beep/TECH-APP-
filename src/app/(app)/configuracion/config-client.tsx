"use client";

import { Cpu, Moon, Smartphone, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { AccessManager } from "@/components/access/access-manager";
import { AccountPanel } from "@/components/account/account-panel";
import { useProfile } from "@/lib/profile/profile-provider";
import { useTheme } from "@/lib/theme/theme-provider";
import { PROFILE_META, type ProfileType, type ThemeMode } from "@/lib/types";
import type { DemoAccount } from "@/lib/access/types";
import { cn } from "@/lib/utils";

const profiles: { value: ProfileType; icon: typeof Smartphone; desc: string }[] =
  [
    {
      value: "celulares",
      icon: Smartphone,
      desc: "Cian eléctrico, vibrante. Más brillante.",
    },
    {
      value: "electronicas",
      icon: Cpu,
      desc: "Índigo profundo, serio. Más hondo.",
    },
  ];

const themes: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "dark", icon: Moon, label: "Oscuro" },
  { value: "light", icon: Sun, label: "Claro" },
];

export function ConfigClient({
  initialProfile,
  isOwner = false,
  accounts = [],
  canManageAccount = false,
  username = "",
}: {
  initialProfile: ProfileType;
  isOwner?: boolean;
  accounts?: DemoAccount[];
  canManageAccount?: boolean;
  username?: string;
}) {
  const { profile, setProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  const active = profile || initialProfile;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-7">
      <PageHeader
        title="Configuración"
        subtitle="Cambia el perfil de la tienda y el tema. El perfil reviste todo el sistema en vivo: acento y aurora pasan de cian a índigo."
      />

      {/* Perfil activo */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Perfil de la tienda</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profiles.map(({ value, icon: Icon, desc }) => {
            const selected = active === value;
            return (
              <button
                key={value}
                onClick={() => setProfile(value)}
                className="text-left"
                aria-pressed={selected}
              >
                <GlassPanel
                  glow={selected}
                  className={cn(
                    "relative flex items-start gap-4 p-5 transition-all duration-300",
                    selected
                      ? "border-accent/50"
                      : "opacity-80 hover:opacity-100",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors",
                      selected
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-border/60 bg-surface-2/60 text-muted",
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-fg">
                        {PROFILE_META[value].label}
                      </p>
                      {selected && (
                        <motion.span
                          layoutId="config-profile-dot"
                          className="h-2 w-2 rounded-full bg-accent shadow-glow-sm"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{desc}</p>
                  </div>
                </GlassPanel>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted/70">
          Cada tienda mantiene su inventario, ventas, caja y reportes
          independientes. El perfil activo reviste todo el sistema en vivo.
        </p>
      </section>

      {/* Tema */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted">Tema</h2>
        <div className="grid grid-cols-2 gap-4">
          {themes.map(({ value, icon: Icon, label }) => {
            const selected = theme === value;
            return (
              <button key={value} onClick={() => setTheme(value)} aria-pressed={selected}>
                <GlassPanel
                  glow={selected}
                  className={cn(
                    "flex items-center gap-3 p-4 transition-all duration-300",
                    selected ? "border-accent/50" : "opacity-80 hover:opacity-100",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl border",
                      selected
                        ? "border-accent/50 bg-accent/15 text-accent"
                        : "border-border/60 bg-surface-2/60 text-muted",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <span className="font-medium text-fg">{label}</span>
                </GlassPanel>
              </button>
            );
          })}
        </div>
      </section>

      {canManageAccount && <AccountPanel username={username} />}

      {isOwner && <AccessManager accounts={accounts} />}
    </div>
  );
}
