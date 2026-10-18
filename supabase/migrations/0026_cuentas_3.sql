-- LAS CUENTAS, PARTE 3 (docs/dias/PROMPT_CUENTAS_PARTE3.md e INFORME_CUENTAS_3.md). Va DESPUÉS de la 0025. Una sola transacción.
--
-- SIN APLICAR EN PRODUCCIÓN. Se aplica a mano en el SQL editor de Supabase, entera y en una sola ejecución, DESPUÉS de 0020 → 0021 → 0023 → 0024 → 0025, y solo cuando se
-- quiera probar las cuentas. El orden de todas las pendientes está en INFORME_CUENTAS_3.md.
--
-- Qué hace, en palabras sencillas (cada parte va marcada con el número del encargo):
--   1. Entrar: `ver_invitacion` cuenta ahora quién invita, las fechas y si va con pase, para la pantalla «Laura te invita a su Pase de Roma».
--   (las partes 2 a 7 van añadiendo sus trozos a este mismo archivo)

begin;

-- ── 1. Entrar: lo que se ve de una invitación antes de entrar ────────────────────────────────────────────────────────────────────────

-- Sigue sin enseñar personas ni datos del viaje salvo lo mínimo para la pantalla de «te invitan»: el nombre de pila de quien invita (si lo tiene puesto), el destino y las fechas.
create or replace function public.ver_invitacion(p_codigo text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  inv public.trip_invitations%rowtype;
  v_pase public.passes%rowtype;
  v_destino text;
  v_inicio text;
  v_fin text;
  v_quien text;
  v_extra jsonb;
begin
  if auth.uid() is null then raise exception 'Hace falta una sesión.'; end if;
  select * into inv from public.trip_invitations where codigo = upper(trim(p_codigo));
  if not found then return jsonb_build_object('valida', false, 'motivo', 'no_existe'); end if;
  select route ->> 'destination', route #>> '{answers,dateRange,start}', route #>> '{answers,dateRange,end}'
    into v_destino, v_inicio, v_fin from public.trips where id = inv.trip_id;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_quien from public.travelers where id = inv.creada_por;
  v_extra := jsonb_build_object('destino', v_destino, 'invitador', v_quien, 'inicio', v_inicio, 'fin', v_fin, 'con_pase', inv.pass_id is not null);
  if inv.anulada_en is not null then return jsonb_build_object('valida', false, 'motivo', 'anulada') || v_extra; end if;
  if inv.pass_id is not null then
    select * into v_pase from public.passes where id = inv.pass_id;
    if not found or v_pase.usos_usados >= v_pase.usos_max then return jsonb_build_object('valida', false, 'motivo', 'sin_usos') || v_extra; end if;
  elsif inv.usos_usados >= inv.usos_max then
    return jsonb_build_object('valida', false, 'motivo', 'sin_usos') || v_extra;
  end if;
  return jsonb_build_object('valida', true) || v_extra;
end $$;
revoke all on function public.ver_invitacion(text) from public, anon;
grant execute on function public.ver_invitacion(text) to authenticated;

-- ── 2. El Pase y el cobro ────────────────────────────────────────────────────────────────────────────────────────────────────────────

-- UN solo formato de código en toda la app: ocho caracteres sin 0, O, 1, I ni L (se dictan y se escriben a mano). Lo usan las invitaciones, los pases y el enlace personal.
create or replace function public.generar_codigo(p_semilla text default '') returns text
language sql volatile as $$
  select upper(translate(substr(md5(random()::text || clock_timestamp()::text || coalesce(p_semilla, '')), 1, 8), '0o1il', 'WXYZV'))
$$;

-- Un pase anulado (pago devuelto) ya no vale. Lo ganado con él NO se pierde nunca (los logros no dependen del pase una vez ganados).
alter table public.passes add column if not exists estado text not null default 'activo';
alter table public.passes drop constraint if exists passes_estado_check;
alter table public.passes add constraint passes_estado_check check (estado in ('activo', 'anulado'));
alter table public.passes add column if not exists anulado_en timestamptz;
-- El viaje para el que se compró (si el viaje se borra, el pase se queda: el pase es del destino, no del viaje).
alter table public.passes add column if not exists trip_id uuid references public.trips (id) on delete set null;

-- El REGISTRO DE LOS COBROS. No cuelga de ninguna cuenta (sin clave a `auth.users`): al borrar la cuenta se queda, porque Hacienda pide guardarlo. Guarda lo mínimo: la referencia
-- del cobro en el servicio de pago, qué se vendió, cuánto y cuándo. Quién pagó lo sabe el servicio de pago (su recibo lleva el email); aquí no se guarda ni el email ni el identificador de la persona.
create table if not exists public.pagos_registro (
  id uuid primary key default gen_random_uuid(),
  pago_ref text not null unique,
  -- La referencia del pago en el servicio (para encontrar la devolución, que llega por otro aviso).
  intencion_ref text unique,
  proveedor text not null check (proveedor in ('stripe', 'mentira')),
  destino text not null,
  plan text not null check (plan in ('uno', 'duo', 'grupo')),
  personas integer not null check (personas >= 1),
  importe_cent integer not null check (importe_cent >= 0),
  moneda text not null default 'eur',
  estado text not null default 'pagado' check (estado in ('pagado', 'devuelto')),
  recibo_url text,
  creado_en timestamptz not null default now(),
  devuelto_en timestamptz
);
alter table public.pagos_registro enable row level security;
-- Sin políticas: nadie lo lee ni lo escribe desde el móvil. Solo el servidor (clave de servicio).

-- Crea el pase cuando el servicio de pago confirma el cobro. Solo el servidor. Si el mismo aviso llega dos veces, un solo pase.
create or replace function public.registrar_pago(
  p_pago_ref text, p_intencion_ref text, p_proveedor text, p_comprador uuid, p_destino text, p_plan text, p_personas integer, p_importe_cent integer, p_moneda text, p_trip uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_filas integer;
  v_pase uuid;
  v_trip uuid := p_trip;
  v_intento integer := 0;
begin
  if coalesce(p_pago_ref, '') = '' then raise exception 'Falta la referencia del pago.'; end if;
  if p_plan not in ('uno', 'duo', 'grupo') or coalesce(p_personas, 0) < 1 then raise exception 'Ese pase no es válido.'; end if;
  insert into public.pagos_registro (pago_ref, intencion_ref, proveedor, destino, plan, personas, importe_cent, moneda)
  values (p_pago_ref, p_intencion_ref, p_proveedor, p_destino, p_plan, p_personas, p_importe_cent, lower(coalesce(p_moneda, 'eur')))
  on conflict (pago_ref) do nothing;
  get diagnostics v_filas = row_count;
  if v_filas = 0 then
    select id into v_pase from public.passes where pago_ref = p_pago_ref;
    return jsonb_build_object('pase_id', v_pase, 'repetido', true);
  end if;
  if not exists (select 1 from auth.users where id = p_comprador) then
    return jsonb_build_object('pase_id', null, 'repetido', false, 'sin_comprador', true);
  end if;
  if v_trip is not null and not exists (select 1 from public.trips where id = v_trip and traveler_id = p_comprador) then v_trip := null; end if;
  loop
    v_intento := v_intento + 1;
    begin
      insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo, pago_ref, trip_id)
      values (p_destino, p_comprador, p_plan, p_personas, 1, public.generar_codigo(p_comprador::text), p_pago_ref, v_trip)
      returning id into v_pase;
      exit;
    exception when unique_violation then
      if v_intento >= 8 then raise exception 'No se pudo crear el pase; vuelve a probar.'; end if;
    end;
  end loop;
  -- Quien compra ocupa la primera plaza: un Dúo deja una para su invitado; un grupo de 4, tres.
  insert into public.pass_members (pass_id, user_id) values (v_pase, p_comprador);
  return jsonb_build_object('pase_id', v_pase, 'repetido', false);
end $$;

-- Si se devuelve un pago, el pase se anula (y sus invitaciones dejan de valer). Lo ganado con él no se pierde. Se encuentra por la referencia del cobro o por la del pago.
create or replace function public.devolver_pago(p_ref text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_ref text;
  v_anulados integer := 0;
begin
  select pago_ref into v_ref from public.pagos_registro where pago_ref = p_ref or intencion_ref = p_ref;
  if v_ref is null then return jsonb_build_object('encontrado', false); end if;
  update public.pagos_registro set estado = 'devuelto', devuelto_en = coalesce(devuelto_en, now()) where pago_ref = v_ref and estado <> 'devuelto';
  update public.passes set estado = 'anulado', anulado_en = coalesce(anulado_en, now()) where pago_ref = v_ref and estado <> 'anulado';
  get diagnostics v_anulados = row_count;
  update public.trip_invitations set anulada_en = coalesce(anulada_en, now()) where pass_id in (select id from public.passes where pago_ref = v_ref);
  return jsonb_build_object('encontrado', true, 'pases_anulados', v_anulados);
end $$;

-- El recibo (se pide al servicio de pago la primera vez y se guarda).
create or replace function public.guardar_recibo(p_pago_ref text, p_url text) returns void
language sql security definer set search_path = public as $$
  update public.pagos_registro set recibo_url = p_url where pago_ref = p_pago_ref
$$;

-- La referencia del pago en el servicio de pago, para pedirle el recibo.
create or replace function public.intencion_de_pago(p_pago_ref text) returns text
language sql stable security definer set search_path = public as $$
  select intencion_ref from public.pagos_registro where pago_ref = p_pago_ref
$$;

-- Los pases de una persona, ya listos para «Mis pases»: tipo, destino, estado, fecha de compra, precio (solo si lo compró ella), viaje, con quién lo comparte y el código para invitar.
create or replace function public.pases_de(p_uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x ->> 'creado_en' desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', p.id,
      'destino', p.destino,
      'tipo', p.tipo,
      'estado', p.estado,
      'creado_en', p.created_at,
      'usos_max', p.usos_max,
      'usos_usados', p.usos_usados,
      'es_mio', p.comprador_id = p_uid,
      'pago_ref', case when p.comprador_id = p_uid then p.pago_ref end,
      'importe_cent', case when p.comprador_id = p_uid then pg.importe_cent end,
      'moneda', case when p.comprador_id = p_uid then pg.moneda end,
      'viaje', (select jsonb_build_object('id', t.id, 'destino', t.route ->> 'destination', 'inicio', t.route #>> '{answers,dateRange,start}', 'fin', t.route #>> '{answers,dateRange,end}') from public.trips t where t.id = p.trip_id),
      'miembros', (select coalesce(jsonb_agg(jsonb_build_object('nombre', nullif(trim(split_part(coalesce(tr.nombre, ''), ' ', 1)), ''), 'es_yo', m.user_id = p_uid, 'es_comprador', m.user_id = p.comprador_id) order by m.unido_en, m.user_id), '[]'::jsonb)
                   from public.pass_members m left join public.travelers tr on tr.id = m.user_id where m.pass_id = p.id),
      'invitacion', case when p.comprador_id = p_uid then (select jsonb_build_object('id', i.id, 'codigo', i.codigo, 'trip_id', i.trip_id) from public.trip_invitations i where i.pass_id = p.id and i.anulada_en is null order by i.created_at desc limit 1) end
    ) as x
    from public.passes p left join public.pagos_registro pg on pg.pago_ref = p.pago_ref
    where p.comprador_id = p_uid or p.para_id = p_uid or exists (select 1 from public.pass_members m where m.pass_id = p.id and m.user_id = p_uid)
  ) s
$$;

revoke all on function public.registrar_pago(text, text, text, uuid, text, text, integer, integer, text, uuid) from public, anon, authenticated;
revoke all on function public.devolver_pago(text) from public, anon, authenticated;
revoke all on function public.guardar_recibo(text, text) from public, anon, authenticated;
revoke all on function public.intencion_de_pago(text) from public, anon, authenticated;
revoke all on function public.pases_de(uuid) from public, anon, authenticated;
grant execute on function public.registrar_pago(text, text, text, uuid, text, text, integer, integer, text, uuid) to service_role;
grant execute on function public.devolver_pago(text) to service_role;
grant execute on function public.guardar_recibo(text, text) to service_role;
grant execute on function public.intencion_de_pago(text) to service_role;
grant execute on function public.pases_de(uuid) to service_role;

-- ── 3. Compartir el viaje y recomendar cambios ───────────────────────────────────────────────────────────────────────────────────────

-- La foto del perfil (parte 6): la ruta del archivo en el almacenamiento (se borra con la cuenta). Se crea aquí porque `gente_del_viaje` la lee.
alter table public.travelers add column if not exists foto_path text;

-- Quién está en un viaje: el administrador y sus invitados, con el nombre de pila y la foto (para «Viaje de Elena», «Laura te recomienda…», el «E» y el «L» de la campanita).
-- Solo lo ve quien está en ese viaje. No enseña el email ni nada más.
create or replace function public.gente_del_viaje(p_trip uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.es_dueno(p_trip) or public.es_miembro(p_trip) then (
    select coalesce(jsonb_agg(jsonb_build_object('id', x.uid, 'nombre', nullif(trim(split_part(coalesce(tr.nombre, ''), ' ', 1)), ''), 'foto', tr.foto_path, 'es_admin', x.es_admin) order by x.orden, x.uid), '[]'::jsonb)
    from (
      select t.traveler_id as uid, true as es_admin, 0 as orden from public.trips t where t.id = p_trip
      union all
      select m.user_id, false, 1 from public.trip_members m where m.trip_id = p_trip
    ) x left join public.travelers tr on tr.id = x.uid
  ) else '[]'::jsonb end
$$;
revoke all on function public.gente_del_viaje(uuid) from public, anon;
grant execute on function public.gente_del_viaje(uuid) to authenticated;

-- ── 4. La campanita de Avisos ────────────────────────────────────────────────────────────────────────────────────────────────────────

-- La hora del viajero (su zona horaria), para no mandarle un aviso de noche. La pone la app al entrar.
alter table public.travelers add column if not exists zona text;
create or replace function public.poner_zona(p_zona text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) then return; end if;
  if p_zona is null or length(p_zona) > 64 or p_zona !~ '^[A-Za-z0-9_+/-]+$' then return; end if;
  update public.travelers set zona = p_zona where id = auth.uid();
end $$;
revoke all on function public.poner_zona(text) from public, anon;
grant execute on function public.poner_zona(text) to authenticated;

-- Los avisos de cada persona, con leídos y sin leer. Se borran con la cuenta. `clave` evita repetir un aviso (cada aviso con fecha sale una sola vez).
create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('recomendacion', 'aceptada', 'rechazada', 'unido', 'd10', 'resumen', 'sorpresas')),
  payload jsonb not null default '{}'::jsonb,
  clave text not null,
  creado_en timestamptz not null default now(),
  leido_en timestamptz,
  -- Cuándo se mandó al móvil (null = todavía no).
  push_en timestamptz,
  unique (user_id, clave)
);
create index if not exists idx_avisos_user on public.avisos (user_id, creado_en desc);
create index if not exists idx_avisos_push on public.avisos (creado_en) where push_en is null;
alter table public.avisos enable row level security;
drop policy if exists "avisos select own" on public.avisos;
create policy "avisos select own" on public.avisos for select to authenticated using (user_id = auth.uid());
-- Sin políticas de escritura: los avisos los crean los disparadores de abajo y el servidor; se marcan como leídos por el servidor.

-- Quien recibe una recomendación: «Laura te recomienda un cambio en el día 2».
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
  values (v_owner, 'recomendacion', 'rec:' || new.id, jsonb_build_object('trip_id', new.trip_id, 'rec_id', new.id, 'autor_id', new.author_id, 'autor', v_nombre, 'tipo_rec', new.tipo, 'dia', v_dia))
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists avisar_recomendacion on public.trip_recommendations;
create trigger avisar_recomendacion after insert on public.trip_recommendations for each row execute function public.avisar_recomendacion();

-- Quien mandó la recomendación, cuando el administrador contesta: «Elena ha aceptado tu cambio» / «Elena ha preferido dejar el día 2 como estaba». El aviso del administrador queda leído.
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
  values (new.author_id, new.estado, 'resp:' || new.id, jsonb_build_object('trip_id', new.trip_id, 'rec_id', new.id, 'admin_id', coalesce(new.decidida_por, v_owner), 'admin', v_nombre, 'tipo_rec', new.tipo, 'dia', v_dia))
  on conflict do nothing;
  update public.avisos set leido_en = coalesce(leido_en, now()) where clave = 'rec:' || new.id;
  return new;
end $$;
drop trigger if exists avisar_respuesta on public.trip_recommendations;
create trigger avisar_respuesta after update of estado on public.trip_recommendations for each row execute function public.avisar_respuesta();

-- El administrador, cuando alguien entra en su viaje: «Laura se ha unido a tu viaje».
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
  values (v_owner, 'unido', 'unido:' || new.trip_id || ':' || new.user_id, jsonb_build_object('trip_id', new.trip_id, 'persona_id', new.user_id, 'nombre', v_nombre))
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists avisar_union on public.trip_members;
create trigger avisar_union after insert on public.trip_members for each row execute function public.avisar_union();

-- Funciones del servidor (clave de servicio): crear un aviso con fecha, leer los de una persona, marcarlos y preparar el envío al móvil.
create or replace function public.crear_aviso(p_uid uuid, p_tipo text, p_clave text, p_payload jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_filas integer;
begin
  insert into public.avisos (user_id, tipo, clave, payload) values (p_uid, p_tipo, p_clave, coalesce(p_payload, '{}'::jsonb)) on conflict (user_id, clave) do nothing;
  get diagnostics v_filas = row_count;
  return v_filas > 0;
end $$;

create or replace function public.avisos_de(p_uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x ->> 'creado_en' desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', a.id, 'tipo', a.tipo, 'payload', a.payload, 'creado_en', a.creado_en, 'leido', a.leido_en is not null,
      'estado_rec', case when a.tipo = 'recomendacion' then (select r.estado from public.trip_recommendations r where r.id = (a.payload ->> 'rec_id')::uuid) end
    ) as x
    from public.avisos a where a.user_id = p_uid order by a.creado_en desc limit 60
  ) s
$$;

create or replace function public.marcar_avisos_leidos(p_uid uuid, p_ids uuid[]) returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  update public.avisos set leido_en = now() where user_id = p_uid and leido_en is null and (p_ids is null or id = any(p_ids));
  get diagnostics v = row_count;
  return v;
end $$;

-- Los viajes propios de una persona, para los avisos con fecha («En 10 días empieza tu viaje a Roma»).
create or replace function public.viajes_para_avisos(p_uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'destino', t.route ->> 'destination', 'inicio', t.route #>> '{answers,dateRange,start}', 'fin', t.route #>> '{answers,dateRange,end}', 'guardado', t.guardado_en is not null, 'zona', (select tr.zona from public.travelers tr where tr.id = p_uid))), '[]'::jsonb)
  from public.trips t where t.traveler_id = p_uid and t.generation_state is null
$$;

-- Los avisos del resumen del viaje y de «te quedan N días» (cola de los logros, 0023) que ya les toca y todavía no están en la campanita.
create or replace function public.logro_avisos_vencidos(p_uid uuid, p_ahora timestamptz) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', la.id, 'tipo', la.tipo, 'trip_id', la.trip_id, 'enviar_en', la.enviar_en, 'payload', la.payload)), '[]'::jsonb)
  from public.logro_avisos la where la.user_id = p_uid and la.enviado_en is null and la.enviar_en <= p_ahora
$$;
create or replace function public.logro_aviso_en_campanita(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.logro_avisos set enviado_en = coalesce(enviado_en, now()) where id = p_id
$$;

-- Los avisos que faltan por mandar al móvil, con las suscripciones de cada persona y su zona horaria.
create or replace function public.avisos_para_push(p_limite integer default 200) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'user_id', a.user_id, 'tipo', a.tipo, 'payload', a.payload, 'creado_en', a.creado_en, 'zona', tr.zona,
    'subs', (select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'claves', s.claves)) from public.push_suscripciones s where s.user_id = a.user_id)
  )), '[]'::jsonb)
  from (select * from public.avisos where push_en is null and leido_en is null and creado_en > now() - interval '3 days' order by creado_en limit p_limite) a
  join public.travelers tr on tr.id = a.user_id
  where exists (select 1 from public.push_suscripciones s where s.user_id = a.user_id)
$$;
create or replace function public.marcar_push(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.avisos set push_en = coalesce(push_en, now()) where id = p_id
$$;
create or replace function public.borrar_suscripcion(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from public.push_suscripciones where endpoint = p_endpoint
$$;

-- Las personas a las que mirar en la tarea programada: con un viaje que empieza pronto o acaba de acabar, con avisos de logros vencidos o con avisos sin mandar.
create or replace function public.usuarios_para_avisos(p_desde date, p_hasta date) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(distinct u), '[]'::jsonb) from (
    select t.traveler_id as u from public.trips t where t.generation_state is null and (t.route #>> '{answers,dateRange,start}') ~ '^\d{4}-\d{2}-\d{2}$'
      and (t.route #>> '{answers,dateRange,start}')::date between p_desde and p_hasta
    union
    select la.user_id from public.logro_avisos la where la.enviado_en is null and la.enviar_en <= now()
    union
    select a.user_id from public.avisos a where a.push_en is null and a.leido_en is null and a.creado_en > now() - interval '3 days'
  ) q
$$;

revoke all on function public.crear_aviso(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.avisos_de(uuid) from public, anon, authenticated;
revoke all on function public.marcar_avisos_leidos(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.viajes_para_avisos(uuid) from public, anon, authenticated;
revoke all on function public.logro_avisos_vencidos(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.logro_aviso_en_campanita(uuid) from public, anon, authenticated;
revoke all on function public.avisos_para_push(integer) from public, anon, authenticated;
revoke all on function public.marcar_push(uuid) from public, anon, authenticated;
revoke all on function public.borrar_suscripcion(text) from public, anon, authenticated;
revoke all on function public.usuarios_para_avisos(date, date) from public, anon, authenticated;
grant execute on function public.crear_aviso(uuid, text, text, jsonb) to service_role;
grant execute on function public.avisos_de(uuid) to service_role;
grant execute on function public.marcar_avisos_leidos(uuid, uuid[]) to service_role;
grant execute on function public.viajes_para_avisos(uuid) to service_role;
grant execute on function public.logro_avisos_vencidos(uuid, timestamptz) to service_role;
grant execute on function public.logro_aviso_en_campanita(uuid) to service_role;
grant execute on function public.avisos_para_push(integer) to service_role;
grant execute on function public.marcar_push(uuid) to service_role;
grant execute on function public.borrar_suscripcion(text) to service_role;
grant execute on function public.usuarios_para_avisos(date, date) to service_role;

-- ── 6. La foto y el nombre del perfil ────────────────────────────────────────────────────────────────────────────────────────────────

-- La foto del perfil: pequeña (unos pocos KB, sin datos escondidos: la app la vuelve a dibujar), en su propia carpeta pública `perfiles/<tu id>/…`. Se ve en el Perfil, en «Hola, …», en el pie de
-- Compartir y en lo que ven los demás del viaje (el «E» y el «L»). Se borra con la cuenta (el servidor vacía la carpeta antes de borrar al usuario). El nombre va en `travelers.nombre`.
insert into storage.buckets (id, name, public) values ('perfiles', 'perfiles', true)
on conflict (id) do update set public = true;
drop policy if exists "perfiles insert own" on storage.objects;
create policy "perfiles insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'perfiles' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "perfiles update own" on storage.objects;
create policy "perfiles update own" on storage.objects for update to authenticated
  using (bucket_id = 'perfiles' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'perfiles' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "perfiles delete own" on storage.objects;
create policy "perfiles delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'perfiles' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── 7. Invitar a un amigo (la EXP de la 8C1) ─────────────────────────────────────────────────────────────────────────────────────────────

-- Cada persona tiene un enlace personal para invitar a la app (sin viaje): un código, el de siempre (8 caracteres sin 0, O, 1, I ni L).
create table if not exists public.invitaciones_app (
  user_id uuid primary key references auth.users (id) on delete cascade,
  codigo text not null unique,
  creado_en timestamptz not null default now()
);
alter table public.invitaciones_app enable row level security;
drop policy if exists "invitaciones_app select own" on public.invitaciones_app;
create policy "invitaciones_app select own" on public.invitaciones_app for select to authenticated using (user_id = auth.uid());

create or replace function public.mi_codigo_app() returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_codigo text;
  v_intento integer := 0;
begin
  if v_uid is null then raise exception 'Hace falta una sesión.'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) then raise exception 'Primero crea tu cuenta.'; end if;
  select codigo into v_codigo from public.invitaciones_app where user_id = v_uid;
  if v_codigo is not null then return v_codigo; end if;
  loop
    v_intento := v_intento + 1;
    begin
      insert into public.invitaciones_app (user_id, codigo) values (v_uid, public.generar_codigo(v_uid::text)) returning codigo into v_codigo;
      return v_codigo;
    exception when unique_violation then
      select codigo into v_codigo from public.invitaciones_app where user_id = v_uid;
      if v_codigo is not null then return v_codigo; end if;
      if v_intento >= 8 then raise exception 'No se pudo crear tu enlace; vuelve a probar.'; end if;
    end;
  end loop;
end $$;
revoke all on function public.mi_codigo_app() from public, anon;
grant execute on function public.mi_codigo_app() to authenticated;

-- Apunta quién invitó a quién. Solo lo llama el servidor. CUENTA como invitación entrar por un enlace o un código de viaje, de pase o personal SI con eso se crea una cuenta NUEVA (una cuenta que
-- ya existía no cuenta: se mira que su fecha de alta sea de hoy). Cada persona tiene un solo invitador: el primero. Lo demás (100 EXP cuando el amigo acaba su primer viaje, máximo 10 al año) ya está.
create or replace function public.registrar_referido(p_codigo text, p_invitado uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
  v_alta timestamptz;
  v_invitador uuid;
  v_filas integer;
begin
  select alta_cuenta into v_alta from public.travelers where id = p_invitado;
  if v_alta is null or v_alta < now() - interval '24 hours' then return jsonb_build_object('registrado', false, 'motivo', 'cuenta_antigua'); end if;
  select user_id into v_invitador from public.invitaciones_app where codigo = v_codigo;
  if v_invitador is null then select creada_por into v_invitador from public.trip_invitations where codigo = v_codigo; end if;
  if v_invitador is null then select comprador_id into v_invitador from public.passes where codigo = v_codigo; end if;
  if v_invitador is null then return jsonb_build_object('registrado', false, 'motivo', 'no_existe'); end if;
  if v_invitador = p_invitado then return jsonb_build_object('registrado', false, 'motivo', 'uno_mismo'); end if;
  insert into public.logro_referidos (invitador_id, invitado_id) values (v_invitador, p_invitado) on conflict (invitado_id) do nothing;
  get diagnostics v_filas = row_count;
  return jsonb_build_object('registrado', v_filas > 0, 'motivo', case when v_filas > 0 then 'ok' else 'ya_tenia_invitador' end);
end $$;
revoke all on function public.registrar_referido(text, uuid) from public, anon, authenticated;
grant execute on function public.registrar_referido(text, uuid) to service_role;

commit;
