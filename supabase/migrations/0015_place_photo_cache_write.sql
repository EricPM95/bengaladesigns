-- 0015: permisos de escritura para la caché de fotos (complemento de 0014).
--
-- 0014 creó la tabla con RLS y solo política de LECTURA, dando por hecho que el servidor escribiría
-- con una service key que se salta RLS. No es el caso: `supabaseAdmin` en server/index.js se crea
-- con la clave ANON (el nombre engaña), así que sus escrituras pasan por RLS como las de cualquier
-- cliente — y fallaban con "new row violates row-level security policy".
--
-- Se abre igual que las demás tablas de caché del proyecto (ver 0009_place_content_cache.sql): aquí
-- solo hay URLs de fotos de lugares turísticos, nada de ningún usuario. El upsert del servidor
-- necesita INSERT y UPDATE.

create policy "place_photo_cache insert all" on public.place_photo_cache
  for insert to anon, authenticated with check (true);

create policy "place_photo_cache update all" on public.place_photo_cache
  for update to anon, authenticated using (true) with check (true);
