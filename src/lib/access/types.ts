import type { AppRole } from "@/lib/types";
import type { AccessStatus } from "./status";

export interface DemoAccount {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
  createdAt: string;
  accessExpiresAt: string | null;
  isActive: boolean;
  status: AccessStatus;
  daysLeft: number | null;
}
