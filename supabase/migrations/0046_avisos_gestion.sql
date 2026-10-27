-- Tanda 10N4 §2 · «Gestionar los avisos» (la campana): marcar como no leído y eliminar (y deshacer) los avisos de la cuenta.
-- Sin esta migración la app sigue funcionando: lo eliminado y lo marcado como no leído se recuerda en el propio móvil.

alter table public.avisos add column if not exists oculto_en timestamptz;

-- La lista de la campana ya no trae lo eliminado.
create or replace function public.avisos_de(p_uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x ->> 'creado_en' desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', a.id, 'tipo', a.tipo, 'payload', a.payload, 'creado_en', a.creado_en, 'leido', a.leido_en is not null,
      'estado_rec', case when a.tipo = 'recomendacion' then (select r.estado from public.trip_recommendations r where r.id = (a.payload ->> 'rec_id')::uuid) end
    ) as x
    from public.avisos a where a.user_id = p_uid and a.oculto_en is null order by a.creado_en desc limit 60
  ) s
$$;

-- «Marcar como no leído».
create or replace function public.marcar_avisos_no_leidos(p_uid uuid, p_ids uuid[]) returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  update public.avisos set leido_en = null where user_id = p_uid and leido_en is not null and id = any(p_ids);
  get diagnostics v = row_count;
  return v;
end $$;

-- «Eliminar» (p_ocultar = true) y «Deshacer» (false). No borra la fila: así «Deshacer» devuelve el aviso tal cual y la clave sigue evitando que se repita.
create or replace function public.ocultar_avisos(p_uid uuid, p_ids uuid[], p_ocultar boolean) returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  update public.avisos set oculto_en = case when p_ocultar then coalesce(oculto_en, now()) else null end
  where user_id = p_uid and id = any(p_ids);
  get diagnostics v = row_count;
  return v;
end $$;

revoke all on function public.marcar_avisos_no_leidos(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.ocultar_avisos(uuid, uuid[], boolean) from public, anon, authenticated;
grant execute on function public.marcar_avisos_no_leidos(uuid, uuid[]) to service_role;
grant execute on function public.ocultar_avisos(uuid, uuid[], boolean) to service_role;
