import { Boxes } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Inventario — JM Tech" };

export default function Page() {
  return (
    <ComingSoon
      title="Inventario"
      icon={Boxes}
      note="Productos con doble perfil (celulares/electrónicas), stock y alertas de bajo inventario."
    />
  );
}
