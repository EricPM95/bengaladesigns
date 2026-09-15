-- Caché global de "nombre de zona reconocible por un turista" (acordeón dorado "Hora de comer" en
-- DIAS, ver server/index.js ZONA_TURISTICA_SYSTEM_PROMPT) — la geocodificación inversa de Mapbox
-- (reverseGeocodeZone, mapboxReverseGeocode.ts) devuelve el barrio/rione ADMINISTRATIVO exacto de
-- unas coordenadas (ej. en Roma: "Sant'Eustachio", "Ponte", "Pigna" — nombres que solo conocen los
-- locales), no necesariamente algo que un turista reconozca. Igual que zona_restaurantes/tips_anclas,
-- es un hecho geográfico fijo (destino + zona en bruto → nombre turístico, o ninguno si no aplica),
-- así que se resuelve UNA sola vez por destino+zona_bruta y se reutiliza para cualquier ruta futura
-- que pase por ahí. Políticas para "anon" desde el arranque, mismo motivo que 0005_tips_anclas_anon_access.sql.
create table if not exists public.zona_turistica (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  zona_bruta text not null,
  -- null cuando Claude decide que ningún nombre turístico reconocible aplica a esta zona en bruto —
  -- el acordeón cae a "Hora de comer"/"Hora de cenar" sin zona en ese caso (BLOQUE C).
  zona_turistica text,
  created_at timestamptz not null default now(),
  unique (destino, zona_bruta)
);

alter table public.zona_turistica enable row level security;

create policy "zona_turistica select all" on public.zona_turistica
  for select to anon, authenticated using (true);

create policy "zona_turistica insert all" on public.zona_turistica
  for insert to anon, authenticated with check (true);
