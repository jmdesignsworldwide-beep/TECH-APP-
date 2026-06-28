"use client";

import { Printer } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { PulseBadge } from "@/components/ui/pulse-badge";
import { formatDateDO } from "@/lib/pos/receipt-format";
import type { CashSession, CashSummary } from "@/lib/cash/types";
import { cn, formatRD } from "@/lib/utils";

export interface CashReportData {
  profileLabel: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  closedBy: string | null;
  summary: CashSummary;
  counted: number | null;
  difference: number | null;
  notes: string | null;
}

const DISCLAIMER =
  "Documento de ejemplo generado para demostración. Cuadre de caja simulado, no contable.";

export function reportFromSession(s: CashSession): CashReportData {
  return {
    profileLabel: s.profileType === "celulares" ? "Celulares" : "Electrónicas",
    openedAt: s.openedAt,
    closedAt: s.closedAt,
    openedBy: s.openedBy,
    closedBy: s.closedBy,
    summary: s.summary ?? emptySummary(s.openingAmount),
    counted: s.countedCash,
    difference: s.difference,
    notes: s.notes,
  };
}

function emptySummary(opening: number): CashSummary {
  return {
    opening,
    efectivo: 0,
    transferencia: 0,
    debito: 0,
    credito: 0,
    total_sales: 0,
    sale_count: 0,
    egresos: 0,
    ingresos_manual: 0,
    expected_cash: opening,
  };
}

/** Resumen de cierre / arqueo, reusable para el cierre en vivo y el historial. */
export function CashReport({ data }: { data: CashReportData }) {
  const s = data.summary;
  const diff = data.difference ?? 0;
  const faltante = diff < 0;
  const methods: [string, number][] = [
    ["Efectivo", s.efectivo],
    ["Transferencia", s.transferencia],
    ["Débito", s.debito],
    ["Crédito", s.credito],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
          Tienda {data.profileLabel}
        </span>
        {data.closedAt && (
          <span className="rounded-lg border border-border/60 px-2.5 py-1 text-xs text-muted">
            {formatDateDO(data.closedAt)}
          </span>
        )}
        {data.difference !== null &&
          (diff === 0 ? (
            <PulseBadge tone="success">Cuadre exacto</PulseBadge>
          ) : (
            <PulseBadge tone={faltante ? "danger" : "warning"}>
              {faltante ? "Faltante" : "Sobrante"} {formatRD(Math.abs(diff))}
            </PulseBadge>
          ))}
      </div>

      {/* Arqueo */}
      {data.counted !== null && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Esperado" value={formatRD(s.expected_cash)} />
          <Stat label="Contado" value={formatRD(data.counted)} accent />
          <Stat
            label="Diferencia"
            value={`${diff > 0 ? "+" : ""}${formatRD(diff)}`}
            danger={faltante}
          />
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-surface-2/40 p-4 text-sm">
        <Row label="Fondo de apertura" value={formatRD(s.opening)} />
        <Row label="Ventas del día" value={formatRD(s.total_sales)} sub={`${s.sale_count} ventas`} />
        <div className="my-2 border-t border-dashed border-border/60" />
        <p className="mb-1 text-xs font-semibold uppercase text-muted">Por método</p>
        {methods.map(([label, val]) => (
          <Row key={label} label={label} value={formatRD(val)} muted={val === 0} />
        ))}
        <div className="my-2 border-t border-dashed border-border/60" />
        <Row label="Egresos" value={`- ${formatRD(s.egresos)}`} />
        {s.ingresos_manual > 0 && (
          <Row label="Ingresos manuales" value={formatRD(s.ingresos_manual)} />
        )}
        <div className="mt-1 flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
          <span className="text-fg">Efectivo esperado</span>
          <span className="text-fg tnum">{formatRD(s.expected_cash)}</span>
        </div>
      </div>

      {data.notes && (
        <p className="rounded-xl border border-border/50 bg-surface-2/40 px-3 py-2 text-sm text-muted">
          Nota: {data.notes}
        </p>
      )}

      <p className="rounded-xl border border-warning/25 bg-warning/5 px-3 py-2 text-[11px] leading-relaxed text-muted">
        {DISCLAIMER}
      </p>

      <div className="flex justify-end">
        <PremiumButton variant="subtle" size="sm" onClick={() => printCashReport(data)}>
          <Printer className="h-4 w-4" />
          Imprimir
        </PremiumButton>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        accent ? "border-accent/25 bg-accent/5" : "border-border/50 bg-surface-2/40",
      )}
    >
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold tnum",
          accent && "text-accent",
          danger ? "text-danger" : "text-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  muted,
}: {
  label: string;
  value: string;
  sub?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={cn("text-sm", muted ? "text-muted/60" : "text-muted")}>
        {label}
        {sub && <span className="ml-1 text-xs text-muted/60">· {sub}</span>}
      </span>
      <span className={cn("text-sm tnum", muted ? "text-muted/60" : "text-fg")}>
        {value}
      </span>
    </div>
  );
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Reporte de cierre imprimible (formato angosto). */
export function printCashReport(d: CashReportData) {
  const s = d.summary;
  const w = window.open("", "_blank", "width=420,height=680");
  if (!w) return;
  const row = (l: string, v: string, strong = false) =>
    `<div class="row${strong ? " strong" : ""}"><span>${esc(l)}</span><span>${esc(v)}</span></div>`;
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Cierre de caja — ${esc(d.profileLabel)}</title>
<style>
  @page { size: 80mm auto; margin: 5mm; }
  body { width: 72mm; margin: 0 auto; font-family: "Courier New", monospace; color:#111; font-size:12px; line-height:1.5; }
  .center{ text-align:center; } .brand{ font-size:16px; font-weight:700; }
  .muted{ color:#555; font-size:11px; } .sep{ border-top:1px dashed #999; margin:8px 0; }
  .row{ display:flex; justify-content:space-between; gap:8px; } .strong{ font-weight:700; font-size:14px; }
  .diff{ text-align:center; font-weight:700; margin-top:6px; }
</style></head><body>
  <div class="center"><div class="brand">JM Tech</div>
  <div class="muted">Cierre de caja — Tienda ${esc(d.profileLabel)}</div>
  ${d.closedAt ? `<div class="muted">${esc(formatDateDO(d.closedAt))}</div>` : ""}
  <div class="muted">Abrió: ${esc(d.openedBy)}${d.closedBy ? ` · Cerró: ${esc(d.closedBy)}` : ""}</div></div>
  <div class="sep"></div>
  ${row("Fondo de apertura", formatRD(s.opening))}
  ${row("Ventas del día", formatRD(s.total_sales))}
  <div class="sep"></div>
  ${row("Efectivo", formatRD(s.efectivo))}
  ${row("Transferencia", formatRD(s.transferencia))}
  ${row("Débito", formatRD(s.debito))}
  ${row("Crédito", formatRD(s.credito))}
  <div class="sep"></div>
  ${row("Egresos", "- " + formatRD(s.egresos))}
  ${row("Efectivo esperado", formatRD(s.expected_cash), true)}
  ${d.counted !== null ? row("Efectivo contado", formatRD(d.counted)) : ""}
  ${d.difference !== null ? `<div class="diff">${d.difference === 0 ? "CUADRE EXACTO" : (d.difference < 0 ? "FALTANTE " : "SOBRANTE ") + formatRD(Math.abs(d.difference))}</div>` : ""}
  <div class="sep"></div>
  <div class="muted center">${esc(DISCLAIMER)}</div>
  <script>window.onload=function(){setTimeout(function(){window.print();},150);};window.onafterprint=function(){window.close();};</script>
</body></html>`);
  w.document.close();
}
