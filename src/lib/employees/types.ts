import type { ProfileType } from "@/lib/types";

export type EmployeeRole = "administrador" | "vendedor" | "cajero";

export interface Employee {
  id: string;
  profileType: ProfileType;
  fullName: string;
  cedula: string | null;
  phone: string | null;
  role: EmployeeRole;
  username: string | null;
  photoUrl: string | null;
  hiredAt: string; // date (YYYY-MM-DD)
  isActive: boolean;
  notes: string | null;
  /** Salario — privado. Solo presente para owner/admin (RLS). */
  salary: number | null;
}

/** Tipos de acción registrados en el historial inviolable. */
export type ActivityAction =
  | "venta"
  | "venta_anulada"
  | "descuento_alto"
  | "precio_cambiado"
  | "producto_creado"
  | "producto_editado"
  | "egreso_caja"
  | "caja_abierta"
  | "caja_cerrada"
  | "arqueo_faltante"
  | "cliente_creado"
  | "empleado_creado"
  | "empleado_editado"
  | "empleado_desactivado"
  | "empleado_reactivado"
  | string;

export interface ActivityEntry {
  id: string;
  profileType: ProfileType;
  employeeId: string | null;
  actorName: string;
  action: ActivityAction;
  entity: string | null;
  entityRef: string | null;
  detail: string;
  amount: number | null;
  severity: "info" | "warn";
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface AlertFlag {
  key: string;
  label: string;
  detail: string;
}

export interface EmployeeAlert {
  employeeId: string;
  name: string;
  role: EmployeeRole;
  anulaciones: number;
  ventas: number;
  precios: number;
  descuentos: number;
  faltantes: number;
  flags: AlertFlag[];
}

export interface EmployeeState {
  employees: Employee[];
  activity: ActivityEntry[];
  alerts: EmployeeAlert[];
}

export interface EmployeesBundle {
  celulares: EmployeeState;
  electronicas: EmployeeState;
  source: "supabase" | "sample";
  /** El visor solo recibe salario si el usuario es owner/admin. */
  canSeeSalary: boolean;
}
