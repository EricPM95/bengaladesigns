-- LAS CUENTAS, PARTE 1 (docs/dias/PLAN_CUENTAS.md). Una sola migración, en una sola transacción: si algo falla, no se queda nada a medias
-- (importante: reescribe las reglas de `trips`, que ya está en uso).
--
-- SIN APLICAR EN PRODUCCIÓN. Se aplica a mano en el SQL editor de Supabase, DESPUÉS de las anteriores (0001 a 0019). Hasta que se aplique, la
-- app sigue funcionando igual (el interruptor de las cuentas está apagado). Requisitos de Supabase, en docs/dias/INFORME_CUENTAS_1.md.
--
-- Qué crea, en palabras sencillas:
--   * `app_config`: datos de la app como datos (la fecha de salida), para que «viajero fundador» no dependa de un número escrito en el código.
--   * `travelers`: se le añade la fecha de alta de la cuenta, el email y el nombre.
--   * `trips`: el dueño del viaje (`traveler_id`) es su ADMINISTRADOR. Solo él cambia la ruta. Los invitados la ven, pero no la cambian.
--   * `trip_members`: los invitados de un viaje. `trip_recommendations`: lo que un invitado recomienda (un cambio suelto, un día nuevo o la ruta
--     entera); solo el administrador lo acepta o lo rechaza.
--   * `stop_visits`: los «Visto» de CADA persona, aunque comparta viaje. `trip_photo_meta`: la fecha y el sitio de cada foto, leídos antes de quitarle
--     los datos escondidos (para los logros).
--   * `achievements` (logros) y `passes` / `pass_members` (pases): preparadas para las tandas que vienen. Hoy vacías y sin cobro.
--   * `marcar_alta()` y `es_fundador()`: viajero fundador = alta de la cuenta antes de «salida + 1 año».
--   * `reclamar_anonimo()`: solo para el servidor; pasa lo de una sesión anónima a una cuenta que ya existía (entrar desde otro móvil).
--
-- Quién ve qué: cada persona solo ve lo suyo y lo de los viajes donde está invitada. Los logros y los pases solo los escribe el servidor
-- (con su clave de servicio): nadie se da un logro ni un pase a sí mismo desde el móvil.
--
-- Al borrar un usuario de Supabase se borra en cascada todo lo suyo (viajes, invitados, vistos, fotos, logros, pases que compró, «me gusta»).
-- Los ARCHIVOS de las fotos (almacenamiento) no caen en cascada: los borra el servidor (DELETE /api/cuenta).

begin;

-- ── Datos de la app ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
drop policy if exists "app_config select all" on public.app_config;
create policy "app_config select all" on public.app_config for select to anon, authenticated using (true);
-- Sin políticas de escritura: solo el servidor (clave de servicio) o el SQL editor cambian estos datos.

-- La fecha de salida de la app. Si la salida cambia, se cambia aquí (update public.app_config set value = '"2026-11-18"' where key = 'salida_app').
insert into public.app_config (key, value) values ('salida_app', '"2026-11-04"') on conflict (key) do nothing;

-- ── Quién es cada viajero ────────────────────────────────────────────────────────────────────────────────────────────────────────────

alter table public.travelers add column if not exists alta_cuenta timestamptz;
alter table public.travelers add column if not exists email text;
alter table public.travelers add column if not exists nombre text;

-- ── Viajes: el dueño es el administrador ─────────────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'invitado' check (rol = 'invitado'),
  invited_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create index if not exists idx_trip_members_user on public.trip_members (user_id);
alter table public.trip_members enable row level security;

-- ── Funciones de ayuda (security definer, para que las reglas de `trips` y de `trip_members` no se llamen entre sí sin fin) ─────────────

create or replace function public.es_dueno(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trips t where t.id = p_trip and t.traveler_id = auth.uid())
$$;

create or replace function public.es_miembro(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trip_members m where m.trip_id = p_trip and m.user_id = auth.uid())
$$;

drop policy if exists "trip_members select" on public.trip_members;
create policy "trip_members select" on public.trip_members
  for select to authenticated using (user_id = auth.uid() or public.es_dueno(trip_id));
drop policy if exists "trip_members insert dueno" on public.trip_members;
create policy "trip_members insert dueno" on public.trip_members
  for insert to authenticated with check (public.es_dueno(trip_id) and user_id <> auth.uid());
drop policy if exists "trip_members delete" on public.trip_members;
create policy "trip_members delete" on public.trip_members
  for delete to authenticated using (user_id = auth.uid() or public.es_dueno(trip_id));
-- Sin update: un invitado no se cambia el rol.

-- `trips`: se rehacen las reglas. Ver el viaje: el dueño y los invitados. Cambiarlo o borrarlo: SOLO el dueño (el administrador).
drop policy if exists "trips select own" on public.trips;
drop policy if exists "trips insert own" on public.trips;
drop policy if exists "trips update own" on public.trips;
drop policy if exists "trips delete own" on public.trips;
drop policy if exists "trips select dueno o invitado" on public.trips;
drop policy if exists "trips insert dueno" on public.trips;
drop policy if exists "trips update dueno" on public.trips;
drop policy if exists "trips delete dueno" on public.trips;

create policy "trips select dueno o invitado" on public.trips
  for select to authenticated using (traveler_id = auth.uid() or public.es_miembro(id));
create policy "trips insert dueno" on public.trips
  for insert to authenticated with check (traveler_id = auth.uid());
create policy "trips update dueno" on public.trips
  for update to authenticated using (traveler_id = auth.uid()) with check (traveler_id = auth.uid());
create policy "trips delete dueno" on public.trips
  for delete to authenticated using (traveler_id = auth.uid());

-- Las recomendaciones de los invitados.
create table if not exists public.trip_recommendations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('cambio', 'dia', 'ruta')),
  payload jsonb not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'rechazada')),
  created_at timestamptz not null default now(),
  decidida_en timestamptz,
  decidida_por uuid references auth.users (id) on delete set null
);
create index if not exists idx_trip_recommendations_trip on public.trip_recommendations (trip_id, estado);
alter table public.trip_recommendations enable row level security;

drop policy if exists "trip_recommendations select" on public.trip_recommendations;
create policy "trip_recommendations select" on public.trip_recommendations
  for select to authenticated using (author_id = auth.uid() or public.es_dueno(trip_id));
drop policy if exists "trip_recommendations insert invitado" on public.trip_recommendations;
create policy "trip_recommendations insert invitado" on public.trip_recommendations
  for insert to authenticated with check (author_id = auth.uid() and public.es_miembro(trip_id) and estado = 'pendiente');
drop policy if exists "trip_recommendations update dueno" on public.trip_recommendations;
create policy "trip_recommendations update dueno" on public.trip_recommendations
  for update to authenticated using (public.es_dueno(trip_id)) with check (public.es_dueno(trip_id));
drop policy if exists "trip_recommendations delete autor" on public.trip_recommendations;
create policy "trip_recommendations delete autor" on public.trip_recommendations
  for delete to authenticated using (author_id = auth.uid() and estado = 'pendiente');

-- El administrador solo decide (acepta o rechaza): no puede reescribir lo que el invitado recomendó.
create or replace function public.trip_recommendations_solo_estado() returns trigger
language plpgsql as $$
begin
  if new.trip_id is distinct from old.trip_id or new.author_id is distinct from old.author_id
     or new.tipo is distinct from old.tipo or new.payload is distinct from old.payload or new.created_at is distinct from old.created_at then
    raise exception 'Una recomendación solo puede aceptarse o rechazarse; no se puede cambiar lo que recomienda.';
  end if;
  if new.estado is distinct from old.estado then
    new.decidida_en := now();
    new.decidida_por := auth.uid();
  end if;
  return new;
end $$;
drop trigger if exists trip_recommendations_solo_estado on public.trip_recommendations;
create trigger trip_recommendations_solo_estado before update on public.trip_recommendations
  for each row execute function public.trip_recommendations_solo_estado();

-- ── Vistos: de cada persona ──────────────────────────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.stop_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_id text not null,
  stop_id text not null,
  visto_en timestamptz not null default now(),
  unique (user_id, trip_id, stop_id)
);
create index if not exists idx_stop_visits_trip on public.stop_visits (user_id, trip_id);
alter table public.stop_visits enable row level security;
drop policy if exists "stop_visits select own" on public.stop_visits;
create policy "stop_visits select own" on public.stop_visits for select to authenticated using (user_id = auth.uid());
drop policy if exists "stop_visits insert own" on public.stop_visits;
create policy "stop_visits insert own" on public.stop_visits
  for insert to authenticated with check (user_id = auth.uid() and (public.es_dueno(trip_id) or public.es_miembro(trip_id)));
drop policy if exists "stop_visits delete own" on public.stop_visits;
create policy "stop_visits delete own" on public.stop_visits for delete to authenticated using (user_id = auth.uid());

-- ── Fotos: lo que la app lee de la foto ANTES de quitarle los datos escondidos ───────────────────────────────────────────────────────

create table if not exists public.trip_photo_meta (
  photo_id uuid primary key references public.trip_photos (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  taken_at timestamptz,
  lat double precision,
  lng double precision,
  con_camara boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.trip_photo_meta enable row level security;
drop policy if exists "trip_photo_meta select own" on public.trip_photo_meta;
create policy "trip_photo_meta select own" on public.trip_photo_meta for select to authenticated using (user_id = auth.uid());
drop policy if exists "trip_photo_meta insert own" on public.trip_photo_meta;
create policy "trip_photo_meta insert own" on public.trip_photo_meta
  for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.trip_photos p where p.id = photo_id and p.user_id = auth.uid()));
drop policy if exists "trip_photo_meta delete own" on public.trip_photo_meta;
create policy "trip_photo_meta delete own" on public.trip_photo_meta for delete to authenticated using (user_id = auth.uid());

-- ── Logros (para la tanda de los logros; hoy vacía) ──────────────────────────────────────────────────────────────────────────────────

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logro text not null,
  escalon text not null default '',
  destino text not null,
  trip_id uuid references public.trips (id) on delete set null,
  ganado_en timestamptz not null default now(),
  unique (user_id, destino, logro, escalon)
);
create index if not exists idx_achievements_user on public.achievements (user_id, destino);
alter table public.achievements enable row level security;
drop policy if exists "achievements select own" on public.achievements;
create policy "achievements select own" on public.achievements for select to authenticated using (user_id = auth.uid());
-- Sin políticas de escritura: solo el servidor concede un logro.

-- ── Pases (para el cobro; hoy vacía y todo sigue abierto) ────────────────────────────────────────────────────────────────────────────

create table if not exists public.passes (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  comprador_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('uno', 'duo', 'grupo')),
  para_id uuid references auth.users (id) on delete set null,
  usos_max integer not null check (usos_max > 0),
  usos_usados integer not null default 0 check (usos_usados >= 0 and usos_usados <= usos_max),
  codigo text not null unique,
  pago_ref text,
  created_at timestamptz not null default now()
);
create index if not exists idx_passes_comprador on public.passes (comprador_id);

create table if not exists public.pass_members (
  pass_id uuid not null references public.passes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  unido_en timestamptz not null default now(),
  primary key (pass_id, user_id)
);

create or replace function public.pase_visible(p_pase uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.passes p
    where p.id = p_pase and (p.comprador_id = auth.uid() or p.para_id = auth.uid()
      or exists (select 1 from public.pass_members m where m.pass_id = p.id and m.user_id = auth.uid()))
  )
$$;

alter table public.passes enable row level security;
drop policy if exists "passes select" on public.passes;
create policy "passes select" on public.passes for select to authenticated using (public.pase_visible(id));
alter table public.pass_members enable row level security;
drop policy if exists "pass_members select" on public.pass_members;
create policy "pass_members select" on public.pass_members for select to authenticated using (public.pase_visible(pass_id));
-- Sin políticas de escritura: los pases los crea y los reparte el servidor.

-- ── Viajero fundador ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

-- La llama la app justo después de entrar con una cuenta de verdad. Guarda la fecha de alta la primera vez y marca al viajero como no anónimo.
create or replace function public.marcar_alta() returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_anonimo boolean;
  v_alta timestamptz;
begin
  if v_uid is null then
    raise exception 'Hace falta una sesión.';
  end if;
  v_anonimo := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true);
  if v_anonimo then
    return null;
  end if;
  insert into public.travelers (id, is_anonymous, alta_cuenta) values (v_uid, false, now())
  on conflict (id) do update
    set is_anonymous = false, alta_cuenta = coalesce(public.travelers.alta_cuenta, excluded.alta_cuenta)
  returning alta_cuenta into v_alta;
  return v_alta;
end $$;
revoke all on function public.marcar_alta() from public;
grant execute on function public.marcar_alta() to authenticated;

-- Fundador = alta antes de «salida + 1 año». La salida es un dato (`app_config.salida_app`), no un número escrito aquí.
create or replace function public.es_fundador(p_alta timestamptz) returns boolean
language sql stable security definer set search_path = public as $$
  select p_alta is not null
    and p_alta < ((select (value #>> '{}')::date from public.app_config where key = 'salida_app') + interval '1 year')
$$;
grant execute on function public.es_fundador(timestamptz) to authenticated;

create or replace view public.viajero_fundador with (security_invoker = true) as
  select t.id, t.alta_cuenta, public.es_fundador(t.alta_cuenta) as fundador
  from public.travelers t;
grant select on public.viajero_fundador to authenticated;

-- ── Pasar lo de una sesión anónima a una cuenta que ya existía (Caso B del plan) ─────────────────────────────────────────────────────

-- Solo la llama el servidor (clave de servicio), después de comprobar los dos tokens. Mueve a la cuenta nueva todo lo del usuario anónimo
-- (viajes, fotos, vistos, «me gusta», invitaciones, logros, pases) y borra el usuario anónimo, ya vacío. Lo que ya existiera igual en la
-- cuenta nueva (un «me gusta» repetido) no se duplica. Los ARCHIVOS de las fotos los mueve el servidor antes, con la API del almacenamiento.
create or replace function public.reclamar_anonimo(p_viejo uuid, p_nuevo uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  n_viajes int; n_fotos int; n_vistos int; n_likes int;
begin
  if p_viejo is null or p_nuevo is null or p_viejo = p_nuevo then
    raise exception 'Las dos cuentas tienen que ser distintas.';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_viejo and coalesce(u.is_anonymous, false)) then
    raise exception 'El usuario de origen no es anónimo.';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_nuevo) then
    raise exception 'La cuenta de destino no existe.';
  end if;

  insert into public.travelers (id, is_anonymous) values (p_nuevo, false) on conflict (id) do nothing;

  update public.trips set traveler_id = p_nuevo where traveler_id = p_viejo;
  get diagnostics n_viajes = row_count;

  update public.trip_photos
    set user_id = p_nuevo, storage_path = p_nuevo::text || substr(storage_path, length(p_viejo::text) + 1)
    where user_id = p_viejo;
  get diagnostics n_fotos = row_count;
  update public.trip_photo_meta set user_id = p_nuevo where user_id = p_viejo;

  delete from public.stop_visits v where v.user_id = p_viejo
    and exists (select 1 from public.stop_visits n where n.user_id = p_nuevo and n.trip_id = v.trip_id and n.stop_id = v.stop_id);
  update public.stop_visits set user_id = p_nuevo where user_id = p_viejo;
  get diagnostics n_vistos = row_count;

  delete from public.place_likes l where l.user_id = p_viejo
    and exists (select 1 from public.place_likes n where n.user_id = p_nuevo and n.place_name = l.place_name and n.destination = l.destination);
  update public.place_likes set user_id = p_nuevo where user_id = p_viejo;
  get diagnostics n_likes = row_count;

  delete from public.trip_members m where m.user_id = p_viejo
    and exists (select 1 from public.trip_members n where n.user_id = p_nuevo and n.trip_id = m.trip_id);
  update public.trip_members set user_id = p_nuevo where user_id = p_viejo;
  update public.trip_recommendations set author_id = p_nuevo where author_id = p_viejo;

  delete from public.achievements a where a.user_id = p_viejo
    and exists (select 1 from public.achievements n where n.user_id = p_nuevo and n.destino = a.destino and n.logro = a.logro and n.escalon = a.escalon);
  update public.achievements set user_id = p_nuevo where user_id = p_viejo;

  update public.passes set comprador_id = p_nuevo where comprador_id = p_viejo;
  update public.passes set para_id = p_nuevo where para_id = p_viejo;
  delete from public.pass_members m where m.user_id = p_viejo
    and exists (select 1 from public.pass_members n where n.user_id = p_nuevo and n.pass_id = m.pass_id);
  update public.pass_members set user_id = p_nuevo where user_id = p_viejo;

  -- El usuario anónimo ya no tiene nada: se va (y con él su fila de `travelers`).
  delete from auth.users where id = p_viejo;

  return jsonb_build_object('viajes', n_viajes, 'fotos', n_fotos, 'vistos', n_vistos, 'megusta', n_likes);
end $$;
revoke all on function public.reclamar_anonimo(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reclamar_anonimo(uuid, uuid) to service_role;

commit;
