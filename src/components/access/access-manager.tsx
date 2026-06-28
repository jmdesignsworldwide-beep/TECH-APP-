"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import {
  GlassPanel,
  PremiumButton,
  PremiumModal,
  PulseBadge,
} from "@/components/ui";
import {
  createDemoAccount,
  extendAccount,
  reactivateAccount,
  revokeAccount,
} from "@/lib/access/actions";
import type { AccessStatus } from "@/lib/access/status";
import type { DemoAccount } from "@/lib/access/types";
import { cn } from "@/lib/utils";

const DAY_OPTIONS = [
  { label: "7 días", value: 7 },
  { label: "15 días", value: 15 },
  { label: "30 días", value: 30 },
  { label: "Personalizado", value: -1 },
  { label: "Sin vencimiento", value: 0 },
];

const STATUS_META: Record<AccessStatus, { label: string; tone: "success" | "warning" | "danger" | "accent" }> = {
  ok: { label: "Activa", tone: "success" },
  expiring: { label: "Por vencer", tone: "warning" },
  expired: { label: "Vencida", tone: "danger" },
  revoked: { label: "Revocada", tone: "danger" },
};

const inputCls =
  "w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70";

function daysLabel(a: DemoAccount): string {
  if (a.status === "revoked") return "Acceso revocado";
  if (a.accessExpiresAt === null) return "Sin vencimiento";
  if (a.daysLeft === null) return "—";
  if (a.daysLeft < 0) return `Venció hace ${Math.abs(a.daysLeft)} días`;
  if (a.daysLeft === 0) return "Vence hoy";
  return `${a.daysLeft} ${a.daysLeft === 1 ? "día" : "días"} restantes`;
}

export function AccessManager({ accounts }: { accounts: DemoAccount[] }) {
  const router = useRouter();

  // Crear
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dayChoice, setDayChoice] = useState(7);
  const [customDays, setCustomDays] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Renovar
  const [renewing, setRenewing] = useState<DemoAccount | null>(null);
  const [renewDays, setRenewDays] = useState(7);

  function resolveDays(): number | null {
    if (dayChoice === 0) return null; // sin vencimiento
    if (dayChoice === -1) {
      const n = parseInt(customDays, 10);
      return Number.isFinite(n) && n > 0 ? n : 7;
    }
    return dayChoice;
  }

  async function create() {
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await createDemoAccount({ username, password, days: resolveDays() });
    setBusy(false);
    if (res.ok) {
      setOk(`Cuenta "${username.trim().toLowerCase()}" creada.`);
      setUsername("");
      setPassword("");
      router.refresh();
    } else setError(res.error ?? "No se pudo crear.");
  }

  async function doRenew() {
    if (!renewing) return;
    setBusy(true);
    setError(null);
    const res = await extendAccount(renewing.id, renewDays);
    setBusy(false);
    if (res.ok) {
      setRenewing(null);
      router.refresh();
    } else setError(res.error ?? "No se pudo renovar.");
  }

  async function toggleRevoke(a: DemoAccount) {
    setBusy(true);
    const res = a.isActive ? await revokeAccount(a.id) : await reactivateAccount(a.id);
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
          <KeyRound className="h-4 w-4" />
          Acceso · Cuentas de demo
        </h2>
        <p className="mt-1 text-xs text-muted/70">
          Crea accesos con días de vigencia para enviar el demo a un cliente. El
          vencimiento se valida en el servidor: al expirar, la cuenta no entra.
        </p>
      </div>

      {/* Crear cuenta */}
      <GlassPanel className="p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
          <UserPlus className="h-4 w-4 text-accent" />
          Nueva cuenta
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Usuario</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="cliente.demo" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Contraseña</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" className={inputCls} />
          </label>
        </div>

        <div className="mt-3">
          <span className="mb-1.5 block text-xs font-medium text-muted">Días de acceso</span>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setDayChoice(o.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  dayChoice === o.value
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-border/60 bg-surface-2/40 text-muted hover:text-fg",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          {dayChoice === -1 && (
            <input
              type="number"
              min={1}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="Número de días"
              className={cn(inputCls, "mt-2 max-w-[200px] tnum")}
            />
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {ok && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {ok}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <PremiumButton size="sm" onClick={create} loading={busy} disabled={!username.trim() || password.length < 6}>
            <UserPlus className="h-4 w-4" />
            Crear cuenta
          </PremiumButton>
        </div>
      </GlassPanel>

      {/* Lista de cuentas */}
      <div className="space-y-2">
        {accounts.length === 0 ? (
          <GlassPanel className="py-10 text-center text-sm text-muted">
            Aún no hay cuentas de demo. Crea la primera arriba.
          </GlassPanel>
        ) : (
          accounts.map((a) => {
            const meta = STATUS_META[a.status];
            return (
              <GlassPanel key={a.id} className={cn("flex flex-wrap items-center gap-3 p-3.5", !a.isActive && "opacity-70")}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-sm font-semibold uppercase text-accent">
                  {a.username.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">{a.username}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <CalendarClock className="h-3 w-3" />
                    {daysLabel(a)}
                  </p>
                </div>
                {a.status === "expiring" ? (
                  <PulseBadge tone="warning">{meta.label}</PulseBadge>
                ) : (
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      meta.tone === "success" && "bg-success/15 text-success",
                      meta.tone === "warning" && "bg-warning/15 text-warning",
                      meta.tone === "danger" && "bg-danger/15 text-danger",
                      meta.tone === "accent" && "bg-accent/10 text-accent",
                    )}
                  >
                    {meta.label}
                  </span>
                )}
                <div className="flex gap-1.5">
                  <PremiumButton variant="ghost" size="sm" onClick={() => { setRenewing(a); setRenewDays(7); }} disabled={busy}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Renovar
                  </PremiumButton>
                  <PremiumButton
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRevoke(a)}
                    disabled={busy}
                    className={a.isActive ? "text-danger" : undefined}
                  >
                    {a.isActive ? <XCircle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {a.isActive ? "Revocar" : "Reactivar"}
                  </PremiumButton>
                </div>
              </GlassPanel>
            );
          })
        )}
      </div>

      {/* Modal renovar */}
      <PremiumModal
        open={renewing !== null}
        onClose={() => setRenewing(null)}
        title="Renovar acceso"
        description={renewing ? `Sumar días a "${renewing.username}"` : undefined}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={() => setRenewing(null)} disabled={busy}>
              Cancelar
            </PremiumButton>
            <PremiumButton size="sm" onClick={doRenew} loading={busy}>
              Sumar {renewDays} días
            </PremiumButton>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          {[7, 15, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setRenewDays(d)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                renewDays === d
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-border/60 bg-surface-2/40 text-muted hover:text-fg",
              )}
            >
              +{d} días
            </button>
          ))}
        </div>
      </PremiumModal>
    </section>
  );
}
