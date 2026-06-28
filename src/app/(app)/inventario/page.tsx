import { getInventoryBundle } from "@/lib/inventory/queries";
import { getCatalogBundle } from "@/lib/catalog/queries";
import { InventoryView } from "@/components/inventory/inventory-view";

export const metadata = { title: "Inventario — JM Tech" };

// Núcleo real: el inventario refleja cambios al instante.
export const dynamic = "force-dynamic";

/**
 * Inventario por perfil. Lee los productos y el árbol de catálogo (ambos
 * perfiles) en el servidor; la vista usa la MISMA navegación en árbol que el
 * POS (componente compartido). CRUD real contra Supabase (rol + RLS).
 */
export default async function InventarioPage() {
  const [bundle, catalog] = await Promise.all([
    getInventoryBundle(),
    getCatalogBundle(),
  ]);
  return <InventoryView bundle={bundle} catalog={catalog} />;
}
