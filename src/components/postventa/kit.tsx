"use client";

import { Search } from "lucide-react";
import { GlassPanel, PulseBadge } from "@/components/ui";
import { TONE_PILL, type Tone } from "@/lib/postventa/status";
import { formatDateDO } from "@/lib/pos/receipt-format";
import { cn } from "@/lib/utils";

export function StatusPill({
  label,
  tone,
  pulse,
  className,
}: {
  label: string;
  tone: Tone;
  pulse?: boolean;
  className?: string;
}) {
  if (pulse) {
    const map: Record<Tone, "success" | "warning" | "danger" | "accent"> = {
      success: "success",
      warning: "warning",
      danger: "danger",
      accent: "accent",
      neutral: "accent",
    };
    return (
      <PulseBadge tone={map[tone]} className={className}>
        {label}
      </PulseBadge>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        TONE_PILL[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

export interface FilterChip {
  value: string;
  label: string;
  count: number;
}

/** Barra de búsqueda + chips de estado, reutilizable por los tres módulos. */
export function FilterBar({
  query,
  onQuery,
  placeholder,
  chips,
  active,
  onChip,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  chips: FilterChip[];
  active: string;
  onChip: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border/70 bg-surface-2/50 py-2.5 pl-9 pr-3 text-sm text-fg outline-none focus:border-accent/70"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.value}
            onClick={() => onChip(c.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200",
              active === c.value
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-border/60 bg-surface-2/40 text-muted hover:border-accent/40 hover:text-fg",
            )}
          >
            {c.label}
            <span
              className={cn(
                "rounded px-1 text-[10px] tnum",
                active === c.value ? "bg-accent/20 text-accent" : "bg-surface-2/80 text-muted",
              )}
            >
              {c.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DetailRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className={cn("text-right text-sm font-medium text-fg", valueClass)}>{value}</span>
    </div>
  );
}

export interface TimelineStep {
  status: string;
  at: string | null;
  label: string;
  tone: Tone;
}

const TONE_DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
  neutral: "bg-muted",
};

/** Línea de tiempo del estado (pedidos y reparaciones). */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative ml-1.5 space-y-3 border-l border-border/60 pl-5">
      {steps.map((s, i) => (
        <li key={`${s.status}-${i}`} className="relative">
          <span
            className={cn(
              "absolute -left-[1.42rem] top-1 h-3 w-3 rounded-full ring-4 ring-bg",
              TONE_DOT[s.tone],
            )}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-fg">{s.label}</span>
            {s.at && <span className="text-xs text-muted">{formatDateDO(s.at)}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <GlassPanel className="py-14 text-center text-sm text-muted">{message}</GlassPanel>
  );
}
