export interface SeriesPoint {
  label: string;
  total: number;
}

export interface TopProductRow {
  name: string;
  qty: number;
  revenue: number;
}

export interface EmployeeRow {
  name: string;
  total: number;
  count: number;
}

export interface MethodRow {
  method: string;
  label: string;
  total: number;
}

export interface LowStockRow {
  name: string;
  stock: number;
  minStock: number;
}

export interface ReportsData {
  // KPIs
  totalSales: number;
  salesCount: number;
  ticketAvg: number;
  unitsSold: number;
  // Series por período
  byDay: SeriesPoint[];   // últimos 14 días
  byWeek: SeriesPoint[];  // últimas 8 semanas
  byMonth: SeriesPoint[]; // últimos 6 meses
  // Desgloses
  topProducts: TopProductRow[];
  byEmployee: EmployeeRow[];
  byMethod: MethodRow[];
  lowStock: LowStockRow[];
  // Indicadores operativos
  lowStockCount: number;
  expiringWarranties: number;
  pendingOrders: number;
  // Inteligencia calculada
  bestDay: { label: string; total: number } | null;
}

export interface ReportsBundle {
  celulares: ReportsData;
  electronicas: ReportsData;
  source: "supabase" | "sample";
}
