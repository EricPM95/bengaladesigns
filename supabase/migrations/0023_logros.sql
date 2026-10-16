-- LOS LOGROS, TANDA 8A (docs/dias/INFORME_TANDA8A.md). Una sola migración, en una sola transacción.
--
-- SIN APLICAR EN PRODUCCIÓN. Va DESPUÉS de la 0020, la 0021 (juntas, en ese orden) y la 0022 (que es independiente). Necesita las tablas de la 0020
-- (`achievements`, `trip_photo_meta`, `passes`, `trip_members`) y la 0018 (`trip_photos`). Hasta que se aplique, el interruptor de los logros se queda apagado.
--
-- Qué crea, en palabras sencillas:
--   * `logro_hechos`: los hechos que manda el móvil (un Visto, una foto) YA decididos por el servidor: dónde estaba (cerca / lejos / sin ubicación, nunca las
--     coordenadas), la hora del Visto o de la toma, y si valen. Solo el servidor los escribe. De los hechos se puede volver a calcular todo lo ganado.
--   * `achievements` (de la 0020) gana tres columnas: si su animación ya se vio (el puntito del botón), la frase de suspense que se usó la primera vez y un detalle.
--   * `logro_perfil`: lo que la persona guarda aparte (los países de antes, que solo pintan el globo y los números, y su vitrina). No da logros.
--   * `logro_avisos`: la cola de avisos (resumen del viaje, «te quedan 3 días»). Se prepara; el envío se enciende más adelante.
--   * `push_suscripciones`: dónde mandar un aviso al móvil (web push), si la persona lo permite.

begin;

-- ── Los hechos ───────────────────────────────────────────────────────────────

create table if not exists public.logro_hechos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  destino text not null,
  tipo text not null check (tipo in ('visto', 'foto')),
  sitio text,
  stop_id text,
  -- La hora del Visto o de la toma (no la del envío: sin cobertura, el Visto llega horas después).
  instante timestamptz not null,
  recibido_en timestamptz not null default now(),
  -- Solo la decisión, nunca las coordenadas.
  ubic text not null default 'sin' check (ubic in ('cerca', 'lejos', 'sin')),
  valido boolean not null default true,
  motivo text,
  origen text check (origen in ('app', 'galeria')),
  foto_id uuid references public.trip_photos (id) on delete set null,
  -- Las fechas del viaje, por si el viaje se borra (lo ganado no se pierde).
  inicio date,
  fin date,
  deshecho_en timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_logro_hechos_user on public.logro_hechos (user_id, destino);
create index if not exists idx_logro_hechos_trip on public.logro_hechos (user_id, trip_id);
-- Un solo Visto activo por persona, viaje y parada (tocar dos veces no da dos veces).
create unique index if not exists uq_logro_hechos_visto_activo
  on public.logro_hechos (user_id, trip_id, (coalesce(stop_id, sitio)))
  where tipo = 'visto' and deshecho_en is null;
alter table public.logro_hechos enable row level security;
drop policy if exists "logro_hechos select own" on public.logro_hechos;
create policy "logro_hechos select own" on public.logro_hechos for select to authenticated using (user_id = auth.uid());
-- Sin políticas de escritura: solo el servidor (clave de servicio) decide y guarda un hecho.

-- ── Logros: animación vista, frase y detalle ───────────────────────────────────────────────────

alter table public.achievements add column if not exists animacion_vista boolean not null default false;
alter table public.achievements add column if not exists frase text;
alter table public.achievements add column if not exists detalle jsonb;

-- ── Lo que la persona guarda aparte (no da logros) ────────────────────────────────────────────────

create table if not exists public.logro_perfil (
  user_id uuid primary key references auth.users (id) on delete cascade,
  previos jsonb not null default '{"paises": [], "dias": 0}'::jsonb,
  vitrina jsonb not null default '{"baldas": {}, "titulo": null}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.logro_perfil enable row level security;
drop policy if exists "logro_perfil select own" on public.logro_perfil;
create policy "logro_perfil select own" on public.logro_perfil for select to authenticated using (user_id = auth.uid());
drop policy if exists "logro_perfil insert own" on public.logro_perfil;
create policy "logro_perfil insert own" on public.logro_perfil for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "logro_perfil update own" on public.logro_perfil;
create policy "logro_perfil update own" on public.logro_perfil for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── La cola de avisos (se prepara; el envío se enciende más adelante) ───────────────────────────────────

create table if not exists public.logro_avisos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete cascade,
  tipo text not null check (tipo in ('resumen_viaje', 'quedan_dias')),
  enviar_en timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  enviado_en timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, trip_id, tipo)
);
create index if not exists idx_logro_avisos_pendientes on public.logro_avisos (enviar_en) where enviado_en is null;
alter table public.logro_avisos enable row level security;
drop policy if exists "logro_avisos select own" on public.logro_avisos;
create policy "logro_avisos select own" on public.logro_avisos for select to authenticated using (user_id = auth.uid());

-- ── Avisos al móvil (web push) ───────────────────────────────────────────────────────────

create table if not exists public.push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  claves jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.push_suscripciones enable row level security;
drop policy if exists "push_suscripciones select own" on public.push_suscripciones;
create policy "push_suscripciones select own" on public.push_suscripciones for select to authenticated using (user_id = auth.uid());
drop policy if exists "push_suscripciones insert own" on public.push_suscripciones;
create policy "push_suscripciones insert own" on public.push_suscripciones for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "push_suscripciones delete own" on public.push_suscripciones;
create policy "push_suscripciones delete own" on public.push_suscripciones for delete to authenticated using (user_id = auth.uid());

-- ── Entrar con una cuenta que ya existía desde un móvil con sesión anónima ──────────────────────────────

-- La llama el servidor (clave de servicio) justo ANTES de reclamar_anonimo (que borra la sesión anónima y, con ella, sus hechos): pasa a la cuenta nueva los hechos,
-- lo que guardó aparte y sus avisos al móvil. Un Visto que ya existiera igual en la cuenta nueva no se duplica.
create or replace function public.reclamar_anonimo_logros(p_viejo uuid, p_nuevo uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  n_hechos int := 0; n_push int := 0;
begin
  if p_viejo is null or p_nuevo is null or p_viejo = p_nuevo then
    raise exception 'Las dos cuentas tienen que ser distintas.';
  end if;
  -- Los Vistos activos que chocan con uno de la cuenta nueva (misma parada del mismo viaje) se quedan en la vieja y se van con ella.
  update public.logro_hechos h set user_id = p_nuevo
  where h.user_id = p_viejo
    and not (h.tipo = 'visto' and h.deshecho_en is null and exists (
      select 1 from public.logro_hechos n
      where n.user_id = p_nuevo and n.tipo = 'visto' and n.deshecho_en is null and n.trip_id is not distinct from h.trip_id and coalesce(n.stop_id, n.sitio) = coalesce(h.stop_id, h.sitio)));
  get diagnostics n_hechos = row_count;
  insert into public.logro_perfil (user_id, previos, vitrina)
    select p_nuevo, previos, vitrina from public.logro_perfil where user_id = p_viejo
    on conflict (user_id) do nothing;
  update public.push_suscripciones set user_id = p_nuevo where user_id = p_viejo
    and endpoint not in (select endpoint from public.push_suscripciones where user_id = p_nuevo);
  get diagnostics n_push = row_count;
  return jsonb_build_object('hechos', n_hechos, 'avisos_movil', n_push);
end $$;
revoke all on function public.reclamar_anonimo_logros(uuid, uuid) from public;
revoke all on function public.reclamar_anonimo_logros(uuid, uuid) from anon, authenticated;
grant execute on function public.reclamar_anonimo_logros(uuid, uuid) to service_role;

-- ── Pionero y números para /admin/logros (solo para el servidor) ───────────────────────────────────

-- El puesto de esta persona entre los viajeros de ese destino, por la hora de su primer hecho válido (el empate, por id). Pionero = los N primeros.
create or replace function public.logro_orden_pionero(p_user uuid, p_destino text) returns integer
language sql stable security definer set search_path = public as $$
  with primeros as (
    select user_id, min(instante) as primero from public.logro_hechos
    where destino = p_destino and valido and ubic <> 'lejos' and deshecho_en is null
    group by user_id
  ), mio as (select primero from primeros where user_id = p_user)
  select case when exists (select 1 from mio) then (
    select count(*)::int from primeros p, mio m
    where p.primero < m.primero or (p.primero = m.primero and p.user_id <= p_user)
  ) end
$$;
revoke all on function public.logro_orden_pionero(uuid, text) from public, anon, authenticated;
grant execute on function public.logro_orden_pionero(uuid, text) to service_role;

-- Cuánta gente tiene cada logro (solo números, nunca quién).
create or replace function public.logro_contar() returns table (destino text, logro text, escalon text, personas bigint)
language sql stable security definer set search_path = public as $$
  select a.destino, a.logro, a.escalon, count(distinct a.user_id) from public.achievements a group by a.destino, a.logro, a.escalon order by a.destino, a.logro, a.escalon
$$;
revoke all on function public.logro_contar() from public, anon, authenticated;
grant execute on function public.logro_contar() to service_role;

commit;
