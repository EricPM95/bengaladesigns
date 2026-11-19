// Tanda V1b (15-nov): DOS ARREGLOS QUE SALEN DE LA V1.
//   1. Los avisos del viaje, abiertos mientras el cobro esté apagado (con el cobro encendido, como siempre).
//   2. Al abrir la app, solo la LISTA de viajes (ligera) y el viaje activo entero; los demás, enteros al abrirlos. La migración 0078 corre de verdad sobre PGlite con la seguridad por filas, y el código de la app
//      (tripPersistence, abrirViaje, hydrateTrip, vistos) se empaqueta con esbuild y se prueba en Node contra esa base. Un navegador (un Chrome, que se cierra) prueba la lista guardada en el móvil sin servidor.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV1b.mjs      (SIN_NAVEGADOR=1 salta el navegador)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { crearServicioAvisosViaje } from '../../server/avisosViaje.js'
import { crearBaseDeAvisos } from './_baseDeAvisosDeMentira.mjs'
import { crearBaseDePrueba } from './_baseDeDatosPrueba.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const clonar = (x) => JSON.parse(JSON.stringify(x))
const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const { route: ERIC, reservations: RESERVAS_ERIC } = JSON.parse(leer('docs/dias/_hoy3_ruta_eric.json'))
const DATOS = { tiempo: JSON.parse(leer('data/hoy/avisos_tiempo.json')), atardecer: JSON.parse(leer('src/data/sitiosDeAtardecer.json')) }
const CANARIAS = 'Atlantic/Canary'

/* ───────────────────────── 1. Los avisos, con el cobro apagado ───────────────────────── */
console.log('1. Los avisos con el cobro apagado y encendido')
async function avisosCon(env, { pases = [], esAdmin = false } = {}) {
  const viaje = { trip_id: 't1', user_id: 'u1', route: clonar(ERIC), bookings: { reservations: RESERVAS_ERIC } }
  const base = crearBaseDeAvisos({ viajes: [viaje], pases })
  const enviados = []
  const servicio = crearServicioAvisosViaje({
    admin: base.admin,
    destinos: { lanzarote: { destino: 'Lanzarote', timezone: CANARIAS } },
    env: { PUSH_ACTIVO: 'true', VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_CONTACTO: 'mailto:p@example.test', CRON_SECRET: 'x', ...env },
    cargarWebPush: async () => ({ default: { setVapidDetails() {}, sendNotification: async (s, p) => void enviados.push(JSON.parse(p)) } }),
    tiempo: async () => ({ value: null }),
    datos: DATOS,
    esAdminDeCuenta: async () => esAdmin,
    marca: () => ({ nombre: 'JUTRIP' }),
    log: { warn() {} },
  })
  for (let t = Date.parse('2026-11-10T08:50:00Z'); t < Date.parse('2026-11-10T09:30:00Z'); t += 5 * 60000) {
    const instante = new Date(t)
    base.estado.reloj = instante
    if (base.hayQueMirar(instante)) await servicio.tick(instante)
  }
  return enviados
}
{
  const apagado = await avisosCon({ PASES_COBRO_ACTIVO: 'false' })
  debe(apagado.length === 1 && /norte de Manrique/.test(apagado[0].cuerpo), 'avisos', `con el cobro apagado, SIN pase y sin ser administrador, llega el aviso de la mañana (${apagado.length})`)
  const sinVariable = await avisosCon({})
  debe(sinVariable.length === 1, 'avisos', 'sin la variable PASES_COBRO_ACTIVO (apagado por defecto) también llega')
  const encendido = await avisosCon({ PASES_COBRO_ACTIVO: 'true' })
  debe(encendido.length === 0, 'avisos', 'con el cobro encendido (simulado), sin pase y sin ser administrador, NO llega')
  const conPase = await avisosCon({ PASES_COBRO_ACTIVO: 'true' }, { pases: [{ estado: 'activo', destino: 'Lanzarote' }] })
  debe(conPase.length === 1, 'avisos', 'con el cobro encendido y con pase del destino, llega')
  const admin = await avisosCon({ PASES_COBRO_ACTIVO: 'true' }, { esAdmin: true })
  debe(admin.length === 1, 'avisos', 'con el cobro encendido y siendo administrador, llega')
  const otroPase = await avisosCon({ PASES_COBRO_ACTIVO: 'true' }, { pases: [{ estado: 'activo', destino: 'Roma' }] })
  debe(otroPase.length === 0, 'avisos', 'con el cobro encendido, el pase de otro destino no vale')
  const fuente = leer('server/avisosViaje.js')
  debe(/if \(!cobroActivo\(env\)\) return \[\]/.test(fuente) && /import \{ cobroActivo(, cobroSoloAdmins)? \} from '\.\/logros\/pase\.js'/.test(fuente), 'avisos', 'la regla es la de siempre del servidor: cobroActivo(env), la misma que usan el pase y los logros')
}

/* ───────────────────────── 2. La lista ligera, con el código de verdad ───────────────────────── */
console.log('2. La migración 0078 y el código de la app contra un Postgres de prueba (PGlite)')
const bd = await crearBaseDePrueba({ migraciones: /^(0001|0002|0003|0012|0018|0020|0021|0023|0024|0025|0026|0027|0028|0030|0031|0034|0078)_/, alFallar: (m) => debe(false, '0078', m) })
const { q, como, nuevoUsuario } = bd
debe((await q("select to_regprocedure('public.viajes_lista(boolean)') is not null as ok"))[0].ok, '0078', 'la función viajes_lista existe tras aplicar las migraciones')

/** Una ruta «de verdad»: la de Eric, con cada parada cargada de texto, horarios y objetos anidados (como las de Roma, de ~100 KB). */
function rutaPesada(destino, inicio) {
  const r = clonar(ERIC)
  r.id = `ruta-${destino}-${inicio}`
  r.destination = destino
  r.answers.dateRange = { start: inicio, end: new Date(Date.parse(`${inicio}T00:00:00Z`) + 5 * 86400000).toISOString().slice(0, 10) }
  const largo = (n) => 'Texto de la ficha de la parada. '.repeat(n)
  for (const d of r.days) {
    d.notaLarga = largo(40)
    d.anidado = { horarios: Array.from({ length: 8 }, (_, i) => ({ dia: i, abre: '09:00', cierra: '18:00', nota: largo(5) })) }
    for (const s of d.stops) {
      s.description = largo(60)
      s.why = largo(30)
      s.insiderTip = largo(20)
      s.hours_data = { by_day: Array.from({ length: 7 }, (_, i) => ({ dia: i, tramos: [['09:00', '13:00'], ['15:00', '19:00']] })), nota: largo(10) }
    }
  }
  return r
}
const u1 = await nuevoUsuario('eric@example.test')
const u2 = await nuevoUsuario('alicia@example.test')
const viajesU1 = [
  { id: 'a0000000-0000-4000-8000-000000000001', route: clonar(ERIC), upd: '2026-11-08T10:00:00Z' },
  ...Array.from({ length: 6 }, (_, i) => ({ id: `a0000000-0000-4000-8000-00000000001${i}`, route: rutaPesada('Roma', `2026-0${i + 1}-1${i + 1}`), upd: `2026-10-0${i + 1}T10:00:00Z` })),
]
for (const v of viajesU1) await q('insert into public.trips (id, traveler_id, route, bookings, wishlist, ui_state, updated_at) values ($1, $2, $3, $4, $5, $6, $7)', [v.id, u1, JSON.stringify(v.route), JSON.stringify({ reservations: [] }), '[]', JSON.stringify({ mode: 'route', activeDayId: null }), v.upd])
const vAjeno = 'b0000000-0000-4000-8000-000000000001'
await q('insert into public.trips (id, traveler_id, route, bookings, wishlist, ui_state) values ($1, $2, $3, $4, $5, $6)', [vAjeno, u2, JSON.stringify(rutaPesada('Roma', '2026-12-01')), '{}', '[]', '{}'])
const vGen = 'a0000000-0000-4000-8000-0000000000ff'
await q("insert into public.trips (id, traveler_id, route, bookings, wishlist, ui_state, generation_state) values ($1, $2, $3, '{}', '[]', '{}', $4)", [vGen, u1, JSON.stringify({ id: 'a-medias', destination: 'Roma', days: [], answers: {} }), JSON.stringify({ phase: 'skeleton', params: { destination: 'Roma' } })])

// El cliente de Supabase de mentira, sobre esa base (con la seguridad por filas) y que cuenta lo que «baja».
const lectura = { bytes: 0, llamadas: [] }
let usuarioActual = u1
const fila = (r) => JSON.parse(JSON.stringify(r))
function cliente() {
  const contar = (nombre, datos) => {
    lectura.bytes += JSON.stringify(datos).length
    lectura.llamadas.push(nombre)
    return datos
  }
  return {
    rpc: async (nombre, args) => {
      try {
        if (nombre === 'viajes_lista') return { data: contar('viajes_lista', fila(await como(usuarioActual, () => q('select * from public.viajes_lista($1)', [args.p_solo_mios])))), error: null }
        if (nombre === 'viajes_lista_que_no_existe') return { data: null, error: { message: 'no existe' } }
        return { data: null, error: { message: `rpc sin simular: ${nombre}` } }
      } catch (e) {
        return { data: null, error: { message: String(e.message) } }
      }
    },
    from: (tabla) => ({
      select: (cols) => {
        const filtros = []
        const consulta = async (uno) => {
          try {
            const donde = filtros.map((f, i) => `${f.col} = $${i + 1}`).join(' and ')
            const filas = fila(await como(usuarioActual, () => q(`select ${cols} from public.${tabla}${donde ? ` where ${donde}` : ''}`, filtros.map((f) => f.val))))
            return { data: contar(`${tabla}:${cols.split(',')[0]}`, uno ? (filas[0] ?? null) : filas), error: null }
          } catch (e) {
            return { data: null, error: { message: String(e.message) } }
          }
        }
        const b = { eq: (col, val) => (filtros.push({ col, val }), b), order: () => b, maybeSingle: () => consulta(true), then: (ok, no) => consulta(false).then(ok, no) }
        return b
      },
      upsert: async () => ({ error: null }),
    }),
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  }
}

// El navegador de mentira y el código de la app, empaquetado.
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-v1b-'))
const almacen = () => {
  const mapa = new Map()
  return { getItem: (k) => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, String(v)), removeItem: (k) => mapa.delete(k), key: (i) => [...mapa.keys()][i] ?? null, get length() { return mapa.size } }
}
globalThis.window = { location: { search: '', hash: '', pathname: '/', origin: 'http://localhost', href: 'http://localhost/' }, sessionStorage: almacen(), localStorage: almacen(), addEventListener() {}, removeEventListener() {}, setTimeout: (...a) => setTimeout(...a), clearTimeout: (...a) => clearTimeout(...a), dispatchEvent() {} }
globalThis.document = { body: {}, createElement: () => ({}), documentElement: { style: {}, classList: { toggle() {}, add() {}, remove() {} } }, addEventListener() {}, removeEventListener() {}, visibilityState: 'visible' }
globalThis.localStorage = globalThis.window.localStorage
globalThis.sessionStorage = globalThis.window.sessionStorage
globalThis.__sb = cliente()
const salida = path.join(carpeta, 'app.cjs')
await build({
  entryPoints: ['scripts/destino/_v1b_entrada.ts'],
  outfile: salida,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  logLevel: 'error',
  loader: { '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.webp': 'dataurl', '.css': 'empty', '.woff2': 'dataurl' },
  define: { 'import.meta.env': JSON.stringify({ DEV: false, MODE: 'test', VITE_SUPABASE_URL: 'https://falso.supabase.test', VITE_SUPABASE_ANON_KEY: 'clave-falsa', VITE_CUENTAS_ACTIVAS: 'true' }) },
  plugins: [
    {
      name: 'supabase-de-mentira',
      setup(b) {
        b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'supabase-falso', namespace: 'falso' }))
        b.onLoad({ filter: /.*/, namespace: 'falso' }, () => ({ contents: 'module.exports = { get supabase() { return globalThis.__sb } }', loader: 'js' }))
      },
    },
  ],
})
const app = createRequire(import.meta.url)(salida)
const { loadAllTrips, viajeEntero, saveTrip, copiarVistosDeLosViajes, abrirViajeGuardado, resumenDeViaje, getTodayTripStatus, dondeAbrir, useSyncStore, useRouteStore } = app

const completos = await Promise.all(viajesU1.map(async (v) => (await q('select route from public.trips where id = $1', [v.id]))[0].route))
const pesoCompleto = completos.reduce((s, r) => s + JSON.stringify(r).length, 0)
const pesoUno = JSON.stringify(completos[1]).length
console.log(`   (6 viajes de Roma de ~${kb(pesoUno)} cada uno + el de Lanzarote: los enteros suman ${kb(pesoCompleto)})`)

useSyncStore.getState().setTravelerId(u1)
lectura.bytes = 0
lectura.llamadas = []
const lista = await loadAllTrips(u1)
const bytesLista = lectura.bytes
debe(lista.length === viajesU1.length + 1, '0078', `la lista trae TODOS los viajes de la cuenta (${lista.length}: los 7 y el de la generación a medias); el ajeno no sale`)
debe(!lista.some((v) => v.id === vAjeno), '0078', 'la seguridad por filas sigue: el viaje de otra persona no sale')
const ligeros = lista.filter((v) => v.ligero)
debe(ligeros.length === viajesU1.length && ligeros.every((v) => v.route.ligero === true), '0078', 'las rutas de la lista son ligeras (marcadas «ligero») y llevan la misma cuenta de días')
const aMedias = lista.find((v) => v.id === vGen)
debe(aMedias && !aMedias.ligero && aMedias.generationState, '0078', 'un viaje con la generación a medias se devuelve tal cual, para poder retomarlo')
debe(bytesLista < pesoCompleto * 0.2, 'egress', `al abrir se baja la lista: ${kb(bytesLista)} frente a ${kb(pesoCompleto)} de bajarlo todo entero (${Math.round((bytesLista / pesoCompleto) * 100)} %)`)
debe(lectura.llamadas.length === 1 && lectura.llamadas[0] === 'viajes_lista', 'egress', 'al abrir la app es UNA sola petición: la lista')

// Lo que enseñan «Mis viajes» y el Perfil sale igual con la ruta ligera que con la entera.
const CAMPOS = ['destino', 'destinos', 'inicioIso', 'dias', 'paradas', 'cuando', 'duracion', 'rotulo', 'resumen', 'fase', 'paises', 'pais', 'ciudades', 'id']
for (const [i, v] of viajesU1.entries()) {
  const ligero = lista.find((x) => x.id === v.id)
  const a = resumenDeViaje(completos[i], null, '2026-11-15')
  const b = resumenDeViaje(ligero.route, null, '2026-11-15')
  debe(CAMPOS.every((c) => JSON.stringify(a[c]) === JSON.stringify(b[c])), 'igual', `«${v.route.destination}» ${v.route.answers.dateRange.start}: el resumen de Mis viajes / Perfil es idéntico con la ruta ligera (${CAMPOS.filter((c) => JSON.stringify(a[c]) !== JSON.stringify(b[c])).join(', ') || 'sin diferencias'})`)
  for (const hoy of ['2026-01-01', v.route.answers.dateRange.start, '2026-11-10', '2027-01-01']) {
    debe(JSON.stringify(getTodayTripStatus(completos[i], hoy)?.phase) === JSON.stringify(getTodayTripStatus(ligero.route, hoy)?.phase), 'igual', `la fase del viaje (antes / durante / después) es la misma el ${hoy}`)
  }
}
const decide = (trips) => dondeAbrir(trips, (t) => !t.generationState && Boolean(app.getTodayTripContext(t.route, '2026-11-10')), (t) => { const f = getTodayTripStatus(t.route, '2026-11-10'); return f ? { inicio: f.startIso, fin: f.endIso } : null }, '2026-11-10')
const entero = viajesU1.map((v, i) => ({ id: v.id, route: completos[i], bookings: {}, wishlist: [], uiState: {}, generationState: null }))
debe(JSON.stringify(decide(lista.filter((v) => v.id !== vGen)).viaje?.id) === JSON.stringify(decide(entero).viaje?.id), 'igual', 'qué viaje se abre al arrancar (el de hoy o el próximo) se decide igual con la lista ligera')

// Abrir un viaje: se pide entero, y se ve igual que antes.
lectura.bytes = 0
lectura.llamadas = []
const elegido = lista.find((v) => v.id === viajesU1[2].id)
const abierto = await viajeEntero(elegido)
debe(!abierto.ligero && JSON.stringify(abierto.route.days).length === JSON.stringify(completos[2].days).length && abierto.route.days[0].stops[0].description === completos[2].days[0].stops[0].description, 'abrir', 'al abrir un viaje se baja entero, con todo su detalle (textos, horarios)')
debe(lectura.llamadas.length === 1 && lectura.bytes < pesoUno * 1.3, 'abrir', `abrir UN viaje baja solo ese: ${kb(lectura.bytes)} (un viaje entero pesa ${kb(pesoUno)})`)
useSyncStore.getState().setSavedTrips(lista)
const otra = await viajeEntero(ligeros[0])
debe(useSyncStore.getState().savedTrips.find((v) => v.id === ligeros[0].id)?.ligero !== true && !otra.ligero, 'abrir', 'el viaje abierto sustituye al ligero en la lista (el resto sigue ligero)')
debe(useSyncStore.getState().savedTrips.filter((v) => v.ligero).length === ligeros.length - 1, 'abrir', 'los demás viajes siguen ligeros hasta que se abren')
useSyncStore.getState().setSavedTrips(lista)
debe(JSON.stringify((await viajeEntero(abierto)).id) === JSON.stringify(abierto.id), 'abrir', 'un viaje que ya es entero se devuelve tal cual (sin otra petición)')

// hydrateTrip y abrirViajeGuardado nunca dejan pasar una ruta ligera.
{
  const ligero = lista.find((v) => v.id === viajesU1[3].id)
  useRouteStore.setState({ route: null })
  useRouteStore.getState().hydrateTrip(ligero)
  await new Promise((r) => setTimeout(r, 80))
  const r = useRouteStore.getState().route
  debe(r && !r.ligero && r.days[0].stops[0].description === completos[3].days[0].stops[0].description, 'ligera', 'hydrateTrip con un viaje ligero abre el ENTERO (nunca la ruta ligera)')
  useRouteStore.setState({ route: null })
  useSyncStore.getState().setSavedTrips(lista)
  debe(abrirViajeGuardado(viajesU1[4].id) === true, 'ligera', 'abrirViajeGuardado devuelve true (el viaje existe)')
  await new Promise((r2) => setTimeout(r2, 80))
  debe(useRouteStore.getState().route && !useRouteStore.getState().route.ligero && useRouteStore.getState().mode === 'route', 'ligera', 'abrirViajeGuardado abre el viaje entero y en RUTA')
  const msg = await saveTrip(u1, viajesU1[3].id, { route: ligero.route, bookings: {}, wishlist: [], uiState: {}, generationState: null }).then(() => null, (e) => String(e.message))
  debe(/ligera/.test(msg ?? ''), 'ligera', 'guardar una ruta ligera se rechaza (nunca pisa el viaje de verdad)')
  debe((await q('select route from public.trips where id = $1', [viajesU1[3].id]))[0].route.days[0].stops[0].description === completos[3].days[0].stops[0].description, 'ligera', 'y el viaje de la base de datos sigue entero')
}

// Si la función 0078 no está pegada, la app sigue como siempre.
{
  const base0 = globalThis.__sb
  globalThis.__sb = { ...base0, rpc: async () => ({ data: null, error: { message: 'Could not find the function public.viajes_lista' } }) }
  const antiguo = await loadAllTrips(u1)
  debe(antiguo.length >= viajesU1.length && antiguo.every((v) => !v.ligero) && antiguo.find((v) => v.id === viajesU1[0].id)?.route.days.length === ERIC.days.length, 'fallback', 'sin la función 0078 (aún sin pegar) la app baja los viajes enteros, como siempre: nada se rompe al desplegar antes')
  globalThis.__sb = base0
}

// Los vistos de los viajes: una sola vez por cuenta y móvil.
{
  lectura.llamadas = []
  lectura.bytes = 0
  await copiarVistosDeLosViajes(u1)
  const primera = lectura.bytes
  const n1 = lectura.llamadas.length
  await copiarVistosDeLosViajes(u1)
  debe(n1 === 1 && lectura.llamadas.length === 1, 'vistos', `copiar los vistos baja las rutas UNA vez (${kb(primera)}) y no en cada entrada ni cada hora (antes: en cada getSession y en cada renovación de la sesión)`)
  globalThis.window.localStorage.removeItem(`trazo:vistos:copiados:${u1}`)
  await copiarVistosDeLosViajes(u1)
  debe(lectura.llamadas.length === 2, 'vistos', 'sin la marca (otro móvil) se hace una vez')
}

// La cuenta, antes y después, con estos viajes.
const cuentaAntes = pesoCompleto * 2 + 0 // la consulta de siempre + la copia de los vistos (en cada entrada)
const cuentaDespues = bytesLista + pesoUno
console.log(`   (al abrir la app con estos 7 viajes: antes ${kb(cuentaAntes)} (lista entera + la copia de vistos); ahora ${kb(cuentaDespues)} (la lista + el viaje activo); el 10% de lo de antes ≈ ${kb(cuentaAntes * 0.1)})`)
debe(cuentaDespues < cuentaAntes * 0.25, 'egress', `abrir la app cuesta ${kb(cuentaDespues)} en vez de ${kb(cuentaAntes)} (${Math.round((cuentaDespues / cuentaAntes) * 100)} %)`)

/* ───────────────────────── 3. El código (los sitios que abren viajes) ───────────────────────── */
console.log('3. Los sitios que abren viajes de la lista')
{
  const sync = leer('src/components/sync/TripSync.tsx')
  debe((sync.match(/hydrateTrip\(await viajeEntero\(/g) ?? []).length === 4, 'abrir', 'TripSync pide entero el viaje que abre al arrancar (el del enlace, el de hoy, el próximo y, desde la V17, el último cuando todos pasaron: el Perfil)')
  debe(/ponerListaDelMovil\(\)/.test(sync) && /guardarListaDeViajes\(trips\)/.test(sync), 'sin red', 'la lista se guarda en el móvil y, sin red o con el servidor caído, se enseña la guardada')
  debe(/borrarListaDeViajes/.test(leer('src/lib/cuentas.ts')), 'sin red', 'al cerrar sesión se borra la lista del móvil')
  debe(/payload\.route\?\.ligero/.test(leer('src/store/useRouteStore.ts')) && /payload\.route\?\.ligero/.test(leer('src/lib/tripPersistence.ts')), 'ligera', 'hydrateTrip y saveTrip vigilan la ruta ligera')
  debe(fs.existsSync('supabase/migrations/0078_viajes_lista_ligera.sql') && fs.existsSync('docs/dias/COMPROBAR_0078.sql'), '0078', 'la 0078 y su COMPROBAR existen')
  const mig = leer('supabase/migrations/0078_viajes_lista_ligera.sql')
  debe(/security invoker/.test(mig) && !/create table/i.test(mig), '0078', 'la función es «security invoker» (la seguridad por filas manda) y no crea tablas (nada que añadir a «Empezar de cero»)')
}

/* ───────────────────────── 4. El navegador: la lista guardada en el móvil ───────────────────────── */
if (process.env.SIN_NAVEGADOR === '1') console.log('4. El navegador: saltado (SIN_NAVEGADOR=1)')
else {
  console.log('4. El navegador: sin servidor, la lista de Mis viajes sigue completa (guardada en el móvil)')
  const { abrirApp } = await import('./_enLaApp.mjs')
  const APP = process.env.APP_URL || 'http://localhost:5173'
  const hoyIso = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const mas = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
  const rutaHoy = clonar(ERIC)
  rutaHoy.answers.dateRange = { start: mas(hoyIso, -1), end: mas(hoyIso, 4) }
  const guardadoHoy = { id: 'v1b-hoy', payload: { route: rutaHoy, bookings: { reservations: [] }, wishlist: [], uiState: { mode: 'today', activeDayId: null }, generationState: null }, guardadoEn: new Date().toISOString(), desde: mas(hoyIso, -1), hasta: mas(hoyIso, 4) }
  const listaGuardada = lista.map((v) => ({ id: v.id, route: v.route, bookings: v.bookings ?? {}, wishlist: [], uiState: {}, generationState: v.generationState ?? null, ...(v.ligero ? { ligero: true } : {}) }))
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', exp: 1700000000, email: 'prueba@example.test', app_metadata: { provider: 'email' }, user_metadata: {} })}.${b64('firma-de-mentira')}`
  const respaldo = { uid: '00000000-0000-4000-8000-000000000001', access_token: jwt, refresh_token: 'refresco-de-mentira' }
  const caido = `(() => {
    const f0 = window.fetch.bind(window)
    window.fetch = (u, o) => String(u).includes('supabase.co') ? Promise.resolve(new Response('upstream request timeout', { status: 504, statusText: 'Gateway Timeout' })) : f0(u, o)
  })()`
  const sembrar = `(async () => {
    window.localStorage.setItem('trazo:cuenta:respaldo', ${JSON.stringify(JSON.stringify(respaldo))})
    const abrir = (nombre, tabla, clave, fila) => new Promise((ok) => { const p = indexedDB.open(nombre, 1); p.onupgradeneeded = () => p.result.createObjectStore(tabla, { keyPath: clave }); p.onsuccess = () => { const tx = p.result.transaction(tabla, 'readwrite'); tx.objectStore(tabla).put(fila); tx.oncomplete = () => { p.result.close(); ok(true) } }; p.onerror = () => ok(false) })
    const a = await abrir('trazo-hoy-offline', 'viajes', 'id', ${JSON.stringify(guardadoHoy)})
    const b = await abrir('trazo-lista-viajes', 'lista', 'clave', { clave: 'lista', guardadoEn: new Date().toISOString(), viajes: ${JSON.stringify(listaGuardada)} })
    return a && b
  })()`
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&apertura=0', ancho: 390, alto: 844, sinEsperarRuta: true, antes: caido })
  try {
    await a.esp(2500)
    debe((await a.evaluar(sembrar)) === true, 'navegador', 'se deja en el móvil de prueba la lista de viajes y el viaje de hoy guardados')
    await a.cdp('Page.navigate', { url: `${APP}/?cuentas=on&apertura=0&hoy2=on&version=completa` })
    await a.esp(22000)
    const estado = JSON.parse(await a.evaluar("(async () => { const s = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState(); return JSON.stringify({ n: s.savedTrips?.length ?? null, ids: (s.savedTrips ?? []).map((v) => v.id), ligeros: (s.savedTrips ?? []).filter((v) => v.ligero).length, sinServidor: s.sinServidor }) })()"))
    debe(estado.n === listaGuardada.length, 'navegador', `con el servidor caído, «Mis viajes» tiene los ${listaGuardada.length} viajes de la lista guardada (${estado.n})`)
    debe(listaGuardada.every((v) => estado.ids.includes(v.id)), 'navegador', 'ningún viaje desaparece de la lista porque no se haya bajado entero')
    const hoy = await a.evaluar("document.body.innerText.slice(0, 500)")
    debe(/Manrique|Teguise|Timanfaya|Papagayo|HOY|Hoy/i.test(hoy) && /No llegamos al servidor/.test(hoy), 'navegador', 'y HOY de hoy se ve, guardado en el móvil, con la línea «No llegamos al servidor…»')
    const respaldoSigue = await a.evaluar("window.localStorage.getItem('trazo:cuenta:respaldo') !== null")
    debe(respaldoSigue === true, 'navegador', 'la sesión no se cierra')
  } finally {
    await a.cerrar()
  }
}

console.log(`\nLa prueba de la tanda V1b: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const x of fallos) console.log(`  FALLO [${x.regla}] ${x.texto}`)
process.exit(fallos.length ? 1 : 0)
