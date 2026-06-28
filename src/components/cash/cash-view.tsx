"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownCircle,
  Banknote,
  History,
  Lock,
  LockOpen,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  CountUp,
  GlassPanel,
  KpiCard,
  PremiumButton,
  PremiumModal,
  PulseBadge,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { useProfile } from "@/lib/profile/profile-provider";
import { PROFILE_META } from "@/lib/types";
import { addMovement, closeCash, openCash } from "@/lib/cash/actions";
import type { CashBundle, CashSession } from "@/lib/cash/types";
import { formatDateDO } from "@/lib/pos/receipt-format";
import { cn, formatRD } from "@/lib/utils";
import { CashReport, reportFromSession, type CashReportData } from "./cash-report";

type Modal =
  | { kind: "none" }
  | { kind: "open" }
  | { kind: "egreso" }
  | { kind: "close" }
  | { kind: "report"; data: CashReportData }
  | { kind: "history"; session: CashSession };

const EGRESO_CATEGORIES = ["Proveedor", "Gasto", "Retiro", "Servicios", "Otro"];

const num = (s: string) => {
  const n = parseFloat((s || "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export function CashView({
  bundle,
  userName,
}: {
  bundle: CashBundle;
  userName: string;
}) {
  const router = useRouter();
  const { profile } = useProfile();
  const meta = PROFILE_META[profile];
  const state = bundle[profile];
  const session = state.session;
  const summary = state.summary;

  const [modal, setModal] = useState<Modal>({ kind: "none" });
  const [openingInput, setOpeningInput] = useState("");
  const [egAmount, setEgAmount] = useState("");
  const [egReason, setEgReason] = useState("");
  const [egCategory, setEgCategory] = useState(EGRESO_CATEGORIES[0]);
  const [countedInput, setCountedInput] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setError(null);
    setBusy(false);
  }
  function close() {
    setModal({ kind: "none" });
    setOpeningInput("");
    setEgAmount("");
    setEgReason("");
    setCountedInput("");
    setCloseNotes("");
    reset();
  }

  async function doOpen() {
    setBusy(true);
    setError(null);
    const res = await openCash(profile, num(openingInput));
    setBusy(false);
    if (res.ok) {
      close();
      router.refresh();
    } else setError(res.error ?? "No se pudo abrir.");
  }

  async function doEgreso() {
    if (!session) return;
    setBusy(true);
    setError(null);
    const res = await addMovement(
      session.id,
      "egreso",
      num(egAmount),
      egReason,
      egCategory,
    );
    setBusy(false);
    if (res.ok) {
      setModal({ kind: "none" });
      setEgAmount("");
      setEgReason("");
      reset();
      router.refresh();
    } else setError(res.error ?? "No se pudo registrar.");
  }

  async function doClose() {
    if (!session) return;
    setBusy(true);
    setError(null);
    const res = await closeCash(session.id, num(countedInput), closeNotes);
    setBusy(false);
    if (res.ok && res.data) {
      const data: CashReportData = {
        profileLabel: meta.label,
        openedAt: session.openedAt,
        closedAt: new Date().toISOString(),
        openedBy: session.openedBy,
        closedBy: userName,
        summary: res.data.summary,
        counted: res.data.counted_cash,
        difference: res.data.difference,
        notes: closeNotes.trim() || null,
      };
      setCountedInput("");
      setCloseNotes("");
      setModal({ kind: "report", data });
      router.refresh();
    } else setError(res.error ?? "No se pudo cerrar.");
  }

  const expected = summary?.expected_cash ?? session?.openingAmount ?? 0;
  const counted = num(countedInput);
  const liveDiff = Math.round((counted - expected) * 100) / 100;
  const demo = bundle.source === "sample";

  const payments = summary
    ? ([
        ["Efectivo", summary.efectivo],
        ["Transferencia", summary.transferencia],
        ["Débito", summary.debito],
        ["Crédito", summary.credito],
      ] as [string, number][])
    : [];
  const maxPay = Math.max(...payments.map(([, v]) => v), 1);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Caja"
        subtitle={
          <>
            Tienda <span className="font-medium text-fg">{meta.label}</span> —{" "}
            caja independiente.
            {demo && (
              <span className="ml-1 text-muted/70">
                Conecta Supabase para operar la caja.
              </span>
            )}
          </>
        }
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
            <Wallet className="h-4 w-4" />
            Caja {meta.label}
          </span>
        }
      />

      {session ? (
        <>
          {/* Estado */}
          <div className="flex flex-wrap items-center gap-2">
            <PulseBadge tone="success">
              <LockOpen className="h-3 w-3" /> Caja abierta
            </PulseBadge>
            <span className="text-sm text-muted">
              Abrió {session.openedBy} · {formatDateDO(session.openedAt)}
            </span>
            <div className="ml-auto flex gap-2">
              <PremiumButton variant="ghost" size="sm" onClick={() => setModal({ kind: "egreso" })}>
                <ArrowDownCircle className="h-4 w-4" />
                Egreso
              </PremiumButton>
              <PremiumButton size="sm" onClick={() => setModal({ kind: "close" })}>
                <Lock className="h-4 w-4" />
                Cerrar caja
              </PremiumButton>
            </div>
          </div>

          {/* KPIs */}
          <Stagger key={profile} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem className="sm:col-span-2">
              <GlassPanel glow className="relative overflow-hidden p-6">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 opacity-60 blur-3xl" />
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                    <Banknote className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="text-sm font-medium text-muted">Efectivo esperado en caja</p>
                </div>
                <p className="mt-5 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
                  <CountUp value={expected} format={(n) => formatRD(n)} />
                </p>
                <p className="mt-2 text-sm text-muted tnum">
                  Fondo {formatRD(summary?.opening ?? 0)} + efectivo{" "}
                  {formatRD(summary?.efectivo ?? 0)} − egresos{" "}
                  {formatRD(summary?.egresos ?? 0)}
                </p>
              </GlassPanel>
            </StaggerItem>
            <StaggerItem>
              <KpiCard label="Vendido (todos los métodos)" value={summary?.total_sales ?? 0} icon={TrendingUp} currency />
            </StaggerItem>
            <StaggerItem>
              <KpiCard label="Egresos" value={summary?.egresos ?? 0} icon={ArrowDownCircle} currency />
            </StaggerItem>
          </Stagger>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Métodos de pago */}
            <GlassPanel className="p-6">
              <h2 className="text-base font-semibold tracking-tight text-fg">
                Ingresos por método
              </h2>
              <p className="text-sm text-muted">
                {summary?.sale_count ?? 0} ventas · solo el efectivo se cuenta físico
              </p>
              <div className="mt-5 space-y-4">
                {payments.map(([label, val]) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted">{label}</span>
                      <span className="font-medium text-fg tnum">{formatRD(val)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2/70">
                      <motion.div
                        key={profile + label + val}
                        initial={{ width: 0 }}
                        animate={{ width: `${(val / maxPay) * 100}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 22 }}
                        className="h-full rounded-full bg-accent shadow-glow-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Movimientos */}
            <GlassPanel className="flex flex-col p-6">
              <h2 className="text-base font-semibold tracking-tight text-fg">
                Movimientos
              </h2>
              <p className="text-sm text-muted">Egresos e ingresos manuales</p>
              <div className="mt-4 min-h-0 flex-1 space-y-2">
                {state.movements.length ? (
                  state.movements.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-2/40 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fg">
                          {m.reason || m.category || "Egreso"}
                        </p>
                        <p className="text-xs text-muted">
                          {m.category} · {m.by}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold tnum",
                          m.kind === "egreso" ? "text-danger" : "text-success",
                        )}
                      >
                        {m.kind === "egreso" ? "−" : "+"}
                        {formatRD(m.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-muted">
                    Sin movimientos aún.
                  </p>
                )}
              </div>
            </GlassPanel>
          </div>
        </>
      ) : (
        /* Caja cerrada */
        <GlassPanel className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl border border-border/60 bg-surface-2/60 text-muted">
            <Lock className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-lg font-semibold text-fg">
              La caja de {meta.label} está cerrada
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Ábrela con un fondo de cambio para empezar a registrar las ventas de
              esta tienda.
            </p>
          </div>
          <PremiumButton onClick={() => setModal({ kind: "open" })} disabled={demo}>
            <LockOpen className="h-4 w-4" />
            Abrir caja
          </PremiumButton>
        </GlassPanel>
      )}

      {/* Historial de cierres */}
      {state.history.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-fg">
            <History className="h-4 w-4 text-accent" />
            Cierres anteriores — {meta.label}
          </h2>
          <Stagger className="space-y-2">
            {state.history.map((h) => (
              <StaggerItem key={h.id}>
                <button
                  onClick={() => setModal({ kind: "history", session: h })}
                  className="block w-full text-left"
                >
                  <GlassPanel className="flex items-center gap-3 p-3.5 transition-shadow duration-300 hover:shadow-glow">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2/70 text-accent">
                      <Receipt className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {h.closedAt ? formatDateDO(h.closedAt) : "—"}
                      </p>
                      <p className="truncate text-xs text-muted">
                        Vendido {formatRD(h.summary?.total_sales ?? 0)} · cerró{" "}
                        {h.closedBy ?? "—"}
                      </p>
                    </div>
                    {h.difference !== null && (
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold tnum",
                          h.difference === 0
                            ? "bg-success/15 text-success"
                            : h.difference < 0
                              ? "bg-danger/15 text-danger"
                              : "bg-warning/15 text-warning",
                        )}
                      >
                        {h.difference > 0 ? "+" : ""}
                        {formatRD(h.difference)}
                      </span>
                    )}
                  </GlassPanel>
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}

      {/* ── Modales ──────────────────────────────────────────── */}
      <PremiumModal
        open={modal.kind === "open"}
        onClose={close}
        title={`Abrir caja — ${meta.label}`}
        description="Fondo de cambio inicial"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={close} disabled={busy}>
              Cancelar
            </PremiumButton>
            <PremiumButton size="sm" onClick={doOpen} loading={busy}>
              Abrir caja
            </PremiumButton>
          </div>
        }
      >
        <MoneyInput label="Monto inicial (RD$)" value={openingInput} onChange={setOpeningInput} autoFocus />
        {error && <ErrorMsg msg={error} />}
      </PremiumModal>

      <PremiumModal
        open={modal.kind === "egreso"}
        onClose={close}
        title="Registrar egreso"
        description="Salida de efectivo de esta caja"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={close} disabled={busy}>
              Cancelar
            </PremiumButton>
            <PremiumButton size="sm" onClick={doEgreso} loading={busy} disabled={!(num(egAmount) > 0)}>
              Registrar
            </PremiumButton>
          </div>
        }
      >
        <div className="space-y-3">
          <MoneyInput label="Monto (RD$)" value={egAmount} onChange={setEgAmount} autoFocus />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Categoría</span>
            <select
              value={egCategory}
              onChange={(e) => setEgCategory(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70"
            >
              {EGRESO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Motivo</span>
            <input
              value={egReason}
              onChange={(e) => setEgReason(e.target.value)}
              placeholder="Ej: pago a proveedor de fundas"
              className="w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70"
            />
          </label>
          {error && <ErrorMsg msg={error} />}
        </div>
      </PremiumModal>

      <PremiumModal
        open={modal.kind === "close"}
        onClose={close}
        title={`Cerrar caja — ${meta.label}`}
        description="Arqueo: cuenta el efectivo físico"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={close} disabled={busy}>
              Cancelar
            </PremiumButton>
            <PremiumButton size="sm" onClick={doClose} loading={busy} className="bg-danger text-white">
              Cerrar caja
            </PremiumButton>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
            <span className="text-sm text-muted">Efectivo esperado</span>
            <span className="text-lg font-semibold text-fg tnum">{formatRD(expected)}</span>
          </div>
          <MoneyInput label="Efectivo contado (físico)" value={countedInput} onChange={setCountedInput} autoFocus />
          {countedInput !== "" && (
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm",
                liveDiff === 0
                  ? "border-success/30 bg-success/10 text-success"
                  : liveDiff < 0
                    ? "border-danger/30 bg-danger/10 text-danger"
                    : "border-warning/30 bg-warning/10 text-warning",
              )}
            >
              <span>{liveDiff === 0 ? "Cuadre exacto" : liveDiff < 0 ? "Faltante" : "Sobrante"}</span>
              <span className="font-semibold tnum">
                {liveDiff > 0 ? "+" : ""}
                {formatRD(liveDiff)}
              </span>
            </div>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Nota (opcional)</span>
            <input
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Observaciones del cierre"
              className="w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70"
            />
          </label>
          {error && <ErrorMsg msg={error} />}
        </div>
      </PremiumModal>

      <PremiumModal
        open={modal.kind === "report"}
        onClose={close}
        title="Caja cerrada"
        description="Resumen del día"
        size="md"
      >
        {modal.kind === "report" && <CashReport data={modal.data} />}
      </PremiumModal>

      <PremiumModal
        open={modal.kind === "history"}
        onClose={close}
        title="Detalle del cierre"
        description={
          modal.kind === "history" && modal.session.closedAt
            ? formatDateDO(modal.session.closedAt)
            : undefined
        }
        size="md"
      >
        {modal.kind === "history" && (
          <CashReport data={reportFromSession(modal.session)} />
        )}
      </PremiumModal>
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
          RD$
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          autoFocus={autoFocus}
          className="w-full rounded-xl border border-border/70 bg-surface-2/50 py-2.5 pl-11 pr-3 text-sm text-fg outline-none tnum focus:border-accent/70"
        />
      </div>
    </label>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{msg}</span>
    </div>
  );
}
