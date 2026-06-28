"use client";

import { useState } from "react";
import { AlertCircle, Check, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { GlassPanel, PremiumButton } from "@/components/ui";
import { changeMyPassword } from "@/lib/account/actions";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 pr-10 text-sm text-fg outline-none focus:border-accent/70";

/** "Mi cuenta": SOLO el owner real cambia su contraseña (verifica la actual). */
export function AccountPanel({ username }: { username: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm && !busy;

  async function submit() {
    if (next !== confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    const res = await changeMyPassword(current, next);
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } else {
      setError(res.error ?? "No se pudo cambiar la contraseña.");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
        <KeyRound className="h-4 w-4" />
        Mi cuenta
      </h2>
      <GlassPanel className="p-5">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-fg">
          <Lock className="h-4 w-4 text-accent" />
          Cambiar contraseña
        </p>
        <p className="mb-4 text-xs text-muted/80">
          Usuario <span className="font-medium text-fg">{username}</span>. Por
          seguridad, confirma tu contraseña actual. Se procesa en el servidor.
        </p>

        <div className="space-y-3">
          <Field
            label="Contraseña actual"
            value={current}
            onChange={setCurrent}
            show={show}
            onToggle={() => setShow((s) => !s)}
            placeholder="Tu contraseña actual"
            autoFocus
          />
          <Field
            label="Nueva contraseña"
            value={next}
            onChange={setNext}
            show={show}
            placeholder="Mínimo 8 caracteres, con letras y números"
          />
          <div>
            <Field
              label="Confirmar nueva contraseña"
              value={confirm}
              onChange={setConfirm}
              show={show}
              placeholder="Repite la nueva contraseña"
            />
            {mismatch && (
              <p className="mt-1 text-xs text-danger">Las contraseñas no coinciden.</p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {done && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
            <Check className="h-4 w-4 shrink-0" />
            Contraseña actualizada. Úsala la próxima vez que inicies sesión.
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <PremiumButton size="sm" onClick={submit} loading={busy} disabled={!canSubmit}>
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </PremiumButton>
        </div>
      </GlassPanel>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className={cn(inputCls, "tnum")}
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={show ? "Ocultar" : "Mostrar"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}
