import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Customer } from "./types";

const SAMPLE: Customer[] = [
  { id: "s1", fullName: "José Manuel Polanco", phone: "809-555-0142", cedula: "001-1234567-8" },
  { id: "s2", fullName: "María Altagracia Reyes", phone: "829-555-0188", cedula: "002-7654321-9" },
  { id: "s3", fullName: "Ramón Emilio Castillo", phone: "849-555-0123", cedula: "003-2468135-7" },
];

/** Clientes para el selector del POS (buscar/crear al vuelo). */
export const getCustomers = cache(async (): Promise<Customer[]> => {
  if (!isSupabaseConfigured()) return SAMPLE;
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, full_name, phone, cedula")
      .order("full_name");
    if (error) throw error;
    return (data ?? []).map((c) => ({
      id: c.id,
      fullName: c.full_name,
      phone: c.phone ?? null,
      cedula: c.cedula ?? null,
    }));
  } catch {
    return SAMPLE;
  }
});
