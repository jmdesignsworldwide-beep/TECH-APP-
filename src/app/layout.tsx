import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeNoFlashScript } from "@/lib/theme/theme-provider";
import { getActiveProfile } from "@/lib/profile/active-profile";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JM Tech — Sistema de gestión",
  description:
    "Sistema premium de gestión para tienda tech con doble perfil: Celulares y Electrónicas.",
};

export const viewport: Viewport = {
  themeColor: "#080a12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Perfil activo leído en el servidor → se pinta en <html> sin parpadeo.
  const profile = getActiveProfile();

  return (
    <html
      lang="es"
      data-theme="dark"
      data-profile={profile}
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Fija el tema antes del primer paint (evita flash claro/oscuro). */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
