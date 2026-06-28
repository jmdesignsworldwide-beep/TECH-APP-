"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Ban, Receipt, Search } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PremiumButton } from "@/components/ui/premium-button";
import { PremiumModal } from "@/components/ui/premium-modal";
import { PulseBadge } from "@/components/ui/pulse-badge";
import { Stagger, StaggerItem } from "@/components/ui/stagger";
import { voidSale } from "@/lib/pos/actions";
import { PAYMENT_LABELS } from "@/lib/pos/payment-methods";
import type { SaleRecord } from "@/lib/pos/types";
import { cn, formatRD } from "@/lib/utils";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function SalesHistory({ sales }: { sales: SaleRecord[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todas" | "completada" | "anulada">("todas");
  const [detail, setDetail] = useState<SaleRecord | null>(null);
  const [voidMode, setVoidMode] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      if (status !== "todas" && s.status !== status) return false;
      if (q) {
        const hay = `${s.folio} ${s.seller} ${s.paymentMethod}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sales, search, status]);

  function openDetail(s: SaleRecord) {
    setDetail(s);
    setVoidMode(false);
    setReason("");
    setError(null);
  }

  async function confirmVoid() {
    if (!detail) return;
    setBusy(true);
    setError(null);
    const res = await voidSale(detail.id, reason);
    setBusy(false);
    if (res.ok) {
      setDetail(null);
      router.refresh();
    } else {
      setError(res.error ?? "No se pudo anular.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por NCF, vendedor o método…"
            className="w-full rounded-xl border border-border/70 bg-surface-2/50 py-2.5 pl-10 pr-3 text-sm text-fg outline-none focus:border-accent/70"
          />
        </div>
        <div className="flex overflow-hidden rounded-xl border border-border/70">
          {(["todas", "completada", "anulada"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-3 py-2.5 text-sm capitalize transition-colors",
                status === s
                  ? "bg-accent text-accent-fg"
                  : "bg-surface-2/50 text-muted hover:text-fg",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <Stagger className="space-y-2">
          {filtered.map((s) => (
            <StaggerItem key={s.id}>
              <button onClick={() => openDetail(s)} className="block w-full text-left">
                <GlassPanel className="flex items-center gap-3 p-3.5 transition-shadow duration-300 hover:shadow-glow">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2/70 text-accent">
                    <Receipt className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {s.folio}{" "}
                      <span className="text-muted">
                        · {s.items.reduce((a, b) => a + b.qty, 0)} uds
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {fmtDate(s.soldAt)} · {s.paymentMethod} · {s.seller}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold tnum",
                        s.status === "anulada"
                          ? "text-muted line-through"
                          : "text-fg",
                      )}
                    >
                      {formatRD(s.total)}
                    </p>
                    {s.status === "anulada" && (
                      <span className="text-[11px] font-medium text-danger">
                        Anulada
                      </span>
                    )}
                  </div>
                </GlassPanel>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <Receipt className="h-8 w-8 text-muted/50" />
          <p className="mt-3 text-sm font-medium text-fg">Sin ventas</p>
          <p className="mt-1 text-sm text-muted">
            Las ventas que registres aparecerán aquí.
          </p>
        </div>
      )}

      {/* Detalle */}
      <PremiumModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.folio}
        description={detail ? `${fmtDate(detail.soldAt)} · ${detail.seller}` : undefined}
        size="md"
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-surface-2/70 px-2.5 py-1 text-xs font-medium text-accent">
                {detail.paymentMethod}
              </span>
              {detail.ncfType && (
                <span className="rounded-lg border border-border/60 px-2.5 py-1 text-xs text-muted">
                  {detail.ncfType}
                </span>
              )}
              {detail.generatesWarranty && (
                <PulseBadge tone="accent">Con garantía</PulseBadge>
              )}
              {detail.status === "anulada" && (
                <span className="rounded-lg bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
                  Anulada
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              {detail.items.map((it, i) => (
                <div key={i} className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-fg">
                    {it.qty}× {it.name}
                  </span>
                  <span className="shrink-0 text-fg tnum">
                    {formatRD(it.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t border-border/60 pt-3">
              <Mini label="Subtotal" value={formatRD(detail.subtotal)} />
              {detail.discount > 0 && (
                <Mini label="Descuento" value={`- ${formatRD(detail.discount)}`} />
              )}
              <Mini label="ITBIS (incl.)" value={formatRD(detail.itbis)} muted />
              <div className="flex justify-between pt-1 text-base font-semibold">
                <span className="text-fg">Total</span>
                <span className="text-fg tnum">{formatRD(detail.total)}</span>
              </div>
            </div>

            {detail.payments.length > 0 && (
              <div className="space-y-1 border-t border-border/60 pt-3">
                <p className="text-xs font-semibold uppercase text-muted">Pagos</p>
                {detail.payments.map((p, i) => (
                  <Mini
                    key={i}
                    label={PAYMENT_LABELS[p.method] ?? p.method}
                    value={formatRD(p.amount)}
                  />
                ))}
              </div>
            )}

            {detail.status === "anulada" && detail.voidReason && (
              <p className="rounded-xl border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger">
                Motivo de anulación: {detail.voidReason}
              </p>
            )}

            {detail.status === "completada" && (
              <div className="border-t border-border/60 pt-4">
                {voidMode ? (
                  <div className="space-y-2.5">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder="Motivo de la anulación…"
                      className="w-full resize-none rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-danger/60"
                    />
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-danger">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <PremiumButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setVoidMode(false)}
                        disabled={busy}
                      >
                        Cancelar
                      </PremiumButton>
                      <PremiumButton
                        size="sm"
                        onClick={confirmVoid}
                        loading={busy}
                        disabled={!reason.trim()}
                        className="bg-danger text-white"
                      >
                        Confirmar anulación
                      </PremiumButton>
                    </div>
                    <p className="text-[11px] text-muted/70">
                      Anular repone el stock y ajusta el Dashboard. La venta no se
                      borra: queda marcada como anulada.
                    </p>
                  </div>
                ) : (
                  <PremiumButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setVoidMode(true)}
                    className="text-danger"
                  >
                    <Ban className="h-4 w-4" />
                    Anular venta
                  </PremiumButton>
                )}
              </div>
            )}
          </div>
        )}
      </PremiumModal>
    </div>
  );
}

function Mini({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={muted ? "text-muted" : "text-muted"}>{label}</span>
      <span className={cn("tnum", muted ? "text-muted" : "text-fg")}>{value}</span>
    </div>
  );
}
