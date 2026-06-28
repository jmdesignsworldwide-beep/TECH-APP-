"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { GlassPanel } from "@/components/ui";
import {
  actionMeta,
  FILTERABLE_ACTIONS,
  TONE_CLASSES,
} from "@/lib/employees/activity-meta";
import type { ActivityEntry, Employee } from "@/lib/employees/types";
import { formatDateDO } from "@/lib/pos/receipt-format";
import { cn, formatRD } from "@/lib/utils";

/** Sello permanente: cada registro es inviolable a nivel base de datos. */
export function InviolableBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success",
        className,
      )}
      title="Registro inviolable: no se puede editar ni borrar (garantizado en la base de datos)."
    >
      <ShieldCheck className="h-3 w-3" />
      Inviolable
    </span>
  );
}

export function ActivityRow({
  entry,
  onClick,
}: {
  entry: ActivityEntry;
  onClick?: () => void;
}) {
  const m = actionMeta(entry.action);
  const tone = TONE_CLASSES[m.tone];
  const Icon = m.icon;
  return (
    <button
      onClick={onClick}
      className="block w-full text-left"
      aria-label={`Ver detalle: ${entry.detail}`}
    >
      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-surface-2/40 px-3 py-2.5 transition-colors duration-200 hover:border-accent/40 hover:bg-surface-2/70">
        <span
          className={cn(
            "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            tone.chip,
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-fg">
              {entry.actorName}
            </span>
            <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium", tone.chip)}>
              {m.label}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{entry.detail}</p>
          <p className="mt-1 text-[11px] text-muted/70">
            {formatDateDO(entry.createdAt)}
          </p>
        </div>
        {entry.amount !== null && (
          <span
            className={cn(
              "shrink-0 text-sm font-semibold tnum",
              entry.severity === "warn" ? "text-warning" : "text-fg",
            )}
          >
            {formatRD(Math.abs(entry.amount))}
          </span>
        )}
      </div>
    </button>
  );
}

/**
 * Feed del historial inviolable. Filtrable por tipo de acción, empleado y texto.
 * En modo `compact` (detalle de un empleado) oculta el filtro por empleado.
 */
export function ActivityFeed({
  entries,
  employees,
  onSelect,
  compact,
  limit = 60,
}: {
  entries: ActivityEntry[];
  employees: Employee[];
  onSelect?: (e: ActivityEntry) => void;
  compact?: boolean;
  limit?: number;
}) {
  const [action, setAction] = useState("all");
  const [employee, setEmployee] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => (action === "all" ? true : e.action === action))
      .filter((e) => (employee === "all" ? true : e.employeeId === employee))
      .filter((e) =>
        q === ""
          ? true
          : e.detail.toLowerCase().includes(q) ||
            e.actorName.toLowerCase().includes(q) ||
            (e.entityRef ?? "").toLowerCase().includes(q),
      )
      .slice(0, limit);
  }, [entries, action, employee, query, limit]);

  const selectCls =
    "rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2 text-sm text-fg outline-none focus:border-accent/70";

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en el historial…"
            className="w-full rounded-xl border border-border/70 bg-surface-2/50 py-2 pl-9 pr-3 text-sm text-fg outline-none focus:border-accent/70"
          />
        </div>
        <select value={action} onChange={(e) => setAction(e.target.value)} className={selectCls}>
          {FILTERABLE_ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        {!compact && employees.length > 0 && (
          <select value={employee} onChange={(e) => setEmployee(e.target.value)} className={selectCls}>
            <option value="all">Todos los empleados</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {filtered.length ? (
          filtered.map((e) => (
            <ActivityRow key={e.id} entry={e} onClick={onSelect ? () => onSelect(e) : undefined} />
          ))
        ) : (
          <GlassPanel className="py-10 text-center text-sm text-muted">
            No hay actividad para estos filtros.
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
