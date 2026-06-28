"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Fila con desbordamiento horizontal elegante. Usa `mask-image` para FUNDIR el
 * propio contenido a transparente en los bordes donde hay más por desplazar —
 * así una pestaña parcial se disuelve con suavidad (nunca un corte duro a media
 * palabra) y funciona sobre cualquier fondo (oscuro o claro). El fade aparece
 * solo del lado con contenido oculto y desaparece al llegar al final. Sin barra
 * de scroll visible; se desplaza con gesto, arrastre o rueda. Reutilizable.
 */
export function ScrollRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mask, setMask] = useState<string>("none");

  function update() {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    const L = "28px";
    const R = "52px";
    let m = "none";
    if (left && right)
      m = `linear-gradient(to right, transparent, #000 ${L}, #000 calc(100% - ${R}), transparent)`;
    else if (right) m = `linear-gradient(to right, #000 calc(100% - ${R}), transparent)`;
    else if (left) m = `linear-gradient(to right, transparent, #000 ${L})`;
    setMask(m);
  }

  useEffect(() => {
    update();
    const raf = requestAnimationFrame(update);
    const t = setTimeout(update, 300);

    // Observa el CONTENIDO (su ancho cambia al cargar fuentes / cambiar items),
    // no solo el contenedor de ancho fijo — esa era la causa de que el fade no
    // apareciera.
    const ro = new ResizeObserver(update);
    if (contentRef.current) ro.observe(contentRef.current);
    if (scrollerRef.current) ro.observe(scrollerRef.current);

    window.addEventListener("resize", update);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(update).catch(() => {});
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("min-w-0", className)}>
      <div
        ref={scrollerRef}
        onScroll={update}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        className="overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={contentRef} className="flex w-max gap-1.5 pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
