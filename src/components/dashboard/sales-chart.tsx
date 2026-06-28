"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "framer-motion";
import { useAccent } from "@/lib/theme/use-accent";
import { formatRD } from "@/lib/utils";
import type { TrendPoint } from "@/lib/dashboard/types";

/**
 * Ventas de los últimos 7 días. Área premium con relleno en gradiente del
 * acento activo (cian/índigo según perfil), animada al entrar.
 */
export function SalesChart({ data }: { data: TrendPoint[] }) {
  const { color } = useAccent();
  const reduce = useReducedMotion();

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border))"
            strokeOpacity={0.35}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgb(var(--muted))", fontSize: 12 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fill: "rgb(var(--muted))", fontSize: 11 }}
            tickFormatter={(v) =>
              v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
            }
          />
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.3, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="glass rounded-xl px-3 py-2 shadow-glass">
                  <p className="text-xs capitalize text-muted">{label}</p>
                  <p className="text-sm font-semibold text-fg tnum">
                    {formatRD(Number(payload[0].value))}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#salesFill)"
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: "rgb(var(--bg))", strokeWidth: 2 }}
            isAnimationActive={!reduce}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
