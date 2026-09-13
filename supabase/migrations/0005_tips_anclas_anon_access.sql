-- Fix: 0004_tips_anclas.sql restringía las políticas a "authenticated", pero server/index.js lee/
-- escribe esta tabla con la clave anónima SIN iniciar sesión (createClient sin signInAnonymously) —
-- eso es el rol "anon" de Supabase, no "authenticated", así que esas políticas bloqueaban siempre la
-- lectura/escritura desde el servidor (confirmado: verificado en directo, cero errores de red, pero
-- 0 filas visibles y el caché nunca se usaba). Se sustituyen por las mismas políticas cubriendo
-- también "anon" — tips_anclas no tiene datos personales, así que no hace falta una identidad
-- concreta, solo impedir update/delete, que ninguna de las dos políticas permite.
drop policy if exists "tips_anclas select all" on public.tips_anclas;
drop policy if exists "tips_anclas insert all" on public.tips_anclas;

create policy "tips_anclas select all" on public.tips_anclas
  for select to anon, authenticated using (true);

create policy "tips_anclas insert all" on public.tips_anclas
  for insert to anon, authenticated with check (true);
