-- Tanda 10N7 (2b-5): la moneda de cada viajero, una sola para toda la app. Por defecto null = euros.
-- Idempotente. Cada persona solo toca su fila (la política de `travelers` que ya hay).
alter table public.travelers add column if not exists moneda text;
alter table public.travelers drop constraint if exists travelers_moneda_formato;
alter table public.travelers add constraint travelers_moneda_formato check (moneda is null or moneda ~ '^[A-Z]{3}$');
