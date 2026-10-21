-- «VERME COMO VIAJERO SIN PASE» (Tanda 10B). Una sola fila por cuenta de administrador: si está encendida, el servidor la trata como a alguien que no ha comprado el pase (lo de pago, cerrado; los avisos que
-- invitan a comprarlo, como los vería cualquiera). Solo para pruebas del administrador: no toca el pase de verdad ni los cobros.
--
-- Se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir: no duplica nada). SIN la tabla, la app no se rompe: el interruptor dice «No se ha podido guardar» y todo queda como siempre.
-- (La 0029 queda reservada para la Tanda 9B.)
--
-- Nadie del móvil la lee ni la escribe: SIN políticas para anon ni authenticated; solo el servidor, con su clave de servicio (SUPABASE_SERVICE_ROLE_KEY). Quién puede encenderla lo decide siempre el servidor
-- (LOGROS_ADMIN_EMAILS): la ruta que la escribe comprueba que la cuenta es de administrador y solo escribe la fila de esa misma cuenta.

create table if not exists public.admin_sin_pase (
  user_id uuid primary key references auth.users (id) on delete cascade,
  activo boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.admin_sin_pase enable row level security;
revoke all on table public.admin_sin_pase from anon, authenticated;
