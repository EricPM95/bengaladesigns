-- Tanda 10N3 (§3b.4 y §3b.6): el encuadre de la foto del perfil y las portadas de «Mis viajes». SIN APLICAR: la aplica Eric.
--
-- Sin esta migración la app funciona igual: el encuadre de la foto y la portada elegida se quedan guardados en ESE móvil (y no se ven en otros ni los ven los demás). Con ella, viajan con la cuenta.
--
--   · travelers.foto_encuadre  jsonb  {"x":0..1,"y":0..1,"zoom":1..4}: qué parte de la foto se ve dentro del círculo (la foto guardada es la entera; no se recorta).
--   · travelers.portadas       jsonb  {"<id del viaje>": {"f":"viaje","id":"…","ruta":"…"} | {"f":"galeria","ruta":"…"} | {"f":"destino"}}: la portada que cada persona eligió en «Mis viajes».
--   · gente_del_viaje devuelve también `encuadre`, para que «Personas del viaje» y las caras del viaje enseñen la foto igual que la ve su dueño.

alter table public.travelers add column if not exists foto_encuadre jsonb;
alter table public.travelers add column if not exists portadas jsonb;

create or replace function public.gente_del_viaje(p_trip uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.es_dueno(p_trip) or public.es_miembro(p_trip) then (
    select coalesce(jsonb_agg(jsonb_build_object('id', x.uid, 'nombre', nullif(trim(split_part(coalesce(tr.nombre, ''), ' ', 1)), ''), 'inicial', public.inicial_de_email(x.uid), 'foto', tr.foto_path, 'encuadre', tr.foto_encuadre,
                                                  'es_admin', x.es_admin, 'permiso', x.permiso, 'es_yo', x.uid = auth.uid()) order by x.orden, x.unido, x.uid), '[]'::jsonb)
    from (
      select t.traveler_id as uid, true as es_admin, 'admin'::text as permiso, 0 as orden, 'epoch'::timestamptz as unido from public.trips t where t.id = p_trip
      union all
      select m.user_id, false, m.permiso, 1, m.created_at from public.trip_members m where m.trip_id = p_trip
    ) x left join public.travelers tr on tr.id = x.uid
  ) else '[]'::jsonb end
$$;
revoke all on function public.gente_del_viaje(uuid) from public, anon;
grant execute on function public.gente_del_viaje(uuid) to authenticated;
