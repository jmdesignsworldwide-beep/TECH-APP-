"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  ChevronRight,
  Crown,
  PackageCheck,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  CountUp,
  GlassPanel,
  KpiCard,
  PremiumButton,
  PremiumModal,
  PulseBadge,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { useProfile } from "@/lib/profile/profile-provider";
import { PROFILE_META } from "@/lib/types";
import { cn, formatRD } from "@/lib/utils";
import type { DashboardBundle } from "@/lib/dashboard/types";
import { SalesChart } from "./sales-chart";
import {
  LowStockDetail,
  OrdersDetail,
  SalesDetail,
  WarrantiesDetail,
} from "./detail-panels";

type Modal = "sales" | "low" | "orders" | "warranties" | null;

const methodLabels = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
} as const;

/**
 * La Sala de Mando. No se "carga": se revela en cascada (stagger), los montos
 * suben con count-up, las alertas laten, el gráfico entra animado. Reactivo al
 * perfil activo: al cambiar de Celulares a Electrónicas, acento, aurora y DATOS
 * se transforman de cian a índigo en vivo.
 */
export function DashboardView({
  bundle,
  displayName,
}: {
  bundle: DashboardBundle;
  displayName: string;
}) {
  const { profile, toggleProfile } = useProfile();
  const [modal, setModal] = useState<Modal>(null);
  const data = bundle[profile];
  const meta = PROFILE_META[profile];

  const maxPay = Math.max(...data.payments.map((p) => p.total), 1);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title={
          <>
            Hola, <span className="text-accent-gradient">{displayName}</span>
          </>
        }
        subtitle={
          <>
            Sala de mando ·{" "}
            <span className="font-medium text-fg">{meta.label}</span> —{" "}
            {meta.tagline}.
            {bundle.source === "sample" && (
              <span className="ml-1 text-muted/70">Datos demo.</span>
            )}
          </>
        }
        actions={
          <PremiumButton variant="ghost" size="sm" onClick={toggleProfile}>
            <Sparkles className="h-4 w-4" />
            Cambiar perfil
          </PremiumButton>
        }
      />

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <Stagger
        key={profile}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Hero: Ventas de hoy */}
        <StaggerItem className="sm:col-span-2">
          <button
            onClick={() => setModal("sales")}
            className="group block w-full text-left"
          >
            <GlassPanel
              glow
              className="relative h-full overflow-hidden p-6 transition-shadow duration-500 hover:shadow-glow"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                    <Wallet className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="text-sm font-medium text-muted">Ventas de hoy</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>
              <p className="mt-5 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
                <CountUp value={data.salesToday} format={(n) => formatRD(n)} />
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="tnum">
                  ITBIS {formatRD(data.itbisToday)}
                </span>
                <span className="tnum">
                  Ticket prom. {formatRD(data.ticketAvg)}
                </span>
              </div>
            </GlassPanel>
          </button>
        </StaggerItem>

        {/* Bajo stock */}
        <StaggerItem>
          <AlertCard
            label="Bajo stock"
            count={data.lowStockCount}
            icon={Boxes}
            tone="danger"
            hint="productos"
            onClick={() => setModal("low")}
          />
        </StaggerItem>

        {/* Garantías por vencer */}
        <StaggerItem>
          <AlertCard
            label="Garantías por vencer"
            count={data.expiringWarrantiesCount}
            icon={ShieldAlert}
            tone="warning"
            hint="en 30 días"
            onClick={() => setModal("warranties")}
          />
        </StaggerItem>

        {/* Secundarios */}
        <StaggerItem>
          <KpiCard
            label="Productos vendidos hoy"
            value={data.unitsSoldToday}
            icon={TrendingUp}
            suffix="uds"
          />
        </StaggerItem>
        <StaggerItem>
          <AlertCard
            label="Pedidos pendientes"
            count={data.pendingOrdersCount}
            icon={PackageCheck}
            tone="accent"
            hint="por atender"
            onClick={() => setModal("orders")}
          />
        </StaggerItem>
        <StaggerItem className="sm:col-span-2">
          <GlassPanel className="flex h-full items-center gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
              <Crown className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted">Top producto del día</p>
              <p className="truncate text-lg font-semibold text-fg">
                {data.topProduct?.name ?? "—"}
              </p>
            </div>
            {data.topProduct && (
              <span className="ml-auto shrink-0 rounded-lg bg-surface-2/70 px-2.5 py-1 text-sm font-semibold text-accent tnum">
                {data.topProduct.units} uds
              </span>
            )}
          </GlassPanel>
        </StaggerItem>
      </Stagger>

      {/* ── Gráfico + métodos de pago ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassPanel className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-fg">
                Ventas — últimos 7 días
              </h2>
              <p className="text-sm text-muted">Tendencia en RD$</p>
            </div>
            <PulseBadge tone="success">En vivo</PulseBadge>
          </div>
          <SalesChart key={profile} data={data.trend} />
        </GlassPanel>

        <GlassPanel className="flex flex-col p-6">
          <h2 className="text-base font-semibold tracking-tight text-fg">
            Métodos de pago
          </h2>
          <p className="text-sm text-muted">Hoy</p>
          <div className="mt-5 flex flex-1 flex-col justify-center gap-4">
            {data.payments.map((p) => (
              <div key={p.method}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted">{methodLabels[p.method]}</span>
                  <span className="font-medium text-fg tnum">
                    {formatRD(p.total)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2/70">
                  <motion.div
                    key={profile + p.method}
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.total / maxPay) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 22 }}
                    className="h-full rounded-full bg-accent shadow-glow-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* ── Modal premium (clic = más info) ──────────────────── */}
      <PremiumModal
        open={modal === "sales"}
        onClose={() => setModal(null)}
        title="Ventas de hoy"
        description="Desglose de las transacciones del día."
        size="lg"
      >
        <SalesDetail
          rows={data.salesTodayList}
          total={data.salesToday}
          itbis={data.itbisToday}
        />
      </PremiumModal>

      <PremiumModal
        open={modal === "low"}
        onClose={() => setModal(null)}
        title="Productos en bajo stock"
        description="Reponer pronto para no perder ventas."
      >
        <LowStockDetail rows={data.lowStockList} />
      </PremiumModal>

      <PremiumModal
        open={modal === "orders"}
        onClose={() => setModal(null)}
        title="Pedidos por atender"
        description="Pendientes y en proceso."
      >
        <OrdersDetail rows={data.pendingOrders} />
      </PremiumModal>

      <PremiumModal
        open={modal === "warranties"}
        onClose={() => setModal(null)}
        title="Garantías por vencer"
        description="Próximas a vencer en los siguientes 30 días."
      >
        <WarrantiesDetail rows={data.expiringWarranties} />
      </PremiumModal>
    </div>
  );
}

/** Tarjeta de alerta clickeable con indicador que late. */
function AlertCard({
  label,
  count,
  icon: Icon,
  tone,
  hint,
  onClick,
}: {
  label: string;
  count: number;
  icon: typeof Boxes;
  tone: "danger" | "warning" | "accent";
  hint: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group block h-full w-full text-left">
      <GlassPanel className="relative h-full overflow-hidden p-5 transition-shadow duration-500 hover:shadow-glow">
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-xl border",
              tone === "danger" && "border-danger/30 bg-danger/10 text-danger",
              tone === "warning" &&
                "border-warning/30 bg-warning/10 text-warning",
              tone === "accent" && "border-accent/30 bg-accent/10 text-accent",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          {count > 0 && <PulseBadge tone={tone} />}
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-fg">
          <CountUp value={count} />
        </p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm font-medium text-muted">{label}</p>
        </div>
        <p className="mt-0.5 text-xs text-muted/70">{hint}</p>
        <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100" />
      </GlassPanel>
    </button>
  );
}
