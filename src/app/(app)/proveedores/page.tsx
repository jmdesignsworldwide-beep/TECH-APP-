import { getSuppliersBundle } from "@/lib/suppliers/queries";
import { SuppliersView } from "@/components/suppliers/suppliers-view";

export const metadata = { title: "Proveedores — JM Tech" };
export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  const bundle = await getSuppliersBundle();
  return <SuppliersView bundle={bundle} />;
}
