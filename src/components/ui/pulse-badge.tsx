import { cn } from "@/lib/utils";

type Tone = "accent" | "warning" | "danger" | "success";

const tones: Record<Tone, { dot: string; ring: string; text: string }> = {
  accent: { dot: "bg-accent", ring: "bg-accent", text: "text-accent-soft" },
  warning: { dot: "bg-warning", ring: "bg-warning", text: "text-warning" },
  danger: { dot: "bg-danger", ring: "bg-danger", text: "text-danger" },
  success: { dot: "bg-success", ring: "bg-success", text: "text-success" },
};

/**
 * Badge/indicador que late — para alertas (bajo stock, garantías por vencer).
 * El anillo pulsante se detiene con prefers-reduced-motion (animación Tailwind).
 */
export function PulseBadge({
  children,
  tone = "accent",
  className,
}: {
  children?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-2/60 px-2.5 py-1 text-xs font-medium",
        t.text,
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-60 animate-pulse-ring",
            t.ring,
          )}
        />
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", t.dot)} />
      </span>
      {children}
    </span>
  );
}
