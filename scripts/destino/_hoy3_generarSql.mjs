// HOY3: genera docs/dias/HOY3_SQL_PARA_PEGAR.sql (el SQL listo para pegar en el SQL Editor de Supabase) a partir de las migraciones 0074 y 0075 y de sus COMPROBAR. No toca nada más.
//   node scripts/destino/_hoy3_generarSql.mjs
import fs from 'node:fs'

const leer = (f) => fs.readFileSync(f, 'utf8').trim()
const salida = `-- HOY3 · LOS AVISOS DEL VIAJE CON EL MÓVIL BLOQUEADO · SQL LISTO PARA PEGAR (5-nov-2026)
-- Se pega en el SQL Editor de Supabase, por pasos (cada paso se puede repetir sin romper nada). Orden: 1 → 2 → 3 → 4.
--
--   ANTES DE EMPEZAR (una vez, a mano en el panel de Supabase):  Database › Extensions › activar «pg_cron» y «pg_net».
--   EN VERCEL (si no están ya): PUSH_ACTIVO=true, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACTO (mailto:…) y CRON_SECRET (una clave larga inventada por Eric). Después, redesplegar.
--   NUNCA pegues una clave en un chat ni en un archivo del proyecto: los valores del paso 2 los escribe Eric directamente aquí, en el SQL Editor.
--
-- ═══════════════════════════════════════════════════ PASO 1 · la migración 0074 (tabla de avisos mandados + funciones + empezar_de_cero) ═══════════════════════════════════════════════════

${leer('supabase/migrations/0074_avisos_del_viaje.sql')}

-- Comprobación del paso 1 (tiene que salir «Aplicada»):
${leer('docs/dias/COMPROBAR_0074.sql')}

-- ═══════════════════════════════════════════════════ PASO 2 · los dos secretos del Vault (SOLO una vez, con TUS valores) ═══════════════════════════════════════════════════
-- La dirección de la API y la clave del cron NO están en ningún archivo del proyecto: viven en el Vault de Supabase. Quita los dos «--» de cada línea, escribe tus valores entre las comillas y ejecútalo UNA vez.
--   · avisos_viaje_url   = la dirección completa de la API: https://<tu-dominio>/api/cron/avisos-viaje
--   · avisos_viaje_clave = EXACTAMENTE el mismo valor que CRON_SECRET en Vercel
-- (También se pueden crear a mano en Supabase › Project Settings › Vault › Add new secret, con esos dos nombres.)
-- Para cambiar uno después: select vault.update_secret((select id from vault.secrets where name = 'avisos_viaje_clave'), 'el-valor-nuevo');
--
-- select vault.create_secret('https://<tu-dominio>/api/cron/avisos-viaje', 'avisos_viaje_url');
-- select vault.create_secret('<el mismo valor que CRON_SECRET en Vercel>', 'avisos_viaje_clave');

-- ═══════════════════════════════════════════════════ PASO 3 · la migración 0075 (el planificador: cada minuto, pg_cron + pg_net) ═══════════════════════════════════════════════════

${leer('supabase/migrations/0075_planificador_avisos_viaje.sql')}

-- ═══════════════════════════════════════════════════ PASO 4 · comprobar que todo está en su sitio ═══════════════════════════════════════════════════
-- migracion_0075 tiene que decir «Aplicada» y secretos «listos». ultimas_llamadas sube cuando hay un viaje en curso con un móvil con los avisos encendidos.

${leer('docs/dias/COMPROBAR_0075.sql')}

-- Para PARARLO en cualquier momento (los avisos del viaje dejan de salir; lo demás sigue igual):  select cron.unschedule('avisos-viaje');
-- Para ir más despacio (cada 5 minutos en vez de cada minuto): select cron.unschedule('avisos-viaje'); select cron.schedule('avisos-viaje', '*/5 * * * *', 'select public.avisos_viaje_disparar()');
`
fs.writeFileSync('docs/dias/HOY3_SQL_PARA_PEGAR.sql', salida)
console.log('Escrito docs/dias/HOY3_SQL_PARA_PEGAR.sql', salida.length, 'letras')
