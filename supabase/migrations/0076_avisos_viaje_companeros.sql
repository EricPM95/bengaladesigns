-- 0076 · LOS COMPAÑEROS DE UN VIAJE COMPARTIDO TAMBIÉN RECIBEN LOS AVISOS (6-nov; decisión de Eric). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0076.sql.
--
-- Qué hace: SOLO rehace `avisos_viaje_hay_que_mirar` (la mirada barata que hace el planificador de la 0075 cada minuto). Antes miraba si el DUEÑO del viaje tenía algún móvil con los avisos encendidos; ahora, el dueño O cualquier
-- compañero del viaje (`trip_members`). El resto no cambia: el servidor (server/avisosViaje.js) ya manda a cada compañero en su móvil, con su pase y con SU interruptor «Avisos en el móvil» (su suscripción).
-- Parte de su ÚLTIMA versión (la de la 0074; ninguna migración posterior la toca): la única diferencia es el `or exists (… trip_members …)`. No toca ninguna tabla: nada que añadir a `empezar_de_cero`.
begin;

create or replace function public.avisos_viaje_hay_que_mirar(p_desde date, p_hasta date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from (
      select t.id, t.traveler_id,
        case when (t.route #>> '{answers,dateRange,start}') ~ '^\d{4}-\d{2}-\d{2}$' then (t.route #>> '{answers,dateRange,start}')::date end as inicio,
        case when coalesce(t.route #>> '{answers,dateRange,end}', t.route #>> '{answers,dateRange,start}') ~ '^\d{4}-\d{2}-\d{2}$' then coalesce(t.route #>> '{answers,dateRange,end}', t.route #>> '{answers,dateRange,start}')::date end as fin
      from public.trips t
      where t.generation_state is null and t.guardado_en is null
    ) q
    where q.inicio is not null and q.fin is not null and q.inicio <= p_hasta and q.fin >= p_desde
      and (
        exists (select 1 from public.push_suscripciones s where s.user_id = q.traveler_id)
        or exists (select 1 from public.trip_members m join public.push_suscripciones s on s.user_id = m.user_id where m.trip_id = q.id)
      )
  )
$$;

revoke all on function public.avisos_viaje_hay_que_mirar(date, date) from public, anon, authenticated;
grant execute on function public.avisos_viaje_hay_que_mirar(date, date) to service_role;

commit;
