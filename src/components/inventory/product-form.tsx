"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import {
  getFields,
  SECTION_LABELS,
  type FieldDef,
} from "@/lib/inventory/fields";
import type { Product, ProductCondition, ProductInput } from "@/lib/inventory/types";
import type { ProfileType } from "@/lib/types";
import { cn } from "@/lib/utils";

const SECTIONS: FieldDef["section"][] = [
  "basico",
  "especificaciones",
  "precio",
  "stock",
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Valores iniciales del formulario (crear vs editar). */
function initialValues(
  fields: FieldDef[],
  product?: Product,
  prefill?: Record<string, string>,
): Record<string, string> {
  const v: Record<string, string> = {};
  for (const f of fields) {
    if (f.storage === "attribute") {
      v[f.key] = product?.attributes?.[f.key] ?? "";
    } else {
      const raw = product
        ? (product as unknown as Record<string, unknown>)[f.key]
        : undefined;
      v[f.key] = raw === null || raw === undefined ? "" : String(raw);
    }
  }
  if (!product) {
    v.condition = v.condition || "nuevo";
    v.warrantyMonths = v.warrantyMonths || "12";
    v.entryDate = v.entryDate || todayISO();
    v.stock = v.stock || "0";
    v.minStock = v.minStock || "5";
    // Pre-relleno desde la navegación (categoría/marca seleccionada en el árbol).
    if (prefill) {
      for (const [k, val] of Object.entries(prefill)) {
        if (val) v[k] = val;
      }
    }
  }
  return v;
}

/**
 * Formulario de producto cuyos CAMPOS dependen del perfil activo (celulares
 * pide IMEI/almacenamiento/RAM/red; electrónicas pide serie/voltaje/specs).
 * Reusa el estilo de inputs premium del sistema. Scroll interno apto para móvil.
 */
export function ProductForm({
  profile,
  product,
  prefill,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  profile: ProfileType;
  product?: Product;
  prefill?: Record<string, string>;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: ProductInput) => void;
  onCancel: () => void;
}) {
  const fields = useMemo(() => getFields(profile), [profile]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    initialValues(fields, product, prefill),
  );

  function set(key: string, val: string) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = (s: string) => {
      const n = parseFloat(s.replace(/,/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    const input: ProductInput = {
      profileType: profile,
      name: values.name?.trim() ?? "",
      brand: values.brand?.trim() ?? "",
      model: values.model?.trim() ?? "",
      category: values.category ?? "",
      sku: values.sku?.trim() ?? "",
      color: values.color?.trim() ?? "",
      condition: (values.condition || "nuevo") as ProductCondition,
      price: num(values.price ?? "0"),
      cost: num(values.cost ?? "0"),
      stock: Math.round(num(values.stock ?? "0")),
      minStock: Math.round(num(values.minStock ?? "0")),
      supplier: values.supplier?.trim() ?? "",
      warrantyMonths: Math.round(num(values.warrantyMonths ?? "0")),
      entryDate: values.entryDate ?? "",
      attributes: {},
    };
    for (const f of fields) {
      if (f.storage === "attribute") input.attributes[f.key] = values[f.key] ?? "";
    }
    onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {SECTIONS.map((section) => {
        const sectionFields = fields.filter((f) => f.section === section);
        if (!sectionFields.length) return null;
        return (
          <fieldset key={section} className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-accent-soft">
              {SECTION_LABELS[section]}
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sectionFields.map((f) => (
                <Field
                  key={f.key}
                  field={f}
                  value={values[f.key] ?? ""}
                  onChange={(val) => set(f.key, val)}
                />
              ))}
            </div>
          </fieldset>
        );
      })}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end gap-2 pt-1">
        <PremiumButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </PremiumButton>
        <PremiumButton type="submit" size="sm" loading={submitting}>
          {product ? "Guardar cambios" : "Crear producto"}
        </PremiumButton>
      </div>
    </form>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputCls =
    "w-full rounded-xl border border-border/70 bg-surface-2/50 px-3.5 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-muted/50 focus:border-accent/70 focus:bg-surface-2/80";

  return (
    <label className={cn("block", field.full && "sm:col-span-2")}>
      <span className="mb-1.5 block text-xs font-medium text-muted">
        {field.label}
        {field.required && <span className="text-accent"> *</span>}
      </span>
      {field.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={cn(inputCls, "capitalize")}
        >
          <option value="">—</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={field.placeholder}
          className={cn(inputCls, "resize-none")}
        />
      ) : (
        <input
          type={
            field.type === "number" || field.type === "currency"
              ? "number"
              : field.type === "date"
                ? "date"
                : "text"
          }
          inputMode={
            field.type === "number" || field.type === "currency"
              ? "decimal"
              : undefined
          }
          min={field.type === "number" || field.type === "currency" ? 0 : undefined}
          step={field.type === "currency" ? "0.01" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
          className={cn(inputCls, "tnum")}
        />
      )}
    </label>
  );
}
