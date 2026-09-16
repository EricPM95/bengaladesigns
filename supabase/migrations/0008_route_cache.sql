-- Caché inteligente de rutas — SISTEMA DE CACHÉ CON COINCIDENCIA PARCIAL del feedback de calidad.
-- Clave de coincidencia: destino + días + experiencias + ritmo (los acompañantes NO forman parte de
-- la clave, ver computeRouteCacheMatch en server/index.js). Cada generación (completa, o reutilizada
-- con regeneración parcial) se guarda SIEMPRE como una fila NUEVA — nunca se sobreescribe una
-- existente, así el hit_count/last_used_at de la fila original reutilizada refleja de verdad cuántas
-- veces sirvió de base, y la nueva variante queda disponible para futuras coincidencias propias.
-- Mismo patrón de RLS que zona_restaurantes/tips_anclas: server/index.js se conecta con la clave
-- anónima (sin signInAnonymously), así que las políticas son para "anon", no solo "authenticated".
create table if not exists public.route_cache (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  days integer not null,
  -- ExperienceId[] del banco de 18 (+ 'free_tour') elegidos para esta ruta — ver types.ts.
  experiences text[] not null default '{}',
  pace text not null,
  -- GeneratedRouteResponse completo (mismo shape que alimenta mapGeneratedRouteToRoute) — ver
  -- routeGenerationOrchestrator.ts. Incluye days/stops/meals/not_included/excursions_available.
  route_data jsonb not null,
  hit_count integer not null default 1,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists idx_route_cache_dest on public.route_cache (destination);

alter table public.route_cache enable row level security;

create policy "route_cache select all" on public.route_cache
  for select to anon, authenticated using (true);

create policy "route_cache insert all" on public.route_cache
  for insert to anon, authenticated with check (true);

-- Solo para bumpear hit_count/last_used_at de la fila reutilizada como base — nunca para tocar
-- route_data de una fila existente (eso siempre crea una fila nueva en vez de actualizar esta).
create policy "route_cache update all" on public.route_cache
  for update to anon, authenticated using (true) with check (true);
