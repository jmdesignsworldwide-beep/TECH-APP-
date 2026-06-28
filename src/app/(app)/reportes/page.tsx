import { getReportsBundle } from "@/lib/reports/queries";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata = { title: "Reportes — JM Tech" };
export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const bundle = await getReportsBundle();
  return <ReportsView bundle={bundle} />;
}
