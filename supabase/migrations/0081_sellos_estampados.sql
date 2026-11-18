-- Tanda V15 (1): los sellos del pasaporte ya estampados, guardados en la cuenta. SIN APLICAR: la aplica Eric.
--
-- Sin esta migración la app funciona igual: «ya estampado» se queda en ESE móvil. Con ella, viaja con la cuenta: en otro móvil o tras reinstalar sale [Ver mi sello] en vez de [Estampar mi sello].
--
--   · travelers.sellos_estampados  jsonb  {"<id del viaje>": {"fecha": "2026-11-08", "en": "2026-11-18T21:00:00Z"}}: qué sellos se estamparon (con la fecha del sello, el primer día del viaje, y cuándo).
--
-- Es una columna de una tabla que ya existe (no una tabla nueva): `empezar_de_cero` no necesita cambios (los sellos viven en `travelers`, que ese borrado no toca).

alter table public.travelers add column if not exists sellos_estampados jsonb;
