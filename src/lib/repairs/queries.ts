import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import type { RepairStatus } from "@/lib/postventa/status";
import { SAMPLE_REPAIRS } from "./sample-data";
import type { Repair, RepairStep, RepairsBundle } from "./types";

function mapHistory(raw: unknown): RepairStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => ({
      status: (h as { status?: string }).status as RepairStatus,
      at: ((h as { at?: string }).at as string) ?? null,
    }))
    .filter((h) => h.status);
}

export const getRepairsBundle = cache(async (): Promise<RepairsBundle> => {
  if (!isSupabaseConfigured()) return SAMPLE_REPAIRS;

  try {
    const supabase = createSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("repairs")
      .select(
        "id, profile_type, order_number, customer_id, customer_name, device, identifier, problem, budget, technician, status, notes, created_at, status_history",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;

    const customerIds = [...new Set((rows ?? []).map((r) => r.customer_id).filter(Boolean))];
    const { data: custs } = customerIds.length
      ? await supabase.from("customers").select("id, full_name").in("id", customerIds)
      : { data: [] as { id: string; full_name: string }[] };
    const cName = new Map((custs ?? []).map((c) => [c.id, c.full_name as string]));

    const all: Repair[] = (rows ?? []).map((r) => ({
      id: String(r.id),
      profileType: r.profile_type as ProfileType,
      orderNumber: r.order_number as string,
      customerName: cName.get(r.customer_id) ?? (r.customer_name as string) ?? "Cliente",
      device: (r.device as string) ?? "Equipo",
      identifier: (r.identifier as string) ?? null,
      problem: (r.problem as string) ?? null,
      budget: Number(r.budget ?? 0),
      technician: (r.technician as string) ?? null,
      status: (r.status as RepairStatus) ?? "recibido",
      notes: (r.notes as string) ?? null,
      createdAt: r.created_at as string,
      history: mapHistory(r.status_history),
    }));

    const pick = (p: ProfileType) => all.filter((x) => x.profileType === p);
    return { celulares: pick("celulares"), electronicas: pick("electronicas"), source: "supabase" };
  } catch {
    return SAMPLE_REPAIRS;
  }
});
