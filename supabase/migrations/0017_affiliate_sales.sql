-- Ventas del afiliado unidas a un viaje por su código de campaña (PARA_CODE_RESERVAS, 5).
-- Cada viaje lleva un código al azar (`app-8F3K2`, nada del viajero dentro) en todos los enlaces de «Reservar»; cuando llega una venta con ese código
-- (de la API o del informe de ventas del afiliado) se guarda aquí y la app la ofrece al viajero («Hemos visto que has reservado…»).
-- Sin datos personales: producto, fecha, hora, personas y número de reserva.
--
-- SIN políticas para anon ni authenticated: solo el servidor, con su clave de servicio (SUPABASE_SERVICE_ROLE_KEY), lee y escribe. Hasta que esté
-- esa clave en el servidor, las ventas se guardan en memoria (desarrollo y pruebas). MIGRACIÓN SIN APLICAR: se aplica a mano en Supabase.
create table if not exists public.affiliate_sales (
  id uuid primary key default gen_random_uuid(),
  campaign text not null,
  sale_id text not null,
  product text not null,
  activity_date date not null,
  activity_time text,
  people integer,
  locator text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (sale_id)
);

create index if not exists affiliate_sales_campaign_idx on public.affiliate_sales (campaign);

alter table public.affiliate_sales enable row level security;
