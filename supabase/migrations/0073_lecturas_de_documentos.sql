-- 0073 · EL CONTADOR DE LECTURAS DE DOCUMENTOS (10S8 §1). Leer una tarjeta de embarque, una entrada o la reserva de un hotel cuesta una llamada a Claude: el servidor deja 10 al día por cuenta.
-- Para que el límite valga también en Vercel (varias instancias, reinicios) el contador vive aquí. Idempotente. NO se borra en «Empezar de cero» (borrarla devolvería las lecturas, igual que las pruebas gastadas):
-- por eso NO se toca `empezar_de_cero` y la tabla va en SE_QUEDA de scripts/destino/pruebaTanda10J.mjs. Se borra con la cuenta (on delete cascade).
-- Sin políticas: con RLS encendido y sin ninguna, solo la clave de servicio del servidor la lee o la escribe.

create table if not exists public.lecturas_de_documentos (
  user_id uuid not null references auth.users (id) on delete cascade,
  dia date not null default current_date,
  n integer not null default 0 check (n >= 0),
  primary key (user_id, dia)
);
alter table public.lecturas_de_documentos enable row level security;

-- Apunta UNA lectura si hoy lleva menos de `p_limite`; devuelve true (puede leer) o false (ya se pasó). Atómica: dos peticiones a la vez no se cuelan.
create or replace function public.registrar_lectura(p_uid uuid, p_limite integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  insert into public.lecturas_de_documentos (user_id, dia, n) values (p_uid, current_date, 1)
  on conflict (user_id, dia) do update set n = public.lecturas_de_documentos.n + 1
    where public.lecturas_de_documentos.n < p_limite
  returning n into v_n;
  return v_n is not null;
end $$;

-- Devuelve la lectura apuntada (si al final no se llamó a Claude: archivo rechazado).
create or replace function public.devolver_lectura(p_uid uuid) returns void
language sql security definer set search_path = public as $$
  update public.lecturas_de_documentos set n = greatest(0, n - 1) where user_id = p_uid and dia = current_date
$$;

revoke all on function public.registrar_lectura(uuid, integer) from public, anon, authenticated;
revoke all on function public.devolver_lectura(uuid) from public, anon, authenticated;
grant execute on function public.registrar_lectura(uuid, integer) to service_role;
grant execute on function public.devolver_lectura(uuid) to service_role;
