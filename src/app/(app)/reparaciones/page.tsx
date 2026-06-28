import { getRepairsBundle } from "@/lib/repairs/queries";
import { getSuggestionData } from "@/lib/suggestions/queries";
import { RepairsView } from "@/components/repairs/repairs-view";

export const metadata = { title: "Reparaciones — JM Tech" };
export const dynamic = "force-dynamic";

export default async function ReparacionesPage() {
  const [bundle, suggestions] = await Promise.all([getRepairsBundle(), getSuggestionData()]);
  return <RepairsView bundle={bundle} suggestions={suggestions} />;
}
