-- LA CACHÉ DE LA API DE CONSULTA (parte 1, sandbox; server/civitatis/cache.js). Se guarda en Supabase un tiempo lo que da la API, como las fotos de Unsplash, para no pedirlo cada vez.
--
-- SIN APLICAR EN PRODUCCIÓN. Se aplica a mano en el SQL editor de Supabase, y solo cuando se vaya a encender la API. Sin la tabla, la caché sigue funcionando solo en memoria
-- (el servidor lo detecta y no insiste).
--
-- Nadie del móvil la lee ni la escribe: SIN políticas para anon ni authenticated; solo el servidor, con su clave de servicio (SUPABASE_SERVICE_ROLE_KEY).
-- Cuánto vive cada cosa NO está aquí: está en data/civitatis/ajustes.json (ttl_segundos), fácil de cambiar cuando Civitatis diga cuánto se puede guardar.
-- La tabla no guarda nada de las personas: son respuestas de catálogo, precios y calendario.

create table if not exists public.civitatis_cache (
  clave text primary key,
  valor jsonb not null,
  caduca_en timestamptz not null,
  creado_en timestamptz not null default now()
);

create index if not exists idx_civitatis_cache_caduca on public.civitatis_cache (caduca_en);

alter table public.civitatis_cache enable row level security;
