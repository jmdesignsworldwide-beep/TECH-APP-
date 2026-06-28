"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Superficie de vidrio premium reutilizable (glassmorphism sutil + sombras en
 * capas). Base visual para tarjetas, paneles y modales del sistema.
 */
export const GlassPanel = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }
>(function GlassPanel({ className, glow, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "glass rounded-2xl shadow-glass",
        glow && "shadow-glow",
        className,
      )}
      {...props}
    />
  );
});
