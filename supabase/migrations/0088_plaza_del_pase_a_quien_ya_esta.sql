-- 0088 · LA PLAZA DEL PASE DÚO PARA QUIEN YA ESTÁ EN EL VIAJE (V27, fallo de Alicia, 19-nov). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (entera y en una sola ejecución). Va DESPUÉS de la 0087.
--
-- Qué pasaba, en palabras sencillas:
--   Eric compró el Pase Dúo y le dieron un código para la plaza de Alicia. Alicia YA estaba en el viaje (por el código del viaje compartido). `canjear_invitacion` (0047) mira primero «¿ya estás en el viaje?» y, si sí,
--   devolvía `ya_estaba` y se iba SIN meterla en el pase, aunque la invitación llevara el pase: «Lo de ayer también cuenta», pero seguía con los candados y la plaza de Eric se quedaba en «Plaza libre».
--
-- Qué hace esta migración:
--   1. `canjear_invitacion` (parte de la de la 0047, que es la última; la única diferencia es el bloque «ya estás en el viaje»): si ya estás en el viaje y la invitación lleva un pase con plaza libre, te mete en el pase
--      (`pass_members`, `usos_usados` + 1, `trip_members.pass_id`). Si ya estás en el pase, o eres quien lo compró, no hace nada. Devuelve `plaza_dada` = true cuando te la ha dado.
--   2. `plazas_sin_dar(p_pase)`: las personas del viaje del pase que aún no tienen plaza (solo la ve quien compró el pase).
--   3. `dar_plaza_del_pase(p_pase, p_user)`: quien compró el pase da una plaza libre a alguien que YA está en el viaje, sin código, de un toque.
--   4. Cuando alguien entra en un pase, se avisa al viaje (`trip_cambios`, 0087): así a su móvil le llega «ya tienes el pase» sin cerrar la app.
--
-- SI NO SE APLICA: todo sigue como antes (el código del pase no sirve a quien ya está en el viaje; «Dar la plaza a…» da un aviso de que hace falta actualizar).

begin;

-- ── 1. canjear_invitacion: igual que la 0047, salvo el bloque «ya estabas en el viaje» ──────────────────────────────────────────────────────────────

create or replace function public.canjear_invitacion(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  inv public.trip_invitations%rowtype;
  v_pase public.passes%rowtype;
  v_filas integer;
  v_plaza boolean := false;
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
    -- (0088) Ya estás en el viaje: si la invitación lleva un pase con plaza libre, la plaza es tuya (antes se perdía aquí).
    if inv.pass_id is not null and inv.anulada_en is null then
      select * into v_pase from public.passes where id = inv.pass_id for update;
      if found and v_pase.estado = 'activo' and v_pase.comprador_id <> v_uid
         and not exists (select 1 from public.pass_members pm where pm.pass_id = inv.pass_id and pm.user_id = v_uid)
         and v_pase.usos_usados < v_pase.usos_max then
        insert into public.pass_members (pass_id, user_id) values (inv.pass_id, v_uid) on conflict do nothing;
        get diagnostics v_filas = row_count;
        if v_filas > 0 then
          update public.passes set usos_usados = usos_usados + 1 where id = inv.pass_id;
          update public.trip_members set pass_id = inv.pass_id where trip_id = inv.trip_id and user_id = v_uid and pass_id is null;
          v_plaza := true;
        end if;
      end if;
    end if;
    return jsonb_build_object('trip_id', inv.trip_id, 'ya_estaba', true, 'plaza_dada', v_plaza, 'con_pase', inv.pass_id is not null);
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

-- ── 2. Quién del viaje aún no tiene plaza (solo lo ve quien compró el pase) ────────────────────────────────────────────────────────────────────────────

create or replace function public.plazas_sin_dar(p_pase uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', m.user_id, 'nombre', nullif(trim(split_part(coalesce(tr.nombre, ''), ' ', 1)), '')) order by m.user_id), '[]'::jsonb)
  from public.passes p
  join public.trip_members m on m.trip_id = p.trip_id
  left join public.travelers tr on tr.id = m.user_id
  where p.id = p_pase and p.comprador_id = auth.uid() and p.estado = 'activo' and p.tipo <> 'uno' and p.usos_usados < p.usos_max
    and m.user_id <> p.comprador_id
    and not exists (select 1 from public.pass_members pm where pm.pass_id = p.id and pm.user_id = m.user_id)
$$;
revoke all on function public.plazas_sin_dar(uuid) from public, anon;
grant execute on function public.plazas_sin_dar(uuid) to authenticated;

-- ── 3. Dar la plaza a alguien que ya está en el viaje, sin código ──────────────────────────────────────────────────────────────────────────────────

create or replace function public.dar_plaza_del_pase(p_pase uuid, p_user uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_pase public.passes%rowtype;
  v_filas integer;
begin
  if v_uid is null then raise exception 'Hace falta una sesión.'; end if;
  select * into v_pase from public.passes where id = p_pase for update;
  if not found or v_pase.comprador_id <> v_uid then raise exception 'Solo quien compró el pase puede dar una plaza.'; end if;
  if v_pase.estado <> 'activo' or v_pase.tipo = 'uno' then raise exception 'Este pase no tiene plazas que dar.'; end if;
  if p_user = v_uid then return jsonb_build_object('ya_estaba', true); end if;
  if not exists (select 1 from public.trip_members m where m.trip_id = v_pase.trip_id and m.user_id = p_user) then raise exception 'Esa persona no está en el viaje.'; end if;
  if exists (select 1 from public.pass_members pm where pm.pass_id = p_pase and pm.user_id = p_user) then return jsonb_build_object('ya_estaba', true); end if;
  if v_pase.usos_usados >= v_pase.usos_max then raise exception 'Ya no quedan plazas en este pase.'; end if;
  insert into public.pass_members (pass_id, user_id) values (p_pase, p_user) on conflict do nothing;
  get diagnostics v_filas = row_count;
  if v_filas > 0 then
    update public.passes set usos_usados = usos_usados + 1 where id = p_pase;
    update public.trip_members set pass_id = p_pase where trip_id = v_pase.trip_id and user_id = p_user and pass_id is null;
  end if;
  return jsonb_build_object('ya_estaba', false, 'user_id', p_user);
end $$;
revoke all on function public.dar_plaza_del_pase(uuid, uuid) from public, anon;
grant execute on function public.dar_plaza_del_pase(uuid, uuid) to authenticated;

-- ── 4. Quien entra en un pase se entera sin cerrar la app (usa el aviso pequeño de la 0087) ────────────────────────────────────────────────────────

create or replace function public.avisar_plaza_dada() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_trip uuid;
begin
  select trip_id into v_trip from public.passes where id = new.pass_id;
  if v_trip is not null and to_regclass('public.trip_cambios') is not null then
    insert into public.trip_cambios (trip_id, cambiado_en) values (v_trip, now())
    on conflict (trip_id) do update set cambiado_en = excluded.cambiado_en;
  end if;
  return new;
end $$;
drop trigger if exists pass_members_avisar on public.pass_members;
create trigger pass_members_avisar after insert on public.pass_members for each row execute function public.avisar_plaza_dada();

commit;
