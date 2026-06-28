import type { ProfileType } from "@/lib/types";
import type { OrderStatus } from "@/lib/postventa/status";

export interface OrderStep {
  status: OrderStatus;
  at: string | null;
}

export interface Order {
  id: string;
  profileType: ProfileType;
  customerName: string;
  itemDesc: string;
  status: OrderStatus;
  total: number;
  deposit: number;
  balance: number;
  supplier: string | null;
  note: string | null;
  createdAt: string;
  expectedAt: string | null;
  history: OrderStep[];
}

export interface OrdersBundle {
  celulares: Order[];
  electronicas: Order[];
  source: "supabase" | "sample";
}
