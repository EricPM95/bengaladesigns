-- LOS AVISOS DE DESTINOS NUEVOS (Tanda 10, la primera pantalla). Quien escribe un destino que aún no tenemos (por ejemplo «Tokio») puede dejar su email para que le avisemos cuando llegue.
--
-- Se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir: no duplica nada). SIN la tabla, la app no se rompe: el botón [Avísame] dice «No hemos podido guardarlo.
-- Inténtalo más tarde.» y nada se guarda.
--
-- Nadie del móvil la lee ni la escribe: SIN políticas para anon ni authenticated; solo el servidor, con su clave de servicio (SUPABASE_SERVICE_ROLE_KEY).
-- Un aviso por email y destino: la clave única va sobre el email y el destino «limpios» (sin mayúsculas, sin tildes, sin espacios de más), así que «Tokio», «tokio » y «TÓKIO» son el mismo.
-- Qué se guarda: el destino escrito, el email, el idioma de la app, la fecha y, si tenía cuenta, de quién es. Se usa solo para avisar de ese destino (lo dice la página de privacidad).
-- Si borras tu cuenta, tu aviso se borra contigo (`on delete cascade` sobre `auth.users`).

create table if not exists public.avisos_destino (
  id uuid primary key default gen_random_uuid(),
  destino text not null,
  destino_norm text not null,
  email text not null,
  email_norm text not null,
  idioma text not null default 'es',
  user_id uuid references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now(),
  constraint avisos_destino_unico unique (email_norm, destino_norm),
  constraint avisos_destino_largos check (char_length(destino) between 2 and 80 and char_length(email) between 5 and 254)
);

create index if not exists idx_avisos_destino_destino on public.avisos_destino (destino_norm);

alter table public.avisos_destino enable row level security;
revoke all on table public.avisos_destino from anon, authenticated;
