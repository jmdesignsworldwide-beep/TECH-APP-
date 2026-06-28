"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  LayoutGrid,
  List,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PremiumButton } from "@/components/ui/premium-button";
import { PremiumModal } from "@/components/ui/premium-modal";
import { CountUp } from "@/components/ui/count-up";
import { CATEGORIES } from "@/lib/inventory/categories";
import { CONDITION_LABELS } from "@/lib/inventory/fields";
import type { Product } from "@/lib/inventory/types";
import type { Customer } from "@/lib/customers/types";
import type { CartLine } from "@/lib/pos/types";
import type { ProfileType } from "@/lib/types";
import { cn, formatRD } from "@/lib/utils";
import { CheckoutModal } from "./checkout-modal";
import { CustomerPicker } from "./customer-picker";
import { ProductThumb } from "./product-thumb";
import { QuoteDoc } from "./quote-doc";

const CONDITIONS = ["nuevo", "usado", "reacondicionado", "exhibicion"];

export function Register({
  profile,
  products,
  customers: initialCustomers,
  seller,
}: {
  profile: ProfileType;
  products: Product[];
  customers: Customer[];
  seller: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [lines, setLines] = useState<CartLine[]>([]);
  const [discountInput, setDiscountInput] = useState("");
  const [discountUnit, setDiscountUnit] = useState<"RD$" | "%">("RD$");

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    setCategory("");
    setBrand("");
    setCondition("");
    setLowOnly(false);
  }, [profile]);

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products],
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => p.stock > 0)
      .filter((p) => (category ? p.category === category : true))
      .filter((p) => (brand ? p.brand === brand : true))
      .filter((p) => (condition ? p.condition === condition : true))
      .filter((p) => (lowOnly ? p.stock <= p.minStock : true))
      .filter((p) =>
        q ? `${p.name} ${p.brand} ${p.sku ?? ""}`.toLowerCase().includes(q) : true,
      )
      .slice(0, 60);
  }, [products, search, category, brand, condition, lowOnly]);

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

  const categoryChips = ["", ...CATEGORIES[profile]];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Buscar + filtros + resultados */}
      <div className="lg:col-span-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto por nombre, marca o código…"
            autoFocus
            className="w-full rounded-xl border border-border/70 bg-surface-2/50 py-3 pl-10 pr-3 text-sm text-fg outline-none transition-colors placeholder:text-muted/50 focus:border-accent/70"
          />
        </div>

        {/* Categorías (chips) */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryChips.map((c) => (
            <button
              key={c || "todas"}
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === c
                  ? "border-accent/50 bg-accent text-accent-fg"
                  : "border-border/60 bg-surface-2/50 text-muted hover:text-fg",
              )}
            >
              {c || "Todas"}
            </button>
          ))}
        </div>

        {/* Filtros + vista */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="rounded-lg border border-border/70 bg-surface-2/50 px-2.5 py-2 text-xs text-fg outline-none focus:border-accent/70"
          >
            <option value="">Marca</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
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

        {/* Resultados */}
        {view === "grid" ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
                          low ? "bg-danger/15 text-danger" : "bg-surface-2/70 text-muted",
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
          <div className="mt-3 space-y-1.5">
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
                      <p className="truncate text-sm font-medium text-fg">{p.name}</p>
                      <p className="truncate text-xs text-muted">
                        {p.brand} · {CONDITION_LABELS[p.condition] ?? p.condition}
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

      {/* Carrito */}
      <div className="lg:col-span-2">
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
                      <Stepper onClick={() => setQty(l.productId, l.qty - 1)} disabled={l.qty <= 1}>
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

          {/* Descuento + totales */}
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
