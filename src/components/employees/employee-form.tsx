"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { PremiumButton } from "@/components/ui";
import type { EmployeeInput } from "@/lib/employees/actions";
import type { Employee, EmployeeRole } from "@/lib/employees/types";
import type { ProfileType } from "@/lib/types";

const ROLES: { value: EmployeeRole; label: string }[] = [
  { value: "administrador", label: "Administrador" },
  { value: "vendedor", label: "Vendedor" },
  { value: "cajero", label: "Cajero" },
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted/70">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-border/70 bg-surface-2/50 px-3 py-2.5 text-sm text-fg outline-none focus:border-accent/70";

export function EmployeeForm({
  profile,
  employee,
  canSeeSalary,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  profile: ProfileType;
  employee: Employee | null;
  canSeeSalary: boolean;
  busy: boolean;
  error: string | null;
  onSubmit: (input: EmployeeInput) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(employee?.fullName ?? "");
  const [cedula, setCedula] = useState(employee?.cedula ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [role, setRole] = useState<EmployeeRole>(employee?.role ?? "vendedor");
  const [username, setUsername] = useState(employee?.username ?? "");
  const [hiredAt, setHiredAt] = useState(
    employee?.hiredAt ?? new Date().toISOString().slice(0, 10),
  );
  const [salary, setSalary] = useState(
    employee?.salary != null ? String(employee.salary) : "",
  );
  const [notes, setNotes] = useState(employee?.notes ?? "");

  function submit() {
    onSubmit({
      id: employee?.id ?? null,
      profile,
      fullName,
      cedula,
      phone,
      role,
      username,
      hiredAt,
      salary,
      notes,
    });
  }

  return (
    <div className="space-y-3">
      <Field label="Nombre completo">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ej: Wandy Manuel Ureña"
          autoFocus
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cédula" hint="000-0000000-0">
          <input
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="001-1234567-8"
            className={inputCls}
          />
        </Field>
        <Field label="Teléfono" hint="809 / 829 / 849">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="809-555-0100"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Rol en la tienda">
          <select value={role} onChange={(e) => setRole(e.target.value as EmployeeRole)} className={inputCls}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Usuario de acceso">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="wurena"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha de ingreso">
          <input
            type="date"
            value={hiredAt}
            onChange={(e) => setHiredAt(e.target.value)}
            className={inputCls}
          />
        </Field>
        {canSeeSalary && (
          <Field label="Salario (RD$)" hint="Privado — solo el dueño/admin lo ve">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="28000"
              className={`${inputCls} tnum`}
            />
          </Field>
        )}
      </div>

      <Field label="Notas (opcional)">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones internas"
          className={inputCls}
        />
      </Field>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <PremiumButton variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          Cancelar
        </PremiumButton>
        <PremiumButton size="sm" onClick={submit} loading={busy} disabled={!fullName.trim()}>
          {employee ? "Guardar cambios" : "Registrar empleado"}
        </PremiumButton>
      </div>
    </div>
  );
}
