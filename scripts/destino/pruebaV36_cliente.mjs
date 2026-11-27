// La prueba de la Tanda V36: LA FUGA DE DATOS DE SUPABASE, el lado del móvil (src/). Ninguna petición sale a Supabase de verdad: Chrome tiene las peticiones a Supabase y a /api interceptadas (CDP `Fetch`) y las contesta
// un Supabase de mentira con tamaños REALISTAS (el viaje de Lanzarote de Eric: 49 KB). La app es la de verdad (HoyDuranteV2, TripSync, CompartidoHost, AvisosHost, gastos, propuestas, logros, fotos…).
//   (a) un día de HOY de 8 horas con el GPS moviéndose y 3 visitas: MENOS de 5 MB bajados de Supabase y pocas peticiones;
//   (b) la app quieta 10 minutos con la pantalla a la vista: casi cero;
//   (c) en segundo plano (pantalla oculta): CERO.
// El tiempo va acelerado (reloj de la página x100: 8 horas = unos 5 minutos de verdad; los relojes de 20 s o más se acortan igual, los cortos no).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV36_cliente.mjs
// Un solo Chrome: pide `.chrome.lock` y lo suelta al acabar. Formato del final: «N comprobaciones · M fallos».
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

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
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const KB = (b) => (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB'

/* ───────── 1. Lo que se lee en el código ───────── */
console.log('1. Lo que se lee en el código')
{
  const contador = leer('src/dev/contadorSupabase.ts')
  debe(/__supabaseContador/.test(contador) && /console\.error/.test(contador) && /60_000/.test(contador), 'el contador existe, avisa en rojo y mira cada minuto')
  const cliente = sinComentarios(leer('src/lib/supabaseClient.ts'))
  debe(/import\.meta\.env\.DEV \? crearFetchContado\(\)/.test(cliente) && /if \(import\.meta\.env\.DEV\) contarLlamadasAlServidor\(\)/.test(cliente), 'el cliente de Supabase solo usa el contador con `import.meta.env.DEV`')
  for (const [f, re, texto] of [
    ['src/components/compartir/CompartidoHost.tsx', /CADA_MS = 300_000/, 'viaje compartido: respaldo cada 5 min'],
    ['src/components/presupuesto/GastosCompartidosHost.tsx', /CADA_MS = 600_000/, 'gastos: cada 10 min'],
    ['src/components/propuesta/PropuestaHost.tsx', /CADA_MS = 600_000/, 'propuestas: cada 10 min'],
    ['src/components/avisos/AvisosHost.tsx', /CADA_MS = 300_000/, 'avisos: cada 5 min'],
    ['src/hooks/useLoSuyoDelViaje.ts', /600_000/, 'lo suyo del viaje: cada 10 min'],
  ]) debe(re.test(leer(f)), `${f}: ${texto}`)
  const cerca = leer('src/components/route/hoy/useCercaDeAqui.ts')
  debe(/QUIETO_METROS/.test(cerca) && /MAXIMO_SIN_PREGUNTAR_MS/.test(cerca), '«cerca de aquí» no repregunta si el viajero está quieto')
  const pedazos = leer('src/components/route/hoy/v2/usePedazosDeParada.ts')
  debe(/unaSolaVez\(/.test(pedazos) && !/parada\.coordinates\]/.test(pedazos), '«pedazos de la parada»: una sola pregunta y sin depender del objeto de coordenadas')
  debe(/SELLO_CADUCA_MS = 3 \* 60 \* 60 \* 1000/.test(leer('src/lib/tripPersistence.ts')) && /huellasDeLaNube/.test(leer('src/lib/tripPersistence.ts')), 'el sello del viaje caduca a las 3 horas (no cada 10 min) y un guardado idéntico a lo de la nube no se manda')
  debe(/listasRecientes/.test(leer('src/lib/fotosViaje.ts')), 'la lista de fotos del viaje se pide una vez aunque la pidan varias pantallas')
}

/* ───────── 2. Chrome con un Supabase de mentira ───────── */
// El candado de Chrome: uno solo a la vez.
const candado = '.chrome.lock'
const limite = Date.now() + 15 * 60 * 1000
for (;;) {
  try {
    fs.mkdirSync(candado)
    break
  } catch {
    if (Date.now() > limite) {
      console.log('✗ no se pudo coger .chrome.lock en 15 minutos')
      process.exit(1)
    }
    await new Promise((r) => setTimeout(r, 5000))
  }
}
const soltarCandado = () => {
  try {
    fs.rmdirSync(candado)
  } catch {
    /* ya suelto */
  }
}
process.on('exit', soltarCandado)

// (V44: ya NO se lee `.env.local`. El Vite estable de pruebas arranca con un Supabase de MENTIRA —`sin-nube-de-pruebas.supabase.co`, ver `_vite_estable.config.mjs`—; la app habla con esa dirección y el Chrome la intercepta. Con PERMITIR_SUPABASE_REAL=1 esta prueba no vale: no toca la nube de verdad.)
const hostSupabase = 'sin-nube-de-pruebas.supabase.co'
const ref = hostSupabase.split('.')[0]
const base = process.env.APP_URL || 'http://localhost:5173'
const origen = new URL(base).origin

const K = 100 // el reloj de la página va 100 veces más deprisa
let ahoraReal = Date.now() // se vuelve a poner justo antes de abrir la app (el reloj de la página arranca ahí)
const hoyCanarias = new Intl.DateTimeFormat('en-CA', { timeZone: 'Atlantic/Canary', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const inicioVirtual = Date.parse(`${hoyCanarias}T08:00:00Z`) // el día empieza a las 08:00 (hora de Canarias) y 8 h después son las 16:00: no cruza la medianoche
const ayer = new Date(Date.parse(`${hoyCanarias}T00:00:00Z`) - 86400_000).toISOString().slice(0, 10)
const finViaje = new Date(Date.parse(`${hoyCanarias}T00:00:00Z`) + 4 * 86400_000).toISOString().slice(0, 10)

// El viaje de verdad de Eric en Lanzarote (49 KB), con las fechas movidas para que hoy sea su día 2.
const fixture = JSON.parse(leer('docs/dias/_hoy3_ruta_eric.json'))
const ruta = fixture.route
ruta.answers.dateRange = { start: ayer, end: finViaje }
const TRIP_ID = '00000000-0000-4000-8000-0000000000aa'
const YO = '00000000-0000-4000-8000-0000000000e1'
const OTRA = '00000000-0000-4000-8000-0000000000a1'
let actualizadoEn = new Date(ahoraReal - 3600_000).toISOString()
// La «nube» de mentira guarda lo que le mandan (como la de verdad): la primera apertura de la app normaliza el viaje y lo guarda; las siguientes cargan ya eso.
let cambiosGuardados = {}
const filaViaje = () => ({ id: TRIP_ID, traveler_id: YO, guardado_en: null, updated_at: actualizadoEn, route: ruta, bookings: {}, wishlist: [], ui_state: { mode: 'today', activeDayId: null }, generation_state: null, ...cambiosGuardados })
const rutaLigera = {
  ligero: true,
  id: ruta.id,
  destination: ruta.destination,
  country: ruta.country,
  answers: ruta.answers,
  createdAt: ruta.createdAt,
  days: ruta.days.map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city, title: d.title, stops: d.stops.map((s) => ({ id: s.id, name: s.name, coordinates: s.coordinates })) })),
}
const relleno = (n) => 'x'.repeat(n)

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
const jwt = (exp) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: YO, aud: 'authenticated', role: 'authenticated', email: 'eric@prueba.test', is_anonymous: false, exp })}.firma`
const usuario = { id: YO, aud: 'authenticated', role: 'authenticated', email: 'eric@prueba.test', app_metadata: { provider: 'google' }, user_metadata: { name: 'Eric' }, is_anonymous: false, created_at: '2026-10-01T00:00:00Z' }
const sesion = (desdeSeg) => ({ access_token: jwt(desdeSeg + 3600), token_type: 'bearer', expires_in: 3600, expires_at: desdeSeg + 3600, refresh_token: 'refresco-de-prueba', user: usuario })

const ahoraVirtual = () => inicioVirtual + (Date.now() - ahoraReal) * K // la hora que marca el reloj de la página
const reloj = `(() => {
  const K = ${K}, R = Date, t0 = R.now(), v0 = ${inicioVirtual}
  const ahora = () => v0 + (R.now() - t0) * K
  class D extends R { constructor(...a) { if (a.length === 0) super(ahora()); else super(...a) } static now() { return ahora() } }
  window.Date = D
  const st = window.setTimeout.bind(window), si = window.setInterval.bind(window)
  const largo = (ms) => (ms >= 20000 ? ms / K : ms)
  window.setTimeout = (f, ms, ...r) => st(f, largo(ms || 0), ...r)
  window.setInterval = (f, ms, ...r) => si(f, largo(ms || 0), ...r)
  try { localStorage.setItem('sb-${ref}-auth-token', ${JSON.stringify(JSON.stringify(sesion(Math.floor(inicioVirtual / 1000))))}) } catch (e) {}
})()`

const app = await abrirApp(base, { ruta: '/robots.txt', sinEsperarRoot: true, esperaFija: 1, antes: reloj, ancho: 390, alto: 844 })
const peticiones = [] // todo lo que Chrome ha mandado a (falso) Supabase o a /api: { t, donde, etiqueta, metodo, bajado, subido }
let fase = 'carga'
const cuerpoDe = (r) => (r.postData ?? '').length

const contestar = async (id, estado, cuerpo, extra = {}) => {
  const texto = cuerpo === undefined || cuerpo === null ? '' : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)
  const cabeceras = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*', 'access-control-max-age': '86400', ...extra }
  await app.cdp('Fetch.fulfillRequest', { requestId: id, responseCode: estado, responseHeaders: Object.entries(cabeceras).map(([name, value]) => ({ name, value })), body: Buffer.from(texto).toString('base64') }).catch(() => undefined)
  return Buffer.byteLength(texto)
}
const columnas = (url, fila) => {
  const c = url.searchParams.get('select')
  if (!c || c === '*') return fila
  return Object.fromEntries(c.split(',').map((x) => x.trim()).filter(Boolean).map((x) => [x, fila[x]]))
}

async function aSupabase(r, url) {
  const p = url.pathname
  const metodo = r.method
  const soloUno = /vnd\.pgrst\.object/.test(r.headers.Accept ?? r.headers.accept ?? '')
  if (metodo === 'OPTIONS') return contestar(r.requestId, 204, '')
  if (p.startsWith('/auth/v1/token')) return contestar(r.requestId, 200, sesion(Math.floor(ahoraVirtual() / 1000)))
  if (p.startsWith('/auth/v1/user')) return contestar(r.requestId, 200, usuario)
  if (p.startsWith('/auth/v1/')) return contestar(r.requestId, 200, {})
  if (p.startsWith('/storage/v1/object/sign/')) {
    const paths = JSON.parse(r.postData || '{}').paths ?? []
    return contestar(r.requestId, 200, paths.map((x) => ({ error: null, path: x, signedURL: `/object/sign/fotos-viaje/${x}?token=${relleno(180)}` })))
  }
  if (p.startsWith('/storage/v1/')) return contestar(r.requestId, 404, { error: 'Not found' })
  const rpc = /\/rest\/v1\/rpc\/([^/]+)/.exec(p)?.[1]
  if (rpc) {
    if (rpc === 'viajes_lista') return contestar(r.requestId, 200, [{ ...filaViaje(), route: rutaLigera }])
    if (rpc === 'gente_del_viaje')
      return contestar(r.requestId, 200, [
        { id: YO, nombre: 'Eric', inicial: 'E', foto: null, encuadre: null, es_admin: true, permiso: 'admin', es_yo: true },
        { id: OTRA, nombre: 'Alicia', inicial: 'A', foto: null, encuadre: null, es_admin: false, permiso: 'editar', es_yo: false },
      ])
    if (rpc === 'lo_suyo_del_grupo' || rpc === 'entradas_del_grupo' || rpc === 'plazas_sin_dar') return contestar(r.requestId, 200, [])
    return contestar(r.requestId, 200, null)
  }
  const tabla = /\/rest\/v1\/([^/?]+)/.exec(p)?.[1]
  if (metodo !== 'GET') {
    const devuelve = url.searchParams.has('select') || /return=representation/.test(r.headers.Prefer ?? r.headers.prefer ?? '')
    if (tabla === 'trips' && metodo === 'PATCH') {
      actualizadoEn = new Date().toISOString()
      try {
        const { route: rr, bookings: bb, wishlist: ww, ui_state: uu } = JSON.parse(r.postData || '{}')
        cambiosGuardados = { ...cambiosGuardados, ...(rr ? { route: rr } : {}), ...(bb ? { bookings: bb } : {}), ...(ww ? { wishlist: ww } : {}), ...(uu ? { ui_state: uu } : {}) }
      } catch {
        /* cuerpo raro: no se guarda */
      }
      const fila = columnas(url, filaViaje())
      return devuelve ? contestar(r.requestId, 200, soloUno ? fila : [fila]) : contestar(r.requestId, 204, '')
    }
    return devuelve ? contestar(r.requestId, metodo === 'POST' ? 201 : 200, soloUno ? {} : []) : contestar(r.requestId, 204, '')
  }
  if (tabla === 'trips') {
    if (!url.searchParams.has('id') && !url.searchParams.has('traveler_id')) return contestar(r.requestId, 200, [columnas(url, filaViaje())])
    const fila = columnas(url, filaViaje())
    return contestar(r.requestId, 200, soloUno ? fila : [fila])
  }
  if (tabla === 'travelers') {
    const fila = columnas(url, { id: YO, nombre: 'Eric', foto_path: null, foto_encuadre: null, portadas: null, moneda: 'EUR', globo_pasaporte: null, sellos_estampados: {}, email: 'eric@prueba.test' })
    return contestar(r.requestId, 200, soloUno ? fila : [fila])
  }
  if (tabla === 'billetes_personales') {
    // (Finde, paso 5) Un billete guardado en la nube con su QR: ≈ 150 KB. Es de hace años (la nube NO es más nueva que el móvil): solo el sello debe bajar, nunca el `datos` entero.
    const fila = columnas(url, { trip_id: TRIP_ID, user_id: YO, datos: { arrival: { codigo: { imagen: relleno(150 * 1024) }, dueno: YO } }, actualizado_en: '2020-01-01T00:00:00Z' })
    return contestar(r.requestId, 200, soloUno ? fila : [fila])
  }
  if (tabla === 'trip_photos') {
    const filas = Array.from({ length: 12 }, (_, i) => ({ id: `f${i}`, trip_id: TRIP_ID, day_id: 'day-2', day_number: 2, stop_name: 'Parada', storage_path: `${YO}/${TRIP_ID}/f${i}.jpg`, width: 1600, height: 1200, bytes: 90000, created_at: new Date(ahoraReal - i * 60000).toISOString() }))
    return contestar(r.requestId, 200, filas.map((f) => columnas(url, f)))
  }
  if (soloUno) return contestar(r.requestId, 406, { code: 'PGRST116', details: 'The result contains 0 rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned' })
  return contestar(r.requestId, 200, [])
}

async function alServidor(r, url) {
  const p = url.pathname
  if (r.method === 'OPTIONS') return contestar(r.requestId, 204, '')
  // Los tamaños son una SUPOSICIÓN (el servidor de verdad no está): lo que de verdad se mide es CUÁNTAS veces pregunta el móvil.
  if (p === '/api/logros/cerca') return contestar(r.requestId, 200, { ok: true, cerca: [], juego: null, juego_sitio: null, fuera_de_ruta: null, junto_a: null, reto: null, retos: [], _relleno: relleno(1500) })
  if (p === '/api/logros/estado') return contestar(r.requestId, 200, { ok: false, _relleno: relleno(20 * 1024) })
  if (p === '/api/logros/ganados') return contestar(r.requestId, 200, { ok: false, _relleno: relleno(15 * 1024) })
  if (p === '/api/logros/companero') return contestar(r.requestId, 200, { ok: true, pendientes: [], sin_pase: false })
  if (p === '/api/avisos') return contestar(r.requestId, 200, { ok: true, avisos: [], sin_leer: 0, _relleno: relleno(2000) })
  return contestar(r.requestId, 404, { ok: false })
}

let avisosDePagina = 0
const quitar = app.escuchar(async (d) => {
  if (process.env.V36_DEBUG && (d.method === 'Runtime.exceptionThrown' || (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error')) && avisosDePagina++ < 15) console.log('   [pagina]', JSON.stringify(d.params).slice(0, 300))
  if (d.method !== 'Fetch.requestPaused') return
  const r = d.params.request
  const url = new URL(r.url)
  const esSupabase = url.host === hostSupabase
  if (process.env.V36_DEBUG && esSupabase && r.method === 'PATCH' && url.pathname.includes('/rest/v1/trips')) fs.writeFileSync(`${process.env.V36_DEBUG_DIR || '.'}/v36_patch_${Date.now()}.json`, r.postData ?? '')
  const donde = esSupabase ? 'supabase' : 'api'
  const subido = cuerpoDe(r)
  const bajado = esSupabase ? await aSupabase({ ...r, requestId: d.params.requestId }, url) : await alServidor({ ...r, requestId: d.params.requestId }, url)
  const etiqueta = esSupabase ? (/\/rpc\/([^/]+)/.exec(url.pathname)?.[0].replace('/rpc/', 'rpc/') ?? url.pathname.replace('/rest/v1/', 'rest/').replace('/auth/v1/', 'auth/').replace('/storage/v1/', 'storage/')) : url.pathname
  if (r.method !== 'OPTIONS') peticiones.push({ t: Date.now(), fase, // (las consultas previas de permiso del navegador, OPTIONS, no bajan datos ni se cuentan)
    donde, etiqueta, metodo: r.method, bajado, subido })
})

await app.cdp('Network.setBlockedURLs', { urls: [`*://${hostSupabase}/realtime/*`, `wss://${hostSupabase}/*`] }) // Realtime es un enchufe web: no se contesta (no cuenta como consulta a la base)
await app.cdp('Fetch.enable', { patterns: [{ urlPattern: `https://${hostSupabase}/*`, requestStage: 'Request' }, { urlPattern: `${origen}/api/*`, requestStage: 'Request' }] })
await app.cdp('Browser.grantPermissions', { origin: origen, permissions: ['geolocation'] }).catch(() => undefined)
await app.cdp('Emulation.setGeolocationOverride', { latitude: 29.006, longitude: -13.753, accuracy: 20 })

const resumen = (lista) => {
  const por = new Map()
  for (const p of lista) {
    const k = `${p.donde}:${p.metodo} ${p.etiqueta}`
    const f = por.get(k) ?? { n: 0, bajado: 0, subido: 0 }
    f.n++
    f.bajado += p.bajado
    f.subido += p.subido
    por.set(k, f)
  }
  return [...por.entries()].sort((a, b) => b[1].bajado - a[1].bajado)
}
const suma = (lista, donde) => {
  const l = lista.filter((p) => p.donde === donde)
  return { n: l.length, bajado: l.reduce((a, p) => a + p.bajado, 0), subido: l.reduce((a, p) => a + p.subido, 0) }
}
const pintar = (titulo, lista) => {
  const s = suma(lista, 'supabase')
  const a = suma(lista, 'api')
  console.log(`\n${titulo}: Supabase ${s.n} peticiones, baja ${KB(s.bajado)}, sube ${KB(s.subido)} · /api ${a.n} llamadas (${KB(a.bajado)}, tamaños supuestos)`)
  for (const [k, f] of resumen(lista).slice(0, 6)) console.log(`     ${String(f.n).padStart(4)} x ${k}  baja ${KB(f.bajado)}`)
}

try {
  // (Vite pone `?t=…` a un módulo que se ha cambiado desde que arrancó: se coge la dirección EXACTA con la que lo cargó la app, para no tener una segunda copia del almacén.)
  const R = "(await (async () => { for (const n of performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('/src/store/useRouteStore.ts'))) { const m = await import(n); if (m.useRouteStore.getState().route) return m } return await import('/src/store/useRouteStore.ts') })()).useRouteStore"
  const URL_APP = `${base}/?cuentas=on&logros=on&apertura=0&version=completa&hoy2=on`
  const esperarHoy = async () => {
    let enHoy = false
    for (let i = 0; i < 360 && !enHoy; i++) {
      enHoy = await Promise.race([app.evaluar(`(async () => { const s = ${R}.getState(); return JSON.stringify({ mode: s.mode, ruta: Boolean(s.route) }) })()`).then((r) => { if (process.env.V36_DEBUG) console.log('   [estado]', r); return typeof r === 'string' && /"mode":"today","ruta":true/.test(r) }).catch((e) => { if (process.env.V36_DEBUG) console.log('   [evaluar]', String(e).slice(0, 200)); return false }), app.esp(2000).then(() => false)])
      if (!enHoy) await app.esp(250)
      if (process.env.V36_DEBUG && i % 8 === 0) console.log('   ...', i, 'peticiones', peticiones.length, JSON.stringify(resumen(peticiones).slice(0, 6).map(([k, f]) => `${f.n}x ${k}`)), enHoy, (await Promise.race([app.evaluar('document.readyState + " " + document.body.innerText.slice(0, 80)').catch((e) => String(e)), app.esp(1500).then(() => 'evaluar colgado')])))
    }
    return enHoy
  }
  // Primera apertura (calentamiento): la app normaliza el viaje de Eric (colores, copia original…) y lo guarda UNA vez. La medida es la segunda, con el viaje ya normalizado en la «nube».
  ahoraReal = Date.now()
  await app.cdp('Page.navigate', { url: URL_APP })
  await esperarHoy()
  await app.esp(5000)
  peticiones.length = 0
  ahoraReal = Date.now()
  await app.cdp('Page.navigate', { url: URL_APP })
  console.log('(abierta la app, esperando HOY)')
  const enHoy = await esperarHoy()
  debe(enHoy, 'la app abre el viaje de hoy en HOY con el Supabase de mentira (viaje entero bajado de la «nube»)')
  await app.esp(4000)
  pintar('CARGA (abrir la app hasta tener HOY)', peticiones.filter((p) => p.fase === 'carga'))
  const total = (lista) => suma(lista, 'supabase')
  debe(total(peticiones).bajado < 400 * 1024, `abrir la app baja menos de 400 KB de Supabase (bajó ${KB(total(peticiones).bajado)})`)
  const contadorCarga = await app.evaluar('JSON.stringify(window.__supabaseContador ? window.__supabaseContador.leer().total : null)')
  debe(contadorCarga && JSON.parse(contadorCarga).peticiones > 0, 'el contador de desarrollo (`window.__supabaseContador`) cuenta peticiones')
  await app.evaluar('window.__supabaseContador && window.__supabaseContador.reiniciar(); true')

  // Se espera por la HORA DE LA PÁGINA (no por un número de segundos de verdad): si la página va lenta, el día no se estira ni se encoge.
  const esperarVirtual = async (ms) => {
    const alvo = ahoraVirtual() + ms
    while (ahoraVirtual() < alvo) await app.esp(100)
  }

  /* ── (b) la app quieta 10 minutos, con la pantalla a la vista ── */
  console.log('(b) quieta...')
  fase = 'quieta'
  await esperarVirtual(10 * 60_000)
  const quieta = peticiones.filter((p) => p.fase === 'quieta')
  pintar('(b) QUIETA 10 MINUTOS, A LA VISTA', quieta)
  debe(total(quieta).n <= 30, `(b) quieta 10 min a la vista: como mucho 30 peticiones a Supabase (hubo ${total(quieta).n})`)
  debe(total(quieta).bajado < 100 * 1024, `(b) quieta 10 min a la vista: menos de 100 KB (bajó ${KB(total(quieta).bajado)})`)
  debe(!quieta.some((p) => p.donde === 'supabase' && /rest\/trips/.test(p.etiqueta) && p.bajado > 20 * 1024), '(b) quieta 10 min: no se baja el viaje entero')

  debe(!quieta.some((p) => p.metodo === 'PATCH'), '(b) quieta 10 min: la app no guarda el viaje si nadie ha cambiado nada (cada recarga de la lista de personas guardaba la ruta entera)')

  /* ── (d) (Finde, paso 5) cambiar de pestaña: lo que baja cada una, la primera vez y al volver (la copia del móvil debe bastar) ── */
  console.log('(d) pestañas...')
  const irA = (nombre) => app.evaluar(`(() => { const b = document.querySelector('nav[aria-label="Barra del viaje"] button[aria-label^="${nombre}"]'); if (b) b.click(); return Boolean(b) })()`)
  const resultadoPestanas = []
  for (const vuelta of [1, 2]) {
    for (const nombre of ['Ruta', 'Días', 'Explorar', 'Reservas', 'Hoy']) {
      fase = `pestana:${vuelta}:${nombre}`
      const hay = await irA(nombre)
      await app.esp(2500)
      const lista = peticiones.filter((p) => p.fase === fase)
      const s = total(lista)
      resultadoPestanas.push({ vuelta, nombre, hay, n: s.n, bajado: s.bajado, enteros: lista.filter((p) => p.donde === 'supabase' && p.etiqueta.includes('rest/trips') && p.bajado > 20 * 1024).length, billetes: lista.filter((p) => /billetes_personales/.test(p.etiqueta)).reduce((a, p) => a + p.bajado, 0) })
    }
  }
  console.log('   pestaña (vuelta): peticiones a Supabase · KB bajados · viaje entero · KB de billetes_personales')
  for (const r of resultadoPestanas) console.log(`   ${r.nombre.padEnd(9)} (${r.vuelta}) ${String(r.n).padStart(3)} · ${KB(r.bajado).padStart(7)} · ${r.enteros} · ${KB(r.billetes)}${r.hay ? '' : '  (el botón no está)'}`)
  debe(resultadoPestanas.filter((r) => r.hay).length >= 8, '(d) la barra de abajo tiene las pestañas para medir')
  debe(resultadoPestanas.every((r) => r.enteros === 0), '(d) cambiar de pestaña NO baja el viaje entero')
  debe(resultadoPestanas.filter((r) => r.vuelta === 2).reduce((a, r) => a + r.billetes, 0) < 5 * 1024, '(d) volver a las pestañas NO baja otra vez el billete entero de la nube (150 KB con su QR): solo el sello (la primera vez sí baja el billete, una vez)')
  debe(resultadoPestanas.filter((r) => r.vuelta === 2).every((r) => r.bajado < 60 * 1024), '(d) cada pestaña, a la segunda vuelta, baja menos de 60 KB de Supabase')

  /* ── (c) en segundo plano: cero ── */
  console.log('(c) oculta...')
  fase = 'oculta'
  await app.evaluar(`(() => { Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true }); Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange', { bubbles: true })); return true })()`)
  await app.esp(1500) // lo que ya iba en camino
  const desde = peticiones.length
  await esperarVirtual(30 * 60_000)
  const oculta = peticiones.slice(desde)
  pintar('(c) EN SEGUNDO PLANO, 30 MINUTOS', oculta)
  debe(oculta.length === 0, `(c) con la app en segundo plano durante 30 minutos NO se hace ninguna petición (hubo ${oculta.length}: ${oculta.slice(0, 4).map((p) => p.etiqueta).join(', ')})`)
  await app.evaluar(`(() => { delete document.visibilityState; delete document.hidden; document.dispatchEvent(new Event('visibilitychange', { bubbles: true })); return true })()`)
  await app.esp(2500)

  /* ── (a) un día de HOY de 8 horas con el GPS moviéndose ── */
  console.log('(a) el dia...')
  fase = 'dia'
  const paradas = ruta.days[1].stops.map((s) => s.coordinates)
  const ids = ruta.days[1].stops.map((s) => s.id)
  const dayId = ruta.days[1].id
  const PASOS = 48 // un punto de GPS cada 10 minutos de reloj de la página
  const inicioDelDia = ahoraVirtual()
  let visitas = 0
  for (let i = 0; i < PASOS; i++) {
    const tramo = (i / PASOS) * (paradas.length - 1)
    const a = paradas[Math.floor(tramo)]
    const b = paradas[Math.min(paradas.length - 1, Math.floor(tramo) + 1)]
    const f = tramo - Math.floor(tramo)
    if (process.env.V36_DEBUG) console.log('   paso', i, 'peticiones', peticiones.length)
    await app.cdp('Emulation.setGeolocationOverride', { latitude: a.lat + (b.lat - a.lat) * f, longitude: a.lng + (b.lng - a.lng) * f, accuracy: 15 })
    if (process.env.V36_DEBUG) console.log('   geo ok')
    if (i === 6 || i === 18 || i === 30) {
      visitas++
      await app.evaluar(`(async () => { ${R}.getState().checkInStop(${JSON.stringify(dayId)}, ${JSON.stringify(ids[visitas - 1])}); return true })()`)
    }
    while (ahoraVirtual() < inicioDelDia + (i + 1) * 10 * 60_000) await app.esp(100)
  }
  const dia = peticiones.filter((p) => p.fase === 'dia')
  pintar('(a) UN DÍA DE HOY (8 h, GPS cada 10 min, 3 visitas)', dia)
  const sd = total(dia)
  const ad = suma(dia, 'api')
  debe(sd.bajado < 5 * 1024 * 1024, `(a) un día de HOY de 8 h baja MENOS de 5 MB de Supabase (bajó ${KB(sd.bajado)})`)
  debe(sd.n <= 700, `(a) un día de HOY de 8 h: como mucho 700 peticiones directas a Supabase (menos de 1,5 por minuto: lo que pregunta cada 5-10 min a la vista; hubo ${sd.n})`)
  const cerca = dia.filter((p) => p.etiqueta === '/api/logros/cerca').length
  debe(cerca <= 120, `(a) «cerca de aquí» no pregunta a cada paso de GPS: como mucho 120 veces en 8 h (hubo ${cerca}; con 48 puntos de GPS y un reloj de 75 s)`)
  debe(ad.n <= 400, `(a) llamadas a /api en 8 h: como mucho 400 (hubo ${ad.n})`)
  debe(ad.bajado < 5 * 1024 * 1024, `(a) lo que baja de /api (tamaños supuestos) en 8 h < 5 MB (${KB(ad.bajado)})`)
  const viajesEnteros = dia.filter((p) => p.donde === 'supabase' && /rest\/trips/.test(p.etiqueta) && p.bajado > 20 * 1024).length
  debe(viajesEnteros <= 4, `(a) en el día el viaje entero se baja como mucho 4 veces (el respaldo de cada 3 h; se bajó ${viajesEnteros})`)
  const guardados = dia.filter((p) => p.metodo === 'PATCH' && /rest\/trips/.test(p.etiqueta)).length
  debe(guardados >= 1 && guardados <= 6, `(a) el viaje se guarda solo con cambios reales: 3 visitas → de 1 a 6 guardados (hubo ${guardados})`)
  debe(!dia.some((p) => p.donde === 'supabase' && /stop_visits/.test(p.etiqueta) && p.metodo === 'GET'), '(a) el GPS no pregunta por las visitas a Supabase')

  const pantalla = await app.evaluar("document.body.innerText.length > 50")
  debe(pantalla, 'la app sigue pintando al final del día')
  console.log('\nEl contador de la página (consola de desarrollo):', await app.evaluar('JSON.stringify(window.__supabaseContador ? window.__supabaseContador.leer().total : null)'))
} finally {
  quitar()
  app.cerrar()
  soltarCandado()
}
console.log(`\nPrueba de la Tanda V36 (cliente): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
