"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ThemeMode } from "@/lib/types";

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "jm-theme";

/**
 * Script inline que corre ANTES del primer paint para fijar data-theme y
 * evitar el parpadeo (flash) al cargar. Lee la preferencia guardada o el
 * sistema. Se inyecta en <head> vía dangerouslySetInnerHTML.
 */
export const themeNoFlashScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var m=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';var t=s==='light'||s==='dark'?s:'dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  // Sincroniza el estado de React con lo que el script inline ya aplicó.
  useEffect(() => {
    const current = document.documentElement.getAttribute(
      "data-theme",
    ) as ThemeMode | null;
    if (current === "light" || current === "dark") setThemeState(current);
  }, []);

  const apply = useCallback((t: ThemeMode) => {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* storage no disponible */
    }
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [theme, apply]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
