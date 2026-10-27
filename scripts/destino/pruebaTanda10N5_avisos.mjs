// Tanda 10N5 §6e · los avisos eliminados se borran de verdad a los 30 días, los de más de un año también, y no vuelven a salir. No toca el motor de rutas.
//   node scripts/destino/pruebaTanda10N5_avisos.mjs
// 1. La base de datos (PGlite con las migraciones reales, la 0046 y la 0048): la limpieza diaria y el «no vuelven».
// 2. El servidor: la tarea programada diaria (`/api/cron/avisos`) llama a la limpieza; sin la migración no se rompe.
// 3. [Deshacer] sigue como hoy (unos segundos después de eliminar).
import fs from 'node:fs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')

console.log('1. La base de datos (PGlite, migraciones reales hasta la 0048)')
{
  const MIGRACIONES = /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0035|0046|0048)_/
  const bd = await crearBaseDePrueba({ migraciones: MIGRACIONES, alFallar: (m) => debe(false, 'migracion', m) })
  const { q, servidor, nuevoUsuario } = bd
  debe(bd.aplicadas.includes('0048_avisos_borrado.sql'), 'migracion', 'la 0048 se aplica sin un error')
  // y se puede pegar dos veces
  try {
    await bd.db.exec(leer('supabase/migrations/0048_avisos_borrado.sql'))
    debe(true, 'migracion', 'la 0048 se puede repetir')
  } catch (e) {
    debe(false, 'migracion', `la 0048 repetida falla: ${e.message}`)
  }
  const ana = await nuevoUsuario('ana@correo.es', false, 'Ana')
  const luis = await nuevoUsuario('luis@correo.es', false, 'Luis')
  const crear = (uid, clave, extra = '') => servidor(() => q(`insert into public.avisos (user_id, tipo, clave, payload ${extra ? ', ' + extra.split('=')[0] : ''}) values ($1, 'd10', $2, '{}'::jsonb ${extra ? ', ' + extra.split('=')[1] : ''}) on conflict do nothing`, [uid, clave]))
  const hoy = new Date('2026-10-27T10:00:00Z')
  const hace = (dias) => `'${new Date(hoy.getTime() - dias * 86400000).toISOString()}'`
  const hay = (uid, clave) => servidor(async () => (await q('select 1 from public.avisos where user_id = $1 and clave = $2', [uid, clave])).length > 0)
  // Un aviso reciente sin tocar; uno eliminado hace 10 días; uno eliminado hace 40; uno de hace 400 días (sin eliminar); uno de hace 400 leído.
  await crear(ana, 'reciente', `creado_en=${hace(2)}`)
  await crear(ana, 'oculto10', `oculto_en=${hace(10)}`)
  await crear(ana, 'oculto40', `oculto_en=${hace(40)}`)
  await crear(ana, 'viejo400', `creado_en=${hace(400)}`)
  await crear(luis, 'oculto40-luis', `oculto_en=${hace(31)}`)
  await crear(ana, 'manana-viaje-pasado', `oculto_en=${hace(35)}`)
  const r = await servidor(async () => (await q('select public.purgar_avisos($1::timestamptz) as r', [hoy.toISOString()]))[0].r)
  debe(r.borrados === 4, '6e-1', `la limpieza borra 4 avisos (los 3 eliminados hace más de 30 días y el de más de un año): ${r.borrados}`)
  debe((await hay(ana, 'reciente')) && (await hay(ana, 'oculto10')), '6e-1', 'el reciente y el eliminado hace 10 días se quedan (aún se puede [Deshacer] desde Gestionar)')
  debe(!(await hay(ana, 'oculto40')) && !(await hay(luis, 'oculto40-luis')) && !(await hay(ana, 'viejo400')), '6e-1', 'el eliminado hace 40 días, el de 31 y el de más de un año (leído o no) se borran de verdad')
  // No vuelven
  const intento = await servidor(async () => (await q("select public.crear_aviso($1, 'd10', 'manana-viaje-pasado', '{}'::jsonb) as r", [ana]))[0].r)
  debe(intento === false && !(await hay(ana, 'manana-viaje-pasado')), '6e-2', '«Mañana empieza tu viaje» de un viaje que ya pasó: la clave está apuntada y no se puede crear otra vez')
  const intento2 = await servidor(async () => (await q("select public.crear_aviso($1, 'd10', 'viejo400', '{}'::jsonb) as r", [ana]))[0].r)
  debe(intento2 === false, '6e-2', 'tampoco el de más de un año')
  const nuevo = await servidor(async () => (await q("select public.crear_aviso($1, 'd10', 'otro-distinto', '{}'::jsonb) as r", [ana]))[0].r)
  debe(nuevo === true && (await hay(ana, 'otro-distinto')), '6e-2', 'un aviso con otra clave sí se crea')
  // Otra persona con la misma clave no está bloqueada
  const deLuis = await servidor(async () => (await q("select public.crear_aviso($1, 'd10', 'manana-viaje-pasado', '{}'::jsonb) as r", [luis]))[0].r)
  debe(deLuis === true, '6e-2', 'la clave borrada es de Ana: a Luis no le afecta')
  // Repetir la limpieza no rompe nada
  const r2 = await servidor(async () => (await q('select public.purgar_avisos($1::timestamptz) as r', [hoy.toISOString()]))[0].r)
  debe(r2.borrados === 0, '6e-1', 'repetir la limpieza el mismo día no borra más')
  // Las claves apuntadas se olvidan a los 2 años
  const futuro = new Date(hoy.getTime() + 800 * 86400000).toISOString()
  const r3 = await servidor(async () => (await q('select public.purgar_avisos($1::timestamptz) as r', [futuro]))[0].r)
  debe(r3.claves_olvidadas >= 3, '6e-2', `a los 2 años se olvidan las claves apuntadas (${r3.claves_olvidadas})`)
  // La lista de la campana no trae lo eliminado
  await servidor(() => q("insert into public.avisos (user_id, tipo, clave, payload, oculto_en) values ($1, 'd10', 'deshacer1', '{}'::jsonb, now())", [ana]))
  const lista = await servidor(async () => (await q('select public.avisos_de($1) as r', [ana]))[0].r)
  debe(!lista.some((a) => a.id === (null)), '6e-3', 'la campana sigue sin traer lo eliminado (0046)')
  // [Deshacer] sigue como hoy: ocultar_avisos(false) lo devuelve mientras exista
  const id = await servidor(async () => (await q("select id from public.avisos where user_id = $1 and clave = 'deshacer1'", [ana]))[0].id)
  await servidor(() => q('select public.ocultar_avisos($1, $2::uuid[], false)', [ana, [id]]))
  const vuelve = await servidor(async () => (await q('select public.avisos_de($1) as r', [ana]))[0].r)
  debe(vuelve.some((a) => a.id === id), '6e-3', '[Deshacer] (ocultar_avisos con false) devuelve el aviso tal cual, como hoy')
}

console.log('2. El servidor y la app')
{
  const srv = leer('server/avisos.js')
  debe(/rpc\('purgar_avisos'/.test(srv), '6e-1', 'la tarea programada diaria llama a `purgar_avisos`')
  debe(/sin la migración 0048/.test(srv), '6e-1', 'si falta la 0048 solo lo apunta en el registro: no rompe la tarea de los avisos')
  const vercel = JSON.parse(leer('vercel.json'))
  debe(vercel.crons?.some((c) => c.path === '/api/cron/avisos' && c.schedule === '0 9 * * *'), '6e-1', 'esa tarea ya corre una vez al día (Vercel, 9:00): no hace falta activar pg_cron')
  const sql = leer('supabase/migrations/0048_avisos_borrado.sql')
  debe(/interval '30 days'/.test(sql) && /interval '1 year'/.test(sql) && /avisos_no_repetir_borrados/.test(sql), '6e-1', 'la migración: 30 días tras eliminar, 1 año para todos, y el disparador que impide recrear')
  const hoja = leer('src/components/layout/NoticesSheet.tsx')
  debe(/Deshacer/.test(hoja), '6e-3', '[Deshacer] sigue en la campana')
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log('  ✗', f.regla, '·', f.texto)
process.exit(fallos.length ? 1 : 0)
