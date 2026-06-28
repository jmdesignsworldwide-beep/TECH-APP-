import { getActiveProfile } from "@/lib/profile/active-profile";
import { getSessionUser } from "@/lib/auth/session";
import { getDemoAccounts } from "@/lib/access/queries";
import { ConfigClient } from "./config-client";

export const metadata = { title: "Configuración — JM Tech" };
export const dynamic = "force-dynamic";

/**
 * Configuración. Cambio de perfil + tema, y (solo para el owner) la gestión de
 * cuentas de demo con acceso temporal.
 */
export default async function Page() {
  const profile = getActiveProfile();
  const user = await getSessionUser();
  const isOwner = user?.role === "owner";
  // "Mi cuenta" es SOLO del owner real. Las cuentas de demo tienen rol 'admin'
  // (lo comparten), así que NO basta con is_admin: se exige owner.
  const canManageAccount = isOwner;
  const accounts = isOwner ? await getDemoAccounts() : [];
  return (
    <ConfigClient
      initialProfile={profile}
      isOwner={isOwner}
      accounts={accounts}
      canManageAccount={canManageAccount}
      username={user?.username ?? ""}
    />
  );
}
