-- Comprobar la 0088 (solo lee; pegar en el SQL editor de Supabase). Tiene que salir una sola fila con migracion_0088 = 'Aplicada'.
select case
  when exists (select 1 from pg_proc p where p.proname = 'canjear_invitacion' and pg_get_functiondef(p.oid) like '%plaza_dada%')
   and exists (select 1 from pg_proc where proname = 'dar_plaza_del_pase')
   and exists (select 1 from pg_proc where proname = 'plazas_sin_dar')
   and exists (select 1 from pg_trigger where tgname = 'pass_members_avisar' and not tgisinternal)
  then 'Aplicada' else 'FALTA' end as migracion_0088;
