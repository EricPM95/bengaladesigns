-- Comprueba la migración 0080 (la posición del globo de la tarjeta «Mi pasaporte»). Debe devolver una fila con columna_existe = true.
select exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'travelers' and column_name = 'globo_pasaporte' and data_type = 'jsonb'
) as columna_existe;
