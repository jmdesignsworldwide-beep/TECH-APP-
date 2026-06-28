import { getInventoryBundle } from "@/lib/inventory/queries";
import { InventoryView } from "@/components/inventory/inventory-view";

export const metadata = { title: "Inventario — JM Tech" };

// Núcleo real: el inventario refleja cambios al instante.
export const dynamic = "force-dynamic";

/**
 * Inventario por perfil. Lee los productos (ambos perfiles) en el servidor y
 * los entrega a la vista, que muestra el del perfil activo y permite CRUD real
 * contra Supabase (validado por rol en el servidor + RLS).
 */
export default async function InventarioPage() {
  const bundle = await getInventoryBundle();
  return <InventoryView bundle={bundle} />;
}
