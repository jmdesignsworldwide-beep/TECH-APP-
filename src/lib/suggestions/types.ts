export interface Suggestion {
  id?: string;
  label: string;
  sublabel?: string;
}

export interface ProfileSuggestions {
  customers: Suggestion[];
  products: Suggestion[];
  suppliers: Suggestion[];
  brands: Suggestion[];
  categories: Suggestion[];
  technicians: Suggestion[];
}

export interface SuggestionBundle {
  celulares: ProfileSuggestions;
  electronicas: ProfileSuggestions;
  source: "supabase" | "sample";
}

export const EMPTY_SUGGESTIONS: ProfileSuggestions = {
  customers: [],
  products: [],
  suppliers: [],
  brands: [],
  categories: [],
  technicians: [],
};
