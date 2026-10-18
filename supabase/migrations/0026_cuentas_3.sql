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

commit;
