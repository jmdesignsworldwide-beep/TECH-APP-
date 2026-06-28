"use client";

import { cn } from "@/lib/utils";

/**
 * AURORA reactiva — el fondo vivo de JM Tech.
 *
 * Tres capas de luz con blur profundo que respiran en bucle (movimiento lento,
 * orgánico). Sus colores leen de las variables --aurora-a/b/c, que cambian con
 * el PERFIL activo: cian (celulares) → índigo (electrónicas). Al cambiar de
 * perfil, la aurora acompaña la transición, así el cambio se SIENTE.
 *
 * En tema claro baja su opacidad (--aurora-opacity) para no comerse la
 * legibilidad. Respeta prefers-reduced-motion vía la config de animación.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {/* Capa base near-black con viñeta para dar profundidad. */}
      <div className="absolute inset-0 bg-bg" />

      {/* Capas de aurora — opacidad global modulada por el tema. */}
      <div
        className="absolute inset-0"
        style={{ opacity: "var(--aurora-opacity)" }}
      >
        <div
          className="absolute -left-[10%] top-[-15%] h-[60vh] w-[60vw] animate-aurora-1 rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgb(var(--aurora-a) / 0.55), transparent 62%)",
            filter: "blur(var(--aurora-blur))",
          }}
        />
        <div
          className="absolute right-[-15%] top-[5%] h-[65vh] w-[55vw] animate-aurora-2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgb(var(--aurora-b) / 0.5), transparent 60%)",
            filter: "blur(var(--aurora-blur))",
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[20%] h-[60vh] w-[60vw] animate-aurora-3 rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgb(var(--aurora-c) / 0.45), transparent 64%)",
            filter: "blur(var(--aurora-blur))",
          }}
        />
      </div>

      {/* Rejilla fina para textura técnica (sutil). */}
      <div
        className="absolute inset-0"
        style={{
          opacity: "var(--grid-opacity)",
          backgroundImage:
            "linear-gradient(rgb(var(--fg) / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--fg) / 0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 75%)",
        }}
      />

      {/* Grano/ruido muy tenue para que no se vea plano (solo oscuro). */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
    </div>
  );
}
