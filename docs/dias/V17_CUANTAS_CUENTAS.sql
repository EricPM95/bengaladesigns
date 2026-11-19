-- (V17) SOLO LECTURA. ¿Cuántas cuentas más están como Alicia? Es decir: tienen un viaje PROPIO y están invitadas a un viaje de otra persona al MISMO destino
-- con días que se pisan. Una fila por caso (cuenta, su viaje, el compartido); y al final el total. No cambia nada.
with propios as (
  select t.id, t.traveler_id as persona, lower(t.route ->> 'destination') as destino,
         nullif(t.route #>> '{answers,dateRange,start}', '')::date as ini, nullif(t.route #>> '{answers,dateRange,end}', '')::date as fin
  from public.trips t where t.generation_state is null
), compartidos as (
  select t.id, m.user_id as persona, lower(t.route ->> 'destination') as destino,
         nullif(t.route #>> '{answers,dateRange,start}', '')::date as ini, nullif(t.route #>> '{answers,dateRange,end}', '')::date as fin
  from public.trips t join public.trip_members m on m.trip_id = t.id where t.generation_state is null
), casos as (
  select p.persona, p.id as viaje_propio, c.id as viaje_compartido, p.destino, p.ini as propio_desde, p.fin as propio_hasta, c.ini as comp_desde, c.fin as comp_hasta
  from propios p join compartidos c on c.persona = p.persona and c.destino = p.destino and p.ini <= c.fin and c.ini <= p.fin
)
select jsonb_build_object(
  'cuentas_con_este_caso', (select count(distinct persona) from casos),
  'casos', (select count(*) from casos),
  'detalle', coalesce((select jsonb_agg(to_jsonb(x)) from (select * from casos order by persona, destino limit 200) x), '[]'::jsonb)
) as resultado;
