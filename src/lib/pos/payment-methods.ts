import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export type PaymentMethod =
  | "efectivo"
  | "transferencia"
  | "debito"
  | "credito";

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: LucideIcon;
  /** Pide referencia/voucher (simulado). */
  needsReference?: boolean;
  /** Permite capturar "recibido" para calcular cambio. */
  cash?: boolean;
}[] = [
  { value: "efectivo", label: "Efectivo", icon: Banknote, cash: true },
  { value: "transferencia", label: "Transferencia", icon: ArrowLeftRight, needsReference: true },
  { value: "debito", label: "Débito", icon: CreditCard, needsReference: true },
  { value: "credito", label: "Crédito", icon: Landmark, needsReference: true },
];

export const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
  credito: "Crédito",
  tarjeta: "Tarjeta",
  mixto: "Pago mixto",
};
