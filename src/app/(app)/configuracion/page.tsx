import { getActiveProfile } from "@/lib/profile/active-profile";
import { ConfigClient } from "./config-client";

export const metadata = { title: "Configuración — JM Tech" };

/**
 * Configuración. Aquí vive el cambio de perfil (celulares ⇄ electrónicas) y el
 * tema. El cambio de perfil reviste el sistema entero en vivo (acento + aurora).
 */
export default function Page() {
  const profile = getActiveProfile();
  return <ConfigClient initialProfile={profile} />;
}
