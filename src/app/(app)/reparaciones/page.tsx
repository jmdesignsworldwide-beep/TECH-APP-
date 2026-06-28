import { getRepairsBundle } from "@/lib/repairs/queries";
import { RepairsView } from "@/components/repairs/repairs-view";

export const metadata = { title: "Reparaciones — JM Tech" };
export const dynamic = "force-dynamic";

export default async function ReparacionesPage() {
  const bundle = await getRepairsBundle();
  return <RepairsView bundle={bundle} />;
}
