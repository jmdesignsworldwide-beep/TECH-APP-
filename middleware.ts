import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

/**
 * Middleware: refresca la sesión de Supabase cuando está configurado. La
 * protección de rutas (redirección a /login) la hace el layout autenticado en
 * el servidor vía getSessionUser, que cubre también el modo demo.
 */
export async function middleware(request: NextRequest) {
  if (isSupabaseConfigured()) {
    return updateSupabaseSession(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todo salvo estáticos y archivos con extensión.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
