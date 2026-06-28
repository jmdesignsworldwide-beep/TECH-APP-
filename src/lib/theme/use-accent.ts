"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/lib/profile/profile-provider";
import { useTheme } from "@/lib/theme/theme-provider";

/**
 * Lee el color de acento activo (variable CSS --accent) ya resuelto a canales
 * RGB, y lo recalcula cuando cambia el perfil o el tema. Útil para librerías
 * como Recharts que necesitan un color real (var() no funciona en atributos
 * de presentación SVG).
 */
export function useAccent() {
  const { profile } = useProfile();
  const { theme } = useTheme();
  const [rgb, setRgb] = useState("34 211 238");

  useEffect(() => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim();
    if (v) setRgb(v);
  }, [profile, theme]);

  return { rgb, color: `rgb(${rgb})` };
}
