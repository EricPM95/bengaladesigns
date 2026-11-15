-- 0078 · AL ABRIR LA APP, SOLO LA LISTA DE VIAJES (tanda V1b, 15-nov). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0078.sql.
--
-- Por qué: al abrir la app se bajaban TODOS los viajes de la cuenta enteros (la ruta de cada uno pesa ~100 KB o más). Con muchos viajes (los de prueba también), cada apertura costaba megas de salida de datos (egress).
--
-- Qué hace: `viajes_lista(p_solo_mios)` devuelve los mismos viajes que la consulta de siempre (con la seguridad por filas ACTIVA: es `security invoker`, ve lo mismo que vería la persona) pero con la ruta LIGERA:
-- la ruta sin su detalle (cada día con sus datos sueltos y sus paradas con nombre, tipo y coordenadas, sin textos largos ni objetos anidados como horarios, comidas, coche o excursiones) y marcada con `"ligero": true`.
-- Es lo que necesitan «Mis viajes», el Perfil y decidir qué viaje abrir. El viaje entero se pide solo al abrirlo (`select … where id = …`, como siempre). Un viaje con la generación a medias se devuelve tal cual.
-- La app nunca guarda una ruta ligera (guarda solo rutas completas): `saveTrip` lo rechaza si ve `ligero`.
-- No crea tablas: nada que añadir a `empezar_de_cero`. Si esta función no existe, la app sigue con la consulta de siempre (se puede desplegar antes o después de pegarla).
begin;

-- Un día ligero: sus datos sueltos (texto corto, números, booleanos) y sus paradas ligeras. Lo anidado (excursiones, comidas, coche, aeropuerto…) se queda fuera.
create or replace function public.dia_ligero(d jsonb) returns jsonb
language sql immutable set search_path = public as $$
  select coalesce((select jsonb_object_agg(e.key, e.value) from jsonb_each(d) e
                   where e.key <> 'stops' and jsonb_typeof(e.value) not in ('object', 'array') and (jsonb_typeof(e.value) <> 'string' or length(e.value #>> '{}') <= 200)), '{}'::jsonb)
         || jsonb_build_object('stops', coalesce((
              select jsonb_agg((
                select coalesce(jsonb_object_agg(s.key, s.value), '{}'::jsonb) from jsonb_each(st.value) s
                where s.key in ('coordinates', 'tags') or (jsonb_typeof(s.value) not in ('object', 'array') and (jsonb_typeof(s.value) <> 'string' or length(s.value #>> '{}') <= 200))
              ) order by st.ord)
              from jsonb_array_elements(case when jsonb_typeof(d -> 'stops') = 'array' then d -> 'stops' else '[]'::jsonb end) with ordinality as st(value, ord)
            ), '[]'::jsonb))
$$;

-- Los viajes de la persona (los suyos y aquellos donde es invitada, si p_solo_mios es false), más recientes primero, con la ruta ligera.
create or replace function public.viajes_lista(p_solo_mios boolean default false) returns table (
  id uuid, traveler_id uuid, guardado_en timestamptz, updated_at timestamptz, route jsonb, bookings jsonb, wishlist jsonb, ui_state jsonb, generation_state jsonb
)
language sql stable security invoker set search_path = public as $$
  select t.id, t.traveler_id, t.guardado_en, t.updated_at,
    case
      when t.generation_state is not null or jsonb_typeof(t.route -> 'days') is distinct from 'array' then t.route
      else (t.route - 'days') || jsonb_build_object('ligero', true, 'days', coalesce((select jsonb_agg(public.dia_ligero(x.d) order by x.ord) from jsonb_array_elements(t.route -> 'days') with ordinality as x(d, ord)), '[]'::jsonb))
    end,
    t.bookings, t.wishlist, t.ui_state, t.generation_state
  from public.trips t
  where (not p_solo_mios) or t.traveler_id = auth.uid()
  order by t.updated_at desc
$$;

revoke all on function public.dia_ligero(jsonb) from public, anon;
revoke all on function public.viajes_lista(boolean) from public, anon;
grant execute on function public.dia_ligero(jsonb) to authenticated;
grant execute on function public.viajes_lista(boolean) to authenticated;

commit;
