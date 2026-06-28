"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Package, Plus, Search, Wallet, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  KpiCard,
  PremiumButton,
  PremiumModal,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { useProfile } from "@/lib/profile/profile-provider";
import { PROFILE_META } from "@/lib/types";
import { CATEGORIES } from "@/lib/inventory/categories";
import { CONDITION_LABELS } from "@/lib/inventory/fields";
import {
  createProduct,
  setProductActive,
  updateProduct,
} from "@/lib/inventory/actions";
import type {
  InventoryBundle,
  Product,
  ProductInput,
} from "@/lib/inventory/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";
import { ProductDetail } from "./product-detail";
import { ProductForm } from "./product-form";

type Modal =
  | { kind: "none" }
  | { kind: "detail"; product: Product }
  | { kind: "form"; product?: Product }
  | { kind: "confirm"; product: Product };

const CONDITIONS = ["nuevo", "usado", "reacondicionado", "exhibicion"];

export function InventoryView({ bundle }: { bundle: InventoryBundle }) {
  const router = useRouter();
  const { profile } = useProfile();
  const data = bundle[profile];
  const meta = PROFILE_META[profile];

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const [modal, setModal] = useState<Modal>({ kind: "none" });
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Al cambiar de perfil, las categorías cambian: limpiamos filtros.
  useEffect(() => {
    setSearch("");
    setCategory("");
    setCondition("");
    setLowOnly(false);
  }, [profile]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.model ?? ""} ${p.sku ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (category && p.category !== category) return false;
      if (condition && p.condition !== condition) return false;
      if (lowOnly && !(p.stock <= p.minStock)) return false;
      return true;
    });
  }, [data.products, search, category, condition, lowOnly]);

  function close() {
    setModal({ kind: "none" });
    setActionError(null);
  }

  async function handleSubmit(input: ProductInput) {
    setSubmitting(true);
    setActionError(null);
    const existing = modal.kind === "form" ? modal.product : undefined;
    const res = existing
      ? await updateProduct(existing.id, input)
      : await createProduct(input);
    setSubmitting(false);
    if (res.ok) {
      close();
      router.refresh();
    } else {
      setActionError(res.error ?? "No se pudo guardar.");
    }
  }

  async function handleDeactivate() {
    if (modal.kind !== "confirm") return;
    setSubmitting(true);
    setActionError(null);
    const res = await setProductActive(modal.product.id, false);
    setSubmitting(false);
    if (res.ok) {
      close();
      router.refresh();
    } else {
      setActionError(res.error ?? "No se pudo desactivar.");
    }
  }

  const hasFilters = search || category || condition || lowOnly;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Inventario"
        subtitle={
          <>
            Productos de{" "}
            <span className="font-medium text-fg">{meta.label}</span> —{" "}
            {meta.tagline}.
            {bundle.source === "sample" && (
              <span className="ml-1 text-muted/70">Datos demo.</span>
            )}
          </>
        }
        actions={
          <PremiumButton size="sm" onClick={() => setModal({ kind: "form" })}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </PremiumButton>
        }
      />

      {/* Stats */}
      <Stagger
        key={profile}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <StaggerItem>
          <KpiCard label="Productos" value={data.stats.totalProducts} icon={Package} suffix="activos" />
        </StaggerItem>
        <StaggerItem>
          <KpiCard label="Valor del inventario" value={data.stats.inventoryValue} icon={Wallet} currency />
        </StaggerItem>
        <StaggerItem>
          <KpiCard label="Bajo stock" value={data.stats.lowStockCount} icon={Boxes} suffix="productos" />
        </StaggerItem>
      </Stagger>

      {/* Buscar + filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, marca o código…"
            className="w-full rounded-xl border border-border/70 bg-surface-2/50 py-2.5 pl-10 pr-3 text-sm text-fg outline-none transition-colors placeholder:text-muted/50 focus:border-accent/70"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70"
          >
            <option value="">Categoría</option>
            {CATEGORIES[profile].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm capitalize text-fg outline-none focus:border-accent/70"
          >
            <option value="">Estado</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
          <button
            onClick={() => setLowOnly((v) => !v)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
              lowOnly
                ? "border-danger/50 bg-danger/10 text-danger"
                : "border-border/70 bg-surface-2/50 text-muted hover:text-fg",
            )}
          >
            Bajo stock
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="tnum">
          {filtered.length} de {data.products.length} productos
        </span>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setCategory("");
              setCondition("");
              setLowOnly(false);
            }}
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length ? (
        <Stagger
          key={`${profile}-${filtered.length}-${search}-${category}-${condition}-${lowOnly}`}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {filtered.map((p) => (
            <StaggerItem key={p.id}>
              <ProductCard
                product={p}
                onClick={() => setModal({ kind: "detail", product: p })}
              />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <Package className="h-8 w-8 text-muted/50" />
          <p className="mt-3 text-sm font-medium text-fg">Sin productos</p>
          <p className="mt-1 text-sm text-muted">
            {hasFilters
              ? "Ningún producto coincide con los filtros."
              : "Crea el primer producto de este perfil."}
          </p>
        </div>
      )}

      {/* Detalle */}
      <PremiumModal
        open={modal.kind === "detail"}
        onClose={close}
        title={modal.kind === "detail" ? modal.product.name : ""}
        description={
          modal.kind === "detail"
            ? `${modal.product.brand}${modal.product.model && modal.product.model !== modal.product.name ? ` · ${modal.product.model}` : ""}`
            : undefined
        }
        size="lg"
      >
        {modal.kind === "detail" && (
          <ProductDetail
            product={modal.product}
            busy={submitting}
            onEdit={() => setModal({ kind: "form", product: modal.product })}
            onToggleActive={() =>
              setModal({ kind: "confirm", product: modal.product })
            }
          />
        )}
      </PremiumModal>

      {/* Crear / Editar */}
      <PremiumModal
        open={modal.kind === "form"}
        onClose={close}
        title={
          modal.kind === "form" && modal.product
            ? "Editar producto"
            : "Nuevo producto"
        }
        description={`Perfil ${meta.label} · los campos se ajustan al perfil`}
        size="lg"
      >
        {modal.kind === "form" && (
          <ProductForm
            profile={profile}
            product={modal.product}
            submitting={submitting}
            error={actionError}
            onSubmit={handleSubmit}
            onCancel={close}
          />
        )}
      </PremiumModal>

      {/* Confirmar desactivación */}
      <PremiumModal
        open={modal.kind === "confirm"}
        onClose={close}
        title="Desactivar producto"
        description="No se borra: se oculta del inventario y no rompe ventas históricas."
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={close} disabled={submitting}>
              Cancelar
            </PremiumButton>
            <PremiumButton
              size="sm"
              onClick={handleDeactivate}
              loading={submitting}
              className="bg-danger text-white"
            >
              Desactivar
            </PremiumButton>
          </div>
        }
      >
        {modal.kind === "confirm" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              ¿Seguro que deseas desactivar{" "}
              <span className="font-medium text-fg">{modal.product.name}</span>?
            </p>
            {actionError && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {actionError}
              </p>
            )}
          </div>
        )}
      </PremiumModal>
    </div>
  );
}
