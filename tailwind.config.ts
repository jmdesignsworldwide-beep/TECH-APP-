import type { Config } from "tailwindcss";

/**
 * JM Tech — Sistema de diseño.
 * Los colores de acento son REACTIVOS: dependen de variables CSS que cambian
 * según el `profile_type` activo (cian = celulares, índigo = electrónicas) y
 * según el tema (oscuro/claro). Ver src/app/globals.css.
 */
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Superficies y texto leen de variables de tema (oscuro/claro).
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        // Acento REACTIVO al perfil activo.
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          strong: "rgb(var(--accent-strong) / <alpha-value>)",
          fg: "rgb(var(--accent-fg) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        // Sombras en capas (no planas).
        glass:
          "0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 8px 30px -12px rgb(0 0 0 / 0.6)",
        "glass-lg":
          "0 1px 0 0 rgb(255 255 255 / 0.05) inset, 0 24px 60px -20px rgb(0 0 0 / 0.7)",
        glow: "0 0 0 1px rgb(var(--accent) / 0.35), 0 0 24px -2px rgb(var(--accent) / 0.45)",
        "glow-sm": "0 0 16px -4px rgb(var(--accent) / 0.5)",
      },
      keyframes: {
        "aurora-1": {
          "0%, 100%": { transform: "translate(-8%, -6%) scale(1)" },
          "50%": { transform: "translate(6%, 8%) scale(1.15)" },
        },
        "aurora-2": {
          "0%, 100%": { transform: "translate(6%, 4%) scale(1.1)" },
          "50%": { transform: "translate(-6%, -8%) scale(0.95)" },
        },
        "aurora-3": {
          "0%, 100%": { transform: "translate(0%, 6%) scale(1.05)" },
          "50%": { transform: "translate(4%, -4%) scale(1.2)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "aurora-1": "aurora-1 18s ease-in-out infinite",
        "aurora-2": "aurora-2 24s ease-in-out infinite",
        "aurora-3": "aurora-3 30s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
