"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Mail,
  Package,
  Pencil,
  Phone,
  Plus,
  Power,
  Truck,
  User,
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
import { saveSupplier, setSupplierActive, type SupplierInput } from "@/lib/suppliers/actions";
import type { Supplier, SuppliersBundle } from "@/lib/suppliers/types";
import { cn, formatRD } from "@/lib/utils";
import { DetailRow, EmptyState, StatusPill } from "@/components/postventa/kit";

const inputCls =
  "w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70";

const emptyForm = (profile: Supplier["profileType"]): SupplierInput => ({
  id: null,
  profile,
  name: "",
  contact: "",
  phone: "",
  email: "",
  supplies: "",
  notes: "",
});

function fmtDate(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function SuppliersView({ bundle }: { bundle: SuppliersBundle }) {
  const router = useRouter();
  const { profile } = useProfile();
  const meta = PROFILE_META[profile];
  const list = bundle[profile];
  const demo = bundle.source === "sample";

  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBought = list.reduce((a, s) => a + s.totalPurchased, 0);
  const activos = list.filter((s) => s.isActive).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((s) =>
      q === ""
        ? true
        : s.name.toLowerCase().includes(q) ||
          (s.contact ?? "").toLowerCase().includes(q) ||
          (s.supplies ?? "").toLowerCase().includes(q),
    );
  }, [list, query]);

  function openCreate() {
    setForm(emptyForm(profile));
    setError(null);
  }
  function openEdit(s: Supplier) {
    setForm({
      id: s.id,
      profile,
      name: s.name,
      contact: s.contact ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      supplies: s.supplies ?? "",
      notes: s.notes ?? "",
    });
    setError(null);
  }

  async function submit() {
    if (!form) return;
    setBusy(true);
    setError(null);
    const res = await saveSupplier(form);
    setBusy(false);
    if (res.ok) {
      setForm(null);
      router.refresh();
    } else setError(res.error ?? "No se pudo guardar.");
  }

  async function toggleActive(s: Supplier) {
    setBusy(true);
    const res = await setSupplierActive(s.id, !s.isActive);
    setBusy(false);
    if (res.ok) {
      setDetail(null);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Proveedores"
        subtitle={
          <>
            Proveedores de <span className="font-medium text-fg">{meta.label}</span> — contacto y
            compras.
            {demo && <span className="ml-1 text-muted/70">Datos de muestra.</span>}
          </>
        }
        actions={
          <PremiumButton size="sm" onClick={openCreate} disabled={demo}>
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </PremiumButton>
        }
      />

      <Stagger key={profile} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <KpiCard label="Proveedores" value={activos} icon={Truck} />
        </StaggerItem>
        <StaggerItem>
          <KpiCard label="Total comprado" value={totalBought} icon={Package} currency />
        </StaggerItem>
        <StaggerItem>
          <KpiCard label="Tienda" value={list.length} icon={Building2} suffix="registrados" />
        </StaggerItem>
      </Stagger>

      <GlassPanel className="p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por empresa, contacto o producto…"
          className={inputCls}
        />
      </GlassPanel>

      {filtered.length ? (
        <Stagger key={profile + query} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((s) => (
            <StaggerItem key={s.id}>
              <button onClick={() => setDetail(s)} className="block w-full text-left">
                <GlassPanel className={cn("flex h-full items-start gap-3 p-4 transition-shadow duration-300 hover:shadow-glow", !s.isActive && "opacity-60")}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg">{s.name}</p>
                    <p className="truncate text-xs text-muted">{s.supplies ?? "—"}</p>
                    <p className="mt-1.5 text-xs text-muted">
                      {s.purchases.length} compras ·{" "}
                      <span className="font-medium text-fg tnum">{formatRD(s.totalPurchased)}</span>
                    </p>
                  </div>
                </GlassPanel>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState message="No hay proveedores para esta búsqueda." />
      )}

      {/* Detalle */}
      <PremiumModal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ""}
        description={detail ? `Proveedor · Tienda ${meta.label}` : undefined}
        size="md"
      >
        {detail && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-surface-2/40 p-4">
              {detail.contact && <DetailRow label="Contacto" value={<span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5 text-muted" />{detail.contact}</span>} />}
              {detail.phone && <DetailRow label="Teléfono" value={<span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-muted" />{detail.phone}</span>} />}
              {detail.email && <DetailRow label="Email" value={<span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-muted" />{detail.email}</span>} />}
              {detail.supplies && <DetailRow label="Suministra" value={detail.supplies} />}
              <DetailRow label="Total comprado" value={formatRD(detail.totalPurchased)} valueClass="text-accent" />
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
                <Package className="h-4 w-4 text-accent" /> Órdenes de compra
              </p>
              {detail.purchases.length ? (
                <div className="space-y-1.5">
                  {detail.purchases.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-surface-2/40 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-fg">{p.desc}</p>
                        <p className="text-[11px] text-muted">{fmtDate(p.date)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusPill
                          label={p.status === "en_camino" ? "En camino" : "Recibido"}
                          tone={p.status === "en_camino" ? "warning" : "success"}
                        />
                        <span className="text-sm font-semibold text-fg tnum">{formatRD(p.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-border/50 bg-surface-2/40 px-3 py-3 text-center text-sm text-muted">
                  Sin compras registradas.
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

      {/* Form */}
      <PremiumModal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? "Editar proveedor" : "Nuevo proveedor"}
        description={`Tienda ${meta.label}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={() => setForm(null)} disabled={busy}>
              Cancelar
            </PremiumButton>
            <PremiumButton size="sm" onClick={submit} loading={busy} disabled={!form?.name.trim()}>
              {form?.id ? "Guardar" : "Crear proveedor"}
            </PremiumButton>
          </div>
        }
      >
        {form && (
          <div className="space-y-3">
            <Field label="Empresa / nombre">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Importadora TecnoRD" autoFocus className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contacto">
                <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Persona de contacto" className={inputCls} />
              </Field>
              <Field label="Teléfono">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="809-555-0100" className={inputCls} />
              </Field>
            </div>
            <Field label="Email">
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ventas@proveedor.do" className={inputCls} />
            </Field>
            <Field label="¿Qué suministra?">
              <input value={form.supplies} onChange={(e) => setForm({ ...form, supplies: e.target.value })} placeholder="Ej: TV, laptops, accesorios" className={inputCls} />
            </Field>
            <Field label="Notas (opcional)">
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones" className={inputCls} />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        )}
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
