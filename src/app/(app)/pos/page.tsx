import { getSessionUser } from "@/lib/auth/session";
import { getInventoryBundle } from "@/lib/inventory/queries";
import { getCustomers } from "@/lib/customers/queries";
import { getSalesHistory } from "@/lib/pos/queries";
import { PosView } from "@/components/pos/pos-view";

export const metadata = { title: "POS / Ventas — JM Tech" };

// Núcleo real: vender descuenta stock y toca el dashboard al instante.
export const dynamic = "force-dynamic";

/**
 * Punto de venta. Lee productos (inventario) y el historial de ventas en el
 * servidor; el cobro y la anulación corren en funciones de base atómicas que
 * validan rol y stock. El organismo: vender baja el stock y sube el dashboard.
 */
export default async function PosPage() {
  const [user, inventory, sales, customers] = await Promise.all([
    getSessionUser(),
    getInventoryBundle(),
    getSalesHistory(),
    getCustomers(),
  ]);

  return (
    <PosView
      inventory={inventory}
      sales={sales}
      customers={customers}
      seller={user?.displayName ?? "Vendedor"}
    />
  );
}
