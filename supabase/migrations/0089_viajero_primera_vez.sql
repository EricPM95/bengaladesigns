-- 0089 · LAS PREGUNTAS DE LA PRIMERA VEZ (V31) + EMPEZAR DE CERO CON ELLAS. SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Va DESPUÉS de la 0088. Comprobación: docs/dias/COMPROBAR_0089.sql.
--
-- En palabras sencillas:
--   La primera vez que alguien entra, la app le hace tres preguntas cortas: cada cuánto viaja (`frecuencia`), con quién suele viajar (`compania`) y en qué año nació (`anio_nacimiento`, opcional: puede quedar vacío).
--   Se guardan aquí, una fila por persona, para poder usarlas después (por ejemplo para afinar las sugerencias). `hecho_en` apunta cuándo contestó o saltó las preguntas: así ya no vuelven a salir.
--   Cada persona solo ve, crea y cambia SU fila (RLS). Anónimos: nada. No hay política de borrado: la fila la borra `empezar_de_cero`.
--
-- `empezar_de_cero`: esta migración NO edita ninguna anterior; parte de su ÚLTIMA versión (la de la 0086) e idéntica a ella salvo UNA línea más en el inventario: ('viajero_primera_vez', 'user_id').
-- SI NO SE APLICA: la app no puede guardar esas respuestas (volverá a preguntar) y «Empezar de cero» no las borraría.
begin;

create table if not exists public.viajero_primera_vez (
  user_id uuid primary key references auth.users (id) on delete cascade,
  frecuencia text check (frecuencia in ('una_vez_al_anio', 'dos_o_tres', 'cuatro_o_mas')),
  compania text check (compania in ('a_mi_aire', 'pareja', 'familia', 'amigos')),
  anio_nacimiento smallint check (anio_nacimiento between 1920 and 2100),
  hecho_en timestamptz not null default now()
);

alter table public.viajero_primera_vez enable row level security;
revoke all on public.viajero_primera_vez from anon;
drop policy if exists "viajero_primera_vez select own" on public.viajero_primera_vez;
create policy "viajero_primera_vez select own" on public.viajero_primera_vez for select to authenticated using (user_id = auth.uid());
drop policy if exists "viajero_primera_vez insert own" on public.viajero_primera_vez;
create policy "viajero_primera_vez insert own" on public.viajero_primera_vez for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "viajero_primera_vez update own" on public.viajero_primera_vez;
create policy "viajero_primera_vez update own" on public.viajero_primera_vez for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.empezar_de_cero(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_res jsonb := '{}'::jsonb;
  v_n integer;
  v_par record;
  v_traspaso jsonb;
begin
  if p_uid is null then raise exception 'Falta la cuenta.'; end if;
  if not exists (select 1 from auth.users where id = p_uid) then raise exception 'Esa cuenta no existe.'; end if;

  -- 1. Lo compartido pasa a los demás antes de borrar nada.
  v_traspaso := public.preparar_borrado(p_uid);

  -- 2. Lo de la cuenta, tabla a tabla y siempre por su columna de dueño. Las dependencias van antes que de lo que dependen (los viajes, de los últimos).
  for v_par in
    select * from (values
      ('stop_visits', 'user_id'),
      ('trip_photo_meta', 'user_id'),
      ('trip_photos', 'user_id'),
      ('logro_hechos', 'user_id'),
      ('achievements', 'user_id'),
      ('logro_avisos', 'user_id'),
      ('logro_perfil', 'user_id'),
      ('push_suscripciones', 'user_id'),
      ('logro_referidos', 'invitador_id'),
      ('avisos', 'user_id'),
      ('avisos_viaje_enviados', 'user_id'),
      ('avisos_de_viajeros', 'user_id'),
      ('viajero_primera_vez', 'user_id'),
      ('avisos_destino', 'user_id'),
      ('place_likes', 'user_id'),
      ('admin_sin_pase', 'user_id'),
      ('trip_recommendations', 'author_id'),
      ('trip_gastos', 'autor_id'),
      ('trip_pagos', 'marcado_por'),
      ('trip_invitations', 'creada_por'),
      ('trip_members', 'user_id'),
      ('trip_ex_miembros', 'user_id'),
      ('pass_members', 'user_id'),
      ('passes', 'comprador_id'),
      ('billetes_personales', 'user_id'),
      ('lo_suyo_del_viaje', 'user_id'),
      ('reservas_invitado', 'user_id'),
      ('reservas_privadas_admin', 'user_id'),
      ('trips', 'traveler_id'),
      ('fotos_por_borrar', 'user_id')
    ) as t (tabla, columna)
  loop
    if to_regclass('public.' || v_par.tabla) is not null then
      execute format('delete from public.%I where %I = $1', v_par.tabla, v_par.columna) using p_uid;
      get diagnostics v_n = row_count;
      v_res := v_res || jsonb_build_object(v_par.tabla, v_n);
    end if;
  end loop;

  return jsonb_build_object('borrados', v_res, 'traspasado', v_traspaso);
end $$;

revoke all on function public.empezar_de_cero(uuid) from public, anon, authenticated;
grant execute on function public.empezar_de_cero(uuid) to service_role;

commit;
