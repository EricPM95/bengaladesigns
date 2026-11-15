// Prueba del SQL de limpieza de cuentas de prueba (scripts/limpieza/borrarCuentasDePrueba.sql) sobre un Postgres de prueba (PGlite) con TODAS las migraciones:
//   · ninguna clave a auth.users puede bloquear el borrado (todas «cascade» o «set null»);
//   · se quedan los dos administradores, lo compartido entre ellos y las cuentas que se pidan a mano; se va todo lo demás con todo lo suyo;
//   · si falta un administrador, no se borra nada; se puede repetir (por tandas).
//   node scripts/limpieza/pruebaLimpieza.mjs
import fs from 'node:fs'
import { crearBaseDePrueba } from '../destino/_baseDeDatosPrueba.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const plantilla = fs.readFileSync('scripts/limpieza/borrarCuentasDePrueba.sql', 'utf8')
const sqlCon = (c1, c2, ids = []) => plantilla.replaceAll('__CORREO_1__', c1).replaceAll('__CORREO_2__', c2).replaceAll('__IDS_EXTRA__', ids.length ? ids.map((i) => `'${i}'::uuid`).join(', ') : 'null::uuid')

const bd = await crearBaseDePrueba({ migraciones: /^\d{4}_.*\.sql$/, alFallar: () => undefined })
const { db, q, nuevoUsuario } = bd
const hayTabla = async (t) => (await q('select to_regclass($1) is not null as ok', [`public.${t}`]))[0].ok

// 1. Ninguna clave a la cuenta bloquea el borrado.
const claves = await q(`
  select c.conrelid::regclass::text as tabla, c.confdeltype as accion
  from pg_constraint c where c.contype = 'f' and c.confrelid in ('auth.users'::regclass, 'public.travelers'::regclass, 'public.trips'::regclass)`)
const malas = claves.filter((c) => !['c', 'n'].includes(c.accion))
debe(claves.length > 30 && malas.length === 0, 'claves', `las ${claves.length} claves a la cuenta, a la persona o al viaje son «cascade» o «set null»; ninguna bloquea el borrado (${malas.map((m) => m.tabla).join(', ') || 'ninguna mala'})`)

// 2. Datos: 2 administradores, un compañero de prueba con un viaje compartido con ellos, y muchas cuentas de prueba con de todo.
const eric = await nuevoUsuario('uno@admin.test')
const alicia = await nuevoUsuario('dos@admin.test')
const dueno = await nuevoUsuario('dueno-compartido@prueba.test')
const guardada = await nuevoUsuario('guardar-a-mano@prueba.test')
const pruebas = []
for (let i = 0; i < 700; i++) pruebas.push(await nuevoUsuario(i % 7 === 0 ? `prueba${i}@example.test` : `anonima${i}@x.test`, i % 7 !== 0))
const viaje = async (uid, destino = 'Roma') => (await q("insert into public.trips (traveler_id, route, bookings, wishlist, ui_state) values ($1, $2, '{}', '[]', '{}') returning id", [uid, JSON.stringify({ id: `r-${Math.random()}`, destination: destino, days: [], answers: {} })]))[0].id
const vEric = await viaje(eric, 'Lanzarote')
const vAlicia = await viaje(alicia, 'Lanzarote')
const vCompartido = await viaje(dueno, 'Roma') // lo ha creado una cuenta de prueba pero Eric es miembro: no se pierde
await q('insert into public.trip_members (trip_id, user_id) values ($1, $2)', [vCompartido, eric])
const vGuardada = await viaje(guardada)
const vDeEllas = []
for (const u of pruebas) vDeEllas.push(await viaje(u))
// Lo de cada persona en el resto de las tablas (las que existan con las migraciones).
const sembradas = []
const intenta = async (tabla, sql, params) => {
  if (!(await hayTabla(tabla))) return
  try {
    await q(sql, params)
    sembradas.push(tabla)
  } catch {
    /* otra forma de tabla: no se siembra */
  }
}
for (const [i, u] of pruebas.slice(0, 60).entries()) {
  await intenta('stop_visits', 'insert into public.stop_visits (user_id, trip_id, day_id, stop_id) values ($1, $2, $3, $4)', [u, vDeEllas[i], 'd', 's'])
  await intenta('avisos', "insert into public.avisos (user_id, tipo, clave, payload) values ($1, 'unido', $2, '{}')", [u, `k-${i}`])
  await intenta('historia_de_prueba', "insert into public.historia_de_prueba (user_id, destino, sitio, nombre) values ($1, 'Roma', 's', 'n')", [u])
  await intenta('place_likes', "insert into public.place_likes (user_id, destination, place_name) values ($1, 'Roma', $2)", [u, `p${i}`])
  await intenta('passes', "insert into public.passes (destino, comprador_id, tipo, usos_max, usos_usados, codigo) values ('Roma', $1, 'duo', 2, 1, $2)", [u, `COD${i}`])
  await intenta('trip_invitations', "insert into public.trip_invitations (trip_id, creada_por, codigo) values ($1, $2, $3)", [vDeEllas[i], u, `INV${i}`])
}
await intenta('push_suscripciones', "insert into public.push_suscripciones (user_id, endpoint, claves) values ($1, 'https://e/1', '{}')", [pruebas[0]])
console.log(`   (sembradas: ${[...new Set(sembradas)].join(', ')})`)

// 3. Sin uno de los administradores no se borra nada.
const antesCuentas = (await q('select count(*)::int n from auth.users'))[0].n
let msg = null
try {
  await db.exec(sqlCon('uno@admin.test', 'no-existe@admin.test'))
} catch (e) {
  msg = String(e.message)
}
debe(/No encuentro las dos cuentas/.test(msg ?? '') && (await q('select count(*)::int n from auth.users'))[0].n === antesCuentas, 'seguro', 'si falta un administrador, el SQL se para y no borra nada')

// 4. El borrado, por tandas, hasta que no queda nada por borrar.
const ejecuciones = []
for (let i = 0; i < 12; i++) {
  const r = await db.exec(sqlCon('uno@admin.test', 'dos@admin.test', [guardada]))
  const ultimo = r.filter((x) => x.rows?.length).at(-1).rows[0]
  ejecuciones.push(ultimo.quedan_por_borrar)
  if (Number(ultimo.quedan_por_borrar) === 0) break
}
debe(ejecuciones.length >= 3 && ejecuciones.at(-1) === 0 || Number(ejecuciones.at(-1)) === 0, 'tandas', `se borra por tandas de 300 y termina en 0 (quedaban por borrar tras cada tanda: ${ejecuciones.join(' → ')})`)
const quedan = (await q('select email from auth.users order by email')).map((x) => x.email)
debe(JSON.stringify(quedan) === JSON.stringify(['dos@admin.test', 'dueno-compartido@prueba.test', 'guardar-a-mano@prueba.test', 'uno@admin.test']), 'quedan', `solo quedan los dos administradores, el dueño de lo compartido con ellos y la cuenta pedida a mano (${quedan.join(', ')})`)
const viajes = (await q('select id from public.trips')).map((x) => x.id).sort()
debe(JSON.stringify(viajes) === JSON.stringify([vEric, vAlicia, vCompartido, vGuardada].sort()), 'viajes', 'los viajes de los administradores, el compartido entre ellos y el de la cuenta guardada se quedan; ningún otro')
debe((await q('select count(*)::int n from public.trip_members where trip_id = $1 and user_id = $2', [vCompartido, eric]))[0].n === 1, 'viajes', 'Eric sigue siendo miembro del viaje compartido')
debe((await q('select count(*)::int n from public.travelers'))[0].n === 4, 'travelers', 'travelers también se queda con las 4 personas')

// 5. Nada huérfano: ninguna tabla con persona guarda filas de cuentas que ya no existen.
const columnas = await q(`
  select c.conrelid::regclass::text as tabla, a.attname as col
  from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
  where c.contype = 'f' and c.confrelid = 'auth.users'::regclass and c.conrelid::regclass::text like 'public.%'`)
let huerfanos = 0
const detalle = []
for (const { tabla, col } of columnas) {
  const n = (await q(`select count(*)::int n from ${tabla} t where t.${col} is not null and not exists (select 1 from auth.users u where u.id = t.${col})`))[0].n
  if (n > 0) {
    huerfanos += n
    detalle.push(`${tabla}.${col}=${n}`)
  }
}
debe(huerfanos === 0, 'huerfanos', `ninguna de las ${columnas.length} columnas que apuntan a una cuenta guarda filas de cuentas borradas (${detalle.join(', ') || 'ninguna'})`)
debe((await q('select count(*)::int n from public.trips t where not exists (select 1 from auth.users u where u.id = t.traveler_id)'))[0].n === 0, 'huerfanos', 'ningún viaje sin dueño')
for (const t of ['stop_visits', 'historia_de_prueba', 'place_likes', 'passes', 'trip_invitations']) {
  if (sembradas.includes(t)) debe((await q(`select count(*)::int n from public.${t}`))[0].n === 0, 'cascada', `lo que tenían las cuentas borradas en ${t} se ha ido con ellas`)
}

// 6. Repetir no hace daño.
const otra = await db.exec(sqlCon('uno@admin.test', 'dos@admin.test', [guardada]))
debe(otra.filter((x) => x.rows?.length).at(-1).rows[0].cuentas_ahora === 4, 'repetir', 'volver a pegar el archivo con todo ya borrado no cambia nada (siguen 4 cuentas)')

console.log(`\nLa prueba de la limpieza: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const x of fallos) console.log(`  FALLO [${x.regla}] ${x.texto}`)
process.exit(fallos.length ? 1 : 0)
