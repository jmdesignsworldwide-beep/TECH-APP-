import type { ProfileSuggestions, SuggestionBundle } from "./types";

const lbl = (labels: string[]) => labels.map((label) => ({ label }));

const cel: ProfileSuggestions = {
  customers: [
    { id: "c1", label: "José Manuel Polanco", sublabel: "001-1234567-8" },
    { id: "c2", label: "María Altagracia Reyes", sublabel: "002-7654321-9" },
    { id: "c3", label: "Ramón Emilio Castillo", sublabel: "003-2468135-7" },
    { id: "c4", label: "Yokasta Fernández", sublabel: "001-9988776-5" },
  ],
  products: lbl([
    "iPhone 15 Pro Max 256GB",
    "iPhone 15 128GB",
    "Samsung Galaxy S24 Ultra",
    "Samsung Galaxy A15",
    "Xiaomi Redmi Note 13 Pro",
    "Motorola Moto G84",
    "AirPods Pro 2da Gen",
  ]),
  suppliers: [
    { id: "sp1", label: "Importadora TecnoRD" },
    { id: "sp2", label: "Distribuidora Caribe" },
    { id: "sp3", label: "AccesoriosExpress SRL" },
  ],
  brands: lbl(["Apple", "Samsung", "Xiaomi", "Motorola", "Anker", "Spigen"]),
  categories: lbl(["Smartphone", "Accesorio"]),
  technicians: lbl(["Pedro Alberto Guzmán", "Wandy Manuel Ureña", "Estarlin de Jesús Pérez", "Massiel Carolina Abreu"]),
};

const ele: ProfileSuggestions = {
  customers: [
    { id: "c5", label: "Wellington Peña", sublabel: "002-1122334-6" },
    { id: "c6", label: "Anyelina Jiménez", sublabel: "003-5566778-9" },
    { id: "c7", label: "Francisco Alberto Mejía", sublabel: "001-3344556-7" },
  ],
  products: lbl([
    'Smart TV LG OLED 65"',
    "PlayStation 5 Slim",
    "Laptop HP Pavilion 15",
    'Monitor LG 27"',
    "Impresora Epson L3250",
    "Sony WH-1000XM5",
  ]),
  suppliers: [
    { id: "sp4", label: "Mayorista Electro Santo Domingo" },
    { id: "sp5", label: "Global Tech Importaciones" },
    { id: "sp6", label: "Sonido y Video RD" },
  ],
  brands: lbl(["LG", "Sony", "HP", "Samsung", "Epson", "PlayStation"]),
  categories: lbl(["Televisor", "Consola", "Laptop", "Monitor", "Impresora", "Audio"]),
  technicians: lbl(["Ramón Antonio Then", "Yefri Alexander Núñez", "Geraldine Mercedes Lora", "Franklin José Disla"]),
};

export const SAMPLE_SUGGESTIONS: SuggestionBundle = {
  celulares: cel,
  electronicas: ele,
  source: "sample",
};
