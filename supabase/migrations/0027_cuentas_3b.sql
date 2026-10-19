-- LAS CUENTAS, PARTE 3B (docs/dias/INFORME_CUENTAS_3B.md). Una sola migración, en una sola transacción.
--
-- SIN APLICAR EN PRODUCCIÓN. Va DESPUÉS de la 0026. Con esta migración aplicada o sin aplicar, la app con los interruptores apagados es la de hoy.
--
-- Qué hace, en palabras sencillas:
--   * Las fotos de perfil dejan de ser públicas. El almacén `perfiles` pasa a ser privado: la foto solo la ven la propia persona y la gente con la que comparte un viaje o un pase,
--     y la app las pide con enlaces que caducan (a la hora). Cada persona sigue escribiendo solo en su carpeta.
--   * Quien aún no ha puesto su nombre sale con la INICIAL DE SU EMAIL (solo la letra) en la gente del viaje y en los avisos, en lugar de «Viajero».

begin;

-- ── 1. Fotos de perfil privadas ──────────────────────────────────────────────────────────────────────────────────────────────────────

-- ¿Comparto un viaje o un pase con esa persona (o soy yo)? Recibe el texto de la carpeta del archivo; si no es un identificador, es que no.
create or replace function public.comparte_con(p_otro text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_otro uuid;
  v_yo uuid := auth.uid();
begin
  if v_yo is null then return false; end if;
  begin
    v_otro := p_otro::uuid;
  exception when others then
    return false;
  end;
  if v_otro = v_yo then return true; end if;
  return exists (select 1 from public.trips t join public.trip_members m on m.trip_id = t.id where (t.traveler_id = v_yo and m.user_id = v_otro) or (t.traveler_id = v_otro and m.user_id = v_yo))
    or exists (select 1 from public.trip_members a join public.trip_members b on a.trip_id = b.trip_id where a.user_id = v_yo and b.user_id = v_otro)
    or exists (select 1 from public.pass_members a join public.pass_members b on a.pass_id = b.pass_id where a.user_id = v_yo and b.user_id = v_otro);
end $$;
revoke all on function public.comparte_con(text) from public, anon;
grant execute on function public.comparte_con(text) to authenticated;

update storage.buckets set public = false where id = 'perfiles';
drop policy if exists "perfiles select shared" on storage.objects;
create policy "perfiles select shared" on storage.objects for select to authenticated
  using (bucket_id = 'perfiles' and public.comparte_con((storage.foldername(name))[1]));

-- ── 2. La inicial del email ──────────────────────────────────────────────────────────────────────────────────────────────────────────

-- Solo la LETRA (en mayúscula); nunca el email. null si la persona no tiene email guardado.
create or replace function public.inicial_de_email(p_uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select nullif(upper(left(trim(coalesce(email, '')), 1)), '') from public.travelers where id = p_uid
$$;
revoke all on function public.inicial_de_email(uuid) from public, anon, authenticated;

-- Quién está en un viaje: lo de siempre y, para quien no tiene nombre, la inicial de su email.
create or replace function public.gente_del_viaje(p_trip uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.es_dueno(p_trip) or public.es_miembro(p_trip) then (
    select coalesce(jsonb_agg(jsonb_build_object('id', x.uid, 'nombre', nullif(trim(split_part(coalesce(tr.nombre, ''), ' ', 1)), ''), 'inicial', public.inicial_de_email(x.uid), 'foto', tr.foto_path, 'es_admin', x.es_admin) order by x.orden, x.uid), '[]'::jsonb)
    from (
      select t.traveler_id as uid, true as es_admin, 0 as orden from public.trips t where t.id = p_trip
      union all
      select m.user_id, false, 1 from public.trip_members m where m.trip_id = p_trip
    ) x left join public.travelers tr on tr.id = x.uid
  ) else '[]'::jsonb end
$$;
revoke all on function public.gente_del_viaje(uuid) from public, anon;
grant execute on function public.gente_del_viaje(uuid) to authenticated;

-- Los avisos de la campanita: igual que en la 0026, con `inicial` en lo que cuenta quién lo hace.
create or replace function public.avisar_recomendacion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_nombre text;
  v_dia integer;
  v_dayid text := coalesce(new.payload ->> 'dayId', new.payload #>> '{day,id}');
begin
  select traveler_id into v_owner from public.trips where id = new.trip_id;
  if v_owner is null or v_owner = new.author_id then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.author_id;
  if v_dayid is not null then
    select (d ->> 'dayNumber')::integer into v_dia from public.trips t, jsonb_array_elements(coalesce(t.route -> 'days', '[]'::jsonb)) d where t.id = new.trip_id and d ->> 'id' = v_dayid limit 1;
  end if;
  insert into public.avisos (user_id, tipo, clave, payload)
  values (v_owner, 'recomendacion', 'rec:' || new.id, jsonb_build_object('trip_id', new.trip_id, 'rec_id', new.id, 'autor_id', new.author_id, 'autor', v_nombre, 'inicial', public.inicial_de_email(new.author_id), 'tipo_rec', new.tipo, 'dia', v_dia))
  on conflict do nothing;
  return new;
end $$;

create or replace function public.avisar_respuesta() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_nombre text;
  v_dia integer;
  v_dayid text := coalesce(new.payload ->> 'dayId', new.payload #>> '{day,id}');
begin
  if old.estado <> 'pendiente' or new.estado not in ('aceptada', 'rechazada') then return new; end if;
  select traveler_id into v_owner from public.trips where id = new.trip_id;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = coalesce(new.decidida_por, v_owner);
  if v_dayid is not null then
    select (d ->> 'dayNumber')::integer into v_dia from public.trips t, jsonb_array_elements(coalesce(t.route -> 'days', '[]'::jsonb)) d where t.id = new.trip_id and d ->> 'id' = v_dayid limit 1;
  end if;
  insert into public.avisos (user_id, tipo, clave, payload)
  values (new.author_id, new.estado, 'resp:' || new.id, jsonb_build_object('trip_id', new.trip_id, 'rec_id', new.id, 'admin_id', coalesce(new.decidida_por, v_owner), 'admin', v_nombre, 'inicial', public.inicial_de_email(coalesce(new.decidida_por, v_owner)), 'tipo_rec', new.tipo, 'dia', v_dia))
  on conflict do nothing;
  update public.avisos set leido_en = coalesce(leido_en, now()) where clave = 'rec:' || new.id;
  return new;
end $$;

create or replace function public.avisar_union() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_nombre text;
begin
  select traveler_id into v_owner from public.trips where id = new.trip_id;
  if v_owner is null or v_owner = new.user_id then return new; end if;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_nombre from public.travelers where id = new.user_id;
  insert into public.avisos (user_id, tipo, clave, payload)
  values (v_owner, 'unido', 'unido:' || new.trip_id || ':' || new.user_id, jsonb_build_object('trip_id', new.trip_id, 'persona_id', new.user_id, 'nombre', v_nombre, 'inicial', public.inicial_de_email(new.user_id)))
  on conflict do nothing;
  return new;
end $$;

commit;
