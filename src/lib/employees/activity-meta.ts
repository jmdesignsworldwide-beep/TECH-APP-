import {
  AlertTriangle,
  ArrowDownCircle,
  BadgeDollarSign,
  Lock,
  LockOpen,
  type LucideIcon,
  Percent,
  Receipt,
  Tag,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

export interface ActionMeta {
  label: string;
  icon: LucideIcon;
  tone: "neutral" | "info" | "warn" | "danger";
}

const META: Record<string, ActionMeta> = {
  venta: { label: "Venta", icon: Receipt, tone: "info" },
  venta_anulada: { label: "Anulación", icon: XCircle, tone: "danger" },
  descuento_alto: { label: "Descuento alto", icon: Percent, tone: "warn" },
  precio_cambiado: { label: "Cambio de precio", icon: Tag, tone: "warn" },
  producto_creado: { label: "Producto creado", icon: Tag, tone: "neutral" },
  producto_editado: { label: "Producto editado", icon: Tag, tone: "neutral" },
  egreso_caja: { label: "Egreso de caja", icon: ArrowDownCircle, tone: "neutral" },
  caja_abierta: { label: "Apertura de caja", icon: LockOpen, tone: "info" },
  caja_cerrada: { label: "Cierre de caja", icon: Lock, tone: "neutral" },
  arqueo_faltante: { label: "Faltante de arqueo", icon: AlertTriangle, tone: "danger" },
  cliente_creado: { label: "Cliente creado", icon: Users, tone: "neutral" },
  empleado_creado: { label: "Empleado creado", icon: UserPlus, tone: "neutral" },
  empleado_editado: { label: "Empleado editado", icon: Users, tone: "neutral" },
  empleado_desactivado: { label: "Empleado desactivado", icon: UserMinus, tone: "warn" },
  empleado_reactivado: { label: "Empleado reactivado", icon: UserPlus, tone: "neutral" },
};

const FALLBACK: ActionMeta = { label: "Acción", icon: BadgeDollarSign, tone: "neutral" };

export function actionMeta(action: string): ActionMeta {
  return META[action] ?? FALLBACK;
}

/** Tipos de acción para el filtro del historial (orden de relevancia). */
export const FILTERABLE_ACTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todas las acciones" },
  { value: "venta", label: "Ventas" },
  { value: "venta_anulada", label: "Anulaciones" },
  { value: "descuento_alto", label: "Descuentos altos" },
  { value: "precio_cambiado", label: "Cambios de precio" },
  { value: "egreso_caja", label: "Egresos de caja" },
  { value: "caja_abierta", label: "Aperturas de caja" },
  { value: "caja_cerrada", label: "Cierres de caja" },
  { value: "arqueo_faltante", label: "Faltantes de arqueo" },
  { value: "empleado_creado", label: "Gestión de empleados" },
];

export const TONE_CLASSES: Record<
  ActionMeta["tone"],
  { chip: string; icon: string }
> = {
  neutral: { chip: "bg-surface-2/70 text-muted", icon: "text-muted" },
  info: { chip: "bg-accent/10 text-accent", icon: "text-accent" },
  warn: { chip: "bg-warning/15 text-warning", icon: "text-warning" },
  danger: { chip: "bg-danger/15 text-danger", icon: "text-danger" },
};
