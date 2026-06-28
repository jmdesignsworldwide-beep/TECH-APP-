"use client";

import { ChevronRight } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PulseBadge } from "@/components/ui/pulse-badge";
import { CONDITION_LABELS } from "@/lib/inventory/fields";
import type { Product } from "@/lib/inventory/types";
import { cn, formatRD } from "@/lib/utils";

/** Tarjeta de producto del inventario. Clic → detalle premium. */
export function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  const low = product.stock <= product.minStock;

  return (
    <button onClick={onClick} className="group block w-full text-left">
      <GlassPanel className="relative h-full overflow-hidden p-4 transition-shadow duration-500 hover:shadow-glow">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-surface-2/70 px-2 py-0.5 text-[11px] font-medium capitalize text-accent">
            {product.brand}
          </span>
          {low && <PulseBadge tone="danger" />}
        </div>

        <p className="mt-2.5 line-clamp-2 text-sm font-semibold text-fg">
          {product.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {product.category}
          {product.condition !== "nuevo" && (
            <> · {CONDITION_LABELS[product.condition] ?? product.condition}</>
          )}
        </p>

        <div className="mt-3 flex items-end justify-between">
          <span className="text-lg font-semibold tracking-tight text-fg tnum">
            {formatRD(product.price)}
          </span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-xs font-semibold tnum",
              low ? "bg-danger/15 text-danger" : "bg-surface-2/70 text-muted",
            )}
          >
            {product.stock} uds
          </span>
        </div>

        <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100" />
      </GlassPanel>
    </button>
  );
}
