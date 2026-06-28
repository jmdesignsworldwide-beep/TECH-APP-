import { getSessionUser } from "@/lib/auth/session";
import { getInventoryBundle } from "@/lib/inventory/queries";
import { getCatalogBundle } from "@/lib/catalog/queries";
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
  const [user, inventory, catalog, sales, customers] = await Promise.all([
    getSessionUser(),
    getInventoryBundle(),
    getCatalogBundle(),
    getSalesHistory(),
    getCustomers(),
  ]);

  return (
    <PosView
      inventory={inventory}
      catalog={catalog}
      sales={sales}
      customers={customers}
      seller={user?.displayName ?? "Vendedor"}
    />
  );
}
