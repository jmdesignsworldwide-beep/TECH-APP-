import type { LucideIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PulseBadge } from "@/components/ui/pulse-badge";
import { PageHeader } from "./page-header";

/**
 * Placeholder premium para módulos que se construyen en tandas futuras.
 * Mantiene la sensación de organismo conectado en vez de un 404 frío.
 */
export function ComingSoon({
  title,
  icon: Icon,
  note,
}: {
  title: string;
  icon: LucideIcon;
  note?: string;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={title}
        subtitle={note ?? "Este módulo se construye en una próxima tanda."}
      />
      <GlassPanel className="mt-6 flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-accent/30 bg-surface-2/60 text-accent shadow-glow-sm">
          <span className="absolute inset-0 rounded-2xl bg-accent/10 blur-md" />
          <Icon className="relative h-7 w-7" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-lg font-semibold text-fg">En camino</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            La fundación ya está lista. {title} se cuelga de aquí sin rehacer
            nada.
          </p>
        </div>
        <PulseBadge tone="accent">Próxima tanda</PulseBadge>
      </GlassPanel>
    </div>
  );
}
