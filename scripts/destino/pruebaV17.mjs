// La prueba de la Tanda V17: ALICIA Y «MIS VIAJES» (docs/dias/PROMPT_V17_ALICIA_MIS_VIAJES.md).
//   node scripts/destino/pruebaV17.mjs            (A, B y C no necesitan servidores)
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV17.mjs --navegador   (D: un Chrome; hace falta Vite en 5173)
//  A. Base de datos de verdad (PGlite, migraciones reales): juntar copia↔compartido (fotos con su día, hechos, logros, sin duplicar), las DUDAS paran, y el SQL de Alicia (0084).
//  B. Las reglas de dónde abre la app (0, 1, 2 y 4 igual que antes; 3 → Perfil) y la pregunta de juntar (pura).
//  C. El código: ningún camino abre la pantalla vieja «Mis viajes»; TripSync abre el Perfil; el miembro que toca la papelera SALE y no borra.
//  D. En un Chrome: el Perfil con todos los viajes hechos lleva «Crear un viaje»; la pregunta de juntar.
import fs from 'node:fs'
import { crearBaseDePrueba, MIGRACIONES } from './_baseDeDatosPrueba.mjs'
import { dondeAbrir } from '../../src/lib/dondeAbrir.ts'
import { viajeQueSePisa, textosDeJuntar } from '../../src/lib/juntarViajePuro.ts'
import { salirDelViaje, borrarFilaDelViaje } from '../../src/lib/eliminarViajeNube.ts'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const NAVEGADOR = process.argv.includes('--navegador')

/* ───────── A. La base de datos ───────── */
console.log('A. Juntar un viaje propio con el compartido (base de datos de verdad)')
const mal = []
const extra = /^(0037|0038|0040|0049|0070|0083)_/
const bd = await crearBaseDePrueba({ migraciones: new RegExp(`${MIGRACIONES.source}|${extra.source}`.replace(/\)\|\^\(/, '|')), alFallar: (m) => mal.push(m) })
debe(bd.aplicadas.some((f) => f.startsWith('0083_')), 'migracion', `la 0083 se aplica con las demás sin error (${mal.join('; ')})`)
const { q, como, servidor, nuevoUsuario, db } = bd
const cuenta = async (sql, v = []) => Number((await servidor(() => q(sql, v)))[0].n)

const cuentaDueno = async (sql, v = []) => {
  await db.exec('reset role')
  return Number((await db.query(sql, v)).rows[0].n)
}
const dias = (n) => Array.from({ length: n }, (_, i) => ({ id: `dia-${i + 1}`, dayNumber: i + 1 }))
const ruta = (id, inicio, fin, nDias) => JSON.stringify({ id, destination: 'Lanzarote', days: dias(nDias).map((d) => ({ ...d, id: `${id}-d${d.dayNumber}` })), answers: { dateRange: { start: inicio, end: fin } } })

async function escenario() {
  const E = await nuevoUsuario(`e${Math.random()}@x.es`, false, 'Eric')
  const A = await nuevoUsuario(`a${Math.random()}@x.es`, false, 'Alicia')
  const insertar = async (dueno, r) => (await servidor(() => q('insert into public.trips (traveler_id, route) values ($1, $2) returning id', [dueno, r])))[0].id
  const comp = await insertar(E, ruta('r-comp', '2026-11-07', '2026-11-13', 7))
  await servidor(() => q('insert into public.trip_members (trip_id, user_id, invited_by) values ($1, $2, $3)', [comp, A, E]))
  const c1 = await insertar(A, ruta('r-c1', '2026-11-09', '2026-11-13', 5))
  const c2 = await insertar(A, ruta('r-c2', '2026-11-08', '2026-11-13', 6))
  const foto = async (uid, rutaId, dia, bytes) => {
    const id = (await servidor(() => q("insert into public.trip_photos (user_id, trip_id, day_id, day_number, storage_path, width, height, bytes) values ($1, $2, 'x', $3, $4, 100, 80, $5) returning id", [uid, rutaId, dia, `${uid}/${rutaId}/${Math.random()}.jpg`, bytes])))[0].id
    await servidor(() => q('insert into public.trip_photo_meta (photo_id, user_id) values ($1, $2)', [id, uid]))
    return id
  }
  await foto(A, 'r-c1', 1, 1001) // 9 nov → día 3 del compartido
  await foto(A, 'r-c1', 2, 1002) // 10 nov → día 4
  await foto(A, 'r-c2', 1, 2001) // 8 nov → día 2
  await foto(A, 'r-c2', 2, 1001) // 9 nov, MISMA foto que la primera de la c1 (misma medida y día): repetida
  await foto(E, 'r-comp', 1, 9999) // la de Eric, no se toca
  const hecho = (uid, trip, tipo, sitio, stop) =>
    servidor(() => q("insert into public.logro_hechos (user_id, trip_id, destino, tipo, sitio, stop_id, instante) values ($1, $2, 'lanzarote', $3, $4, $5, now())", [uid, trip, tipo, sitio, stop]))
  await hecho(A, c1, 'visto', 'timanfaya', 's1')
  await hecho(A, comp, 'visto', 'timanfaya', 's1') // el mismo Visto ya está en el compartido: repetido
  await hecho(A, c2, 'visto', 'jameos', 's2')
  await hecho(A, c2, 'foto', 'jameos', null)
  await servidor(() => q("insert into public.achievements (user_id, logro, escalon, destino, trip_id) values ($1, 'primer_sello', '', 'lanzarote', $2)", [A, c1]))
  await servidor(() => q("insert into public.achievements (user_id, logro, escalon, destino, trip_id) values ($1, 'pedazo', 'x', 'lanzarote', $2)", [A, c2]))
  return { E, A, comp, c1, c2 }
}

{
  const e = await escenario()
  const antesFotos = await cuenta('select count(*) n from public.trip_photos where user_id = $1', [e.A])
  const r1 = (await como(e.A, () => q('select public.juntar_mi_viaje($1, $2) as r', [e.c1, e.comp])))[0].r
  debe(r1.fotos_pasadas === 2 && r1.hechos_pasados === 0 && r1.hechos_repetidos_quitados === 1 && r1.logros_pasados === 1, 'juntar', `la 1.ª copia: 2 fotos pasan, su Visto repetido se quita, su logro pasa (${JSON.stringify(r1)})`)
  debe((await cuenta('select count(*) n from public.trips where id = $1', [e.c1])) === 0, 'juntar', 'la copia 1 ya no existe')
  debe((await cuenta('select count(*) n from public.trips where id = $1', [e.comp])) === 1, 'juntar', 'el compartido sigue')
  const fotos = await servidor(() => q("select day_number, day_id, bytes from public.trip_photos where user_id = $1 and trip_id = 'r-comp' order by bytes", [e.A]))
  debe(fotos.length === 2 && fotos[0].day_number === 3 && fotos[0].day_id === 'r-comp-d3' && fotos[1].day_number === 4 && fotos[1].day_id === 'r-comp-d4', 'dias', 'cada foto cae en el MISMO día (por fecha) del compartido: 9 nov → día 3, 10 nov → día 4')
  const r2 = (await como(e.A, () => q('select public.juntar_mi_viaje($1, $2) as r', [e.c2, e.comp])))[0].r
  debe(r2.fotos_repetidas_quitadas === 1 && r2.fotos_pasadas === 1 && r2.hechos_pasados === 2 && r2.logros_pasados === 1, 'juntar', `la 2.ª copia: la foto repetida NO se duplica, la otra pasa, sus 2 hechos y su logro pasan (${JSON.stringify(r2)})`)
  debe((await cuenta("select count(*) n from public.trip_photos where user_id = $1 and trip_id = 'r-comp'", [e.A])) === 3 && (await cuenta('select count(*) n from public.trip_photos where user_id = $1', [e.A])) === antesFotos - 1, 'duplicar', 'Alicia acaba con 3 fotos en el compartido (4 menos la repetida) y ninguna en otro sitio')
  debe((await cuenta('select count(*) n from public.logro_hechos where user_id = $1 and trip_id = $2', [e.A, e.comp])) === 3, 'duplicar', 'sus hechos en el compartido: 3 (Timanfaya una sola vez, Jameos y la foto)')
  debe((await cuenta('select count(*) n from public.logro_hechos where user_id = $1 and trip_id is null', [e.A])) === 0, 'perder', 'ningún hecho se queda sin viaje')
  debe((await cuenta('select count(*) n from public.achievements where user_id = $1 and trip_id = $2', [e.A, e.comp])) === 2, 'logros', 'sus 2 logros apuntan al compartido')
  debe((await cuenta('select count(*) n from public.trip_photos where user_id = $1', [e.E])) === 1, 'ajeno', 'las fotos de Eric no se tocan')
  debe((await cuenta("select count(*) n from public.trips t where t.traveler_id = $1 and lower(t.route ->> 'destination') = 'lanzarote'", [e.A])) === 0, 'una', 'Alicia ya solo tiene el viaje compartido (ninguno propio a Lanzarote)')
  // No se puede juntar con el viaje de otra persona que no te ha invitado, ni la copia de otro.
  const e2 = await escenario()
  let paro = null
  try {
    await como(e.A, () => q('select public.juntar_mi_viaje($1, $2) as r', [e2.c1, e2.comp]))
  } catch (x) {
    paro = x.message
  }
  debe(paro && /no es de esa persona/.test(paro) && (await cuenta('select count(*) n from public.trips where id = $1', [e2.c1])) === 1, 'seguridad', `nadie junta ni borra la copia de OTRA persona (${paro})`)
  let sinInvitar = null
  const intruso = await nuevoUsuario(`i${Math.random()}@x.es`, false, 'Intruso')
  const ci = (await servidor(() => q('insert into public.trips (traveler_id, route) values ($1, $2) returning id', [intruso, ruta('r-ci', '2026-11-09', '2026-11-12', 4)])))[0].id
  try {
    await como(intruso, () => q('select public.juntar_mi_viaje($1, $2) as r', [ci, e2.comp]))
  } catch (x) {
    sinInvitar = x.message
  }
  debe(sinInvitar && /no está en el viaje compartido/.test(sinInvitar) && (await cuenta('select count(*) n from public.trips where id = $1', [ci])) === 1, 'seguridad', `quien no está invitado no puede juntar con ese viaje (${sinInvitar})`)

  // DUDA: la copia tiene gente invitada → se para y no se toca nada.
  const e3 = await escenario()
  await servidor(() => q('insert into public.trip_members (trip_id, user_id, invited_by) values ($1, $2, $3)', [e3.c1, e3.E, e3.A]))
  let duda = null
  try {
    await como(e3.A, () => q('select public.juntar_mi_viaje($1, $2) as r', [e3.c1, e3.comp]))
  } catch (x) {
    duda = x.message
  }
  debe(duda && /HAY DUDAS/.test(duda) && /trip_members=1/.test(duda), 'duda', `una copia con invitados PARA y dice por qué (${duda})`)
  debe((await cuenta('select count(*) n from public.trips where id = $1', [e3.c1])) === 1 && (await cuenta("select count(*) n from public.trip_photos where user_id = $1 and trip_id = 'r-c1'", [e3.A])) === 2, 'duda', 'y no ha tocado nada (la copia y sus 2 fotos siguen donde estaban)')
  // DUDA: una foto en un día que el compartido no tiene (compartido de 3 días).
  const e4 = await escenario()
  await servidor(() => q("update public.trips set route = jsonb_set(route, '{days}', (route -> 'days') - 6 - 5 - 4 - 3 - 2) where id = $1", [e4.comp]))
  let duda2 = null
  try {
    await como(e4.A, () => q('select public.juntar_mi_viaje($1, $2) as r', [e4.c1, e4.comp]))
  } catch (x) {
    duda2 = x.message
  }
  debe(duda2 && /fotos_en_dia_que_no_existe/.test(duda2), 'duda', `una foto de un día que el compartido no tiene también PARA (${duda2})`)

  // El SQL de Alicia (0084), con sus ids cambiados por los de la prueba: copia de seguridad, lo pasa y borra solo sus dos copias.
  const e5 = await escenario()
  const sql = leer('supabase/migrations/0084_alicia_un_solo_viaje.sql')
    .replaceAll('2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c', e5.A)
    .replaceAll('4d3e6c59-2c9f-4570-8afa-2c597895b5e1', e5.comp)
    .replaceAll('3157cdb3-a24c-4862-b8bf-9037d7b1a8cc', e5.c1)
    .replaceAll('1a54ced6-e592-450d-afdc-25e6863408a8', e5.c2)
  await db.exec('reset role')
  let falloSql = null
  try {
    await db.exec(sql)
  } catch (x) {
    falloSql = x.message
  }
  debe(falloSql === null, '0084', `el SQL de Alicia corre entero sin error (${falloSql})`)
  const comprobar = leer('docs/dias/COMPROBAR_0084.sql')
    .replaceAll('2e7dc316-b9a8-4ac7-8b85-d9fbbf51688c', e5.A)
    .replaceAll('4d3e6c59-2c9f-4570-8afa-2c597895b5e1', e5.comp)
    .replaceAll('3157cdb3-a24c-4862-b8bf-9037d7b1a8cc', e5.c1)
    .replaceAll('1a54ced6-e592-450d-afdc-25e6863408a8', e5.c2)
  const comp5 = (await db.query(comprobar)).rows[0].resultado
  debe(comp5.viajes_lanzarote_de_alicia === 1 && comp5.copias_que_quedan === 0 && comp5.compartido_sigue === 1 && comp5.fotos_perdidas === 0 && comp5.hechos_perdidos === 0 && comp5.logros_perdidos === 0, '0084', `COMPROBAR_0084: un solo viaje, copias fuera, nada perdido (${JSON.stringify(comp5)})`)
  debe(comp5.fotos_en_el_compartido === 3, '0084', 'Alicia tiene 3 fotos en el compartido (la repetida no se duplica)')
  debe((await cuentaDueno('select count(*) n from public.respaldo_v17_trips where id = any($1::uuid[])', [[e5.c1, e5.c2, e5.comp]])) === 3 && (await cuentaDueno('select count(*) n from public.respaldo_v17_trip_photos')) >= 4, '0084', 'la copia de seguridad guarda los 3 viajes y las fotos de las dos copias antes de tocarlas')
  // Y el SQL de COMPROBAR_0083.
  const c83 = (await db.query(leer('docs/dias/COMPROBAR_0083.sql'))).rows[0].resultado
  debe(c83.existe_juntar_viaje_de === true && c83.existe_juntar_mi_viaje === true, '0083', 'COMPROBAR_0083: las dos funciones existen')

  // La papelera del compartido: quien está invitada SALE y no borra el viaje de Eric.
  const e6 = await escenario()
  const nube = {
    from: (tabla) => {
      const f = []
      const b = {
        delete: () => b,
        eq: (c, v) => (f.push([c, v]), b),
        then: (ok, ko) =>
          como(e6.A, async () => {
            try {
              await db.query(`delete from public.${tabla} where ${f.map(([c], i) => `${c} = $${i + 1}`).join(' and ')}`, f.map(([, v]) => v))
              return { error: null }
            } catch (x) {
              return { error: { message: x.message } }
            }
          }).then(ok, ko),
      }
      return b
    },
  }
  const salida = await salirDelViaje(nube, e6.A, e6.comp)
  debe(salida === null && (await cuenta('select count(*) n from public.trips where id = $1', [e6.comp])) === 1 && (await cuenta('select count(*) n from public.trip_members where trip_id = $1 and user_id = $2', [e6.comp, e6.A])) === 0, 'papelera', 'la papelera del compartido: Alicia SALE (su fila de miembro) y el viaje de Eric sigue entero')
  // Y aunque lo intentara con la función de borrar: la base no deja borrar el viaje de otra persona.
  await borrarFilaDelViaje(
    { from: () => ({ delete: () => ({ eq: (c, v) => como(e6.A, () => db.query('delete from public.trips where id = $1', [v])).then(() => ({ error: null })) }) }) },
    e6.comp,
  ).catch(() => null)
  debe((await cuenta('select count(*) n from public.trips where id = $1', [e6.comp])) === 1, 'papelera', 'y si Alicia intentara borrar la fila del viaje de Eric, la base de datos no se lo permite')
}

/* ───────── B. Las reglas de dónde abre la app y la pregunta de juntar ───────── */
console.log('B. Dónde abre la app y la pregunta de juntar')
{
  const v = (id, ini, fin, extra = {}) => ({ id, ini, fin, ...extra })
  const abrir = (viajes, hoy = '2026-11-19', deHoy = () => false) => dondeAbrir(viajes, deHoy, (x) => (x.ini ? { inicio: x.ini, fin: x.fin } : null), hoy)
  const i0 = abrir([v('a', '2026-12-01', '2026-12-03', { generationState: { x: 1 } }), v('b', '2026-01-01', '2026-01-03')])
  debe(i0.tipo === 'reanudar' && i0.viaje.id === 'a', 'regla0', 'regla 0: un viaje a medias se retoma')
  const i1 = abrir([v('a', '2026-11-18', '2026-11-20'), v('b', '2026-12-01', '2026-12-03')], '2026-11-19', (x) => x.id === 'a')
  debe(i1.tipo === 'hoy' && i1.viaje.id === 'a', 'regla1', 'regla 1: si hoy es día de un viaje, HOY')
  const i2 = abrir([v('a', '2027-02-01', '2027-02-03'), v('b', '2026-12-01', '2026-12-03'), v('c', '2026-01-01', '2026-01-03')])
  debe(i2.tipo === 'ruta' && i2.viaje.id === 'b', 'regla2', 'regla 2: hay viajes por delante: RUTA del más cercano')
  const i3 = abrir([v('a', '2026-01-01', '2026-01-03'), v('b', '2026-03-01', '2026-03-03')])
  debe(i3.tipo === 'misViajes', 'regla3', 'regla 3: todos los viajes ya pasaron → «misViajes» (que ahora abre el Perfil)')
  debe(abrir([]).tipo === 'nada', 'regla4', 'regla 4: ningún viaje → Crear viaje')

  const t = (id, destino, ini, fin, extra = {}) => ({ id, route: { destination: destino, answers: { dateRange: { start: ini, end: fin } } }, ...extra })
  const lista = [t('comp', 'Lanzarote', '2026-11-07', '2026-11-13', { esInvitado: true }), t('mio', 'lanzarote', '2026-11-09', '2026-11-13')]
  debe(viajeQueSePisa(lista, 'comp')?.id === 'mio', 'pisa', 'mismo destino (sin mirar mayúsculas) y días que se pisan → hay que preguntar')
  debe(viajeQueSePisa([lista[0], t('otro', 'Roma', '2026-11-09', '2026-11-13')], 'comp') === null, 'pisa', 'otro destino: no se pregunta')
  debe(viajeQueSePisa([lista[0], t('mio', 'Lanzarote', '2026-12-20', '2026-12-25')], 'comp') === null, 'pisa', 'mismo destino pero otras fechas (no se pisan): no se pregunta')
  debe(viajeQueSePisa([lista[0], t('mio', 'Lanzarote', '2026-11-13', '2026-11-15')], 'comp')?.id === 'mio', 'pisa', 'un solo día en común (el 13) ya cuenta')
  debe(viajeQueSePisa([lista[0], t('mio', 'Lanzarote', '2026-11-09', '2026-11-13', { esInvitado: true })], 'comp') === null, 'pisa', 'otro viaje compartido (no propio): no se junta')
  const tx = textosDeJuntar('Lanzarote', 'Eric')
  debe(tx.titulo === 'Ya tienes un viaje a Lanzarote en esas fechas.' && tx.pregunta === '¿Lo juntamos con el de Eric?', 'textos', 'los textos: «Ya tienes un viaje a Lanzarote en esas fechas. ¿Lo juntamos con el de Eric?»')
}

/* ───────── C. El código ───────── */
console.log('C. Ningún camino abre la pantalla vieja')
{
  const todos = []
  const recorrer = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${f.name}`
      if (f.isDirectory()) recorrer(p)
      else if (/\.(ts|tsx)$/.test(f.name)) todos.push(p)
    }
  }
  recorrer('src')
  debe(!fs.existsSync('src/components/myTrips/MyTripsScreen.tsx') && !fs.existsSync('src/components/myTrips/TripCard.tsx'), 'vieja', 'la pantalla vieja «Mis viajes» (MyTripsScreen) y su tarjeta ya no existen')
  const quedan = todos.filter((f) => /['"]myTrips['"]|MyTripsScreen/.test(leer(f)))
  debe(quedan.length === 0, 'vieja', `ningún archivo de src/ la nombra ni la abre (${quedan.join(', ') || 'ninguno'})`)
  const sync = leer('src/components/sync/TripSync.tsx')
  debe(/donde\.tipo === 'misViajes'[\s\S]{0,700}usePerfilUi\.getState\(\)\.abrir\(\)/.test(sync) && /hydrateTrip\(await viajeEntero\(trips\[0\]\)\)/.test(sync), 'perfil', 'TripSync: con todos los viajes hechos abre el Perfil (sobre el último viaje que tocó)')
  debe(/data-crear-viaje-perfil/.test(leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx')) && /every\(\(v\) => v\.fase === 'hecho'\)/.test(leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx')), 'perfil', 'el Perfil lleva «Crear un viaje» cuando no hay ninguno por delante')
  const nube = leer('src/lib/eliminarViajeNube.ts')
  debe(/esInvitado[\s\S]{0,300}salirDelViaje/.test(nube) && /from\('trip_members'\)\.delete\(\)/.test(nube), 'papelera', 'el código de eliminar: si es invitada, solo SALE (trip_members), no borra la fila del viaje')
  debe(/<JuntarViajeHost \/>/.test(leer('src/App.tsx')) && /proponerJuntarSiHaceFalta/.test(leer('src/lib/unirseConCodigo.ts')) && /proponerJuntarSiHaceFalta/.test(sync), 'juntar', 'la pregunta de juntar está montada y sale al unirse (con código y con enlace)')
}

/* ───────── D. En un Chrome ───────── */
if (NAVEGADOR) {
  console.log('D. En un Chrome')
  const { abrirConViajes, abrirPerfil } = await import('./_ayuda10F.mjs')
  const { app } = await abrirConViajes()
  try {
    // Con un viaje por delante: SIN «Crear un viaje» grande.
    await abrirPerfil(app)
    const con = await app.evaluar("Boolean(document.querySelector('[data-crear-viaje-perfil]'))")
    debe(con === false, 'perfil', 'con un viaje por delante el Perfil no pone el botón grande')
    // Solo viajes hechos: el botón sale.
    await app.evaluar("document.querySelector('[aria-label=\"Cerrar\"]')?.click(); true")
    const hecho = await app.evaluar(`(async () => {
      const { useSyncStore } = await import('/src/store/useSyncStore.ts')
      const lista = useSyncStore.getState().savedTrips ?? []
      useSyncStore.getState().setSavedTrips(lista.filter((v) => v.id === 'fila-hecho'))
      return true
    })()`)
    debe(hecho === true, 'perfil', 'preparado: solo queda el viaje hecho')
    await app.esp(1500)
    const fuera = await app.evaluar("Boolean(document.querySelector('[data-crear-viaje-perfil]'))")
    await app.captura?.('docs/dias/capturas_jutrip/v17_perfil_todo_hecho.jpg').catch(() => null)
    debe(fuera === true, 'perfil', 'con todos los viajes hechos el Perfil pone «Crear un viaje» a la vista')
    // La pregunta de juntar.
    await app.evaluar(`(async () => {
      const { useJuntarUi } = await import('/src/lib/juntarViaje.ts')
      useJuntarUi.getState().proponer({ copiaId: 'fila-hecho', compId: 'fila-comp', destino: 'Lanzarote', invitador: 'Eric' })
      return true
    })()`)
    await app.esp(1200)
    const texto = await app.evaluar("document.querySelector('[data-hoja=\"juntar-viaje\"], [data-juntar-viaje]')?.textContent ?? document.body.innerText")
    debe(/Ya tienes un viaje a Lanzarote en esas fechas\./.test(texto) && /¿Lo juntamos con el de Eric\?/.test(texto) && /Juntarlos/.test(texto) && /Dejarlos separados/.test(texto), 'juntar', 'la pregunta sale con sus dos botones')
    await app.captura?.('docs/dias/capturas_jutrip/v17_juntar.jpg').catch(() => null)
    await app.evaluar("Array.from(document.querySelectorAll('button')).find((b) => /Dejarlos separados/.test(b.textContent))?.click(); true")
    await app.esp(800)
    const sigue = await app.evaluar("/Dejarlos separados/.test(document.body.innerText)")
    debe(sigue === false, 'juntar', '[Dejarlos separados] cierra la pregunta')
  } finally {
    await app.cerrar?.()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
