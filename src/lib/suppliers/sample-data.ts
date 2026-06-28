import type { Supplier, SuppliersBundle } from "./types";

const dateAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);

const mk = (s: Omit<Supplier, "totalPurchased">): Supplier => ({
  ...s,
  totalPurchased: s.purchases.reduce((a, p) => a + p.amount, 0),
});

const cel: Supplier[] = [
  mk({ id: "sp1", profileType: "celulares", name: "Importadora TecnoRD", contact: "Luis Manuel Pichardo", phone: "809-565-1200", email: "ventas@tecnord.com.do", supplies: "iPhone, Samsung, accesorios", notes: null, isActive: true, purchases: [{ desc: "Lote 20x iPhone 15", amount: 1480000, date: dateAgo(12), status: "recibido" }, { desc: "50x AirPods Pro", amount: 550000, date: dateAgo(5), status: "recibido" }, { desc: "Lote fundas y cristales", amount: 95000, date: dateAgo(2), status: "en_camino" }] }),
  mk({ id: "sp2", profileType: "celulares", name: "Distribuidora Caribe", contact: "Carmen Rosario", phone: "829-540-3344", email: "compras@caribedist.do", supplies: "Xiaomi, Motorola, cargadores", notes: null, isActive: true, purchases: [{ desc: "30x Redmi Note 13", amount: 420000, date: dateAgo(9), status: "recibido" }, { desc: "40x Motorola G84", amount: 460000, date: dateAgo(3), status: "recibido" }] }),
  mk({ id: "sp3", profileType: "celulares", name: "AccesoriosExpress SRL", contact: "Frank Disla", phone: "809-771-8890", email: "info@accesoriosexpress.do", supplies: "Fundas, cristales, cables", notes: null, isActive: true, purchases: [{ desc: "Surtido de accesorios", amount: 78000, date: dateAgo(7), status: "recibido" }] }),
];

const ele: Supplier[] = [
  mk({ id: "sp4", profileType: "electronicas", name: "Mayorista Electro Santo Domingo", contact: "Pedro Ant. Guerrero", phone: "809-689-2100", email: "ventas@electrosd.do", supplies: "TV, laptops, consolas", notes: null, isActive: true, purchases: [{ desc: "10x Smart TV LG OLED", amount: 980000, date: dateAgo(14), status: "recibido" }, { desc: "15x Laptop HP Pavilion", amount: 330000, date: dateAgo(6), status: "recibido" }, { desc: "8x PS5 Slim", amount: 240000, date: dateAgo(1), status: "en_camino" }] }),
  mk({ id: "sp5", profileType: "electronicas", name: "Global Tech Importaciones", contact: "Anabel Reyes", phone: "829-602-7755", email: "compras@globaltech.do", supplies: "Monitores, impresoras, audio", notes: null, isActive: true, purchases: [{ desc: "20x Monitor LG 27\"", amount: 280000, date: dateAgo(10), status: "recibido" }, { desc: "12x Impresora Epson", amount: 132000, date: dateAgo(4), status: "recibido" }] }),
  mk({ id: "sp6", profileType: "electronicas", name: "Sonido y Video RD", contact: "Wilkin Abreu", phone: "849-330-4567", email: "ventas@sonidovideord.do", supplies: "Bocinas, audífonos, soportes", notes: null, isActive: true, purchases: [{ desc: "Lote audio Sony/JBL", amount: 210000, date: dateAgo(8), status: "recibido" }] }),
];

export const SAMPLE_SUPPLIERS: SuppliersBundle = {
  celulares: cel,
  electronicas: ele,
  source: "sample",
};
