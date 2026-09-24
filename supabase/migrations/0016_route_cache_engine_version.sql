-- Versión del motor en cada ruta cacheada (decisión del 2026-09-24).
-- El servidor guarda en `engine_version` la versión del motor que hizo la ruta (modelo + prompts de
-- generación, ver routeCacheVersion en server/index.js) y solo sirve filas de SU versión: al cambiar
-- el motor, las filas viejas dejan de usarse solas, sin borrar nada a mano.
-- Los destinos curados (Roma) ya no se cachean: el motor v3 es gratis y siempre más nuevo.
alter table public.route_cache add column if not exists engine_version text;

create index if not exists idx_route_cache_dest_version on public.route_cache (destination, engine_version);

-- Limpieza: todas las filas anteriores no tienen versión (y hoy son todas de Roma, un destino curado
-- que ya no usa la caché). Nunca se volverían a servir; se borran para no dejar peso muerto.
delete from public.route_cache where engine_version is null;
