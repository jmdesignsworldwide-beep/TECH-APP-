"use client";

import { useState } from "react";
import {
  Boxes,
  CreditCard,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  GlassPanel,
  KpiCard,
  PremiumButton,
  PremiumModal,
  PulseBadge,
  Skeleton,
  Stagger,
  StaggerItem,
} from "@/components/ui";
import { useProfile } from "@/lib/profile/profile-provider";
import { PROFILE_META } from "@/lib/types";
import { formatRD } from "@/lib/utils";

/**
 * Vitrina interna que demuestra la librería de primitivos premium y el acento
 * reactivo en vivo. Pensada para que el dueño explore y sienta el nivel.
 */
export function DashboardShowcase({ displayName }: { displayName: string }) {
  const { profile, toggleProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const meta = PROFILE_META[profile];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7">
      <PageHeader
        title={
          <>
            Hola, <span className="text-accent-gradient">{displayName}</span>
          </>
        }
        subtitle={
          <>
            Perfil activo:{" "}
            <span className="font-medium text-fg">{meta.label}</span> —{" "}
            {meta.tagline}. Cambia el perfil y mira cómo se reviste todo el
            sistema.
          </>
        }
        actions={
          <PremiumButton variant="ghost" size="sm" onClick={toggleProfile}>
            <Sparkles className="h-4 w-4" />
            Cambiar perfil
          </PremiumButton>
        }
      />

      {/* KPIs con count-up */}
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <KpiCard
            label="Ventas de hoy"
            value={184500}
            currency
            icon={Wallet}
            deltaPct={12.4}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Transacciones"
            value={326}
            icon={CreditCard}
            deltaPct={4.1}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Productos en stock"
            value={1248}
            icon={Boxes}
            suffix="uds"
            deltaPct={-2.3}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Ticket promedio"
            value={1420}
            currency
            icon={TrendingUp}
            deltaPct={6.8}
          />
        </StaggerItem>
      </Stagger>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Panel: clic = más info (modal estándar) */}
        <GlassPanel className="flex flex-col gap-4 p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-fg">
                Todo lo que el ojo ve, la mano toca
              </h2>
              <p className="mt-1 text-sm text-muted">
                Cada detalle del sistema usará un único patrón de panel premium:
                tócalo y revela más, sin saltos.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PremiumButton onClick={() => setOpen(true)}>
              Abrir panel premium
            </PremiumButton>
            <PremiumButton variant="subtle">Acción secundaria</PremiumButton>
            <PremiumButton variant="ghost" loading>
              Cargando
            </PremiumButton>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <PulseBadge tone="danger">3 productos en bajo stock</PulseBadge>
            <PulseBadge tone="warning">2 garantías por vencer</PulseBadge>
            <PulseBadge tone="success">Caja cuadrada</PulseBadge>
          </div>
        </GlassPanel>

        {/* Estado de carga (skeleton) */}
        <GlassPanel className="flex flex-col gap-4 p-6">
          <h2 className="text-sm font-semibold text-muted">
            Estados de carga
          </h2>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </GlassPanel>
      </div>

      <PremiumModal
        open={open}
        onClose={() => setOpen(false)}
        title="Panel premium estándar"
        description="Este es el único patrón de detalle del sistema."
        footer={
          <div className="flex justify-end gap-2">
            <PremiumButton variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cerrar
            </PremiumButton>
            <PremiumButton size="sm" onClick={() => setOpen(false)}>
              Entendido
            </PremiumButton>
          </div>
        }
      >
        <div className="space-y-4 text-sm leading-relaxed text-muted">
          <p>
            Entrada con spring, fondo difuminado, cierre con Esc, clic fuera o la
            X, y scroll interno en móvil. Todo &quot;clic = más info&quot; de las
            próximas tandas reusará este componente — no diez modales distintos.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <GlassPanel className="p-4">
              <p className="text-xs text-muted">Monto ejemplo</p>
              <p className="mt-1 text-xl font-semibold text-fg tnum">
                {formatRD(58900)}
              </p>
            </GlassPanel>
            <GlassPanel className="p-4">
              <p className="text-xs text-muted">Acento reactivo</p>
              <p className="mt-1 text-xl font-semibold capitalize text-accent">
                {profile}
              </p>
            </GlassPanel>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}
