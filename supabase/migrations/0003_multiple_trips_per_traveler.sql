-- Permite varios viajes guardados por traveler — antes `trips.traveler_id` era UNIQUE (un solo
-- viaje activo por traveler, sobreescrito en cada guardado); ahora cada viaje nuevo es su propia
-- fila. El nombre del constraint es el autogenerado por Postgres para `unique` en la definición de
-- columna original (0001_travelers_and_trips.sql): "<tabla>_<columna>_key".
alter table public.trips drop constraint if exists trips_traveler_id_key;
