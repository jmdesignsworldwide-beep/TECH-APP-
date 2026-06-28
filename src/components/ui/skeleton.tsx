import { cn } from "@/lib/utils";

/**
 * Skeleton loader con barrido (shimmer). Para estados de carga.
 * El shimmer se desactiva con prefers-reduced-motion (vía animación Tailwind).
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-surface-2/70",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-fg/10 after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}
