-- 0039 · LA PROPUESTA DE CAMBIOS SUELTOS (Tanda 10N, apartado 6). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (entera, se puede repetir). Va DESPUÉS de la 0036 (que deja decidir a quien puede editar).
--
-- Qué hace, en palabras sencillas: una propuesta de Ana (varios cambios) viaja como UNA sola fila de `trip_recommendations` (payload.version = 2, payload.cambios = [...]). El administrador (o quien puede editar)
-- decide cada cambio por separado, así que hace falta guardar qué se decidió de cada uno:
--   * `decisiones` (jsonb): { id del cambio: 'aceptado' | 'rechazado' }. Cuando están todos decididos, la fila pasa a aceptada (si se aceptó alguno) o rechazada.
--   * El aviso al administrador lleva cuántos cambios son y el destino: «Ana te propone 5 cambios en tu viaje a Roma».
--   * El aviso a quien propuso lleva cuántos se aceptaron: «Eric ha aceptado 3 de tus 5 cambios».
-- NO toca la lista de tipos de aviso (la dejó la 0035).
-- SI NO SE APLICA: la propuesta se manda y se decide igual en la app, pero lo decidido no se guarda cambio a cambio (solo el estado final) y los avisos dicen «te recomienda otra ruta» / «ha aceptado tu ruta».

begin;

alter table public.trip_recommendations add column if not exists decisiones jsonb not null default '{}'::jsonb;

-- Solo se puede decidir (estado y decisiones): lo que se recomendó no se reescribe.
create or replace function public.trip_recommendations_solo_estado() returns trigger
language plpgsql as $$
begin
  if new.trip_id is distinct from old.trip_id or new.author_id is distinct from old.author_id
     or new.tipo is distinct from old.tipo or new.payload is distinct from old.payload or new.created_at is distinct from old.created_at then
    raise exception 'Una recomendación solo puede aceptarse o rechazarse; no se puede cambiar lo que recomienda.';
  end if;
  if new.estado is distinct from old.estado then
    new.decidida_en := now();
    new.decidida_por := auth.uid();
  end if;
  return new;
end $$;

create or replace function public.avisar_recomendacion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_nombre text;
  v_dia integer;
  v_destino text;
  v_n integer := case when new.payload ->> 'version' = '2' then jsonb_array_length(coalesce(new.payload -> 'cambios', '[]'::jsonb)) else null end;
  v_dayid text := coalesce(new.payload ->> 'dayId', new.payload #>> '{day,id}');
begin
  select traveler_id, route ->> 'destination' into v_owner, v_destino from public.trips where id = new.trip_id;
  if v_owner is null or v_owner = new.author_id then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.author_id;
  if v_dayid is not null then
    select (d ->> 'dayNumber')::integer into v_dia from public.trips t, jsonb_array_elements(coalesce(t.route -> 'days', '[]'::jsonb)) d where t.id = new.trip_id and d ->> 'id' = v_dayid limit 1;
  end if;
  insert into public.avisos (user_id, tipo, clave, payload)
  values (v_owner, 'recomendacion', 'rec:' || new.id, jsonb_strip_nulls(jsonb_build_object('trip_id', new.trip_id, 'rec_id', new.id, 'autor_id', new.author_id, 'autor', v_nombre, 'tipo_rec', new.tipo, 'dia', v_dia, 'n_cambios', v_n, 'destino', v_destino)))
  on conflict do nothing;
  return new;
end $$;

-- Al contestar: a quien propuso le llega «Eric ha aceptado 3 de tus 5 cambios» (o la respuesta de siempre si no es una propuesta de cambios sueltos).
create or replace function public.avisar_respuesta() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_nombre text;
  v_dia integer;
  v_total integer := case when new.payload ->> 'version' = '2' then jsonb_array_length(coalesce(new.payload -> 'cambios', '[]'::jsonb)) else null end;
  v_ok integer := (select count(*) from jsonb_each_text(coalesce(new.decisiones, '{}'::jsonb)) where value = 'aceptado');
  v_dayid text := coalesce(new.payload ->> 'dayId', new.payload #>> '{day,id}');
begin
  if old.estado <> 'pendiente' or new.estado not in ('aceptada', 'rechazada') then return new; end if;
  select traveler_id into v_owner from public.trips where id = new.trip_id;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = coalesce(new.decidida_por, v_owner);
  if v_dayid is not null then
    select (d ->> 'dayNumber')::integer into v_dia from public.trips t, jsonb_array_elements(coalesce(t.route -> 'days', '[]'::jsonb)) d where t.id = new.trip_id and d ->> 'id' = v_dayid limit 1;
  end if;
  insert into public.avisos (user_id, tipo, clave, payload)
  values (new.author_id, case when v_total is not null and v_ok > 0 then 'aceptada' else new.estado end, 'resp:' || new.id,
          jsonb_strip_nulls(jsonb_build_object('trip_id', new.trip_id, 'rec_id', new.id, 'admin_id', coalesce(new.decidida_por, v_owner), 'admin', v_nombre, 'tipo_rec', new.tipo, 'dia', v_dia, 'n_total', v_total, 'n_aceptados', case when v_total is not null then v_ok end)))
  on conflict do nothing;
  update public.avisos set leido_en = coalesce(leido_en, now()) where clave = 'rec:' || new.id;
  return new;
end $$;

commit;
