import type { Product } from "./types";
import type { InventoryBundle, InventoryData } from "./types";

/** Catálogo dominicano de demo (espejo del seed SQL) para modo sin Supabase. */
const SUPPLIERS = [
  "Importadora Caribe Tech",
  "Distribuidora La Sirena Móvil",
  "TecnoStore RD",
  "Mayorista Duarte",
  "Electro Importaciones SRL",
];

function p(i: number, x: Omit<Product, "id" | "active" | "imageUrl">): Product {
  return { id: `sample-${x.profileType}-${i}`, active: true, imageUrl: null, ...x };
}

const celulares: Product[] = [
  ["iPhone 15 Pro Max 256GB", "Apple", "Celulares/Smartphones", "CEL-IP15PM-256", 89900, 74000, 6, 4, "Titanio Natural", { storage: "256GB", ram: "8GB", network: "5G", imei: "356789104567890" }],
  ["iPhone 15 128GB", "Apple", "Celulares/Smartphones", "CEL-IP15-128", 62500, 51000, 9, 4, "Negro", { storage: "128GB", ram: "6GB", network: "5G", imei: "356789104111222" }],
  ["iPhone 13 128GB", "Apple", "Celulares/Smartphones", "CEL-IP13-128", 41900, 33500, 3, 5, "Azul", { storage: "128GB", ram: "4GB", network: "5G", imei: "356789103333444" }],
  ["Samsung Galaxy S24 Ultra", "Samsung", "Celulares/Smartphones", "CEL-SGS24U", 78500, 64000, 5, 4, "Gris Titanio", { storage: "512GB", ram: "12GB", network: "5G", imei: "356789105555666" }],
  ["Samsung Galaxy A15", "Samsung", "Celulares/Smartphones", "CEL-SGA15", 12900, 9500, 14, 6, "Azul Claro", { storage: "128GB", ram: "6GB", network: "4G", imei: "356789106666777" }],
  ["Xiaomi Redmi Note 13 Pro", "Xiaomi", "Celulares/Smartphones", "CEL-XRN13P", 18900, 14200, 2, 5, "Verde", { storage: "256GB", ram: "8GB", network: "5G", imei: "356789107777888" }],
  ["Motorola Moto G84", "Motorola", "Celulares/Smartphones", "CEL-MG84", 14500, 10800, 11, 6, "Azul", { storage: "256GB", ram: "12GB", network: "5G", imei: "356789108888999" }],
  ["AirPods Pro 2da Gen", "Apple", "Auriculares/AirPods", "CEL-APP2", 14900, 11000, 8, 5, "Blanco", { storage: "", ram: "", network: "", imei: "" }],
  ["Cargador USB-C 30W", "Anker", "Cargadores/Cables", "CEL-ANK30", 1850, 1100, 4, 10, "Blanco", { storage: "", ram: "", network: "", imei: "" }],
  ["Forro iPhone 15 Pro Max", "Spigen", "Cases/Fundas", "CEL-SPG15PM", 1290, 650, 25, 8, "Transparente", { storage: "", ram: "", network: "", imei: "" }],
].map(([name, brand, category, sku, price, cost, stock, minStock, color, attributes], i) =>
  p(i, {
    profileType: "celulares",
    name: name as string,
    brand: brand as string,
    model: name as string,
    category: category as string,
    sku: sku as string,
    color: color as string,
    condition: "nuevo",
    price: price as number,
    cost: cost as number,
    stock: stock as number,
    minStock: minStock as number,
    supplier: SUPPLIERS[i % SUPPLIERS.length],
    warrantyMonths: 12,
    entryDate: null,
    attributes: attributes as Record<string, string>,
  }),
);

const electronicas: Product[] = [
  ["MacBook Air M2 13\"", "Apple", "Laptops/Computadoras", "ELE-MBAM2", 74900, 61000, 4, 3, "Medianoche", { voltage: "Dual", serial_number: "C02ABC123", specs: "M2, 8GB RAM, 256GB SSD, 13.6\"" }],
  ["Laptop Dell Inspiron 15", "Dell", "Laptops/Computadoras", "ELE-DELL15", 38900, 31000, 7, 4, "Plata", { voltage: "Dual", serial_number: "DL-558899", specs: "i5, 16GB RAM, 512GB SSD, 15.6\"" }],
  ["Laptop HP Pavilion 14", "HP", "Laptops/Computadoras", "ELE-HP14", 33500, 26500, 2, 4, "Plata", { voltage: "Dual", serial_number: "HP-221144", specs: "i5, 8GB RAM, 512GB SSD, 14\"" }],
  ["Smart TV LG 55\" 4K", "LG", "TVs/Smart TV", "ELE-LGTV55", 36900, 29000, 5, 3, "Negro", { voltage: "110V", serial_number: "LG-TV5599", specs: "55\", 4K UHD, webOS" }],
  ["Smart TV Samsung 65\" QLED", "Samsung", "TVs/Smart TV", "ELE-SSTV65", 58900, 47000, 3, 3, "Negro", { voltage: "110V", serial_number: "SS-TV6510", specs: "65\", QLED 4K, Tizen" }],
  ["PlayStation 5 Slim", "Sony", "Consolas", "ELE-PS5S", 32900, 27000, 6, 4, "Blanco", { voltage: "110V", serial_number: "PS5-998877", specs: "1TB SSD, mando DualSense" }],
  ["Xbox Series X", "Microsoft", "Consolas", "ELE-XBSX", 31500, 25800, 1, 3, "Negro", { voltage: "110V", serial_number: "XB-445566", specs: "1TB SSD, 4K 120fps" }],
  ["Monitor Samsung 27\" 144Hz", "Samsung", "Monitores", "ELE-SM27", 14900, 11200, 9, 5, "Negro", { voltage: "110V", serial_number: "SM-27144", specs: "27\", 144Hz, 1ms" }],
  ["Impresora Epson EcoTank", "Epson", "Impresoras", "ELE-EPSET", 13900, 10500, 8, 5, "Negro", { voltage: "110V", serial_number: "EP-ET2400", specs: "Multifunción, tinta continua" }],
  ["Bocina JBL Charge 5", "JBL", "Sonido/Bocinas", "ELE-JBLC5", 8900, 6400, 3, 6, "Azul", { voltage: "Dual", serial_number: "JBL-C5123", specs: "Bluetooth, IP67, 20h" }],
].map(([name, brand, category, sku, price, cost, stock, minStock, color, attributes], i) =>
  p(i, {
    profileType: "electronicas",
    name: name as string,
    brand: brand as string,
    model: name as string,
    category: category as string,
    sku: sku as string,
    color: color as string,
    condition: "nuevo",
    price: price as number,
    cost: cost as number,
    stock: stock as number,
    minStock: minStock as number,
    supplier: SUPPLIERS[i % SUPPLIERS.length],
    warrantyMonths: 12,
    entryDate: null,
    attributes: attributes as Record<string, string>,
  }),
);

function statsOf(products: Product[]): InventoryData {
  const active = products.filter((p) => p.active);
  return {
    products: active,
    stats: {
      totalProducts: active.length,
      inventoryValue: active.reduce((s, p) => s + p.cost * p.stock, 0),
      lowStockCount: active.filter((p) => p.stock <= p.minStock).length,
    },
  };
}

export function buildSampleInventory(): InventoryBundle {
  return {
    celulares: statsOf(celulares),
    electronicas: statsOf(electronicas),
    source: "sample",
  };
}
