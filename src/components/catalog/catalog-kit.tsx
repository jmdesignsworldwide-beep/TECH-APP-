"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ListTree, PanelLeftClose, X } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import type { CategoryNode, TreeSelection } from "@/lib/catalog/types";
import type { ProfileType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryNav, CategoryNavTitle } from "./category-nav";

/**
 * Kit compartido del árbol de catálogo: una sola fuente para POS e Inventario.
 * Encapsula la columna colapsable (escritorio), el panel deslizable (móvil), el
 * botón de colapsar/abrir y el breadcrumb. El árbol en sí es <CategoryNav>.
 */

/** Estado colapsado recordado por módulo (clave distinta para POS/Inventario). */
export function useNavCollapsed(storageKey: string) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(storageKey) === "1");
    } catch {
      /* sin storage */
    }
  }, [storageKey]);
  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* sin storage */
      }
      return next;
    });
  }
  return { collapsed, toggle };
}

/** Botones de cabecera: abrir (móvil) y colapsar/expandir (escritorio). */
export function CatalogToggle({
  collapsed,
  onToggleDesktop,
  onOpenMobile,
}: {
  collapsed: boolean;
  onToggleDesktop: () => void;
  onOpenMobile: () => void;
}) {
  return (
    <>
      <button
        onClick={onOpenMobile}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border/70 bg-surface-2/50 text-fg transition-colors hover:border-accent/60 hover:text-accent lg:hidden"
        aria-label="Abrir catálogo"
      >
        <ListTree className="h-[18px] w-[18px]" />
      </button>
      <button
        onClick={onToggleDesktop}
        className="hidden h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border/70 bg-surface-2/50 px-3 text-sm text-muted transition-colors hover:border-accent/60 hover:text-accent lg:inline-flex"
        aria-label="Mostrar u ocultar catálogo"
      >
        {collapsed ? (
          <ListTree className="h-[18px] w-[18px]" />
        ) : (
          <PanelLeftClose className="h-[18px] w-[18px]" />
        )}
        Catálogo
      </button>
    </>
  );
}

/** Columna del catálogo (escritorio), colapsable. */
export function CatalogPanel({
  profile,
  categories,
  selection,
  onSelect,
  onCollapse,
}: {
  profile: ProfileType;
  categories: CategoryNode[];
  selection: TreeSelection;
  onSelect: (category: string | null, brand: string | null) => void;
  onCollapse: () => void;
}) {
  return (
    <GlassPanel className="hidden w-56 shrink-0 flex-col p-3 lg:flex lg:sticky lg:top-20 lg:max-h-[calc(100dvh-7rem)]">
      <div className="mb-2 flex items-center justify-between">
        <CategoryNavTitle />
        <button
          onClick={onCollapse}
          className="text-muted transition-colors hover:text-accent"
          aria-label="Ocultar catálogo"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>
      <CategoryNav
        profile={profile}
        categories={categories}
        selection={selection}
        onSelect={onSelect}
      />
    </GlassPanel>
  );
}

/** Panel deslizable del catálogo (móvil). */
export function CatalogDrawer({
  open,
  onClose,
  profile,
  categories,
  selection,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  profile: ProfileType;
  categories: CategoryNode[];
  selection: TreeSelection;
  onSelect: (category: string | null, brand: string | null) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="glass fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-[320px] flex-col p-4 shadow-glass-lg lg:hidden"
            initial={reduce ? { opacity: 0 } : { x: "-100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "-100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <CategoryNavTitle />
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 text-muted"
                aria-label="Cerrar catálogo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CategoryNav
              profile={profile}
              categories={categories}
              selection={selection}
              onSelect={(c, b) => {
                onSelect(c, b);
                onClose();
              }}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/** Breadcrumb del nivel activo + conteo + limpiar. */
export function CatalogBreadcrumb({
  selection,
  search,
  count,
  onClear,
}: {
  selection: TreeSelection;
  search: string;
  count: number;
  onClear: () => void;
}) {
  const label = search.trim()
    ? `Buscando “${search.trim()}”`
    : selection.brand
      ? `${selection.category} › ${selection.brand}`
      : (selection.category ?? "Todas");
  const canClear = !search.trim() && (selection.category || selection.brand);
  return (
    <div className="mb-3 flex items-center gap-2 text-sm">
      <span className="min-w-0 truncate font-medium text-fg">{label}</span>
      <span className="shrink-0 text-muted tnum">· {count}</span>
      {canClear && (
        <button
          onClick={onClear}
          className="ml-auto inline-flex shrink-0 items-center gap-1 text-accent hover:underline"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </button>
      )}
    </div>
  );
}
