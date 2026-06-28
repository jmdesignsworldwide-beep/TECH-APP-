import { cache } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import { SAMPLE_BUNDLE } from "./sample-data";
import type {
  ActivityEntry,
  Employee,
  EmployeeAlert,
  EmployeeRole,
  EmployeeState,
  EmployeesBundle,
} from "./types";

function mapEmployee(
  r: Record<string, unknown>,
  salary: number | null,
): Employee {
  return {
    id: String(r.id),
    profileType: r.profile_type as ProfileType,
    fullName: String(r.full_name),
    cedula: (r.cedula as string) ?? null,
    phone: (r.phone as string) ?? null,
    role: (r.role as EmployeeRole) ?? "vendedor",
    username: (r.username as string) ?? null,
    photoUrl: (r.photo_url as string) ?? null,
    hiredAt: String(r.hired_at),
    isActive: Boolean(r.is_active),
    notes: (r.notes as string) ?? null,
    salary,
  };
}

function mapActivity(r: Record<string, unknown>): ActivityEntry {
  return {
    id: String(r.id),
    profileType: r.profile_type as ProfileType,
    employeeId: (r.employee_id as string) ?? null,
    actorName: String(r.actor_name),
    action: String(r.action_type),
    entity: (r.entity as string) ?? null,
    entityRef: (r.entity_ref as string) ?? null,
    detail: String(r.detail),
    amount: r.amount === null || r.amount === undefined ? null : Number(r.amount),
    severity: (r.severity as "info" | "warn") ?? "info",
    meta: (r.meta as Record<string, unknown>) ?? null,
    createdAt: String(r.created_at),
  };
}

/**
 * Estado de Empleados de AMBOS perfiles (plantillas independientes por tienda).
 * Incluye plantilla, historial inviolable y alertas calculadas en el servidor.
 * El salario solo se adjunta si el usuario es owner/admin (RLS lo respalda).
 * Cae a una muestra creíble en modo demo.
 */
export const getEmployeesBundle = cache(async (): Promise<EmployeesBundle> => {
  const user = await getSessionUser();
  const canSeeSalary = user?.role === "owner" || user?.role === "admin";

  if (!isSupabaseConfigured()) {
    return { ...SAMPLE_BUNDLE, canSeeSalary };
  }

  try {
    const supabase = createSupabaseServerClient();

    const [{ data: emps, error: e1 }, { data: acts, error: e2 }, { data: priv }] =
      await Promise.all([
        supabase.from("employees").select("*").order("is_active", { ascending: false }).order("full_name"),
        supabase
          .from("activity_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(400),
        canSeeSalary
          ? supabase.from("employee_private").select("employee_id, salary")
          : Promise.resolve({ data: [] as { employee_id: string; salary: number }[] }),
      ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const salaryById = new Map(
      (priv ?? []).map((p) => [p.employee_id, Number(p.salary)]),
    );

    const allEmployees = (emps ?? []).map((r) =>
      mapEmployee(r, canSeeSalary ? salaryById.get(String(r.id)) ?? null : null),
    );
    const allActivity = (acts ?? []).map(mapActivity);

    const [celAlerts, eleAlerts] = await Promise.all([
      supabase.rpc("employee_alerts", { p_profile: "celulares", p_days: 30 }),
      supabase.rpc("employee_alerts", { p_profile: "electronicas", p_days: 30 }),
    ]);

    const build = (
      profile: ProfileType,
      alerts: unknown,
    ): EmployeeState => ({
      employees: allEmployees.filter((e) => e.profileType === profile),
      activity: allActivity.filter((a) => a.profileType === profile),
      alerts: ((alerts as EmployeeAlert[]) ?? []) as EmployeeAlert[],
    });

    return {
      celulares: build("celulares", celAlerts.data),
      electronicas: build("electronicas", eleAlerts.data),
      source: "supabase",
      canSeeSalary,
    };
  } catch {
    return { ...SAMPLE_BUNDLE, canSeeSalary };
  }
});
