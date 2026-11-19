-- 0085 · «CUÉNTANOS» (V20): los avisos que manda el viajero (restaurante, lugar, destino, foto, dato mal, consejo, algo no funciona, idea). SIN APLICAR: se aplica a mano en el SQL editor de Supabase
-- (se puede pegar entera y repetir). Comprobación: docs/dias/COMPROBAR_0085.sql. Después, la 0086 (empezar_de_cero con la tabla nueva).
--
-- Qué hace: (1) la tabla `avisos_de_viajeros` (RLS encendido y SIN políticas: solo el servidor, con la clave de servicio, la toca); (2) dos almacenes: `avisos-viajeros` (PRIVADO: fotos y capturas que manda la gente,
-- solo se ven con una dirección firmada que da el servidor a un administrador) y `fotos-de-viajeros` (PÚBLICO, solo lectura: las fotos que un administrador aprueba para la app); (3) un tipo de aviso nuevo en la campana,
-- `gracias_viajero` (payload {texto, tipo, aviso_id}); (4) las funciones que usa el servidor (server/avisosViajeros.js). Todas, solo service_role.
-- PRIVACIDAD: sin cuenta, con sesión anónima o con «avísame» apagado NO se guarda user_id (ni IP, ni nada de la persona). El user_id solo se guarda con cuenta de verdad Y avisame = true, para poder avisarle en la campana.
begin;

-- ── 1. La tabla ─────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.avisos_de_viajeros (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  tipo text not null check (tipo in ('restaurante', 'lugar', 'destino', 'foto', 'dato_mal', 'consejo', 'no_funciona', 'idea')),
  estado text not null default 'nuevo' check (estado in ('nuevo', 'visto', 'hecho', 'descartado', 'usada')),
  datos jsonb not null default '{}'::jsonb,
  destino text,
  trip_id text,
  pantalla text,
  pestana text,
  parada text,
  dia text,
  version_app text,
  dispositivo text,
  navegador text,
  hora_cliente timestamptz,
  punto jsonb,
  fotos text[] not null default '{}',
  captura text,
  errores jsonb,
  avisame boolean not null default false,
  user_id uuid references auth.users (id) on delete cascade,
  aviso_texto text,
  avisado_en timestamptz,
  revisado_en timestamptz,
  foto_aprobada jsonb
);
alter table public.avisos_de_viajeros enable row level security;
-- (sin políticas: ni la app ni nadie con la clave pública puede leer ni escribir aquí)
create index if not exists avisos_de_viajeros_estado_idx on public.avisos_de_viajeros (estado, creado desc);
create index if not exists avisos_de_viajeros_tipo_idx on public.avisos_de_viajeros (tipo, creado desc);
create index if not exists avisos_de_viajeros_destino_idx on public.avisos_de_viajeros (destino);
create index if not exists avisos_de_viajeros_user_idx on public.avisos_de_viajeros (user_id) where user_id is not null;
comment on table public.avisos_de_viajeros is 'Lo que manda el viajero desde «Cuéntanos». Ver los últimos: select creado, tipo, estado, destino, datos from public.avisos_de_viajeros order by creado desc limit 50;';

-- ── 2. Los almacenes ────────────────────────────────────────────────────────────────────────────────────────
-- Privado: sin políticas (ni lectura ni escritura con la clave pública). Se sube con direcciones firmadas de subida que da el servidor.
insert into storage.buckets (id, name, public) values ('avisos-viajeros', 'avisos-viajeros', false) on conflict (id) do nothing;
-- Público: se puede ver por su dirección, pero escribir solo lo hace el servidor (sin políticas de escritura).
insert into storage.buckets (id, name, public) values ('fotos-de-viajeros', 'fotos-de-viajeros', true) on conflict (id) do nothing;

-- ── 3. El tipo de aviso nuevo de la campana (todos los de la 0054 más `gracias_viajero`) ─────────────────────────
alter table public.avisos drop constraint if exists avisos_tipo_check;
alter table public.avisos
  add constraint avisos_tipo_check
  check (tipo in ('recomendacion', 'aceptada', 'rechazada', 'unido', 'd10', 'resumen', 'sorpresas', 'sorteo', 'amigo_viaje',
                  'permiso', 'quitado', 'viaje_cambiado', 'sin_enviar', 'reserva_grupo', 'gasto_pendiente', 'gasto_resuelto', 'pago_marcado', 'cuentas_modo',
                  'gracias_viajero'));

-- ── 4. Funciones del servidor ───────────────────────────────────────────────────────────────────────────────
-- Un destino comparable: minúsculas, sin tildes y sin espacios de más (igual que `limpiar` de server/avisosDestino.js).
create or replace function public.norm_destino_aviso(t text) returns text
language sql immutable as $$
  select btrim(regexp_replace(translate(lower(coalesce(t, '')), 'áéíóúüñàèìòùâêîôûç', 'aeiouunaeiouaeiouc'), '\s+', ' ', 'g'))
$$;

-- Guarda un aviso (el servidor ya lo ha validado y limpiado). Devuelve su id.
create or replace function public.aviso_viajero_guardar(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.avisos_de_viajeros (tipo, datos, destino, trip_id, pantalla, pestana, parada, dia, version_app, dispositivo, navegador, hora_cliente, punto, fotos, captura, errores, avisame, user_id)
  values (
    p ->> 'tipo', coalesce(p -> 'datos', '{}'::jsonb), nullif(p ->> 'destino', ''), nullif(p ->> 'trip_id', ''), nullif(p ->> 'pantalla', ''), nullif(p ->> 'pestana', ''), nullif(p ->> 'parada', ''), nullif(p ->> 'dia', ''),
    nullif(p ->> 'version_app', ''), nullif(p ->> 'dispositivo', ''), nullif(p ->> 'navegador', ''), nullif(p ->> 'hora_cliente', '')::timestamptz,
    case when jsonb_typeof(p -> 'punto') = 'object' then p -> 'punto' end,
    coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(p -> 'fotos') = 'array' then p -> 'fotos' else '[]'::jsonb end)), '{}'),
    nullif(p ->> 'captura', ''), case when jsonb_typeof(p -> 'errores') = 'array' then p -> 'errores' end,
    coalesce((p ->> 'avisame')::boolean, false), nullif(p ->> 'user_id', '')::uuid
  ) returning id into v_id;
  return v_id;
end $$;

-- La lista para el panel de administrador (sin el user_id: solo `con_cuenta`), lo más nuevo arriba, y cuántos hay nuevos.
create or replace function public.avisos_viajeros_listar(p_tipo text, p_destino text, p_estado text, p_limite integer) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(x order by x ->> 'creado' desc) from (
        select (to_jsonb(a) - 'user_id') || jsonb_build_object('con_cuenta', a.user_id is not null) as x
        from public.avisos_de_viajeros a
        where (coalesce(p_tipo, '') = '' or a.tipo = p_tipo)
          and (coalesce(p_estado, '') = '' or a.estado = p_estado)
          and (coalesce(p_destino, '') = '' or public.norm_destino_aviso(a.destino) = public.norm_destino_aviso(p_destino) or public.norm_destino_aviso(a.datos ->> 'destino') = public.norm_destino_aviso(p_destino))
        order by a.creado desc limit greatest(1, least(coalesce(p_limite, 100), 500))
      ) s
    ), '[]'::jsonb),
    'nuevos', (select count(*) from public.avisos_de_viajeros where estado = 'nuevo')
  )
$$;

-- Un aviso suelto (sin el user_id), o null.
create or replace function public.aviso_viajero_obtener(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select (to_jsonb(a) - 'user_id') || jsonb_build_object('con_cuenta', a.user_id is not null) from public.avisos_de_viajeros a where a.id = p_id
$$;

-- Cambia el estado. Si pasa a «hecho» y la persona pidió que le avisen (cuenta de verdad + avisame), le escribe en la campana, UNA sola vez.
create or replace function public.aviso_viajero_marcar(p_id uuid, p_estado text, p_texto text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a public.avisos_de_viajeros;
  v_texto text;
  v_cosa text;
  v_avisado boolean := false;
begin
  if p_estado is null or p_estado not in ('visto', 'hecho', 'descartado', 'usada') then raise exception 'Estado no válido.'; end if;
  select * into a from public.avisos_de_viajeros where id = p_id for update;
  if not found then return jsonb_build_object('encontrado', false, 'avisado', false); end if;
  update public.avisos_de_viajeros set estado = p_estado, revisado_en = now() where id = p_id;
  if p_estado = 'hecho' and a.user_id is not null and a.avisame and a.avisado_en is null then
    v_cosa := coalesce(nullif(btrim(coalesce(a.datos ->> 'sitio', a.datos ->> 'nombre', left(a.datos ->> 'que', 80), left(a.datos ->> 'texto', 80))), ''), 'lo que nos contaste');
    v_texto := coalesce(nullif(btrim(p_texto), ''), case a.tipo
      when 'dato_mal' then format('Gracias a ti, ya está arreglado: %s.', v_cosa)
      when 'consejo' then format('Gracias a ti, ya está arreglado: %s.', v_cosa)
      when 'no_funciona' then format('Gracias a ti, ya está arreglado: %s.', v_cosa)
      when 'restaurante' then format('Hemos añadido %s. ¡Gracias!', v_cosa)
      when 'lugar' then format('Hemos añadido %s. ¡Gracias!', v_cosa)
      when 'idea' then 'Gracias por tu idea: ya la hemos mirado.'
      when 'foto' then 'Tu foto ya está en la app. ¡Gracias!'
      when 'destino' then format('¡%s ya está en JUTRIP! Tú lo pediste.', coalesce(nullif(btrim(a.datos ->> 'destino'), ''), 'Tu destino'))
      else 'Gracias por avisarnos.' end);
    perform public.crear_aviso(a.user_id, 'gracias_viajero', 'viajero:' || p_id::text, jsonb_build_object('texto', v_texto, 'tipo', a.tipo, 'aviso_id', p_id));
    update public.avisos_de_viajeros set avisado_en = now(), aviso_texto = v_texto where id = p_id;
    v_avisado := true;
  end if;
  return jsonb_build_object('encontrado', true, 'avisado', v_avisado);
end $$;

-- Los destinos que pide la gente (tipo «destino»), agrupados por nombre normalizado.
create or replace function public.avisos_viajeros_destinos() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by (x ->> 'cuantos')::int desc, x ->> 'destino'), '[]'::jsonb) from (
    select jsonb_build_object(
      'destino', mode() within group (order by btrim(a.datos ->> 'destino')),
      'cuantos', count(*),
      'pendientes', count(*) filter (where a.estado in ('nuevo', 'visto')),
      'primero', min(a.creado),
      'ultimo', max(a.creado),
      'avisables', count(*) filter (where a.user_id is not null and a.avisame)
    ) as x
    from public.avisos_de_viajeros a
    where a.tipo = 'destino' and a.estado <> 'descartado' and public.norm_destino_aviso(a.datos ->> 'destino') <> ''
    group by public.norm_destino_aviso(a.datos ->> 'destino')
  ) s
$$;

-- «¡Ya está!»: marca como hechos los avisos de ese destino y escribe en la campana de CADA persona que pidió avisame (una vez por persona y destino). Devuelve a cuántas personas ha avisado.
create or replace function public.avisos_viajeros_ya_esta(p_destino text, p_texto text) returns integer
language plpgsql security definer set search_path = public as $$
declare
  r public.avisos_de_viajeros;
  v_norm text := public.norm_destino_aviso(p_destino);
  v_n integer := 0;
begin
  if v_norm = '' then return 0; end if;
  for r in select * from public.avisos_de_viajeros where tipo = 'destino' and estado <> 'descartado' and public.norm_destino_aviso(datos ->> 'destino') = v_norm order by creado for update loop
    update public.avisos_de_viajeros set estado = 'hecho', revisado_en = now() where id = r.id;
    if r.user_id is not null and r.avisame and r.avisado_en is null then
      if public.crear_aviso(r.user_id, 'gracias_viajero', 'destino:' || v_norm, jsonb_build_object('texto', p_texto, 'tipo', 'destino', 'aviso_id', r.id, 'destino', p_destino)) then v_n := v_n + 1; end if;
      update public.avisos_de_viajeros set avisado_en = now(), aviso_texto = p_texto where id = r.id;
    end if;
  end loop;
  return v_n;
end $$;

-- «Usar esta foto»: solo avisos de tipo foto. Guarda la foto aprobada, pasa a «usada» y avisa a la persona (si pidió avisame), una sola vez.
create or replace function public.aviso_viajero_foto_usada(p_id uuid, p_aprobada jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a public.avisos_de_viajeros;
  v_texto text := 'Tu foto ya está en la app. ¡Gracias!';
  v_avisado boolean := false;
begin
  select * into a from public.avisos_de_viajeros where id = p_id for update;
  if not found then return jsonb_build_object('encontrado', false, 'avisado', false); end if;
  if a.tipo <> 'foto' then return jsonb_build_object('encontrado', true, 'tipo_ok', false, 'avisado', false); end if;
  update public.avisos_de_viajeros set estado = 'usada', foto_aprobada = p_aprobada, revisado_en = now() where id = p_id;
  if a.user_id is not null and a.avisame and a.avisado_en is null then
    perform public.crear_aviso(a.user_id, 'gracias_viajero', 'viajero:' || p_id::text, jsonb_build_object('texto', v_texto, 'tipo', 'foto', 'aviso_id', p_id));
    update public.avisos_de_viajeros set avisado_en = now(), aviso_texto = v_texto where id = p_id;
    v_avisado := true;
  end if;
  return jsonb_build_object('encontrado', true, 'tipo_ok', true, 'avisado', v_avisado);
end $$;

-- Las fotos aprobadas de un destino (lectura pública a través del servidor).
create or replace function public.fotos_de_viajeros(p_destino text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('sitio', foto_aprobada ->> 'sitio', 'url', foto_aprobada ->> 'url_publica', 'credito_texto', foto_aprobada ->> 'credito_texto') order by revisado_en desc), '[]'::jsonb)
  from public.avisos_de_viajeros
  where estado = 'usada' and foto_aprobada is not null
    and (coalesce(p_destino, '') = '' or public.norm_destino_aviso(foto_aprobada ->> 'destino') = public.norm_destino_aviso(p_destino))
$$;

revoke all on function public.norm_destino_aviso(text) from public, anon, authenticated;
revoke all on function public.aviso_viajero_guardar(jsonb) from public, anon, authenticated;
revoke all on function public.avisos_viajeros_listar(text, text, text, integer) from public, anon, authenticated;
revoke all on function public.aviso_viajero_obtener(uuid) from public, anon, authenticated;
revoke all on function public.aviso_viajero_marcar(uuid, text, text) from public, anon, authenticated;
revoke all on function public.avisos_viajeros_destinos() from public, anon, authenticated;
revoke all on function public.avisos_viajeros_ya_esta(text, text) from public, anon, authenticated;
revoke all on function public.aviso_viajero_foto_usada(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.fotos_de_viajeros(text) from public, anon, authenticated;
grant execute on function public.norm_destino_aviso(text) to service_role;
grant execute on function public.aviso_viajero_guardar(jsonb) to service_role;
grant execute on function public.avisos_viajeros_listar(text, text, text, integer) to service_role;
grant execute on function public.aviso_viajero_obtener(uuid) to service_role;
grant execute on function public.aviso_viajero_marcar(uuid, text, text) to service_role;
grant execute on function public.avisos_viajeros_destinos() to service_role;
grant execute on function public.avisos_viajeros_ya_esta(text, text) to service_role;
grant execute on function public.aviso_viajero_foto_usada(uuid, jsonb) to service_role;
grant execute on function public.fotos_de_viajeros(text) to service_role;

commit;
