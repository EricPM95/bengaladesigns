-- 0048 · LOS AVISOS ELIMINADOS SE BORRAN DE VERDAD (Tanda 10N5, §6e). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Va DESPUÉS de la 0046.
--
-- Qué hace, en palabras sencillas:
--   * Un aviso que la persona elimina (0046: `oculto_en`) se borra del todo a los 30 días. Los avisos de más de un año (leídos o no, eliminados o no) se borran también.
--   * Para que un aviso borrado NO VUELVA A SALIR, antes de borrarlo se guarda su «clave» (no el contenido) en `avisos_borrados`. Un disparador sobre `avisos` rechaza cualquier aviso nuevo con una clave ya
--     borrada: así «Mañana empieza tu viaje» de un viaje que ya pasó no se puede volver a crear (la clave ya no está en `avisos`, pero sí en la lista de borrados). Las claves apuntadas se olvidan a los 2 años.
--   * `purgar_avisos()` la llama el servidor UNA VEZ AL DÍA dentro de la tarea programada que ya existe (`/api/cron/avisos`, Vercel, 9:00). No hace falta activar `pg_cron`.
--
-- SI NO SE APLICA: todo funciona igual; lo eliminado se queda guardado (oculto) para siempre, como hasta ahora.

begin;

create table if not exists public.avisos_borrados (
  user_id uuid not null,
  clave text not null,
  borrado_en timestamptz not null default now(),
  primary key (user_id, clave)
);
alter table public.avisos_borrados enable row level security;
-- Sin políticas: nadie lo lee ni lo escribe desde el móvil. Solo el servidor (clave de servicio) y los disparadores.

-- Un aviso con una clave ya borrada no se vuelve a crear (`crear_aviso` y los disparadores usan `on conflict do nothing`: el disparador devuelve null y la fila no entra).
create or replace function public.avisos_no_repetir_borrados() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.avisos_borrados b where b.user_id = new.user_id and b.clave = new.clave) then
    return null;
  end if;
  return new;
end $$;
drop trigger if exists avisos_no_repetir_borrados on public.avisos;
create trigger avisos_no_repetir_borrados before insert on public.avisos for each row execute function public.avisos_no_repetir_borrados();

-- La limpieza diaria. `p_ahora` solo existe para poder probarla con otra fecha. Devuelve cuántos avisos ha borrado.
create or replace function public.purgar_avisos(p_ahora timestamptz default now()) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_borrados integer;
  v_claves integer;
begin
  -- 1. Apunta las claves de lo que se va a borrar (antes de borrarlo).
  insert into public.avisos_borrados (user_id, clave, borrado_en)
  select a.user_id, a.clave, p_ahora from public.avisos a
   where (a.oculto_en is not null and a.oculto_en < p_ahora - interval '30 days') or a.creado_en < p_ahora - interval '1 year'
  on conflict (user_id, clave) do nothing;
  -- 2. Borra los eliminados hace más de 30 días y los de más de un año.
  delete from public.avisos a
   where (a.oculto_en is not null and a.oculto_en < p_ahora - interval '30 days') or a.creado_en < p_ahora - interval '1 year';
  get diagnostics v_borrados = row_count;
  -- 3. Las claves apuntadas hace más de 2 años se olvidan (ningún aviso con fecha se prepara con tanto retraso).
  delete from public.avisos_borrados where borrado_en < p_ahora - interval '2 years';
  get diagnostics v_claves = row_count;
  return jsonb_build_object('borrados', v_borrados, 'claves_olvidadas', v_claves);
end $$;

revoke all on function public.purgar_avisos(timestamptz) from public, anon, authenticated;
grant execute on function public.purgar_avisos(timestamptz) to service_role;
revoke all on function public.avisos_no_repetir_borrados() from public, anon, authenticated;

commit;
