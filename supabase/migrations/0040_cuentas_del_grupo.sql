-- 0040 · LAS CUENTAS DEL GRUPO, QUIÉN LE DEBE A QUIÉN (Tanda 10N2). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir: no duplica nada).
-- Aplícala DESPUÉS de la 0037 (presupuesto compartido) y de la 0036 (permisos).
--
-- Qué hace, en palabras sencillas:
--   * `trip_gastos.entre`: «¿Entre quién?». Las personas a las que toca el gasto [Para todos] (a partes iguales). Vacío = entre todos los del viaje (los gastos de antes de esta migración).
--   * Se puede EDITAR un gasto [Para todos] después (nombre, importe, quién lo pagó, entre quién): quien lo añadió, el administrador y quien puede editar. Decidir un gasto pendiente sigue siendo solo decidir.
--   * `trip_pagos`: los «Ya está pagado» (de quién a quién y cuánto). Los ve todo el grupo; los marca y los deshace quien paga, quien cobra, el administrador y quien puede editar. Al marcar uno, el otro
--     recibe en su campanita «Eric ha marcado como pagados los 15 € que le debías.» (tipo de aviso `pago_marcado`).
--   * `trip_ex_miembros`: quien sale del viaje o a quien quitan deja aquí su nombre (nadie pierde lo que puso: sus gastos y lo que le tocaba siguen en las cuentas con su nombre).
--   * Tiempo real: `trip_pagos` entra en la publicación `supabase_realtime`.
--   * Redefine la lista de tipos de aviso con TODOS los de la 0035 más `pago_marcado`, y `empezar_de_cero` (0032, como la dejó la 0037) con las tablas nuevas.
-- SI NO SE APLICA: todo sigue como en la 10N: el «¿Entre quién?» y los pagos no se guardan (la app lo detecta) y las cuentas se calculan con lo que haya (los gastos, entre todos) sin poder marcar pagos.

begin;

alter table public.trip_gastos add column if not exists entre uuid[] not null default '{}';

-- ── Editar un gasto del grupo ───────────────────────────────────────────────────────────────────────────────────────────────

create or replace function public.trip_gastos_solo_estado() returns trigger
language plpgsql as $$
declare v_edita boolean;
begin
  if new.trip_id is distinct from old.trip_id or new.autor_id is distinct from old.autor_id or new.ambito is distinct from old.ambito or new.created_at is distinct from old.created_at then
    raise exception 'Un gasto no puede cambiar de viaje, de autor ni de [Para todos] a [Para mí].';
  end if;
  v_edita := new.nombre is distinct from old.nombre or new.precio is distinct from old.precio or new.pagado_por is distinct from old.pagado_por or new.entre is distinct from old.entre;
  if new.estado is distinct from old.estado then
    -- Decidir: solo decidir. No se reescribe lo que otra persona apuntó.
    if v_edita then raise exception 'Un gasto solo puede aceptarse o rechazarse; no se puede cambiar lo que apunta.'; end if;
    new.decidido_en := now();
    new.decidido_por := auth.uid();
  end if;
  return new;
end $$;

drop policy if exists "trip_gastos update editar" on public.trip_gastos;
create policy "trip_gastos update editar" on public.trip_gastos
  for update to authenticated
  using ((ambito = 'grupo' and estado = 'aceptado' and (autor_id = auth.uid() or public.es_decisor_de_gastos(trip_id))) or (ambito = 'mio' and autor_id = auth.uid()) or (estado = 'pendiente' and autor_id = auth.uid()))
  with check (estado = (select g.estado from public.trip_gastos g where g.id = trip_gastos.id) and ((ambito = 'grupo' and (autor_id = auth.uid() or public.es_decisor_de_gastos(trip_id))) or (ambito = 'mio' and autor_id = auth.uid())));

-- ── Quien sale del viaje deja su nombre ─────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.trip_ex_miembros (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null,
  nombre text,
  salio_en timestamptz not null default now(),
  primary key (trip_id, user_id)
);
alter table public.trip_ex_miembros enable row level security;
drop policy if exists "trip_ex_miembros select" on public.trip_ex_miembros;
create policy "trip_ex_miembros select" on public.trip_ex_miembros
  for select to authenticated using (public.es_dueno(trip_id) or public.es_miembro(trip_id));

create or replace function public.recordar_ex_miembro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.trip_ex_miembros (trip_id, user_id, nombre)
  select old.trip_id, old.user_id, nullif(trim(split_part(coalesce(t.nombre, ''), ' ', 1)), '') from (select 1) x left join public.travelers t on t.id = old.user_id
  on conflict (trip_id, user_id) do update set nombre = coalesce(excluded.nombre, public.trip_ex_miembros.nombre), salio_en = now();
  return old;
end $$;
drop trigger if exists recordar_ex_miembro on public.trip_members;
create trigger recordar_ex_miembro before delete on public.trip_members for each row execute function public.recordar_ex_miembro();

-- ── Los pagos: «Ya está pagado» ─────────────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.trip_pagos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  deudor_id uuid not null,
  acreedor_id uuid not null,
  -- {"amount": 15, "currency": "EUR"}
  importe jsonb not null check (jsonb_typeof(importe) = 'object' and (importe ->> 'amount') ~ '^[0-9]+(\.[0-9]+)?$' and coalesce(importe ->> 'currency', '') <> ''),
  marcado_por uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (deudor_id <> acreedor_id)
);
create index if not exists idx_trip_pagos_trip on public.trip_pagos (trip_id);
alter table public.trip_pagos enable row level security;

drop policy if exists "trip_pagos select" on public.trip_pagos;
create policy "trip_pagos select" on public.trip_pagos for select to authenticated using (public.es_dueno(trip_id) or public.es_miembro(trip_id));
drop policy if exists "trip_pagos insert" on public.trip_pagos;
create policy "trip_pagos insert" on public.trip_pagos
  for insert to authenticated with check (
    marcado_por = auth.uid() and (public.es_dueno(trip_id) or public.es_miembro(trip_id))
    and (deudor_id = auth.uid() or acreedor_id = auth.uid() or public.es_decisor_de_gastos(trip_id))
  );
-- Deshacer: las mismas personas que lo pueden marcar.
drop policy if exists "trip_pagos delete" on public.trip_pagos;
create policy "trip_pagos delete" on public.trip_pagos
  for delete to authenticated using (deudor_id = auth.uid() or acreedor_id = auth.uid() or marcado_por = auth.uid() or public.es_decisor_de_gastos(trip_id));

-- Al marcar un pago, el otro lo sabe: «Eric ha marcado como pagados los 15 € que le debías.»
create or replace function public.avisar_pago_marcado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_dest uuid;
  v_actor text;
  v_deudor text;
  v_acreedor text;
begin
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_actor from public.travelers where id = new.marcado_por;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_deudor from public.travelers where id = new.deudor_id;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_acreedor from public.travelers where id = new.acreedor_id;
  for v_dest in select x from unnest(array[new.deudor_id, new.acreedor_id]) x where x <> new.marcado_por and exists (select 1 from auth.users u where u.id = x) loop
    insert into public.avisos (user_id, tipo, clave, payload)
    values (v_dest, 'pago_marcado', 'pm:' || new.id || ':' || v_dest,
            jsonb_build_object('trip_id', new.trip_id, 'pago_id', new.id, 'actor_id', new.marcado_por, 'actor', v_actor, 'inicial', public.inicial_de_email(new.marcado_por),
                               'deudor_id', new.deudor_id, 'deudor', v_deudor, 'acreedor_id', new.acreedor_id, 'acreedor', v_acreedor, 'importe', new.importe,
                               'para', case when v_dest = new.deudor_id then 'deudor' else 'acreedor' end))
    on conflict do nothing;
  end loop;
  return new;
end $$;
drop trigger if exists avisar_pago_marcado on public.trip_pagos;
create trigger avisar_pago_marcado after insert on public.trip_pagos for each row execute function public.avisar_pago_marcado();

-- ── Avisos: todos los tipos de la 0035 más `pago_marcado` ───────────────────────────────────────────────────────────────────

alter table public.avisos drop constraint if exists avisos_tipo_check;
alter table public.avisos
  add constraint avisos_tipo_check
  check (tipo in ('recomendacion', 'aceptada', 'rechazada', 'unido', 'd10', 'resumen', 'sorpresas', 'sorteo', 'amigo_viaje',
                  'permiso', 'quitado', 'viaje_cambiado', 'sin_enviar', 'reserva_grupo', 'gasto_pendiente', 'gasto_resuelto', 'pago_marcado'));

-- ── Tiempo real ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_pagos') then
    alter publication supabase_realtime add table public.trip_pagos;
  end if;
end $$;

-- ── Empezar de cero (0032, como la dejó la 0037): también los pagos que marcó esa cuenta y el rastro de que estuvo ─────────

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
      ('trip_pagos', 'marcado_por'),
      ('trip_ex_miembros', 'user_id'),
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
