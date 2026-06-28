"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
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
import { registerClaim } from "@/lib/warranties/actions";
import type { Warranty, WarrantiesBundle } from "@/lib/warranties/types";
import { WARRANTY_STATUS, type WarrantyState } from "@/lib/postventa/status";
import { formatDateDO } from "@/lib/pos/receipt-format";
import { cn, formatRD } from "@/lib/utils";
import { DetailRow, EmptyState, FilterBar, StatusPill } from "@/components/postventa/kit";

const RESOLUTIONS = ["cambio", "reparación", "devolución"];
const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "activa", label: "Activa" },
  { value: "por_vencer", label: "Por vencer" },
  { value: "vencida", label: "Vencida" },
  { value: "reclamada", label: "Reclamada" },
];

export function WarrantiesView({ bundle }: { bundle: WarrantiesBundle }) {
  const router = useRouter();
  const { profile } = useProfile();
  const meta = PROFILE_META[profile];
  const list = bundle[profile];
  const demo = bundle.source === "sample";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Warranty | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState(RESOLUTIONS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    for (const w of list) c[w.state] = (c[w.state] ?? 0) + 1;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((w) => (filter === "all" ? true : w.state === filter))
      .filter((w) =>
        q === ""
          ? true
          : w.warrantyNumber.toLowerCase().includes(q) ||
            w.productName.toLowerCase().includes(q) ||
            w.customerName.toLowerCase().includes(q) ||
            (w.serial ?? "").toLowerCase().includes(q),
      );
  }, [list, filter, query]);

  const chips = FILTERS.map((f) => ({ ...f, count: counts[f.value] ?? 0 }));
  const activas = (counts.activa ?? 0) + (counts.por_vencer ?? 0);

  function closeDetail() {
    setDetail(null);
    setClaiming(false);
    setReason("");
    setError(null);
    setBusy(false);
  }

  async function submitClaim() {
    if (!detail) return;
    setBusy(true);
    setError(null);
    const res = await registerClaim(detail.id, reason, resolution);
    setBusy(false);
    if (res.ok) {
      closeDetail();
      router.refresh();
    } else setError(res.error ?? "No se pudo registrar.");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Garantías"
        subtitle={
          <>
            Garantías de <span className="font-medium text-fg">{meta.label}</span> — seguimiento y
            reclamos.
            {demo && <span className="ml-1 text-muted/70">Datos de muestra.</span>}
          </>
        }
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
            <ShieldCheck className="h-4 w-4" />
            {meta.label}
          </span>
        }
      />

      <Stagger key={profile} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <KpiCard label="Garantías activas" value={activas} icon={ShieldCheck} />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Por vencer (30 días)"
            value={counts.por_vencer ?? 0}
            icon={CalendarClock}
            className={(counts.por_vencer ?? 0) > 0 ? "ring-1 ring-warning/30" : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard label="Reclamadas" value={counts.reclamada ?? 0} icon={ShieldAlert} />
        </StaggerItem>
      </Stagger>

      <GlassPanel className="p-5">
        <FilterBar
          query={query}
          onQuery={setQuery}
          placeholder="Buscar por número, producto, cliente o serie…"
          chips={chips}
          active={filter}
          onChip={setFilter}
        />
      </GlassPanel>

      {filtered.length ? (
        <Stagger key={profile + filter} className="space-y-2">
          {filtered.map((w) => (
            <StaggerItem key={w.id}>
              <button onClick={() => setDetail(w)} className="block w-full text-left">
                <GlassPanel className="flex items-center gap-3 p-3.5 transition-shadow duration-300 hover:shadow-glow">
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                      w.state === "vencida"
                        ? "bg-danger/10 text-danger"
                        : w.state === "reclamada"
                          ? "bg-accent/10 text-accent"
                          : w.state === "por_vencer"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success",
                    )}
                  >
                    {w.state === "vencida" ? (
                      <ShieldX className="h-5 w-5" />
                    ) : w.state === "reclamada" ? (
                      <ShieldAlert className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{w.productName}</p>
                    <p className="truncate text-xs text-muted">
                      {w.warrantyNumber} · {w.customerName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusPill
                      label={WARRANTY_STATUS[w.state].label}
                      tone={WARRANTY_STATUS[w.state].tone}
                      pulse={w.state === "por_vencer"}
                    />
                    <p className="mt-1 text-[11px] text-muted">
                      {w.state === "vencida"
                        ? `venció ${formatDateDO(w.expiresAt).split(" ")[0]}`
                        : w.state === "reclamada"
                          ? "reclamada"
                          : `${w.daysLeft} días`}
                    </p>
                  </div>
                </GlassPanel>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState message="No hay garantías para estos filtros." />
      )}

      {/* Detalle / reclamo */}
      <PremiumModal
        open={detail !== null}
        onClose={closeDetail}
        title={detail?.productName ?? ""}
        description={detail ? `${detail.warrantyNumber} · Tienda ${meta.label}` : undefined}
        size="md"
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                label={WARRANTY_STATUS[detail.state].label}
                tone={WARRANTY_STATUS[detail.state].tone}
                pulse={detail.state === "por_vencer"}
              />
              {detail.state !== "vencida" && detail.state !== "reclamada" && (
                <span className="text-xs text-muted">Vence en {detail.daysLeft} días</span>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-surface-2/40 p-4">
              <DetailRow label="Cliente" value={detail.customerName} />
              <DetailRow label="Serie / IMEI" value={detail.serial ?? "—"} />
              <DetailRow label="Plazo" value={`${detail.months} meses`} />
              <DetailRow label="Vendió" value={detail.sellerName ?? "—"} />
              <DetailRow label="Inicio" value={formatDateDO(detail.startsAt).split(" ")[0]} />
              <DetailRow label="Vence" value={formatDateDO(detail.expiresAt).split(" ")[0]} />
            </div>

            {detail.state === "reclamada" ? (
              <div className="rounded-2xl border border-accent/25 bg-accent/[0.05] p-4 text-sm">
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-accent">
                  <CheckCircle2 className="h-4 w-4" /> Reclamo registrado
                </p>
                <DetailRow label="Motivo" value={detail.claimReason ?? "—"} />
                <DetailRow
                  label="Solución"
                  value={<span className="capitalize">{detail.claimResolution ?? "—"}</span>}
                />
                {detail.claimedAt && (
                  <DetailRow label="Fecha" value={formatDateDO(detail.claimedAt)} />
                )}
              </div>
            ) : claiming ? (
              <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-2/40 p-4">
                <p className="text-sm font-semibold text-fg">Registrar reclamo</p>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">Motivo</span>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: pantalla con líneas, no enciende…"
                    autoFocus
                    className="w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">Solución</span>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm capitalize text-fg outline-none focus:border-accent/70"
                  >
                    {RESOLUTIONS.map((r) => (
                      <option key={r} value={r} className="capitalize">
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="flex justify-end gap-2">
                  <PremiumButton variant="ghost" size="sm" onClick={() => setClaiming(false)} disabled={busy}>
                    Cancelar
                  </PremiumButton>
                  <PremiumButton size="sm" onClick={submitClaim} loading={busy} disabled={!reason.trim()}>
                    Registrar reclamo
                  </PremiumButton>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <PremiumButton size="sm" onClick={() => setClaiming(true)} disabled={demo}>
                  <ShieldAlert className="h-4 w-4" />
                  Registrar reclamo
                </PremiumButton>
              </div>
            )}
          </div>
        )}
      </PremiumModal>
    </div>
  );
}
