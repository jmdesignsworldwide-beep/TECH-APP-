import type { ProfileType } from "@/lib/types";
import { CATEGORIES } from "./categories";

export type FieldType =
  | "text"
  | "number"
  | "currency"
  | "select"
  | "date"
  | "textarea";

export interface FieldDef {
  /** Clave: columna directa de `products` o clave dentro de `attributes`. */
  key: string;
  label: string;
  type: FieldType;
  /** Dónde vive el dato. */
  storage: "column" | "attribute";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /** Para layout: campo a ancho completo. */
  full?: boolean;
  /** Sección visual del formulario. */
  section: "basico" | "especificaciones" | "precio" | "stock";
}

const CONDITION_BASE = ["nuevo", "usado", "reacondicionado"];

/**
 * Campos del inventario POR PERFIL. Esta config maneja TANTO el formulario de
 * crear/editar COMO la vista de detalle — un solo lugar para que "los campos
 * cambien según el perfil". El diferenciador, hecho tangible.
 */
export function getFields(profile: ProfileType): FieldDef[] {
  const common: FieldDef[] = [
    { key: "name", label: "Nombre", type: "text", storage: "column", required: true, full: true, section: "basico", placeholder: "iPhone 15 Pro Max 256GB" },
    { key: "brand", label: "Marca", type: "text", storage: "column", required: true, section: "basico", placeholder: "Apple" },
    { key: "model", label: "Modelo", type: "text", storage: "column", section: "basico", placeholder: "A2849" },
    { key: "category", label: "Categoría", type: "select", storage: "column", required: true, options: CATEGORIES[profile], section: "basico" },
    { key: "color", label: "Color / Acabado", type: "text", storage: "column", section: "basico", placeholder: "Titanio Natural" },
    { key: "sku", label: "Código (SKU)", type: "text", storage: "column", section: "basico", placeholder: "CEL-IP15PM-256" },
  ];

  const profileSpecific: FieldDef[] =
    profile === "celulares"
      ? [
          { key: "condition", label: "Estado", type: "select", storage: "column", options: CONDITION_BASE, section: "especificaciones" },
          { key: "storage", label: "Almacenamiento", type: "select", storage: "attribute", options: ["64GB", "128GB", "256GB", "512GB", "1TB"], section: "especificaciones" },
          { key: "ram", label: "RAM", type: "select", storage: "attribute", options: ["4GB", "6GB", "8GB", "12GB", "16GB"], section: "especificaciones" },
          { key: "network", label: "Red", type: "select", storage: "attribute", options: ["4G", "5G"], section: "especificaciones" },
          { key: "imei", label: "IMEI", type: "text", storage: "attribute", full: true, section: "especificaciones", placeholder: "15 dígitos" },
        ]
      : [
          { key: "condition", label: "Estado", type: "select", storage: "column", options: [...CONDITION_BASE, "exhibicion"], section: "especificaciones" },
          { key: "voltage", label: "Voltaje", type: "select", storage: "attribute", options: ["110V", "220V", "Dual"], section: "especificaciones" },
          { key: "serial_number", label: "Número de serie", type: "text", storage: "attribute", section: "especificaciones", placeholder: "SN-XXXXXX" },
          { key: "specs", label: "Especificaciones técnicas", type: "textarea", storage: "attribute", full: true, section: "especificaciones", placeholder: "Procesador, RAM, almacenamiento, pantalla…" },
        ];

  const pricing: FieldDef[] = [
    { key: "cost", label: "Costo (RD$)", type: "currency", storage: "column", section: "precio" },
    { key: "price", label: "Precio venta (RD$)", type: "currency", storage: "column", required: true, section: "precio" },
    { key: "supplier", label: "Proveedor", type: "text", storage: "column", section: "precio", placeholder: "Importadora Caribe Tech" },
    { key: "warrantyMonths", label: "Garantía (meses)", type: "number", storage: "column", section: "precio" },
  ];

  const stock: FieldDef[] = [
    { key: "stock", label: "Stock", type: "number", storage: "column", required: true, section: "stock" },
    { key: "minStock", label: "Alerta de stock mínimo", type: "number", storage: "column", section: "stock" },
    { key: "entryDate", label: "Fecha de entrada", type: "date", storage: "column", section: "stock" },
  ];

  return [...common, ...profileSpecific, ...pricing, ...stock];
}

export const SECTION_LABELS: Record<FieldDef["section"], string> = {
  basico: "Información básica",
  especificaciones: "Especificaciones",
  precio: "Precio y proveedor",
  stock: "Inventario",
};

export const CONDITION_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  usado: "Usado",
  reacondicionado: "Reacondicionado",
  exhibicion: "Exhibición",
};
