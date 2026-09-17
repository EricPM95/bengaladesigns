-- Añade la política de DELETE que faltaba en route_cache (0008_route_cache.sql solo daba
-- select/insert/update a "anon, authenticated") — sin esto, server/index.js (que se conecta con la
-- clave anon, sin signInAnonymously) no puede borrar filas de verdad; encontrado en vivo al intentar
-- limpiar la caché tras un bug de contenido obsoleto servido desde route_cache (ver el commit que
-- corrige la regresión de Roma 3 días). Mismo patrón que el resto de políticas de esta tabla.
create policy "route_cache delete all" on public.route_cache
  for delete to anon, authenticated using (true);
