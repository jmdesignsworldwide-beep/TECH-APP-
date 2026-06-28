// Crea (o deja limpio) un usuario JM Tech: usuario de auth + fila en app_users,
// usando service_role. SOLO servidor. El login es SIN email: aquí se genera el
// email ficticio interno determinista (usuario -> usuario@<dominio>); el usuario
// nunca lo ve ni lo escribe.
//
// Uso:
//   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  \
//   NEXT_PUBLIC_INTERNAL_EMAIL_DOMAIN=jmtech.local   \
//   node supabase/seed/create-user.mjs --username jm --password 'TU_CLAVE' --name 'JM' --role owner
//
// La service_role se toma del entorno; NUNCA se pega como argumento.
// Es idempotente: si el usuario ya existe, actualiza su clave/rol (queda limpio).
// Requiere @supabase/supabase-js (ya está en las dependencias del proyecto).

import { createClient } from "@supabase/supabase-js";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const VALID_ROLES = ["owner", "admin", "staff"];

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.NEXT_PUBLIC_INTERNAL_EMAIL_DOMAIN || "jmtech.local";

const username = (arg("username") || "").trim().toLowerCase().replace(/\s+/g, "");
const password = arg("password");
const displayName = arg("name") || username;
const role = arg("role", "staff");

if (!url || !serviceKey) {
  console.error("✗ Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}
if (!username || !password) {
  console.error("✗ Debes indicar --username y --password.");
  process.exit(1);
}
if (!VALID_ROLES.includes(role)) {
  console.error(`✗ Rol inválido: "${role}". Usa uno de: ${VALID_ROLES.join(", ")}.`);
  process.exit(1);
}

// Email interno determinista. DEBE coincidir con el que usa el login de la app
// (src/lib/supabase/env.ts → usernameToEmail). Si en Vercel definiste
// NEXT_PUBLIC_INTERNAL_EMAIL_DOMAIN, usa ESE MISMO valor aquí.
const email = `${username}@${domain}`;

console.log(`→ Usuario: "${username}"  ·  rol: ${role}  ·  email interno: ${email}`);
console.log("  (el usuario inicia sesión solo con usuario + contraseña; el email es interno)\n");

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1) Crear el usuario de auth (o reutilizarlo si ya existe).
let userId;
const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // sin paso de confirmación: puede entrar de una vez
  user_metadata: { username, display_name: displayName },
});

if (!createErr) {
  userId = created.user.id;
  console.log("✓ Usuario de auth creado.");
} else if (/already|registered|exists/i.test(createErr.message)) {
  // Ya existía: lo buscamos y dejamos clave/metadata al día (idempotente).
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) {
    console.error("✗ No se pudo listar usuarios para reutilizar:", listErr.message);
    process.exit(1);
  }
  const found = list.users.find(
    (u) => (u.email || "").toLowerCase() === email.toLowerCase(),
  );
  if (!found) {
    console.error("✗ El email ya está registrado pero no se encontró el usuario.");
    process.exit(1);
  }
  userId = found.id;
  const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
    password,
    user_metadata: { username, display_name: displayName },
  });
  if (updErr) {
    console.error("✗ No se pudo actualizar el usuario existente:", updErr.message);
    process.exit(1);
  }
  console.log("✓ El usuario de auth ya existía; clave y datos actualizados.");
} else {
  console.error("✗ Error creando usuario de auth:", createErr.message);
  process.exit(1);
}

// 2) Crear/actualizar su fila en app_users (rol incluido). Upsert por auth_id.
const { error: rowErr } = await supabase
  .from("app_users")
  .upsert(
    { auth_id: userId, username, display_name: displayName, role },
    { onConflict: "auth_id" },
  );

if (rowErr) {
  console.error("✗ Usuario de auth listo, pero falló app_users:", rowErr.message);
  if (/duplicate|unique/i.test(rowErr.message)) {
    console.error(
      "  Sugerencia: ese nombre de usuario ya está tomado por otra cuenta. Usa otro --username.",
    );
  }
  process.exit(1);
}

console.log(
  `\n✅ Listo. "${username}" (${role}) puede iniciar sesión con usuario + contraseña y entrar al Dashboard.`,
);
