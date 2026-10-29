-- 0067 · LA FORMA DE LAS CUENTAS LA DECIDE EL NÚMERO DE PERSONAS (Tanda 10N10, apartado 5a). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir).
-- NO edita las anteriores (0054, 0055, 0059, 0064): las sustituye con `create or replace`. Aplícala DESPUÉS de la 0064 (Eric ya la tiene).
--
-- La regla nueva (ya no se elige a mano ni existe «¿Cómo lleváis las cuentas?»):
--   * una sola persona               -> sin cuentas compartidas (aquí: 'cada_uno', que para el servidor es «no es conjunta»);
--   * dos personas, o una familia    -> 'conjunta' (Mi cuenta + Cuenta conjunta);
--   * tres o más que no son familia  -> 'cada_uno' (Mi cuenta + Cuenta del grupo).
-- Cómo lo sabe el servidor: la app del administrador apunta en la ruta `route.cuentasPersonas` (cuántas personas hay, con él) cada vez que cambia la gente del viaje. `modo_cuentas_del_viaje(route)` lee eso.
-- Si la ruta aún no lo lleva (viajes anteriores a esta migración, hasta que el administrador abra el viaje), vale lo de «¿Con quién viajas?»: pareja o familia = conjunta. `route.modoCuentas` (el que se elegía a mano) YA NO CUENTA.
-- Efectos: lo «Solo para mí» del administrador se aparta (0064) solo con dos personas o en familia; si entra una tercera persona (no familia), el viaje deja de ser conjunta y la 0064 devuelve lo apartado a `trips.bookings`.
-- Quita también el aviso «Eric ha cambiado las cuentas…» y la pregunta «¿Cómo lleváis las cuentas?» del aviso «Ana se ha unido a tu viaje».
-- SI NO SE APLICA: todo funciona en la app; solo que la base de datos sigue usando el modo elegido a mano en viajes viejos y puede mandar el aviso de «cambiado las cuentas» (que la app ya no sabe pintar).

begin;

create or replace function public.modo_cuentas_del_viaje(p_route jsonb) returns text
language sql immutable as $$
  select case
    when p_route #>> '{answers,companion}' = 'family' then 'conjunta'
    when nullif(p_route ->> 'cuentasPersonas', '') is not null then
      case when (p_route ->> 'cuentasPersonas')::integer = 2 then 'conjunta' else 'cada_uno' end
    when p_route #>> '{answers,companion}' = 'couple' then 'conjunta'
    else 'cada_uno'
  end
$$;

-- Ya no se pregunta nada al unirse alguien.
create or replace function public.cuentas_por_preguntar(p_route jsonb, p_personas integer) returns boolean
language sql immutable as $$ select false $$;

-- Ya no hay aviso de «ha cambiado las cuentas».
create or replace function public.avisar_cuentas_modo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  return new;
end $$;

commit;
