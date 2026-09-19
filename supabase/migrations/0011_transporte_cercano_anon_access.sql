-- Fix: 0005_transporte_cercano.sql restringía las políticas a "authenticated", el mismo bug que
-- 0004_tips_anclas.sql tuvo y 0005_tips_anclas_anon_access.sql corrigió — server/index.js lee/escribe
-- esta tabla con la clave anónima SIN iniciar sesión (createClient sin signInAnonymously), eso es el
-- rol "anon" de Supabase, no "authenticated", así que las políticas bloqueaban siempre la lectura/
-- escritura desde el servidor. Confirmado en directo (Fix 7/investigación de coste): cada apertura
-- de una parada repetía la llamada completa a Claude + búsqueda web a transporte-cercano (~0,08€ cada
-- vez) porque el insert fallaba con "new row violates row-level security policy" y por tanto el
-- select nunca encontraba nada cacheado. zona_restaurantes/zona_turistica/place_content_cache (tablas
-- gemelas, mismo patrón de caché) ya incluían "anon" desde su creación — transporte_cercano se quedó
-- atrás. Se sustituyen las políticas por las mismas cubriendo también "anon" — sin datos personales,
-- no hace falta una identidad concreta, solo impedir update/delete, que ninguna de las dos permite.
drop policy if exists "transporte_cercano select all" on public.transporte_cercano;
drop policy if exists "transporte_cercano insert all" on public.transporte_cercano;

create policy "transporte_cercano select all" on public.transporte_cercano
  for select to anon, authenticated using (true);

create policy "transporte_cercano insert all" on public.transporte_cercano
  for insert to anon, authenticated with check (true);
