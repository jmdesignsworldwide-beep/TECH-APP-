"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ProfileType } from "@/lib/types";

interface ProfileContextValue {
  profile: ProfileType;
  setProfile: (p: ProfileType) => void;
  toggleProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * Estado del perfil activo en el cliente. Se inicializa con el valor que el
 * servidor ya pintó en <html data-profile> (sin parpadeo) y, al cambiarlo,
 * actualiza el atributo —lo que re-viste TODO el sistema (acento + aurora)— y
 * lo persiste en cookie vía API para que sobreviva a recargas.
 *
 * El switch de perfil COMPLETO (con cambio de categorías/campos) es de una
 * tanda posterior; aquí queda el cableado del color reactivo, ya funcional.
 */
export function ProfileProvider({
  initialProfile,
  children,
}: {
  initialProfile: ProfileType;
  children: React.ReactNode;
}) {
  const [profile, setProfileState] = useState<ProfileType>(initialProfile);

  useEffect(() => {
    document.documentElement.setAttribute("data-profile", profile);
  }, [profile]);

  const setProfile = useCallback((p: ProfileType) => {
    setProfileState(p);
    document.documentElement.setAttribute("data-profile", p);
    // Persistencia best-effort; no bloquea la transición visual.
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: p }),
    }).catch(() => {});
  }, []);

  const toggleProfile = useCallback(() => {
    setProfile(profile === "celulares" ? "electronicas" : "celulares");
  }, [profile, setProfile]);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, toggleProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx)
    throw new Error("useProfile debe usarse dentro de <ProfileProvider>");
  return ctx;
}
