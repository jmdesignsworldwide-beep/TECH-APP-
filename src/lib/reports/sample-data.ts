import type { ReportsBundle, ReportsData } from "./types";

const cel: ReportsData = {
  totalSales: 487600,
  salesCount: 38,
  ticketAvg: 12832,
  unitsSold: 54,
  byDay: [18, 12, 24, 9, 31, 22, 14, 28, 19, 35, 26, 17, 30, 23].map((v, i) => ({ label: `${i + 1}/6`, total: v * 1000 })),
  byWeek: [78, 92, 65, 110, 88, 124, 96, 134].map((v, i) => ({ label: `sem ${i + 1}`, total: v * 1000 })),
  byMonth: [320, 410, 365, 480, 520, 487].map((v, i) => ({ label: ["ene", "feb", "mar", "abr", "may", "jun"][i], total: v * 1000 })),
  topProducts: [
    { name: "iPhone 15 Pro Max 256GB", qty: 9, revenue: 809100 },
    { name: "Samsung Galaxy A15", qty: 8, revenue: 103200 },
    { name: "AirPods Pro 2da Gen", qty: 7, revenue: 104300 },
    { name: "Xiaomi Redmi Note 13 Pro", qty: 6, revenue: 113400 },
    { name: "Motorola Moto G84", qty: 5, revenue: 72500 },
    { name: "Forro iPhone 15 Pro Max", qty: 12, revenue: 15480 },
  ],
  byEmployee: [
    { name: "Wandy Manuel Ureña", total: 184000, count: 16 },
    { name: "Estarlin de Jesús Pérez", total: 142000, count: 11 },
    { name: "Massiel Carolina Abreu", total: 86000, count: 7 },
  ],
  byMethod: [
    { method: "efectivo", label: "Efectivo", total: 214000 },
    { method: "transferencia", label: "Transferencia", total: 138000 },
    { method: "debito", label: "Débito", total: 92000 },
    { method: "credito", label: "Crédito", total: 43600 },
  ],
  lowStock: [
    { name: "iPhone 13 128GB", stock: 3, minStock: 5 },
    { name: "Xiaomi Redmi Note 13 Pro", stock: 2, minStock: 5 },
    { name: "Cargador USB-C 30W", stock: 4, minStock: 10 },
  ],
  lowStockCount: 3,
  expiringWarranties: 2,
  pendingOrders: 2,
  bestDay: { label: "viernes", total: 134000 },
};

const ele: ReportsData = {
  totalSales: 742300,
  salesCount: 29,
  ticketAvg: 25600,
  unitsSold: 41,
  byDay: [22, 31, 18, 44, 27, 38, 25, 49, 33, 41, 29, 52, 36, 45].map((v, i) => ({ label: `${i + 1}/6`, total: v * 1000 })),
  byWeek: [120, 145, 98, 178, 156, 198, 167, 210].map((v, i) => ({ label: `sem ${i + 1}`, total: v * 1000 })),
  byMonth: [580, 640, 590, 720, 810, 742].map((v, i) => ({ label: ["ene", "feb", "mar", "abr", "may", "jun"][i], total: v * 1000 })),
  topProducts: [
    { name: "Smart TV LG OLED 65\"", qty: 6, revenue: 870000 },
    { name: "PlayStation 5 Slim", qty: 5, revenue: 194500 },
    { name: "Laptop HP Pavilion 15", qty: 4, revenue: 110000 },
    { name: "Monitor LG 27\"", qty: 7, revenue: 98000 },
    { name: "Impresora Epson L3250", qty: 5, revenue: 66000 },
    { name: "Sony WH-1000XM5", qty: 4, revenue: 84000 },
  ],
  byEmployee: [
    { name: "Yefri Alexander Núñez", total: 312000, count: 14 },
    { name: "Geraldine Mercedes Lora", total: 268000, count: 9 },
    { name: "Franklin José Disla", total: 124000, count: 6 },
  ],
  byMethod: [
    { method: "transferencia", label: "Transferencia", total: 318000 },
    { method: "efectivo", label: "Efectivo", total: 196000 },
    { method: "credito", label: "Crédito", total: 142000 },
    { method: "debito", label: "Débito", total: 86300 },
  ],
  lowStock: [
    { name: "PlayStation 5 Slim", stock: 2, minStock: 4 },
    { name: "Smart TV Samsung 50\"", stock: 1, minStock: 3 },
  ],
  lowStockCount: 2,
  expiringWarranties: 1,
  pendingOrders: 2,
  bestDay: { label: "sábado", total: 210000 },
};

export const SAMPLE_REPORTS: ReportsBundle = {
  celulares: cel,
  electronicas: ele,
  source: "sample",
};
