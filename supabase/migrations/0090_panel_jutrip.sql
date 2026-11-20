-- 0090 · EL PANEL DE JUTRIP (V33): lo que necesita el servidor del panel de administrador (/admin). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Va DESPUÉS de la 0089. Comprobación: docs/dias/COMPROBAR_0090.sql.
--
-- En palabras sencillas:
--   El panel enseña a Eric las personas que usan la app, lo que se ha vendido, los reportes y los destinos que la gente pide. Para no bajar todos los usuarios al servidor, las listas y los totales se calculan AQUÍ, en la base,
--   con funciones que solo puede llamar el servidor (clave de servicio): el móvil y la clave pública no las pueden tocar. Todas son de SOLO LECTURA salvo las que dejan un aviso en la campana o marcan «ya avisado».
--
--   1. Columnas nuevas (3):
--      · `avisos_destino.avisado_campana_en` y `avisos_destino.avisado_correo_en`: cuándo se avisó, por la campana y por correo, a quien pulsó «Avísame» para un destino. Así el [Ya está disponible] avisa UNA sola vez por persona y destino.
--      · `avisos_de_viajeros.notificado_en`: cuándo se mandó el correo interno a soporte@ con ese reporte (para juntar los reportes seguidos en UN correo cada 15 minutos). Los reportes que ya había se marcan como notificados
--        (si no, el primer correo sería un alud con todo lo antiguo).
--   2. Los importes de los pases NO necesitan columna nueva: `pagos_registro` (0026) ya guarda `importe_cent` y `moneda` de cada compra (el webhook de Stripe los toma de `amount_total` y `currency`), y cada pase comprado apunta a su cobro con
--      `passes.pago_ref`. Los pases dados a mano o con código no tienen cobro: cuentan 0 €.
--   3. Las funciones `panel_*` (todas `security definer`, `search_path = public`, solo `service_role`): inicio, usuarios (lista paginada, totales y ficha), ventas, destinos pedidos y [Ya está disponible], responder a un reporte
--      y juntar los reportes para el correo interno.
-- Ninguna tabla nueva con datos de una persona (solo columnas en tablas que ya están en el inventario de `empezar_de_cero`): no hace falta rehacer esa función.
-- NUNCA devuelven datos de tarjeta, ni referencias del cobro, ni recibos, ni contraseñas, ni tokens.
-- SI NO SE APLICA: el panel responde con un error claro (las funciones no existen) y el resto de la app sigue igual.
begin;

-- ── 1. Columnas nuevas ──────────────────────────────────────────────────────────────────────────────────────────
alter table public.avisos_destino add column if not exists avisado_campana_en timestamptz;
alter table public.avisos_destino add column if not exists avisado_correo_en timestamptz;

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'avisos_de_viajeros' and column_name = 'notificado_en') then
    alter table public.avisos_de_viajeros add column notificado_en timestamptz;
    -- Lo que ya había no se avisa por correo (solo lo que entre desde ahora).
    update public.avisos_de_viajeros set notificado_en = creado where notificado_en is null;
  end if;
end $$;
create index if not exists avisos_de_viajeros_notificar_idx on public.avisos_de_viajeros (creado) where notificado_en is null;

-- ── 2. Ayudas pequeñas ──────────────────────────────────────────────────────────────────────────────────────────
-- Una fecha AAAA-MM-DD o null (nunca falla con una fecha rara).
create or replace function public.panel_fecha(t text) returns date
language plpgsql immutable as $$
begin
  if t is null or t !~ '^\d{4}-\d{2}-\d{2}$' then return null; end if;
  return t::date;
exception when others then return null;
end $$;

-- Lo principal que escribió quien mandó un aviso (el sitio, el nombre, el destino, lo que no funciona o la idea), corto.
create or replace function public.panel_cosa_aviso(d jsonb) returns text
language sql immutable as $$
  select nullif(btrim(coalesce(d ->> 'sitio', d ->> 'nombre', d ->> 'destino', left(d ->> 'que', 80), left(d ->> 'texto', 80), '')), '')
$$;

-- ── 3. Inicio ───────────────────────────────────────────────────────────────────────────────────────────────────
-- Los números de la primera pantalla. Solo cuentan los cobros reales (`pagado`, no devueltos y no los de la pasarela de mentira de desarrollo). El día y el mes se cuentan en la hora de `p_tz`.
create or replace function public.panel_inicio(p_ahora timestamptz, p_tz text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_tz text := coalesce(nullif(p_tz, ''), 'Europe/Madrid');
  v_ahora timestamptz := coalesce(p_ahora, now());
  v_hoy date := (v_ahora at time zone v_tz)::date;
  v_mes date := v_hoy - (extract(day from v_hoy)::integer - 1);
begin
  return (
    with pagos as (
      select r.destino, r.plan, r.importe_cent, r.moneda, r.creado_en, (r.creado_en at time zone v_tz)::date as dia
      from public.pagos_registro r where r.estado = 'pagado' and r.proveedor <> 'mentira'
    ), reales as (
      select u.id, u.created_at from auth.users u where coalesce(u.is_anonymous, false) = false
    )
    select jsonb_build_object(
      'reportes_nuevos', (select count(*) from public.avisos_de_viajeros where estado = 'nuevo' and tipo <> 'foto'),
      'fotos_por_aprobar', (select count(*) from public.avisos_de_viajeros where tipo = 'foto' and estado in ('nuevo', 'visto')),
      'pases_hoy', (select count(*) from pagos where dia = v_hoy),
      'pases_mes', (select count(*) from pagos where dia >= v_mes),
      'ingresos_hoy_cent', (select coalesce(sum(importe_cent), 0) from pagos where dia = v_hoy),
      'ingresos_mes_cent', (select coalesce(sum(importe_cent), 0) from pagos where dia >= v_mes),
      'moneda', coalesce((select max(moneda) from pagos), 'eur'),
      'usuarios_hoy', (select count(*) from reales where (created_at at time zone v_tz)::date = v_hoy),
      'usuarios_semana', (select count(*) from reales where created_at >= v_ahora - interval '7 days'),
      'usuarios_total', (select count(*) from reales),
      'usuarios_con_viaje', (select count(*) from reales r where exists (select 1 from public.trips t where t.traveler_id = r.id) or exists (select 1 from public.trip_members m where m.user_id = r.id)),
      'serie14', (select jsonb_agg(jsonb_build_object('dia', to_char(v_hoy - 13 + i, 'YYYY-MM-DD'), 'pases', (select count(*) from pagos where dia = v_hoy - 13 + i)) order by i) from generate_series(0, 13) i),
      'atencion', (
        select coalesce(jsonb_agg(x order by x ->> 'en' desc), '[]'::jsonb) from (
          (select jsonb_build_object(
              'tipo', case a.tipo when 'foto' then 'foto' when 'no_funciona' then 'fallo' else 'reporte' end,
              'titulo', case a.tipo when 'restaurante' then 'Restaurante nuevo' when 'lugar' then 'Lugar nuevo' when 'destino' then 'Destino pedido' when 'foto' then 'Foto nueva'
                                    when 'dato_mal' then 'Un dato está mal' when 'consejo' then 'Consejo nuevo' when 'no_funciona' then 'Algo no funciona' else 'Idea nueva' end
                       || coalesce(': ' || public.panel_cosa_aviso(a.datos), ''),
              'en', a.creado) as x
            from public.avisos_de_viajeros a where a.estado = 'nuevo' order by a.creado desc limit 8)
          union all
          (select jsonb_build_object('tipo', 'venta', 'titulo', 'Pase ' || r.plan || ' de ' || r.destino, 'en', r.creado_en) as x from pagos r order by r.creado_en desc limit 5)
        ) s
      )
    )
  );
end $$;

-- ── 4. Usuarios ─────────────────────────────────────────────────────────────────────────────────────────────────
-- La lista (una página) y, con `p_id`, una sola persona. Solo cuentas de verdad (no las anónimas). La búsqueda compara sin tildes ni mayúsculas con `strpos` (así los comodines no valen de nada).
-- «destino» filtra a quien tiene un pase o un viaje a ese destino. `p_hoy`: hoy en la hora del panel (un viaje está hecho si su último día es anterior).
create or replace function public.panel_usuarios(
  p_q text, p_pase text, p_destino text, p_frecuencia text, p_compania text, p_orden text,
  p_pagina integer, p_por_pagina integer, p_hoy date, p_id uuid default null
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_q text := public.norm_destino_aviso(left(coalesce(p_q, ''), 80));
  v_dest text := public.norm_destino_aviso(left(coalesce(p_destino, ''), 80));
  v_por integer := greatest(1, least(coalesce(p_por_pagina, 50), 100));
  v_desde integer := (greatest(coalesce(p_pagina, 1), 1) - 1) * greatest(1, least(coalesce(p_por_pagina, 50), 100));
  v_hoy date := coalesce(p_hoy, current_date);
  v_orden text := case when p_orden in ('viajes', 'gastado', 'reciente', 'acceso') then p_orden else 'reciente' end;
begin
  return (
    with base as (
      select u.id, u.email::text as email, u.created_at, u.last_sign_in_at, nullif(btrim(coalesce(t.nombre, '')), '') as nombre
      from auth.users u left join public.travelers t on t.id = u.id
      where coalesce(u.is_anonymous, false) = false
        and (p_id is null or u.id = p_id)
        and (v_q = '' or strpos(public.norm_destino_aviso(coalesce(t.nombre, '') || ' ' || coalesce(u.email, '')), v_q) > 0)
    ), mis_pases as (
      select p.comprador_id as uid, p.id as pase, p.destino, p.tipo from public.passes p where p.estado = 'activo' and p.comprador_id in (select id from base)
      union
      select m.user_id, p.id, p.destino, p.tipo from public.pass_members m join public.passes p on p.id = m.pass_id where p.estado = 'activo' and m.user_id in (select id from base)
    ), viajes as (
      select t.traveler_id as uid, count(*)::integer as creados,
             count(*) filter (where public.panel_fecha(t.route #>> '{answers,dateRange,end}') < v_hoy)::integer as hechos
      from public.trips t where t.traveler_id in (select id from base) group by 1
    ), gasto as (
      select p.comprador_id as uid, sum(r.importe_cent)::bigint as cent, max(r.moneda) as moneda
      from public.passes p join public.pagos_registro r on r.pago_ref = p.pago_ref
      where r.estado = 'pagado' and r.proveedor <> 'mentira' and p.comprador_id in (select id from base) group by 1
    ), filtrada as (
      select b.id, b.email, b.created_at, b.last_sign_in_at, b.nombre,
             coalesce(vj.creados, 0) as creados, coalesce(vj.hechos, 0) as hechos, coalesce(g.cent, 0) as gastado, coalesce(g.moneda, 'eur') as moneda,
             coalesce(lp.exp_max, 0) as exp, pv.frecuencia, pv.compania, pv.anio_nacimiento
      from base b
      left join viajes vj on vj.uid = b.id
      left join gasto g on g.uid = b.id
      left join public.logro_perfil lp on lp.user_id = b.id
      left join public.viajero_primera_vez pv on pv.user_id = b.id
      where (coalesce(p_pase, '') not in ('si', 'no') or (p_pase = 'si') = exists (select 1 from mis_pases mp where mp.uid = b.id))
        and (v_dest = '' or exists (select 1 from mis_pases mp where mp.uid = b.id and public.norm_destino_aviso(mp.destino) = v_dest)
                         or exists (select 1 from public.trips t where t.traveler_id = b.id and public.norm_destino_aviso(t.route ->> 'destination') = v_dest))
        and (coalesce(p_frecuencia, '') = '' or pv.frecuencia = p_frecuencia)
        and (coalesce(p_compania, '') = '' or pv.compania = p_compania)
    ), ordenada as (
      select f.*, row_number() over (
        order by case when v_orden = 'viajes' then f.creados end desc nulls last,
                 case when v_orden = 'gastado' then f.gastado end desc nulls last,
                 case when v_orden = 'acceso' then f.last_sign_in_at end desc nulls last,
                 f.created_at desc, f.id) as rn
      from filtrada f
    ), pagina as (
      select * from ordenada where rn > v_desde and rn <= v_desde + v_por
    )
    select jsonb_build_object(
      'total', (select count(*) from filtrada),
      'usuarios', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', x.id, 'nombre', x.nombre, 'email', x.email, 'alta', x.created_at, 'ultimo_acceso', x.last_sign_in_at, 'exp', x.exp,
          'tiene_pase', exists (select 1 from mis_pases mp where mp.uid = x.id),
          'destinos_pase', coalesce((select jsonb_agg(jsonb_build_object('destino', d.destino, 'tipo', d.tipo) order by d.destino, d.tipo) from (select distinct mp.destino, mp.tipo from mis_pases mp where mp.uid = x.id) d), '[]'::jsonb),
          'viajes_creados', x.creados, 'viajes_hechos', x.hechos, 'gastado_cent', x.gastado, 'moneda', x.moneda,
          'primera_vez', case when x.frecuencia is null and x.compania is null and x.anio_nacimiento is null then null
                              else jsonb_build_object('frecuencia', x.frecuencia, 'compania', x.compania, 'anio_nacimiento', x.anio_nacimiento) end
        ) order by x.rn) from pagina x), '[]'::jsonb)
    )
  );
end $$;

-- Los totales de la pantalla de usuarios y las respuestas de la primera vez (solo cuentas de verdad). La edad sale del año de nacimiento.
create or replace function public.panel_usuarios_totales(p_ahora timestamptz) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_ahora timestamptz := coalesce(p_ahora, now());
  v_anio integer := extract(year from coalesce(p_ahora, now()))::integer;
begin
  return (
    with reales as (
      select u.id, u.created_at from auth.users u where coalesce(u.is_anonymous, false) = false
    ), pv as (
      select v.* from public.viajero_primera_vez v join reales r on r.id = v.user_id
    )
    select jsonb_build_object(
      'total', (select count(*) from reales),
      'con_viaje', (select count(*) from reales r where exists (select 1 from public.trips t where t.traveler_id = r.id) or exists (select 1 from public.trip_members m where m.user_id = r.id)),
      'nuevos_semana', (select count(*) from reales where created_at >= v_ahora - interval '7 days'),
      'contestaron', (select count(*) from pv where frecuencia is not null or compania is not null or anio_nacimiento is not null),
      'frecuencia', (select coalesce(jsonb_object_agg(frecuencia, n), '{}'::jsonb) from (select frecuencia, count(*) as n from pv where frecuencia is not null group by 1) s),
      'compania', (select coalesce(jsonb_object_agg(compania, n), '{}'::jsonb) from (select compania, count(*) as n from pv where compania is not null group by 1) s),
      'edad', (select coalesce(jsonb_object_agg(tramo, n), '{}'::jsonb) from (
                 select case when v_anio - anio_nacimiento < 18 then 'menos_18' when v_anio - anio_nacimiento < 30 then '18_29' when v_anio - anio_nacimiento < 45 then '30_44'
                             when v_anio - anio_nacimiento < 60 then '45_59' else '60_mas' end as tramo, count(*) as n
                 from pv where anio_nacimiento is not null group by 1) s)
    )
  );
end $$;

-- La ficha de una persona: sus viajes, sus pases, lo que ha ganado (en bruto: el servidor pone los nombres) y sus reportes.
create or replace function public.panel_ficha(p_id uuid, p_hoy date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  return jsonb_build_object(
    'viajes', coalesce((
      select jsonb_agg(x order by x ->> 'inicio' desc nulls last) from (
        select jsonb_build_object('destino', t.route ->> 'destination', 'inicio', t.route #>> '{answers,dateRange,start}', 'fin', t.route #>> '{answers,dateRange,end}',
                                  'miembros', 1 + (select count(*) from public.trip_members m where m.trip_id = t.id)) as x
        from public.trips t where t.traveler_id = p_id
        union all
        select jsonb_build_object('destino', t.route ->> 'destination', 'inicio', t.route #>> '{answers,dateRange,start}', 'fin', t.route #>> '{answers,dateRange,end}',
                                  'miembros', 1 + (select count(*) from public.trip_members m2 where m2.trip_id = t.id))
        from public.trips t join public.trip_members m on m.trip_id = t.id where m.user_id = p_id
      ) s), '[]'::jsonb),
    'pases', coalesce((
      select jsonb_agg(x order by x ->> 'fecha' desc) from (
        select jsonb_build_object('fecha', p.created_at, 'destino', p.destino, 'tipo', p.tipo,
                                  'importe_cent', case when r.estado = 'pagado' and r.proveedor <> 'mentira' then r.importe_cent else 0 end, 'moneda', coalesce(r.moneda, 'eur'), 'estado', p.estado) as x
        from public.passes p left join public.pagos_registro r on r.pago_ref = p.pago_ref where p.comprador_id = p_id
        union all
        select jsonb_build_object('fecha', m.unido_en, 'destino', p.destino, 'tipo', p.tipo, 'importe_cent', 0, 'moneda', 'eur', 'estado', p.estado)
        from public.pass_members m join public.passes p on p.id = m.pass_id where m.user_id = p_id and p.comprador_id <> p_id
      ) s), '[]'::jsonb),
    'sellos', coalesce((select jsonb_agg(jsonb_build_object('destino', a.destino, 'escalon', a.escalon) order by a.ganado_en) from public.achievements a where a.user_id = p_id and a.logro = 'sello'), '[]'::jsonb),
    'colecciones_hechas', (select count(*) from public.achievements a where a.user_id = p_id and a.logro = 'coleccion'),
    'paises', coalesce((select jsonb_agg(a.escalon order by a.ganado_en) from public.achievements a where a.user_id = p_id and a.logro = 'pais'), '[]'::jsonb),
    'destinos', coalesce((select jsonb_agg(a.escalon order by a.ganado_en) from public.achievements a where a.user_id = p_id and a.logro = 'destino_nuevo'), '[]'::jsonb),
    'reportes', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'tipo', a.tipo, 'titulo', coalesce(public.panel_cosa_aviso(a.datos), a.tipo), 'estado', a.estado, 'en', a.creado) order by a.creado desc)
      from (select * from public.avisos_de_viajeros where user_id = p_id order by creado desc limit 20) a), '[]'::jsonb)
  );
end $$;

-- ── 5. Ventas ───────────────────────────────────────────────────────────────────────────────────────────────────
-- Todo sale de `pagos_registro` (cobros reales y no devueltos). `importes_conocidos` es false si hay algún pase con cobro que no aparece en el registro (no debería). Sin datos de tarjeta ni referencias del cobro.
create or replace function public.panel_ventas(p_ahora timestamptz, p_tz text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_tz text := coalesce(nullif(p_tz, ''), 'Europe/Madrid');
  v_ahora timestamptz := coalesce(p_ahora, now());
  v_hoy date := (v_ahora at time zone v_tz)::date;
  v_mes date := v_hoy - (extract(day from v_hoy)::integer - 1);
begin
  return (
    with pagos as (
      select r.destino, r.plan, r.importe_cent, r.moneda, r.creado_en, (r.creado_en at time zone v_tz)::date as dia
      from public.pagos_registro r where r.estado = 'pagado' and r.proveedor <> 'mentira'
    )
    select jsonb_build_object(
      'importes_conocidos', not exists (select 1 from public.passes p where p.pago_ref is not null and not exists (select 1 from public.pagos_registro r where r.pago_ref = p.pago_ref)),
      'pases_hoy', (select count(*) from pagos where dia = v_hoy),
      'pases_mes', (select count(*) from pagos where dia >= v_mes),
      'ingresos_mes_cent', (select coalesce(sum(importe_cent), 0) from pagos where dia >= v_mes),
      'moneda', coalesce((select max(moneda) from pagos), 'eur'),
      'por_destino', coalesce((select jsonb_agg(jsonb_build_object('destino', destino, 'n', n) order by n desc, destino) from (select destino, count(*) as n from pagos where dia > v_hoy - 30 group by destino) s), '[]'::jsonb),
      'por_dia', (select jsonb_agg(jsonb_build_object('dia', to_char(v_hoy - 29 + i, 'YYYY-MM-DD'), 'n', (select count(*) from pagos where dia = v_hoy - 29 + i)) order by i) from generate_series(0, 29) i),
      'compras', coalesce((select jsonb_agg(jsonb_build_object('fecha', creado_en, 'destino', destino, 'tipo', plan, 'importe_cent', importe_cent, 'moneda', moneda) order by creado_en desc) from (select * from pagos order by creado_en desc limit 20) s), '[]'::jsonb)
    )
  );
end $$;

-- ── 6. Destinos ─────────────────────────────────────────────────────────────────────────────────────────────────
-- Lo que pide la gente (lo mismo que /api/admin/destinos-pedidos, pero calculado aquí, sin bajar la tabla entera).
create or replace function public.panel_destinos_pedidos(p_limite integer) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by (x ->> 'veces')::integer desc, x ->> 'destino'), '[]'::jsonb) from (
    select jsonb_build_object('destino', mode() within group (order by a.destino), 'veces', count(*)) as x
    from public.avisos_destino a group by a.destino_norm
    order by count(*) desc, min(a.destino) limit least(greatest(coalesce(p_limite, 50), 1), 200)
  ) s
$$;

-- Para cada destino (nombre ya normalizado): cuántas personas pulsaron «Avísame» y a cuántas ya se les avisó (por la campana o por correo).
create or replace function public.panel_destinos_resumen(p_normas jsonb) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'norm', n.v,
    'avisos', (select count(*) from public.avisos_destino a where a.destino_norm = n.v),
    'avisados', (select count(*) from public.avisos_destino a where a.destino_norm = n.v and (a.avisado_campana_en is not null or a.avisado_correo_en is not null))
  )), '[]'::jsonb)
  from jsonb_array_elements_text(case when jsonb_typeof(p_normas) = 'array' then p_normas else '[]'::jsonb end) as n(v)
$$;

-- [Ya está disponible]: a cada persona que pidió el aviso de ese destino, UNA sola vez, le deja un aviso en la campana (si tiene cuenta) y, si `p_correo`, deja reservado su correo (hasta `p_max` por vez) y lo devuelve
-- para que el servidor lo mande. Lo ya avisado no se repite nunca. Si el correo falla, `panel_destino_correo_devolver` lo deja libre otra vez.
create or replace function public.panel_destino_ya_disponible(p_norm text, p_texto text, p_correo boolean, p_max integer) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.avisos_destino;
  v_campana integer := 0;
  v_ya integer := 0;
  v_correos jsonb := '[]'::jsonb;
  v_reservados integer := 0;
  v_tope integer := greatest(0, least(coalesce(p_max, 100), 500));
  v_pend_campana boolean;
  v_pend_correo boolean;
  v_pendientes integer;
begin
  if coalesce(p_norm, '') = '' then return jsonb_build_object('campana', 0, 'ya_avisados', 0, 'correos', '[]'::jsonb, 'quedan', 0); end if;
  for r in select * from public.avisos_destino where destino_norm = p_norm order by creado_en, id for update loop
    v_pend_campana := r.user_id is not null and r.avisado_campana_en is null;
    v_pend_correo := coalesce(p_correo, false) and r.avisado_correo_en is null;
    if not v_pend_campana and not v_pend_correo then
      if r.avisado_campana_en is not null or r.avisado_correo_en is not null then v_ya := v_ya + 1; end if;
      continue;
    end if;
    if v_pend_campana then
      if public.crear_aviso(r.user_id, 'gracias_viajero', 'destino:' || p_norm, jsonb_build_object('texto', p_texto, 'tipo', 'destino', 'destino', r.destino)) then v_campana := v_campana + 1; end if;
      update public.avisos_destino set avisado_campana_en = now() where id = r.id;
    end if;
    if v_pend_correo and v_reservados < v_tope then
      update public.avisos_destino set avisado_correo_en = now() where id = r.id;
      v_correos := v_correos || jsonb_build_array(jsonb_build_object('id', r.id, 'email', r.email, 'idioma', r.idioma, 'destino', r.destino));
      v_reservados := v_reservados + 1;
    end if;
  end loop;
  select count(*) into v_pendientes from public.avisos_destino where destino_norm = p_norm and coalesce(p_correo, false) and avisado_correo_en is null;
  return jsonb_build_object('campana', v_campana, 'ya_avisados', v_ya, 'correos', v_correos, 'quedan', v_pendientes);
end $$;

-- Deja libres los correos que no se pudieron mandar (para poder mandarlos otro día).
create or replace function public.panel_destino_correo_devolver(p_ids jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  update public.avisos_destino set avisado_correo_en = null
  where id in (select (x)::uuid from jsonb_array_elements_text(case when jsonb_typeof(p_ids) = 'array' then p_ids else '[]'::jsonb end) x);
  get diagnostics v = row_count;
  return v;
end $$;

-- ── 7. Reportes ─────────────────────────────────────────────────────────────────────────────────────────────────
-- [Responder]: deja un aviso corto en la campana de quien mandó el reporte (solo si tiene cuenta: el `user_id` solo se guarda con cuenta de verdad y «avísame») y devuelve, solo al servidor, lo que hace falta para decidir el correo.
-- El reporte pasa de «nuevo» a «visto». Se puede responder más de una vez.
create or replace function public.panel_reporte_responder(p_id uuid, p_texto text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a public.avisos_de_viajeros;
  v_campana boolean := false;
  v_email text;
begin
  select * into a from public.avisos_de_viajeros where id = p_id for update;
  if not found then return jsonb_build_object('encontrado', false); end if;
  update public.avisos_de_viajeros set aviso_texto = p_texto, revisado_en = now(), estado = case when estado = 'nuevo' then 'visto' else estado end where id = p_id;
  if a.user_id is not null then
    perform public.crear_aviso(a.user_id, 'gracias_viajero', 'respuesta:' || p_id::text || ':' || gen_random_uuid()::text, jsonb_build_object('texto', p_texto, 'tipo', a.tipo, 'aviso_id', p_id));
    v_campana := true;
    select u.email::text into v_email from auth.users u where u.id = a.user_id and coalesce(u.is_anonymous, false) = false;
  end if;
  return jsonb_build_object('encontrado', true, 'campana', v_campana, 'con_cuenta', a.user_id is not null, 'avisame', a.avisame, 'email', v_email, 'tipo', a.tipo);
end $$;

-- El aviso interno a soporte@: junta los reportes que aún no se han avisado y los marca (con `p_ahora`), pero solo si han pasado `p_minutos` desde el último correo. Si no, devuelve una lista vacía y no marca nada.
-- Un candado de transacción evita que dos peticiones a la vez manden el mismo correo dos veces.
create or replace function public.panel_reportes_a_notificar(p_ahora timestamptz, p_minutos integer) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_ahora timestamptz := coalesce(p_ahora, now());
  v_res jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('panel_reportes_a_notificar'));
  if exists (select 1 from public.avisos_de_viajeros where notificado_en is not null and notificado_en > v_ahora - make_interval(mins => greatest(coalesce(p_minutos, 15), 0))) then
    return '[]'::jsonb;
  end if;
  with marcados as (
    update public.avisos_de_viajeros set notificado_en = v_ahora
    where id in (select id from public.avisos_de_viajeros where notificado_en is null order by creado limit 30)
    returning id, tipo, destino, datos, creado
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'tipo', tipo, 'destino', destino, 'creado', creado,
    'texto', coalesce((select string_agg(e.value, ' · ' order by e.key) from jsonb_each_text(datos) e where e.value is not null and e.value <> ''), '')
  ) order by creado), '[]'::jsonb) into v_res from marcados;
  return v_res;
end $$;

-- Si el correo interno no salió, esos reportes quedan sin avisar (para el siguiente intento).
create or replace function public.panel_reportes_desmarcar(p_ids jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  update public.avisos_de_viajeros set notificado_en = null
  where id in (select (x)::uuid from jsonb_array_elements_text(case when jsonb_typeof(p_ids) = 'array' then p_ids else '[]'::jsonb end) x);
  get diagnostics v = row_count;
  return v;
end $$;

-- ── 8. Solo el servidor ─────────────────────────────────────────────────────────────────────────────────────────
revoke all on function public.panel_fecha(text) from public, anon, authenticated;
revoke all on function public.panel_cosa_aviso(jsonb) from public, anon, authenticated;
revoke all on function public.panel_inicio(timestamptz, text) from public, anon, authenticated;
revoke all on function public.panel_usuarios(text, text, text, text, text, text, integer, integer, date, uuid) from public, anon, authenticated;
revoke all on function public.panel_usuarios_totales(timestamptz) from public, anon, authenticated;
revoke all on function public.panel_ficha(uuid, date) from public, anon, authenticated;
revoke all on function public.panel_ventas(timestamptz, text) from public, anon, authenticated;
revoke all on function public.panel_destinos_pedidos(integer) from public, anon, authenticated;
revoke all on function public.panel_destinos_resumen(jsonb) from public, anon, authenticated;
revoke all on function public.panel_destino_ya_disponible(text, text, boolean, integer) from public, anon, authenticated;
revoke all on function public.panel_destino_correo_devolver(jsonb) from public, anon, authenticated;
revoke all on function public.panel_reporte_responder(uuid, text) from public, anon, authenticated;
revoke all on function public.panel_reportes_a_notificar(timestamptz, integer) from public, anon, authenticated;
revoke all on function public.panel_reportes_desmarcar(jsonb) from public, anon, authenticated;
grant execute on function public.panel_fecha(text) to service_role;
grant execute on function public.panel_cosa_aviso(jsonb) to service_role;
grant execute on function public.panel_inicio(timestamptz, text) to service_role;
grant execute on function public.panel_usuarios(text, text, text, text, text, text, integer, integer, date, uuid) to service_role;
grant execute on function public.panel_usuarios_totales(timestamptz) to service_role;
grant execute on function public.panel_ficha(uuid, date) to service_role;
grant execute on function public.panel_ventas(timestamptz, text) to service_role;
grant execute on function public.panel_destinos_pedidos(integer) to service_role;
grant execute on function public.panel_destinos_resumen(jsonb) to service_role;
grant execute on function public.panel_destino_ya_disponible(text, text, boolean, integer) to service_role;
grant execute on function public.panel_destino_correo_devolver(jsonb) to service_role;
grant execute on function public.panel_reporte_responder(uuid, text) to service_role;
grant execute on function public.panel_reportes_a_notificar(timestamptz, integer) to service_role;
grant execute on function public.panel_reportes_desmarcar(jsonb) to service_role;

commit;
