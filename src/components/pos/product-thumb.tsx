"use client";

import {
  Boxes,
  Cpu,
  Gamepad2,
  Headphones,
  Laptop,
  Monitor,
  Printer,
  Smartphone,
  Tv,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Icono por categoría (cuando no hay foto). */
function iconFor(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (c.includes("laptop") || c.includes("computad")) return Laptop;
  if (c.includes("monitor")) return Monitor;
  if (c.includes("impres")) return Printer;
  if (c.includes("consola") || c.includes("videojuego")) return Gamepad2;
  if (c.includes("tv")) return Tv;
  if (c.includes("auricular") || c.includes("sonido") || c.includes("audio"))
    return Headphones;
  if (c.includes("smartwatch") || c.includes("wearable")) return Watch;
  if (c.includes("celular") || c.includes("smartphone") || c.includes("tablet"))
    return Smartphone;
  if (c.includes("component") || c.includes("memoria")) return Cpu;
  return Boxes;
}

/**
 * Miniatura de producto: usa `imageUrl` si existe; si no, un tile premium con
 * gradiente del acento + icono por categoría + inicial de marca. Deja la puerta
 * lista para fotos reales (subida en producción).
 */
export function ProductThumb({
  imageUrl,
  category,
  brand,
  className,
}: {
  imageUrl: string | null;
  category: string;
  brand: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={brand}
        className={cn("h-full w-full rounded-xl object-cover", className)}
      />
    );
  }
  const Icon = iconFor(category);
  return (
    <div
      className={cn(
        "relative grid h-full w-full place-items-center overflow-hidden rounded-xl border border-border/50",
        "bg-gradient-to-br from-accent/15 via-surface-2/60 to-surface-2/30",
        className,
      )}
    >
      <Icon className="h-1/2 w-1/2 text-accent/70" strokeWidth={1.25} />
      <span className="absolute bottom-1 right-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted/70">
        {brand.slice(0, 8)}
      </span>
    </div>
  );
}
