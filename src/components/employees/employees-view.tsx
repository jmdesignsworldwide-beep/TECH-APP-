"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  IdCard,
  Pencil,
  Phone,
  Power,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  GlassPanel,
  PremiumButton,
  PremiumModal,
  PulseBadge,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { useProfile } from "@/lib/profile/profile-provider";
import { PROFILE_META } from "@/lib/types";
import { saveEmployee, setEmployeeActive, type EmployeeInput } from "@/lib/employees/actions";
import type {
  ActivityEntry,
  Employee,
  EmployeeAlert,
  EmployeeRole,
  EmployeesBundle,
} from "@/lib/employees/types";
import { actionMeta, TONE_CLASSES } from "@/lib/employees/activity-meta";
import { formatDateDO } from "@/lib/pos/receipt-format";
import { cn, formatRD } from "@/lib/utils";
import { ActivityFeed, InviolableBadge } from "./activity-feed";
import { EmployeeForm } from "./employee-form";

const ROLE_LABEL: Record<EmployeeRole, string> = {
  administrador: "Administrador",
  vendedor: "Vendedor",
  cajero: "Cajero",
};

type Modal =
  | { kind: "none" }
  | { kind: "form"; employee: Employee | null }
  | { kind: "detail"; employee: Employee }
  | { kind: "activity"; entry: ActivityEntry }
  | { kind: "confirm"; employee: Employee };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function EmployeesView({ bundle }: { bundle: EmployeesBundle }) {
  const router = useRouter();
  const { profile } = useProfile();
  const meta = PROFILE_META[profile];
  const state = bundle[profile];
  const demo = bundle.source === "sample";
  const canSeeSalary = bundle.canSeeSalary;

  const [modal, setModal] = useState<Modal>({ kind: "none" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alertsByEmployee = new Map(state.alerts.map((a) => [a.employeeId, a]));
  const activeCount = state.employees.filter((e) => e.isActive).length;

  function closeModal() {
    setModal({ kind: "none" });
    setError(null);
    setBusy(false);
  }

  async function submitForm(input: EmployeeInput) {
    setBusy(true);
    setError(null);
    const res = await saveEmployee(input);
    setBusy(false);
    if (res.ok) {
      closeModal();
      router.refresh();
    } else setError(res.error ?? "No se pudo guardar.");
  }

  async function toggleActive(emp: Employee) {
    setBusy(true);
    setError(null);
    const res = await setEmployeeActive(emp.id, !emp.isActive);
    setBusy(false);
    if (res.ok) {
      closeModal();
      router.refresh();
    } else setError(res.error ?? "No se pudo actualizar.");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Empleados"
        subtitle={
          <>
            Plantilla de <span className="font-medium text-fg">{meta.label}</span> —{" "}
            cada tienda con sus empleados, su historial y sus alertas.
            {demo && (
              <span className="ml-1 text-muted/70">
                Conecta Supabase para gestionar empleados reales.
              </span>
            )}
          </>
        }
        actions={
          <PremiumButton size="sm" onClick={() => setModal({ kind: "form", employee: null })} disabled={demo}>
            <UserPlus className="h-4 w-4" />
            Agregar empleado
          </PremiumButton>
        }
      />

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon={Users} label="Empleados" value={String(activeCount)} sub={`de ${state.employees.length} en total`} />
        <MiniStat icon={ShieldCheck} label="Acciones registradas" value={String(state.activity.length)} sub="historial inviolable" />
        <MiniStat icon={ShieldAlert} label="Para revisar" value={String(state.alerts.length)} sub="empleados con alerta" tone={state.alerts.length ? "warn" : "neutral"} />
        <MiniStat icon={CreditCard} label="Tienda" value={meta.label} sub="plantilla independiente" />
      </div>

      {/* Actividad para revisar (alertas) */}
      {state.alerts.length > 0 && (
        <GlassPanel glow className="relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-warning/20 opacity-50 blur-3xl" />
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-warning/30 bg-warning/10 text-warning">
              <ShieldAlert className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-fg">
                Actividad para revisar
              </h2>
              <p className="text-xs text-muted">
                Patrones calculados sobre el historial real. Vigilancia informativa, no acusación.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {state.alerts.map((alert) => {
              const emp = state.employees.find((e) => e.id === alert.employeeId);
              return (
                <AlertCard
                  key={alert.employeeId}
                  alert={alert}
                  onReview={() => emp && setModal({ kind: "detail", employee: emp })}
                />
              );
            })}
          </div>
        </GlassPanel>
      )}

      {/* Plantilla */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-fg">
          <Users className="h-4 w-4 text-accent" />
          Plantilla — {meta.label}
        </h2>
        {state.employees.length ? (
          <Stagger key={profile} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state.employees.map((emp) => (
              <StaggerItem key={emp.id}>
                <EmployeeCard
                  emp={emp}
                  alert={alertsByEmployee.get(emp.id)}
                  canSeeSalary={canSeeSalary}
                  onOpen={() => setModal({ kind: "detail", employee: emp })}
                  onEdit={() => setModal({ kind: "form", employee: emp })}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <GlassPanel className="py-12 text-center text-sm text-muted">
            Aún no hay empleados en esta tienda. Agrega el primero.
          </GlassPanel>
        )}
      </div>

      {/* Historial inviolable global */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Historial de actividad — {meta.label}
          </h2>
          <InviolableBadge />
        </div>
        <GlassPanel className="flex max-h-[640px] flex-col p-4">
          <ActivityFeed
            key={profile}
            entries={state.activity}
            employees={state.employees}
            onSelect={(e) => setModal({ kind: "activity", entry: e })}
            limit={80}
          />
        </GlassPanel>
      </div>

      {/* ── Modales ─────────────────────────────────────────── */}
      <PremiumModal
        open={modal.kind === "form"}
        onClose={closeModal}
        title={modal.kind === "form" && modal.employee ? "Editar empleado" : "Nuevo empleado"}
        description={`Tienda ${meta.label}`}
        size="md"
      >
        {modal.kind === "form" && (
          <EmployeeForm
            profile={profile}
            employee={modal.employee}
            canSeeSalary={canSeeSalary}
            busy={busy}
            error={error}
            onSubmit={submitForm}
            onCancel={closeModal}
          />
        )}
      </PremiumModal>

      <PremiumModal
        open={modal.kind === "detail"}
        onClose={closeModal}
        title={modal.kind === "detail" ? modal.employee.fullName : ""}
        description={modal.kind === "detail" ? `${ROLE_LABEL[modal.employee.role]} · ${meta.label}` : undefined}
        size="lg"
      >
        {modal.kind === "detail" && (
          <EmployeeDetail
            emp={modal.employee}
            alert={alertsByEmployee.get(modal.employee.id)}
            activity={state.activity.filter((a) => a.employeeId === modal.employee.id)}
            canSeeSalary={canSeeSalary}
            busy={busy}
            onEdit={() => setModal({ kind: "form", employee: modal.employee })}
            onToggle={() => setModal({ kind: "confirm", employee: modal.employee })}
            onSelectActivity={(e) => setModal({ kind: "activity", entry: e })}
          />
        )}
      </PremiumModal>

      <PremiumModal
        open={modal.kind === "activity"}
        onClose={closeModal}
        title="Detalle del registro"
        description="Entrada del historial inviolable"
        size="sm"
      >
        {modal.kind === "activity" && <ActivityDetail entry={modal.entry} storeLabel={meta.label} />}
      </PremiumModal>

      <PremiumModal
        open={modal.kind === "confirm"}
        onClose={closeModal}
        title={modal.kind === "confirm" && modal.employee.isActive ? "Desactivar empleado" : "Reactivar empleado"}
        size="sm"
        footer={
          modal.kind === "confirm" ? (
            <div className="flex justify-end gap-2">
              <PremiumButton variant="ghost" size="sm" onClick={closeModal} disabled={busy}>
                Cancelar
              </PremiumButton>
              <PremiumButton
                size="sm"
                loading={busy}
                className={modal.employee.isActive ? "bg-danger text-white" : undefined}
                onClick={() => toggleActive(modal.employee)}
              >
                {modal.employee.isActive ? "Desactivar" : "Reactivar"}
              </PremiumButton>
            </div>
          ) : undefined
        }
      >
        {modal.kind === "confirm" && (
          <div className="space-y-2 text-sm text-muted">
            <p>
              {modal.employee.isActive ? (
                <>
                  <span className="font-medium text-fg">{modal.employee.fullName}</span> dejará de
                  aparecer como activo. No se borra: su historial queda intacto e inviolable.
                </>
              ) : (
                <>
                  <span className="font-medium text-fg">{modal.employee.fullName}</span> volverá a la
                  plantilla activa.
                </>
              )}
            </p>
            {error && <p className="text-danger">{error}</p>}
          </div>
        )}
      </PremiumModal>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: string;
  tone?: "neutral" | "warn";
}) {
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center gap-2 text-muted">
        <Icon className={cn("h-4 w-4", tone === "warn" ? "text-warning" : "text-accent")} />
        <span className="text-xs">{label}</span>
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", tone === "warn" ? "text-warning" : "text-fg")}>
        {value}
      </p>
      <p className="text-[11px] text-muted/70">{sub}</p>
    </GlassPanel>
  );
}

function EmployeeCard({
  emp,
  alert,
  canSeeSalary,
  onOpen,
  onEdit,
}: {
  emp: Employee;
  alert?: EmployeeAlert;
  canSeeSalary: boolean;
  onOpen: () => void;
  onEdit: () => void;
}) {
  return (
    <GlassPanel
      className={cn(
        "flex h-full flex-col gap-3 p-4 transition-shadow duration-300 hover:shadow-glow",
        !emp.isActive && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-base font-semibold text-accent">
          {initials(emp.fullName)}
        </span>
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-fg">
            {emp.fullName}
            {!emp.isActive && <span className="text-[10px] font-normal text-muted">(inactivo)</span>}
          </p>
          <p className="text-xs text-accent">{ROLE_LABEL[emp.role]}</p>
        </button>
        {alert && (
          <PulseBadge tone="warning" className="shrink-0">
            Revisar
          </PulseBadge>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-muted">
        {emp.cedula && (
          <p className="flex items-center gap-2">
            <IdCard className="h-3.5 w-3.5 shrink-0" /> {emp.cedula}
          </p>
        )}
        {emp.phone && (
          <p className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" /> {emp.phone}
          </p>
        )}
        <p className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" /> Ingresó{" "}
          {new Date(emp.hiredAt).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
        {canSeeSalary && emp.salary != null && (
          <p className="flex items-center gap-2 text-fg">
            <CreditCard className="h-3.5 w-3.5 shrink-0 text-muted" />
            <span className="tnum font-medium">{formatRD(emp.salary)}</span>
            <span className="rounded bg-surface-2/70 px-1 text-[10px] text-muted">privado</span>
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-1">
        <PremiumButton variant="ghost" size="sm" onClick={onEdit} className="flex-1">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </PremiumButton>
        <PremiumButton variant="subtle" size="sm" onClick={onOpen} className="flex-1">
          Ver historial
        </PremiumButton>
      </div>
    </GlassPanel>
  );
}

function AlertCard({ alert, onReview }: { alert: EmployeeAlert; onReview: () => void }) {
  return (
    <button onClick={onReview} className="block text-left">
      <div className="flex h-full flex-col gap-2 rounded-2xl border border-warning/25 bg-warning/[0.04] p-4 transition-colors duration-200 hover:bg-warning/[0.08]">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-fg">{alert.name}</span>
          <span className="shrink-0 text-[11px] text-muted">{ROLE_LABEL[alert.role]}</span>
        </div>
        <div className="space-y-1.5">
          {alert.flags.map((f) => (
            <div key={f.key} className="flex items-start gap-2 text-xs">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              <span>
                <span className="font-medium text-warning">{f.label}</span>
                <span className="text-muted"> — {f.detail}</span>
              </span>
            </div>
          ))}
        </div>
        <span className="mt-1 text-[11px] font-medium text-accent">Revisar historial →</span>
      </div>
    </button>
  );
}

function EmployeeDetail({
  emp,
  alert,
  activity,
  canSeeSalary,
  busy,
  onEdit,
  onToggle,
  onSelectActivity,
}: {
  emp: Employee;
  alert?: EmployeeAlert;
  activity: ActivityEntry[];
  canSeeSalary: boolean;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onSelectActivity: (e: ActivityEntry) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-lg font-semibold text-accent">
          {initials(emp.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5 text-xs text-muted">
            {emp.cedula && <span className="rounded-md bg-surface-2/70 px-2 py-0.5">{emp.cedula}</span>}
            {emp.phone && <span className="rounded-md bg-surface-2/70 px-2 py-0.5">{emp.phone}</span>}
            {emp.username && <span className="rounded-md bg-surface-2/70 px-2 py-0.5">@{emp.username}</span>}
            <span className={cn("rounded-md px-2 py-0.5", emp.isActive ? "bg-success/15 text-success" : "bg-surface-2/70 text-muted")}>
              {emp.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
          {canSeeSalary && emp.salary != null && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-fg">
              <CreditCard className="h-4 w-4 text-muted" />
              <span className="tnum font-semibold">{formatRD(emp.salary)}</span>
              <span className="rounded bg-surface-2/70 px-1.5 text-[10px] text-muted">salario privado</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <PremiumButton variant="ghost" size="sm" onClick={onEdit} disabled={busy}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </PremiumButton>
          <PremiumButton variant="subtle" size="sm" onClick={onToggle} disabled={busy}>
            <Power className="h-3.5 w-3.5" />
            {emp.isActive ? "Desactivar" : "Reactivar"}
          </PremiumButton>
        </div>
      </div>

      {alert && (
        <div className="rounded-2xl border border-warning/25 bg-warning/[0.05] p-3">
          {alert.flags.map((f) => (
            <div key={f.key} className="flex items-start gap-2 text-xs">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              <span>
                <span className="font-medium text-warning">{f.label}</span>
                <span className="text-muted"> — {f.detail}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Historial de {emp.fullName.split(" ")[0]}
          </h3>
          <InviolableBadge />
        </div>
        <div className="max-h-[42vh] overflow-hidden">
          <ActivityFeed entries={activity} employees={[]} onSelect={onSelectActivity} compact limit={50} />
        </div>
      </div>
    </div>
  );
}

function ActivityDetail({ entry, storeLabel }: { entry: ActivityEntry; storeLabel: string }) {
  const m = actionMeta(entry.action);
  const tone = TONE_CLASSES[m.tone];
  const Icon = m.icon;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl", tone.chip)}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-semibold text-fg">{m.label}</p>
          <p className="text-xs text-muted">Tienda {storeLabel}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface-2/40 p-4 text-sm">
        <DetailRow label="Empleado" value={entry.actorName} />
        <DetailRow label="Fecha y hora" value={formatDateDO(entry.createdAt)} />
        {entry.entityRef && <DetailRow label="Referencia" value={entry.entityRef} />}
        {entry.amount !== null && (
          <DetailRow
            label="Monto"
            value={formatRD(Math.abs(entry.amount))}
            valueClass={entry.severity === "warn" ? "text-warning" : "text-fg"}
          />
        )}
        <div className="mt-2 border-t border-dashed border-border/60 pt-2">
          <p className="text-xs font-medium text-muted">Detalle</p>
          <p className="mt-0.5 text-sm text-fg">{entry.detail}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/[0.06] px-3 py-2 text-xs text-muted">
        <BadgeCheck className="h-4 w-4 shrink-0 text-success" />
        Este registro es <span className="font-medium text-success">inviolable</span>: no se puede editar
        ni borrar, ni siquiera por el dueño. Garantizado en la base de datos.
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-muted">{label}</span>
      <span className={cn("text-sm font-medium tnum", valueClass ?? "text-fg")}>{value}</span>
    </div>
  );
}
