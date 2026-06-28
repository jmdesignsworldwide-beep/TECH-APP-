import type { ProfileType } from "@/lib/types";
import type { RepairStatus } from "@/lib/postventa/status";

export interface RepairStep {
  status: RepairStatus;
  at: string | null;
}

export interface Repair {
  id: string;
  profileType: ProfileType;
  orderNumber: string;
  customerName: string;
  device: string;
  identifier: string | null; // IMEI / serie
  problem: string | null;
  budget: number;
  technician: string | null;
  status: RepairStatus;
  notes: string | null;
  createdAt: string;
  history: RepairStep[];
}

export interface RepairsBundle {
  celulares: Repair[];
  electronicas: Repair[];
  source: "supabase" | "sample";
}
