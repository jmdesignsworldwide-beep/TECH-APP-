"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PremiumButton } from "@/components/ui/premium-button";
import { CountUp } from "@/components/ui/count-up";
import type { Product } from "@/lib/inventory/types";
import type { CartLine } from "@/lib/pos/types";
import type { ProfileType } from "@/lib/types";
import { cn, formatRD } from "@/lib/utils";
import { CheckoutModal } from "./checkout-modal";

export function Register({
  profile,
  products,
  seller,
}: {
  profile: ProfileType;
  products: Product[];
  seller: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [discountInput, setDiscountInput] = useState("");
  const [discountUnit, setDiscountUnit] = useState<"RD$" | "%">("RD$");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = products.filter((p) => p.stock > 0);
    if (!q) return base.slice(0, 24);
    return base
      .filter((p) =>
        `${p.name} ${p.brand} ${p.sku ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 24);
  }, [products, search]);

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
        l.productId === id
          ? { ...l, qty: Math.max(1, Math.min(qty, l.stock)) }
          : l,
      ),
    );
  }
  function remove(id: string) {
    setLines((prev) => prev.filter((l) => l.productId !== id));
  }

  function onSold() {
    setLines([]);
    setDiscountInput("");
    setCheckoutOpen(false);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Buscar + resultados */}
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

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {results.map((p) => {
            const inCart = lines.find((l) => l.productId === p.id);
            const maxed = inCart && inCart.qty >= p.stock;
            return (
              <button
                key={p.id}
                onClick={() => add(p)}
                disabled={!!maxed}
                className="group text-left disabled:opacity-50"
              >
                <GlassPanel className="h-full p-3 transition-shadow duration-300 hover:shadow-glow">
                  <p className="line-clamp-2 text-sm font-medium text-fg">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{p.brand}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-fg tnum">
                      {formatRD(p.price)}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px] tnum",
                        p.stock <= p.minStock
                          ? "bg-danger/15 text-danger"
                          : "bg-surface-2/70 text-muted",
                      )}
                    >
                      {p.stock}
                    </span>
                  </div>
                </GlassPanel>
              </button>
            );
          })}
          {!results.length && (
            <p className="col-span-full py-8 text-center text-sm text-muted">
              Sin productos con stock que coincidan.
            </p>
          )}
        </div>
      </div>

      {/* Carrito */}
      <div className="lg:col-span-2">
        <GlassPanel className="flex h-full flex-col p-4 lg:sticky lg:top-20">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
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
            {discountAmount > 0 && (
              <Line label="Descuento" value={-discountAmount} />
            )}
            <Line label="ITBIS (18%, incl.)" value={itbis} muted />
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold text-fg">Total</span>
              <span className="text-xl font-bold text-fg">
                <CountUp value={total} format={(n) => formatRD(n)} />
              </span>
            </div>

            <PremiumButton
              size="lg"
              className="mt-1 w-full"
              disabled={!lines.length}
              onClick={() => setCheckoutOpen(true)}
            >
              Cobrar {total > 0 && formatRD(total)}
            </PremiumButton>
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
      />
    </div>
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

function Line({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-muted" : "text-muted"}>{label}</span>
      <span className={cn("tnum", muted ? "text-muted" : "text-fg")}>
        {formatRD(value)}
      </span>
    </div>
  );
}
