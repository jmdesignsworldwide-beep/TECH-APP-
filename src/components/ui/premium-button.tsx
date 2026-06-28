"use client";

import { forwardRef, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "subtle";
type Size = "sm" | "md" | "lg";

interface PremiumButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
  > {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg shadow-glow-sm hover:shadow-glow border border-accent-strong/40",
  ghost:
    "bg-transparent text-fg border border-border hover:border-accent/60 hover:text-accent-soft",
  subtle:
    "bg-surface-2/70 text-fg border border-border/60 hover:border-accent/50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

/**
 * Botón premium con hover magnético (sigue sutilmente al cursor) y glow en el
 * acento activo. Respeta prefers-reduced-motion (sin magnetismo si se pide).
 */
export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  function PremiumButton(
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const reduce = useReducedMotion();
    const innerRef = useRef<HTMLButtonElement | null>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 300, damping: 20 });
    const sy = useSpring(y, { stiffness: 300, damping: 20 });

    function handleMove(e: React.MouseEvent<HTMLButtonElement>) {
      if (reduce) return;
      const el = innerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      x.set(mx * 0.18);
      y.set(my * 0.28);
    }

    function reset() {
      x.set(0);
      y.set(0);
    }

    return (
      <motion.button
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        style={reduce ? undefined : { x: sx, y: sy }}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex select-none items-center justify-center font-medium",
          "transition-[color,box-shadow,border-color,background-color] duration-300",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="absolute left-1/2 -translate-x-1/2">
            <Spinner />
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-2",
            loading && "opacity-0",
          )}
        >
          {children}
        </span>
      </motion.button>
    );
  },
);

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
