-- 0083 · Juntar un viaje propio con el compartido al mismo destino (V17, 19-nov).
--
-- Quien se une al viaje de otra persona y ya tenía un viaje suyo al MISMO destino con días que se pisan puede «juntarlos»: lo suyo (fotos, hechos
-- de logros, logros) pasa al viaje compartido y su copia se quita. Dos funciones:
--   * `juntar_viaje_de(usuario, copia, compartido)`: hace el trabajo para esa persona (solo la usa el servidor y el SQL de arreglo de la 0084).
--     PARA SI HAY DUDA: si la copia tiene algo que no se sabe pasar sin riesgo (invitados, gastos, billetes personales…), o una foto cae en un día
--     que el compartido no tiene, o las fechas faltan, LANZA UN ERROR y no toca nada (todo va en una sola transacción).
--   * `juntar_mi_viaje(copia, compartido)`: la que llama la app con la sesión de la persona: comprueba que la copia es suya y que está invitada al
--     compartido, pasa lo suyo y borra SOLO su copia (nunca el compartido).
-- Los ARCHIVOS de las fotos duplicadas (la misma foto subida dos veces) no se pueden borrar desde SQL: quedan sin fila y los recoge la limpieza.

create or replace function public.juntar_viaje_de(p_user uuid, p_copia uuid, p_comp uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  s record;
  ruta_c text;
  ruta_s text;
  ini_c date;
  ini_s date;
  n_dias_s int;
  dudas text := '';
  n int;
  fotos_pasadas int := 0;
  fotos_repetidas int := 0;
  hechos_pasados int := 0;
  hechos_repetidos int := 0;
  logros_pasados int := 0;
begin
  select * into c from public.trips where id = p_copia and traveler_id = p_user;
  if not found then raise exception 'juntar: la copia % no es de esa persona', p_copia; end if;
  select * into s from public.trips where id = p_comp and traveler_id <> p_user;
  if not found then raise exception 'juntar: el viaje % no existe o es de la misma persona', p_comp; end if;
  if not exists (select 1 from public.trip_members m where m.trip_id = p_comp and m.user_id = p_user) then
    raise exception 'juntar: esa persona no está en el viaje compartido %', p_comp;
  end if;
  if lower(coalesce(c.route ->> 'destination', 'a')) <> lower(coalesce(s.route ->> 'destination', 'b')) then
    raise exception 'juntar: los destinos no son el mismo (% / %)', c.route ->> 'destination', s.route ->> 'destination';
  end if;

  ruta_c := c.route ->> 'id';
  ruta_s := s.route ->> 'id';
  ini_c := nullif(c.route #>> '{answers,dateRange,start}', '')::date;
  ini_s := nullif(s.route #>> '{answers,dateRange,start}', '')::date;
  n_dias_s := coalesce(jsonb_array_length(s.route -> 'days'), 0);

  -- Lo que la copia tiene y que NO se sabe pasar: es duda, se para.
  select count(*) into n from public.trip_members where trip_id = p_copia;
  if n > 0 then dudas := dudas || format(' trip_members=%s', n); end if;
  select count(*) into n from public.trip_gastos where trip_id = p_copia;
  if n > 0 then dudas := dudas || format(' trip_gastos=%s', n); end if;
  select count(*) into n from public.trip_pagos where trip_id = p_copia;
  if n > 0 then dudas := dudas || format(' trip_pagos=%s', n); end if;
  select count(*) into n from public.trip_recommendations where trip_id = p_copia;
  if n > 0 then dudas := dudas || format(' trip_recommendations=%s', n); end if;
  select count(*) into n from public.reservas_invitado where trip_id = p_copia;
  if n > 0 then dudas := dudas || format(' reservas_invitado=%s', n); end if;
  select count(*) into n from public.lo_suyo_del_viaje where trip_id = p_copia;
  if n > 0 then dudas := dudas || format(' lo_suyo_del_viaje=%s', n); end if;
  select count(*) into n from public.billetes_personales where trip_id = p_copia;
  if n > 0 then dudas := dudas || format(' billetes_personales=%s', n); end if;

  -- Las fotos: cada una pasa al MISMO día (por fecha) del compartido; si no hay fechas o no hay ese día, duda.
  if exists (select 1 from public.trip_photos where user_id = p_user and trip_id = ruta_c) then
    if ini_c is null or ini_s is null then
      dudas := dudas || ' fotos_sin_fechas';
    else
      select count(*) into n from public.trip_photos f
        where f.user_id = p_user and f.trip_id = ruta_c
          and not exists (
            select 1 from jsonb_array_elements(s.route -> 'days') d
            where (d ->> 'dayNumber')::int = (ini_c + (f.day_number - 1)) - ini_s + 1
          );
      if n > 0 then dudas := dudas || format(' fotos_en_dia_que_no_existe=%s', n); end if;
    end if;
  end if;

  if dudas <> '' then
    raise exception 'juntar: HAY DUDAS, no se toca nada:%', dudas;
  end if;

  -- 1. Fotos repetidas (la misma foto ya está en el compartido: mismo tamaño, mismas medidas y mismo día de fecha): se quita la fila de la copia.
  if ini_c is not null and ini_s is not null then
    with repetidas as (
      delete from public.trip_photos f
      where f.user_id = p_user and f.trip_id = ruta_c
        and exists (
          select 1 from public.trip_photos g
          where g.user_id = p_user and g.trip_id = ruta_s
            and g.bytes = f.bytes and g.width = f.width and g.height = f.height
            and (ini_s + (g.day_number - 1)) = (ini_c + (f.day_number - 1))
        )
      returning f.id
    )
    select count(*) into fotos_repetidas from repetidas;

    -- 2. Las demás pasan al compartido, con su día de allí.
    with pasadas as (
      update public.trip_photos f
      set trip_id = ruta_s,
          day_number = ((ini_c + (f.day_number - 1)) - ini_s + 1)::int,
          day_id = (
            select d ->> 'id' from jsonb_array_elements(s.route -> 'days') d
            where (d ->> 'dayNumber')::int = (ini_c + (f.day_number - 1)) - ini_s + 1
            limit 1
          )
      where f.user_id = p_user and f.trip_id = ruta_c
      returning f.id
    )
    select count(*) into fotos_pasadas from pasadas;
  end if;

  -- 3. Hechos de logros: un Visto activo repetido (misma parada en el compartido) se quita; el resto pasa.
  with repetidos as (
    delete from public.logro_hechos h
    where h.user_id = p_user and h.trip_id = p_copia and h.tipo = 'visto' and h.deshecho_en is null
      and exists (
        select 1 from public.logro_hechos o
        where o.user_id = p_user and o.trip_id = p_comp and o.tipo = 'visto' and o.deshecho_en is null
          and coalesce(o.stop_id, o.sitio) = coalesce(h.stop_id, h.sitio)
      )
    returning h.id
  )
  select count(*) into hechos_repetidos from repetidos;
  with pasados as (
    update public.logro_hechos set trip_id = p_comp where user_id = p_user and trip_id = p_copia returning id
  )
  select count(*) into hechos_pasados from pasados;

  -- 4. Logros ganados.
  with pasados as (
    update public.achievements set trip_id = p_comp where user_id = p_user and trip_id = p_copia returning id
  )
  select count(*) into logros_pasados from pasados;

  return jsonb_build_object('fotos_pasadas', fotos_pasadas, 'fotos_repetidas_quitadas', fotos_repetidas, 'hechos_pasados', hechos_pasados, 'hechos_repetidos_quitados', hechos_repetidos, 'logros_pasados', logros_pasados);
end;
$$;

revoke all on function public.juntar_viaje_de(uuid, uuid, uuid) from public, anon, authenticated;

-- La de la app: con la sesión de la persona.
create or replace function public.juntar_mi_viaje(p_copia uuid, p_comp uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  yo uuid := auth.uid();
  r jsonb;
begin
  if yo is null then raise exception 'juntar: sin sesión'; end if;
  r := public.juntar_viaje_de(yo, p_copia, p_comp);
  -- SOLO su copia (juntar_viaje_de ya comprobó que es suya y que el compartido es de otra persona).
  delete from public.trips where id = p_copia and traveler_id = yo;
  return r;
end;
$$;

revoke all on function public.juntar_mi_viaje(uuid, uuid) from public, anon;
grant execute on function public.juntar_mi_viaje(uuid, uuid) to authenticated;
