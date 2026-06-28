import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Aviso de simulación, sutil y elegante (no banner feo). Para usar donde hay
 * NCF/ITBIS, voucher o documentos de ejemplo. Legible en ambos temas.
 */
export function Disclaimer({
  children,
  icon = true,
  className,
}: {
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 rounded-lg border border-warning/20 bg-warning/[0.05] px-2.5 py-1.5 text-[11px] leading-relaxed text-muted",
        className,
      )}
    >
      {icon && <Info className="mt-px h-3 w-3 shrink-0 text-warning/80" />}
      <span>{children}</span>
    </p>
  );
}

/** Frases de simulación reutilizables. */
export const DISCLAIMERS = {
  ncf: "NCF simulado para demostración. No certificado ante la DGII.",
  voucher: "Verificación de pago simulada. Sin integración bancaria.",
  document: "Documento de ejemplo generado para demostración.",
} as const;
