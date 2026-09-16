-- Caché de contenido rico por lugar (ficha completa: resumen/tips/horario) — ver AddStopScreen.tsx
-- y DESCRIBE_POI_CONTENT_SYSTEM_PROMPT en server/index.js. A diferencia de tips_anclas/
-- zona_restaurantes (ligados a viaje/franja), esto cachea por lugar+destino de forma permanente:
-- cuanto más popular el destino, más rápido se cubre su catálogo turístico y menos coste por
-- viajero nuevo (efecto progresivo, ver PENDING-final-prompt.md). Mismo patrón de RLS que el resto
-- de cachés globales: server/index.js se conecta con la clave anónima, así que "anon" también.
create table if not exists public.place_content_cache (
  id uuid primary key default gen_random_uuid(),
  place_name text not null,
  destination text not null,
  mapbox_id text,
  -- { summary, tips: string[], hours_detail, hours_short, category, visit_duration_min, is_free_access, official_url }
  content jsonb not null,
  hit_count integer not null default 1,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  unique (place_name, destination)
);

create index if not exists idx_place_cache_dest on public.place_content_cache (destination);
create index if not exists idx_place_cache_name on public.place_content_cache (place_name);

alter table public.place_content_cache enable row level security;

create policy "place_content_cache select all" on public.place_content_cache
  for select to anon, authenticated using (true);

create policy "place_content_cache insert all" on public.place_content_cache
  for insert to anon, authenticated with check (true);

-- Solo para bumpear hit_count/last_used_at en un cache hit — el contenido en sí nunca se sobreescribe
-- (unique(place_name, destination) ya impide duplicados; un conflicto de insert se resuelve como
-- upsert desde el servidor, no reescribiendo el contenido generado antes).
create policy "place_content_cache update all" on public.place_content_cache
  for update to anon, authenticated using (true) with check (true);
