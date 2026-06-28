"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Contenedor que orquesta la entrada de sus hijos en cascada (stagger) con
 * spring. Las listas y grids entran ordenados, no de golpe.
 * Respeta prefers-reduced-motion (aparición instantánea sin desplazamiento).
 */
const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 26 },
  },
};

export function Stagger({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? undefined : containerVariants}
      initial={reduce ? false : "hidden"}
      animate={reduce ? false : "show"}
      className={cn(className)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? undefined : itemVariants}
      className={cn(className)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </motion.div>
  );
}
