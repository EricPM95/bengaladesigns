-- 0045 · LA PROPUESTA TAMBIÉN LLEGA A LA CAMPANA DE QUIEN «PUEDE EDITAR» (Tanda 10N3, apartado 1). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (entera, se puede repetir). Va DESPUÉS de la 0039 (y de la 0043).
--
-- Qué hace, en palabras sencillas: hasta ahora «Ana te propone 5 cambios» solo llegaba al dueño del viaje. Quien tiene el permiso «Puede editar» también decide las propuestas (la 0036 ya se lo deja), así que
-- también le llega el aviso en su campanita. Cada uno recibe el suyo (la clave lleva su id). Cuando alguien decide, se dan por leídos los de todos.
-- SI NO SE APLICA: el dueño sigue recibiendo el aviso como siempre; quien puede editar solo ve la propuesta en la etiqueta dorada del día («1 recomendación»), no en la campana.

begin;

create or replace function public.avisar_recomendacion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_nombre text;
  v_dia integer;
  v_destino text;
  v_destinatario uuid;
  v_payload jsonb;
  v_n integer := case when new.payload ->> 'version' = '2' then jsonb_array_length(coalesce(new.payload -> 'cambios', '[]'::jsonb)) else null end;
  v_dayid text := coalesce(new.payload ->> 'dayId', new.payload #>> '{day,id}');
begin
  select traveler_id, route ->> 'destination' into v_owner, v_destino from public.trips where id = new.trip_id;
  if v_owner is null then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.author_id;
  if v_dayid is not null then
    select (d ->> 'dayNumber')::integer into v_dia from public.trips t, jsonb_array_elements(coalesce(t.route -> 'days', '[]'::jsonb)) d where t.id = new.trip_id and d ->> 'id' = v_dayid limit 1;
  end if;
  v_payload := jsonb_strip_nulls(jsonb_build_object('trip_id', new.trip_id, 'rec_id', new.id, 'autor_id', new.author_id, 'autor', v_nombre, 'tipo_rec', new.tipo, 'dia', v_dia, 'n_cambios', v_n, 'destino', v_destino));
  -- El dueño, con la clave de siempre.
  if v_owner <> new.author_id then
    insert into public.avisos (user_id, tipo, clave, payload) values (v_owner, 'recomendacion', 'rec:' || new.id, v_payload) on conflict do nothing;
  end if;
  -- Y quienes pueden editar (menos quien propone).
  for v_destinatario in select m.user_id from public.trip_members m where m.trip_id = new.trip_id and m.permiso = 'editar' and m.user_id <> new.author_id and m.user_id <> v_owner loop
    insert into public.avisos (user_id, tipo, clave, payload) values (v_destinatario, 'recomendacion', 'rec:' || new.id || ':' || v_destinatario, v_payload) on conflict do nothing;
  end loop;
  return new;
end $$;

-- Al contestar, se dan por leídos los avisos de la propuesta de todos los que la podían decidir (el del dueño y los de quienes pueden editar).
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
  update public.avisos set leido_en = coalesce(leido_en, now()) where clave = 'rec:' || new.id or clave like 'rec:' || new.id || ':%';
  return new;
end $$;

commit;
