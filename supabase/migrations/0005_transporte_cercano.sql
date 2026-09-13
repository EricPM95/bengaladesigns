-- Caché global de transporte público cercano a UN lugar concreto (StopDetailSheet.tsx, pestaña
-- "Resumen") — a diferencia de tips_anclas (solo anclas), esto se genera y cachea para CUALQUIER
-- parada de CUALQUIER ruta: es un hecho geográfico fijo, independiente del viajero o del arquetipo
-- del viaje, así que vale la pena cachearlo siempre. Ver server/index.js NEARBY_TRANSIT_SYSTEM_PROMPT
-- (con búsqueda web real, para no inventar líneas/paradas que no existen).
create table if not exists public.transporte_cercano (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  lugar text not null,
  -- Cada elemento: {"linea": "Línea B", "parada": "Colosseo"} — array porque puede haber más de una
  -- línea relevante; [] cuando no hay ninguna parada de ese tipo con fiabilidad suficiente cerca.
  metro jsonb not null default '[]'::jsonb,
  bus jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (destino, lugar)
);

alter table public.transporte_cercano enable row level security;

create policy "transporte_cercano select all" on public.transporte_cercano
  for select to authenticated using (true);

create policy "transporte_cercano insert all" on public.transporte_cercano
  for insert to authenticated with check (true);
