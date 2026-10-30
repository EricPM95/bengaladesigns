-- Comprobación de la migración 0070 (el billete de cada persona, privado). Pégala en el SQL editor de Supabase: devuelve «Aplicada» o «FALTA».
select case
  when to_regclass('public.billetes_personales') is not null
   and (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'billetes_personales' and column_name in ('trip_id', 'user_id', 'datos', 'actualizado_en')) = 4
   and coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.billetes_personales')), false)
   and (select count(*) from pg_policies where schemaname = 'public' and tablename = 'billetes_personales') = 4
  then 'Aplicada'
  else 'FALTA'
end as migracion_0070;

-- Cuántas personas tienen billete guardado (no enseña los datos de nadie):
-- select count(*) from public.billetes_personales;
