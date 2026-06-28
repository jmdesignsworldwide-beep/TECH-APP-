import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import type {
  CashBundle,
  CashMovement,
  CashSession,
  CashState,
  CashSummary,
} from "./types";

const EMPTY: CashState = {
  session: null,
  summary: null,
  movements: [],
  history: [],
};

const SAMPLE: CashBundle = {
  celulares: EMPTY,
  electronicas: EMPTY,
  source: "sample",
};

function mapSession(
  r: Record<string, unknown>,
  names: Map<string, string>,
): CashSession {
  return {
    id: String(r.id),
    profileType: r.profile_type as ProfileType,
    status: (r.status as "abierta" | "cerrada") ?? "abierta",
    openingAmount: Number(r.opening_amount ?? 0),
    openedBy: r.opened_by ? (names.get(r.opened_by as string) ?? "—") : "—",
    openedAt: r.opened_at as string,
    closedBy: r.closed_by ? (names.get(r.closed_by as string) ?? "—") : null,
    closedAt: (r.closed_at as string) ?? null,
    countedCash: r.counted_cash === null ? null : Number(r.counted_cash),
    expectedCash: r.expected_cash === null ? null : Number(r.expected_cash),
    difference: r.difference === null ? null : Number(r.difference),
    notes: (r.notes as string) ?? null,
    summary: (r.summary as CashSummary) ?? null,
  };
}

/**
 * Estado de caja de AMBOS perfiles (cada tienda independiente). Para la sesión
 * abierta calcula el resumen en vivo en el servidor (RPC cash_summary). Cae a
 * vacío en modo demo.
 */
export const getCashBundle = cache(async (): Promise<CashBundle> => {
  if (!isSupabaseConfigured()) return SAMPLE;

  try {
    const supabase = createSupabaseServerClient();
    const { data: regs, error } = await supabase
      .from("cash_registers")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(60);
    if (error) throw error;

    const userIds = [
      ...new Set(
        (regs ?? []).flatMap((r) => [r.opened_by, r.closed_by]).filter(Boolean),
      ),
    ];
    const { data: users } = userIds.length
      ? await supabase.from("app_users").select("id, display_name").in("id", userIds)
      : { data: [] as { id: string; display_name: string }[] };
    const names = new Map(
      (users ?? []).map((u) => [u.id, u.display_name as string]),
    );

    const sessions = (regs ?? []).map((r) => ({ raw: r, s: mapSession(r, names) }));

    const build = async (profile: ProfileType): Promise<CashState> => {
      const open = sessions.find(
        (x) => x.s.profileType === profile && x.s.status === "abierta",
      );
      const history = sessions
        .filter((x) => x.s.profileType === profile && x.s.status === "cerrada")
        .map((x) => x.s);

      if (!open) return { session: null, summary: null, movements: [], history };

      const [{ data: summary }, { data: moves }] = await Promise.all([
        supabase.rpc("cash_summary", { p_register: open.s.id }),
        supabase
          .from("cash_movements")
          .select("id, kind, amount, reason, category, created_by, created_at")
          .eq("register_id", open.s.id)
          .order("created_at", { ascending: false }),
      ]);

      const movements: CashMovement[] = (moves ?? []).map((m) => ({
        id: m.id,
        kind: m.kind as "egreso" | "ingreso",
        amount: Number(m.amount),
        reason: m.reason ?? null,
        category: m.category ?? null,
        by: m.created_by ? (names.get(m.created_by) ?? "—") : "—",
        createdAt: m.created_at,
      }));

      return {
        session: open.s,
        summary: (summary as CashSummary) ?? null,
        movements,
        history,
      };
    };

    const [celulares, electronicas] = await Promise.all([
      build("celulares"),
      build("electronicas"),
    ]);
    return { celulares, electronicas, source: "supabase" };
  } catch {
    return SAMPLE;
  }
});
