import { deriveState } from "./derive";
import type { Warranty, WarrantiesBundle } from "./types";

const dateIn = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const isoAgo = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

type Seed = Omit<Warranty, "state" | "daysLeft">;

function make(s: Seed): Warranty {
  const daysLeft = Math.ceil(
    (new Date(s.expiresAt + "T00:00:00").getTime() - Date.now()) / 86_400_000,
  );
  return { ...s, daysLeft, state: deriveState(s.dbStatus, daysLeft) };
}

const cel: Warranty[] = [
  make({ id: "w1", profileType: "celulares", warrantyNumber: "GAR-CEL-001", productName: "iPhone 15 Pro Max 256GB", customerName: "José Manuel Polanco", serial: "356938035643809", sellerName: "Wandy Manuel Ureña", months: 12, startsAt: dateIn(-20), expiresAt: dateIn(345), dbStatus: "vigente", claimReason: null, claimResolution: null, claimedAt: null }),
  make({ id: "w2", profileType: "celulares", warrantyNumber: "GAR-CEL-002", productName: "Samsung Galaxy S24 Ultra", customerName: "María Altagracia Reyes", serial: "356938035643810", sellerName: "Estarlin de Jesús Pérez", months: 12, startsAt: dateIn(-350), expiresAt: dateIn(15), dbStatus: "vigente", claimReason: null, claimResolution: null, claimedAt: null }),
  make({ id: "w3", profileType: "celulares", warrantyNumber: "GAR-CEL-003", productName: "Xiaomi Redmi Note 13 Pro", customerName: "Ramón Emilio Castillo", serial: "356938035643811", sellerName: "Wandy Manuel Ureña", months: 6, startsAt: dateIn(-200), expiresAt: dateIn(8), dbStatus: "vigente", claimReason: null, claimResolution: null, claimedAt: null }),
  make({ id: "w4", profileType: "celulares", warrantyNumber: "GAR-CEL-004", productName: "iPhone 13 128GB", customerName: "Yokasta Fernández", serial: "356938035643812", sellerName: "Estarlin de Jesús Pérez", months: 12, startsAt: dateIn(-400), expiresAt: dateIn(-35), dbStatus: "vencida", claimReason: null, claimResolution: null, claimedAt: null }),
  make({ id: "w5", profileType: "celulares", warrantyNumber: "GAR-CEL-005", productName: "iPhone 15 128GB", customerName: "Wellington Peña", serial: "356938035643813", sellerName: "Wandy Manuel Ureña", months: 12, startsAt: dateIn(-120), expiresAt: dateIn(245), dbStatus: "reclamada", claimReason: "Pantalla con líneas verdes", claimResolution: "cambio", claimedAt: isoAgo(10) }),
  make({ id: "w6", profileType: "celulares", warrantyNumber: "GAR-CEL-006", productName: "Motorola Moto G84", customerName: "Anyelina Jiménez", serial: "356938035643814", sellerName: "Massiel Carolina Abreu", months: 12, startsAt: dateIn(-5), expiresAt: dateIn(360), dbStatus: "vigente", claimReason: null, claimResolution: null, claimedAt: null }),
];

const ele: Warranty[] = [
  make({ id: "w7", profileType: "electronicas", warrantyNumber: "GAR-ELE-001", productName: "Smart TV LG OLED 65\"", customerName: "María Altagracia Reyes", serial: "SN-LG-9920341", sellerName: "Yefri Alexander Núñez", months: 24, startsAt: dateIn(-30), expiresAt: dateIn(700), dbStatus: "vigente", claimReason: null, claimResolution: null, claimedAt: null }),
  make({ id: "w8", profileType: "electronicas", warrantyNumber: "GAR-ELE-002", productName: "Sony WH-1000XM5", customerName: "Ramón Emilio Castillo", serial: "SN-SONY-771182", sellerName: "Geraldine Mercedes Lora", months: 12, startsAt: dateIn(-355), expiresAt: dateIn(10), dbStatus: "vigente", claimReason: null, claimResolution: null, claimedAt: null }),
  make({ id: "w9", profileType: "electronicas", warrantyNumber: "GAR-ELE-003", productName: "Impresora HP LaserJet", customerName: "Yokasta Fernández", serial: "SN-HP-5512093", sellerName: "Yefri Alexander Núñez", months: 12, startsAt: dateIn(-410), expiresAt: dateIn(-45), dbStatus: "vencida", claimReason: null, claimResolution: null, claimedAt: null }),
  make({ id: "w10", profileType: "electronicas", warrantyNumber: "GAR-ELE-004", productName: "Epson EcoTank L3250", customerName: "Wellington Peña", serial: "SN-EPSON-220045", sellerName: "Geraldine Mercedes Lora", months: 12, startsAt: dateIn(-90), expiresAt: dateIn(275), dbStatus: "reclamada", claimReason: "No enciende tras 2 meses", claimResolution: "reparación", claimedAt: isoAgo(6) }),
  make({ id: "w11", profileType: "electronicas", warrantyNumber: "GAR-ELE-005", productName: "Samsung Monitor 27\"", customerName: "José Manuel Polanco", serial: "SN-SAMS-330871", sellerName: "Franklin José Disla", months: 24, startsAt: dateIn(-2), expiresAt: dateIn(728), dbStatus: "vigente", claimReason: null, claimResolution: null, claimedAt: null }),
];

export const SAMPLE_WARRANTIES: WarrantiesBundle = {
  celulares: cel,
  electronicas: ele,
  source: "sample",
};
