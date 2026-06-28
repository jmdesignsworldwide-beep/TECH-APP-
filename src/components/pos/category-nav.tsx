"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, LayoutGrid, Plus, Tag } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import { addBrand, addCategory } from "@/lib/catalog/actions";
import type { CategoryNode, TreeSelection } from "@/lib/catalog/types";
import type { ProfileType } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Árbol de navegación Categoría → Marca. "Todas" para ver todo. Acordeón
 * elegante con counts reales, ítem activo con glow del acento, y "＋ Agregar"
 * para crear categoría o marca (rol admin). Contenido reutilizable: el panel de
 * escritorio y el drawer móvil lo envuelven.
 */
export function CategoryNav({
  profile,
  categories,
  selection,
  onSelect,
}: {
  profile: ProfileType;
  categories: CategoryNode[];
  selection: TreeSelection;
  onSelect: (category: string | null, brand: string | null) => void;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState<string | null>(selection.category);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<"categoria" | "marca">("categoria");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allActive = !selection.category && !selection.brand;

  function toggle(cat: string) {
    setExpanded((e) => (e === cat ? null : cat));
    onSelect(cat, null);
  }

  async function submitAdd() {
    setBusy(true);
    setError(null);
    const res =
      addType === "categoria"
        ? await addCategory(profile, name)
        : await addBrand(profile, selection.category ?? "", name);
    setBusy(false);
    if (res.ok) {
      setName("");
      setAddOpen(false);
      router.refresh();
    } else {
      setError(res.error ?? "No se pudo guardar.");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {/* Todas */}
        <button
          onClick={() => {
            onSelect(null, null);
            setExpanded(null);
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
            allActive
              ? "bg-accent text-accent-fg shadow-glow-sm"
              : "text-fg hover:bg-surface-2/60",
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          Todas
        </button>

        {categories.map((cat) => {
          const isOpen = expanded === cat.name;
          const catSelected =
            selection.category === cat.name && !selection.brand;
          return (
            <div key={cat.name}>
              <button
                onClick={() => toggle(cat.name)}
                className={cn(
                  "group flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  catSelected
                    ? "bg-accent/15 text-accent"
                    : "text-fg hover:bg-surface-2/60",
                )}
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-muted transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {cat.name}
                </span>
                <span className="shrink-0 text-xs text-muted tnum">
                  {cat.count}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && cat.brands.length > 0 && (
                  <motion.div
                    initial={reduce ? undefined : { height: 0, opacity: 0 }}
                    animate={reduce ? undefined : { height: "auto", opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/50 pl-2 py-0.5">
                      {cat.brands.map((b) => {
                        const active =
                          selection.category === cat.name &&
                          selection.brand === b.name;
                        return (
                          <button
                            key={b.name}
                            onClick={() => onSelect(cat.name, b.name)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                              active
                                ? "bg-accent text-accent-fg shadow-glow-sm"
                                : "text-muted hover:bg-surface-2/60 hover:text-fg",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {b.name}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 text-[11px] tnum",
                                active ? "text-accent-fg/80" : "text-muted/70",
                              )}
                            >
                              {b.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Agregar */}
      <div className="border-t border-border/60 pt-2">
        {addOpen ? (
          <div className="space-y-2 rounded-lg border border-border/60 bg-surface-2/40 p-2.5">
            <div className="flex overflow-hidden rounded-lg border border-border/70 text-xs">
              {(["categoria", "marca"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAddType(t)}
                  className={cn(
                    "flex-1 px-2 py-1.5 capitalize transition-colors",
                    addType === t
                      ? "bg-accent text-accent-fg"
                      : "bg-surface-2/50 text-muted",
                  )}
                >
                  {t === "categoria" ? "Categoría" : "Marca"}
                </button>
              ))}
            </div>
            {addType === "marca" && (
              <p className="text-[11px] text-muted">
                {selection.category
                  ? `En: ${selection.category}`
                  : "Elige una categoría primero."}
              </p>
            )}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
              placeholder={addType === "categoria" ? "Nueva categoría" : "Nueva marca"}
              autoFocus
              className="w-full rounded-lg border border-border/70 bg-surface-2/60 px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent/70"
            />
            {error && <p className="text-[11px] text-danger">{error}</p>}
            <div className="flex justify-end gap-1.5">
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddOpen(false);
                  setError(null);
                }}
                disabled={busy}
              >
                Cancelar
              </PremiumButton>
              <PremiumButton
                size="sm"
                onClick={submitAdd}
                loading={busy}
                disabled={
                  !name.trim() ||
                  (addType === "marca" && !selection.category)
                }
              >
                Guardar
              </PremiumButton>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setAddType(selection.category ? "marca" : "categoria");
              setAddOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-surface-2/60 hover:text-accent"
          >
            <Plus className="h-4 w-4" />
            Agregar categoría o marca
          </button>
        )}
      </div>
    </div>
  );
}

/** Pequeño icono usado en cabeceras del panel. */
export function CategoryNavTitle() {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
      <Tag className="h-4 w-4 text-accent" />
      Catálogo
    </span>
  );
}
