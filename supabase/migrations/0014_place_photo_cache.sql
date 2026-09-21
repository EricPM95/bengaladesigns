-- 0014: caché de fotos de lugar (Prompt 5).
--
-- La foto de cada lugar se resolvía EN EL CLIENTE contra Wikipedia, y la caché vivía en memoria:
-- se perdía al recargar y cada viajero volvía a pedirla. Ahora la resuelve el servidor (que es
-- quien tiene la clave de Unsplash, ver /api/place-photo) y se guarda aquí, así que cada foto se
-- busca UNA vez para todos los usuarios.
--
-- `photo_source` distingue de dónde salió, y también marca los intentos fallidos: una fila con
-- source 'none' significa "ya lo intentamos y no hay foto", para no repetir la búsqueda en cada
-- render. `unsplash_*` solo se rellenan cuando la fuente es Unsplash — sus fotos exigen atribución
-- visible con el nombre del fotógrafo (ver PARTE 7 del prompt), las de Wikipedia no.

create table if not exists public.place_photo_cache (
  id uuid primary key default gen_random_uuid(),
  place_name text not null,
  city text not null,
  -- 'unsplash' | 'wikipedia' | 'none'
  photo_source text not null,
  -- Wikipedia: una sola URL. Unsplash: los tres tamaños (lista / tarjeta / ficha).
  photo_url text,
  unsplash_thumb text,
  unsplash_small text,
  unsplash_regular text,
  unsplash_blur_hash text,
  unsplash_photographer text,
  unsplash_photographer_url text,
  unsplash_url text,
  created_at timestamptz not null default now(),
  unique (place_name, city)
);

create index if not exists idx_place_photo_cache_lookup on public.place_photo_cache (city, place_name);

alter table public.place_photo_cache enable row level security;

-- Lectura abierta: son fotos de lugares turísticos, no hay nada de nadie aquí. La escritura la hace
-- el servidor con la service key, que se salta RLS — el cliente nunca escribe en esta tabla.
create policy "place_photo_cache select all" on public.place_photo_cache
  for select using (true);
