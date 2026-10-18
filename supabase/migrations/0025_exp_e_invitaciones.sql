-- LA EXPERIENCIA (EXP) Y LAS INVITACIONES, TANDA 8C1 (docs/dias/INFORME_TANDA8C1.md y docs/dias/EXP_Y_NIVELES.md). Una sola migración, en una sola transacción.
--
-- SIN APLICAR EN PRODUCCIÓN. Va DESPUÉS de la 0023 (logros) y la 0024 (puede ir antes o después de la 0024: no depende de ella). Hasta que se aplique, los logros siguen
-- detrás de su interruptor apagado y el servidor funciona igual: sin esta migración, la EXP se calcula siempre desde los hechos (no se guarda el máximo ni hay invitaciones).
--
-- Qué hace, en palabras sencillas:
--   * `logro_perfil.exp_max`: la mayor EXP que ha tenido esa persona. La EXP se calcula siempre desde lo conseguido (`logro_hechos` y `achievements`), pero NUNCA baja:
--     si se cambia la tabla de data/logros/exp.json y a alguien le saldría menos, se queda con lo que tenía. Solo la escribe el servidor.
--   * `logro_referidos`: los amigos invitados a la app. La persona que invita gana 100 EXP cuando su amigo ACABA su primer viaje con la app (no al crear la cuenta), con un
--     máximo de 10 amigos al año. Aquí solo se guarda quién invitó a quién; falta el enlace de invitación (ver el informe) que rellene esta tabla al crear la cuenta.

begin;

alter table public.logro_perfil add column if not exists exp_max integer not null default 0 check (exp_max >= 0);

create table if not exists public.logro_referidos (
  id uuid primary key default gen_random_uuid(),
  invitador_id uuid not null references auth.users (id) on delete cascade,
  -- Un amigo solo puede tener un invitador (el primero).
  invitado_id uuid not null unique references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now(),
  -- Cuándo acabó su primer viaje con la app (lo rellena el servidor). Hasta entonces, no da EXP.
  viaje_acabado_en timestamptz,
  check (invitador_id <> invitado_id)
);
create index if not exists idx_logro_referidos_invitador on public.logro_referidos (invitador_id);
alter table public.logro_referidos enable row level security;
drop policy if exists "logro_referidos select invitador" on public.logro_referidos;
create policy "logro_referidos select invitador" on public.logro_referidos for select to authenticated using (invitador_id = auth.uid());
-- Sin políticas de escritura: solo el servidor (clave de servicio) apunta una invitación y la marca como cumplida.

commit;
