"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PremiumButton } from "@/components/ui/premium-button";
import { cn } from "@/lib/utils";

/**
 * Formulario de login premium. Usuario + contraseña (sin email). Estados de
 * error bien diseñados (no texto rojo suelto). El usuario nunca ve email.
 */
export function LoginForm({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <GlassPanel glow className="p-6 sm:p-7">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field
          icon={<User className="h-4 w-4" />}
          label="Usuario"
        >
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="tu usuario"
            className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted/60"
            required
          />
        </Field>

        <Field
          icon={<Lock className="h-4 w-4" />}
          label="Contraseña"
          trailing={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="text-muted transition-colors hover:text-accent"
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        >
          <input
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted/60"
            required
          />
        </Field>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <PremiumButton
          type="submit"
          size="lg"
          loading={loading}
          className="mt-1 w-full"
        >
          Entrar
        </PremiumButton>
      </form>

      {demoMode && (
        <div className="mt-5 rounded-xl border border-accent/25 bg-accent/5 px-3.5 py-3 text-xs text-muted">
          <p className="font-medium text-accent-soft">Modo demo</p>
          <p className="mt-1">
            Aún sin Supabase configurado. Entra con{" "}
            <span className="font-semibold text-fg">admin</span> /{" "}
            <span className="font-semibold text-fg">jmtech</span> para explorar.
          </p>
        </div>
      )}
    </GlassPanel>
  );
}

function Field({
  icon,
  label,
  trailing,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </span>
      <span
        className={cn(
          "flex items-center gap-2.5 rounded-xl border border-border/70 bg-surface-2/50 px-3.5 py-3",
          "transition-colors duration-200 focus-within:border-accent/70 focus-within:bg-surface-2/80",
        )}
      >
        <span className="text-muted">{icon}</span>
        {children}
        {trailing}
      </span>
    </label>
  );
}
