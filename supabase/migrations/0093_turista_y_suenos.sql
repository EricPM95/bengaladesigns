-- 0093 · «TU PAÍS» Y «EL VIAJE DE TUS SUEÑOS» (V39). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir: no duplica ni borra nada). Va DESPUÉS de la 0092. Comprobación: docs/dias/COMPROBAR_0093.sql (una sola fila, `todo` en true).
--
-- Tiene dos bloques, uno por cada parte de la tanda V39:
--   BLOQUE A · el país de la persona (lo escribe el agente de «tu país» y los logros).
--   BLOQUE B · el viaje de tus sueños (este agente): lo que la persona elige en la pregunta 3 de la primera vez y en Ajustes.
--
-- SI NO SE APLICA: la app funciona igual. La pregunta de los sueños NO sale (quedan cuatro preguntas), Ajustes no enseña «El viaje de tus sueños» y el panel enseña «Pronto» en «Destinos soñados».
begin;

-- ===== BLOQUE A (país de la persona) =====
-- «Tu país» NO necesita ningún cambio en la base de datos (V39, parte A):
--   · Quién contestó «¿En qué país vives?» ya está en `viajero_primera_vez.pais_vive` (0091). Esa respuesta manda siempre y NINGÚN viaje la pisa: el servidor no escribe nunca ahí un país sacado de un viaje.
--   · Quien la saltó: los logros miran cada viaje por su ORIGEN (el país de la ciudad de salida, que ya va dentro del viaje: `trips.route.answers.originPlace.countryCode`), y el panel calcula «dónde viven» al leer
--     (el país del origen de su último viaje, con `trips.updated_at`). Se actualiza solo con cada viaje y se distingue de lo contestado en el propio cálculo (`fuente`: 'contestado' | 'origen'),
--     sin guardar una columna de «fuente» que se quedaría vieja. `empezar_de_cero` no cambia por esto (no hay tabla ni columna nueva).
--   · Qué comprobar (para COMPROBAR_0093.sql): nada de este bloque; si hubiera que comprobar algo, que `viajero_primera_vez.pais_vive` existe (0091).
-- ===== FIN BLOQUE A =====

-- ===== BLOQUE B (el viaje de tus sueños) =====
-- En palabras sencillas:
--   Cada persona puede guardar UN viaje soñado: un país («Japón») o un destino («Tokio»). Va en la misma fila que sus otras respuestas de la primera vez (`viajero_primera_vez`, una por persona), en cinco columnas nuevas:
--   `sueno_tipo` ('pais' o 'destino'), `sueno_nombre` (como se enseña), `sueno_iso` (el país, 2 letras en minúscula), `sueno_norm` (el nombre sin tildes ni mayúsculas: con él se cuenta y se avisa) y `sueno_en` (cuándo lo eligió).
--   Es una columna de una tabla que YA está en el inventario de `empezar_de_cero` (y de «Borrar mi cuenta»): al borrar la fila se va el sueño con ella. Por eso NO se vuelve a crear `empezar_de_cero` (queda la de la 0091, sin cambios);
--   `pruebaTanda10J` siembra un sueño en esa fila y comprueba que desaparece.
--   Las políticas de la tabla (cada persona ve, crea y cambia SOLO su fila) no cambian: las columnas nuevas quedan dentro de ellas.
--   Dos funciones solo del servidor: `panel_suenos` (cuenta los sueños en la base de datos, sin bajar la tabla; para «Destinos soñados» del panel) y `panel_sueno_avisar` (deja el aviso «¡Tu viaje soñado ya está en Jutrip: …!» en la campana,
--   UNA sola vez por persona y sueño: reutiliza `crear_aviso`, que no repite una clave, igual que los [Avísame]).
alter table public.viajero_primera_vez add column if not exists sueno_tipo text;
alter table public.viajero_primera_vez add column if not exists sueno_nombre text;
alter table public.viajero_primera_vez add column if not exists sueno_iso text;
alter table public.viajero_primera_vez add column if not exists sueno_norm text;
alter table public.viajero_primera_vez add column if not exists sueno_en timestamptz;
alter table public.viajero_primera_vez drop constraint if exists viajero_primera_vez_sueno_valido;
alter table public.viajero_primera_vez add constraint viajero_primera_vez_sueno_valido check (
  (sueno_tipo is null and sueno_nombre is null and sueno_iso is null and sueno_norm is null)
  or (sueno_tipo in ('pais', 'destino') and char_length(sueno_nombre) between 2 and 80 and sueno_iso ~ '^[a-z]{2}$' and char_length(sueno_norm) between 2 and 80)
);
create index if not exists viajero_primera_vez_sueno_idx on public.viajero_primera_vez (sueno_norm) where sueno_norm is not null;

-- Lo que sueña la gente, contado aquí (de más a menos), en el periodo del panel (días en la hora de Madrid; null = sin tope). Devuelve [{ tipo, nombre, iso, norm, veces }].
create or replace function public.panel_suenos(p_desde date, p_hasta date, p_limite integer) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by (x ->> 'veces')::integer desc, x ->> 'nombre'), '[]'::jsonb) from (
    select jsonb_build_object('tipo', v.sueno_tipo, 'nombre', mode() within group (order by v.sueno_nombre), 'iso', min(v.sueno_iso), 'norm', v.sueno_norm, 'veces', count(*)) as x
    from public.viajero_primera_vez v
    where v.sueno_norm is not null
      and (p_desde is null or (v.sueno_en at time zone 'Europe/Madrid')::date >= p_desde)
      and (p_hasta is null or (v.sueno_en at time zone 'Europe/Madrid')::date <= p_hasta)
    group by v.sueno_tipo, v.sueno_norm
    order by count(*) desc, min(v.sueno_nombre) limit least(greatest(coalesce(p_limite, 50), 1), 200)
  ) s
$$;

-- Un destino ya está en la app: a cada persona que lo soñaba (eligió ESE destino, o eligió su país: `p_iso`) le deja UN aviso en la campana. Nunca repite: la clave es «sueno:<tipo>:<nombre normalizado>» de SU sueño,
-- así que si después se publica otro destino del mismo país, no vuelve a avisarla. `p_norm` y `p_iso` pueden ir vacíos (solo se mira lo que llegue). Devuelve { avisadas, ya_avisadas }.
create or replace function public.panel_sueno_avisar(p_norm text, p_iso text, p_nombre text, p_texto text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_nuevas integer := 0;
  v_ya integer := 0;
begin
  if coalesce(p_norm, '') = '' and coalesce(p_iso, '') = '' then return jsonb_build_object('avisadas', 0, 'ya_avisadas', 0); end if;
  for r in
    select v.user_id, v.sueno_tipo, v.sueno_norm from public.viajero_primera_vez v
    where v.sueno_norm is not null
      and ((v.sueno_tipo = 'destino' and coalesce(p_norm, '') <> '' and v.sueno_norm = p_norm)
        or (v.sueno_tipo = 'pais' and coalesce(p_iso, '') <> '' and v.sueno_iso = lower(p_iso)))
    order by v.sueno_en, v.user_id
  loop
    if public.crear_aviso(r.user_id, 'gracias_viajero', 'sueno:' || r.sueno_tipo || ':' || r.sueno_norm, jsonb_build_object('texto', p_texto, 'tipo', 'sueno', 'destino', p_nombre)) then
      v_nuevas := v_nuevas + 1;
    else
      v_ya := v_ya + 1;
    end if;
  end loop;
  return jsonb_build_object('avisadas', v_nuevas, 'ya_avisadas', v_ya);
end $$;

revoke all on function public.panel_suenos(date, date, integer) from public, anon, authenticated;
revoke all on function public.panel_sueno_avisar(text, text, text, text) from public, anon, authenticated;
grant execute on function public.panel_suenos(date, date, integer) to service_role;
grant execute on function public.panel_sueno_avisar(text, text, text, text) to service_role;
-- ===== FIN BLOQUE B =====

commit;
