-- 0031 · Eliminar un viaje desde el Perfil (Tanda 10F). La 0029 está guardada para la 9B.
--
-- QUÉ HACE ESTA MIGRACIÓN. Las fotos de un viaje NO cuelgan de la fila de `trips` (`trip_photos.trip_id` es el id de la RUTA, texto, sin clave ajena), así que al borrar un viaje no se borran solas ni sus filas ni sus
-- archivos de Storage. La app ya borra las fotos de QUIEN ELIMINA el viaje (archivos y filas) antes de borrarlo (src/lib/eliminarViajeNube.ts): para eso NO hace falta esta migración.
-- Lo que la app no puede hacer es borrar las fotos de OTRAS personas del mismo viaje (los invitados): solo su dueña puede tocar su carpeta de Storage. Con esta migración, al borrar un viaje:
--   1. un disparador apunta en `fotos_por_borrar` los archivos de las fotos de todas las personas de ese viaje y borra sus filas de `trip_photos` (y, en cascada, `trip_photo_meta`);
--   2. cada persona, al abrir la app, borra de Storage los archivos que le tocan y vacía sus anotaciones (`limpiarFotosPendientes`).
-- Así ninguna foto se queda en Storage sin viaje.
--
-- LO QUE NO CAMBIA (y se comprueba en scripts/destino/pruebaTanda10F.mjs): el Pase y los logros siguen. `passes.trip_id`, `achievements.trip_id`, `logro_hechos.trip_id` y `hoy_prueba.trip_id` son `on delete set null`
-- (0020, 0023, 0024, 0026): al borrar el viaje solo pierden la referencia. Se borran con el viaje, en cascada: trip_members, trip_invitations, trip_recommendations, stop_visits y logro_avisos.
--
-- Se aplica a mano en el panel de Supabase (SQL editor). Sin aplicar, la app funciona igual: solo quedan sin borrar las fotos AJENAS de un viaje compartido que borró su administrador.

create table if not exists public.fotos_por_borrar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (user_id, storage_path)
);
create index if not exists idx_fotos_por_borrar_user on public.fotos_por_borrar (user_id);
alter table public.fotos_por_borrar enable row level security;

-- Cada persona ve y vacía solo lo suyo. Apuntar lo hace el disparador (no la app).
drop policy if exists "fotos_por_borrar select own" on public.fotos_por_borrar;
create policy "fotos_por_borrar select own" on public.fotos_por_borrar for select to anon, authenticated using (user_id = auth.uid());
drop policy if exists "fotos_por_borrar delete own" on public.fotos_por_borrar;
create policy "fotos_por_borrar delete own" on public.fotos_por_borrar for delete to anon, authenticated using (user_id = auth.uid());

create or replace function public.al_borrar_viaje() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_ruta text := old.route ->> 'id';
begin
  if v_ruta is null then
    return old;
  end if;
  insert into public.fotos_por_borrar (user_id, storage_path)
    select p.user_id, p.storage_path from public.trip_photos p where p.trip_id = v_ruta
    on conflict (user_id, storage_path) do nothing;
  delete from public.trip_photos where trip_id = v_ruta;
  return old;
end $$;
revoke all on function public.al_borrar_viaje() from public, anon, authenticated;

drop trigger if exists trg_al_borrar_viaje on public.trips;
create trigger trg_al_borrar_viaje before delete on public.trips for each row execute function public.al_borrar_viaje();
