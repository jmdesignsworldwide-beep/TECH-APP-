import { getSessionUser } from "@/lib/auth/session";
import { getCashBundle } from "@/lib/cash/queries";
import { CashView } from "@/components/cash/cash-view";

export const metadata = { title: "Caja — JM Tech" };

// Núcleo real: la caja refleja ventas y movimientos al instante.
export const dynamic = "force-dynamic";

/**
 * Caja SEPARADA por perfil. Cada tienda (Celulares / Electrónicas) tiene su
 * propia apertura, efectivo, egresos, cierre y arqueo — nunca se mezclan. La
 * caja sigue al perfil activo. Cálculos y cuadre en el servidor (RPC).
 */
export default async function CajaPage() {
  const [user, bundle] = await Promise.all([
    getSessionUser(),
    getCashBundle(),
  ]);

  return <CashView bundle={bundle} userName={user?.displayName ?? "Cajero"} />;
}
