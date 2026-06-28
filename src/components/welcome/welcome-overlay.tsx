"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Cian eléctrico de MARCA (fijo, no reactivo al perfil — es la bienvenida general). */
const CYAN = "34 211 238";
const CYAN_SOFT = "103 232 249";

/**
 * Bienvenida CINEMATOGRÁFICA de JM Tech. Aparece 1 vez por sesión (la bandera
 * `jm-welcome` la pone el login en sessionStorage) y da paso al Dashboard con un
 * revelado elegante. A PRUEBA DE FALLOS: cualquier error se traga en silencio y
 * nunca bloquea la entrada; un timer de seguridad la retira pase lo que pase.
 */
export function WelcomeOverlay({ name }: { name: string }) {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout> | undefined;
    let safety: ReturnType<typeof setTimeout> | undefined;
    try {
      if (sessionStorage.getItem("jm-welcome") !== "1") return;
      sessionStorage.removeItem("jm-welcome");
      setShow(true);
      t1 = setTimeout(() => setShow(false), reduce ? 1300 : 2700);
      safety = setTimeout(() => setShow(false), 4800); // red de seguridad
    } catch {
      /* sessionStorage no disponible → simplemente no se muestra */
    }
    return () => {
      if (t1) clearTimeout(t1);
      if (safety) clearTimeout(safety);
    };
  }, [reduce]);

  const firstName = (name || "").trim().split(/\s+/)[0] || "";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="jm-welcome"
          aria-hidden
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden"
          style={{ background: "radial-gradient(120% 120% at 50% 40%, #0a1018 0%, #05080c 70%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.06, filter: "blur(12px)" }}
          transition={{ duration: reduce ? 0.3 : 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ── Aurora con profundidad (capas con blur, deriva orgánica) ── */}
          {!reduce && (
            <>
              <FloatBlob className="-left-[15%] top-[-10%] h-[70vh] w-[70vw]" rgb={CYAN} dx={40} dy={30} dur={9} />
              <FloatBlob className="right-[-20%] top-[0%] h-[65vh] w-[60vw]" rgb={CYAN_SOFT} dx={-50} dy={20} dur={11} delay={0.5} />
              <FloatBlob className="bottom-[-25%] left-[20%] h-[70vh] w-[65vw]" rgb={CYAN} dx={30} dy={-30} dur={13} delay={1} />
            </>
          )}
          {reduce && (
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(circle at 50% 45%, rgb(${CYAN} / 0.18), transparent 60%)` }}
            />
          )}

          {/* ── Textura técnica: circuito sutil + partículas finas ── */}
          <CircuitGrid reduce={reduce} />
          {!reduce && <Particles />}

          {/* ── Línea de escaneo que barre una vez (flair de "encendido") ── */}
          {!reduce && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, rgb(${CYAN} / 0.7), transparent)` }}
              initial={{ top: "38%", opacity: 0 }}
              animate={{ top: ["38%", "62%", "38%"], opacity: [0, 0.8, 0] }}
              transition={{ duration: 1.6, ease: "easeInOut", delay: 0.2 }}
            />
          )}

          {/* ── Contenido ── */}
          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            {/* Logo con glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid h-20 w-20 place-items-center rounded-2xl border sm:h-24 sm:w-24"
              style={{
                borderColor: `rgb(${CYAN} / 0.45)`,
                background: "rgba(255,255,255,0.03)",
                boxShadow: `0 0 50px rgb(${CYAN} / 0.35), inset 0 0 24px rgb(${CYAN} / 0.12)`,
              }}
            >
              <span
                className="absolute inset-0 rounded-2xl blur-md"
                style={{ background: `rgb(${CYAN} / 0.18)` }}
              />
              <span
                className="relative text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: `rgb(${CYAN_SOFT})` }}
              >
                JM
              </span>
            </motion.div>

            {/* Wordmark "JM Tech" con encendido eléctrico */}
            <motion.h1
              className="mt-6 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl"
              style={{
                backgroundImage: `linear-gradient(120deg, rgb(${CYAN_SOFT}), rgb(${CYAN}) 45%, #ffffff)`,
              }}
              initial={{ opacity: 0, filter: "blur(16px)" }}
              animate={{
                opacity: 1,
                filter: "blur(0px)",
                textShadow: [
                  `0 0 0px rgb(${CYAN} / 0)`,
                  `0 0 46px rgb(${CYAN} / 0.85)`,
                  `0 0 16px rgb(${CYAN} / 0.4)`,
                ],
              }}
              transition={{ duration: reduce ? 0.4 : 1.05, delay: 0.25, times: [0, 0.55, 1] }}
            >
              JM&nbsp;Tech
            </motion.h1>

            {/* Saludo con desenfoque-a-nítido */}
            <motion.p
              className="mt-3 text-base text-white/70 sm:text-lg"
              initial={{ opacity: 0, filter: "blur(12px)", y: 6 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              Bienvenido de nuevo{firstName ? ", " : ""}
              <span className="font-medium text-white">{firstName}</span>
            </motion.p>

            {/* Micro-efecto "datos cargando": barra fina que se llena una vez */}
            {!reduce && (
              <div className="mt-7 h-[3px] w-44 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, rgb(${CYAN} / 0.2), rgb(${CYAN}), rgb(${CYAN_SOFT}))` }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.7, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Blob de aurora con deriva orgánica en bucle. */
function FloatBlob({
  className,
  rgb,
  dx,
  dy,
  dur,
  delay = 0,
}: {
  className: string;
  rgb: string;
  dx: number;
  dy: number;
  dur: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full ${className}`}
      style={{
        background: `radial-gradient(circle at center, rgb(${rgb} / 0.5), transparent 62%)`,
        filter: "blur(90px)",
      }}
      animate={{ x: [0, dx, 0], y: [0, dy, 0] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Rejilla de circuito sutil con flujo de datos (stroke animado). */
function CircuitGrid({ reduce }: { reduce: boolean | null }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="jm-circuit" width="64" height="64" patternUnits="userSpaceOnUse">
          <path
            d="M0 32 H22 M42 32 H64 M32 0 V22 M32 42 V64"
            fill="none"
            stroke={`rgb(${CYAN})`}
            strokeWidth="0.6"
            strokeOpacity="0.5"
          />
          <circle cx="32" cy="32" r="2" fill={`rgb(${CYAN})`} fillOpacity="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#jm-circuit)">
        {!reduce && (
          <animate attributeName="opacity" values="0.55;0.85;0.55" dur="3.2s" repeatCount="indefinite" />
        )}
      </rect>
    </svg>
  );
}

/** Partículas finas que respiran (subtiles). */
function Particles() {
  const dots = [
    { x: "18%", y: "30%", d: 0 },
    { x: "78%", y: "26%", d: 0.4 },
    { x: "30%", y: "70%", d: 0.8 },
    { x: "66%", y: "66%", d: 1.2 },
    { x: "50%", y: "20%", d: 0.6 },
    { x: "84%", y: "54%", d: 1.0 },
    { x: "12%", y: "58%", d: 1.4 },
    { x: "44%", y: "82%", d: 0.2 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {dots.map((p, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full"
          style={{ left: p.x, top: p.y, background: `rgb(${CYAN_SOFT})`, boxShadow: `0 0 8px rgb(${CYAN} / 0.8)` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.9, 0.2, 0.9], scale: [0.6, 1, 0.8, 1], y: [0, -10, 0] }}
          transition={{ duration: 3 + (i % 3), delay: p.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
