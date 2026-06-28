"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PAYMENT_LABELS } from "@/lib/pos/payment-methods";
import { receiptFromCheckout } from "@/lib/pos/receipt-format";
import type { CartLine, CheckoutResult, PaymentEntry } from "@/lib/pos/types";
import { formatRD } from "@/lib/utils";
import { ReceiptActions } from "./receipt-actions";

/**
 * Recibo digital de EJEMPLO (no fiscal). Se muestra tras cobrar.
 */
export function Receipt({
  result,
  lines,
  payments,
  seller,
  customer,
}: {
  result: CheckoutResult;
  lines: CartLine[];
  payments: PaymentEntry[];
  seller: string;
  customer?: string | null;
}) {
  const [dateISO] = useState(() => new Date().toISOString());
  const data = receiptFromCheckout(
    result,
    lines,
    payments,
    seller,
    customer ?? null,
    dateISO,
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <p className="mt-2 text-base font-semibold text-fg">Venta registrada</p>
        {result.change > 0 && (
          <p className="text-sm text-muted">
            Cambio:{" "}
            <span className="font-semibold text-accent tnum">
              {formatRD(result.change)}
            </span>
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface-2/40 p-4 font-mono text-sm">
        <div className="text-center">
          <p className="text-base font-semibold tracking-tight text-fg">JM Tech</p>
          <p className="text-xs text-muted">Recibo de ejemplo</p>
          <p className="mt-1 text-xs text-muted">
            {result.ncfType} · NCF {result.ncf}
          </p>
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

        <Row label="Subtotal" value={formatRD(result.subtotal)} />
        {result.discount > 0 && (
          <Row label="Descuento" value={`- ${formatRD(result.discount)}`} />
        )}
        <Row label="ITBIS (18%, incl.)" value={formatRD(result.itbis)} muted />
        <div className="mt-1 flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
          <span className="text-fg">TOTAL</span>
          <span className="text-fg tnum">{formatRD(result.total)}</span>
        </div>

        <div className="my-3 border-t border-dashed border-border/60" />

        <div className="space-y-1">
          {payments.map((p, i) => (
            <Row
              key={i}
              label={PAYMENT_LABELS[p.method] ?? p.method}
              value={formatRD(p.amount)}
            />
          ))}
        </div>

        <div className="my-3 border-t border-dashed border-border/60" />
        <p className="text-center text-[11px] text-muted">
          {customer ? `Cliente: ${customer} · ` : ""}Atendido por {seller}
        </p>
      </div>

      <p className="rounded-xl border border-warning/25 bg-warning/5 px-3 py-2 text-[11px] leading-relaxed text-muted">
        Documento de ejemplo generado para demostración. NCF simulado, no
        certificado ante la DGII.
      </p>

      <div className="flex justify-center">
        <ReceiptActions data={data} />
      </div>
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
