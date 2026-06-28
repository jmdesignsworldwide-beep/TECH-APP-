"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, formatRD } from "@/lib/utils";
import { CountUp } from "./count-up";
import { GlassPanel } from "./glass-panel";

interface KpiCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  /** Si es true formatea como RD$. */
  currency?: boolean;
  /** Variación porcentual respecto al periodo anterior. */
  deltaPct?: number;
  /** Sufijo opcional (p. ej. "uds"). */
  suffix?: string;
  className?: string;
}

/**
 * Tarjeta de KPI con número en count-up (tabular-nums, lista para montos RD$).
 * Glow sutil del acento activo en hover. Muestra tendencia opcional.
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  currency,
  deltaPct,
  suffix,
  className,
}: KpiCardProps) {
  const positive = (deltaPct ?? 0) >= 0;

  return (
    <GlassPanel
      className={cn(
        "group relative overflow-hidden p-5 transition-shadow duration-500 hover:shadow-glow",
        className,
      )}
    >
      {/* Halo de acento que aparece en hover. */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && (
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-surface-2/60 text-accent transition-colors duration-300">
            <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-tight text-fg">
          <CountUp
            value={value}
            format={currency ? (n) => formatRD(n) : undefined}
          />
        </span>
        {suffix && (
          <span className="mb-1 text-sm font-medium text-muted">{suffix}</span>
        )}
      </div>

      {typeof deltaPct === "number" && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tnum",
              positive
                ? "bg-success/15 text-success"
                : "bg-danger/15 text-danger",
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(deltaPct).toFixed(1)}%
          </span>
          <span className="text-xs text-muted">vs. periodo anterior</span>
        </div>
      )}
    </GlassPanel>
  );
}
