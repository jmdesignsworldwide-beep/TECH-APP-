"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, PackageCheck, Plus, Truck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  GlassPanel,
  KpiCard,
  PremiumButton,
  PremiumModal,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { useProfile } from "@/lib/profile/profile-provider";
import { PROFILE_META } from "@/lib/types";
import { createOrder, updateOrderStatus, type OrderInput } from "@/lib/orders/actions";
import type { Order, OrdersBundle } from "@/lib/orders/types";
import { ORDER_FLOW, ORDER_STATUS, type OrderStatus } from "@/lib/postventa/status";
import { formatDateDO } from "@/lib/pos/receipt-format";
import { cn, formatRD } from "@/lib/utils";
import {
  DetailRow,
  EmptyState,
  FilterBar,
  StatusPill,
  Timeline,
  type TimelineStep,
} from "@/components/postventa/kit";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "llego", label: "Llegó" },
  { value: "entregado", label: "Entregado" },
];

const emptyInput = (profile: Order["profileType"]): OrderInput => ({
  profile,
  customerName: "",
  itemDesc: "",
  total: "",
  deposit: "",
  supplier: "",
  expectedAt: "",
  note: "",
});

const inputCls =
  "w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70";

export function OrdersView({ bundle }: { bundle: OrdersBundle }) {
  const router = useRouter();
  const { profile } = useProfile();
  const meta = PROFILE_META[profile];
  const list = bundle[profile];
  const demo = bundle.source === "sample";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Order | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<OrderInput>(emptyInput(profile));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    for (const o of list) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((o) => (filter === "all" ? true : o.status === filter))
      .filter((o) =>
        q === ""
          ? true
          : o.customerName.toLowerCase().includes(q) ||
            o.itemDesc.toLowerCase().includes(q) ||
            (o.supplier ?? "").toLowerCase().includes(q),
      );
  }, [list, filter, query]);

  const chips = FILTERS.map((f) => ({ ...f, count: counts[f.value] ?? 0 }));
  const pendientes = (counts.pendiente ?? 0) + (counts.en_proceso ?? 0);

  function openCreate() {
    setForm(emptyInput(profile));
    setError(null);
    setCreating(true);
  }

  async function submitCreate() {
    setBusy(true);
    setError(null);
    const res = await createOrder(form);
    setBusy(false);
    if (res.ok) {
      setCreating(false);
      router.refresh();
    } else setError(res.error ?? "No se pudo crear.");
  }

  async function advance(o: Order, status: OrderStatus) {
    setBusy(true);
    setError(null);
    const res = await updateOrderStatus(o.id, status, o.history);
    setBusy(false);
    if (res.ok) {
      setDetail(null);
      router.refresh();
    } else setError(res.error ?? "No se pudo actualizar.");
  }

  const timeline = (o: Order): TimelineStep[] =>
    o.history.map((h) => ({
      status: h.status,
      at: h.at,
      label: ORDER_STATUS[h.status]?.label ?? h.status,
      tone: ORDER_STATUS[h.status]?.tone ?? "neutral",
    }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Pedidos"
        subtitle={
          <>
            Encargos de <span className="font-medium text-fg">{meta.label}</span> — seguimiento y
            entrega.
            {demo && <span className="ml-1 text-muted/70">Datos de muestra.</span>}
          </>
        }
        actions={
          <PremiumButton size="sm" onClick={openCreate} disabled={demo}>
            <Plus className="h-4 w-4" />
            Nuevo pedido
          </PremiumButton>
        }
      />

      <Stagger key={profile} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <KpiCard label="Pendientes" value={pendientes} icon={Box} />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Por entregar (llegaron)"
            value={counts.llego ?? 0}
            icon={Truck}
            className={(counts.llego ?? 0) > 0 ? "ring-1 ring-warning/30" : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard label="Entregados" value={counts.entregado ?? 0} icon={PackageCheck} />
        </StaggerItem>
      </Stagger>

      <GlassPanel className="p-5">
        <FilterBar
          query={query}
          onQuery={setQuery}
          placeholder="Buscar por cliente, producto o proveedor…"
          chips={chips}
          active={filter}
          onChip={setFilter}
        />
      </GlassPanel>

      {filtered.length ? (
        <Stagger key={profile + filter} className="space-y-2">
          {filtered.map((o) => (
            <StaggerItem key={o.id}>
              <button onClick={() => setDetail(o)} className="block w-full text-left">
                <GlassPanel className="flex items-center gap-3 p-3.5 transition-shadow duration-300 hover:shadow-glow">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Box className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{o.itemDesc}</p>
                    <p className="truncate text-xs text-muted">
                      {o.customerName}
                      {o.supplier ? ` · ${o.supplier}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusPill
                      label={ORDER_STATUS[o.status].label}
                      tone={ORDER_STATUS[o.status].tone}
                      pulse={o.status === "llego"}
                    />
                    <p className="mt-1 text-[11px] text-muted tnum">
                      {o.balance > 0 ? `balance ${formatRD(o.balance)}` : "pagado"}
                    </p>
                  </div>
                </GlassPanel>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState message="No hay pedidos para estos filtros." />
      )}

      {/* Detalle */}
      <PremiumModal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.itemDesc ?? ""}
        description={detail ? `Pedido · Tienda ${meta.label}` : undefined}
        size="md"
      >
        {detail && (
          <div className="space-y-4">
            <StatusPill
              label={ORDER_STATUS[detail.status].label}
              tone={ORDER_STATUS[detail.status].tone}
              pulse={detail.status === "llego"}
            />
            <div className="rounded-2xl border border-border/60 bg-surface-2/40 p-4">
              <DetailRow label="Cliente" value={detail.customerName} />
              <DetailRow label="Proveedor" value={detail.supplier ?? "—"} />
              <DetailRow label="Total" value={formatRD(detail.total)} />
              <DetailRow label="Adelanto" value={formatRD(detail.deposit)} />
              <DetailRow
                label="Balance"
                value={formatRD(detail.balance)}
                valueClass={detail.balance > 0 ? "text-warning" : "text-success"}
              />
              {detail.expectedAt && (
                <DetailRow label="Fecha estimada" value={formatDateDO(detail.expectedAt).split(" ")[0]} />
              )}
              {detail.note && <DetailRow label="Nota" value={detail.note} />}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-fg">Historial del pedido</p>
              <Timeline steps={timeline(detail)} />
            </div>

            {detail.status !== "entregado" && detail.status !== "cancelado" && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Avanzar estado</p>
                <div className="flex flex-wrap gap-2">
                  {ORDER_FLOW.slice(ORDER_FLOW.indexOf(detail.status) + 1).map((s) => (
                    <PremiumButton
                      key={s}
                      variant="subtle"
                      size="sm"
                      loading={busy}
                      disabled={demo}
                      onClick={() => advance(detail, s)}
                    >
                      {ORDER_STATUS[s].label}
                    </PremiumButton>
                  ))}
                </div>
                {error && <p className="mt-2 text-sm text-danger">{error}</p>}
              </div>
            )}
          </div>
        )}
      </PremiumModal>

      {/* Crear */}
      <PremiumModal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo pedido"
        description={`Tienda ${meta.label}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={() => setCreating(false)} disabled={busy}>
              Cancelar
            </PremiumButton>
            <PremiumButton
              size="sm"
              onClick={submitCreate}
              loading={busy}
              disabled={!form.customerName.trim() || !form.itemDesc.trim()}
            >
              Crear pedido
            </PremiumButton>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="Cliente">
            <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nombre del cliente" autoFocus className={inputCls} />
          </Field>
          <Field label="¿Qué encargó?">
            <input value={form.itemDesc} onChange={(e) => setForm({ ...form, itemDesc: e.target.value })} placeholder="Ej: iPhone 15 Pro Max 256GB" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total (RD$)">
              <input type="number" inputMode="decimal" min={0} value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} placeholder="0" className={`${inputCls} tnum`} />
            </Field>
            <Field label="Adelanto (RD$)">
              <input type="number" inputMode="decimal" min={0} value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} placeholder="0" className={`${inputCls} tnum`} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Proveedor">
              <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Proveedor del pedido" className={inputCls} />
            </Field>
            <Field label="Fecha estimada">
              <input type="date" value={form.expectedAt} onChange={(e) => setForm({ ...form, expectedAt: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <Field label="Nota (opcional)">
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Observaciones" className={inputCls} />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </PremiumModal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
