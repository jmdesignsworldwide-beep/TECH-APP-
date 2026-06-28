"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PremiumModal } from "@/components/ui/premium-modal";
import { PremiumButton } from "@/components/ui/premium-button";
import { checkout } from "@/lib/pos/actions";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/pos/payment-methods";
import type {
  CartLine,
  CheckoutResult,
  PaymentEntry,
} from "@/lib/pos/types";
import type { ProfileType } from "@/lib/types";
import { cn, formatRD } from "@/lib/utils";
import { Receipt } from "./receipt";

interface Row {
  method: PaymentMethod;
  amount: string;
  tendered: string;
  reference: string;
}

const num = (s: string) => {
  const n = parseFloat((s || "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export function CheckoutModal({
  open,
  onClose,
  onSuccess,
  profile,
  lines,
  discount,
  seller,
  customerId,
  customerName,
  customerPhone,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile: ProfileType;
  lines: CartLine[];
  discount: number;
  seller: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
}) {
  const gross = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const disc = Math.min(Math.max(0, discount), gross);
  const total = Math.round((gross - disc) * 100) / 100;

  const [rows, setRows] = useState<Row[]>([
    { method: "efectivo", amount: total ? String(total) : "", tendered: "", reference: "" },
  ]);
  const [warranty, setWarranty] = useState(false);
  const [fiscal, setFiscal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [usedPayments, setUsedPayments] = useState<PaymentEntry[]>([]);

  const paid = useMemo(() => rows.reduce((s, r) => s + num(r.amount), 0), [rows]);
  const remaining = Math.round((total - paid) * 100) / 100;
  const change = useMemo(() => {
    const cash = rows
      .filter((r) => r.method === "efectivo")
      .reduce((s, r) => s + (num(r.tendered) - num(r.amount)), 0);
    return Math.max(0, Math.round(cash * 100) / 100);
  }, [rows]);

  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        method: "transferencia",
        amount: remaining > 0 ? String(remaining) : "",
        tendered: "",
        reference: "",
      },
    ]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function confirm() {
    setSubmitting(true);
    setError(null);
    const payments: PaymentEntry[] = rows
      .filter((r) => num(r.amount) > 0)
      .map((r) => ({
        method: r.method,
        amount: num(r.amount),
        tendered: r.method === "efectivo" && r.tendered ? num(r.tendered) : undefined,
        reference: r.reference || undefined,
      }));

    const res = await checkout({
      profile,
      customerId,
      items: lines.map((l) => ({ product_id: l.productId, qty: l.qty })),
      payments,
      discount: disc,
      generatesWarranty: warranty,
      fiscal,
    });
    setSubmitting(false);
    if (res.ok && res.data) {
      setUsedPayments(payments);
      setResult(res.data);
    } else {
      setError(res.error ?? "No se pudo cobrar.");
    }
  }

  function finish() {
    setResult(null);
    setRows([{ method: "efectivo", amount: "", tendered: "", reference: "" }]);
    setWarranty(false);
    setFiscal(false);
    onSuccess();
  }

  const covered = remaining <= 0.5;

  return (
    <PremiumModal
      open={open}
      onClose={result ? finish : onClose}
      title={result ? "Recibo" : "Cobrar"}
      description={result ? undefined : `Total a pagar ${formatRD(total)}`}
      size="md"
      footer={
        result ? (
          <div className="flex justify-end">
            <PremiumButton size="sm" onClick={finish}>
              Nueva venta
            </PremiumButton>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              {covered ? (
                <span className="text-success">
                  {change > 0 ? `Cambio ${formatRD(change)}` : "Pago completo"}
                </span>
              ) : (
                <span className="text-muted">
                  Faltan{" "}
                  <span className="font-semibold text-fg tnum">
                    {formatRD(remaining)}
                  </span>
                </span>
              )}
            </div>
            <PremiumButton
              size="sm"
              onClick={confirm}
              loading={submitting}
              disabled={!covered || !lines.length}
            >
              Confirmar cobro
            </PremiumButton>
          </div>
        )
      }
    >
      {result ? (
        <Receipt
          result={result}
          lines={lines}
          payments={usedPayments}
          seller={seller}
          customer={customerName}
          customerPhone={customerPhone}
        />
      ) : (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
            <span className="text-sm text-muted">Total</span>
            <span className="text-xl font-semibold text-fg tnum">
              {formatRD(total)}
            </span>
          </div>

          {/* Pagos (mixto) */}
          <div className="space-y-2.5">
            {rows.map((r, i) => {
              const meta = PAYMENT_METHODS.find((m) => m.value === r.method)!;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border/60 bg-surface-2/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <select
                      value={r.method}
                      onChange={(e) =>
                        update(i, { method: e.target.value as PaymentMethod })
                      }
                      className="rounded-lg border border-border/70 bg-surface-2/60 px-2.5 py-2 text-sm text-fg outline-none focus:border-accent/70"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                        RD$
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={r.amount}
                        onChange={(e) => update(i, { amount: e.target.value })}
                        placeholder="0"
                        className="w-full rounded-lg border border-border/70 bg-surface-2/60 py-2 pl-10 pr-2 text-sm text-fg outline-none tnum focus:border-accent/70"
                      />
                    </div>
                    {remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => update(i, { amount: String(num(r.amount) + remaining) })}
                        className="shrink-0 rounded-lg border border-border/70 px-2 py-2 text-xs text-muted hover:text-accent"
                        title="Asignar el resto"
                      >
                        Resto
                      </button>
                    )}
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="shrink-0 rounded-lg p-2 text-muted hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {(meta.cash || meta.needsReference) && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {meta.cash && (
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          value={r.tendered}
                          onChange={(e) => update(i, { tendered: e.target.value })}
                          placeholder="Recibido (efectivo)"
                          className="rounded-lg border border-border/70 bg-surface-2/60 px-2.5 py-1.5 text-xs text-fg outline-none tnum focus:border-accent/70"
                        />
                      )}
                      {meta.needsReference && (
                        <input
                          value={r.reference}
                          onChange={(e) => update(i, { reference: e.target.value })}
                          placeholder="Referencia / voucher"
                          className="col-span-1 rounded-lg border border-border/70 bg-surface-2/60 px-2.5 py-1.5 text-xs text-fg outline-none focus:border-accent/70"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              <Plus className="h-4 w-4" />
              Añadir método (pago mixto)
            </button>
          </div>

          {/* Opciones */}
          <div className="flex flex-wrap gap-2">
            <Toggle active={warranty} onClick={() => setWarranty((v) => !v)}>
              <ShieldCheck className="h-4 w-4" />
              Genera garantía
            </Toggle>
            <Toggle active={fiscal} onClick={() => setFiscal((v) => !v)}>
              Comprobante fiscal (B01)
            </Toggle>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-[11px] text-muted/70">
            ITBIS 18% incluido (simulado). Verificación de transferencia/voucher
            simulada para demostración.
          </p>
        </div>
      )}
    </PremiumModal>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border/70 bg-surface-2/50 text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
