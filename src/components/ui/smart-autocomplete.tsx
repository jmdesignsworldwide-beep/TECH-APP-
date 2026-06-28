"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutocompleteOption {
  id?: string;
  label: string;
  sublabel?: string;
}

const INPUT_CLS =
  "w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-muted/50 focus:border-accent/70";

/** Resalta la parte del texto que coincide con la consulta. */
function Highlight({ label, query }: { label: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{label}</>;
  const i = label.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{label}</>;
  return (
    <>
      {label.slice(0, i)}
      <span className="font-semibold text-accent">{label.slice(i, i + q.length)}</span>
      {label.slice(i + q.length)}
    </>
  );
}

/**
 * Autocompletado inteligente REUSABLE — una sola pieza para todo el sistema.
 * Sugiere en vivo de los datos que ya existen (filtrado en cliente sobre la
 * lista YA scopeada al perfil activo, así nunca cruza tiendas), navegable con
 * teclado y tap, con opción de "crear al vuelo" donde tiene sentido.
 */
export function SmartAutocomplete({
  value,
  onChange,
  options,
  onPick,
  onCreate,
  createNoun,
  placeholder,
  icon: Icon,
  autoFocus,
  className,
  maxItems = 8,
}: {
  value: string;
  onChange: (text: string) => void;
  options: AutocompleteOption[];
  /** Se llama al elegir una sugerencia existente o una creada. */
  onPick?: (option: AutocompleteOption) => void;
  /** Si se provee, habilita "+ Crear '...' como nuevo {createNoun}". */
  onCreate?: (label: string) => Promise<AutocompleteOption | null>;
  createNoun?: string;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  autoFocus?: boolean;
  className?: string;
  maxItems?: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);
  const reduce = useReducedMotion();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = value.trim();
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return options.slice(0, maxItems);
    return options
      .filter((o) => o.label.toLowerCase().includes(q) || (o.sublabel ?? "").toLowerCase().includes(q))
      .slice(0, maxItems);
  }, [options, query, maxItems]);

  const exact = options.some((o) => o.label.toLowerCase() === query.toLowerCase());
  const showCreate = !!onCreate && query.length > 0 && !exact;
  const rowCount = filtered.length + (showCreate ? 1 : 0);

  function close() {
    setOpen(false);
    setActive(0);
  }

  function pick(option: AutocompleteOption) {
    onChange(option.label);
    onPick?.(option);
    close();
  }

  async function pickCreate() {
    if (!onCreate || creating) return;
    setCreating(true);
    const created = await onCreate(query);
    setCreating(false);
    if (created) pick(created);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(rowCount - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (!open || rowCount === 0) return;
      e.preventDefault();
      if (active < filtered.length) pick(filtered[active]);
      else if (showCreate) void pickCreate();
    } else if (e.key === "Escape") {
      close();
    }
  }

  return (
    <div className={cn("relative", className)}>
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      )}
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(close, 130);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        className={cn(INPUT_CLS, Icon && "pl-9")}
      />

      <AnimatePresence>
        {open && rowCount > 0 && (
          <motion.ul
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute z-40 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-border/70 bg-surface-1/95 p-1 shadow-xl backdrop-blur-xl"
            // Evita que el blur cierre antes del click.
            onMouseDown={(e) => e.preventDefault()}
          >
            {filtered.map((o, i) => (
              <li key={o.id ?? o.label}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    active === i ? "bg-accent/10 text-fg" : "text-muted hover:bg-surface-2/60",
                  )}
                >
                  <span className="min-w-0 truncate text-fg">
                    <Highlight label={o.label} query={query} />
                  </span>
                  {o.sublabel && (
                    <span className="shrink-0 truncate text-[11px] text-muted">{o.sublabel}</span>
                  )}
                </button>
              </li>
            ))}

            {showCreate && (
              <li>
                <button
                  type="button"
                  onMouseEnter={() => setActive(filtered.length)}
                  onClick={() => void pickCreate()}
                  disabled={creating}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    active === filtered.length ? "bg-accent/10" : "hover:bg-surface-2/60",
                  )}
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-accent/15 text-accent">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 truncate text-accent">
                    {creating ? "Creando…" : <>Crear <span className="font-semibold">&ldquo;{query}&rdquo;</span>{createNoun ? ` como nuevo ${createNoun}` : ""}</>}
                  </span>
                </button>
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
