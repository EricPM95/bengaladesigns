-- Comprueba la migración 0081 (los sellos estampados en la cuenta). Debe devolver una fila con columna_existe = true.
select exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'travelers' and column_name = 'sellos_estampados' and data_type = 'jsonb'
) as columna_existe;
