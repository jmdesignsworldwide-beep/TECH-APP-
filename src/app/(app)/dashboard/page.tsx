import { getSessionUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/dashboard/queries";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata = { title: "Dashboard — JM Tech" };

// Datos vivos: revalidar en cada visita (las ventas cambian).
export const dynamic = "force-dynamic";

/**
 * Sala de Mando. Lee los datos en el servidor (Supabase real o semilla demo) y
 * los entrega a la vista, que se revela en cascada y reacciona al perfil activo.
 */
export default async function DashboardPage() {
  const [user, bundle] = await Promise.all([
    getSessionUser(),
    getDashboardData(),
  ]);

  return (
    <DashboardView bundle={bundle} displayName={user?.displayName ?? "JM"} />
  );
}
