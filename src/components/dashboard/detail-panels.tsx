"use client";

import {
  AlertTriangle,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/stagger";
import { PulseBadge } from "@/components/ui/pulse-badge";
import { cn, formatRD } from "@/lib/utils";
import type {
  LowStockRow,
  OrderRow,
  SaleRow,
  WarrantyRow,
} from "@/lib/dashboard/types";

const methodMeta = {
  efectivo: { label: "Efectivo", icon: Banknote },
  tarjeta: { label: "Tarjeta", icon: CreditCard },
  transferencia: { label: "Transferencia", icon: ArrowLeftRight },
} as const;

function Row({ children }: { children: React.ReactNode }) {
  return (
    <StaggerItem className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface-2/40 px-3.5 py-3">
      {children}
    </StaggerItem>
  );
}

/** Desglose de "Ventas de hoy". */
export function SalesDetail({
  rows,
  total,
  itbis,
}: {
  rows: SaleRow[];
  total: number;
  itbis: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
        <div>
          <p className="text-xs text-muted">Total de hoy</p>
          <p className="text-2xl font-semibold text-fg tnum">{formatRD(total)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">ITBIS incluido</p>
          <p className="text-sm font-medium text-accent-soft tnum">
            {formatRD(itbis)}
          </p>
        </div>
      </div>
      <Stagger className="space-y-2">
        {rows.map((r) => {
          const M = methodMeta[r.method];
          return (
            <Row key={r.id}>
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2/80 text-muted">
                  <M.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-fg">{r.customer}</p>
                  <p className="text-xs text-muted">
                    {M.label} · {r.time}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-fg tnum">
                {formatRD(r.total)}
              </p>
            </Row>
          );
        })}
      </Stagger>
    </div>
  );
}

/** Lista de productos en bajo stock. */
export function LowStockDetail({ rows }: { rows: LowStockRow[] }) {
  return (
    <Stagger className="space-y-2">
      {rows.map((r) => (
        <Row key={r.id}>
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-danger/10 text-danger">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-fg">{r.name}</p>
              <p className="text-xs text-muted">{r.brand}</p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-sm font-semibold tnum",
                r.stock <= r.minStock ? "text-danger" : "text-fg",
              )}
            >
              {r.stock} uds
            </p>
            <p className="text-xs text-muted tnum">mín. {r.minStock}</p>
          </div>
        </Row>
      ))}
    </Stagger>
  );
}

/** Pedidos pendientes / en proceso. */
export function OrdersDetail({ rows }: { rows: OrderRow[] }) {
  return (
    <Stagger className="space-y-2">
      {rows.map((r) => (
        <Row key={r.id}>
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2/80 text-accent">
              <PackageCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-fg">{r.customer}</p>
              <p className="text-xs text-muted">{r.age}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PulseBadge tone={r.status === "pendiente" ? "warning" : "accent"}>
              {r.status === "pendiente" ? "Pendiente" : "En proceso"}
            </PulseBadge>
            <p className="text-sm font-semibold text-fg tnum">
              {formatRD(r.total)}
            </p>
          </div>
        </Row>
      ))}
    </Stagger>
  );
}

/** Garantías por vencer. */
export function WarrantiesDetail({ rows }: { rows: WarrantyRow[] }) {
  return (
    <Stagger className="space-y-2">
      {rows.map((r) => (
        <Row key={r.id}>
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-warning/10 text-warning">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-fg">{r.product}</p>
              <p className="text-xs text-muted">{r.customer}</p>
            </div>
          </div>
          <PulseBadge tone={r.daysLeft <= 7 ? "danger" : "warning"}>
            {r.daysLeft <= 0
              ? "Vence hoy"
              : `${r.daysLeft} día${r.daysLeft === 1 ? "" : "s"}`}
          </PulseBadge>
        </Row>
      ))}
    </Stagger>
  );
}
