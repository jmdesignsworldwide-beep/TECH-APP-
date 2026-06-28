"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CountUpProps {
  value: number;
  /** Duración de la animación en ms. */
  duration?: number;
  /** Formateador (p. ej. formatRD). Por defecto separador de miles es-DO. */
  format?: (n: number) => string;
  className?: string;
  /** Arranca solo cuando entra en viewport. */
  startOnView?: boolean;
}

const defaultFormat = (n: number) =>
  new Intl.NumberFormat("es-DO", { maximumFractionDigits: 0 }).format(n);

/**
 * Número que sube animado. Usa `tabular-nums` para que los dígitos no salten.
 * Respeta prefers-reduced-motion (muestra el valor final sin animar).
 */
export function CountUp({
  value,
  duration = 1200,
  format = defaultFormat,
  className,
  startOnView = true,
}: CountUpProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const shouldRun = startOnView ? inView : true;
    if (!shouldRun) return;

    if (reduce) {
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo para una desaceleración elegante.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, inView, startOnView, reduce]);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {format(Math.round(display))}
    </span>
  );
}
