"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Wrench } from "lucide-react";
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
import { PROFILE_META, type ProfileType } from "@/lib/types";
import { createRepair, updateRepairStatus, type RepairInput } from "@/lib/repairs/actions";
import type { Repair, RepairsBundle } from "@/lib/repairs/types";
import { REPAIR_STATUS, repairFlow, type RepairStatus } from "@/lib/postventa/status";
import { formatDateDO } from "@/lib/pos/receipt-format";
import { formatRD } from "@/lib/utils";
import {
  DetailRow,
  EmptyState,
  FilterBar,
  StatusPill,
  Timeline,
  type TimelineStep,
} from "@/components/postventa/kit";

const idLabel = (p: ProfileType) => (p === "celulares" ? "IMEI" : "Nº de serie");

const emptyInput = (profile: ProfileType): RepairInput => ({
  profile,
  customerName: "",
  device: "",
  identifier: "",
  problem: "",
  budget: "",
  technician: "",
});

const inputCls =
  "w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70";

export function RepairsView({ bundle }: { bundle: RepairsBundle }) {
  const router = useRouter();
  const { profile } = useProfile();
  const meta = PROFILE_META[profile];
  const list = bundle[profile];
  const demo = bundle.source === "sample";
  const flow = repairFlow(profile);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Repair | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<RepairInput>(emptyInput(profile));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    for (const r of list) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((r) => (filter === "all" ? true : r.status === filter))
      .filter((r) =>
        q === ""
          ? true
          : r.orderNumber.toLowerCase().includes(q) ||
            r.customerName.toLowerCase().includes(q) ||
            r.device.toLowerCase().includes(q) ||
            (r.identifier ?? "").toLowerCase().includes(q),
      );
  }, [list, filter, query]);

  const chips = [
    { value: "all", label: "Todas", count: counts.all ?? 0 },
    ...flow.map((s) => ({ value: s, label: REPAIR_STATUS[s].label, count: counts[s] ?? 0 })),
  ];
  const enTaller = list.filter((r) => r.status !== "entregado" && r.status !== "listo" && r.status !== "cancelado").length;

  function openCreate() {
    setForm(emptyInput(profile));
    setError(null);
    setCreating(true);
  }

  async function submitCreate() {
    setBusy(true);
    setError(null);
    const res = await createRepair(form);
    setBusy(false);
    if (res.ok) {
      setCreating(false);
      router.refresh();
    } else setError(res.error ?? "No se pudo crear.");
  }

  async function advance(r: Repair, status: RepairStatus) {
    setBusy(true);
    setError(null);
    const res = await updateRepairStatus(r.id, status, r.history);
    setBusy(false);
    if (res.ok) {
      setDetail(null);
      router.refresh();
    } else setError(res.error ?? "No se pudo actualizar.");
  }

  const timeline = (r: Repair): TimelineStep[] =>
    r.history.map((h) => ({
      status: h.status,
      at: h.at,
      label: REPAIR_STATUS[h.status]?.label ?? h.status,
      tone: REPAIR_STATUS[h.status]?.tone ?? "neutral",
    }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Reparaciones"
        subtitle={
          <>
            Servicio técnico de <span className="font-medium text-fg">{meta.label}</span> —{" "}
            {profile === "celulares" ? "órdenes por equipo (IMEI)." : "órdenes de servicio (nº de serie)."}
            {demo && <span className="ml-1 text-muted/70">Datos de muestra.</span>}
          </>
        }
        actions={
          <PremiumButton size="sm" onClick={openCreate} disabled={demo}>
            <Plus className="h-4 w-4" />
            Nueva orden
          </PremiumButton>
        }
      />

      <Stagger key={profile} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <KpiCard label="En taller" value={enTaller} icon={Wrench} />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Listos para entregar"
            value={counts.listo ?? 0}
            icon={CheckCircle2}
            className={(counts.listo ?? 0) > 0 ? "ring-1 ring-success/30" : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard label="Entregados" value={counts.entregado ?? 0} icon={CheckCircle2} />
        </StaggerItem>
      </Stagger>

      <GlassPanel className="p-5">
        <FilterBar
          query={query}
          onQuery={setQuery}
          placeholder={`Buscar por orden, cliente, equipo o ${idLabel(profile)}…`}
          chips={chips}
          active={filter}
          onChip={setFilter}
        />
      </GlassPanel>

      {filtered.length ? (
        <Stagger key={profile + filter} className="space-y-2">
          {filtered.map((r) => (
            <StaggerItem key={r.id}>
              <button onClick={() => setDetail(r)} className="block w-full text-left">
                <GlassPanel className="flex items-center gap-3 p-3.5 transition-shadow duration-300 hover:shadow-glow">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Wrench className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{r.device}</p>
                    <p className="truncate text-xs text-muted">
                      {r.orderNumber} · {r.customerName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusPill
                      label={REPAIR_STATUS[r.status].label}
                      tone={REPAIR_STATUS[r.status].tone}
                      pulse={r.status === "listo"}
                    />
                    <p className="mt-1 text-[11px] text-muted tnum">{formatRD(r.budget)}</p>
                  </div>
                </GlassPanel>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState message="No hay órdenes para estos filtros." />
      )}

      {/* Detalle */}
      <PremiumModal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.device ?? ""}
        description={detail ? `${detail.orderNumber} · Tienda ${meta.label}` : undefined}
        size="md"
      >
        {detail && (
          <div className="space-y-4">
            <StatusPill
              label={REPAIR_STATUS[detail.status].label}
              tone={REPAIR_STATUS[detail.status].tone}
              pulse={detail.status === "listo"}
            />
            <div className="rounded-2xl border border-border/60 bg-surface-2/40 p-4">
              <DetailRow label="Cliente" value={detail.customerName} />
              <DetailRow label={idLabel(profile)} value={detail.identifier ?? "—"} />
              <DetailRow label="Problema" value={detail.problem ?? "—"} />
              <DetailRow label="Presupuesto" value={formatRD(detail.budget)} />
              <DetailRow label="Técnico" value={detail.technician ?? "—"} />
              <DetailRow label="Recibido" value={formatDateDO(detail.createdAt).split(" ")[0]} />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-fg">Historial de la orden</p>
              <Timeline steps={timeline(detail)} />
            </div>

            {detail.status !== "entregado" && detail.status !== "cancelado" && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Avanzar estado</p>
                <div className="flex flex-wrap gap-2">
                  {flow.slice(flow.indexOf(detail.status) + 1).map((s) => (
                    <PremiumButton
                      key={s}
                      variant="subtle"
                      size="sm"
                      loading={busy}
                      disabled={demo}
                      onClick={() => advance(detail, s)}
                    >
                      {REPAIR_STATUS[s].label}
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
        title="Nueva orden de reparación"
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
              disabled={!form.customerName.trim() || !form.device.trim()}
            >
              Crear orden
            </PremiumButton>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="Cliente">
            <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nombre del cliente" autoFocus className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Equipo">
              <input value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} placeholder={profile === "celulares" ? "Ej: iPhone 13" : "Ej: Smart TV LG 55\""} className={inputCls} />
            </Field>
            <Field label={idLabel(profile)}>
              <input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder={profile === "celulares" ? "IMEI" : "Nº de serie"} className={inputCls} />
            </Field>
          </div>
          <Field label="Problema reportado">
            <input value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Ej: no enciende, pantalla rota…" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Presupuesto (RD$)">
              <input type="number" inputMode="decimal" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" className={`${inputCls} tnum`} />
            </Field>
            <Field label="Técnico">
              <input value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} placeholder="Nombre del técnico" className={inputCls} />
            </Field>
          </div>
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
