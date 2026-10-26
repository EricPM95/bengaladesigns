-- 0033 · La historia de prueba (Tanda 10P, 1.1). La 0034 la usa el sorteo/perfil.
--
-- QUÉ HACE. Sin el pase, cada viajero tiene UNA historia de prueba gratis por destino (una en Roma, otra en París…): la del sitio que elija; se gasta a los 3 segundos de escucharla y esa se queda suya.
-- Esta tabla guarda cuál es, en la CUENTA (no solo en el móvil): al entrar desde otro móvil sigue siendo la misma.
--
-- Quién ve qué: cada persona solo ve e inserta lo suyo. NO hay política de cambiar ni de borrar: elegida una, no se puede cambiar desde el móvil (la unicidad por destino lo refuerza).
--
-- Se aplica a mano en el SQL editor de Supabase. SIN aplicar, la app funciona igual: la historia de prueba se guarda solo en el móvil (localStorage) y se sube a la cuenta cuando la tabla exista.

create table if not exists public.historia_de_prueba (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  destino text not null,          -- el destino en minúsculas, sin espacios de más («roma»)
  sitio text not null,            -- el sitio en minúsculas, sin espacios de más («galería borghese»)
  nombre text not null,           -- el nombre tal cual se enseña («Galería Borghese»)
  gastada_en timestamptz not null default now(),
  primary key (user_id, destino)
);
alter table public.historia_de_prueba enable row level security;

drop policy if exists "historia_de_prueba select own" on public.historia_de_prueba;
create policy "historia_de_prueba select own" on public.historia_de_prueba for select to anon, authenticated using (user_id = auth.uid());
drop policy if exists "historia_de_prueba insert own" on public.historia_de_prueba;
create policy "historia_de_prueba insert own" on public.historia_de_prueba for insert to anon, authenticated with check (user_id = auth.uid());
