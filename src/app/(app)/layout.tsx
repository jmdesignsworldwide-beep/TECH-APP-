import { redirect } from "next/navigation";
import { Aurora } from "@/components/aurora";
import { AppShell } from "@/components/layout/app-shell";
import { WelcomeOverlay } from "@/components/welcome/welcome-overlay";
import { AccessExpired } from "@/components/access/access-expired";
import { getSessionUser } from "@/lib/auth/session";
import { computeAccess, isBlocked } from "@/lib/access/status";
import { getActiveProfile } from "@/lib/profile/active-profile";
import { ProfileProvider } from "@/lib/profile/profile-provider";

/**
 * Layout del área autenticada. Valida la sesión en el SERVIDOR (cubre Supabase
 * y demo) y monta el organismo: aurora reactiva + shell responsive. El perfil
 * activo se inyecta desde el servidor para que el acento llegue sin parpadeo.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // ── Acceso temporal: bloqueo de servidor (defensa en profundidad) ──
  // Aunque el login ya valida, el layout vuelve a comprobar el vencimiento en
  // cada request contra la hora del servidor. El navegador no puede saltárselo.
  const access = computeAccess(user.role, user.isActive, user.accessExpiresAt);
  if (isBlocked(access.status)) {
    return <AccessExpired revoked={access.status === "revoked"} />;
  }

  const profile = getActiveProfile();

  return (
    <ProfileProvider initialProfile={profile}>
      <Aurora />
      <WelcomeOverlay name={user.displayName} />
      <AppShell user={user}>{children}</AppShell>
    </ProfileProvider>
  );
}
