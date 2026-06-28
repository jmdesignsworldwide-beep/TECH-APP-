import type {
  ActivityEntry,
  Employee,
  EmployeeAlert,
  EmployeeState,
  EmployeesBundle,
} from "./types";

const daysAgo = (d: number, h = 10) =>
  new Date(Date.now() - d * 86_400_000 - h * 3_600_000).toISOString();
const dateAgo = (d: number) =>
  new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);

let seq = 0;
const id = (p: string) => `${p}-${++seq}`;

const emp = (e: Omit<Employee, "id">): Employee => ({ ...e, id: id("emp") });
const act = (a: Omit<ActivityEntry, "id">): ActivityEntry => ({
  ...a,
  id: id("act"),
});

// ── CELULARES ───────────────────────────────────────────────────
const celEmps: Employee[] = [
  emp({ profileType: "celulares", fullName: "Pedro Alberto Guzmán", cedula: "402-1234567-1", phone: "809-555-2201", role: "administrador", username: "pguzman", photoUrl: null, hiredAt: dateAgo(420), isActive: true, notes: null, salary: 55000 }),
  emp({ profileType: "celulares", fullName: "Wandy Manuel Ureña", cedula: "001-1122334-5", phone: "829-555-2202", role: "vendedor", username: "wurena", photoUrl: null, hiredAt: dateAgo(300), isActive: true, notes: null, salary: 28000 }),
  emp({ profileType: "celulares", fullName: "Estarlin de Jesús Pérez", cedula: "223-9988776-3", phone: "849-555-2203", role: "vendedor", username: "eperez", photoUrl: null, hiredAt: dateAgo(180), isActive: true, notes: null, salary: 26000 }),
  emp({ profileType: "celulares", fullName: "Massiel Carolina Abreu", cedula: "031-4455667-8", phone: "809-555-2204", role: "cajero", username: "mabreu", photoUrl: null, hiredAt: dateAgo(150), isActive: true, notes: null, salary: 27000 }),
];
const [celAdmin, celWandy, celEstarlin, celMassiel] = celEmps;

const celActivity: ActivityEntry[] = [
  ...Array.from({ length: 8 }, (_, i) =>
    act({ profileType: "celulares", employeeId: celWandy.id, actorName: celWandy.fullName, action: "venta", entity: "venta", entityRef: `B02${String(1000 + i).padStart(8, "0")}`, detail: `Registró venta por ${(6000 + i * 600).toLocaleString("es-DO")} RD$`, amount: 6000 + i * 600, severity: "info", meta: null, createdAt: daysAgo(i * 2, i) }),
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    act({ profileType: "celulares", employeeId: celEstarlin.id, actorName: celEstarlin.fullName, action: "venta", entity: "venta", entityRef: `B02${String(1100 + i).padStart(8, "0")}`, detail: `Registró venta por ${(7000 + i * 500).toLocaleString("es-DO")} RD$`, amount: 7000 + i * 500, severity: "info", meta: null, createdAt: daysAgo(i * 2 + 1, i) }),
  ),
  ...["cliente se arrepintió", "error de cobro", "producto cambiado", "precio incorrecto", "duplicada"].map((r, i) =>
    act({ profileType: "celulares", employeeId: celEstarlin.id, actorName: celEstarlin.fullName, action: "venta_anulada", entity: "venta", entityRef: `B02${String(1120 + i).padStart(8, "0")}`, detail: `Anuló venta de ${(7500 + i * 400).toLocaleString("es-DO")} RD$ — motivo: ${r}`, amount: 7500 + i * 400, severity: "warn", meta: null, createdAt: daysAgo(i * 3 + 1, i) }),
  ),
  act({ profileType: "celulares", employeeId: celEstarlin.id, actorName: celEstarlin.fullName, action: "descuento_alto", entity: "venta", entityRef: "B0200001188", detail: "Aplicó descuento alto de 22% (4,200.00 RD$)", amount: 4200, severity: "warn", meta: null, createdAt: daysAgo(4) }),
  act({ profileType: "celulares", employeeId: celMassiel.id, actorName: celMassiel.fullName, action: "arqueo_faltante", entity: "caja", entityRef: "CAJ-01", detail: "Faltante de arqueo de 1,250.00 RD$ en el cierre", amount: -1250, severity: "warn", meta: null, createdAt: daysAgo(2) }),
  act({ profileType: "celulares", employeeId: celMassiel.id, actorName: celMassiel.fullName, action: "caja_abierta", entity: "caja", entityRef: "CAJ-01", detail: "Abrió la caja con fondo de 5,000.00 RD$", amount: 5000, severity: "info", meta: null, createdAt: daysAgo(2, 9) }),
  act({ profileType: "celulares", employeeId: celAdmin.id, actorName: celAdmin.fullName, action: "precio_cambiado", entity: "producto", entityRef: "CEL-IP15-128", detail: 'Cambió precio de "iPhone 15 128GB" de 64,000.00 a 62,500.00 RD$', amount: 62500, severity: "warn", meta: null, createdAt: daysAgo(5) }),
  act({ profileType: "celulares", employeeId: celAdmin.id, actorName: celAdmin.fullName, action: "empleado_creado", entity: "empleado", entityRef: "Massiel Carolina Abreu", detail: "Registró al empleado Massiel Carolina Abreu", amount: null, severity: "info", meta: null, createdAt: daysAgo(150) }),
];

const celAlerts: EmployeeAlert[] = [
  { employeeId: celEstarlin.id, name: celEstarlin.fullName, role: "vendedor", anulaciones: 5, ventas: 6, precios: 0, descuentos: 1, faltantes: 0, flags: [{ key: "anulaciones_frecuentes", label: "Anulaciones frecuentes", detail: "5 anulaciones (3.5x el promedio de la tienda)" }] },
];

// ── ELECTRÓNICAS ────────────────────────────────────────────────
const eleEmps: Employee[] = [
  emp({ profileType: "electronicas", fullName: "Ramón Antonio Then", cedula: "402-7654321-9", phone: "809-555-3301", role: "administrador", username: "rthen", photoUrl: null, hiredAt: dateAgo(400), isActive: true, notes: null, salary: 58000 }),
  emp({ profileType: "electronicas", fullName: "Yefri Alexander Núñez", cedula: "001-5566778-9", phone: "829-555-3302", role: "vendedor", username: "ynunez", photoUrl: null, hiredAt: dateAgo(260), isActive: true, notes: null, salary: 30000 }),
  emp({ profileType: "electronicas", fullName: "Geraldine Mercedes Lora", cedula: "402-3344556-7", phone: "849-555-3303", role: "vendedor", username: "glora", photoUrl: null, hiredAt: dateAgo(120), isActive: true, notes: null, salary: 27000 }),
  emp({ profileType: "electronicas", fullName: "Franklin José Disla", cedula: "223-1212121-2", phone: "809-555-3304", role: "cajero", username: "fdisla", photoUrl: null, hiredAt: dateAgo(90), isActive: true, notes: null, salary: 28000 }),
];
const [eleRamon, eleYefri, eleGeraldine] = eleEmps;

const eleActivity: ActivityEntry[] = [
  ...Array.from({ length: 9 }, (_, i) =>
    act({ profileType: "electronicas", employeeId: eleYefri.id, actorName: eleYefri.fullName, action: "venta", entity: "venta", entityRef: `B02${String(2000 + i).padStart(8, "0")}`, detail: `Registró venta por ${(9000 + i * 900).toLocaleString("es-DO")} RD$`, amount: 9000 + i * 900, severity: "info", meta: null, createdAt: daysAgo(i * 2, i) }),
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    act({ profileType: "electronicas", employeeId: eleGeraldine.id, actorName: eleGeraldine.fullName, action: "venta", entity: "venta", entityRef: `B02${String(2100 + i).padStart(8, "0")}`, detail: `Registró venta por ${(11000 + i * 800).toLocaleString("es-DO")} RD$`, amount: 11000 + i * 800, severity: "info", meta: null, createdAt: daysAgo(i * 2 + 1, i) }),
  ),
  ...["ELE-TVLG55", "ELE-PS5", "ELE-MONLG27", "ELE-LAPHP15", "ELE-AUDSONY"].map((sku, i) =>
    act({ profileType: "electronicas", employeeId: eleGeraldine.id, actorName: eleGeraldine.fullName, action: "precio_cambiado", entity: "producto", entityRef: sku, detail: "Bajó el precio de un producto", amount: 15000 - i * 300, severity: "warn", meta: null, createdAt: daysAgo(i * 3 + 1, i) }),
  ),
  act({ profileType: "electronicas", employeeId: eleRamon.id, actorName: eleRamon.fullName, action: "caja_cerrada", entity: "caja", entityRef: "CAJ-E1", detail: "Cerró la caja — esperado 42,300.00, contado 42,300.00 RD$", amount: 42300, severity: "info", meta: null, createdAt: daysAgo(1) }),
];

const eleAlerts: EmployeeAlert[] = [
  { employeeId: eleGeraldine.id, name: eleGeraldine.fullName, role: "vendedor", anulaciones: 0, ventas: 6, precios: 5, descuentos: 0, faltantes: 0, flags: [{ key: "cambios_precio_frecuentes", label: "Cambios de precio frecuentes", detail: "5 cambios de precio en el período" }] },
];

const celulares: EmployeeState = { employees: celEmps, activity: celActivity, alerts: celAlerts };
const electronicas: EmployeeState = { employees: eleEmps, activity: eleActivity, alerts: eleAlerts };

export const SAMPLE_BUNDLE: EmployeesBundle = {
  celulares,
  electronicas,
  source: "sample",
  canSeeSalary: true,
};
