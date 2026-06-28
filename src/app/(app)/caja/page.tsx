import { Receipt } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Caja — JM Tech" };

export default function Page() {
  return <ComingSoon title="Caja" icon={Receipt} note="Apertura, cierre y arqueo de caja." />;
}
