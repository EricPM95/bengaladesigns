-- 0038 · LAS ENTRADAS DE CADA PERSONA EN UN VIAJE COMPARTIDO (Tanda 10N §8). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
--
-- Qué hace, en palabras sencillas:
--   * Las entradas que compra el DUEÑO (con «¿Para quién es?») ya se guardan dentro del propio viaje (el JSON de `trips`, con el campo `paraQuien` de cada reserva): ahí no hace falta tocar nada,
--     y los miembros del viaje ya pueden leerlo (la regla de `trips` deja leer a `es_miembro`).
--   * Lo que compra un INVITADO es suyo: no puede ir dentro del viaje del dueño (el invitado no escribe en él, y no debe salir en el RESERVAS del dueño). Esta tabla guarda, por viaje y por persona,
--     la lista de sus entradas (JSON, la misma forma que `Reservation`). Solo la ve y la cambia ella.
--
-- SI NO SE APLICA: todo funciona igual en ese móvil (las entradas del invitado se guardan en el propio móvil, `localStorage`), pero no viajan a otro dispositivo suyo.

begin;

create table if not exists public.reservas_invitado (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reservas jsonb not null default '[]'::jsonb,
  actualizado_en timestamptz not null default now(),
  primary key (trip_id, user_id)
);

alter table public.reservas_invitado enable row level security;

drop policy if exists "reservas_invitado propias select" on public.reservas_invitado;
create policy "reservas_invitado propias select" on public.reservas_invitado
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "reservas_invitado propias insert" on public.reservas_invitado;
create policy "reservas_invitado propias insert" on public.reservas_invitado
  for insert to authenticated with check (user_id = auth.uid() and (public.es_miembro(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.traveler_id = auth.uid())));

drop policy if exists "reservas_invitado propias update" on public.reservas_invitado;
create policy "reservas_invitado propias update" on public.reservas_invitado
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reservas_invitado propias delete" on public.reservas_invitado;
create policy "reservas_invitado propias delete" on public.reservas_invitado
  for delete to authenticated using (user_id = auth.uid());

commit;
