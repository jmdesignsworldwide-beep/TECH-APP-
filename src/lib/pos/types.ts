import type { ProfileType } from "@/lib/types";
import type { PaymentMethod } from "./payment-methods";

/** Una línea del carrito (en el cliente). */
export interface CartLine {
  productId: string;
  name: string;
  price: number;
  stock: number;
  qty: number;
}

/** Un pago dentro de una venta (pago mixto = varios). */
export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  tendered?: number;
  reference?: string;
}

/** Lo que el cliente envía al servidor para cobrar. */
export interface CheckoutInput {
  profile: ProfileType;
  customerId: string | null;
  items: { product_id: string; qty: number }[];
  payments: PaymentEntry[];
  discount: number;
  generatesWarranty: boolean;
  fiscal: boolean;
}

/** Resultado del cobro (lo que devuelve la función de base). */
export interface CheckoutResult {
  saleId: string;
  ncf: string;
  ncfType: string;
  subtotal: number;
  itbis: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
}

export interface SaleItemRow {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SalePaymentRow {
  method: string;
  amount: number;
}

/** Una venta del historial (con detalle). */
export interface SaleRecord {
  id: string;
  profileType: ProfileType;
  folio: string; // NCF o id corto
  ncfType: string | null;
  total: number;
  subtotal: number;
  itbis: number;
  discount: number;
  paymentMethod: string;
  status: "completada" | "anulada";
  seller: string;
  customer: string | null;
  soldAt: string;
  voidReason: string | null;
  generatesWarranty: boolean;
  items: SaleItemRow[];
  payments: SalePaymentRow[];
}

export interface SalesBundle {
  celulares: SaleRecord[];
  electronicas: SaleRecord[];
  source: "supabase" | "sample";
}
