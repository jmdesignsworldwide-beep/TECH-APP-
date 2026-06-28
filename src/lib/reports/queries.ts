import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import { SAMPLE_REPORTS } from "./sample-data";
import type {
  EmployeeRow,
  LowStockRow,
  MethodRow,
  ReportsBundle,
  ReportsData,
  SeriesPoint,
  TopProductRow,
} from "./types";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const METHOD_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
  credito: "Crédito",
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export const getReportsBundle = cache(async (): Promise<ReportsBundle> => {
  if (!isSupabaseConfigured()) return SAMPLE_REPORTS;

  try {
    const supabase = createSupabaseServerClient();
    const now = new Date();
    const since = new Date(now);
    since.setMonth(now.getMonth() - 6);

    const [
      { data: sales, error: e1 },
      { data: products },
      { data: payments },
      { data: activity },
      { data: warranties },
      { data: orders },
    ] = await Promise.all([
      supabase
        .from("sales")
        .select("id, profile_type, total, sold_at")
        .neq("status", "anulada")
        .gte("sold_at", since.toISOString()),
      supabase.from("products").select("id, name, profile_type, stock, min_stock").eq("active", true),
      supabase.from("sale_payments").select("sale_id, method, amount"),
      supabase.from("activity_log").select("profile_type, actor_name, amount, action_type").eq("action_type", "venta"),
      supabase.from("warranties").select("profile_type, status, expires_at").eq("status", "vigente"),
      supabase.from("orders").select("profile_type, status").in("status", ["pendiente", "en_proceso"]),
    ]);
    if (e1) throw e1;

    const saleList = sales ?? [];
    const saleIds = saleList.map((s) => s.id);
    const saleProfile = new Map(saleList.map((s) => [s.id, s.profile_type as ProfileType]));

    let items: { sale_id: string; product_id: string; qty: number; line_total: number }[] = [];
    if (saleIds.length) {
      const { data } = await supabase
        .from("sale_items")
        .select("sale_id, product_id, qty, line_total")
        .in("sale_id", saleIds);
      items = (data ?? []) as typeof items;
    }
    const pName = new Map((products ?? []).map((p) => [p.id, p.name as string]));

    const in30 = new Date(now);
    in30.setDate(now.getDate() + 30);

    const build = (profile: ProfileType): ReportsData => {
      const pSales = saleList.filter((s) => s.profile_type === profile);
      const totalSales = pSales.reduce((a, s) => a + Number(s.total), 0);
      const salesCount = pSales.length;
      const ticketAvg = salesCount ? Math.round(totalSales / salesCount) : 0;

      // Series por día (14), semana (8), mes (6).
      const byDay: SeriesPoint[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const k = dayKey(d);
        const total = pSales
          .filter((s) => dayKey(new Date(s.sold_at)) === k)
          .reduce((a, s) => a + Number(s.total), 0);
        byDay.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total });
      }
      const byWeek: SeriesPoint[] = [];
      for (let i = 7; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        const total = pSales
          .filter((s) => {
            const t = new Date(s.sold_at).getTime();
            return t >= start.setHours(0, 0, 0, 0) && t <= end.setHours(23, 59, 59, 999);
          })
          .reduce((a, s) => a + Number(s.total), 0);
        byWeek.push({ label: `sem ${8 - i}`, total });
      }
      const byMonth: SeriesPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const total = pSales
          .filter((s) => {
            const sd = new Date(s.sold_at);
            return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
          })
          .reduce((a, s) => a + Number(s.total), 0);
        byMonth.push({ label: MONTHS[d.getMonth()], total });
      }

      // Top productos + unidades.
      const pItems = items.filter((it) => saleProfile.get(it.sale_id) === profile);
      const unitsSold = pItems.reduce((a, it) => a + it.qty, 0);
      const byProduct = new Map<string, { qty: number; revenue: number }>();
      for (const it of pItems) {
        const cur = byProduct.get(it.product_id) ?? { qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += Number(it.line_total);
        byProduct.set(it.product_id, cur);
      }
      const topProducts: TopProductRow[] = [...byProduct.entries()]
        .map(([pid, v]) => ({ name: pName.get(pid) ?? "Producto", qty: v.qty, revenue: v.revenue }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 6);

      // Ventas por empleado (del historial atribuido).
      const empMap = new Map<string, { total: number; count: number }>();
      for (const a of activity ?? []) {
        if (a.profile_type !== profile) continue;
        const cur = empMap.get(a.actor_name) ?? { total: 0, count: 0 };
        cur.total += Number(a.amount ?? 0);
        cur.count += 1;
        empMap.set(a.actor_name, cur);
      }
      const byEmployee: EmployeeRow[] = [...empMap.entries()]
        .map(([name, v]) => ({ name, total: v.total, count: v.count }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      // Ventas por método de pago (real, de sale_payments).
      const pSaleIdSet = new Set(pSales.map((s) => s.id));
      const methodMap = new Map<string, number>();
      for (const p of payments ?? []) {
        if (!pSaleIdSet.has(p.sale_id)) continue;
        methodMap.set(p.method, (methodMap.get(p.method) ?? 0) + Number(p.amount));
      }
      const byMethod: MethodRow[] = [...methodMap.entries()]
        .map(([method, total]) => ({ method, label: METHOD_LABEL[method] ?? method, total }))
        .sort((a, b) => b.total - a.total);

      // Bajo stock.
      const lowList = (products ?? []).filter(
        (p) => p.profile_type === profile && p.stock <= p.min_stock,
      );
      const lowStock: LowStockRow[] = lowList.map((p) => ({
        name: p.name,
        stock: p.stock,
        minStock: p.min_stock,
      }));

      // Mejor día (por día de la semana, sobre el histórico del perfil).
      const byWeekday = new Array(7).fill(0);
      for (const s of pSales) byWeekday[new Date(s.sold_at).getDay()] += Number(s.total);
      let bestIdx = -1;
      let bestVal = 0;
      byWeekday.forEach((v, i) => {
        if (v > bestVal) {
          bestVal = v;
          bestIdx = i;
        }
      });
      const bestDay = bestIdx >= 0 ? { label: WEEKDAYS[bestIdx], total: bestVal } : null;

      const expiringWarranties = (warranties ?? []).filter(
        (w) =>
          w.profile_type === profile &&
          w.expires_at >= now.toISOString().slice(0, 10) &&
          w.expires_at <= in30.toISOString().slice(0, 10),
      ).length;
      const pendingOrders = (orders ?? []).filter((o) => o.profile_type === profile).length;

      return {
        totalSales,
        salesCount,
        ticketAvg,
        unitsSold,
        byDay,
        byWeek,
        byMonth,
        topProducts,
        byEmployee,
        byMethod,
        lowStock,
        lowStockCount: lowStock.length,
        expiringWarranties,
        pendingOrders,
        bestDay,
      };
    };

    return { celulares: build("celulares"), electronicas: build("electronicas"), source: "supabase" };
  } catch {
    return SAMPLE_REPORTS;
  }
});
