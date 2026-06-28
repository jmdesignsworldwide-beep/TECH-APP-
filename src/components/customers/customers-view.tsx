"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cake,
  CreditCard,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Power,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  GlassPanel,
  KpiCard,
  PremiumButton,
  PremiumModal,
  PulseBadge,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { useProfile } from "@/lib/profile/profile-provider";
import { PROFILE_META } from "@/lib/types";
import { saveCustomer, setCustomerActive, type SaveCustomerInput } from "@/lib/customers/actions";
import type { CustomersBundle, CustomerWithStats } from "@/lib/customers/types";
import { formatDateDO } from "@/lib/pos/receipt-format";
import { cn, formatRD } from "@/lib/utils";
import { DetailRow, EmptyState } from "@/components/postventa/kit";

const FREQUENT = 3;
const inputCls =
  "w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

const emptyForm = (profile: CustomerWithStats["profileType"]): SaveCustomerInput => ({
  id: null,
  profile,
  fullName: "",
  cedula: "",
  phone: "",
  email: "",
  address: "",
  birthday: "",
});

export function CustomersView({ bundle }: { bundle: CustomersBundle }) {
  const router = useRouter();
  const { profile } = useProfile();
  const meta = PROFILE_META[profile];
  const list = bundle[profile];
  const demo = bundle.source === "sample";

  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<CustomerWithStats | null>(null);
  const [form, setForm] = useState<SaveCustomerInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thisMonth = new Date().getMonth();
  const frequent = list.filter((c) => c.stats.purchaseCount >= FREQUENT).length;
  const birthdays = list.filter(
    (c) => c.birthday && new Date(c.birthday + "T00:00:00").getMonth() === thisMonth,
  ).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((c) =>
      q === ""
        ? true
        : c.fullName.toLowerCase().includes(q) ||
          (c.cedula ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q),
    );
  }, [list, query]);

  function openCreate() {
    setForm(emptyForm(profile));
    setError(null);
  }
  function openEdit(c: CustomerWithStats) {
    setForm({
      id: c.id,
      profile,
      fullName: c.fullName,
      cedula: c.cedula ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      birthday: c.birthday ?? "",
    });
    setError(null);
  }

  async function submit() {
    if (!form) return;
    setBusy(true);
    setError(null);
    const res = await saveCustomer(form);
    setBusy(false);
    if (res.ok) {
      setForm(null);
      router.refresh();
    } else setError(res.error ?? "No se pudo guardar.");
  }

  async function toggleActive(c: CustomerWithStats) {
    setBusy(true);
    const res = await setCustomerActive(c.id, !c.isActive);
    setBusy(false);
    if (res.ok) {
      setDetail(null);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Clientes"
        subtitle={
          <>
            Clientes de <span className="font-medium text-fg">{meta.label}</span> — con su historial
            de compras real.
            {demo && <span className="ml-1 text-muted/70">Datos de muestra.</span>}
          </>
        }
        actions={
          <PremiumButton size="sm" onClick={openCreate} disabled={demo}>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </PremiumButton>
        }
      />

      <Stagger key={profile} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <KpiCard label="Clientes" value={list.length} icon={Users} />
        </StaggerItem>
        <StaggerItem>
          <KpiCard label="Frecuentes (3+ compras)" value={frequent} icon={Star} />
        </StaggerItem>
        <StaggerItem>
          <KpiCard label="Cumpleaños del mes" value={birthdays} icon={Cake} />
        </StaggerItem>
      </Stagger>

      <GlassPanel className="p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, cédula, teléfono o email…"
          className={inputCls}
        />
      </GlassPanel>

      {filtered.length ? (
        <Stagger key={profile + query} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <StaggerItem key={c.id}>
              <button onClick={() => setDetail(c)} className="block w-full text-left">
                <GlassPanel className={cn("flex items-center gap-3 p-3.5 transition-shadow duration-300 hover:shadow-glow", !c.isActive && "opacity-60")}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-sm font-semibold text-accent">
                    {initials(c.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-fg">
                      {c.fullName}
                      {c.stats.purchaseCount >= FREQUENT && (
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">{c.cedula ?? c.phone ?? "—"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-fg tnum">{formatRD(c.stats.totalSpent)}</p>
                    <p className="text-[11px] text-muted">{c.stats.purchaseCount} compras</p>
                  </div>
                </GlassPanel>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState message="No hay clientes para esta búsqueda." />
      )}

      {/* Detalle con historial real */}
      <PremiumModal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.fullName ?? ""}
        description={detail ? `Cliente · Tienda ${meta.label}` : undefined}
        size="md"
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {detail.stats.purchaseCount >= FREQUENT && (
                <PulseBadge tone="warning">Cliente frecuente</PulseBadge>
              )}
              {!detail.isActive && <span className="text-xs text-muted">(inactivo)</span>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="Total gastado" value={formatRD(detail.stats.totalSpent)} accent />
              <MiniStat label="Compras" value={String(detail.stats.purchaseCount)} />
              <MiniStat
                label="Última"
                value={detail.stats.lastPurchase ? formatDateDO(detail.stats.lastPurchase).split(" ")[0] : "—"}
              />
            </div>

            <div className="rounded-2xl border border-border/60 bg-surface-2/40 p-4">
              {detail.cedula && <DetailRow label="Cédula" value={detail.cedula} />}
              {detail.phone && <DetailRow label="Teléfono" value={detail.phone} />}
              {detail.email && <DetailRow label="Email" value={detail.email} />}
              {detail.address && <DetailRow label="Dirección" value={detail.address} />}
              {detail.birthday && (
                <DetailRow label="Cumpleaños" value={formatDateDO(detail.birthday + "T00:00:00").split(" ")[0]} />
              )}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
                <ShoppingBag className="h-4 w-4 text-accent" /> Productos frecuentes
              </p>
              {detail.stats.topProducts.length ? (
                <div className="space-y-1.5">
                  {detail.stats.topProducts.map((p) => (
                    <div key={p.name} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-2/40 px-3 py-2 text-sm">
                      <span className="truncate text-fg">{p.name}</span>
                      <span className="shrink-0 text-muted">{p.qty} uds</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-border/50 bg-surface-2/40 px-3 py-3 text-center text-sm text-muted">
                  Aún sin compras en esta tienda.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <PremiumButton variant="ghost" size="sm" onClick={() => openEdit(detail)} disabled={demo}>
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </PremiumButton>
              <PremiumButton variant="subtle" size="sm" onClick={() => toggleActive(detail)} loading={busy} disabled={demo}>
                <Power className="h-3.5 w-3.5" />
                {detail.isActive ? "Desactivar" : "Reactivar"}
              </PremiumButton>
            </div>
          </div>
        )}
      </PremiumModal>

      {/* Form crear/editar */}
      <PremiumModal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? "Editar cliente" : "Nuevo cliente"}
        description={`Tienda ${meta.label}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={() => setForm(null)} disabled={busy}>
              Cancelar
            </PremiumButton>
            <PremiumButton size="sm" onClick={submit} loading={busy} disabled={!form?.fullName.trim()}>
              {form?.id ? "Guardar" : "Crear cliente"}
            </PremiumButton>
          </div>
        }
      >
        {form && (
          <div className="space-y-3">
            <Field label="Nombre completo" icon={Users}>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nombre del cliente" autoFocus className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cédula" icon={IdCard}>
                <input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} placeholder="001-1234567-8" className={inputCls} />
              </Field>
              <Field label="Teléfono" icon={Phone}>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="809-555-0100" className={inputCls} />
              </Field>
            </div>
            <Field label="Email" icon={Mail}>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" className={inputCls} />
            </Field>
            <Field label="Dirección" icon={MapPin}>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle, número, ciudad" className={inputCls} />
            </Field>
            <Field label="Cumpleaños" icon={Cake}>
              <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className={inputCls} />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        )}
      </PremiumModal>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl border px-3 py-2.5", accent ? "border-accent/25 bg-accent/5" : "border-border/50 bg-surface-2/40")}>
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-0.5 text-base font-semibold tnum", accent ? "text-accent" : "text-fg")}>{value}</p>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {children}
    </label>
  );
}
