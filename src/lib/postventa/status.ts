import type { ProfileType } from "@/lib/types";

export type Tone = "success" | "warning" | "danger" | "accent" | "neutral";

export interface StatusMeta {
  label: string;
  tone: Tone;
}

// ── Garantías (estado derivado para el filtro/UI) ────────────────
export type WarrantyState = "activa" | "por_vencer" | "vencida" | "reclamada";
export const WARRANTY_STATUS: Record<WarrantyState, StatusMeta> = {
  activa: { label: "Activa", tone: "success" },
  por_vencer: { label: "Por vencer", tone: "warning" },
  vencida: { label: "Vencida", tone: "danger" },
  reclamada: { label: "Reclamada", tone: "accent" },
};

// ── Pedidos ──────────────────────────────────────────────────────
export type OrderStatus =
  | "pendiente"
  | "en_proceso"
  | "llego"
  | "entregado"
  | "completado"
  | "cancelado";
export const ORDER_STATUS: Record<OrderStatus, StatusMeta> = {
  pendiente: { label: "Pendiente", tone: "neutral" },
  en_proceso: { label: "En proceso", tone: "accent" },
  llego: { label: "Llegó", tone: "warning" },
  entregado: { label: "Entregado", tone: "success" },
  completado: { label: "Completado", tone: "success" },
  cancelado: { label: "Cancelado", tone: "danger" },
};
/** Flujo de estados que la UI ofrece para avanzar un pedido. */
export const ORDER_FLOW: OrderStatus[] = ["pendiente", "en_proceso", "llego", "entregado"];

// ── Reparaciones (sets distintos por perfil) ─────────────────────
export type RepairStatus =
  | "recibido"
  | "en_revision"
  | "diagnosticando"
  | "reparando"
  | "listo"
  | "entregado"
  | "cancelado";
export const REPAIR_STATUS: Record<RepairStatus, StatusMeta> = {
  recibido: { label: "Recibido", tone: "neutral" },
  en_revision: { label: "En revisión", tone: "accent" },
  diagnosticando: { label: "Diagnosticando", tone: "accent" },
  reparando: { label: "Reparando", tone: "warning" },
  listo: { label: "Listo", tone: "success" },
  entregado: { label: "Entregado", tone: "success" },
  cancelado: { label: "Cancelado", tone: "danger" },
};
/** El flujo de reparación cambia según la tienda. */
export function repairFlow(profile: ProfileType): RepairStatus[] {
  return profile === "celulares"
    ? ["recibido", "en_revision", "reparando", "listo", "entregado"]
    : ["recibido", "diagnosticando", "reparando", "listo", "entregado"];
}

export const TONE_PILL: Record<Tone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  accent: "bg-accent/10 text-accent",
  neutral: "bg-surface-2/70 text-muted",
};
