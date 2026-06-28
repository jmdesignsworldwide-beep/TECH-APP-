import type { DashboardBundle, DashboardData, TrendPoint } from "./types";

/**
 * Datos semilla dominicanos para el MODO DEMO (sin Supabase). Deterministas
 * para no romper la hidratación: se calculan en el servidor y se pasan como
 * props. Reflejan el mismo espíritu que el seed SQL (supabase/seed).
 */

const DAY_LABELS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** Construye las etiquetas de los últimos 7 días terminando HOY. */
function trendFrom(totals: number[], now: Date): TrendPoint[] {
  return totals.map((total, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (totals.length - 1 - i));
    return { label: DAY_LABELS[d.getDay()], total };
  });
}

export function buildSampleBundle(now: Date = new Date()): DashboardBundle {
  const celulares: DashboardData = {
    profile: "celulares",
    salesToday: 247800,
    itbisToday: 37800,
    ticketAvg: 17700,
    unitsSoldToday: 21,
    topProduct: { name: "iPhone 15 Pro Max 256GB", units: 4 },
    lowStockCount: 4,
    pendingOrdersCount: 3,
    expiringWarrantiesCount: 4,
    trend: trendFrom(
      [132000, 168500, 145000, 201000, 176400, 220000, 247800],
      now,
    ),
    payments: [
      { method: "efectivo", total: 96000 },
      { method: "tarjeta", total: 102800 },
      { method: "transferencia", total: 49000 },
    ],
    salesTodayList: [
      { id: "c1", customer: "José Manuel Polanco", total: 89900, method: "tarjeta", time: "10:24" },
      { id: "c2", customer: "Yokasta Fernández", total: 12900, method: "efectivo", time: "11:05" },
      { id: "c3", customer: "Wellington Peña", total: 41900, method: "transferencia", time: "12:38" },
      { id: "c4", customer: "Anyelina Jiménez", total: 16190, method: "efectivo", time: "13:52" },
      { id: "c5", customer: "Rosanna Bautista", total: 62500, method: "tarjeta", time: "15:17" },
      { id: "c6", customer: "Junior de la Cruz", total: 14500, method: "efectivo", time: "16:40" },
    ],
    lowStockList: [
      { id: "p1", name: "iPhone 13 128GB", brand: "Apple", stock: 3, minStock: 5 },
      { id: "p2", name: "Xiaomi Redmi Note 13 Pro", brand: "Xiaomi", stock: 2, minStock: 5 },
      { id: "p3", name: "Cargador USB-C 30W", brand: "Anker", stock: 4, minStock: 10 },
      { id: "p4", name: "Samsung Galaxy S24 Ultra", brand: "Samsung", stock: 5, minStock: 4 },
    ],
    pendingOrders: [
      { id: "o1", customer: "José Manuel Polanco", total: 89900, status: "pendiente", age: "hoy" },
      { id: "o2", customer: "Carolina Santana", total: 56700, status: "pendiente", age: "hace 1 día" },
      { id: "o3", customer: "Ramón Emilio Castillo", total: 78500, status: "en_proceso", age: "hace 2 días" },
    ],
    expiringWarranties: [
      { id: "w1", product: "iPhone 15 Pro Max 256GB", customer: "José Manuel Polanco", daysLeft: 6 },
      { id: "w2", product: "Samsung Galaxy S24 Ultra", customer: "Rosanna Bautista", daysLeft: 12 },
      { id: "w3", product: "iPhone 15 128GB", customer: "Yokasta Fernández", daysLeft: 19 },
      { id: "w4", product: "AirPods Pro 2da Gen", customer: "Junior de la Cruz", daysLeft: 27 },
    ],
  };

  const electronicas: DashboardData = {
    profile: "electronicas",
    salesToday: 318600,
    itbisToday: 48600,
    ticketAvg: 35400,
    unitsSoldToday: 9,
    topProduct: { name: "PlayStation 5 Slim", units: 3 },
    lowStockCount: 4,
    pendingOrdersCount: 2,
    expiringWarrantiesCount: 3,
    trend: trendFrom(
      [210000, 245000, 198000, 286000, 230500, 295000, 318600],
      now,
    ),
    payments: [
      { method: "efectivo", total: 88600 },
      { method: "tarjeta", total: 150000 },
      { method: "transferencia", total: 80000 },
    ],
    salesTodayList: [
      { id: "e1", customer: "Francisco Alberto Mejía", total: 74900, method: "tarjeta", time: "09:48" },
      { id: "e2", customer: "Carolina Santana", total: 32900, method: "efectivo", time: "11:30" },
      { id: "e3", customer: "Ramón Emilio Castillo", total: 58900, method: "transferencia", time: "13:12" },
      { id: "e4", customer: "María Altagracia Reyes", total: 36900, method: "tarjeta", time: "14:55" },
      { id: "e5", customer: "Wellington Peña", total: 14900, method: "efectivo", time: "16:20" },
    ],
    lowStockList: [
      { id: "q1", name: "Laptop HP Pavilion 14", brand: "HP", stock: 2, minStock: 4 },
      { id: "q2", name: "Xbox Series X", brand: "Microsoft", stock: 1, minStock: 3 },
      { id: "q3", name: "Bocina JBL Charge 5", brand: "JBL", stock: 3, minStock: 6 },
      { id: "q4", name: "Smart TV Samsung 65\" QLED", brand: "Samsung", stock: 3, minStock: 3 },
    ],
    pendingOrders: [
      { id: "r1", customer: "Carolina Santana", total: 65800, status: "pendiente", age: "hoy" },
      { id: "r2", customer: "Francisco Alberto Mejía", total: 36900, status: "pendiente", age: "hace 1 día" },
    ],
    expiringWarranties: [
      { id: "v1", product: "MacBook Air M2 13\"", customer: "Francisco Alberto Mejía", daysLeft: 3 },
      { id: "v2", product: "PlayStation 5 Slim", customer: "Carolina Santana", daysLeft: 18 },
      { id: "v3", product: "Smart TV Samsung 65\" QLED", customer: "María Altagracia Reyes", daysLeft: 25 },
    ],
  };

  return { celulares, electronicas, source: "sample" };
}
