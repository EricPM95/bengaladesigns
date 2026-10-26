-- 0043 · EL ADMINISTRADOR LO PUEDE TOCAR TODO EN LAS CUENTAS (Tanda 10N3, §2b). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- Aplícala DESPUÉS de la 0040.
--
-- Qué se ha comprobado de la 0040 (con la base de datos de pruebas, ver pruebaTanda10N3_cuentas):
--   * El administrador (dueño) YA puede, con las reglas de la 0040, marcar y deshacer cualquier pago (`es_decisor_de_gastos` lo incluye) y editar cualquier gasto del grupo ya aceptado
--     (quién lo pagó, entre quién, importe), también el de alguien que ya salió del viaje: el gasto no se borra al salir (solo se borra con la cuenta) y la regla mira al dueño, no al autor.
-- Lo único que faltaba:
--   * Al marcar un pago donde uno de los dos YA NO está en el viaje, el aviso de la campanita se le creaba igualmente (a una persona que ya no ve el viaje). Ahora solo se avisa a quien sigue en el viaje.
--   * Un pago marcado por el administrador entre dos personas sigue avisando a las dos (si siguen en el viaje).
--   * FALLO ENCONTRADO: quien salía del viaje seguía pudiendo editar y quitar SUS gastos (y deshacer sus pagos). Ahora esas tres reglas piden seguir en el viaje.
-- SI NO SE APLICA: todo funciona igual; solo se crea algún aviso de más a quien ya salió, y quien sale del viaje podría seguir editando o quitando lo suyo.

begin;

create or replace function public.avisar_pago_marcado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_dest uuid;
  v_actor text;
  v_deudor text;
  v_acreedor text;
begin
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_actor from public.travelers where id = new.marcado_por;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_deudor from public.travelers where id = new.deudor_id;
  select nullif(trim(split_part(coalesce(nombre, ''), ' ', 1)), '') into v_acreedor from public.travelers where id = new.acreedor_id;
  for v_dest in
    select x from unnest(array[new.deudor_id, new.acreedor_id]) x
    where x <> new.marcado_por
      and exists (select 1 from auth.users u where u.id = x)
      and (exists (select 1 from public.trips t where t.id = new.trip_id and t.traveler_id = x) or exists (select 1 from public.trip_members m where m.trip_id = new.trip_id and m.user_id = x))
  loop
    insert into public.avisos (user_id, tipo, clave, payload)
    values (v_dest, 'pago_marcado', 'pm:' || new.id || ':' || v_dest,
            jsonb_build_object('trip_id', new.trip_id, 'pago_id', new.id, 'actor_id', new.marcado_por, 'actor', v_actor, 'inicial', public.inicial_de_email(new.marcado_por),
                               'deudor_id', new.deudor_id, 'deudor', v_deudor, 'acreedor_id', new.acreedor_id, 'acreedor', v_acreedor, 'importe', new.importe,
                               'para', case when v_dest = new.deudor_id then 'deudor' else 'acreedor' end))
    on conflict do nothing;
  end loop;
  return new;
end $$;


-- ── Quien sale del viaje deja de poder tocar lo suyo ─────────────────────────────────────────────────────────────────────────
-- (Fallo encontrado al probar: la autora de un gasto seguía pudiendo editarlo o quitarlo tras salir del viaje, porque las reglas de la 0037 y la 0040 miraban solo «autor_id = yo».
--  Sus gastos tienen que quedarse en las cuentas «para que nadie pierda lo que puso»; solo el administrador (y quien puede editar) los cambia ya.)
drop policy if exists "trip_gastos update editar" on public.trip_gastos;
create policy "trip_gastos update editar" on public.trip_gastos
  for update to authenticated
  using ((public.es_dueno(trip_id) or public.es_miembro(trip_id)) and ((ambito = 'grupo' and estado = 'aceptado' and (autor_id = auth.uid() or public.es_decisor_de_gastos(trip_id))) or (ambito = 'mio' and autor_id = auth.uid()) or (estado = 'pendiente' and autor_id = auth.uid())))
  with check (estado = (select g.estado from public.trip_gastos g where g.id = trip_gastos.id) and ((ambito = 'grupo' and (autor_id = auth.uid() or public.es_decisor_de_gastos(trip_id))) or (ambito = 'mio' and autor_id = auth.uid())));

drop policy if exists "trip_gastos delete" on public.trip_gastos;
create policy "trip_gastos delete" on public.trip_gastos
  for delete to authenticated using ((public.es_dueno(trip_id) or public.es_miembro(trip_id)) and (autor_id = auth.uid() or (ambito = 'grupo' and public.es_decisor_de_gastos(trip_id))));

drop policy if exists "trip_pagos delete" on public.trip_pagos;
create policy "trip_pagos delete" on public.trip_pagos
  for delete to authenticated using ((public.es_dueno(trip_id) or public.es_miembro(trip_id)) and (deudor_id = auth.uid() or acreedor_id = auth.uid() or marcado_por = auth.uid() or public.es_decisor_de_gastos(trip_id)));

commit;
