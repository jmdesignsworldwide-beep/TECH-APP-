"use client";

import { Pencil, Power, TrendingUp } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { PulseBadge } from "@/components/ui/pulse-badge";
import {
  CONDITION_LABELS,
  getFields,
  SECTION_LABELS,
  type FieldDef,
} from "@/lib/inventory/fields";
import type { Product } from "@/lib/inventory/types";
import { cn, formatRD } from "@/lib/utils";

function display(field: FieldDef, product: Product): string {
  const raw =
    field.storage === "attribute"
      ? product.attributes?.[field.key]
      : (product as unknown as Record<string, unknown>)[field.key];
  if (raw === null || raw === undefined || raw === "") return "—";
  if (field.type === "currency") return formatRD(Number(raw));
  if (field.key === "condition") return CONDITION_LABELS[String(raw)] ?? String(raw);
  return String(raw);
}

/**
 * Detalle premium de un producto (dentro del modal estándar). Muestra TODO
 * según el perfil, calcula margen, y permite editar/desactivar. Sin botones
 * muertos: el detalle es accionable.
 */
export function ProductDetail({
  product,
  onEdit,
  onToggleActive,
  busy,
}: {
  product: Product;
  onEdit: () => void;
  onToggleActive: () => void;
  busy: boolean;
}) {
  const fields = getFields(product.profileType);
  const low = product.stock <= product.minStock;
  const margin = product.price - product.cost;
  const marginPct = product.price > 0 ? (margin / product.price) * 100 : 0;

  const sections: FieldDef["section"][] = [
    "basico",
    "especificaciones",
    "precio",
    "stock",
  ];

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-surface-2/70 px-2.5 py-1 text-xs font-medium capitalize text-accent">
          {product.category}
        </span>
        <span className="rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-muted">
          {CONDITION_LABELS[product.condition] ?? product.condition}
        </span>
        {low && <PulseBadge tone="danger">Bajo stock</PulseBadge>}
        {!product.active && (
          <span className="rounded-lg bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
            Inactivo
          </span>
        )}
      </div>

      {/* Resumen precio / margen / stock */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Precio venta" value={formatRD(product.price)} accent />
        <Stat
          label="Margen"
          value={formatRD(margin)}
          hint={`${marginPct.toFixed(0)}%`}
          icon
        />
        <Stat
          label="Stock"
          value={`${product.stock}`}
          hint={`mín. ${product.minStock}`}
          danger={low}
        />
      </div>

      {/* Campos por sección */}
      {sections.map((section) => {
        const sf = fields.filter((f) => f.section === section);
        if (!sf.length) return null;
        return (
          <div key={section}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {SECTION_LABELS[section]}
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {sf.map((f) => (
                <div
                  key={f.key}
                  className={cn(
                    "min-w-0",
                    (f.full || f.type === "textarea") && "col-span-2",
                  )}
                >
                  <dt className="text-xs text-muted">{f.label}</dt>
                  <dd
                    className={cn(
                      "truncate text-sm text-fg",
                      f.type === "textarea" && "whitespace-pre-wrap",
                      (f.type === "currency" || f.type === "number") && "tnum",
                    )}
                  >
                    {display(f, product)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}

      {/* Acciones */}
      <div className="flex justify-between gap-2 border-t border-border/60 pt-4">
        <PremiumButton
          variant="ghost"
          size="sm"
          onClick={onToggleActive}
          loading={busy}
          className={!product.active ? "" : "text-danger"}
        >
          <Power className="h-4 w-4" />
          {product.active ? "Desactivar" : "Reactivar"}
        </PremiumButton>
        <PremiumButton size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Editar
        </PremiumButton>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
  danger,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  danger?: boolean;
  icon?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        accent ? "border-accent/25 bg-accent/5" : "border-border/50 bg-surface-2/40",
      )}
    >
      <p className="flex items-center gap-1 text-xs text-muted">
        {icon && <TrendingUp className="h-3 w-3" />}
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold tnum",
          accent && "text-accent",
          danger ? "text-danger" : "text-fg",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-muted tnum">{hint}</p>}
    </div>
  );
}
