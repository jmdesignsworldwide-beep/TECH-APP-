import {
  Boxes,
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
}

/** Módulos del sistema — todos construidos y funcionales. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventario", label: "Inventario", icon: Boxes },
  { href: "/pos", label: "POS / Ventas", icon: CreditCard },
  { href: "/pedidos", label: "Pedidos", icon: Package },
  { href: "/caja", label: "Caja", icon: Receipt },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/empleados", label: "Empleados", icon: UsersRound },
  { href: "/garantias", label: "Garantías", icon: ShieldCheck },
  { href: "/reparaciones", label: "Reparaciones", icon: Wrench },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];
