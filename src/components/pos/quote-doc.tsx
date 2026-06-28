"use client";

import { FileText } from "lucide-react";
import type { Customer } from "@/lib/customers/types";
import type { CartLine } from "@/lib/pos/types";
import { formatRD } from "@/lib/utils";

/**
 * Documento de COTIZACIÓN de ejemplo (no descuenta stock). Mismo carrito que la
 * venta; se puede convertir en venta con un clic.
 */
export function QuoteDoc({
  lines,
  discount,
  customer,
  seller,
}: {
  lines: CartLine[];
  discount: number;
  customer: Customer | null;
  seller: string;
}) {
  const gross = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const disc = Math.min(Math.max(0, discount), gross);
  const total = gross - disc;
  const subtotal = Math.round((total / 1.18) * 100) / 100;
  const itbis = Math.round((total - subtotal) * 100) / 100;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-surface-2/40 p-4 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold tracking-tight text-fg">JM Tech</p>
            <p className="text-xs text-muted">Cotización de ejemplo</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <FileText className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-3 flex justify-between text-xs text-muted">
          <span>Cliente: {customer?.fullName ?? "Consumidor Final"}</span>
          <span>Atiende: {seller}</span>
        </div>

        <div className="my-3 border-t border-dashed border-border/60" />

        <div className="space-y-1.5">
          {lines.map((l) => (
            <div key={l.productId} className="flex justify-between gap-2">
              <span className="min-w-0 truncate text-fg">
                {l.qty}× {l.name}
              </span>
              <span className="shrink-0 text-fg tnum">
                {formatRD(l.price * l.qty)}
              </span>
            </div>
          ))}
        </div>

        <div className="my-3 border-t border-dashed border-border/60" />

        <Row label="Subtotal" value={formatRD(subtotal)} />
        {disc > 0 && <Row label="Descuento" value={`- ${formatRD(disc)}`} />}
        <Row label="ITBIS (18%, incl.)" value={formatRD(itbis)} muted />
        <div className="mt-1 flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
          <span className="text-fg">TOTAL</span>
          <span className="text-fg tnum">{formatRD(total)}</span>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted">
          Válida por 15 días. Precios sujetos a disponibilidad.
        </p>
      </div>

      <p className="rounded-xl border border-warning/25 bg-warning/5 px-3 py-2 text-[11px] leading-relaxed text-muted">
        Documento de ejemplo para demostración. No descuenta inventario ni es un
        comprobante fiscal.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className={muted ? "text-muted" : "text-fg"}>{label}</span>
      <span className={`tnum ${muted ? "text-muted" : "text-fg"}`}>{value}</span>
    </div>
  );
}
