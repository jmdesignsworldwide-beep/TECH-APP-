import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "POS / Ventas — JM Tech" };

export default function Page() {
  return (
    <ComingSoon
      title="POS / Ventas"
      icon={CreditCard}
      note="Punto de venta rápido, carrito y cobro en RD$."
    />
  );
}
