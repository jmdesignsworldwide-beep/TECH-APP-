// ── Content-Security-Policy ───────────────────────────────────────
// Calibrada para no romper la app: Next inyecta scripts/estilos inline
// (hidratación), Tailwind y Framer Motion escriben estilos inline, el script
// anti-parpadeo de tema es inline, y todo el tráfico de datos va a Supabase
// (REST + Realtime por wss). Se permite vercel.live para la barra de previews.
// 'unsafe-inline' en script/style es el estándar para apps Next sin middleware
// de nonces; 'unsafe-eval' NO se incluye (no se necesita en producción).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://vercel.live",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://vercel.live wss://*.pusher.com",
  "frame-src 'self' https://vercel.live",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HSTS: fuerza HTTPS por 2 años, incluidos subdominios. Vercel ya sirve HTTPS.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Defensa anti-clickjacking redundante con frame-ancestors (navegadores viejos).
  { key: "X-Frame-Options", value: "DENY" },
  // Evita MIME-sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No filtra la URL completa a terceros.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Cierra APIs del navegador que la app no usa.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
