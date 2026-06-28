"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  Printer,
  Receipt,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  GlassPanel,
  KpiCard,
  PremiumButton,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { useProfile } from "@/lib/profile/profile-provider";
import { useAccent } from "@/lib/theme/use-accent";
import { PROFILE_META } from "@/lib/types";
import type { ReportsBundle, ReportsData, SeriesPoint } from "@/lib/reports/types";
import { cn, formatRD } from "@/lib/utils";

type Period = "byDay" | "byWeek" | "byMonth";
const PERIODS: { value: Period; label: string }[] = [
  { value: "byDay", label: "Día" },
  { value: "byWeek", label: "Semana" },
  { value: "byMonth", label: "Mes" },
];

const DISCLAIMER =
  "Documento de ejemplo generado para demostración. Reporte simulado, no contable.";

export function ReportsView({ bundle }: { bundle: ReportsBundle }) {
  const { profile } = useProfile();
  const meta = PROFILE_META[profile];
  const data = bundle[profile];
  const { color } = useAccent();
  const reduce = useReducedMotion();
  const [period, setPeriod] = useState<Period>("byDay");

  const series = data[period];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Reportes"
        subtitle={
          <>
            Reportes de <span className="font-medium text-fg">{meta.label}</span> — calculados sobre
            ventas reales de esta tienda.
          </>
        }
        actions={
          <PremiumButton size="sm" variant="subtle" onClick={() => printReport(data, meta.label)}>
            <Printer className="h-4 w-4" />
            Exportar
          </PremiumButton>
        }
      />

      {/* Insight calculado */}
      {data.bestDay && (
        <GlassPanel glow className="relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-accent/20 opacity-60 blur-3xl" />
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-muted">Inteligencia del negocio</p>
              <p className="mt-0.5 text-lg font-semibold text-fg">
                Tu mejor día es el <span className="capitalize text-accent">{data.bestDay.label}</span>
                {data.bestDay.total > 0 && (
                  <span className="text-muted"> · {formatRD(data.bestDay.total)} acumulado</span>
                )}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                Ticket promedio <span className="font-medium text-fg">{formatRD(data.ticketAvg)}</span> ·{" "}
                {data.salesCount} ventas · {data.unitsSold} unidades
              </p>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* KPIs */}
      <Stagger key={profile} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem><KpiCard label="Ventas (6 meses)" value={data.totalSales} icon={TrendingUp} currency /></StaggerItem>
        <StaggerItem><KpiCard label="N° de ventas" value={data.salesCount} icon={Receipt} /></StaggerItem>
        <StaggerItem><KpiCard label="Ticket promedio" value={data.ticketAvg} icon={BarChart3} currency /></StaggerItem>
        <StaggerItem><KpiCard label="Unidades vendidas" value={data.unitsSold} icon={BarChart3} suffix="uds" /></StaggerItem>
      </Stagger>

      {/* Ingresos por período */}
      <GlassPanel className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
            <CalendarRange className="h-4 w-4 text-accent" />
            Ingresos por período
          </h2>
          <div className="flex gap-1 rounded-xl border border-border/60 bg-surface-2/40 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                  period === p.value ? "bg-accent/15 text-accent" : "text-muted hover:text-fg",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="repFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" strokeOpacity={0.35} vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "rgb(var(--muted))", fontSize: 11 }} dy={6} />
              <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: "rgb(var(--muted))", fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
              <Tooltip content={<MoneyTooltip />} cursor={{ stroke: color, strokeOpacity: 0.3 }} />
              <Area type="monotone" dataKey="total" stroke={color} strokeWidth={2} fill="url(#repFill)" isAnimationActive={!reduce} animationDuration={700} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top productos */}
        <GlassPanel className="p-5">
          <h2 className="mb-3 text-base font-semibold text-fg">Productos más vendidos</h2>
          {data.topProducts.length ? (
            <div className="space-y-2.5">
              {data.topProducts.map((p, i) => {
                const max = data.topProducts[0]?.qty || 1;
                return (
                  <div key={p.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate text-fg">{i + 1}. {p.name}</span>
                      <span className="shrink-0 text-muted tnum">{p.qty} uds</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2/70">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(p.qty / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">Sin ventas en el período.</p>
          )}
        </GlassPanel>

        {/* Ventas por método */}
        <GlassPanel className="p-5">
          <h2 className="mb-3 text-base font-semibold text-fg">Ventas por método de pago</h2>
          {data.byMethod.length ? (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byMethod} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" strokeOpacity={0.35} vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "rgb(var(--muted))", fontSize: 11 }} dy={6} />
                  <YAxis tickLine={false} axisLine={false} width={56} tick={{ fill: "rgb(var(--muted))", fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
                  <Tooltip content={<MoneyTooltip />} cursor={{ fill: "rgb(var(--accent))", fillOpacity: 0.08 }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} isAnimationActive={!reduce} animationDuration={700}>
                    {data.byMethod.map((_, i) => (
                      <Cell key={i} fill={color} fillOpacity={1 - i * 0.18} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">Sin pagos en el período.</p>
          )}
        </GlassPanel>

        {/* Ventas por empleado */}
        <GlassPanel className="p-5">
          <h2 className="mb-3 text-base font-semibold text-fg">Ventas por empleado</h2>
          {data.byEmployee.length ? (
            <div className="space-y-2.5">
              {data.byEmployee.map((e) => {
                const max = data.byEmployee[0]?.total || 1;
                return (
                  <div key={e.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate text-fg">{e.name}</span>
                      <span className="shrink-0 text-muted tnum">{formatRD(e.total)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2/70">
                      <div className="h-full rounded-full bg-accent shadow-glow-sm" style={{ width: `${(e.total / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">Sin ventas atribuidas aún.</p>
          )}
        </GlassPanel>

        {/* Operativo: bajo stock + indicadores */}
        <GlassPanel className="p-5">
          <h2 className="mb-3 text-base font-semibold text-fg">Operación a vigilar</h2>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <OpStat label="Bajo stock" value={data.lowStockCount} tone={data.lowStockCount ? "warn" : "ok"} icon={AlertTriangle} />
            <OpStat label="Gar. por vencer" value={data.expiringWarranties} tone={data.expiringWarranties ? "warn" : "ok"} icon={ShieldAlert} />
            <OpStat label="Pedidos pend." value={data.pendingOrders} tone="neutral" icon={Receipt} />
          </div>
          {data.lowStock.length ? (
            <div className="space-y-1.5">
              {data.lowStock.slice(0, 5).map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/[0.04] px-3 py-2 text-sm">
                  <span className="truncate text-fg">{p.name}</span>
                  <span className="shrink-0 text-warning tnum">{p.stock} / {p.minStock}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">Stock saludable.</p>
          )}
        </GlassPanel>
      </div>

      <p className="rounded-xl border border-warning/25 bg-warning/5 px-3 py-2 text-[11px] leading-relaxed text-muted">
        {DISCLAIMER}
      </p>
    </div>
  );
}

function OpStat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "warn" | "ok" | "neutral";
  icon: typeof AlertTriangle;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-surface-2/40 px-3 py-2.5">
      <Icon className={cn("h-4 w-4", tone === "warn" ? "text-warning" : tone === "ok" ? "text-success" : "text-muted")} />
      <p className={cn("mt-1 text-xl font-semibold tnum", tone === "warn" ? "text-warning" : "text-fg")}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function MoneyTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/70 bg-surface-1 px-3 py-2 text-xs shadow-lg">
      <p className="text-muted">{label}</p>
      <p className="font-semibold text-fg tnum">{formatRD(payload[0].value)}</p>
    </div>
  );
}

/** Reporte imprimible de ejemplo (con disclaimer). */
function printReport(d: ReportsData, storeLabel: string) {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  const row = (l: string, v: string) => `<tr><td>${l}</td><td style="text-align:right">${v}</td></tr>`;
  const top = d.topProducts.map((p, i) => row(`${i + 1}. ${p.name}`, `${p.qty} uds`)).join("");
  const emp = d.byEmployee.map((e) => row(e.name, formatRD(e.total))).join("");
  const met = d.byMethod.map((m) => row(m.label, formatRD(m.total))).join("");
  const ser = (d.byMonth as SeriesPoint[]).map((s) => row(s.label, formatRD(s.total))).join("");
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Reporte — ${storeLabel}</title>
<style>
  body{font-family:system-ui,Arial,sans-serif;color:#111;max-width:640px;margin:24px auto;padding:0 16px}
  h1{font-size:20px;margin:0} .muted{color:#666;font-size:13px}
  h2{font-size:14px;margin:18px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}
  table{width:100%;border-collapse:collapse;font-size:13px} td{padding:3px 0}
  .kpis{display:flex;gap:16px;margin-top:10px;flex-wrap:wrap}
  .kpi{border:1px solid #e3e3e3;border-radius:10px;padding:8px 12px;min-width:120px}
  .kpi b{display:block;font-size:16px} .disc{margin-top:20px;color:#888;font-size:11px;border-top:1px solid #eee;padding-top:8px}
</style></head><body>
  <h1>JM Tech — Reporte de ${storeLabel}</h1>
  <div class="muted">Documento de ejemplo · ${new Date().toLocaleDateString("es-DO")}</div>
  <div class="kpis">
    <div class="kpi"><span class="muted">Ventas (6m)</span><b>${formatRD(d.totalSales)}</b></div>
    <div class="kpi"><span class="muted">N° ventas</span><b>${d.salesCount}</b></div>
    <div class="kpi"><span class="muted">Ticket prom.</span><b>${formatRD(d.ticketAvg)}</b></div>
    <div class="kpi"><span class="muted">Mejor día</span><b style="text-transform:capitalize">${d.bestDay?.label ?? "—"}</b></div>
  </div>
  <h2>Ingresos por mes</h2><table>${ser}</table>
  <h2>Productos más vendidos</h2><table>${top}</table>
  <h2>Ventas por empleado</h2><table>${emp}</table>
  <h2>Ventas por método</h2><table>${met}</table>
  <div class="disc">${DISCLAIMER}</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},200)}</script>
</body></html>`);
  w.document.close();
}
