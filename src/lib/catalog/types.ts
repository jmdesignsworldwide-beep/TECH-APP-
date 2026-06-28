import type { ProfileType } from "@/lib/types";

export interface BrandNode {
  name: string;
  count: number;
}

export interface CategoryNode {
  name: string;
  count: number;
  brands: BrandNode[];
}

export interface CatalogBundle {
  celulares: CategoryNode[];
  electronicas: CategoryNode[];
  source: "supabase" | "sample";
}

/** Selección actual del árbol. */
export interface TreeSelection {
  category: string | null;
  brand: string | null;
}

export type { ProfileType };
