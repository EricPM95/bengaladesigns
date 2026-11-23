-- 0094 · LA EDAD POR FRANJAS (V41). SIN APLICAR: se aplica a mano en el SQL editor de Supabase (se puede pegar entera y repetir: no duplica ni borra nada). Va DESPUÉS de la 0093. Comprobación: docs/dias/COMPROBAR_0094.sql (una sola fila, `todo` en true).
--
-- Cuándo y por qué (23-nov-2026, tanda V41): la primera vez ya no pregunta «¿En qué año naciste?» (pedía demasiado) sino «¿Cuántos años tienes?», con seis franjas: 18-24, 25-34, 35-44, 45-54, 55-64 y 65 o más.
--
-- En palabras sencillas:
--   · Columna nueva en `viajero_primera_vez` (la tabla de siempre, una fila por persona): `franja_edad`, texto, solo puede valer '18-24', '25-34', '35-44', '45-54', '55-64' o '65+' (o quedar vacía).
--   · Quien contestó antes con su AÑO de nacimiento pasa a su franja con la edad de HOY (año actual − año de nacimiento, sin mirar el mes). Quien hoy tendría menos de 18 años se queda SIN franja (vacía): no hay franja «menos de 18».
--   · `anio_nacimiento` NO se borra (no se pierde nada): simplemente deja de pedirse y de enseñarse. Ya no se escribe nunca desde la app.
--   · Es una columna de una tabla que YA está en el inventario de `empezar_de_cero` y de «Borrar mi cuenta» (el borrado quita la fila entera): por eso NO se vuelve a crear `empezar_de_cero` (queda la última versión, la de la 0091, sin cambios).
--   · Las políticas de la tabla (cada persona ve, crea y cambia SOLO su fila) no cambian: la columna nueva queda dentro de ellas.
--
-- SI NO SE APLICA: la app funciona igual. La pregunta de la edad sale y se contesta, pero la franja no se guarda (el servidor lo detecta y guarda lo demás). El panel saca la franja de quien tenga año de nacimiento antiguo.
begin;

alter table public.viajero_primera_vez add column if not exists franja_edad text check (franja_edad is null or franja_edad in ('18-24', '25-34', '35-44', '45-54', '55-64', '65+'));

-- Las respuestas viejas (con año) pasan a su franja. Solo toca filas que aún no tienen franja: si se repite, no pisa lo que la persona haya contestado después.
update public.viajero_primera_vez
set franja_edad = case
  when extract(year from now())::integer - anio_nacimiento < 18 then null
  when extract(year from now())::integer - anio_nacimiento <= 24 then '18-24'
  when extract(year from now())::integer - anio_nacimiento <= 34 then '25-34'
  when extract(year from now())::integer - anio_nacimiento <= 44 then '35-44'
  when extract(year from now())::integer - anio_nacimiento <= 54 then '45-54'
  when extract(year from now())::integer - anio_nacimiento <= 64 then '55-64'
  else '65+'
end
where franja_edad is null and anio_nacimiento is not null;

commit;
