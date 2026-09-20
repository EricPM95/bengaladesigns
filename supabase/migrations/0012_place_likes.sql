-- "Me gusta" por lugar — alimenta la ordenación de la pestaña "Recomendados" de la pantalla de
-- explorar/añadir parada (ver placeLikesApi.ts y PlaceExplorerScreen.tsx).
--
-- A diferencia del resto de tablas de este proyecto, que son cachés globales escritas por el
-- servidor con la clave anónima, esta guarda una acción PERSONAL de cada viajero. Por eso:
--
--   * `user_id` sale de auth.uid() y NO se acepta del cliente — un usuario solo puede crear o
--     borrar sus propios likes (ver las policies de abajo). Los viajeros son anónimos de Supabase
--     (signInAnonymously, ver tripPersistence.ts), así que cada dispositivo tiene su propio uid
--     estable sin necesidad de registro.
--   * `unique (place_name, destination, user_id)` impone "1 like por usuario y lugar" en la base de
--     datos, no solo en la interfaz: dos pulsaciones rápidas no pueden dejar dos filas.
--
-- El contador de cada lugar se obtiene contando filas por (destination, place_name) — no se guarda
-- un total denormalizado, que habría que mantener sincronizado a mano y podría desviarse.
create table if not exists public.place_likes (
  id uuid primary key default gen_random_uuid(),
  place_name text not null,
  destination text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (place_name, destination, user_id)
);

-- El caso de uso real es "dame los likes de TODOS los lugares de este destino", así que el índice
-- va por destino; el unique de arriba ya cubre las búsquedas por lugar concreto.
create index if not exists idx_place_likes_destination on public.place_likes (destination);

alter table public.place_likes enable row level security;

-- Los totales son públicos: cualquiera ve cuántos likes tiene un lugar (es lo que ordena la lista).
create policy "place_likes select all" on public.place_likes
  for select to anon, authenticated using (true);

-- Escribir, solo lo propio. `with check` impide insertar un like a nombre de otro usuario.
create policy "place_likes insert own" on public.place_likes
  for insert to anon, authenticated with check (auth.uid() = user_id);

create policy "place_likes delete own" on public.place_likes
  for delete to anon, authenticated using (auth.uid() = user_id);
