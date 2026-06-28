"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileType } from "@/lib/types";
import type { EmployeeRole } from "./types";

export interface EmployeeResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface EmployeeInput {
  id?: string | null;
  profile: ProfileType;
  fullName: string;
  cedula: string;
  phone: string;
  role: EmployeeRole;
  username: string;
  hiredAt: string; // YYYY-MM-DD
  salary: string; // crudo del input
  notes: string;
}

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (user.role !== "owner" && user.role !== "admin")
    return { ok: false, error: "No tienes permiso para gestionar empleados." };
  return { ok: true };
}

function demoBlocked(): EmployeeResult<never> {
  return {
    ok: false,
    error: "Modo demo: conecta Supabase para gestionar empleados.",
  };
}

function clean(msg: string) {
  return msg.replace(/^.*?:\s*/, "").trim() || "No se pudo completar la operación.";
}

function parseMoney(s: string): number | null {
  const t = (s || "").replace(/,/g, "").trim();
  if (t === "") return null;
  const n = parseFloat(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function saveEmployee(
  input: EmployeeInput,
): Promise<EmployeeResult<{ id: string }>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();
  if (!input.fullName.trim()) return { ok: false, error: "Indica el nombre." };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("employee_upsert", {
    p_id: input.id || null,
    p_profile: input.profile,
    p_full_name: input.fullName,
    p_cedula: input.cedula,
    p_phone: input.phone,
    p_role: input.role,
    p_username: input.username,
    p_photo_url: null,
    p_hired_at: input.hiredAt || null,
    p_salary: parseMoney(input.salary),
    p_notes: input.notes,
  });
  if (error) {
    if (/duplicate|unique/i.test(error.message))
      return { ok: false, error: "Ya existe un empleado con esa cédula." };
    return { ok: false, error: clean(error.message) };
  }
  revalidatePath("/empleados");
  return { ok: true, data: { id: String(data) } };
}

export async function setEmployeeActive(
  id: string,
  active: boolean,
): Promise<EmployeeResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  if (!isSupabaseConfigured()) return demoBlocked();

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.rpc("employee_set_active", {
    p_id: id,
    p_active: active,
  });
  if (error) return { ok: false, error: clean(error.message) };
  revalidatePath("/empleados");
  return { ok: true };
}
