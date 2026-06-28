import { redirect } from "next/navigation";
import { Aurora } from "@/components/aurora";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/auth/session";
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

  const profile = getActiveProfile();

  return (
    <ProfileProvider initialProfile={profile}>
      <Aurora />
      <AppShell user={user}>{children}</AppShell>
    </ProfileProvider>
  );
}
