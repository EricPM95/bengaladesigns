-- TANDA 8A2 (docs/dias/INFORME_TANDA8A2.md). Una sola migración, en una sola transacción.
--
-- SIN APLICAR EN PRODUCCIÓN. Va DESPUÉS de la 0023 (orden de todas las pendientes: 0020 y 0021 juntas → 0022 → 0023 → 0024). Hasta que se aplique, los interruptores
-- de las cuentas y los logros tienen que seguir apagados.
--
-- Qué hace, en palabras sencillas:
--   * `hoy_prueba`: la prueba de HOY. UNA por cuenta, para siempre (antes se pensó una por destino). Mientras no se gasta no se guarda nada: el día de prueba se calcula cada
--     vez con el vuelo que haya puesto. Se guarda cuando se gasta (al tocar [Visto] o [Cómo llegar]) o cuando la pasa a mañana.
--   * `trips.guardado_en`: «Sustituir el anterior» no borra. El viaje de antes pasa a «Viajes guardados» (con esta fecha); quitarla lo devuelve a «Mis viajes».
--   * Los pases NO llevan reglas de plazas en la base de datos: cuántas plazas tiene cada pase y su precio los valida el servidor al crearlo (data/pase/precios.json: 1 persona, Dúo de 2,
--     Grupo de 3 a 50). Una regla en la base chocaría con `preparar_borrado`, que baja las plazas de un pase cuando alguien se borra. Paga todo el que compra: los invitados
--     entran con su plaza sin pagar (no hay nada en la base de datos para que cada uno pague su parte).
--   * `trip_recommendations`: fuera el estado «ya no encaja». El administrador siempre puede aceptar una recomendación (sustituye a lo que tiene ahora) o rechazarla.
--   * `reclamar_anonimo_logros`: ahora también pasa la prueba de HOY (si la gastó desde el móvil con sesión anónima, la cuenta no recupera otra).

begin;

-- ── La prueba de HOY, una por cuenta ───────────────────────────────────────────────────────

create table if not exists public.hoy_prueba (
  user_id uuid primary key references auth.users (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  -- El día de la prueba: el que ha gastado o el que ha pasado a «mañana».
  fecha date not null,
  gastada_en timestamptz,
  -- Eligió [Mañana] en «Te queda medio día…»: el día ya no se recalcula.
  pospuesta boolean not null default false,
  -- La pregunta de las 12:00 se hace una sola vez en la vida.
  pregunta_hecha boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hoy_prueba enable row level security;
drop policy if exists "hoy_prueba select own" on public.hoy_prueba;
create policy "hoy_prueba select own" on public.hoy_prueba for select to authenticated using (user_id = auth.uid());
-- Sin políticas de escritura: solo el servidor gasta o aplaza la prueba.

-- ── «Sustituir el anterior» no borra ─────────────────────────────────────────────────────

alter table public.trips add column if not exists guardado_en timestamptz;

-- ── Recomendaciones: fuera «ya no encaja» ───────────────────────────────────────────────────

update public.trip_recommendations set estado = 'pendiente' where estado = 'ya_no_encaja';
alter table public.trip_recommendations drop constraint if exists trip_recommendations_estado_check;
alter table public.trip_recommendations
  add constraint trip_recommendations_estado_check check (estado in ('pendiente', 'aceptada', 'rechazada'));

-- ── Entrar con una cuenta que ya existía: también pasa la prueba de HOY ──────────────────────────────

create or replace function public.reclamar_anonimo_logros(p_viejo uuid, p_nuevo uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  n_hechos int := 0; n_push int := 0;
begin
  if p_viejo is null or p_nuevo is null or p_viejo = p_nuevo then
    raise exception 'Las dos cuentas tienen que ser distintas.';
  end if;
  update public.logro_hechos h set user_id = p_nuevo
  where h.user_id = p_viejo
    and not (h.tipo = 'visto' and h.deshecho_en is null and exists (
      select 1 from public.logro_hechos n
      where n.user_id = p_nuevo and n.tipo = 'visto' and n.deshecho_en is null and n.trip_id is not distinct from h.trip_id and coalesce(n.stop_id, n.sitio) = coalesce(h.stop_id, h.sitio)));
  get diagnostics n_hechos = row_count;
  insert into public.logro_perfil (user_id, previos, vitrina)
    select p_nuevo, previos, vitrina from public.logro_perfil where user_id = p_viejo
    on conflict (user_id) do nothing;
  -- Una prueba por cuenta, para siempre: si la gastó con la sesión anónima, la cuenta no recupera otra. Si la cuenta ya la había gastado, manda la suya.
  insert into public.hoy_prueba (user_id, trip_id, fecha, gastada_en, pospuesta, pregunta_hecha)
    select p_nuevo, trip_id, fecha, gastada_en, pospuesta, pregunta_hecha from public.hoy_prueba where user_id = p_viejo
    on conflict (user_id) do update
      set trip_id = excluded.trip_id, fecha = excluded.fecha, gastada_en = excluded.gastada_en, pospuesta = excluded.pospuesta, pregunta_hecha = excluded.pregunta_hecha, updated_at = now()
      where public.hoy_prueba.gastada_en is null and excluded.gastada_en is not null;
  update public.push_suscripciones set user_id = p_nuevo where user_id = p_viejo
    and endpoint not in (select endpoint from public.push_suscripciones where user_id = p_nuevo);
  get diagnostics n_push = row_count;
  return jsonb_build_object('hechos', n_hechos, 'avisos_movil', n_push);
end $$;
revoke all on function public.reclamar_anonimo_logros(uuid, uuid) from public;
revoke all on function public.reclamar_anonimo_logros(uuid, uuid) from anon, authenticated;
grant execute on function public.reclamar_anonimo_logros(uuid, uuid) to service_role;

commit;
