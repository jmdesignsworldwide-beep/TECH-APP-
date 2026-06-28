import { redirect } from "next/navigation";
import { Aurora } from "@/components/aurora";
import { Brand } from "@/components/layout/brand";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar — JM Tech" };

/** Pantalla de login premium: aurora de fondo, marca y formulario elegante. */
export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  // En modo demo mostramos una pista de credenciales para explorar el preview.
  const demoMode = !isSupabaseConfigured();

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <Aurora />

      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Brand className="scale-110" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-fg">
            Bienvenido de vuelta
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Entra para gestionar tu tienda
          </p>
        </div>

        <LoginForm demoMode={demoMode} />

        <p className="mt-6 text-center text-xs text-muted/70">
          JM Tech · Sistema de gestión premium
        </p>
      </div>
    </main>
  );
}
