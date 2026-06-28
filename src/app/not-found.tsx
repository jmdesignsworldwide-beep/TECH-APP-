import Link from "next/link";
import { Aurora } from "@/components/aurora";
import { Brand } from "@/components/layout/brand";
import { PremiumButton } from "@/components/ui/premium-button";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <Aurora />
      <div className="flex flex-col items-center text-center">
        <Brand className="scale-110" />
        <p className="mt-8 text-6xl font-bold tracking-tight text-accent-gradient">
          404
        </p>
        <p className="mt-2 text-fg">Esta página aún no existe.</p>
        <Link href="/dashboard" className="mt-6">
          <PremiumButton>Ir al dashboard</PremiumButton>
        </Link>
      </div>
    </main>
  );
}
