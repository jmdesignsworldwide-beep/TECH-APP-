import type { Repair, RepairsBundle } from "./types";

const isoAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

const cel: Repair[] = [
  { id: "r1", profileType: "celulares", orderNumber: "REP-CEL-1001", customerName: "José Manuel Polanco", device: "iPhone 13", identifier: "356938035111001", problem: "No carga, posible pin de carga dañado", budget: 3500, technician: 'Ramón "El Técnico" Castillo', status: "recibido", notes: null, createdAt: isoAgo(1), history: [{ status: "recibido", at: isoAgo(1) }] },
  { id: "r2", profileType: "celulares", orderNumber: "REP-CEL-1002", customerName: "María Altagracia Reyes", device: "Samsung Galaxy S22", identifier: "356938035111002", problem: "Pantalla rota, cambio de display", budget: 6800, technician: 'Ramón "El Técnico" Castillo', status: "en_revision", notes: null, createdAt: isoAgo(3), history: [{ status: "recibido", at: isoAgo(3) }, { status: "en_revision", at: isoAgo(2) }] },
  { id: "r3", profileType: "celulares", orderNumber: "REP-CEL-1003", customerName: "Ramón Emilio Castillo", device: "Xiaomi Redmi Note 12", identifier: "356938035111003", problem: "Se apaga solo, revisar batería", budget: 2400, technician: "Anyelo Reparaciones", status: "reparando", notes: null, createdAt: isoAgo(5), history: [{ status: "recibido", at: isoAgo(5) }, { status: "en_revision", at: isoAgo(4) }, { status: "reparando", at: isoAgo(2) }] },
  { id: "r4", profileType: "celulares", orderNumber: "REP-CEL-1004", customerName: "Yokasta Fernández", device: "iPhone 12", identifier: "356938035111004", problem: "No da señal, cambio de antena", budget: 4200, technician: 'Ramón "El Técnico" Castillo', status: "listo", notes: null, createdAt: isoAgo(7), history: [{ status: "recibido", at: isoAgo(7) }, { status: "reparando", at: isoAgo(4) }, { status: "listo", at: isoAgo(1) }] },
  { id: "r5", profileType: "celulares", orderNumber: "REP-CEL-1005", customerName: "Wellington Peña", device: "Motorola Moto G84", identifier: "356938035111005", problem: "Cámara trasera no enfoca", budget: 1800, technician: "Anyelo Reparaciones", status: "entregado", notes: null, createdAt: isoAgo(14), history: [{ status: "recibido", at: isoAgo(14) }, { status: "listo", at: isoAgo(9) }, { status: "entregado", at: isoAgo(8) }] },
];

const ele: Repair[] = [
  { id: "r6", profileType: "electronicas", orderNumber: "REP-ELE-2001", customerName: "María Altagracia Reyes", device: 'Smart TV Samsung 55"', identifier: "SN-SAMS-TV-88120", problem: "No enciende, fuente de poder", budget: 5500, technician: "Franklin Diagnóstico", status: "recibido", notes: null, createdAt: isoAgo(2), history: [{ status: "recibido", at: isoAgo(2) }] },
  { id: "r7", profileType: "electronicas", orderNumber: "REP-ELE-2002", customerName: "Ramón Emilio Castillo", device: "PlayStation 5", identifier: "SN-PS5-552201", problem: "Se sobrecalienta y se apaga", budget: 4800, technician: "Franklin Diagnóstico", status: "diagnosticando", notes: null, createdAt: isoAgo(4), history: [{ status: "recibido", at: isoAgo(4) }, { status: "diagnosticando", at: isoAgo(3) }] },
  { id: "r8", profileType: "electronicas", orderNumber: "REP-ELE-2003", customerName: "Yokasta Fernández", device: "Laptop HP Pavilion", identifier: "SN-HP-LAP-33019", problem: "No da video, posible GPU", budget: 7200, technician: "Servicio Técnico Bonao", status: "reparando", notes: null, createdAt: isoAgo(6), history: [{ status: "recibido", at: isoAgo(6) }, { status: "diagnosticando", at: isoAgo(5) }, { status: "reparando", at: isoAgo(3) }] },
  { id: "r9", profileType: "electronicas", orderNumber: "REP-ELE-2004", customerName: "Wellington Peña", device: 'Monitor LG 27"', identifier: "SN-LG-MON-77450", problem: "Píxeles muertos, cambio de panel", budget: 3900, technician: "Franklin Diagnóstico", status: "listo", notes: null, createdAt: isoAgo(8), history: [{ status: "recibido", at: isoAgo(8) }, { status: "reparando", at: isoAgo(4) }, { status: "listo", at: isoAgo(1) }] },
];

export const SAMPLE_REPAIRS: RepairsBundle = {
  celulares: cel,
  electronicas: ele,
  source: "sample",
};
