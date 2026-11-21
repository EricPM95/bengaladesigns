// La prueba de la V37b: LA RUTA ORIGINAL EN LA NUBE (columna `trips.route_original`, migración 0092): se SUBE una sola vez (con un guardado normal) y SOLO se BAJA al confirmar «Sí, recuperar» en la varita.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV37b.mjs
// (1) Código: ninguna consulta de `trips` pide la columna salvo la de la varita. (2) La migración en PGlite con todas las migraciones reales: columna, disparador que protege la original, COMPROBAR_0092.
// (3) En la app (Chrome, fetch de mentira, nada contra producción): al abrir / listar / sincronizar NO se pide la columna; la varita la pide UNA vez y recupera con ella; sin la 0092 todo sigue.
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

/* ── 1. El código ── */
console.log('1. El código')
{
  const dondePide = []
  const recorre = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`
      if (e.isDirectory()) recorre(p)
      else if (/\.(ts|tsx)$/.test(e.name) && /select\([^)]*route_original/.test(leer(p))) dondePide.push(p.replace(/\\/g, '/'))
    }
  }
  recorre('src')
  debe(dondePide.length === 1 && dondePide[0] === 'src/lib/copiaOriginalNube.ts', `solo UNA consulta pide la columna (la de la varita): ${dondePide.join(', ') || 'ninguna'}`)
  for (const d of ['server', 'api']) if (fs.existsSync(d)) { /* el servidor no la lee */ }
  debe(!/route_original/.test(['server/index.js', 'server/cuentas.js'].map(leer).join('')), 'el servidor no lee la columna')
  const nube = leer('src/lib/copiaOriginalNube.ts')
  debe(/asegurarCopiaOriginal/.test(leer('src/components/route/RouteOverview.tsx')) && /onConfirm/.test(leer('src/components/route/RouteOverview.tsx')), 'la varita llama a la bajada al confirmar')
  const usos = []
  const recorre2 = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`
      if (e.isDirectory()) recorre2(p)
      else if (/\.(ts|tsx)$/.test(e.name) && /asegurarCopiaOriginal\(/.test(leer(p)) && !p.endsWith('copiaOriginalNube.ts')) usos.push(p.replace(/\\/g, '/'))
    }
  }
  recorre2('src')
  debe(usos.length === 1 && usos[0] === 'src/components/route/RouteOverview.tsx', `solo se llama desde la varita (${usos.join(', ')})`)
  debe(/CADA CUÁNTO|Cada cuánto/i.test(nube) && /Cuánto baja/i.test(nube), 'la consulta lleva su comentario de cada cuánto y cuánto baja (regla V36)')
  debe(/Cada cuánto/.test(leer('src/lib/tripPersistence.ts')), 'la subida lleva su comentario de cada cuánto y cuánto')
}

/* ── 2. La migración ── */
console.log('2. La migración 0092 (PGlite, todas las migraciones)')
{
  const bd = await crearBaseDePrueba({ migraciones: /^\d{4}_.*\.sql$/, alFallar: (m) => console.log('  (migración)', String(m).slice(0, 120)) })
  const { q, servidor, nuevoUsuario } = bd
  const comprobar = leer('docs/dias/COMPROBAR_0092.sql')
  debe(/SIN APLICAR/.test(leer('supabase/migrations/0092_route_original.sql').split('\n')[0]), 'la cabecera dice «SIN APLICAR»')
  debe(bd.aplicadas.includes('0092_route_original.sql'), 'la 0092 se aplica con todas las demás')
  const fila = (await q(comprobar))[0]
  debe(fila.todo === true && fila.columna_route_original === true && fila.funcion_de_proteccion === true && fila.disparador_puesto === true, `COMPROBAR_0092 da todo en true (${JSON.stringify(fila)})`)
  const uid = await nuevoUsuario('ana@correo.es')
  const A = { days: [{ id: 'd1', title: 'Original' }], answers: {} }
  const B = { days: [{ id: 'd1', title: 'Ya editado' }], answers: {} }
  const viaje = (await servidor(() => q("insert into public.trips (traveler_id, route, bookings) values ($1, $2, '{}') returning id, route_original", [uid, JSON.stringify({ id: 'ruta-1', days: [] })])))[0]
  debe(viaje.route_original === null, 'un viaje nuevo sin copia tiene la columna a null')
  const leerOrig = async () => (await servidor(() => q('select route_original from public.trips where id = $1', [viaje.id])))[0].route_original
  await servidor(() => q('update public.trips set route_original = $2 where id = $1', [viaje.id, JSON.stringify(A)]))
  debe(JSON.stringify(await leerOrig()) === JSON.stringify(A), 'la primera vez se guarda la original')
  await servidor(() => q('update public.trips set route_original = $2, updated_at = now() where id = $1', [viaje.id, JSON.stringify(B)]))
  debe(JSON.stringify(await leerOrig()) === JSON.stringify(A), 'mientras la ruta sea la misma (mismo id), otra copia NO pisa la original')
  await servidor(() => q('update public.trips set route_original = null where id = $1', [viaje.id]))
  debe(JSON.stringify(await leerOrig()) === JSON.stringify(A), 'ni un null la borra')
  await servidor(() => q("update public.trips set route = $2, route_original = $3 where id = $1", [viaje.id, JSON.stringify({ id: 'ruta-2', days: [] }), JSON.stringify(B)]))
  debe(JSON.stringify(await leerOrig()) === JSON.stringify(B), 'si la ruta se rehace (id nuevo), la original se reemplaza')
  await servidor(() => q("update public.trips set bookings = '{\"x\":1}' where id = $1", [viaje.id]))
  debe(JSON.stringify(await leerOrig()) === JSON.stringify(B), 'guardar otra cosa del viaje no la toca')
  // Repetible
  await bd.db.exec(leer('supabase/migrations/0092_route_original.sql'))
  debe((await q(comprobar))[0].todo === true, 'la migración se puede pegar dos veces')
  // «Empezar de cero» y borrar la cuenta: la columna es de la fila, que se borra entera.
  await servidor(() => q('select public.empezar_de_cero($1)', [uid]))
  debe((await servidor(() => q('select count(*)::int as n from public.trips where id = $1', [viaje.id])))[0].n === 0, 'empezar_de_cero borra el viaje con su copia (no hace falta tocar la función)')
}

/* ── 3. En la app ── */
console.log('3. En la app: subir una vez, bajar solo en la varita')
const app = await abrirApp(process.env.APP_URL || 'http://localhost:5173', { ruta: '/?cuentas=on' })
let resultado
try {
  const rutaLz = JSON.stringify(JSON.parse(leer('docs/dias/_hoy3_ruta_eric.json')).route)
  resultado = await app.evaluar(`(async () => {
    const salida = {}
    const fetchReal = window.fetch.bind(window)
    const peticiones = []
    let nube = null
    let sinColumna = false
    window.fetch = async (entrada, init) => {
      const url = typeof entrada === 'string' ? entrada : entrada.url
      if (!/supabase\\.co/.test(url)) return fetchReal(entrada, init)
      const metodo = (init && init.method) || 'GET'
      const cuerpo = init && typeof init.body === 'string' ? init.body : ''
      const cab = new Headers((init && init.headers) || {})
      const unico = /vnd\\.pgrst\\.object/.test(cab.get('Accept') || '')
      if (/\\/rest\\/v1\\/trips/.test(url)) {
        peticiones.push({ metodo, url, cuerpo })
        if (metodo === 'GET') {
          if (/route_original/.test(url) && sinColumna) return new Response(JSON.stringify({ code: 'PGRST204', message: "Could not find the 'route_original' column of 'trips' in the schema cache" }), { status: 400, headers: { 'content-type': 'application/json' } })
          const dato = /select=route_original/.test(url) ? { route_original: nube ? nube.route_original : null } : nube
          return new Response(JSON.stringify(unico ? (dato || {}) : (nube ? [nube] : [])), { status: 200, headers: { 'content-type': 'application/json' } })
        }
        if (sinColumna && /route_original/.test(cuerpo)) return new Response(JSON.stringify({ code: 'PGRST204', message: "Could not find the 'route_original' column of 'trips' in the schema cache" }), { status: 400, headers: { 'content-type': 'application/json' } })
        const fila = { id: 'viaje-prueba-1', updated_at: new Date().toISOString(), guardado_en: null }
        return new Response(JSON.stringify(unico ? fila : [fila]), { status: metodo === 'POST' ? 201 : 200, headers: { 'content-type': 'application/json' } })
      }
      return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })
    }
    const P = await import('/src/lib/tripPersistence.ts')
    const C = await import('/src/lib/copiaOriginal.ts')
    const N = await import('/src/lib/copiaOriginalNube.ts')
    const urls = (f) => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(f))
    const todasStore = []
    for (const n of urls('/src/store/useRouteStore.ts')) todasStore.push((await import(n)).useRouteStore)
    if (todasStore.length === 0) todasStore.push((await import('/src/store/useRouteStore.ts')).useRouteStore)
    const todasSync = []
    for (const n of urls('/src/store/useSyncStore.ts')) todasSync.push((await import(n)).useSyncStore)
    if (todasSync.length === 0) todasSync.push((await import('/src/store/useSyncStore.ts')).useSyncStore)
    let store = todasStore[0]
    const lz = ${rutaLz}
    const original = JSON.parse(JSON.stringify({ days: lz.days.map(({ originalSnapshot, ...d }) => d), answers: lz.answers }))
    const dia0 = lz.days.find((d) => !d.isReturnLeg)
    const conCambio = { ...lz, days: lz.days.map((d) => (d.id === dia0.id ? { ...d, title: 'EDITADO EN OTRO MÓVIL' } : d)) }
    try { localStorage.clear() } catch (e) {}

    // === A. OTRO MÓVIL abre el viaje: no se pide la columna, ni al listar, ni al abrir, ni al sincronizar ===
    nube = { id: 'viaje-prueba-1', traveler_id: 'yo-prueba', updated_at: '2026-11-20T10:00:00Z', guardado_en: null, route: conCambio, route_original: original, bookings: {}, wishlist: [], ui_state: { mode: 'route', activeDayId: null }, generation_state: null }
    peticiones.length = 0
    await P.loadAllTrips('yo-prueba').catch(() => null)
    const cargado = await P.loadOneTrip('yo-prueba', 'viaje-prueba-1')
    for (const s of todasSync) s.setState({ activeTripId: 'viaje-prueba-1' })
    for (const s of todasStore) s.getState().hydrateTrip(cargado.viaje)
    store = todasStore.find((s) => s.getState().route) || store
    await P.saveTrip('yo-prueba', 'viaje-prueba-1', { route: store.getState().route, bookings: {}, wishlist: [], uiState: { mode: 'route', activeDayId: null } }).catch(() => null)
    salida.peticionesDeAbrir = peticiones.length
    salida.abrirPideLaColumna = peticiones.some((p) => /route_original/.test(p.url))
    salida.abrirSubeLaColumna = peticiones.some((p) => p.metodo !== 'GET' && /route_original/.test(p.cuerpo))
    const abierta = store.getState().route
    salida.derivadaAlAbrir = abierta.originalRoute && abierta.originalRoute.days.find((d) => d.id === dia0.id).title === 'EDITADO EN OTRO MÓVIL'
    salida.noEsReal = C.copiaEsReal(lz.id) === false

    // === B. La varita: SOLO aquí se baja, una vez, y se recupera con la original de verdad ===
    peticiones.length = 0
    const bajo = await N.asegurarCopiaOriginal()
    const pedidas = peticiones.filter((p) => /route_original/.test(p.url))
    salida.varitaBaja = bajo
    salida.varitaPideUnaVez = pedidas.length === 1 && pedidas[0].metodo === 'GET' && /select=route_original/.test(pedidas[0].url) && /id=eq\\.viaje-prueba-1/.test(pedidas[0].url)
    const orig = store.getState().route
    salida.originalDeVerdadEnMemoria = orig.originalRoute && orig.originalRoute.days.find((d) => d.id === dia0.id).title === original.days.find((d) => d.id === dia0.id).title
    store.getState().restoreOriginalRoute()
    salida.recuperaConLaOriginal = store.getState().route.days.find((d) => d.id === dia0.id).title === original.days.find((d) => d.id === dia0.id).title
    salida.esRealYSinPendiente = C.copiaEsReal(lz.id) === true && C.copiaPendienteDeSubir(lz.id) === null
    peticiones.length = 0
    const otraVez = await N.asegurarCopiaOriginal()
    salida.noVuelveAPedir = otraVez === false && peticiones.length === 0
    // lo que se guarda después NO lleva la copia
    await P.saveTrip('yo-prueba', 'viaje-prueba-1', { route: store.getState().route, bookings: {}, wishlist: [], uiState: { mode: 'route', activeDayId: null } }).catch(() => null)
    salida.guardarNoLaSube = !peticiones.some((p) => p.metodo !== 'GET' && /route_original/.test(p.cuerpo))

    // === C. La nube no tiene copia: se pregunta una vez y se usa la derivada ===
    try { localStorage.clear() } catch (e) {}
    nube = { ...nube, route_original: null }
    for (const s of todasStore) s.getState().hydrateTrip({ ...cargado.viaje, route: conCambio })
    peticiones.length = 0
    await N.asegurarCopiaOriginal()
    const antes = peticiones.length
    await N.asegurarCopiaOriginal()
    salida.sinCopiaEnNubePreguntaUnaVez = antes === 1 && peticiones.length === 1

    // === D. Sin la migración 0092: guardar sigue funcionando y no se vuelve a mandar la columna; la varita no falla ===
    try { localStorage.clear() } catch (e) {}
    sinColumna = true
    for (const s of todasStore) s.getState().hydrateTrip({ ...cargado.viaje, route: lz })
    store.getState().setRoute(JSON.parse(JSON.stringify(store.getState().route)))
    peticiones.length = 0
    const idDeNuevo = await P.saveTrip('yo-prueba', null, { route: store.getState().route, bookings: {}, wishlist: [], uiState: { mode: 'route', activeDayId: null } })
    const posts = peticiones.filter((p) => p.metodo === 'POST')
    salida.sinColumnaGuardaIgual = Boolean(idDeNuevo) && posts.length === 2 && /route_original/.test(posts[0].cuerpo) && !/route_original/.test(posts[1].cuerpo)
    peticiones.length = 0
    await P.saveTrip('yo-prueba', idDeNuevo, { route: { ...store.getState().route, name: 'otro' }, bookings: {}, wishlist: [], uiState: { mode: 'route', activeDayId: null } }).catch(() => null)
    salida.sinColumnaNoReintenta = !peticiones.some((p) => /route_original/.test(p.cuerpo))
    let varitaFalla = false
    try { await N.asegurarCopiaOriginal() } catch (e) { varitaFalla = true }
    salida.varitaSinColumnaNoFalla = varitaFalla === false
    window.fetch = fetchReal
    return JSON.stringify(salida)
  })()`)
} finally {
  app.cerrar()
}
const r = JSON.parse(resultado ?? '{}')
console.log('   ' + JSON.stringify(r))
debe(r.abrirPideLaColumna === false && r.abrirSubeLaColumna === false, `al listar, abrir y sincronizar el viaje NO se pide ni se sube la columna (${r.peticionesDeAbrir} peticiones)`)
debe(r.derivadaAlAbrir === true && r.noEsReal === true, 'en el otro móvil, al abrir, la «original» es la derivada (lo que se abrió) y no se da por real')
debe(r.varitaBaja === true && r.varitaPideUnaVez === true, 'la varita pide la columna UNA vez (solo esa columna, solo ese viaje)')
debe(r.originalDeVerdadEnMemoria === true && r.recuperaConLaOriginal === true, 'y recupera con la ruta original de verdad, no con la editada')
debe(r.esRealYSinPendiente === true && r.noVuelveAPedir === true, 'queda como real, sin nada pendiente, y no se vuelve a pedir')
debe(r.guardarNoLaSube === true, 'guardar el viaje después no la vuelve a mandar')
debe(r.sinCopiaEnNubePreguntaUnaVez === true, 'si la nube no tiene copia, se pregunta una sola vez y se usa la de este móvil')
debe(r.sinColumnaGuardaIgual === true, 'sin la migración 0092 el viaje se guarda igual (reintenta sin la columna)')
debe(r.sinColumnaNoReintenta === true && r.varitaSinColumnaNoFalla === true, 'sin la 0092 no se vuelve a mandar la columna y la varita no falla')

console.log(`\nPrueba V37b: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
