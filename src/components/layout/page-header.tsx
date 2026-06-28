import { cn } from "@/lib/utils";

/** Encabezado de página estándar: título fuerte + subtítulo + acciones. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-prose text-sm text-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
