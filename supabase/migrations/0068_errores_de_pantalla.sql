-- 0068 · Los errores de pantalla («Algo ha ido mal»), 10S2.
-- Guarda QUÉ ha fallado y EN QUÉ pantalla, sin datos privados (no hay id de persona, ni correo, ni IP: el servidor tacha correos, tokens y claves y recorta los textos).
-- Solo escribe y lee el servidor con la clave de servicio: RLS encendido y ninguna política. Idempotente (se puede pegar entera y repetir).
create table if not exists public.errores_pantalla (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  pantalla text not null,
  mensaje text not null,
  pila text not null default '',
  componentes text not null default '',
  ruta text not null default '',
  version text not null default '',
  navegador text not null default ''
);
alter table public.errores_pantalla enable row level security;
-- (sin políticas: ni la app ni nadie con la clave pública puede leer ni escribir aquí)
create index if not exists errores_pantalla_creado_idx on public.errores_pantalla (creado desc);
comment on table public.errores_pantalla is 'Avisos de «Algo ha ido mal» (ErrorBoundary): pantalla, mensaje y pila, sin datos privados. Ver los últimos: select creado, pantalla, mensaje, ruta, left(pila, 300) from public.errores_pantalla order by creado desc limit 50;';
