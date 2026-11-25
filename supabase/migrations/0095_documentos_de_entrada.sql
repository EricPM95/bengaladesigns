-- 0095 · LAS ENTRADAS Y EXCURSIONES, CADA UNO CON LA SUYA (V65). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Va DESPUÉS de la 0094. Comprobación: docs/dias/COMPROBAR_0095.sql.
--
-- Qué hace, en palabras sencillas:
--   * Guarda el documento (el código QR, el localizador y el nombre) de una entrada o de una excursión de VARIAS personas: uno por persona, con su nombre, o uno solo para todos (`clave` = 'comun').
--   * Lo leen y lo cambian SOLO las personas para las que es la entrada (`para`) y quien lo subió (`subido_por`). Nadie más del viaje (ni el administrador, si la entrada no es suya).
--   * Va aparte de `billetes_personales` (0070, que es privado de UNA persona) porque aquí el documento de Alicia lo ven Alicia y Eric.
--   * Solo se guarda el código (un dibujo pequeño) y los datos: ni el PDF ni la foto.
--
-- Es una tabla con datos de una persona (`subido_por`, `para`): entra en el inventario de `empezar_de_cero` (parte de su ÚLTIMA versión, la de la 0091: 0032 → 0037 → 0040 → 0071 → 0072 → 0074 → 0086 → 0089 → 0091;
-- la única diferencia son las dos líneas de `documentos_de_entrada`: por quien lo subió y por la persona a quien pertenece). Se quedan SIEMPRE: pagos_registro, cuentas_de_prueba, afiliados_clics y destinos_proximamente.
-- SI NO SE APLICA: todo funciona igual en cada móvil (el documento se guarda en el propio móvil y se ve sin internet); solo no se reparte entre las personas de la entrada. La app lo ignora sin errores.
begin;

create table if not exists public.documentos_de_entrada (
  trip_id uuid not null references public.trips (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'excursion')),
  ref_id text not null,
  clave text not null,
  -- La persona a quien pertenece el documento (null en el de todos, 'comun'): cuando esa persona empieza de cero o borra su cuenta, se borra también lo que otros subieron a su nombre.
  persona_id uuid references auth.users (id) on delete cascade,
  subido_por uuid not null references auth.users (id) on delete cascade,
  para uuid[] not null default '{}',
  nombre text,
  localizador text,
  personas integer,
  codigo jsonb,
  actualizado_en timestamptz not null default now(),
  primary key (trip_id, tipo, ref_id, clave)
);

alter table public.documentos_de_entrada enable row level security;

-- Para entrar: ser del viaje (miembro o dueño), como en `reservas_invitado` (0038).
drop policy if exists "documentos_de_entrada select" on public.documentos_de_entrada;
create policy "documentos_de_entrada select" on public.documentos_de_entrada
  for select to authenticated using (subido_por = auth.uid() or auth.uid() = any (para));

drop policy if exists "documentos_de_entrada insert" on public.documentos_de_entrada;
create policy "documentos_de_entrada insert" on public.documentos_de_entrada
  for insert to authenticated with check (
    subido_por = auth.uid() and (public.es_miembro(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.traveler_id = auth.uid()))
  );

drop policy if exists "documentos_de_entrada update" on public.documentos_de_entrada;
create policy "documentos_de_entrada update" on public.documentos_de_entrada
  for update to authenticated using (subido_por = auth.uid() or auth.uid() = any (para))
  with check (public.es_miembro(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.traveler_id = auth.uid()));

drop policy if exists "documentos_de_entrada delete" on public.documentos_de_entrada;
create policy "documentos_de_entrada delete" on public.documentos_de_entrada
  for delete to authenticated using (subido_por = auth.uid() or auth.uid() = any (para));

create index if not exists documentos_de_entrada_trip_idx on public.documentos_de_entrada (trip_id);

-- ── Empezar de cero (partiendo de la ÚLTIMA versión: la 0091) ───────────────────────────────────────────────────────────────────────────
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
      ('uso_diario', 'user_id'),
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
      ('documentos_de_entrada', 'subido_por'),
      ('documentos_de_entrada', 'persona_id'),
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
