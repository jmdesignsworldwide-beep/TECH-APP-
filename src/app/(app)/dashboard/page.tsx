import { getSessionUser } from "@/lib/auth/session";
import { DashboardShowcase } from "./showcase";

export const metadata = { title: "Dashboard — JM Tech" };

/**
 * Dashboard. En esta tanda funciona como vitrina de los primitivos premium
 * (KPI count-up, modal estándar, stagger, botones con glow, badges que laten)
 * sobre datos de ejemplo. Las tandas siguientes lo alimentan con datos reales.
 */
export default async function DashboardPage() {
  const user = await getSessionUser();
  return <DashboardShowcase displayName={user?.displayName ?? "JM"} />;
}
