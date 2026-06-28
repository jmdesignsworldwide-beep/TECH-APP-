// Crea un usuario JM Tech (auth + fila app_users) usando service_role.
// SOLO servidor. Login es sin email; aquí se genera el email ficticio interno.
//
// Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   NEXT_PUBLIC_INTERNAL_EMAIL_DOMAIN=jmtech.local \
//   node supabase/seed/create-user.mjs --username jm --password 'CLAVE' --name 'JM' --role owner
//
// Requiere @supabase/supabase-js (ya está en dependencies del proyecto).

import { createClient } from "@supabase/supabase-js";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.NEXT_PUBLIC_INTERNAL_EMAIL_DOMAIN || "jmtech.local";

const username = (arg("username") || "").trim().toLowerCase();
const password = arg("password");
const displayName = arg("name") || username;
const role = arg("role", "staff");

if (!url || !serviceKey) {
  console.error("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!username || !password) {
  console.error("Usa --username y --password");
  process.exit(1);
}

const email = `${username.replace(/\s+/g, "")}@${domain}`;
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error: createErr } = await supabase.auth.admin.createUser(
  {
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName },
  },
);

if (createErr) {
  console.error("Error creando usuario de auth:", createErr.message);
  process.exit(1);
}

const { error: rowErr } = await supabase.from("app_users").insert({
  auth_id: created.user.id,
  username,
  display_name: displayName,
  role,
});

if (rowErr) {
  console.error("Usuario de auth creado, pero falló app_users:", rowErr.message);
  process.exit(1);
}

console.log(`✓ Usuario "${username}" (${role}) creado. Entra con usuario + contraseña.`);
