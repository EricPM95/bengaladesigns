// La prueba de la Tanda V37: EL VIAJE SIN `originalRoute` (la mitad de peso). Ninguna petición sale a Supabase de verdad: el `fetch` de la página es de mentira y apunta lo que le mandan.
//   (1) lo que se lee en el código (ni el servidor ni las migraciones ni la caché de HOY la usan; la app no la sube);
//   (2) el peso (Lanzarote real y Roma generada): la ruta que se sube pesa ≤ 55 % de la de antes;
//   (3) un viaje NUEVO se guarda sin `originalRoute`; uno VIEJO (con ella) se abre, se edita, se guarda y la varita sigue funcionando; lo guardado ya no la lleva;
//   (4) la huella ignora la copia pero un viaje viejo SÍ se sube una vez limpio (y solo una);
//   (5) el SQL de limpieza en PGlite (con los disparadores de `trips` de las migraciones reales) y su COMPROBAR.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV37_viaje.mjs
// Formato del final: «N comprobaciones · M fallos».
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log('✗', texto)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const KB = (b) => (b / 1024).toFixed(1) + ' KB'
const bytes = (o) => Buffer.byteLength(JSON.stringify(o))
const canon = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x))

/* ───────── 1. Lo que se lee en el código ───────── */
console.log('1. Lo que se lee en el código')
{
  const buscar = (dir) => {
    const hallados = []
    const ir = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = `${d}/${e.name}`
        if (e.isDirectory()) ir(p)
        else if (/\.(js|mjs|ts|sql)$/.test(e.name) && /originalRoute|original_route/.test(leer(p))) hallados.push(p)
      }
    }
    if (fs.existsSync(dir)) ir(dir)
    return hallados
  }
  for (const d of ['server', 'shared', 'api', 'supabase/migrations']) debe(buscar(d).length === 0, `${d}/ no menciona originalRoute (${buscar(d).join(', ')})`)
  const persist = leer('src/lib/tripPersistence.ts')
  debe(/payload = \{ \.\.\.payload, route: sinCopiaOriginal\(payload\.route\) \}/.test(persist), 'saveTrip quita la copia antes de subir (insert y update)')
  debe(/sinCopiaOriginal\(cruda\)/.test(persist) && /nubeConCopia/.test(persist), 'lo que baja de la nube sale sin la copia (y se apunta que la nube pesa de más)')
  debe(/route: sinCopiaOriginal\(state\.route\)/.test(leer('src/components/sync/TripSync.tsx')), 'el guardado en la nube y la caché de HOY (buildTripPayload) salen sin la copia')
  debe(/sinCopiaOriginal/.test(leer('src/lib/viajeEnDirecto.ts')), 'el eco remoto se compara sin la copia')
  debe(/borrarCopiasOriginales/.test(leer('src/lib/cuentas.ts')), 'al cerrar sesión se borran las copias del móvil')
}

/* ───────── 2. El peso ───────── */
console.log('2. El peso (Lanzarote real)')
const fixture = JSON.parse(leer('docs/dias/_hoy3_ruta_eric.json'))
const rutaLz = fixture.route
const conCopia = (r) => ({ ...r, originalRoute: JSON.parse(JSON.stringify({ days: r.days.map(({ originalSnapshot, ...d }) => d), answers: r.answers })) })
const antesLz = bytes(conCopia(rutaLz))
const despuesLz = bytes(rutaLz)
console.log(`   Lanzarote: antes ${antesLz} bytes (${KB(antesLz)}) · ahora ${despuesLz} bytes (${KB(despuesLz)}) · ${(100 * despuesLz / antesLz).toFixed(1)} %`)
debe(despuesLz <= 0.55 * antesLz, `Lanzarote: lo que se sube pesa ≤ 55 % (${(100 * despuesLz / antesLz).toFixed(1)} %)`)

/* ───────── 3 y 4. En la app (Chrome, fetch de mentira) ───────── */
console.log('3. En la app: viaje nuevo, viaje viejo, huella')
const base = process.env.APP_URL || 'http://localhost:5173'
const app = await abrirApp(base, { ruta: '/?cuentas=off' })
let resultado
try {
  const rutaLzTexto = JSON.stringify(rutaLz)
  resultado = await app.evaluar(`(async () => {
    const salida = { log: [] }
    // --- el fetch de mentira: apunta lo que le mandan a la tabla trips y contesta lo mínimo ---
    const fetchReal = window.fetch.bind(window)
    const peticiones = []
    let nube = null // la fila «de la nube» que contesta a los GET
    window.fetch = async (entrada, init) => {
      const url = typeof entrada === 'string' ? entrada : entrada.url
      if (!/supabase\\.co/.test(url)) return fetchReal(entrada, init)
      const metodo = (init && init.method) || (entrada.method) || 'GET'
      const cuerpo = init && typeof init.body === 'string' ? init.body : ''
      const cab = new Headers((init && init.headers) || {})
      const unico = /vnd\\.pgrst\\.object/.test(cab.get('Accept') || '')
      if (/\\/rest\\/v1\\/trips/.test(url)) {
        if (metodo === 'GET') {
          const fila = nube ? [nube] : []
          return new Response(JSON.stringify(unico ? (nube || {}) : fila), { status: 200, headers: { 'content-type': 'application/json' } })
        }
        peticiones.push({ metodo, bytes: cuerpo.length, tieneCopia: cuerpo.includes('originalRoute'), cuerpo })
        const fila = { id: 'viaje-prueba-1', updated_at: new Date().toISOString(), guardado_en: null }
        return new Response(JSON.stringify(unico ? fila : [fila]), { status: metodo === 'POST' ? 201 : 200, headers: { 'content-type': 'application/json' } })
      }
      return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })
    }
    const P = await import('/src/lib/tripPersistence.ts')
    // (Vite puede servir un módulo con varias direcciones —?t=…—: se coge la copia que usa la app de verdad, la que tiene la ruta / la que da el payload)
    const urls = (f) => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(f))
    const S = { useRouteStore: null }
    const C = await import('/src/lib/copiaOriginal.ts')
    const T = { buildTripPayload: null }
    const R = await import('/src/lib/recuperarDestino.ts')
    const todasStore = []
    for (const n of urls('/src/store/useRouteStore.ts')) todasStore.push((await import(n)).useRouteStore)
    if (todasStore.length === 0) todasStore.push((await import('/src/store/useRouteStore.ts')).useRouteStore)
    salida.copiasDelAlmacen = todasStore.length
    let store = todasStore[0]
    const nombres = (r) => r.days.map((d) => d.title).join('|')
    const bytes = (o) => new TextEncoder().encode(JSON.stringify(o)).length
    try { localStorage.clear() } catch (e) {}

    // === A. Viaje NUEVO (Roma generada por la app) ===
    await window.__rutaPrueba()
    store = todasStore.find((s) => s.getState().route) || store
    // (la ruta de prueba se pone sin pasar por setRoute: se abre como abre la app una ruta recién creada)
    store.getState().setRoute(JSON.parse(JSON.stringify(store.getState().route)))
    const nueva = store.getState().route
    salida.romaDestino = nueva.destination
    salida.nuevaTieneCopiaEnMemoria = Boolean(nueva.originalRoute && nueva.originalRoute.days.length === nueva.days.length)
    salida.nuevaCopiaGuardadaEnElMovil = Boolean(C.leerCopiaOriginal(nueva.id))
    for (const n of [...urls('/src/components/sync/TripSync.tsx'), '/src/components/sync/TripSync.tsx']) { try { const m = await import(n); if (m.buildTripPayload()) { T.buildTripPayload = m.buildTripPayload; break } } catch (e) {} }
    salida.hayBuildTripPayload = Boolean(T.buildTripPayload)
    const payloadNuevo = T.buildTripPayload()
    salida.payloadNuevoSinCopia = !('originalRoute' in payloadNuevo.route)
    const idNuevo = await P.saveTrip('yo-prueba', null, payloadNuevo)
    const posts = peticiones.filter((p) => p.metodo === 'POST')
    salida.postNuevo = posts.length === 1 ? { bytes: posts[0].bytes, tieneCopia: posts[0].tieneCopia } : null
    salida.romaAntes = bytes(nueva) // la ruta con su copia, como se subía antes
    salida.romaAhora = bytes(payloadNuevo.route)
    salida.idNuevo = idNuevo

    // === B. Viaje VIEJO: la nube lo trae con la copia ===
    try { localStorage.clear() } catch (e) {}
    const lz = ${rutaLzTexto}
    const original = JSON.parse(JSON.stringify({ days: lz.days.map(({ originalSnapshot, ...d }) => d), answers: lz.answers }))
    const viejo = { ...lz, originalRoute: original }
    salida.lzAntes = bytes(viejo)
    nube = { id: 'viaje-prueba-1', traveler_id: 'yo-prueba', updated_at: '2026-11-20T10:00:00Z', guardado_en: null, route: viejo, bookings: {}, wishlist: [], ui_state: { mode: 'route', activeDayId: null }, generation_state: null }
    const cargado = await P.loadOneTrip('yo-prueba', 'viaje-prueba-1')
    salida.viejoSinCopiaAlBajar = !('originalRoute' in cargado.viaje.route)
    salida.viejoCopiaEnElMovil = Boolean(C.leerCopiaOriginal(lz.id))
    // un guardado IDÉNTICO a lo de la nube (la huella lo ignora todo salvo la copia): SÍ se sube una vez (limpio) y solo una
    peticiones.length = 0
    await P.saveTrip('yo-prueba', 'viaje-prueba-1', cargado.viaje)
    const a1 = peticiones.length
    await P.saveTrip('yo-prueba', 'viaje-prueba-1', cargado.viaje)
    salida.subidasViejoIdentico = [a1, peticiones.length]
    salida.viejoLimpioBytes = peticiones[0] ? peticiones[0].bytes : 0
    salida.viejoLimpioTieneCopia = peticiones[0] ? peticiones[0].tieneCopia : null
    store.getState().hydrateTrip(cargado.viaje)
    const abierta = store.getState().route
    salida.viejoCopiaEnMemoria = Boolean(abierta.originalRoute && abierta.originalRoute.days.length === lz.days.length)
    salida.viejoCopiaIgual = JSON.stringify(abierta.originalRoute) === JSON.stringify(original)
    peticiones.length = 0
    const p1 = T.buildTripPayload()
    salida.payloadViejoSinCopia = !('originalRoute' in p1.route)
    await P.saveTrip('yo-prueba', 'viaje-prueba-1', p1)
    // editar: renombrar un día y guardar
    const dia = abierta.days.find((d) => !d.isReturnLeg)
    store.getState().renameDay(dia.id, 'Mi día de prueba')
    const p2 = T.buildTripPayload()
    await P.saveTrip('yo-prueba', 'viaje-prueba-1', p2)
    const ult = peticiones[peticiones.length - 1]
    salida.editadoSubido = peticiones.length >= 2 && ult.cuerpo.includes('Mi día de prueba') && !ult.tieneCopia
    salida.copiaSigueEnMemoriaTrasEditar = Boolean(store.getState().route.originalRoute)
    salida.huellaIgnoraCopia = P.canonico({ a: 1, originalRoute: { x: 1 } }) === P.canonico({ a: 1 })
    // la varita: vuelve a la original aunque el viaje se subiera sin ella
    salida.cambiadoAntes = R.destinoCambiado(store.getState().route, dia.city)
    store.getState().restoreOriginalRoute()
    const tras = store.getState().route
    salida.varitaRestaura = tras.days.find((d) => d.id === dia.id).title === original.days.find((d) => d.id === dia.id).title && !tras.editedManually

    // === C. Abrir un viaje SIN copia en el móvil ni en la nube (otro móvil): la original es la ruta tal como se abre ===
    try { localStorage.clear() } catch (e) {}
    store.getState().hydrateTrip({ ...cargado.viaje, route: { ...lz } })
    const otra = store.getState().route
    salida.otroMovilCopiaDeLoAbierto = Boolean(otra.originalRoute) && otra.originalRoute.days.length === lz.days.length
    salida.otroMovilLaGuarda = Boolean(C.leerCopiaOriginal(lz.id))
    salida.otroMovilNoSubeCopia = !('originalRoute' in T.buildTripPayload().route)

    // === D. El mismo viaje de nuevo y rutas ligeras: sin copia ni errores ===
    salida.sinCopiaEsLaMismaRuta = C.sinCopiaOriginal(lz) === lz
    salida.menosDe8Copias = (() => { for (let i = 0; i < 12; i++) C.guardarCopiaOriginal('r' + i, { days: [], answers: {} }); let n = 0; for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i).startsWith('jutrip-ruta-original:r')) n++; return n <= 8 })()
    C.borrarCopiasOriginales()
    salida.borrarLasQuita = !Object.keys(localStorage).some((k) => k.startsWith('jutrip-ruta-original:'))
    window.fetch = fetchReal
    return JSON.stringify(salida)
  })()`)
} finally {
  app.cerrar()
}
const r = JSON.parse(resultado ?? '{}')
debe(r.nuevaTieneCopiaEnMemoria === true, 'un viaje nuevo lleva la copia original EN MEMORIA (la varita la necesita)')
debe(r.nuevaCopiaGuardadaEnElMovil === true, 'y se guarda aparte en el móvil, una vez')
debe(r.payloadNuevoSinCopia === true, 'lo que se manda a guardar no la lleva')
debe(r.postNuevo && r.postNuevo.tieneCopia === false, `el cuerpo de la petición al crear el viaje no lleva «originalRoute» (${JSON.stringify(r.postNuevo)})`)
console.log(`   Roma (${r.romaDestino}): antes ${r.romaAntes} bytes (${KB(r.romaAntes)}) · ahora ${r.romaAhora} bytes (${KB(r.romaAhora)}) · ${(100 * r.romaAhora / r.romaAntes).toFixed(1)} %`)
console.log(`   Lanzarote subido por la app (cuerpo del PATCH): ${r.viejoLimpioBytes} bytes (${KB(r.viejoLimpioBytes)}) frente a ${r.lzAntes} con la copia`)
debe(r.romaAhora <= 0.55 * r.romaAntes, `Roma: lo que se sube pesa ≤ 55 % (${(100 * r.romaAhora / r.romaAntes).toFixed(1)} %)`)
debe(r.viejoSinCopiaAlBajar === true && r.viejoCopiaEnElMovil === true, 'un viaje viejo baja sin la copia y la deja en el móvil')
debe(r.viejoCopiaEnMemoria === true && r.viejoCopiaIgual === true, 'al abrirlo vuelve a tener su copia original (la del móvil) en memoria')
debe(r.payloadViejoSinCopia === true && r.viejoLimpioTieneCopia === false, 'lo que se guarda de un viaje viejo ya no la lleva')
debe(JSON.stringify(r.subidasViejoIdentico) === '[1,1]', `la huella ignora la copia pero el viaje viejo SÍ se sube una vez limpio, y solo una (peticiones: ${JSON.stringify(r.subidasViejoIdentico)})`)
debe(r.viejoLimpioBytes <= 0.55 * r.lzAntes, 'lo que se subió del viaje viejo pesa ≤ 55 % de lo que pesaba con la copia')
debe(r.editadoSubido === true, 'un viaje viejo se edita y se guarda con el cambio y sin la copia')
debe(r.copiaSigueEnMemoriaTrasEditar === true, 'editar no pierde la copia en memoria')
debe(r.huellaIgnoraCopia === true, '`canonico` (la huella) ignora la copia')
debe(r.cambiadoAntes === true && r.varitaRestaura === true, '«Volver a la ruta original» sigue funcionando con un viaje viejo ya limpiado de la nube')
debe(r.otroMovilCopiaDeLoAbierto === true && r.otroMovilLaGuarda === true && r.otroMovilNoSubeCopia === true, 'sin copia en el móvil ni en la nube, la «original» es la ruta tal como se abre (y no se sube)')
debe(r.sinCopiaEsLaMismaRuta === true, 'sinCopiaOriginal devuelve la misma ruta si no lleva copia')
debe(r.menosDe8Copias === true && r.borrarLasQuita === true, 'el móvil guarda como mucho 8 copias y cerrar sesión las borra')

/* ───────── 5. El SQL de limpieza en PGlite ───────── */
console.log('5. LIMPIAR_ORIGINALROUTE.sql en PGlite')
{
  const sql = leer('docs/dias/LIMPIAR_ORIGINALROUTE.sql')
  const comprobar = leer('docs/dias/COMPROBAR_LIMPIAR_ORIGINALROUTE.sql')
  debe(/SIN APLICAR/.test(sql.split('\n')[0]) && /disable trigger user/.test(sql), 'la cabecera dice «SIN APLICAR» y apaga los disparadores de trips dentro de la transacción')
  const paso1 = sql.slice(sql.indexOf('PASO 1 · MIRAR'), sql.indexOf('PASO 2 · LIMPIAR'))
  const paso2 = sql.slice(sql.indexOf('begin;'))
  const bd = await crearBaseDePrueba({ migraciones: /^\d{4}_.*\.sql$/, alFallar: (m) => console.log('  (migración)', String(m).slice(0, 120)) })
  const uid = '00000000-0000-4000-8000-0000000000e1'
  const otro = '00000000-0000-4000-8000-0000000000e2'
  await bd.db.exec(`insert into auth.users (id, email) values ('${uid}', 'a@prueba.test'), ('${otro}', 'b@prueba.test') on conflict do nothing`)
  await bd.db.exec(`insert into public.travelers (id) values ('${uid}'), ('${otro}') on conflict do nothing`)
  const rutaConCopia = { ...rutaLz, originalRoute: conCopia(rutaLz).originalRoute }
  const ins = async (u, ruta) => (await bd.q('insert into public.trips (traveler_id, route, updated_at) values ($1, $2::jsonb, $3) returning id', [u, JSON.stringify(ruta), '2026-11-01T10:00:00Z']))[0].id
  const t1 = await ins(uid, rutaConCopia)
  const t2 = await ins(uid, rutaConCopia)
  const t3 = await ins(otro, rutaLz) // ya limpio
  const antes = await bd.q('select id, updated_at, guardado_en from public.trips order by id')
  const cambiosAntes = await bd.q('select trip_id, cambiado_en from public.trip_cambios order by trip_id').catch(() => [])
  const avisosAntes = await bd.q("select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name = 'avisos_de_viajeros'").catch(() => [{ n: 0 }])
  // El PASO 1 (solo lee): se parte en sus dos select y se ejecuta cada uno
  const selects = paso1.split(';').map((s) => s.slice(Math.max(0, s.search(/^select/m)))).filter((s) => /^select/.test(s)).map((s) => s.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n').trim())
  const resumen = (await bd.q(selects[0]))[0]
  console.log('   PASO 1:', JSON.stringify(resumen))
  debe(Number(resumen.viajes_con_copia) === 2 && Number(resumen.viajes_en_total) === 3, 'el PASO 1 cuenta 2 viajes con copia de 3')
  debe(Number(resumen.bytes_route_despues) < Number(resumen.bytes_route_antes) && Number(resumen.porcentaje_que_queda) < 100, 'y dice cuánto pesa antes y después')
  const lista = await bd.q(selects[1])
  debe(lista.length === 2 && lista.every((f) => Number(f.bytes_despues) < Number(f.bytes_antes)), 'el detalle lista los 2 viajes con su antes y su después')
  const filaComprobarAntes = (await bd.q(comprobar))[0]
  debe(filaComprobarAntes.todo === false && filaComprobarAntes.ningun_viaje_con_copia === false, 'antes de limpiar, COMPROBAR dice que no (todo = false)')
  // El PASO 2 (varias sentencias, una transacción)
  await bd.db.exec(paso2)
  const filas = await bd.q('select id, route, updated_at, guardado_en from public.trips order by id')
  debe(filas.every((f) => !('originalRoute' in f.route)), 'tras el PASO 2 ningún viaje lleva originalRoute')
  debe(filas.every((f) => f.route.days.length === rutaLz.days.length && f.route.destination === rutaLz.destination && canon(f.route.answers) === canon(rutaLz.answers)), 'y el resto de la ruta queda igual (días, destino, respuestas)')
  debe(JSON.stringify(filas.map((f) => [f.id, f.updated_at, f.guardado_en])) === JSON.stringify(antes.map((f) => [f.id, f.updated_at, f.guardado_en])), 'updated_at y guardado_en no cambian (ningún móvil cree que el viaje cambió)')
  const cambiosDespues = await bd.q('select trip_id, cambiado_en from public.trip_cambios order by trip_id').catch(() => [])
  debe(JSON.stringify(cambiosDespues) === JSON.stringify(cambiosAntes), 'no se toca trip_cambios (nada despierta a los móviles por Realtime)')
  void avisosAntes
  const apagados = await bd.q("select count(*)::int as n from pg_trigger where tgrelid = 'public.trips'::regclass and not tgisinternal and tgenabled <> 'O'")
  debe(apagados[0].n === 0, 'los disparadores de trips vuelven a estar encendidos')
  const una = await bd.q(comprobar)
  debe(una.length === 1 && Object.values(una[0]).every((v) => v === true) && una[0].todo === true, `COMPROBAR devuelve UNA fila con todo en true (${JSON.stringify(una[0])})`)
  // Repetible
  await bd.db.exec(paso2)
  const otraVez = await bd.q('select count(*)::int as n from public.trips where route ? \'originalRoute\'')
  debe(otraVez[0].n === 0, 'repetible: pegarlo otra vez no hace nada y no falla')
  // Contraste: SIN apagar los disparadores, un update de route SÍ habría tocado trip_cambios (por eso se apagan)
  await bd.q("update public.trips set route = route || '{\"x\":1}'::jsonb where id = $1", [t3])
  const conTrigger = await bd.q('select cambiado_en from public.trip_cambios where trip_id = $1', [t3]).catch(() => [])
  debe(conTrigger.length === 1, 'contraste: un update normal de route SÍ pone al día trip_cambios (por eso el PASO 2 apaga los disparadores)')
  void t1
  void t2
  await bd.db.close?.()
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
