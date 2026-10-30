-- 0069 · «Propón un sitio» (10S5): lo que el viajero propone para que lo añadamos a JUTRIP.
-- Guarda el NOMBRE del sitio, el comentario (opcional), el DESTINO (la ciudad del viaje), la FECHA y desde qué pantalla se envió. Sin datos privados: no hay id de persona, ni correo, ni IP
-- (el servidor tacha correos, tokens y claves y recorta los textos). Solo escribe y lee el servidor con la clave de servicio: RLS encendido y ninguna política.
-- Idempotente (se puede pegar entera y repetir).
create table if not exists public.propuestas_de_sitio (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  nombre text not null,
  comentario text not null default '',
  destino text not null default '',
  origen text not null default ''
);
alter table public.propuestas_de_sitio enable row level security;
-- (sin políticas: ni la app ni nadie con la clave pública puede leer ni escribir aquí)
create index if not exists propuestas_de_sitio_creado_idx on public.propuestas_de_sitio (creado desc);
comment on table public.propuestas_de_sitio is 'Sitios propuestos por los viajeros desde «Propón un sitio». Ver los últimos: select creado, destino, nombre, comentario, origen from public.propuestas_de_sitio order by creado desc limit 50;';
