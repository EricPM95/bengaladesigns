-- Las fotos del viaje: las que el viajero hace o sube durante el viaje (ver src/lib/fotosViaje.ts).
--
-- Dos piezas, las dos PRIVADAS y las dos solo del viajero que las subió:
--   * un bucket de Storage `fotos-viaje` (privado: no hay URL pública, la app pide URLs firmadas de
--     corta duración al listar), con los objetos en `{uid}/{tripId}/{uuid}.jpg`;
--   * la tabla `trip_photos`, una fila por foto, con a qué día (y parada, si la tiene) pertenece.
--
-- Igual que place_likes (0012): `user_id` sale de auth.uid() — los viajeros son anónimos de Supabase
-- (signInAnonymously, ver tripPersistence.ts) — y las policies solo dejan ver, crear y borrar lo propio.
-- La ubicación de la foto sale de la parada, nunca de la foto: el cliente re-codifica el JPEG y le
-- quita todos los metadatos antes de subirlo, así que aquí no se guarda ni EXIF ni GPS.
--
-- Se aplica a mano en el panel de Supabase (SQL editor). Sin aplicar, la app sigue funcionando: la
-- parte de fotos degrada en silencio (listar devuelve vacío y subir da un aviso, sin romper la pantalla).

insert into storage.buckets (id, name, public)
values ('fotos-viaje', 'fotos-viaje', false)
on conflict (id) do nothing;

create table if not exists public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  trip_id text not null,
  day_id text not null,
  day_number int not null,
  stop_name text null,
  storage_path text not null,
  width int not null,
  height int not null,
  bytes int not null,
  created_at timestamptz not null default now()
);

-- Lo único que se pide es "las fotos de ESTE viaje de ESTE viajero".
create index if not exists idx_trip_photos_trip on public.trip_photos (user_id, trip_id, day_number);

alter table public.trip_photos enable row level security;

create policy "trip_photos select own" on public.trip_photos
  for select to anon, authenticated using (auth.uid() = user_id);

create policy "trip_photos insert own" on public.trip_photos
  for insert to anon, authenticated with check (auth.uid() = user_id);

create policy "trip_photos delete own" on public.trip_photos
  for delete to anon, authenticated using (auth.uid() = user_id);

-- Storage: cada viajero solo toca su carpeta `{uid}/…` del bucket.
create policy "fotos_viaje select own" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'fotos-viaje' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos_viaje insert own" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'fotos-viaje' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos_viaje delete own" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'fotos-viaje' and (storage.foldername(name))[1] = auth.uid()::text);
