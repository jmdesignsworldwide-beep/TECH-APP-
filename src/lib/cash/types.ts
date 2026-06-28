import type { ProfileType } from "@/lib/types";

export interface CashSummary {
  opening: number;
  efectivo: number;
  transferencia: number;
  debito: number;
  credito: number;
  total_sales: number;
  sale_count: number;
  egresos: number;
  ingresos_manual: number;
  expected_cash: number;
}

export interface CashMovement {
  id: string;
  kind: "egreso" | "ingreso";
  amount: number;
  reason: string | null;
  category: string | null;
  by: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  profileType: ProfileType;
  status: "abierta" | "cerrada";
  openingAmount: number;
  openedBy: string;
  openedAt: string;
  closedBy: string | null;
  closedAt: string | null;
  countedCash: number | null;
  expectedCash: number | null;
  difference: number | null;
  notes: string | null;
  summary: CashSummary | null;
}

/** Estado de caja del perfil (sesión abierta + resumen en vivo + historial). */
export interface CashState {
  session: CashSession | null;
  summary: CashSummary | null;
  movements: CashMovement[];
  history: CashSession[];
}

export interface CashBundle {
  celulares: CashState;
  electronicas: CashState;
  source: "supabase" | "sample";
}

/** Resultado del cierre (arqueo). */
export interface CashCloseResult {
  expected_cash: number;
  counted_cash: number;
  difference: number;
  summary: CashSummary;
}
