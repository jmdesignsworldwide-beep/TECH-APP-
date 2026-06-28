import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Reportes — JM Tech" };

export default function Page() {
  return (
    <ComingSoon
      title="Reportes"
      icon={BarChart3}
      note="Gráficas y métricas del negocio (Recharts)."
    />
  );
}
