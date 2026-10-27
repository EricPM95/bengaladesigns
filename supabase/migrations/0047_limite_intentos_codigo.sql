-- 0047 · EL LÍMITE DE INTENTOS DEL CÓDIGO DE INVITACIÓN (Tanda 10N5, apartado 3). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (entera y en una sola ejecución).
-- Va DESPUÉS de la 0046. No toca nada de lo que ya hay guardado: añade una tabla pequeña y vuelve a escribir `ver_invitacion` y `canjear_invitacion` (con el cuerpo de la 0036) para que cuenten los fallos.
--
-- Qué hace, en palabras sencillas:
--   1. Quien escribe un código que NO es de ningún viaje queda apuntado (un renglón en `intentos_codigo`, con su hora). A los 6 fallos seguidos en 15 minutos, la base de datos le dice
--      «Demasiados intentos. Espera unos minutos y vuelve a probar.» y no le deja probar más hasta que pasen esos 15 minutos desde el primero de los seis. Así nadie puede ir probando códigos sin fin.
--   2. Un código bueno borra los fallos de esa persona.
--   3. Los renglones de más de un día se borran solos cada vez que alguien falla.
--   4. `canjear_invitacion` ya no hace `raise` cuando el código no existe (el `raise` desharía el apunte del fallo): devuelve `{ "error": "no_existe" }` y la app lo cuenta como siempre.
--      Cuando está bloqueado sí hace `raise` con el texto de arriba (no hay nada que guardar). `ver_invitacion` devuelve `{ "valida": false, "motivo": "bloqueado" }`.
--
-- SI NO SE APLICA: la app sigue funcionando; el límite de intentos solo lo pone el móvil (6 fallos, 15 minutos), que se salta borrando los datos del navegador.

begin;

create table if not exists public.intentos_codigo (
  id bigserial primary key,
  user_id uuid not null,
  creado timestamptz not null default now()
);
create index if not exists intentos_codigo_user_idx on public.intentos_codigo (user_id, creado desc);
alter table public.intentos_codigo enable row level security;
-- (Sin políticas: solo las funciones de abajo, que son `security definer`, la tocan.)
revoke all on public.intentos_codigo from public, anon, authenticated;

-- ¿Lleva esta persona 6 fallos o más en los últimos 15 minutos?
create or replace function public.codigo_bloqueado() returns boolean
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.intentos_codigo where user_id = auth.uid() and creado > now() - interval '15 minutes') >= 6
$$;
revoke all on function public.codigo_bloqueado() from public, anon;
grant execute on function public.codigo_bloqueado() to authenticated;

-- Apunta un fallo (y limpia lo de hace más de un día).
create or replace function public.apuntar_fallo_de_codigo() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.intentos_codigo where creado < now() - interval '1 day';
  insert into public.intentos_codigo (user_id) values (auth.uid());
end $$;
revoke all on function public.apuntar_fallo_de_codigo() from public, anon, authenticated;

-- Ver la invitación: ahora NO es `stable` (apunta los fallos).
create or replace function public.ver_invitacion(p_codigo text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  inv public.trip_invitations%rowtype;
  v_pase public.passes%rowtype;
  v_destino text;
  v_inicio text;
  v_fin text;
  v_quien text;
  v_extra jsonb;
  v_dentro boolean;
begin
  if auth.uid() is null then raise exception 'Hace falta una sesión.'; end if;
  if public.codigo_bloqueado() then return jsonb_build_object('valida', false, 'motivo', 'bloqueado'); end if;
  select * into inv from public.trip_invitations where codigo = upper(trim(p_codigo));
  if not found then
    perform public.apuntar_fallo_de_codigo();
    return jsonb_build_object('valida', false, 'motivo', 'no_existe');
  end if;
  select route ->> 'destination', route #>> '{answers,dateRange,start}', route #>> '{answers,dateRange,end}'
    into v_destino, v_inicio, v_fin from public.trips where id = inv.trip_id;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_quien from public.travelers where id = inv.creada_por;
  v_dentro := exists (select 1 from public.trips t where t.id = inv.trip_id and t.traveler_id = auth.uid())
           or exists (select 1 from public.trip_members m where m.trip_id = inv.trip_id and m.user_id = auth.uid());
  v_extra := jsonb_build_object('destino', v_destino, 'invitador', v_quien, 'inicio', v_inicio, 'fin', v_fin, 'con_pase', inv.pass_id is not null, 'ya_dentro', v_dentro, 'trip_id', case when v_dentro then inv.trip_id end);
  if v_dentro then return jsonb_build_object('valida', true) || v_extra; end if;
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

-- Canjear: igual que en la 0036, con el límite de intentos. El código que no existe devuelve `{ error: 'no_existe' }` (sin `raise`, para que el fallo quede apuntado).
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
  if public.codigo_bloqueado() then raise exception 'Demasiados intentos. Espera unos minutos y vuelve a probar.'; end if;
  select * into inv from public.trip_invitations where codigo = upper(trim(p_codigo)) for update;
  if not found then
    perform public.apuntar_fallo_de_codigo();
    return jsonb_build_object('error', 'no_existe');
  end if;
  if exists (select 1 from public.trips t where t.id = inv.trip_id and t.traveler_id = v_uid)
     or exists (select 1 from public.trip_members m where m.trip_id = inv.trip_id and m.user_id = v_uid) then
    return jsonb_build_object('trip_id', inv.trip_id, 'ya_estaba', true);
  end if;
  if inv.anulada_en is not null then raise exception 'Esa invitación se ha anulado.'; end if;
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
  -- Todos entran con «Solo recomendar»; el administrador sube a quien quiera.
  insert into public.trip_members (trip_id, user_id, invited_by, permiso, pass_id) values (inv.trip_id, v_uid, inv.creada_por, 'recomendar', inv.pass_id);
  delete from public.intentos_codigo where user_id = v_uid;
  return jsonb_build_object('trip_id', inv.trip_id, 'ya_estaba', false, 'con_pase', inv.pass_id is not null);
end $$;
revoke all on function public.canjear_invitacion(text) from public, anon;
grant execute on function public.canjear_invitacion(text) to authenticated;

commit;
