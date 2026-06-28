import type { Order, OrdersBundle } from "./types";

const isoAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const isoIn = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

type Seed = Omit<Order, "balance">;
const mk = (s: Seed): Order => ({ ...s, balance: Math.max(0, s.total - s.deposit) });

const cel: Order[] = [
  mk({ id: "o1", profileType: "celulares", customerName: "José Manuel Polanco", itemDesc: "iPhone 15 Pro Max 256GB Titanio Natural", status: "pendiente", total: 89900, deposit: 30000, supplier: "Importadora TecnoRD", note: "Cliente quiere el color titanio", createdAt: isoAgo(2), expectedAt: isoIn(5), history: [{ status: "pendiente", at: isoAgo(2) }] }),
  mk({ id: "o2", profileType: "celulares", customerName: "María Altagracia Reyes", itemDesc: "Samsung Galaxy S24 Ultra 512GB", status: "en_proceso", total: 62500, deposit: 25000, supplier: "Distribuidora Caribe", note: null, createdAt: isoAgo(4), expectedAt: isoIn(2), history: [{ status: "pendiente", at: isoAgo(4) }, { status: "en_proceso", at: isoAgo(1) }] }),
  mk({ id: "o3", profileType: "celulares", customerName: "Ramón Emilio Castillo", itemDesc: "AirPods Pro 2da Gen", status: "llego", total: 14900, deposit: 14900, supplier: "Importadora TecnoRD", note: "Avisar al cliente que ya llegó", createdAt: isoAgo(6), expectedAt: isoAgo(1), history: [{ status: "pendiente", at: isoAgo(6) }, { status: "en_proceso", at: isoAgo(3) }, { status: "llego", at: isoAgo(1) }] }),
  mk({ id: "o4", profileType: "celulares", customerName: "Yokasta Fernández", itemDesc: "Samsung Galaxy A15 128GB", status: "entregado", total: 12900, deposit: 12900, supplier: "Distribuidora Caribe", note: null, createdAt: isoAgo(12), expectedAt: isoAgo(6), history: [{ status: "pendiente", at: isoAgo(12) }, { status: "llego", at: isoAgo(7) }, { status: "entregado", at: isoAgo(6) }] }),
];

const ele: Order[] = [
  mk({ id: "o5", profileType: "electronicas", customerName: "Wellington Peña", itemDesc: 'Smart TV LG OLED 65" C4', status: "pendiente", total: 145000, deposit: 50000, supplier: "Mayorista Electro Santo Domingo", note: "Entrega a domicilio en Santiago", createdAt: isoAgo(1), expectedAt: isoIn(8), history: [{ status: "pendiente", at: isoAgo(1) }] }),
  mk({ id: "o6", profileType: "electronicas", customerName: "Anyelina Jiménez", itemDesc: "PlayStation 5 Slim + 2do control", status: "en_proceso", total: 38900, deposit: 15000, supplier: "Importadora TecnoRD", note: null, createdAt: isoAgo(5), expectedAt: isoIn(3), history: [{ status: "pendiente", at: isoAgo(5) }, { status: "en_proceso", at: isoAgo(2) }] }),
  mk({ id: "o7", profileType: "electronicas", customerName: "José Manuel Polanco", itemDesc: "Laptop HP Pavilion 15 i7 16GB", status: "llego", total: 27500, deposit: 10000, supplier: "Mayorista Electro Santo Domingo", note: "Cliente pasa el viernes", createdAt: isoAgo(9), expectedAt: isoAgo(2), history: [{ status: "pendiente", at: isoAgo(9) }, { status: "en_proceso", at: isoAgo(5) }, { status: "llego", at: isoAgo(2) }] }),
];

export const SAMPLE_ORDERS: OrdersBundle = {
  celulares: cel,
  electronicas: ele,
  source: "sample",
};
