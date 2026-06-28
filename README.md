# 🏗️ JM Tech — Sistema de gestión (Tanda 1: Cimientos)

Demo premium de un sistema de gestión para tienda tech con **doble perfil**
conmutable: **Celulares** (cian eléctrico) y **Electrónicas** (índigo profundo).
Una sola base de datos; un campo `profile_type` distingue los productos. Cambiar
de perfil no borra datos: **reviste** el sistema (categorías, campos y ambiente
visual).

Esta tanda construye los **cimientos**: sistema de diseño premium, aurora
reactiva, librería de primitivos animados, login sin email, layout responsive y
la estructura de doble perfil en la base.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · Supabase ·
lucide-react · Recharts (tandas futuras).

## Arranque local

```bash
npm install
cp .env.example .env.local   # rellena tus valores (o déjalo para modo demo)
npm run dev
```

Sin Supabase configurado, la app arranca en **modo demo** para explorar el
preview. Entra con **`admin` / `jmtech`**. Al configurar Supabase, el demo se
ignora y manda la auth real.

## Variables de entorno

Ver `.env.example`. Claves:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — públicas.
- `SUPABASE_SERVICE_ROLE_KEY` — **solo servidor**, en Vercel marcar "Sensitive",
  **nunca** `NEXT_PUBLIC_`, nunca en logs.
- `DEMO_SESSION_SECRET` — firma la sesión del fallback demo.
- `NEXT_PUBLIC_INTERNAL_EMAIL_DOMAIN` — dominio del email ficticio interno
  (el usuario nunca ve email; `usuario → usuario@dominio`).

## Sistema de diseño

Dos ejes independientes vía CSS variables (`src/app/globals.css`):

- **Tema** — `data-theme="dark" | "light"`. Arranca en oscuro (la joya); claro
  pensado, no una inversión. Toggle sol/luna que **recuerda** la preferencia.
- **Perfil** — `data-profile="celulares" | "electronicas"`. Define el **acento
  reactivo**: toda la UI lee de `--accent`, así que cambiar de perfil desplaza el
  sistema entero de cian a índigo, **aurora incluida** (`src/components/aurora.tsx`).

### Librería de primitivos (`src/components/ui/`)

Reutilizables, documentados y con `prefers-reduced-motion`:

| Primitivo        | Qué hace                                             |
| ---------------- | ---------------------------------------------------- |
| `PremiumModal`   | **Único** patrón de detalle (clic = más info)        |
| `KpiCard`        | KPI con count-up (`tabular-nums`, listo para RD$)    |
| `Stagger`        | Entrada en cascada (spring) para listas/grids        |
| `PremiumButton`  | Hover magnético + glow del acento activo             |
| `Skeleton`       | Estado de carga con shimmer                          |
| `PulseBadge`     | Indicador que late (alertas)                         |
| `GlassPanel`     | Superficie de vidrio (glassmorphism + sombras)       |
| `CountUp`        | Contador animado base                                |

## Seguridad

- **RLS + FORCE RLS** en todas las tablas desde el inicio (`supabase/`).
- `service_role` solo en servidor; validación de sesión/rol en el servidor.
- Login con **rate limiting** server-side (por usuario e IP).
- Sesión demo firmada con HMAC (no un flag de cliente).

## Base de datos

Ver `supabase/README.md`. Migración: `supabase/migrations/0001_foundations.sql`
(tipos `profile_type`/`app_role`, `app_users`, `system_settings`, RLS + helpers).
Estructura de **acceso temporal** (`access_expires_at`) preparada para una tanda
posterior.

## Estructura

```
src/
├─ app/
│  ├─ (app)/            # área autenticada (layout con guard + aurora + shell)
│  │  ├─ dashboard/     # vitrina de primitivos premium
│  │  ├─ configuracion/ # cambio de perfil + tema
│  │  └─ …              # módulos placeholder (tandas futuras)
│  ├─ api/auth/         # login (rate-limited) / logout
│  ├─ api/profile/      # persistencia del perfil activo
│  └─ login/            # login premium sin email
├─ components/          # aurora, layout (sidebar/header), ui/ (primitivos)
└─ lib/                 # auth, supabase, theme, profile, navegación, tipos
```

## Qué falta (Tanda 2+)

Inventario/POS/etc. reales, switch de perfil completo (categorías y campos por
perfil), acceso temporal activado, y conexión de los KPIs a datos reales.
