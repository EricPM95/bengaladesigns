-- Tanda V14 (2b): la última posición del globo de la tarjeta «Mi pasaporte» del Perfil. SIN APLICAR: la aplica Eric.
--
-- Sin esta migración la app funciona igual: el globo recuerda su posición en ESE móvil. Con ella, viaja con la cuenta y sale igual en otro móvil.
--
--   · travelers.globo_pasaporte  jsonb  {"lat": -90..90, "lng": -180..180}: el punto que queda en el centro del globo (lo que el viajero dejó delante con el dedo).
--
-- Es una columna de una tabla que ya existe (no una tabla nueva): «Empezar de cero» no necesita cambios.

alter table public.travelers add column if not exists globo_pasaporte jsonb;
