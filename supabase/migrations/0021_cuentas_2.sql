-- LAS CUENTAS, PARTE 2 (docs/dias/PLAN_CUENTAS.md e INFORME_CUENTAS_2.md). Va DESPUÉS de la 0020 (necesita sus tablas). Una sola transacción.
--
-- SIN APLICAR EN PRODUCCIÓN. Se aplica a mano en el SQL editor de Supabase, después de la 0020, y solo cuando se quiera probar las cuentas.
--
-- Qué hace, en palabras sencillas:
--   * Invitar: `trip_invitations` (una invitación = un enlace y un código corto que sirven para lo mismo) y cuatro funciones: crear, anular, ver y canjear.
--     Quien canjea entra en el viaje como invitado; si la invitación va con un Pase Dúo o de grupo, recibe su uso del pase. Deja de valer al anularla o
--     cuando ya no quedan usos. Solo se puede canjear con una cuenta de verdad (no con la sesión anónima).
--   * Recomendaciones: un estado nuevo, `ya_no_encaja` (la ruta del administrador cambió y la recomendación ya no se puede aplicar).
--   * Borrar la cuenta sin que pierdan nada los demás: `preparar_borrado()`, solo para el servidor, que se llama justo antes de borrar al usuario.
--       - Un viaje con invitados no se borra: pasa a administrarlo el invitado que entró primero (y se va su invitación). Sin invitados, se borra.
--       - Un pase que compró y que tiene otras personas se queda con ellas (pasa a ser de la primera que lo usó). Se va solo el uso de quien se borra.
--       - Sus Vistos, fotos y logros se borran siempre (siguen cayendo en cascada, como en la 0020).

begin;

-- ── Recomendaciones: un estado más ───────────────────────────────────────────────────────────────────────────────────────────────────

alter table public.trip_recommendations drop constraint if exists trip_recommendations_estado_check;
alter table public.trip_recommendations
  add constraint trip_recommendations_estado_check check (estado in ('pendiente', 'aceptada', 'rechazada', 'ya_no_encaja'));

-- ── Invitar ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

create table if not exists public.trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  creada_por uuid not null default auth.uid() references auth.users (id) on delete cascade,
  codigo text not null unique,
  -- Con un pase (Dúo o de grupo): los usos son los que le queden al pase. Sin pase: `usos_max` personas pueden entrar con esta invitación.
  pass_id uuid references public.passes (id) on delete set null,
  usos_max integer not null default 1 check (usos_max > 0),
  usos_usados integer not null default 0 check (usos_usados >= 0),
  anulada_en timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_trip_invitations_trip on public.trip_invitations (trip_id);
alter table public.trip_invitations enable row level security;
drop policy if exists "trip_invitations select dueno" on public.trip_invitations;
create policy "trip_invitations select dueno" on public.trip_invitations for select to authenticated using (public.es_dueno(trip_id));
-- Sin políticas de escritura: las invitaciones se crean, se anulan y se canjean con las funciones de abajo.

-- Crear: solo el administrador del viaje. Con `p_pass`, el pase tiene que ser suyo.
create or replace function public.crear_invitacion(p_trip uuid, p_pass uuid default null, p_usos integer default 1) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_codigo text;
  v_id uuid;
  v_pase public.passes%rowtype;
  v_usos integer := greatest(coalesce(p_usos, 1), 1);
  v_intento integer := 0;
begin
  if v_uid is null then raise exception 'Hace falta una sesión.'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) then raise exception 'Primero crea tu cuenta.'; end if;
  if not public.es_dueno(p_trip) then raise exception 'Solo el administrador del viaje puede invitar.'; end if;
  if v_usos > 50 then raise exception 'Demasiadas personas para una sola invitación.'; end if;
  if p_pass is not null then
    select * into v_pase from public.passes where id = p_pass;
    if not found or v_pase.comprador_id <> v_uid then raise exception 'Ese pase no es tuyo.'; end if;
    v_usos := greatest(v_pase.usos_max - v_pase.usos_usados, 1);
  end if;
  loop
    v_intento := v_intento + 1;
    -- Ocho caracteres sin 0, O, 1, I ni L (se dictan y se escriben a mano).
    v_codigo := upper(translate(substr(md5(random()::text || clock_timestamp()::text || v_uid::text), 1, 8), '0o1il', 'WXYZV'));
    begin
      insert into public.trip_invitations (trip_id, creada_por, codigo, pass_id, usos_max)
      values (p_trip, v_uid, v_codigo, p_pass, v_usos) returning id into v_id;
      exit;
    exception when unique_violation then
      if v_intento >= 8 then raise exception 'No se pudo crear la invitación; vuelve a probar.'; end if;
    end;
  end loop;
  return jsonb_build_object('id', v_id, 'codigo', v_codigo, 'trip_id', p_trip, 'pass_id', p_pass, 'usos_max', v_usos);
end $$;

create or replace function public.anular_invitacion(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_trip uuid;
begin
  select trip_id into v_trip from public.trip_invitations where id = p_id;
  if v_trip is null or not public.es_dueno(v_trip) then raise exception 'Solo el administrador puede anular una invitación.'; end if;
  update public.trip_invitations set anulada_en = coalesce(anulada_en, now()) where id = p_id;
end $$;

-- Ver (antes de entrar): para enseñar «Te han invitado a un viaje a Roma». Solo cuenta si vale y a qué destino; nada de personas. Vale también con la sesión anónima.
create or replace function public.ver_invitacion(p_codigo text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  inv public.trip_invitations%rowtype;
  v_pase public.passes%rowtype;
  v_destino text;
begin
  if auth.uid() is null then raise exception 'Hace falta una sesión.'; end if;
  select * into inv from public.trip_invitations where codigo = upper(trim(p_codigo));
  if not found then return jsonb_build_object('valida', false, 'motivo', 'no_existe'); end if;
  select route ->> 'destination' into v_destino from public.trips where id = inv.trip_id;
  if inv.anulada_en is not null then return jsonb_build_object('valida', false, 'motivo', 'anulada', 'destino', v_destino); end if;
  if inv.pass_id is not null then
    select * into v_pase from public.passes where id = inv.pass_id;
    if not found or v_pase.usos_usados >= v_pase.usos_max then return jsonb_build_object('valida', false, 'motivo', 'sin_usos', 'destino', v_destino); end if;
  elsif inv.usos_usados >= inv.usos_max then
    return jsonb_build_object('valida', false, 'motivo', 'sin_usos', 'destino', v_destino);
  end if;
  return jsonb_build_object('valida', true, 'destino', v_destino);
end $$;

-- Canjear: solo con una cuenta de verdad. Entra en el viaje como invitado y, si la invitación va con un pase, recibe su uso del pase.
create or replace function public.canjear_invitacion(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  inv public.trip_invitations%rowtype;
  v_pase public.passes%rowtype;
  v_filas integer;
begin
  if v_uid is null then raise exception 'Hace falta una sesión.'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) then raise exception 'Primero crea tu cuenta.'; end if;
  select * into inv from public.trip_invitations where codigo = upper(trim(p_codigo)) for update;
  if not found then raise exception 'Esa invitación no existe.'; end if;
  if inv.anulada_en is not null then raise exception 'Esa invitación se ha anulado.'; end if;
  -- Quien ya administra el viaje o ya está dentro no gasta ningún uso.
  if exists (select 1 from public.trips t where t.id = inv.trip_id and t.traveler_id = v_uid)
     or exists (select 1 from public.trip_members m where m.trip_id = inv.trip_id and m.user_id = v_uid) then
    return jsonb_build_object('trip_id', inv.trip_id, 'ya_estaba', true);
  end if;
  if inv.pass_id is not null then
    select * into v_pase from public.passes where id = inv.pass_id for update;
    if not found or v_pase.usos_usados >= v_pase.usos_max then raise exception 'Ya no quedan usos en esta invitación.'; end if;
    insert into public.pass_members (pass_id, user_id) values (inv.pass_id, v_uid) on conflict do nothing;
    get diagnostics v_filas = row_count;
    if v_filas > 0 then update public.passes set usos_usados = usos_usados + 1 where id = inv.pass_id; end if;
  elsif inv.usos_usados >= inv.usos_max then
    raise exception 'Ya no quedan usos en esta invitación.';
  end if;
  update public.trip_invitations set usos_usados = usos_usados + 1 where id = inv.id;
  insert into public.travelers (id, is_anonymous) values (v_uid, false) on conflict (id) do nothing;
  insert into public.trip_members (trip_id, user_id, invited_by) values (inv.trip_id, v_uid, inv.creada_por);
  return jsonb_build_object('trip_id', inv.trip_id, 'ya_estaba', false, 'con_pase', inv.pass_id is not null);
end $$;

revoke all on function public.crear_invitacion(uuid, uuid, integer) from public, anon;
revoke all on function public.anular_invitacion(uuid) from public, anon;
revoke all on function public.ver_invitacion(text) from public, anon;
revoke all on function public.canjear_invitacion(text) from public, anon;
grant execute on function public.crear_invitacion(uuid, uuid, integer) to authenticated;
grant execute on function public.anular_invitacion(uuid) to authenticated;
grant execute on function public.ver_invitacion(text) to authenticated;
grant execute on function public.canjear_invitacion(text) to authenticated;

-- ── Borrar la cuenta sin que pierdan nada los demás ──────────────────────────────────────────────────────────────────────────────────

-- Solo la llama el servidor (clave de servicio), justo ANTES de borrar al usuario. Después, el borrado del usuario se lleva en cascada lo que quede suyo.
create or replace function public.preparar_borrado(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_viaje record;
  v_pase record;
  v_nuevo uuid;
  v_era_miembro boolean;
  n_viajes integer := 0;
  n_pases integer := 0;
begin
  if p_uid is null then raise exception 'Falta la cuenta que se borra.'; end if;

  -- 1. Viajes compartidos: pasa a administrarlos el invitado que entró primero. Sin invitados, se borran con la cuenta.
  for v_viaje in select id from public.trips where traveler_id = p_uid loop
    select user_id into v_nuevo from public.trip_members where trip_id = v_viaje.id and user_id <> p_uid order by created_at, user_id limit 1;
    if v_nuevo is not null then
      insert into public.travelers (id, is_anonymous)
        select v_nuevo, coalesce((select u.is_anonymous from auth.users u where u.id = v_nuevo), false) on conflict (id) do nothing;
      update public.trips set traveler_id = v_nuevo where id = v_viaje.id;
      delete from public.trip_members where trip_id = v_viaje.id and user_id = v_nuevo;
      delete from public.trip_recommendations where trip_id = v_viaje.id and author_id = v_nuevo; -- (ahora es su viaje: sus recomendaciones ya no pintan nada)
      n_viajes := n_viajes + 1;
    end if;
  end loop;

  -- 2. Pases que compró: si hay otras personas, el pase se queda con ellas; se va solo su uso.
  for v_pase in select * from public.passes where comprador_id = p_uid loop
    select user_id into v_nuevo from public.pass_members where pass_id = v_pase.id and user_id <> p_uid order by unido_en, user_id limit 1;
    if v_nuevo is null and v_pase.para_id is not null and v_pase.para_id <> p_uid then v_nuevo := v_pase.para_id; end if;
    if v_nuevo is not null then
      v_era_miembro := exists (select 1 from public.pass_members where pass_id = v_pase.id and user_id = p_uid);
      update public.passes set
        comprador_id = v_nuevo,
        para_id = case when para_id = p_uid then null else para_id end,
        usos_max = greatest(usos_max - (case when v_era_miembro then 1 else 0 end), 1),
        usos_usados = least(greatest(usos_usados - (case when v_era_miembro then 1 else 0 end), 0), greatest(usos_max - (case when v_era_miembro then 1 else 0 end), 1))
      where id = v_pase.id;
      delete from public.pass_members where pass_id = v_pase.id and user_id = p_uid;
      n_pases := n_pases + 1;
    end if;
  end loop;

  -- 3. Pases de otra persona que usaba: se va su uso (el pase no recupera la plaza).
  for v_pase in select p.* from public.passes p join public.pass_members m on m.pass_id = p.id where m.user_id = p_uid and p.comprador_id <> p_uid loop
    update public.passes set usos_max = greatest(usos_max - 1, 1), usos_usados = least(greatest(usos_usados - 1, 0), greatest(usos_max - 1, 1)) where id = v_pase.id;
    delete from public.pass_members where pass_id = v_pase.id and user_id = p_uid;
  end loop;
  update public.passes set para_id = null where para_id = p_uid;

  return jsonb_build_object('viajes_traspasados', n_viajes, 'pases_conservados', n_pases);
end $$;
revoke all on function public.preparar_borrado(uuid) from public, anon, authenticated;
grant execute on function public.preparar_borrado(uuid) to service_role;

commit;
