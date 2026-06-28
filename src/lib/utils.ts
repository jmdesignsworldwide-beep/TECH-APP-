import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases condicionales resolviendo conflictos de Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un monto en pesos dominicanos (RD$). */
export function formatRD(amount: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
    ...opts,
  }).format(amount);
}
