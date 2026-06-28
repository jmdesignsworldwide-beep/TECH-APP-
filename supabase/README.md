# JM Tech — Base de datos (Supabase)

Fundación de datos de la **Tanda 1**. Aquí solo vive lo necesario para
auth/usuarios y la noción de **perfil activo**. Las tablas de negocio
(inventario, ventas, etc.) se añaden en tandas posteriores **colgándose de esta
base**, sin rehacer nada.

## Migraciones

- `migrations/0001_foundations.sql` — tipos, tablas, RLS + FORCE RLS, helpers.

### Cómo aplicar la migración (vía Management API con PAT temporal)

El dueño genera un **PAT temporal** en Supabase (Account → Access Tokens) y lo
revoca al terminar. Con él se aplica la migración por la Management API:

```bash
# PROJECT_REF: el ref del proyecto (xxxx en https://xxxx.supabase.co)
curl -sS -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H "Content-Type: application/json" \
  --data @<(jq -Rs '{query: .}' supabase/migrations/0001_foundations.sql)
```

> No se requiere connection string permanente. El PAT se usa una vez y se revoca.

## Esquema (para las próximas tandas)

### Tipos

| Tipo           | Valores                         | Uso                                   |
| -------------- | ------------------------------- | ------------------------------------- |
| `profile_type` | `celulares` \| `electronicas`   | Distingue lo específico de cada perfil |
| `app_role`     | `owner` \| `admin` \| `staff`   | Roles de aplicación                   |

### `public.app_users`

Perfil de aplicación enlazado 1:1 con `auth.users`. **Login sin email**: el
servidor mapea `usuario → usuario@<dominio-interno>` para Supabase Auth; aquí se
guarda el `username` real, el `display_name` y el `role`.

| Columna             | Tipo          | Notas                                            |
| ------------------- | ------------- | ------------------------------------------------ |
| `id`                | uuid PK       |                                                  |
| `auth_id`           | uuid unique   | FK → `auth.users.id` (on delete cascade)         |
| `username`          | text unique   | Nombre de usuario visible                        |
| `display_name`      | text          | Nombre para mostrar                              |
| `role`              | app_role      | `staff` por defecto                              |
| `is_active`         | boolean       | Para acceso temporal (futuro)                    |
| `access_expires_at` | timestamptz   | Vigencia de la cuenta (futuro, aún sin aplicar)  |
| `created_at`        | timestamptz   |                                                  |
| `updated_at`        | timestamptz   | Auto vía trigger                                 |

### `public.system_settings`

Fila única (singleton, `id = 1`) con el **perfil activo** del sistema.

| Columna          | Tipo          | Notas                          |
| ---------------- | ------------- | ------------------------------ |
| `active_profile` | profile_type  | Perfil en uso (`celulares` def)|
| `updated_by`     | uuid          | FK → `app_users.id`            |
| `updated_at`     | timestamptz   | Auto vía trigger               |

> En esta tanda la app lee/escribe el perfil activo en cookie (server-side) para
> el preview. El endpoint `/api/profile` puede pasar a escribir aquí en una
> tanda posterior sin cambiar su contrato.

### Seguridad

- **RLS + FORCE RLS** en todas las tablas.
- Sin privilegios para `anon`.
- `app_users`: cada quien ve/edita lo suyo; `owner`/`admin` ven todo.
- `system_settings`: lectura para autenticados; escritura solo `owner`/`admin`.
- Helpers `is_admin()` / `current_app_role()` son `SECURITY DEFINER` con
  `search_path` fijo para evitar recursión en políticas.

## Crear el primer usuario (owner)

Login es sin email, pero Supabase Auth necesita uno por debajo. Crea el usuario
de auth con el email ficticio determinista y luego su fila en `app_users`.

Ver `supabase/seed/create-user.mjs` (usa `SUPABASE_SERVICE_ROLE_KEY`, solo
servidor). Ejemplo:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
NEXT_PUBLIC_INTERNAL_EMAIL_DOMAIN=jmtech.local \
node supabase/seed/create-user.mjs --username jm --password 'CLAVE' --name 'JM' --role owner
```
