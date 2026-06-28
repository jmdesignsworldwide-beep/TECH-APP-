import type { ProfileType } from "@/lib/types";

/** Una venta resumida para el desglose de "Ventas de hoy". */
export interface SaleRow {
  id: string;
  customer: string;
  total: number;
  method: "efectivo" | "tarjeta" | "transferencia";
  /** Hora local "HH:MM". */
  time: string;
}

export interface LowStockRow {
  id: string;
  name: string;
  brand: string;
  stock: number;
  minStock: number;
}

export interface OrderRow {
  id: string;
  customer: string;
  total: number;
  status: "pendiente" | "en_proceso" | "completado" | "cancelado";
  /** Etiqueta legible, p. ej. "hace 2 días". */
  age: string;
}

export interface WarrantyRow {
  id: string;
  product: string;
  customer: string;
  daysLeft: number;
}

export interface TrendPoint {
  /** Etiqueta corta del día, p. ej. "lun". */
  label: string;
  total: number;
}

export interface PaymentSlice {
  method: "efectivo" | "tarjeta" | "transferencia";
  total: number;
}

/** Todo lo que el Dashboard necesita para un perfil. */
export interface DashboardData {
  profile: ProfileType;
  salesToday: number;
  itbisToday: number;
  ticketAvg: number;
  unitsSoldToday: number;
  topProduct: { name: string; units: number } | null;
  lowStockCount: number;
  pendingOrdersCount: number;
  expiringWarrantiesCount: number;
  trend: TrendPoint[];
  payments: PaymentSlice[];
  salesTodayList: SaleRow[];
  lowStockList: LowStockRow[];
  pendingOrders: OrderRow[];
  expiringWarranties: WarrantyRow[];
}

/** Datos para ambos perfiles + de dónde vienen. */
export interface DashboardBundle {
  celulares: DashboardData;
  electronicas: DashboardData;
  source: "supabase" | "sample";
}
