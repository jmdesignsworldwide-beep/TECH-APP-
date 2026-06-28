import type { CustomersBundle, CustomerWithStats } from "./types";

const isoAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

const cel: CustomerWithStats[] = [
  { id: "c1", fullName: "José Manuel Polanco", phone: "809-555-0142", cedula: "001-1234567-8", email: "jose.polanco@gmail.com", address: "Calle Duarte #45, Santo Domingo", birthday: "1988-06-12", isActive: true, profileType: "celulares", stats: { totalSpent: 152400, purchaseCount: 4, lastPurchase: isoAgo(3), topProducts: [{ name: "iPhone 15 Pro Max 256GB", qty: 1 }, { name: "AirPods Pro 2da Gen", qty: 2 }] } },
  { id: "c2", fullName: "María Altagracia Reyes", phone: "829-555-0188", cedula: "002-7654321-9", email: "maria.reyes@hotmail.com", address: "Av. 27 de Febrero #120, Santiago", birthday: "1992-06-25", isActive: true, profileType: "celulares", stats: { totalSpent: 78500, purchaseCount: 2, lastPurchase: isoAgo(6), topProducts: [{ name: "Samsung Galaxy S24 Ultra", qty: 1 }] } },
  { id: "c3", fullName: "Ramón Emilio Castillo", phone: "849-555-0123", cedula: "003-2468135-7", email: "ramon.castillo@outlook.com", address: "Calle El Sol #88, La Vega", birthday: "1985-03-04", isActive: true, profileType: "celulares", stats: { totalSpent: 41900, purchaseCount: 3, lastPurchase: isoAgo(10), topProducts: [{ name: "Xiaomi Redmi Note 13 Pro", qty: 1 }, { name: "Forro iPhone", qty: 2 }] } },
  { id: "c4", fullName: "Yokasta Fernández", phone: "809-555-0177", cedula: "001-9988776-5", email: "yokasta.fernandez@gmail.com", address: "Av. Independencia #30, Santo Domingo", birthday: "1990-11-19", isActive: true, profileType: "celulares", stats: { totalSpent: 25800, purchaseCount: 2, lastPurchase: isoAgo(14), topProducts: [{ name: "Samsung Galaxy A15", qty: 2 }] } },
];

const ele: CustomerWithStats[] = [
  { id: "c5", fullName: "Wellington Peña", phone: "829-555-0199", cedula: "002-1122334-6", email: "wellington.pena@gmail.com", address: "Calle Mella #210, San Cristóbal", birthday: "1983-09-08", isActive: true, profileType: "electronicas", stats: { totalSpent: 218000, purchaseCount: 3, lastPurchase: isoAgo(2), topProducts: [{ name: "Smart TV LG OLED 65\"", qty: 1 }, { name: "PlayStation 5", qty: 1 }] } },
  { id: "c6", fullName: "Anyelina Jiménez", phone: "849-555-0166", cedula: "003-5566778-9", email: "anyelina.jimenez@hotmail.com", address: "Av. Las Carreras #15, Bonao", birthday: "1995-06-30", isActive: true, profileType: "electronicas", stats: { totalSpent: 96400, purchaseCount: 2, lastPurchase: isoAgo(5), topProducts: [{ name: "Laptop HP Pavilion 15", qty: 1 }] } },
  { id: "c7", fullName: "Francisco Alberto Mejía", phone: "809-555-0155", cedula: "001-3344556-7", email: "francisco.mejia@outlook.com", address: "Calle Duarte #77, Moca", birthday: "1979-01-22", isActive: true, profileType: "electronicas", stats: { totalSpent: 54900, purchaseCount: 1, lastPurchase: isoAgo(9), topProducts: [{ name: "Monitor LG 27\"", qty: 2 }] } },
];

export const SAMPLE_CUSTOMERS: CustomersBundle = {
  celulares: cel,
  electronicas: ele,
  source: "sample",
};
