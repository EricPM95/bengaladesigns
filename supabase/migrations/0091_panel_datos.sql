-- 0091 · LOS DATOS NUEVOS DEL PANEL (V35B). SIN APLICAR en producción: la aplica Eric a mano en el SQL editor de Supabase (se puede pegar entera y repetir). Va DESPUÉS de la 0090. Comprobación: docs/dias/COMPROBAR_0091.sql (una sola fila, todo en true).
--
-- En palabras sencillas, qué guarda esto:
--   1. PAGOS: quién pagó cada pase (`user_id`), la comisión de Stripe de cada cobro (`comision_cent`) y cuánto se devolvió (`devuelto_cent`). Para anotarlo, dos funciones solo del servidor: `pago_anotar` y `pago_anotar_devolucion`.
--      OJO (contabilidad): el registro de pagos hay que guardarlo AÑOS. `empezar_de_cero` NO lo borra y `pagos_registro.user_id` NO lleva clave a `auth.users` (si la persona borra su cuenta, el cobro y su identificador se quedan,
--      como ya pasaba con el cobro). Eric lo confirmará con el gestor: si hubiera que desvincular a la persona al borrar la cuenta, bastaría con poner `user_id` a null.
--   2. PRÓXIMAMENTE: `destinos_proximamente`, los destinos que salen en gris en el mapa (hoy Florencia, Berlín y Cartagena de Indias, de data/primera_vez/destinos.json). Si la tabla no existe, la app sigue leyendo el JSON.
--   3. PAÍS: `viajero_primera_vez.pais_vive`, el país donde vive cada persona (código de 2 letras; opcional).
--   4. USO: `uso_diario`, un día activo por cuenta (fecha, sin hora), el aparato (iPhone, Android u ordenador, sin modelo) y si usa la app instalada o el navegador. Nada más: ni IP, ni ubicación, ni navegador exacto.
--      Es una tabla con datos de una persona (columna `user_id`): entra en el inventario de `empezar_de_cero`.
--   5. AFILIADOS: `afiliados_clics`, los clics en «Reservar» (Civitatis y Stay22), contados por día, destino y tipo. SIN saber quién (ni cuenta ni IP).
--   6. CUENTAS DE PRUEBA: `cuentas_de_prueba`, los correos que no cuentan en las cifras del panel. Va por correo (sin clave a la cuenta) para que «Empezar de cero» no la desmarque. Se marca ya `bengala.ingresos+pruebas1@gmail.com`.
--
-- `empezar_de_cero`: esta migración NO edita ninguna anterior; parte de su ÚLTIMA versión (la de la 0089: 0032 → 0037 → 0040 → 0071 → 0072 → 0074 → 0086 → 0089) e idéntica a ella salvo UNA línea más en el inventario: ('uso_diario', 'user_id').
-- Se quedan SIEMPRE (no entran en el inventario): pagos_registro (contabilidad), cuentas_de_prueba, afiliados_clics y destinos_proximamente (no son de ninguna persona).
-- SI NO SE APLICA: la app funciona igual (el panel enseña «Pronto» en lo que falta y el mapa lee el JSON); solo no se guardan estos datos nuevos.
begin;

-- ── 1. Pagos ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
alter table public.pagos_registro add column if not exists user_id uuid;
alter table public.pagos_registro add column if not exists comision_cent integer check (comision_cent is null or comision_cent >= 0);
alter table public.pagos_registro add column if not exists devuelto_cent integer check (devuelto_cent is null or devuelto_cent >= 0);
create index if not exists pagos_registro_user_idx on public.pagos_registro (user_id);

-- Apunta quién pagó y la comisión de un cobro ya registrado (solo el servidor). No pisa lo que ya hubiera.
create or replace function public.pago_anotar(p_pago_ref text, p_comprador uuid, p_comision_cent integer) returns void
language sql security definer set search_path = public as $$
  update public.pagos_registro
     set user_id = coalesce(user_id, p_comprador), comision_cent = coalesce(comision_cent, p_comision_cent)
   where pago_ref = p_pago_ref
$$;
-- Apunta cuánto se devolvió (la devolución puede llegar entera o por partes): el último total manda.
create or replace function public.pago_anotar_devolucion(p_ref text, p_devuelto_cent integer) returns void
language sql security definer set search_path = public as $$
  update public.pagos_registro
     set devuelto_cent = greatest(coalesce(devuelto_cent, 0), coalesce(p_devuelto_cent, 0))
   where pago_ref = p_ref or intencion_ref = p_ref
$$;

-- ── 2. Próximamente ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.destinos_proximamente (
  clave text primary key,
  nombre text not null,
  pais text not null,
  iso text not null default '',
  continente text not null default '',
  lat double precision,
  lng double precision,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);
alter table public.destinos_proximamente enable row level security;
drop policy if exists "destinos_proximamente lectura" on public.destinos_proximamente;
create policy "destinos_proximamente lectura" on public.destinos_proximamente for select to anon, authenticated using (true);
insert into public.destinos_proximamente (clave, nombre, pais, iso, continente, lat, lng, orden) values
  ('florencia', 'Florencia', 'Italia', 'it', 'Europa', 43.7696, 11.2558, 1),
  ('berlin', 'Berlín', 'Alemania', 'de', 'Europa', 52.52, 13.405, 2),
  ('cartagena_de_indias', 'Cartagena de Indias', 'Colombia', 'co', 'América y Caribe', 10.391, -75.4794, 3)
on conflict (clave) do nothing;

-- ── 3. País donde vive ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
alter table public.viajero_primera_vez add column if not exists pais_vive text check (pais_vive is null or pais_vive ~ '^[A-Z]{2}$');

-- ── 4. Uso de la app ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.uso_diario (
  user_id uuid not null references auth.users (id) on delete cascade,
  dia date not null,
  aparato text not null check (aparato in ('iphone', 'android', 'ordenador')),
  instalada boolean not null default false,
  primary key (user_id, dia)
);
alter table public.uso_diario enable row level security;
revoke all on public.uso_diario from anon, authenticated;
-- (sin políticas: solo el servidor, con la clave de servicio, escribe y lee)
create or replace function public.uso_anotar(p_uid uuid, p_aparato text, p_instalada boolean) returns void
language sql security definer set search_path = public as $$
  insert into public.uso_diario (user_id, dia, aparato, instalada)
  select p_uid, (now() at time zone 'Europe/Madrid')::date, p_aparato, coalesce(p_instalada, false)
   where p_aparato in ('iphone', 'android', 'ordenador') and exists (select 1 from auth.users where id = p_uid)
  on conflict (user_id, dia) do update set aparato = excluded.aparato, instalada = excluded.instalada
$$;

-- ── 5. Clics de afiliados (sin saber quién) ─────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.afiliados_clics (
  dia date not null,
  destino text not null,
  tipo text not null check (tipo in ('actividad', 'hotel')),
  proveedor text not null check (proveedor in ('civitatis', 'stay22')),
  clics integer not null default 0 check (clics >= 0),
  primary key (dia, destino, tipo, proveedor)
);
alter table public.afiliados_clics enable row level security;
revoke all on public.afiliados_clics from anon, authenticated;
create or replace function public.afiliado_clic(p_destino text, p_tipo text, p_proveedor text) returns void
language sql security definer set search_path = public as $$
  insert into public.afiliados_clics (dia, destino, tipo, proveedor, clics)
  select (now() at time zone 'Europe/Madrid')::date, left(trim(p_destino), 60), p_tipo, p_proveedor, 1
   where p_tipo in ('actividad', 'hotel') and p_proveedor in ('civitatis', 'stay22') and length(trim(coalesce(p_destino, ''))) > 0
  on conflict (dia, destino, tipo, proveedor) do update set clics = public.afiliados_clics.clics + 1
$$;

-- ── 6. Cuentas de prueba ────────────────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.cuentas_de_prueba (
  email text primary key check (email = lower(email)),
  marcado_en timestamptz not null default now()
);
alter table public.cuentas_de_prueba enable row level security;
revoke all on public.cuentas_de_prueba from anon, authenticated;
insert into public.cuentas_de_prueba (email) values ('bengala.ingresos+pruebas1@gmail.com') on conflict (email) do nothing;

revoke all on function public.pago_anotar(text, uuid, integer) from public, anon, authenticated;
revoke all on function public.pago_anotar_devolucion(text, integer) from public, anon, authenticated;
revoke all on function public.uso_anotar(uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.afiliado_clic(text, text, text) from public, anon, authenticated;
grant execute on function public.pago_anotar(text, uuid, integer) to service_role;
grant execute on function public.pago_anotar_devolucion(text, integer) to service_role;
grant execute on function public.uso_anotar(uuid, text, boolean) to service_role;
grant execute on function public.afiliado_clic(text, text, text) to service_role;

-- ── 7. Empezar de cero (partiendo de la ÚLTIMA versión: la 0089; la única diferencia es la línea de `uso_diario`) ────────────────────
create or replace function public.empezar_de_cero(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_res jsonb := '{}'::jsonb;
  v_n integer;
  v_par record;
  v_traspaso jsonb;
begin
  if p_uid is null then raise exception 'Falta la cuenta.'; end if;
  if not exists (select 1 from auth.users where id = p_uid) then raise exception 'Esa cuenta no existe.'; end if;

  -- 1. Lo compartido pasa a los demás antes de borrar nada.
  v_traspaso := public.preparar_borrado(p_uid);

  -- 2. Lo de la cuenta, tabla a tabla y siempre por su columna de dueño. Las dependencias van antes que de lo que dependen (los viajes, de los últimos).
  for v_par in
    select * from (values
      ('stop_visits', 'user_id'),
      ('trip_photo_meta', 'user_id'),
      ('trip_photos', 'user_id'),
      ('logro_hechos', 'user_id'),
      ('achievements', 'user_id'),
      ('logro_avisos', 'user_id'),
      ('logro_perfil', 'user_id'),
      ('push_suscripciones', 'user_id'),
      ('logro_referidos', 'invitador_id'),
      ('avisos', 'user_id'),
      ('avisos_viaje_enviados', 'user_id'),
      ('avisos_de_viajeros', 'user_id'),
      ('viajero_primera_vez', 'user_id'),
      ('uso_diario', 'user_id'),
      ('avisos_destino', 'user_id'),
      ('place_likes', 'user_id'),
      ('admin_sin_pase', 'user_id'),
      ('trip_recommendations', 'author_id'),
      ('trip_gastos', 'autor_id'),
      ('trip_pagos', 'marcado_por'),
      ('trip_invitations', 'creada_por'),
      ('trip_members', 'user_id'),
      ('trip_ex_miembros', 'user_id'),
      ('pass_members', 'user_id'),
      ('passes', 'comprador_id'),
      ('billetes_personales', 'user_id'),
      ('lo_suyo_del_viaje', 'user_id'),
      ('reservas_invitado', 'user_id'),
      ('reservas_privadas_admin', 'user_id'),
      ('trips', 'traveler_id'),
      ('fotos_por_borrar', 'user_id')
    ) as t (tabla, columna)
  loop
    if to_regclass('public.' || v_par.tabla) is not null then
      execute format('delete from public.%I where %I = $1', v_par.tabla, v_par.columna) using p_uid;
      get diagnostics v_n = row_count;
      v_res := v_res || jsonb_build_object(v_par.tabla, v_n);
    end if;
  end loop;

  return jsonb_build_object('borrados', v_res, 'traspasado', v_traspaso);
end $$;

revoke all on function public.empezar_de_cero(uuid) from public, anon, authenticated;
grant execute on function public.empezar_de_cero(uuid) to service_role;

commit;
