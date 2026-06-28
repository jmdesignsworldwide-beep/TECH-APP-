import { getCustomersBundle } from "@/lib/customers/list-queries";
import { CustomersView } from "@/components/customers/customers-view";

export const metadata = { title: "Clientes — JM Tech" };
export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const bundle = await getCustomersBundle();
  return <CustomersView bundle={bundle} />;
}
