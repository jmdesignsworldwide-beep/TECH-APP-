"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FileText,
  LayoutGrid,
  List,
  ListTree,
  Minus,
  PanelLeftClose,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PremiumButton } from "@/components/ui/premium-button";
import { PremiumModal } from "@/components/ui/premium-modal";
import { CountUp } from "@/components/ui/count-up";
import { CONDITION_LABELS } from "@/lib/inventory/fields";
import type { Product } from "@/lib/inventory/types";
import type { Customer } from "@/lib/customers/types";
import type { CategoryNode, TreeSelection } from "@/lib/catalog/types";
import type { CartLine } from "@/lib/pos/types";
import type { ProfileType } from "@/lib/types";
import { cn, formatRD } from "@/lib/utils";
import { CategoryNav, CategoryNavTitle } from "./category-nav";
import { CheckoutModal } from "./checkout-modal";
import { CustomerPicker } from "./customer-picker";
import { ProductThumb } from "./product-thumb";
import { QuoteDoc } from "./quote-doc";

const CONDITIONS = ["nuevo", "usado", "reacondicionado", "exhibicion"];
const NAV_KEY = "jm-pos-nav-collapsed";

export function Register({
  profile,
  products,
  catalog,
  customers: initialCustomers,
  seller,
}: {
  profile: ProfileType;
  products: Product[];
  catalog: CategoryNode[];
  customers: Customer[];
  seller: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<TreeSelection>({
    category: null,
    brand: null,
  });
  const [condition, setCondition] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [discountInput, setDiscountInput] = useState("");
  const [discountUnit, setDiscountUnit] = useState<"RD$" | "%">("RD$");

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  // Recuerda el estado colapsado del catálogo.
  useEffect(() => {
    try {
      setNavCollapsed(localStorage.getItem(NAV_KEY) === "1");
    } catch {
      /* sin storage */
    }
  }, []);
  function toggleNav() {
    setNavCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(NAV_KEY, next ? "1" : "0");
      } catch {
        /* sin storage */
      }
      return next;
    });
  }

  // Al cambiar de perfil, reinicia la navegación y filtros.
  useEffect(() => {
    setSearch("");
    setSelection({ category: null, brand: null });
    setCondition("");
    setLowOnly(false);
    setMobileNavOpen(false);
  }, [profile]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => p.stock > 0)
      .filter((p) => {
        if (q) {
          // El buscador funciona en paralelo: filtra todo el perfil sin
          // importar el nivel seleccionado del árbol.
          return `${p.name} ${p.brand} ${p.sku ?? ""}`.toLowerCase().includes(q);
        }
        if (selection.category && p.category !== selection.category) return false;
        if (selection.brand && p.brand !== selection.brand) return false;
        return true;
      })
      .filter((p) => (condition ? p.condition === condition : true))
      .filter((p) => (lowOnly ? p.stock <= p.minStock : true))
      .slice(0, 80);
  }, [products, search, selection, condition, lowOnly]);

  const gross = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const discountAmount = useMemo(() => {
    const v = parseFloat(discountInput.replace(/,/g, "")) || 0;
    const amt = discountUnit === "%" ? (gross * v) / 100 : v;
    return Math.min(Math.max(0, amt), gross);
  }, [discountInput, discountUnit, gross]);
  const total = Math.round((gross - discountAmount) * 100) / 100;
  const itbis = Math.round((total - total / 1.18) * 100) / 100;

  function add(p: Product) {
    setLines((prev) => {
      const ex = prev.find((l) => l.productId === p.id);
      if (ex) {
        if (ex.qty >= p.stock) return prev;
        return prev.map((l) =>
          l.productId === p.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, price: p.price, stock: p.stock, qty: 1 },
      ];
    });
  }
  function setQty(id: string, qty: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === id ? { ...l, qty: Math.max(1, Math.min(qty, l.stock)) } : l,
      ),
    );
  }
  function remove(id: string) {
    setLines((prev) => prev.filter((l) => l.productId !== id));
  }

  function onSold() {
    setLines([]);
    setDiscountInput("");
    setCustomer(null);
    setCheckoutOpen(false);
    router.refresh();
  }

  const crumb = search
    ? `Buscando “${search.trim()}”`
    : selection.brand
      ? `${selection.category} › ${selection.brand}`
      : selection.category ?? "Todas";

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado: catálogo + buscador + filtros */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {/* Móvil: abre el catálogo como panel deslizable */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border/70 bg-surface-2/50 text-fg transition-colors hover:border-accent/60 hover:text-accent lg:hidden"
            aria-label="Abrir catálogo"
          >
            <ListTree className="h-[18px] w-[18px]" />
          </button>
          {/* Escritorio: colapsa/expande la columna */}
          <button
            onClick={toggleNav}
            className="hidden h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border/70 bg-surface-2/50 px-3 text-sm text-muted transition-colors hover:border-accent/60 hover:text-accent lg:inline-flex"
            aria-label="Mostrar u ocultar catálogo"
          >
            {navCollapsed ? (
              <ListTree className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
            Catálogo
          </button>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre, marca o código…"
              autoFocus
              className="w-full rounded-xl border border-border/70 bg-surface-2/50 py-3 pl-10 pr-3 text-sm text-fg outline-none transition-colors placeholder:text-muted/50 focus:border-accent/70"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="rounded-lg border border-border/70 bg-surface-2/50 px-2.5 py-2 text-xs capitalize text-fg outline-none focus:border-accent/70"
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
              "rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors",
              lowOnly
                ? "border-danger/50 bg-danger/10 text-danger"
                : "border-border/70 bg-surface-2/50 text-muted hover:text-fg",
            )}
          >
            Bajo stock
          </button>
          <div className="ml-auto flex overflow-hidden rounded-lg border border-border/70">
            <ViewBtn active={view === "grid"} onClick={() => setView("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </ViewBtn>
            <ViewBtn active={view === "list"} onClick={() => setView("list")}>
              <List className="h-4 w-4" />
            </ViewBtn>
          </div>
        </div>
      </div>

      {/* Catálogo | Productos | Carrito */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <div className="flex gap-4">
            {/* Columna de catálogo (escritorio) */}
            {!navCollapsed && (
              <GlassPanel className="hidden w-56 shrink-0 flex-col p-3 lg:flex lg:sticky lg:top-20 lg:max-h-[calc(100dvh-7rem)]">
                <div className="mb-2 flex items-center justify-between">
                  <CategoryNavTitle />
                  <button
                    onClick={toggleNav}
                    className="text-muted transition-colors hover:text-accent"
                    aria-label="Ocultar catálogo"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </div>
                <CategoryNav
                  profile={profile}
                  categories={catalog}
                  selection={selection}
                  onSelect={(c, b) => setSelection({ category: c, brand: b })}
                />
              </GlassPanel>
            )}

            {/* Productos */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2 text-sm">
                <span className="min-w-0 truncate font-medium text-fg">{crumb}</span>
                <span className="shrink-0 text-muted tnum">· {results.length}</span>
                {!search && (selection.category || selection.brand) && (
                  <button
                    onClick={() => setSelection({ category: null, brand: null })}
                    className="ml-auto inline-flex shrink-0 items-center gap-1 text-accent hover:underline"
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpiar
                  </button>
                )}
              </div>

              {view === "grid" ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {results.map((p) => {
                    const inCart = lines.find((l) => l.productId === p.id);
                    const maxed = inCart && inCart.qty >= p.stock;
                    const low = p.stock <= p.minStock;
                    const margin = p.price - p.cost;
                    return (
                      <button
                        key={p.id}
                        onClick={() => add(p)}
                        disabled={!!maxed}
                        className="group text-left disabled:opacity-50"
                      >
                        <GlassPanel className="h-full overflow-hidden p-2.5 transition-shadow duration-300 hover:shadow-glow">
                          <div className="aspect-square w-full">
                            <ProductThumb
                              imageUrl={p.imageUrl}
                              category={p.category}
                              brand={p.brand}
                            />
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs font-medium text-fg">
                            {p.name}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-sm font-semibold text-fg tnum">
                              {formatRD(p.price)}
                            </span>
                            <span
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-[10px] tnum",
                                low
                                  ? "bg-danger/15 text-danger"
                                  : "bg-surface-2/70 text-muted",
                              )}
                            >
                              {p.stock}
                            </span>
                          </div>
                          {margin > 0 && (
                            <p className="mt-0.5 text-[10px] text-success/80 tnum">
                              +{formatRD(margin)} margen
                            </p>
                          )}
                        </GlassPanel>
                      </button>
                    );
                  })}
                  {!results.length && <Empty />}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {results.map((p) => {
                    const inCart = lines.find((l) => l.productId === p.id);
                    const maxed = inCart && inCart.qty >= p.stock;
                    const low = p.stock <= p.minStock;
                    return (
                      <button
                        key={p.id}
                        onClick={() => add(p)}
                        disabled={!!maxed}
                        className="block w-full text-left disabled:opacity-50"
                      >
                        <GlassPanel className="flex items-center gap-3 p-2.5 transition-shadow duration-300 hover:shadow-glow">
                          <div className="h-11 w-11 shrink-0">
                            <ProductThumb
                              imageUrl={p.imageUrl}
                              category={p.category}
                              brand={p.brand}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-fg">
                              {p.name}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {p.brand} ·{" "}
                              {CONDITION_LABELS[p.condition] ?? p.condition}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-fg tnum">
                              {formatRD(p.price)}
                            </p>
                            <p
                              className={cn(
                                "text-[11px] tnum",
                                low ? "text-danger" : "text-muted",
                              )}
                            >
                              {p.stock} uds
                            </p>
                          </div>
                        </GlassPanel>
                      </button>
                    );
                  })}
                  {!results.length && <Empty />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="min-w-0 lg:col-span-2">
          <GlassPanel className="flex h-full flex-col p-4 lg:sticky lg:top-20">
            <CustomerPicker
              customers={customers}
              selected={customer}
              onSelect={setCustomer}
              onCreated={(c) => setCustomers((prev) => [c, ...prev])}
            />

            <div className="mt-3 flex items-center gap-2 border-b border-border/60 pb-3">
              <ShoppingCart className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-fg">Carrito</span>
              <span className="ml-auto text-xs text-muted tnum">
                {lines.reduce((s, l) => s + l.qty, 0)} uds
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto py-3">
              {lines.length ? (
                lines.map((l) => (
                  <div
                    key={l.productId}
                    className="rounded-xl border border-border/50 bg-surface-2/40 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                        {l.name}
                      </p>
                      <button
                        onClick={() => remove(l.productId)}
                        className="shrink-0 text-muted hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Stepper
                          onClick={() => setQty(l.productId, l.qty - 1)}
                          disabled={l.qty <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Stepper>
                        <span className="w-8 text-center text-sm font-medium text-fg tnum">
                          {l.qty}
                        </span>
                        <Stepper
                          onClick={() => setQty(l.productId, l.qty + 1)}
                          disabled={l.qty >= l.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Stepper>
                      </div>
                      <span className="text-sm font-semibold text-fg tnum">
                        {formatRD(l.price * l.qty)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid h-full place-items-center text-center">
                  <p className="text-sm text-muted">El carrito está vacío.</p>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-border/60 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Descuento</span>
                <div className="ml-auto flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="0"
                    className="w-20 rounded-lg border border-border/70 bg-surface-2/60 px-2 py-1 text-right text-sm text-fg outline-none tnum focus:border-accent/70"
                  />
                  <div className="flex overflow-hidden rounded-lg border border-border/70">
                    {(["RD$", "%"] as const).map((u) => (
                      <button
                        key={u}
                        onClick={() => setDiscountUnit(u)}
                        className={cn(
                          "px-2 py-1 text-xs",
                          discountUnit === u
                            ? "bg-accent text-accent-fg"
                            : "bg-surface-2/60 text-muted",
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Line label="Subtotal" value={gross - itbis} />
              {discountAmount > 0 && <Line label="Descuento" value={-discountAmount} />}
              <Line label="ITBIS (18%, incl.)" value={itbis} muted />
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold text-fg">Total</span>
                <span className="text-xl font-bold text-fg">
                  <CountUp value={total} format={(n) => formatRD(n)} />
                </span>
              </div>

              <div className="mt-1 flex gap-2">
                <PremiumButton
                  variant="ghost"
                  size="lg"
                  className="flex-1"
                  disabled={!lines.length}
                  onClick={() => setQuoteOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Cotizar
                </PremiumButton>
                <PremiumButton
                  size="lg"
                  className="flex-[1.6]"
                  disabled={!lines.length}
                  onClick={() => setCheckoutOpen(true)}
                >
                  Cobrar
                </PremiumButton>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Catálogo móvil (panel deslizable) */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
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
                  onClick={() => setMobileNavOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 text-muted"
                  aria-label="Cerrar catálogo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CategoryNav
                profile={profile}
                categories={catalog}
                selection={selection}
                onSelect={(c, b) => {
                  setSelection({ category: c, brand: b });
                  setMobileNavOpen(false);
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={onSold}
        profile={profile}
        lines={lines}
        discount={discountAmount}
        seller={seller}
        customerId={customer?.id ?? null}
        customerName={customer?.fullName ?? null}
        customerPhone={customer?.phone ?? null}
      />

      {/* Cotización */}
      <PremiumModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        title="Cotización"
        description="No descuenta stock"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={() => setQuoteOpen(false)}>
              Cerrar
            </PremiumButton>
            <PremiumButton
              size="sm"
              onClick={() => {
                setQuoteOpen(false);
                setCheckoutOpen(true);
              }}
            >
              Convertir en venta
            </PremiumButton>
          </div>
        }
      >
        <QuoteDoc
          lines={lines}
          discount={discountAmount}
          customer={customer}
          seller={seller}
        />
      </PremiumModal>
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid h-9 w-9 place-items-center transition-colors",
        active ? "bg-accent text-accent-fg" : "bg-surface-2/50 text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function Stepper({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="grid h-6 w-6 place-items-center rounded-md border border-border/70 text-muted transition-colors hover:border-accent/60 hover:text-accent disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Line({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={cn("tnum", muted ? "text-muted" : "text-fg")}>
        {formatRD(value)}
      </span>
    </div>
  );
}

function Empty() {
  return (
    <p className="col-span-full py-8 text-center text-sm text-muted">
      Sin productos con stock que coincidan.
    </p>
  );
}
