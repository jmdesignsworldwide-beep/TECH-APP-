import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import { buildSampleBundle } from "./sample-data";
import type {
  DashboardBundle,
  DashboardData,
  PaymentSlice,
  TrendPoint,
} from "./types";

const DAY_LABELS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const PROFILES: ProfileType[] = ["celulares", "electronicas"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function hhmm(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ageLabel(iso: string, now: Date) {
  const days = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / 86_400_000,
  );
  if (days <= 0) return "hoy";
  if (days === 1) return "hace 1 día";
  return `hace ${days} días`;
}

/**
 * Datos del Dashboard para AMBOS perfiles. Lee de Supabase cuando está
 * configurado; si no (o ante cualquier error), cae con elegancia a la semilla
 * dominicana de demo. Se calcula en el servidor y se pasa como props para que
 * el cambio de perfil sea instantáneo en el cliente (acento + datos).
 */
export const getDashboardData = cache(async (): Promise<DashboardBundle> => {
  if (!isSupabaseConfigured()) return buildSampleBundle();

  try {
    return await fetchFromSupabase();
  } catch {
    // No reventar el Dashboard si una consulta falla: degradar a la semilla.
    return buildSampleBundle();
  }
});

async function fetchFromSupabase(): Promise<DashboardBundle> {
  const supabase = createSupabaseServerClient();
  const now = new Date();
  const since = new Date(now);
  since.setDate(now.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const in30 = new Date(now);
  in30.setDate(now.getDate() + 30);

  const [
    { data: customers },
    { data: products },
    { data: sales },
    { data: orders },
    { data: warranties },
  ] = await Promise.all([
    supabase.from("customers").select("id, full_name"),
    supabase
      .from("products")
      .select("id, name, brand, profile_type, stock, min_stock")
      .eq("active", true),
    supabase
      .from("sales")
      .select("id, profile_type, customer_id, total, itbis, payment_method, sold_at")
      .neq("status", "anulada")
      .gte("sold_at", since.toISOString()),
    supabase
      .from("orders")
      .select("id, profile_type, customer_id, total, status, created_at")
      .in("status", ["pendiente", "en_proceso"]),
    supabase
      .from("warranties")
      .select("id, product_id, customer_id, expires_at, status")
      .eq("status", "vigente")
      .gte("expires_at", now.toISOString().slice(0, 10))
      .lte("expires_at", in30.toISOString().slice(0, 10)),
  ]);

  const custName = new Map(
    (customers ?? []).map((c) => [c.id, c.full_name as string]),
  );
  const prod = new Map(
    (products ?? []).map((p) => [p.id, p as Record<string, unknown>]),
  );

  // Líneas de las ventas en ventana (para unidades y top producto de hoy).
  const saleIds = (sales ?? []).map((s) => s.id);
  let items: { sale_id: string; product_id: string; qty: number }[] = [];
  if (saleIds.length) {
    const { data } = await supabase
      .from("sale_items")
      .select("sale_id, product_id, qty")
      .in("sale_id", saleIds);
    items = (data ?? []) as typeof items;
  }
  const saleProfile = new Map(
    (sales ?? []).map((s) => [s.id, s.profile_type as ProfileType]),
  );
  const saleIsToday = new Map(
    (sales ?? []).map((s) => [s.id, ymd(new Date(s.sold_at)) === ymd(now)]),
  );

  // Pagos por venta (para el desglose por método con pago mixto).
  let payRows: { sale_id: string; method: string; amount: number }[] = [];
  if (saleIds.length) {
    const { data } = await supabase
      .from("sale_payments")
      .select("sale_id, method, amount")
      .in("sale_id", saleIds);
    payRows = (data ?? []) as typeof payRows;
  }
  const paysBySale = new Map<string, { method: string; amount: number }[]>();
  for (const p of payRows) {
    const arr = paysBySale.get(p.sale_id) ?? [];
    arr.push({ method: p.method, amount: Number(p.amount) });
    paysBySale.set(p.sale_id, arr);
  }
  // efectivo / transferencia se mantienen; débito y crédito caen en "tarjeta".
  const bucketOf = (m: string): "efectivo" | "tarjeta" | "transferencia" =>
    m === "efectivo" ? "efectivo" : m === "transferencia" ? "transferencia" : "tarjeta";

  const build = (profile: ProfileType): DashboardData => {
    const pSales = (sales ?? []).filter((s) => s.profile_type === profile);
    const todays = pSales.filter((s) => ymd(new Date(s.sold_at)) === ymd(now));

    const salesToday = sum(todays.map((s) => Number(s.total)));
    const itbisToday = sum(todays.map((s) => Number(s.itbis)));
    const ticketAvg = todays.length ? Math.round(salesToday / todays.length) : 0;

    // Tendencia 7 días.
    const trend: TrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = ymd(d);
      const total = sum(
        pSales
          .filter((s) => ymd(new Date(s.sold_at)) === key)
          .map((s) => Number(s.total)),
      );
      trend.push({ label: DAY_LABELS[d.getDay()], total });
    }

    // Pagos de hoy (si no hay, usar la ventana completa). Usa el desglose real
    // de sale_payments cuando existe (pago mixto); si no, atribuye el total al
    // método de la venta.
    const payBase = todays.length ? todays : pSales;
    const buckets = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    for (const s of payBase) {
      const rows = paysBySale.get(s.id);
      if (rows && rows.length) {
        for (const r of rows) buckets[bucketOf(r.method)] += r.amount;
      } else {
        buckets[bucketOf(s.payment_method)] += Number(s.total);
      }
    }
    const payments: PaymentSlice[] = (
      ["efectivo", "tarjeta", "transferencia"] as const
    ).map((method) => ({ method, total: buckets[method] }));

    // Unidades y top producto de hoy.
    const todayItems = items.filter(
      (it) => saleProfile.get(it.sale_id) === profile && saleIsToday.get(it.sale_id),
    );
    const unitsSoldToday = sum(todayItems.map((it) => it.qty));
    const byProduct = new Map<string, number>();
    for (const it of todayItems) {
      byProduct.set(it.product_id, (byProduct.get(it.product_id) ?? 0) + it.qty);
    }
    let topProduct: DashboardData["topProduct"] = null;
    let best = 0;
    for (const [pid, units] of byProduct) {
      if (units > best) {
        best = units;
        topProduct = { name: (prod.get(pid)?.name as string) ?? "—", units };
      }
    }

    const lowStockList = (products ?? [])
      .filter((p) => p.profile_type === profile && p.stock <= p.min_stock)
      .map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        stock: p.stock,
        minStock: p.min_stock,
      }));

    const pendingOrders = (orders ?? [])
      .filter((o) => o.profile_type === profile)
      .map((o) => ({
        id: o.id,
        customer: custName.get(o.customer_id) ?? "Cliente",
        total: Number(o.total),
        status: o.status as DashboardData["pendingOrders"][number]["status"],
        age: ageLabel(o.created_at, now),
      }));

    const expiringWarranties = (warranties ?? [])
      .filter((w) => (prod.get(w.product_id)?.profile_type as ProfileType) === profile)
      .map((w) => ({
        id: w.id,
        product: (prod.get(w.product_id)?.name as string) ?? "Producto",
        customer: custName.get(w.customer_id) ?? "Cliente",
        daysLeft: Math.max(
          0,
          Math.ceil(
            (new Date(w.expires_at).getTime() - now.getTime()) / 86_400_000,
          ),
        ),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      profile,
      salesToday,
      itbisToday,
      ticketAvg,
      unitsSoldToday,
      topProduct,
      lowStockCount: lowStockList.length,
      pendingOrdersCount: pendingOrders.length,
      expiringWarrantiesCount: expiringWarranties.length,
      trend,
      payments,
      salesTodayList: todays
        .sort(
          (a, b) =>
            new Date(b.sold_at).getTime() - new Date(a.sold_at).getTime(),
        )
        .slice(0, 12)
        .map((s) => ({
          id: s.id,
          customer: custName.get(s.customer_id) ?? "Cliente",
          total: Number(s.total),
          method: s.payment_method as "efectivo" | "tarjeta" | "transferencia",
          time: hhmm(s.sold_at),
        })),
      lowStockList,
      pendingOrders,
      expiringWarranties,
    };
  };

  const [celulares, electronicas] = PROFILES.map(build);
  return { celulares, electronicas, source: "supabase" };
}

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}
