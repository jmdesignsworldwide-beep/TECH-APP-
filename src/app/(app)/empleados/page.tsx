import { getEmployeesBundle } from "@/lib/employees/queries";
import { EmployeesView } from "@/components/employees/employees-view";

export const metadata = { title: "Empleados — JM Tech" };

// El historial es vivo: se refleja al instante cada acción del sistema.
export const dynamic = "force-dynamic";

/**
 * Empleados SEPARADOS por perfil/tienda, con su HISTORIAL INVIOLABLE (solo
 * INSERT a nivel base) y ALERTAS calculadas en el servidor sobre ese historial.
 * El salario es privado (RLS solo owner/admin). La caja sigue al perfil activo.
 */
export default async function EmpleadosPage() {
  const bundle = await getEmployeesBundle();
  return <EmployeesView bundle={bundle} />;
}
