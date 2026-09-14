-- Caché global de "Nuestra selección" de restaurantes por zona+franja horaria (acordeón dorado
-- "Hora de comer" en DIAS, ver server/index.js ZONA_RESTAURANTES_SYSTEM_PROMPT) — igual que
-- tips_anclas/transporte_cercano, es un hecho geográfico+temporal fijo (qué restaurantes recomendar
-- cerca de un barrio a la hora de comer/cenar), independiente del viajero, así que se genera UNA
-- sola vez por zona+franja y se reutiliza para cualquier ruta futura que pase por ahí. Políticas
-- para "anon" desde el arranque (no solo "authenticated") — server/index.js se conecta con la clave
-- anónima SIN signInAnonymously, ver el fix de 0005_tips_anclas_anon_access.sql para el porqué.
create table if not exists public.zona_restaurantes (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  zona text not null,
  franja text not null check (franja in ('comida', 'cena')),
  -- Cada elemento: {"nombre", "foto", "motivo", "presupuesto": "€"|"€€"|"€€€"} — 2-3 restaurantes
  -- curados con búsqueda web real (nunca relleno genérico), ver formato exacto en server/index.js.
  seleccion jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (destino, zona, franja)
);

alter table public.zona_restaurantes enable row level security;

create policy "zona_restaurantes select all" on public.zona_restaurantes
  for select to anon, authenticated using (true);

create policy "zona_restaurantes insert all" on public.zona_restaurantes
  for insert to anon, authenticated with check (true);
