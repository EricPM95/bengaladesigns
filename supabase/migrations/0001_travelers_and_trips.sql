-- Persistencia de viajes — travelers (identidad, anónima o real) + trips (el viaje activo de cada
-- traveler). Pensado para sesiones anónimas de Supabase Auth (auth.signInAnonymously()): el mismo
-- auth.uid() se conserva al "convertir" la sesión anónima en una cuenta real más adelante, así que
-- no hace falta ninguna migración de datos cuando eso pase.
--
-- Requisito previo (no se puede activar por SQL): en el dashboard de Supabase, Authentication →
-- Sign In / Providers → habilitar "Allow anonymous sign-ins".

create table if not exists public.travelers (
  id uuid primary key references auth.users (id) on delete cascade,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.travelers enable row level security;

create policy "travelers select own" on public.travelers
  for select using (auth.uid() = id);

create policy "travelers insert own" on public.travelers
  for insert with check (auth.uid() = id);

create policy "travelers update own" on public.travelers
  for update using (auth.uid() = id);

-- Un viaje activo por traveler (unique en traveler_id) — si más adelante se admite historial de
-- varios viajes, basta con quitar el unique y guardar/leer por id de viaje en vez de por traveler.
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null unique references public.travelers (id) on delete cascade,
  route jsonb not null,
  bookings jsonb not null default '{}'::jsonb,
  wishlist jsonb not null default '[]'::jsonb,
  ui_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "trips select own" on public.trips
  for select using (auth.uid() = traveler_id);

create policy "trips insert own" on public.trips
  for insert with check (auth.uid() = traveler_id);

create policy "trips update own" on public.trips
  for update using (auth.uid() = traveler_id);

create policy "trips delete own" on public.trips
  for delete using (auth.uid() = traveler_id);
