import { getWarrantiesBundle } from "@/lib/warranties/queries";
import { WarrantiesView } from "@/components/warranties/warranties-view";

export const metadata = { title: "Garantías — JM Tech" };
export const dynamic = "force-dynamic";

export default async function GarantiasPage() {
  const bundle = await getWarrantiesBundle();
  return <WarrantiesView bundle={bundle} />;
}
