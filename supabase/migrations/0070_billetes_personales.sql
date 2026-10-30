-- 0070 · EL BILLETE DE CADA PERSONA, EN VARIOS MÓVILES SUYOS (Tanda 10S5). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0070.sql.
--
-- Qué hace, en palabras sencillas:
--   * Guarda, por viaje y por persona, su billete (tarjeta de embarque o billete de tren, autobús o barco): el código, el asiento, el localizador, la terminal y el coche de la ida y de la vuelta
--     (un JSON con la misma forma que guarda el móvil). Así lo ve también desde su otro móvil o su ordenador.
--   * Es PRIVADO: cada fila es de una persona (`user_id`) y solo ella la lee y la cambia. Ni el administrador del viaje ni otro viajero pueden verla (no hay ninguna regla para miembros del viaje).
--   * El PDF y la foto NO se guardan: solo el código (un dibujo pequeño) y los datos.
--
-- SI NO SE APLICA: todo funciona igual en cada móvil (el billete se guarda en el propio móvil y se ve sin internet); solo no viaja a otro dispositivo. La app lo ignora sin errores.

begin;

create table if not exists public.billetes_personales (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now(),
  primary key (trip_id, user_id)
);

alter table public.billetes_personales enable row level security;

drop policy if exists "billetes_personales propios select" on public.billetes_personales;
create policy "billetes_personales propios select" on public.billetes_personales
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "billetes_personales propios insert" on public.billetes_personales;
create policy "billetes_personales propios insert" on public.billetes_personales
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "billetes_personales propios update" on public.billetes_personales;
create policy "billetes_personales propios update" on public.billetes_personales
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "billetes_personales propios delete" on public.billetes_personales;
create policy "billetes_personales propios delete" on public.billetes_personales
  for delete to authenticated using (user_id = auth.uid());

commit;
