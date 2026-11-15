-- Pase Lanzarote DÚO de cortesía (0 €) para Eric. NO es una venta.
-- Pegar en el SQL Editor de Supabase, PRIMERO el bloque A (solo mira) y, si sale una fila de cuenta y una de viaje, el bloque B.

-- ───────── A. Solo mirar (no cambia nada) ─────────
select 'cuenta' as que, u.id::text as id, u.email as dato from auth.users u where lower(u.email) = 'eeriiicpm95@gmail.com'
union all
select 'viaje', t.id::text, coalesce(t.route ->> 'destination', '?') || ' · creado ' || t.created_at::date
from public.trips t join auth.users u on u.id = t.traveler_id
where lower(u.email) = 'eeriiicpm95@gmail.com' and t.route ->> 'destination' ilike '%lanzarote%'
union all
select 'pase ya existente', p.id::text, p.destino || ' · ' || p.tipo || ' · ' || p.estado
from public.passes p join auth.users u on u.id = p.comprador_id
where lower(u.email) = 'eeriiicpm95@gmail.com';

-- ───────── B. Dar el pase ─────────
-- 1) La tabla de cobros solo admitía «stripe» y «mentira»: se añade «cortesia» (no toca ninguna fila).
alter table public.pagos_registro drop constraint if exists pagos_registro_proveedor_check;
alter table public.pagos_registro add constraint pagos_registro_proveedor_check check (proveedor in ('stripe', 'mentira', 'cortesia'));

-- 2) Registra el pase con la misma función que usa el cobro. Si ya se ejecutó, no duplica (misma referencia → «repetido»).
do $$
declare
  v_uid uuid;
  v_trip uuid;
  v_n integer;
  v_res jsonb;
begin
  select id into v_uid from auth.users where lower(email) = 'eeriiicpm95@gmail.com';
  if v_uid is null then raise exception 'No encuentro la cuenta de Eric.'; end if;
  select count(*) into v_n from public.trips where traveler_id = v_uid and route ->> 'destination' ilike '%lanzarote%';
  if v_n = 0 then raise exception 'Eric no tiene ningún viaje a Lanzarote.'; end if;
  -- El viaje a Lanzarote más reciente.
  select id into v_trip from public.trips where traveler_id = v_uid and route ->> 'destination' ilike '%lanzarote%' order by created_at desc limit 1;
  v_res := public.registrar_pago(
    'cortesia-eric-lanzarote-2026-11',   -- p_pago_ref
    null,                                -- p_intencion_ref
    'cortesia',                          -- p_proveedor
    v_uid,                               -- p_comprador
    'Lanzarote',                         -- p_destino (el nombre del destino en data/logros/lanzarote.json)
    'duo',                               -- p_plan
    2,                                   -- p_personas
    0,                                   -- p_importe_cent
    'eur',                               -- p_moneda
    v_trip                               -- p_trip
  );
  raise notice 'Resultado: % (viajes a Lanzarote de Eric: %, usado el más reciente %)', v_res, v_n, v_trip;
end $$;

-- ───────── C. Comprobar ─────────
select p.id, p.destino, p.tipo, p.usos_max, p.usos_usados, p.estado, p.codigo, p.trip_id, r.proveedor, r.importe_cent
from public.passes p join public.pagos_registro r on r.pago_ref = p.pago_ref
where p.pago_ref = 'cortesia-eric-lanzarote-2026-11';
