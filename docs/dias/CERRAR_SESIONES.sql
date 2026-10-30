-- Cierra TODAS las sesiones de una cuenta (sus llaves actuales dejan de valer; la persona vuelve a entrar con Google).
-- Se pega en Supabase > SQL editor, cambiando <TU CORREO> por el correo de la cuenta. Se puede repetir.
-- No toca los datos, ni los viajes, ni la identidad de Google de la cuenta: solo borra las sesiones y las llaves de renovación.
-- (Hecho el 30-oct para la cuenta principal de Eric, porque pegó por error una dirección con sus llaves en un chat privado.)
with cuenta as (
  select id from auth.users where lower(email) = lower('<TU CORREO>')
), llaves as (
  delete from auth.refresh_tokens where user_id in (select id::text from cuenta) returning 1
), sesiones as (
  delete from auth.sessions where user_id in (select id from cuenta) returning 1
)
select (select count(*) from cuenta) as cuentas, (select count(*) from llaves) as llaves_borradas, (select count(*) from sesiones) as sesiones_cerradas;
