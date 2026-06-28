import { getOrdersBundle } from "@/lib/orders/queries";
import { getSuggestionData } from "@/lib/suggestions/queries";
import { OrdersView } from "@/components/orders/orders-view";

export const metadata = { title: "Pedidos — JM Tech" };
export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const [bundle, suggestions] = await Promise.all([getOrdersBundle(), getSuggestionData()]);
  return <OrdersView bundle={bundle} suggestions={suggestions} />;
}
