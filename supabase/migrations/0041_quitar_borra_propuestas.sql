-- 0041 · QUITAR A ALGUIEN BORRA SUS PROPUESTAS SIN DECIDIR (Tanda 10N3 §2.3). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede repetir). Va DESPUÉS de la 0036.
--
-- Qué hace, en palabras sencillas: al quitar a alguien del viaje (o cuando sale él mismo), las propuestas que mandó y que NADIE ha decidido todavía (estado `pendiente`) se borran; las ya
-- decididas (aceptadas, rechazadas o que ya no encajan) se quedan, igual que sus gastos [Para todos] aceptados. El aviso de la campana que le hizo la propuesta al dueño ya no apunta a nada:
-- se deja leído. Es la misma función `sacar_del_viaje` de la 0036 con una línea más (la usan `quitar_del_viaje` y `salir_del_viaje`).

begin;

create or replace function public.sacar_del_viaje(p_trip uuid, p_user uuid, p_aviso boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pase uuid;
  v_filas integer;
  v_devuelta boolean := false;
  v_destino text;
  v_admin text;
  v_borradas integer := 0;
begin
  v_pase := public.pase_de_miembro(p_trip, p_user);
  delete from public.trip_members where trip_id = p_trip and user_id = p_user;
  get diagnostics v_filas = row_count;
  if v_filas = 0 then return jsonb_build_object('quitado', false); end if;
  -- Sus propuestas enviadas que nadie ha decidido: se borran (y el aviso que le llegó al dueño se da por leído).
  update public.avisos set leido_en = coalesce(leido_en, now())
   where tipo = 'recomendacion' and clave in (select 'rec:' || r.id from public.trip_recommendations r where r.trip_id = p_trip and r.author_id = p_user and r.estado = 'pendiente');
  delete from public.trip_recommendations where trip_id = p_trip and author_id = p_user and estado = 'pendiente';
  get diagnostics v_borradas = row_count;
  -- La plaza del pase vuelve a quien la compró (la del propio comprador no se toca: no es una plaza que se pueda dar a otro).
  if v_pase is not null then
    delete from public.pass_members pm using public.passes p where pm.pass_id = p.id and pm.pass_id = v_pase and pm.user_id = p_user and p.comprador_id <> p_user;
    get diagnostics v_filas = row_count;
    if v_filas > 0 then
      update public.passes set usos_usados = greatest(usos_usados - 1, 0) where id = v_pase;
      v_devuelta := true;
    end if;
  end if;
  update public.trip_invitations set usos_usados = greatest(usos_usados - 1, 0)
   where id = (select i.id from public.trip_invitations i where i.trip_id = p_trip and i.usos_usados > 0 and (v_pase is null or i.pass_id is not distinct from v_pase) order by i.created_at desc limit 1);
  if p_aviso then
    select route ->> 'destination' into v_destino from public.trips where id = p_trip;
    select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_admin from public.travelers where id = auth.uid();
    insert into public.avisos (user_id, tipo, clave, payload)
    values (p_user, 'quitado', 'quitado:' || p_trip || ':' || p_user || ':' || gen_random_uuid(), jsonb_build_object('trip_id', p_trip, 'destino', v_destino, 'admin', v_admin));
  end if;
  return jsonb_build_object('quitado', true, 'plaza_devuelta', v_devuelta, 'propuestas_borradas', v_borradas);
end $$;
revoke all on function public.sacar_del_viaje(uuid, uuid, boolean) from public, anon, authenticated;

commit;
