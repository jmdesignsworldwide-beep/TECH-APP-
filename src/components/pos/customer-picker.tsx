"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Search, UserPlus, UserRound, X } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { PremiumModal } from "@/components/ui/premium-modal";
import { createCustomer } from "@/lib/customers/actions";
import type { Customer } from "@/lib/customers/types";
import { cn } from "@/lib/utils";

/**
 * Selector de cliente del POS: buscar uno existente o crearlo al vuelo, sin
 * fricción. "Consumidor Final" cuando no hay cliente.
 */
export function CustomerPicker({
  customers,
  selected,
  onSelect,
  onCreated,
}: {
  customers: Customer[];
  selected: Customer | null;
  onSelect: (c: Customer | null) => void;
  onCreated: (c: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", cedula: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.slice(0, 30);
    return customers
      .filter((c) =>
        `${c.fullName} ${c.phone ?? ""} ${c.cedula ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [customers, search]);

  function reset() {
    setCreating(false);
    setForm({ fullName: "", phone: "", cedula: "" });
    setError(null);
    setSearch("");
  }

  async function create() {
    setBusy(true);
    setError(null);
    const res = await createCustomer(form);
    setBusy(false);
    if (res.ok && res.data) {
      onCreated(res.data);
      onSelect(res.data);
      setOpen(false);
      reset();
    } else {
      setError(res.error ?? "No se pudo crear.");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-border/60 bg-surface-2/40 px-3 py-2 text-left transition-colors hover:border-accent/50"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
          <UserRound className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">
            {selected ? selected.fullName : "Consumidor Final"}
          </span>
          {selected?.cedula && (
            <span className="block truncate text-[11px] text-muted">
              {selected.cedula}
            </span>
          )}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
            className="shrink-0 rounded-md p-1 text-muted hover:text-danger"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      <PremiumModal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={creating ? "Nuevo cliente" : "Cliente"}
        description={creating ? "Se crea al instante" : "Busca o crea un cliente"}
        size="sm"
      >
        {creating ? (
          <div className="space-y-3">
            <Input
              label="Nombre"
              value={form.fullName}
              onChange={(v) => setForm({ ...form, fullName: v })}
              placeholder="Nombre del cliente"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Teléfono"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="809-000-0000"
              />
              <Input
                label="Cédula"
                value={form.cedula}
                onChange={(v) => setForm({ ...form, cedula: v })}
                placeholder="000-0000000-0"
              />
            </div>
            {error && (
              <p className="flex items-center gap-2 text-sm text-danger">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <PremiumButton variant="ghost" size="sm" onClick={() => setCreating(false)} disabled={busy}>
                Atrás
              </PremiumButton>
              <PremiumButton size="sm" onClick={create} loading={busy} disabled={!form.fullName.trim()}>
                Crear y seleccionar
              </PremiumButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, teléfono o cédula…"
                autoFocus
                className="w-full rounded-xl border border-border/70 bg-surface-2/50 py-2.5 pl-9 pr-3 text-sm text-fg outline-none focus:border-accent/70"
              />
            </div>

            <button
              onClick={() => {
                onSelect(null);
                setOpen(false);
                reset();
              }}
              className="w-full rounded-xl border border-border/50 bg-surface-2/30 px-3 py-2.5 text-left text-sm text-muted hover:border-accent/40 hover:text-fg"
            >
              Consumidor Final (sin cliente)
            </button>

            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                    reset();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl border border-border/50 bg-surface-2/30 px-3 py-2.5 text-left transition-colors hover:border-accent/40",
                    selected?.id === c.id && "border-accent/50",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">
                      {c.fullName}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {[c.phone, c.cedula].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                </button>
              ))}
              {!results.length && (
                <p className="py-4 text-center text-sm text-muted">
                  Sin coincidencias.
                </p>
              )}
            </div>

            <PremiumButton
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setForm({ fullName: search, phone: "", cedula: "" });
                setCreating(true);
              }}
            >
              <UserPlus className="h-4 w-4" />
              Crear cliente nuevo
            </PremiumButton>
          </div>
        )}
      </PremiumModal>
    </>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70"
      />
    </label>
  );
}
