-- ════════════════════════════════════════════════════════════════
-- JM TECH — TANDA 10D: ENDURECIMIENTO DE SEGURIDAD (Fort Knox)
-- Migración 0012 — Cierra grants por defecto de Postgres.
--
-- Postgres otorga EXECUTE a PUBLIC en toda función nueva. Eso dejó funciones
-- internas SECURITY DEFINER invocables por `anon`/`authenticated` vía RPC. La
-- crítica es `log_activity`: como corre con privilegios del dueño (salta RLS),
-- cualquiera con EXECUTE podría INYECTAR registros forjados en el historial
-- inviolable. La cerramos (y a los helpers internos) revocando de PUBLIC.
--
-- Los triggers NO comprueban EXECUTE al dispararse, así que el alimentado
-- automático del historial sigue funcionando. is_admin()/current_app_role() se
-- DEJAN intactas: las políticas RLS las invocan y deben seguir accesibles.
-- ════════════════════════════════════════════════════════════════

-- IMPORTANTE: Supabase otorga EXECUTE DIRECTO a `anon` y `authenticated` (no
-- solo vía PUBLIC), por sus default privileges. Revocamos de los tres.
do $$
declare
  f text;
  fns text[] := array[
    -- Núcleo: nadie inyecta al historial por RPC. Solo los triggers (dueño).
    'log_activity(profile_type, uuid, text, text, text, text, text, numeric, text, jsonb)',
    -- Helpers de autorización internos.
    'cash_actor()',
    'employee_actor()',
    -- Funciones de trigger: se disparan por evento, no se invocan por API.
    'tg_log_sale_insert()',
    'tg_log_sale_void()',
    'tg_log_price_change()',
    'tg_log_cash_open()',
    'tg_log_cash_close()',
    'tg_log_cash_egreso()',
    'activity_log_immutable()',
    'set_updated_at()'
  ];
begin
  foreach f in array fns loop
    execute format('revoke execute on function public.%s from public, anon, authenticated;', f);
  end loop;
end $$;

-- is_admin() y current_app_role() se DEJAN intactas a propósito: las políticas
-- RLS las invocan en el contexto del rol que consulta (incluido anon), así que
-- deben permanecer ejecutables o se rompería la evaluación de las políticas.
