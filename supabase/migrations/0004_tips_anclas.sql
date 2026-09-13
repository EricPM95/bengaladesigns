-- Caché global de tips para ANCLAS (Paso 1 del pipeline de generación, /api/generate-anchors) —
-- ver server/index.js (ANCHOR_TIPS_SYSTEM_PROMPT). Cada fila es un tip (práctico o secreto) para un
-- lugar de un destino, generado UNA sola vez por lugar (con búsqueda web real) y reutilizado para
-- todos los viajeros que después generen una ruta que incluya esa misma ancla — a diferencia de
-- tabla trips/travelers, esto NO es per-usuario: no lleva traveler_id ni RLS por auth.uid(), es un
-- catálogo compartido de contenido editorial, sin datos personales.
create table if not exists public.tips_anclas (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  lugar text not null,
  tipo text not null check (tipo in ('practico', 'secreto')),
  texto text not null,
  created_at timestamptz not null default now(),
  unique (destino, lugar, tipo)
);

alter table public.tips_anclas enable row level security;

-- Cualquier sesión de Supabase (incluida anónima, ver 0001_travelers_and_trips.sql) puede leer el
-- caché y añadir tips nuevos — nunca actualizar ni borrar los ya existentes, así un viajero no puede
-- pisar un tip ya verificado de otro. server/index.js es el único que escribe en la práctica (el
-- cliente nunca llama a Supabase directamente para esta tabla), pero la policy vive a nivel de fila
-- por si esto cambia más adelante.
create policy "tips_anclas select all" on public.tips_anclas
  for select to authenticated using (true);

create policy "tips_anclas insert all" on public.tips_anclas
  for insert to authenticated with check (true);

-- Datos semilla ya verificados (fuentes reales, no mock) — punto de partida antes de que el
-- sistema empiece a generar y cachear dinámicamente el resto de anclas la primera vez que alguien
-- crea una ruta a cada destino.
insert into public.tips_anclas (destino, lugar, tipo, texto) values
  ('Roma', 'Coliseo Romano', 'practico', 'La Línea C del metro, parada Colosseo, sale justo enfrente del monumento — es el punto clásico para la foto de postal nada más salir de la boca de metro.'),
  ('Roma', 'Coliseo Romano', 'secreto', 'Se puede acceder al recinto arqueológico por el acceso de la Vía del Foro Romano en vez de la entrada principal del Coliseo — suele tener bastante menos cola en las horas punta.'),
  ('Paris', 'Torre Eiffel', 'practico', 'Reserva restaurante en la Torre Eiffel (ej. Madame Brasserie, 1ª planta) y accedes por ascensor prioritario sin colas, aunque no tengas entrada normal.'),
  ('Paris', 'Torre Eiffel', 'secreto', 'El Pont de Bir-Hakeim, a poca distancia, tiene una vista simétrica de la torre con el metro pasando por encima entre columnas metálicas — de los ángulos favoritos de los fotógrafos locales, y casi vacío frente al Trocadéro.'),
  ('Barcelona', 'Sagrada Familia', 'practico', 'Reserva con antelación por la web oficial — es la única forma fiable de evitar la cola, que en temporada alta puede superar la hora y media.'),
  ('Barcelona', 'Sagrada Familia', 'secreto', 'La Torre de la Natividad mira al este, con vistas a las montañas; la Torre de la Pasión mira al oeste, con vistas al mar — si el objetivo es la foto con el Mediterráneo de fondo, hay que elegir la torre correcta al reservar, no cualquiera.'),
  ('Atenas', 'Acrópolis', 'practico', 'Reserva la franja horaria más tardía del día en la web oficial (hhticket.gr) — coincide con la hora dorada y hay bastante menos gente que a primera hora.'),
  ('Atenas', 'Acrópolis', 'secreto', 'La Colina de Filopapo, justo al suroeste de la Acrópolis, ofrece la vista frontal del Partenón sin pagar entrada ni hacer cola — es gratis, siempre abierta, y es donde van los atenienses a ver el atardecer.')
on conflict (destino, lugar, tipo) do nothing;
