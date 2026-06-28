/** Tipos compartidos del dominio JM Tech. */

/** Doble perfil del sistema. Un solo campo distingue los productos. */
export type ProfileType = "celulares" | "electronicas";

export type ThemeMode = "dark" | "light";

/** Usuario autenticado tal como lo expone el servidor a la UI. */
export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: AppRole;
  /** Modo de origen de la sesión. */
  source: "supabase" | "demo";
}

/** Roles de aplicación (validados en el servidor, no solo en UI). */
export type AppRole = "owner" | "admin" | "staff";

export const PROFILE_META: Record<
  ProfileType,
  { label: string; tagline: string }
> = {
  celulares: {
    label: "Celulares",
    tagline: "Cian eléctrico",
  },
  electronicas: {
    label: "Electrónicas",
    tagline: "Índigo profundo",
  },
};
