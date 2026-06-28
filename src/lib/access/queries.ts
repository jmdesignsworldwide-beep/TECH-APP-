import { cache } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";
import { computeAccess } from "./status";
import type { DemoAccount } from "./types";

/**
 * Cuentas de demo (acceso temporal). SOLO el owner las ve. Excluye al propio
 * owner. El estado de cada cuenta se calcula en el servidor.
 */
export const getDemoAccounts = cache(async (): Promise<DemoAccount[]> => {
  const user = await getSessionUser();
  if (!user || user.role !== "owner") return [];
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("app_users")
      .select("id, username, display_name, role, created_at, is_active, access_expires_at")
      .neq("role", "owner")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((r) => {
      const access = computeAccess(
        r.role as AppRole,
        r.is_active ?? true,
        (r.access_expires_at as string) ?? null,
      );
      return {
        id: String(r.id),
        username: r.username as string,
        displayName: (r.display_name as string) ?? (r.username as string),
        role: r.role as AppRole,
        createdAt: r.created_at as string,
        accessExpiresAt: (r.access_expires_at as string) ?? null,
        isActive: r.is_active ?? true,
        status: access.status,
        daysLeft: access.daysLeft,
      };
    });
  } catch {
    return [];
  }
});
