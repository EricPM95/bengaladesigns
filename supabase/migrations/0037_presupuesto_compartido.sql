-- 0037 · EL PRESUPUESTO DE UN VIAJE COMPARTIDO (Tanda 10N, apartado 9). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir: no duplica nada).
-- Aplícala DESPUÉS de la 0035 (los tipos de aviso `gasto_pendiente` y `gasto_resuelto` los deja la 0035) y de la 0036 (los permisos), si ya existe.
--
-- Qué hace, en palabras sencillas:
--   * `trip_gastos`: los gastos sueltos («Extras») de un viaje con gente. Cada gasto es de UNA persona (quien lo añade) y es:
--       - «Para mí» (`ambito = 'mio'`): SOLO lo ve quien lo añadió. Nunca pasa por nadie ni suma al «por persona» del grupo.
--       - «Para todos» (`ambito = 'grupo'`): suma al grupo. Si lo añade el administrador o quien PUEDE EDITAR, entra directo (`estado = 'aceptado'`).
--         Si lo añade quien solo recomienda, nace `pendiente`: el administrador y los que pueden editar lo ven en su campanita y lo aceptan o lo rechazan. Vale lo que decida el primero
--         (el segundo ya lo encuentra decidido: la fila solo cambia mientras está `pendiente`). Si se rechaza, el gasto se queda solo para quien lo añadió.
--     «¿Quién lo ha pagado?» se guarda en `pagado_por` (una o varias personas). «¿Entre quién?» y quién le debe a quién son de la tanda siguiente (10N2).
--   * Avisos de la campanita (los crean disparadores, como los de las recomendaciones):
--       `gasto_pendiente` a quien decide (el administrador y los que pueden editar), con el gasto dentro; `gasto_resuelto` a quien lo añadió, SIEMPRE (si tiene la app abierta, además lo ve en directo).
--   * Tiempo real: la tabla se añade a la publicación `supabase_realtime` para que la app abierta vea los cambios sin recargar.
--   * `empezar_de_cero` (0032) borra también los gastos que esa cuenta puso en viajes de otros.
-- Quién decide: el administrador (dueño del viaje) y los miembros con permiso «editar» (la columna `permiso` o `rol` de `trip_members`, la que exista: la crea la 0036). Sin la 0036 solo decide el administrador.
-- SI NO SE APLICA: la app lo detecta (la tabla no existe), no enseña [Para todos] / [Para mí] y el presupuesto se queda como siempre.

begin;

-- ── Quién decide los gastos de un viaje ─────────────────────────────────────────────────────────────────────────────────────

create or replace function public.decisores_de_gastos(p_trip uuid) returns setof uuid
language plpgsql stable security definer set search_path = public as $$
declare v_col text;
begin
  return query select traveler_id from public.trips where id = p_trip;
  for v_col in
    select column_name::text from information_schema.columns
    where table_schema = 'public' and table_name = 'trip_members' and column_name in ('permiso', 'rol')
  loop
    return query execute format('select user_id from public.trip_members where trip_id = $1 and %I = ''editar''', v_col) using p_trip;
  end loop;
end $$;

create or replace function public.es_decisor_de_gastos(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.decisores_de_gastos(p_trip) d where d = auth.uid())
$$;

-- ── La tabla ────────────────────────────────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.trip_gastos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  autor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  -- {"amount": 30, "currency": "EUR"}
  precio jsonb not null check (jsonb_typeof(precio) = 'object' and (precio ->> 'amount') ~ '^[0-9]+(\.[0-9]+)?$' and coalesce(precio ->> 'currency', '') <> ''),
  ambito text not null check (ambito in ('grupo', 'mio')),
  estado text not null default 'aceptado' check (estado in ('pendiente', 'aceptado', 'rechazado')),
  -- Quién lo pagó (una o varias personas del viaje). Vacío en los «Para mí».
  pagado_por uuid[] not null default '{}',
  decidido_por uuid references auth.users (id) on delete set null,
  decidido_en timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_trip_gastos_trip on public.trip_gastos (trip_id, estado);
create index if not exists idx_trip_gastos_autor on public.trip_gastos (autor_id);
alter table public.trip_gastos enable row level security;

-- Ver: lo tuyo (siempre, también lo rechazado), lo del grupo ya aceptado (todos los del viaje), lo pendiente del grupo (solo quien decide) y lo que tú mismo has decidido.
drop policy if exists "trip_gastos select" on public.trip_gastos;
create policy "trip_gastos select" on public.trip_gastos
  for select to authenticated using (
    autor_id = auth.uid()
    or (ambito = 'grupo' and estado = 'aceptado' and (public.es_dueno(trip_id) or public.es_miembro(trip_id)))
    or (ambito = 'grupo' and estado = 'pendiente' and public.es_decisor_de_gastos(trip_id))
    -- (quien acaba de decidir ve el gasto que ha decidido: sin esto, rechazarlo lo haría desaparecer en mitad de su propia respuesta)
    or decidido_por = auth.uid()
  );
-- Añadir: cualquiera del viaje, en su nombre. «Para mí», directo; «Para todos», directo si decide (administrador o puede editar) o pendiente si solo recomienda.
drop policy if exists "trip_gastos insert" on public.trip_gastos;
create policy "trip_gastos insert" on public.trip_gastos
  for insert to authenticated with check (
    autor_id = auth.uid()
    and (public.es_dueno(trip_id) or public.es_miembro(trip_id))
    and decidido_por is null
    and (
      (ambito = 'mio' and estado = 'aceptado' and cardinality(pagado_por) = 0)
      or (ambito = 'grupo' and estado = 'aceptado' and public.es_decisor_de_gastos(trip_id))
      or (ambito = 'grupo' and estado = 'pendiente')
    )
  );
-- Decidir: quien decide, y solo mientras está pendiente (vale lo que decida el primero).
drop policy if exists "trip_gastos update decisor" on public.trip_gastos;
create policy "trip_gastos update decisor" on public.trip_gastos
  for update to authenticated using (estado = 'pendiente' and ambito = 'grupo' and public.es_decisor_de_gastos(trip_id))
  with check (estado in ('aceptado', 'rechazado') and public.es_decisor_de_gastos(trip_id));
-- Quitar: quien lo añadió, y quien decide los del grupo.
drop policy if exists "trip_gastos delete" on public.trip_gastos;
create policy "trip_gastos delete" on public.trip_gastos
  for delete to authenticated using (autor_id = auth.uid() or (ambito = 'grupo' and public.es_decisor_de_gastos(trip_id)));

-- Quien decide solo decide: no puede reescribir lo que otra persona apuntó.
create or replace function public.trip_gastos_solo_estado() returns trigger
language plpgsql as $$
begin
  if new.trip_id is distinct from old.trip_id or new.autor_id is distinct from old.autor_id or new.nombre is distinct from old.nombre
     or new.precio is distinct from old.precio or new.ambito is distinct from old.ambito or new.pagado_por is distinct from old.pagado_por or new.created_at is distinct from old.created_at then
    raise exception 'Un gasto solo puede aceptarse o rechazarse; no se puede cambiar lo que apunta.';
  end if;
  if new.estado is distinct from old.estado then
    new.decidido_en := now();
    new.decidido_por := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists trip_gastos_solo_estado on public.trip_gastos;
create trigger trip_gastos_solo_estado before update on public.trip_gastos for each row execute function public.trip_gastos_solo_estado();

-- ── Los avisos de la campanita ──────────────────────────────────────────────────────────────────────────────────────────────

create or replace function public.nombres_de_pila(p_ids uuid[]) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(string_agg(n, ', ' order by o), '') from (
    select nullif(trim(split_part(coalesce(t.nombre, ''), ' ', 1)), '') as n, i.o
    from unnest(coalesce(p_ids, '{}'::uuid[])) with ordinality as i(id, o) join public.travelers t on t.id = i.id
  ) s where n is not null
$$;

-- A quien decide: «Ana quiere añadir al presupuesto» (con el gasto dentro).
create or replace function public.avisar_gasto_pendiente() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_decisor uuid;
  v_nombre text;
begin
  if new.ambito <> 'grupo' or new.estado <> 'pendiente' then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.autor_id;
  for v_decisor in select d from public.decisores_de_gastos(new.trip_id) d where d <> new.autor_id loop
    insert into public.avisos (user_id, tipo, clave, payload)
    values (v_decisor, 'gasto_pendiente', 'gp:' || new.id || ':' || v_decisor,
            jsonb_build_object('trip_id', new.trip_id, 'gasto_id', new.id, 'autor_id', new.autor_id, 'autor', v_nombre, 'inicial', public.inicial_de_email(new.autor_id),
                               'nombre', new.nombre, 'precio', new.precio, 'pago', public.nombres_de_pila(new.pagado_por)))
    on conflict do nothing;
  end loop;
  return new;
end $$;
drop trigger if exists avisar_gasto_pendiente on public.trip_gastos;
create trigger avisar_gasto_pendiente after insert on public.trip_gastos for each row execute function public.avisar_gasto_pendiente();

-- A quien lo añadió, SIEMPRE: «Eric ha aceptado tu gasto» / «Eric ha preferido no sumar tu gasto». Y los avisos de los que decidían quedan leídos (ya está decidido).
create or replace function public.avisar_gasto_resuelto() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nombre text;
begin
  if old.estado <> 'pendiente' or new.estado not in ('aceptado', 'rechazado') then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.decidido_por;
  if new.decidido_por is distinct from new.autor_id then
    insert into public.avisos (user_id, tipo, clave, payload)
    values (new.autor_id, 'gasto_resuelto', 'gr:' || new.id, jsonb_build_object('trip_id', new.trip_id, 'gasto_id', new.id, 'admin_id', new.decidido_por, 'admin', v_nombre, 'inicial', public.inicial_de_email(new.decidido_por),
                                                                               'resultado', new.estado, 'nombre', new.nombre, 'precio', new.precio))
    on conflict do nothing;
  end if;
  update public.avisos set leido_en = coalesce(leido_en, now()) where tipo = 'gasto_pendiente' and payload ->> 'gasto_id' = new.id::text;
  return new;
end $$;
drop trigger if exists avisar_gasto_resuelto on public.trip_gastos;
create trigger avisar_gasto_resuelto after update of estado on public.trip_gastos for each row execute function public.avisar_gasto_resuelto();

-- Para el servidor (la lista de la campanita): cómo está hoy cada gasto de los avisos «quiere añadir» (pendiente, aceptado, rechazado o borrado).
create or replace function public.gastos_de_avisos(p_ids uuid[]) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'estado', g.estado, 'ambito', g.ambito)), '[]'::jsonb) from public.trip_gastos g where g.id = any(coalesce(p_ids, '{}'::uuid[]))
$$;
revoke all on function public.gastos_de_avisos(uuid[]) from public, anon, authenticated;
grant execute on function public.gastos_de_avisos(uuid[]) to service_role;
revoke all on function public.decisores_de_gastos(uuid) from public, anon, authenticated;
grant execute on function public.decisores_de_gastos(uuid) to service_role;
revoke all on function public.nombres_de_pila(uuid[]) from public, anon, authenticated;
grant execute on function public.nombres_de_pila(uuid[]) to service_role;

-- ── Tiempo real ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_gastos') then
    alter publication supabase_realtime add table public.trip_gastos;
  end if;
end $$;

-- ── Empezar de cero (0032): ahora también borra los gastos que esa cuenta puso en viajes de otros ───────────────────────────

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
      ('hoy_prueba', 'user_id'),
      ('logro_referidos', 'invitador_id'),
      ('avisos', 'user_id'),
      ('avisos_destino', 'user_id'),
      ('place_likes', 'user_id'),
      ('admin_sin_pase', 'user_id'),
      ('trip_recommendations', 'author_id'),
      ('trip_gastos', 'autor_id'),
      ('trip_invitations', 'creada_por'),
      ('trip_members', 'user_id'),
      ('pass_members', 'user_id'),
      ('passes', 'comprador_id'),
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
