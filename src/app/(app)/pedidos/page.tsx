import { getOrdersBundle } from "@/lib/orders/queries";
import { OrdersView } from "@/components/orders/orders-view";

export const metadata = { title: "Pedidos — JM Tech" };
export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const bundle = await getOrdersBundle();
  return <OrdersView bundle={bundle} />;
}
