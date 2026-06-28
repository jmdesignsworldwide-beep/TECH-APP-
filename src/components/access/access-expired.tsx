import { Clock, Mail, Phone, ShieldX } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { LogoutButton } from "./logout-button";

/**
 * Pantalla premium de acceso bloqueado (vencido o revocado). Se renderiza desde
 * el SERVIDOR (layout) — el usuario no entra al sistema. Datos de contacto de
 * JM Designs para renovar.
 */
export function AccessExpired({ revoked }: { revoked?: boolean }) {
  return (
    <main className="grid min-h-screen place-items-center bg-bg px-4">
      <GlassPanel glow className="relative w-full max-w-md overflow-hidden p-8 text-center">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 opacity-60 blur-3xl" />

        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
          {revoked ? <ShieldX className="h-8 w-8" strokeWidth={1.5} /> : <Clock className="h-8 w-8" strokeWidth={1.5} />}
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg">
          {revoked ? "Tu acceso fue revocado" : "Tu acceso ha expirado"}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          La demostración de JM Tech a la que tenías acceso ya no está disponible.
          Contacta a <span className="font-medium text-fg">JM Designs</span> para
          renovarla y seguir explorando el sistema.
        </p>

        <div className="mt-6 space-y-2 text-left">
          <ContactRow icon={Phone} label="WhatsApp" value="+1 (809) 000-0000" />
          <ContactRow icon={Mail} label="Email" value="jm.designs.worldwide@gmail.com" />
        </div>

        <div className="mt-6">
          <LogoutButton />
        </div>

        <p className="mt-5 text-[11px] text-muted/60">
          Demostración premium creada por JM Designs.
        </p>
      </GlassPanel>
    </main>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-2/40 px-4 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <p className="truncate text-sm font-medium text-fg">{value}</p>
      </div>
    </div>
  );
}
