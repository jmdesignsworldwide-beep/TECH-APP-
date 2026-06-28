import { cn } from "@/lib/utils";

/** Logo/wordmark de JM Tech. El monograma late con el acento activo. */
export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/40 bg-surface-2/70 shadow-glow-sm">
        <span className="absolute inset-0 rounded-xl bg-accent/15 blur-sm" />
        <span className="relative text-sm font-bold tracking-tight text-accent">
          JM
        </span>
      </span>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-fg">
            JM Tech
          </p>
          <p className="text-[11px] text-muted">Sistema de gestión</p>
        </div>
      )}
    </div>
  );
}
