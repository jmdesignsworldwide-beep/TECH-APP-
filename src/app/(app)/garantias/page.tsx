import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Garantías — JM Tech" };

export default function Page() {
  return (
    <ComingSoon
      title="Garantías"
      icon={ShieldCheck}
      note="Seguimiento de garantías y alertas de vencimiento."
    />
  );
}
