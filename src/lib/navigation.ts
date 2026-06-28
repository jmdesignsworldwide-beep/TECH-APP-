import {
  Boxes,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  UsersRound,
  Wrench,
  BarChart3,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Placeholder = módulo aún sin construir (tandas futuras). */
  placeholder?: boolean;
}

/**
 * Módulos del sistema. En esta tanda casi todos son placeholders: la estructura
 * de navegación existe y se siente conectada, pero el contenido llega después.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventario", label: "Inventario", icon: Boxes, placeholder: true },
  { href: "/pos", label: "POS / Ventas", icon: CreditCard, placeholder: true },
  { href: "/pedidos", label: "Pedidos", icon: Package, placeholder: true },
  { href: "/caja", label: "Caja", icon: Receipt, placeholder: true },
  { href: "/clientes", label: "Clientes", icon: Users, placeholder: true },
  { href: "/proveedores", label: "Proveedores", icon: Truck, placeholder: true },
  { href: "/empleados", label: "Empleados", icon: UsersRound },
  { href: "/garantias", label: "Garantías", icon: ShieldCheck, placeholder: true },
  { href: "/reparaciones", label: "Reparaciones", icon: Wrench, placeholder: true },
  { href: "/reportes", label: "Reportes", icon: BarChart3, placeholder: true },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

/** Solo para referencia interna de la demo. */
export const FUTURE_ICON = CalendarClock;
