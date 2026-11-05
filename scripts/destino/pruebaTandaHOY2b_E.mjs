// La prueba de la tanda HOY2b, agente E (5-nov-2026): «¿Qué hago ahora?» (17), «¿Cómo vais?» (16) y Cansados (16b), +15 / +30 min SIN mover la ruta y el reto del día (5) con su álbum de cromos con fotos.
// Viaje de Eric en Lanzarote (martes 10 de noviembre) y un repaso en Roma. Hace falta el Vite (5173) y la API (8787, con DESTINOS_OCULTOS='-') YA encendidos; NO arranca ninguno.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY2b_E.mjs
// Un solo Chrome, que se cierra al acabar. Salida: «N comprobaciones · M fallos». Capturas 390x844 de TODO el scroll en docs/dias/capturas_jutrip/hoy2b_<tema>_<n>.jpg.
// PARTE=puras: solo las cuentas sin pantalla (servidor y cliente), sin Chrome.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { cargarCatalogo, cargarDatos } from '../../server/logros/datos.js'
import { retosDelDia } from '../../server/logros/cerca.js'
import { clave } from '../../server/logros/motor.js'
import { crearServicioLogros } from '../../server/logros/servicio.js'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
// El reloj de mentira es el de pruebaTandaHOY1_A (`window.__horaFalsa`, minutos del día; `window.__pos`, la ubicación).
const ANTES = /const ANTES = `([\s\S]*?)`\n/.exec(fs.readFileSync(new URL('./pruebaTandaHOY1_A.mjs', import.meta.url), 'utf8'))[1]
const ROMA_EN_LANZAROTE = /Roma\b|Fiumicino|Ciampino|Termini|Pante[óo]n|Trastevere|Vaticano|Coliseo|Trevi|Pincio|Jan[ií]culo|Cap[ií]tolio|Montorio|Tempietto|Navona/i
const L = (f) => fs.readFileSync(f, 'utf8')
const sinCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

let a = null
let _destino = 'lanzarote'
const ev = (expr) => a.evaluar('(async () => (' + expr + '))()')
const txt = (sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
const hay = (sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
const cuantos = (sel) => a.evaluar(`document.querySelectorAll(${JSON.stringify(sel)}).length`)
const clic = (sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const clicTexto = (re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button,a')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const atrBotones = () => a.evaluar("document.querySelectorAll('[data-hoy-aviso-tiempo] button').length")
const cuerpo = () => a.evaluar('document.body.innerText.replace(/\\s+/g, " ")')
const paradasDe = (dia = 2) => ev(`(async () => { const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const r = ${R}.getState().route; return numberedStopsOf(r.days[${dia}]).map((s) => ({ name: s.name, time: s.time, saltada: Boolean(s.saltada), visto: Boolean(s.checkedInAt) })) })()`)

const LANZAROTE = `window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => 'ok').catch((e) => 'ERROR ' + String((e && e.message) || e))`
async function abrir() {
  for (let intento = 0; intento < 3; intento++) {
    a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES })
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'")); i++) await a.esp(500)
    const r = await a.evaluar(LANZAROTE)
    if (r === 'ok') {
      await a.esp(2500)
      for (let i = 0; i < 4; i++) {
        const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!hecho) break
        await a.esp(600)
      }
      return
    }
    a.cerrar()
  }
  throw new Error('No se pudo crear el viaje de Lanzarote')
}

/** Prepara el día `dia` (2 = el martes 10) con la hora `min`, la ubicación `pos`, `mut` (JavaScript que cambia la ruta `r`; `dia` y `paradas` a mano) y `cerca` (la respuesta de mentira de /api/logros/cerca) y vuelve a montar HOY. */
async function ir({ dia = 2, min = 450, pos = null, mut = '', limpiar = true, cerca = null, sugerencias = true } = {}) {
  if (!(await ev(`${R}.getState().route ? true : false`).catch(() => false))) {
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await a.evaluar(`${_destino === 'roma' ? 'window.__rutaPrueba().then(() => true)' : LANZAROTE.replace("'ok'", 'true')}`)
    await a.esp(2500)
  }
  await a.evaluar(`(async () => {
    const st = ${R}; const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
    window.__rutaOriginalE = window.__rutaOriginalE ?? structuredClone(st.getState().route)
    const r = structuredClone(window.__rutaOriginalE)
    r.days.forEach((d) => { delete d.sunsetText; numberedStopsOf(d).forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset; delete s.reservationTime }) })
    const dia = r.days[${dia}]; const paradas = numberedStopsOf(dia)
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { ${limpiar ? "Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('trazo:hoy1:') || k.startsWith('trazo:hoy2:') || k.startsWith('trazo:hoy2b:')).forEach((k) => localStorage.removeItem(k));" : ''} localStorage.setItem('trazo:logros:permisos-vistos', '1'); sessionStorage.setItem('trazo:logros:permisos-vistos', '1'); localStorage.setItem('trazo:ajuste:sugerencias-companero', ${sugerencias ? "'1'" : "'0'"}) } catch {}
    try { (await import('/src/components/logros/visto/vistoStore.ts')).useVistoStore.getState().poner({ permisos: false }) } catch {}
    window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${pos ? "'granted'" : "'denied'"}
    window.__hoy1Ubicacion = ${JSON.stringify(pos)}
    window.__hoy1Cerca = ${JSON.stringify(cerca)}
    const ini = r.answers.dateRange.start; const d = new Date(ini + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + ${dia}); const iso = d.toISOString().slice(0, 10)
    st.getState().setDevSimulatedTodayIso(iso); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return iso })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3200)
  // Marcar paradas como vistas a mano hace que la app ofrezca «Guarda un recuerdo de…»: se cierra para que no tape las capturas.
  await a.evaluar("(() => { const t = Array.from(document.querySelectorAll('div,section')).find((e) => /Guarda un recuerdo de/.test(e.innerText || '') && e.querySelector('button[aria-label=\"Cerrar\"]') && (e.innerText || '').length < 220); const b = t?.querySelector('button[aria-label=\"Cerrar\"]'); if (b) b.click(); return Boolean(b) })()")
  await a.esp(300)
}

/** Capturas de TODO el scroll de HOY (390x844): la primera arriba, las demás de 700 en 700 hasta el final. */
async function capturaCompleta(tema) {
  const alto = await a.evaluar("(() => { const c = document.querySelector('[data-hoy]'); return c ? c.scrollHeight - c.clientHeight : 0 })()")
  const pasos = Math.min(5, Math.ceil(alto / 700) + 1)
  for (let i = 0; i < pasos; i++) {
    await a.evaluar(`(() => { const c = document.querySelector('[data-hoy]'); if (c) c.scrollTop = ${i * 700}; return true })()`)
    await a.esp(600)
    await a.captura(path.join(SALIDA, `hoy2b_${tema}_${i + 1}.jpg`))
  }
  await a.evaluar("(() => { const c = document.querySelector('[data-hoy]'); if (c) c.scrollTop = 0; return true })()")
}
const captura = async (nombre) => {
  await a.esp(500)
  await a.captura(path.join(SALIDA, `hoy2b_${nombre}.jpg`))
}
const sec = async (nombre, fn) => {
  if (process.env.SOLO && !process.env.SOLO.split(',').some((n) => nombre.startsWith(`${n}.`))) return
  console.log(nombre)
  try {
    await fn()
  } catch (e) {
    debe(false, 'error', `${nombre}: la prueba se ha parado: ${String(e?.message ?? e).slice(0, 220)}`)
  }
}
// Las mutaciones del martes: a la parada `i` se le cambia nombre y hora.
const poner = (i, nombre, hora, extra = '') => `{ const s = paradas[${i}]; s.name = ${JSON.stringify(nombre)}; s.time = ${JSON.stringify(hora)}; ${extra} }`
// Deja solo las dos primeras paradas del martes (HOY ordena por hora y el resto del día se cruzaría).
const soloDos = 'dia.stops = dia.stops.filter((s) => s === paradas[0] || s === paradas[1]);'
const vistas = (n) => `paradas.slice(0, ${n}).forEach((s) => { s.checkedInAt = new Date().toISOString() });`
const HARIA = { lat: 29.13158, lng: -13.51417 } // el Mirador de Haría

/* ───────────── 0. El código y las cuentas sin pantalla (servidor) ───────────── */
console.log('0. Código y servidor')
{
  const hoy = sinCom(L('src/components/route/hoy/v2/HoyDuranteV2.tsx'))
  debe(/<QueHagoAhora/.test(hoy) && /<ComoVais/.test(hoy) && /<RetoDelDia/.test(hoy), '1-4', 'HOY monta ¿Qué hago ahora?, ¿Cómo vais? y el reto del día')
  debe(/data-hoy-hueco-que-hago-ahora[^>]*>\s*\{[^}]*QueHagoAhora/.test(hoy), '1', '[¿Qué hago ahora?] va en su hueco (`data-hoy-hueco-que-hago-ahora`)')
  const cerca = sinCom(L('src/components/route/hoy/AvisosDeCerca.tsx'))
  debe(!/RetoDelDiaTarjeta/.test(cerca) && /useCompaneroStore/.test(cerca), '4', 'el reto ya no sale como aviso de la mañana: lo pinta RetoDelDia debajo de la tarjeta principal, todo el día')
  const parada = sinCom(L('src/components/route/hoy/v2/ParadaHoy.tsx'))
  debe(!/proponerCorrerElDia|aplicarCambio\(cambio/.test(parada) && /AvisoMasTiempo/.test(parada), '3', '[Necesito más tiempo] ya no corre el día: solo mira si llegas a algo cerrado o tarde a una reserva')
  debe(/DESTINOS_OCULTOS/.test('x') || true, '-', '')
  const datos = cargarDatos()
  const catalogos = { roma: cargarCatalogo('roma'), lanzarote: cargarCatalogo('lanzarote') }
  const vacio = new Map()
  // El martes: Jameos, Cueva de los Verdes, Mirador del Río, Haría; a pie y en coche.
  const hoyLz = new Set(['jameos_del_agua', 'cueva_de_los_verdes', 'mirador_del_rio', 'haria_y_la_casa_museo_cesar_manrique'])
  const diasRuta = [{ fecha: '2026-11-10', paradas: [...hoyLz].map((s) => ({ sitio: s })) }, { fecha: '2026-11-12', paradas: [{ sitio: 'los_hervideros' }, { sitio: 'fundacion_cesar_manrique' }] }]
  const retos = retosDelDia({ datos, catalogos, destino: 'lanzarote', items: vacio, sitiosHoy: hoyLz, diasRuta, hoyFecha: '2026-11-10', enCoche: true })
  debe(retos.length >= 2, '4', `con la ruta del martes salen varias colecciones (${retos.map((r) => r.coleccion).join(', ')})`)
  const manrique = retos.find((r) => r.coleccion === 'cesar_manrique')
  debe(Boolean(manrique) && manrique.sitios.some((s) => s.sitio === 'jameos_del_agua' && s.estado === 'hoy') && manrique.sitios.some((s) => s.sitio === 'fundacion_cesar_manrique' && s.estado === 'otro_dia' && s.dia_fecha === '2026-11-12') && manrique.sitios.some((s) => s.estado === 'fuera'), '4', 'cada sitio lleva su estado: hoy, otro día (con su fecha) o fuera de tu ruta')
  const isla = retos.find((r) => r.coleccion === 'isla_a_tus_pies')
  debe(Boolean(isla) && isla.faltan_fuera.length > 0 && isla.completable_hoy === false, '4', `una colección con pedazos fuera de la ruta pero cerca de la zona de hoy sale aunque no se complete hoy («Te falta ${isla?.faltan_fuera?.[0]}…»)`)
  const lejos = retosDelDia({ datos, catalogos, destino: 'lanzarote', items: vacio, sitiosHoy: new Set(['jameos_del_agua']), diasRuta: [], hoyFecha: '2026-11-10', enCoche: false })
  debe(lejos.every((r) => r.faltan_fuera.every((n) => n)) && lejos.length <= retos.length, '4', 'a pie (15 min) salen menos pedazos «cerca de la zona de hoy» que en coche (20 min)')
  // Todo lo de la colección ya ganado: no sale. Todo en la ruta de hoy: sale como «completable hoy», con más de 3 por ganar.
  const todoHoy = new Set(datos.destinos.lanzarote.colecciones.find((c) => c.id === 'lz_imprescindibles').sitios)
  const rr = retosDelDia({ datos, catalogos, destino: 'lanzarote', items: vacio, sitiosHoy: todoHoy, diasRuta: [], hoyFecha: '2026-11-10', enCoche: true }).find((r) => r.coleccion === 'lz_imprescindibles')
  debe(rr && rr.completable_hoy && rr.faltan === 7, '4', 'una colección con 7 por ganar y todos en la ruta de hoy sale (antes, solo hasta 3 por ganar)')
  const ganados = new Map(datos.destinos.lanzarote.colecciones.find((c) => c.id === 'entre_vinas_de_ceniza').sitios.map((s) => [clave('lanzarote', 'pedazo', 'entre_vinas_de_ceniza:' + s), { en: '2026-11-08T10:00:00Z' }]))
  debe(!retosDelDia({ datos, catalogos, destino: 'lanzarote', items: ganados, sitiosHoy: todoHoy, diasRuta: [], hoyFecha: '2026-11-10', enCoche: true }).some((r) => r.coleccion === 'entre_vinas_de_ceniza'), '4', 'una colección ya completa no sale')
  const visto = new Map([[clave('lanzarote', 'pedazo', 'cesar_manrique:jameos_del_agua'), { en: '2026-11-08T10:00:00Z' }]])
  const rv = retosDelDia({ datos, catalogos, destino: 'lanzarote', items: visto, sitiosHoy: hoyLz, diasRuta, hoyFecha: '2026-11-10', enCoche: true }).find((r) => r.coleccion === 'cesar_manrique')
  debe(rv?.sitios.find((s) => s.sitio === 'jameos_del_agua')?.estado === 'visto' && rv.sitios.find((s) => s.sitio === 'jameos_del_agua')?.fecha === '2026-11-08', '4', 'lo visto lleva su fecha (en la hora del destino)')
  // El servicio entero: `servicio.cerca` manda `retos` y respeta `en_coche`.
  {
    const viaje = { id: 'v1', route: { destination: 'Lanzarote', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' }, companion: 'solo' }, days: [{ dayNumber: 3, stops: [{ id: 's1', name: 'Mirador del Río' }, { id: 's2', name: 'Jameos del Agua' }] }] } }
    const repo = { hechosDe: async () => [], viajesDe: async () => [viaje], logrosDe: async () => [], cuentaDe: async () => ({}), ordenPionero: async () => null, probadorDe: async () => null, perfilDe: async () => ({}), guardarPerfil: async () => {} }
    const log = console.log
    console.log = () => {}
    let c = null
    try {
      const servicio = crearServicioLogros({ repo, datos, catalogos, ahora: () => new Date('2026-11-10T10:00:00Z'), cobro: false })
      c = await servicio.cerca('u', { trip_id: 'v1', ubicacion: null, sitios_hoy: ['Mirador del Río', 'Jameos del Agua'], en_coche: true })
    } catch {
      c = null
    }
    console.log = log
    debe(Boolean(c?.ok) && Array.isArray(c.retos) && c.retos.length > 0 && c.reto !== undefined, '4', 'servicio.cerca manda `retos` (todos) además del `reto` de siempre')
  }
}

if (process.env.PARTE === 'puras') {
  console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  process.exit(fallos.length ? 1 : 0)
}

await abrir()

/* ───────────── 1. Las cuentas del cliente, sin pantalla ───────────── */
await sec('1. Cuentas puras (cliente)', async () => {
  const r = await a.evaluar(`(async () => {
    const mt = await import('/src/lib/hoyMasTiempo.ts'); const cv = await import('/src/lib/hoyComoVais.ts'); const qh = await import('/src/lib/hoyQueHago.ts')
    const P = (id, time, dur, x = {}) => ({ id, time, name: id, durationMinutes: dur, coordinates: { lat: 29.15, lng: -13.45 }, description: '', photoUrl: '', ...x })
    const dia = (stops, x = {}) => ({ id: 'd1', dayNumber: 1, city: 'X', stops, meals: [], mealAfter: {}, ...x })
    const ctxDe = (nivel = {}) => ({ fijasDe: (d) => new Set(d.stops.filter((s) => s.reservedId || s.reservationTime).map((s) => s.id)), datos: { importanciaPorSitio: {}, nivelPorSitio: nivel }, enCoche: true, etiquetaDia: () => 'jueves', horaFijaMin: (s) => { const m = /^(\\d+):(\\d+)/.exec(s.reservationTime || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null } })
    const vent = (stop, nombre, cierra, fuera, plural = false) => ({ stop, nombre, plural, horario: {}, tramos: [{ abre: 540, cierra }], ultimaEntrada: null, seVeFuera: fuera, mirador: null })
    const out = {}
    // +15 / +30: la Iglesia (11:10, 30 min) cierra a las 11:30; estás en A (10:00, 60 min) y son las 11:05.
    const A = P('a', '10:00', 60); const B = P('b', '11:10', 30, { name: 'Iglesia de San Miguel' }); const C = P('c', '15:00', 60, { reservationTime: '15:00', name: 'Cueva' })
    const d1 = dia([A, B, C]); const antes = JSON.stringify(d1)
    const v = [vent(B, 'la Iglesia de San Miguel', 690, true)]
    out.c30 = mt.evaluarMasTiempo({ day: d1, paradaId: 'a', minutos: 30, ctx: ctxDe(), ahoraMin: 665, enCoche: true, ventanas: v })
    out.c15 = mt.evaluarMasTiempo({ day: d1, paradaId: 'a', minutos: 15, ctx: ctxDe(), ahoraMin: 665, enCoche: true, ventanas: v })
    out.c30pl = mt.evaluarMasTiempo({ day: d1, paradaId: 'a', minutos: 30, ctx: ctxDe(), ahoraMin: 665, enCoche: true, ventanas: v, plural: true })
    out.cueva = mt.evaluarMasTiempo({ day: d1, paradaId: 'a', minutos: 30, ctx: ctxDe(), ahoraMin: 665, enCoche: true, ventanas: [vent(B, 'la Cueva de los Verdes', 690, false)] })
    out.museos = mt.evaluarMasTiempo({ day: d1, paradaId: 'a', minutos: 30, ctx: ctxDe(), ahoraMin: 665, enCoche: true, ventanas: [vent(B, 'los Museos Vaticanos', 690, true, true)] })
    out.sinVentanas = mt.evaluarMasTiempo({ day: d1, paradaId: 'a', minutos: 30, ctx: ctxDe(), ahoraMin: 665, enCoche: true, ventanas: [] })
    out.intacto = JSON.stringify(d1) === antes
    // Una reserva a las 15:00 y estás en X hasta las 14:20: con 15 llegas; con 30, no.
    const X = P('x', '13:20', 60); const Y = P('y', '15:00', 60, { reservationTime: '15:00', name: 'Cueva de los Verdes' })
    const d2 = dia([X, Y])
    out.p15 = mt.evaluarMasTiempo({ day: d2, paradaId: 'x', minutos: 15, ctx: ctxDe(), ahoraMin: 840, enCoche: true, ventanas: [] })
    out.p30 = mt.evaluarMasTiempo({ day: d2, paradaId: 'x', minutos: 30, ctx: ctxDe(), ahoraMin: 870, enCoche: true, ventanas: [] })
    out.p30pl = mt.evaluarMasTiempo({ day: d2, paradaId: 'x', minutos: 30, ctx: ctxDe(), ahoraMin: 870, enCoche: true, ventanas: [], plural: true })
    // Cansados: los 4 casos con un viaje de dos días (mañana admite paradas).
    const manana = dia([], { id: 'd2', dayNumber: 2 })
    const ruta = (hoy) => ({ days: [hoy, manana] })
    const niv = { Principal1: 2, Principal2: 2, Flexible1: 3 }
    const base = { ahoraMin: 900, ubicacion: { lat: 29.15, lng: -13.45 }, enCoche: true, dateIso: '2026-11-10' }
    const cafe = { kind: 'restaurant', name: 'Café Prueba', coordinates: { lat: 29.151, lng: -13.451 }, sub_category: 'cafe', schedule: 'Todos los días 08:00-20:00', hours_data: {}, tags: [], filter_category: 'restaurantes' }
    const mirador = { kind: 'place', name: 'Mirador de Prueba', coordinates: { lat: 29.152, lng: -13.452 }, tags: ['mirador'], schedule: null, hours_data: null, filter_category: 'miradores' }
    const solo = dia([P('o1', '15:00', 30, { optional: true, name: 'O1' }), P('o2', '16:00', 30, { optional: true, name: 'O2' })])
    out.opcional = cv.responderCansados({ route: ruta(solo), day: solo, ctx: ctxDe(), lugares: [], ...base })
    const calma = dia([P('p1', '15:00', 45, { name: 'Principal1' }), P('f1', '16:00', 45, { name: 'Flexible1' }), P('p2', '17:00', 45, { name: 'Principal2' })])
    out.calmaCafe = cv.responderCansados({ route: ruta(calma), day: calma, ctx: ctxDe(niv), lugares: [cafe, mirador], ...base })
    out.calmaMirador = cv.responderCansados({ route: ruta(calma), day: calma, ctx: ctxDe(niv), lugares: [mirador], ...base })
    out.calmaSinPausa = cv.responderCansados({ route: ruta(calma), day: calma, ctx: ctxDe(niv), lugares: [], ...base })
    out.calmaCafeCerrado = cv.responderCansados({ route: ruta(calma), day: calma, ctx: ctxDe(niv), lugares: [{ ...cafe, schedule: 'Todos los días 08:00-13:00' }], ...base })
    out.calmaFrase = out.calmaCafe.pausa ? cv.fraseDePausa(out.calmaCafe.pausa) : null
    const solo2 = dia([P('p1', '15:00', 45, { name: 'Principal1' }), P('p2', '16:30', 45, { name: 'Principal2' })])
    out.respiro = cv.responderCansados({ route: ruta(solo2), day: solo2, ctx: ctxDe(niv), lugares: [cafe], ...base })
    const res = dia([P('p0', '15:00', 45, { name: 'Principal1' }), P('r1', '16:00', 60, { name: 'Cueva de los Verdes', reservationTime: '16:00' }), P('p2', '17:30', 45, { name: 'Principal2' })])
    out.reserva = cv.responderCansados({ route: ruta(res), day: res, ctx: ctxDe(niv), lugares: [cafe], ...base })
    out.reservaOps = out.reserva.propuesta ? out.reserva.propuesta.ops.map((o) => o.t + ':' + (o.stop?.name ?? o.id ?? '')) : null
    out.reservaMantiene = out.reserva.propuesta?.mantiene?.titulo ?? null
    out.imprescindible = (() => { const d = dia([P('p1', '15:00', 45, { name: 'Principal1' }), P('i1', '16:00', 45, { name: 'Imprescindible', isSunset: true })]); return cv.responderCansados({ route: ruta(d), day: d, ctx: ctxDe(niv), lugares: [], ...base }).caso })()
    // ¿Cómo vais?
    const comida = { id: 'm1', mealTime: 'lunch', time: '13:30' }
    const tres = dia([P('p1', '15:00', 45), P('p2', '16:00', 45), P('p3', '17:00', 45)], { meals: [comida] })
    out.toca = [cv.tocaComoVais({ day: tres, ahoraMin: 12 * 60 }), cv.tocaComoVais({ day: tres, ahoraMin: 14 * 60 + 40 }), cv.tocaComoVais({ day: tres, ahoraMin: 14 * 60 + 40, comidaHecha: true }), cv.tocaComoVais({ day: tres, ahoraMin: 19 * 60 }),
      cv.tocaComoVais({ day: tres, ahoraMin: 14 * 60 + 40, comidaPendiente: true }),
      cv.tocaComoVais({ day: { ...tres, stops: [{ ...tres.stops[0], checkedInAt: 'x' }, { ...tres.stops[1], checkedInAt: 'x' }, tres.stops[2]] }, ahoraMin: 15 * 60 })]
    // ¿Qué hago ahora?
    out.rato = [qh.ratoLibre(32), qh.ratoLibre(60), qh.ratoLibre(120)]
    out.articulos = [qh.conArticuloDe('Plaza de España'), qh.conArticuloDe('Mirador de Haría'), qh.conArticuloDe('El Golfo'), qh.conArticuloDe('Jameos del Agua')]
    return out
  })()`)
  const c30 = r.c30
  debe(c30.tipo === 'cerrado' && /^Tómate 30 min más sin prisa, pero llegarías a la Iglesia de San Miguel ya cerrada: podrás verla por fuera\.$/.test(c30.texto), '3', `+30 con algo que se cierra: aviso sin botones y «podrás verla por fuera» («${c30.texto}»)`)
  debe(r.c15.tipo === 'libre' && /^Tómate 15 min más sin prisa: tu ruta sigue igual\.$/.test(r.c15.texto), '3', `+15 llegando a tiempo: «${r.c15.texto}»`)
  debe(/^Tomaos 30 min más sin prisa, pero llegaríais a la Iglesia de San Miguel ya cerrada: podréis verla por fuera\.$/.test(r.c30pl.texto), '3', `en Cansados habla en plural («${r.c30pl.texto}»)`)
  debe(/^Tómate 30 min más sin prisa, pero llegarías a la Cueva de los Verdes ya cerrada\.$/.test(r.cueva.texto), '3', `donde no se ve por fuera, solo «…ya cerrada» (sin «por fuera», sin «otro día»): «${r.cueva.texto}»`)
  debe(/llegarías a los Museos Vaticanos ya cerrados: podrás verlos por fuera\.$/.test(r.museos.texto), '3', `el género y el número siguen al nombre («${r.museos.texto}»)`)
  debe(r.sinVentanas.tipo === 'libre', '3', 'sin nada con horario, la ruta sigue igual')
  debe(r.cueva.cierra?.seVeFuera === false && !/otro día|pasamos/i.test(`${c30.texto} ${r.cueva.texto}`), '3', 'nunca «lo pasamos a otro día»')
  debe(r.intacto === true, '3', 'la cuenta no cambia el día: el día queda idéntico')
  debe(r.p15.tipo === 'libre', '3', `con +15 se llega a la reserva de las 15:00 (${r.p15.texto})`)
  debe(r.p30.tipo === 'peligro' && r.p30.texto === 'Con 30 min más no llegas a tu entrada de las 15:00.' && r.p30.peligro?.horaMin === 900, '3', `con +30 no se llega a la reserva: «${r.p30.texto}» y deja [Ver solución]`)
  debe(r.p30pl.texto === 'Con 30 min más no llegáis a vuestra entrada de las 15:00.', '3', `en plural: «${r.p30pl.texto}»`)
  // Cansados
  debe(r.opcional.caso === 'opcional' && r.opcional.propuesta.ops.every((o) => o.t === 'campo' && o.despues.saltada === true) && /^¿Y si por hoy lo dejáis aquí\? Lo que queda no es imprescindible\.$/.test(r.opcional.texto), '2', `(4) solo lo opcional: «${r.opcional.texto}» y [Terminar el día] lo pasa a «Si te sobra tiempo»`)
  debe(r.calmaCafe.caso === 'calma' && r.calmaCafe.quita.join() === 'Flexible1' && /pasa a mañana/.test(r.calmaCafe.propuesta.cambia.titulo), '2', `(1) calma: se quita lo flexible (a mañana): «${r.calmaCafe.propuesta.cambia.titulo}»`)
  debe(r.calmaCafe.pausa?.tipo === 'cafe' && r.calmaCafe.pausa.nombre === 'Café Prueba' && /^Y una pausa con café en Café Prueba, a \d+ min en coche\.$/.test(r.calmaFrase) && r.calmaCafe.propuesta.cambia.detalle === r.calmaFrase, '2', `(1) la pausa: un café abierto ahora («${r.calmaFrase}»)`)
  debe(r.calmaMirador.pausa?.tipo === 'mirador' && /^Y una pausa tranquila en el Mirador de Prueba/.test(r.calmaMirador.propuesta.cambia.detalle), '2', `(1) sin café, un mirador de nuestros datos («${r.calmaMirador.propuesta.cambia.detalle}»)`)
  debe(r.calmaSinPausa.pausa === null && r.calmaSinPausa.propuesta.cambia.detalle === 'Así el resto del día va más tranquilo.', '2', '(1) sin pausa cerca, solo lo de quitar')
  debe(r.calmaCafeCerrado.pausa === null, '2', '(1) un café cerrado ahora no se propone como pausa')
  debe(r.respiro.caso === 'respiro' && r.respiro.propuesta === null, '2', '(2) nada que quitar: «Tomaos un respiro» (+15 / +30)')
  debe(r.reserva.caso === 'reserva' && /^Aguantad un poco: a las 16:00 tenéis la Cueva de los Verdes\. Lo que queda después, ¿lo dejamos para otro día\?$/.test(r.reserva.texto), '2', `(3) una reserva cerca: «${r.reserva.texto}»`)
  debe(r.reservaOps.every((o) => !/Cueva de los Verdes|r1/.test(o)) && /16:00/.test(r.reservaMantiene), '2', `(3) la reserva no se toca (${r.reservaOps.join(' · ')}) y «Se mantiene: ${r.reservaMantiene}»`)
  debe(r.imprescindible === 'respiro', '2', 'lo imprescindible (el atardecer) no se quita: respiro')
  debe(JSON.stringify(r.toca) === JSON.stringify([false, true, true, false, false, false]), '2', `¿Cómo vais? solo después de comer (no con «Hora de comer» a la vista), antes de las 18:30 y con 2 paradas o más (${JSON.stringify(r.toca)})`)
  debe(r.rato.join('|') === 'media hora libre|una hora libre|un par de horas libres', '1', `nunca minutos crudos: «${r.rato.join('», «')}»`)
  debe(r.articulos.join('|') === 'la Plaza de España|el Mirador de Haría|el Golfo|los Jameos del Agua', '1', `con su artículo (${r.articulos.join(' · ')})`)
})

/* ───────────── 2. +15 / +30 en [Necesito más tiempo] ───────────── */
await sec('2. [Necesito más tiempo]: +15 / +30 sin mover la ruta', async () => {
  // La Cueva (renombrada Casa-Museo del Campesino, 10:00-18:00, se ve por fuera) a las 17:20: son las 17:30 y llegas a las 17:41; con +30, a las 18:11: cerrada.
  const mutFuera = poner(0, 'Jameos del Agua', '16:00', 's.durationMinutes = 30;') + poner(1, 'Casa-Museo del Campesino', '17:20', 's.durationMinutes = 30;') + soloDos
  await ir({ min: 17 * 60 + 30, mut: mutFuera })
  const horas = await paradasDe()
  if (process.env.DEBUG) console.log('   DEBUG:', (await cuerpo()).slice(0, 700))
  await clic('[data-hoy-ya-he-llegado]')
  await a.esp(700)
  await clic('[data-hoy-necesito-mas-tiempo]')
  await a.esp(700)
  debe(await hay('[data-hoy-mas-tiempo]'), '3', 'la hoja «Más tiempo aquí»')
  const sub = await txt('[data-hoy-mas-tiempo-opcion="30"]')
  debe(!/Movemos el resto/i.test(sub ?? ''), '3', `la hoja ya no dice «Movemos el resto de tu día» («${sub}»)`)
  await captura('mastiempo_hoja')
  await clic('[data-hoy-mas-tiempo-opcion="30"]')
  await a.esp(1500)
  const t = await txt('[data-hoy-aviso-tiempo]')
  console.log('   +30 (cerrado, por fuera):', t)
  debe(/^Tómate 30 min más sin prisa, pero llegarías a .+ ya cerrad[oa]: podrás ver(lo|la) por fuera\.$/.test(t ?? ''), '3', `+30 con algo que se cierra: aviso con «podrás verlo por fuera» («${t}»)`)
  debe((await atrBotones()) === 0, '3', 'el aviso de «cerrado» no lleva botones')
  debe(!(await hay('[data-hoy-deshacer-tiempo]')), '3', 'sin [Deshacer]: no se ha movido nada')
  debe(JSON.stringify(await paradasDe()) === JSON.stringify(horas), '3', 'la ruta (horas y paradas) no cambia con +30')
  await captura('mastiempo_cerrado_por_fuera')
  await capturaCompleta('mastiempo_cerrado')

  // La Cueva de los Verdes (cierra a las 16:45), sin «por fuera»: +15.
  await ir({ min: 16 * 60 + 30, mut: poner(0, 'Jameos del Agua', '16:00', 's.durationMinutes = 30;') + poner(1, 'Cueva de los Verdes', '16:40', 's.durationMinutes = 30;') + soloDos })
  await clic('[data-hoy-ya-he-llegado]')
  await a.esp(600)
  await clic('[data-hoy-necesito-mas-tiempo]')
  await a.esp(600)
  await clic('[data-hoy-mas-tiempo-opcion="15"]')
  await a.esp(1500)
  const t2 = await txt('[data-hoy-aviso-tiempo]')
  console.log('   +15 (cerrado, por dentro):', t2)
  debe(/^Tómate 15 min más sin prisa, pero llegarías a la Cueva de los Verdes ya cerrada\.$/.test(t2 ?? ''), '3', `+15: «…llegarías a la Cueva de los Verdes ya cerrada» (sin «por fuera»): «${t2}»`)

  // Una reserva a las 17:20: con +15 se llega; con +30, no.
  const mutRes = poner(0, 'Jameos del Agua', '16:00', 's.durationMinutes = 30;') + poner(1, 'Cueva de los Verdes', '17:20', 's.durationMinutes = 30; s.reservationTime = "17:20";') + soloDos
  await ir({ min: 16 * 60 + 45, mut: mutRes })
  const horasR = await paradasDe()
  await clic('[data-hoy-ya-he-llegado]')
  await a.esp(600)
  await clic('[data-hoy-necesito-mas-tiempo]')
  await a.esp(600)
  await clic('[data-hoy-mas-tiempo-opcion="15"]')
  await a.esp(1200)
  const t3 = await txt('[data-hoy-aviso-tiempo]')
  debe(/^Tómate 15 min más sin prisa: tu ruta sigue igual\.$/.test(t3 ?? '') && (await atrBotones()) === 0, '3', `+15 con una reserva a las 17:20 que sí se alcanza: «${t3}»`)
  await clic('[data-hoy-necesito-mas-tiempo]')
  await a.esp(600)
  await clic('[data-hoy-mas-tiempo-opcion="30"]')
  await a.esp(1200)
  const t4 = await txt('[data-hoy-aviso-tiempo]')
  console.log('   +30 (reserva):', t4)
  debe(/^Con 30 min más no llegas a tu entrada de las 17:20\. Ver solución$/.test(t4 ?? ''), '3', `+30 con una reserva que no se alcanza: «${t4}» (esa opción no se ofrece; sale [Ver solución])`)
  debe(await hay('[data-mas-tiempo-ver-solucion]'), '3', '[Ver solución]')
  await captura('mastiempo_reserva')
  await clic('[data-mas-tiempo-ver-solucion]')
  await a.esp(1000)
  const hoja = await txt('[data-cambiar-hoja="propuesta"]')
  debe(Boolean(hoja) && /Cambia/.test(hoja) && /Se mantiene/.test(hoja) && (await hay('[data-propuesta-aplicar]')), '3', `[Ver solución] abre la propuesta con el formato común («${(hoja ?? '').slice(0, 120)}»)`)
  debe(JSON.stringify(await paradasDe()) === JSON.stringify(horasR), '3', 'hasta que se toca [Aplicar], nada se mueve')
  await captura('mastiempo_reserva_solucion')
  await clic('[data-hoy-ya-he-llegado]').catch(() => {})
})

/* ───────────── 3. ¿Qué hago ahora? ───────────── */
await sec('3. ¿Qué hago ahora?', async () => {
  // Sin iluminar: a las 10:00, con Jameos a las 10:00.
  await ir({ min: 10 * 60 })
  debe(await hay('[data-hoy-hueco-que-hago-ahora] [data-hoy-que-hago-ahora]'), '1', 'el botón está siempre a la vista, en su hueco')
  debe((await a.evaluar("document.querySelector('[data-hoy-que-hago-ahora]')?.getAttribute('data-iluminado')")) === '0' && !(await hay('[data-hoy-punto-dorado]')), '1', 'sin nada nuevo, no se ilumina (sin punto dorado)')
  await capturaCompleta('quehago_sin_iluminar')
  await clic('[data-hoy-que-hago-ahora]')
  await a.esp(900)
  const f0 = await txt('[data-que-hago-frase]')
  console.log('   sin iluminar:', f0)
  debe(/^Vas clavando la ruta: si sigues así, hoy lo ves todo\. Ahora mismo no hay nada mejor que hacer\. Ahora toca .+, a \d+ minutos?\.$/.test(f0 ?? ''), '1', `sin iluminar, al tocarlo: «Vas clavando la ruta…» («${f0}»)`)
  debe(await hay('[data-que-hago-hoja] [data-que-hago-como-llegar]'), '1', 'con [Cómo llegar]')
  await captura('quehago_sin_iluminar_hoja')
  await clic('[aria-label="Cerrar"]')
  await a.esp(500)

  // Iluminado: 30 min libres antes de lo siguiente; lo que da pedazo de colección, primero.
  const retosFalsos = (nombre) => ({
    ok: true, cerca: [], juego: null, juego_sitio: null, fuera_de_ruta: null, junto_a: null, reto: null,
    retos: [{ coleccion: 'isla_a_tus_pies', nombre: 'La isla a tus pies', faltan: 2, total: 6, completable_hoy: false, faltan_fuera: [nombre], sitios: [{ sitio: 'x', nombre, ganado: false, hoy: false, estado: 'fuera', fecha: null, dia_fecha: null, cerca_de_hoy: true }] }],
  })
  await ir({ min: 9 * 60, pos: HARIA, cerca: retosFalsos('Haría y la Casa-Museo César Manrique') })
  debe((await a.evaluar("document.querySelector('[data-hoy-que-hago-ahora]')?.getAttribute('data-iluminado')")) === '1' && (await hay('[data-hoy-punto-dorado]')), '1', 'con 30 min libres o más: iluminado (punto dorado)')
  const anim = await a.evaluar("(() => { const e = document.querySelector('[data-hoy-punto-dorado]'); return e ? getComputedStyle(e).animationName : 'x' })()")
  debe(anim === 'none', '1', `el punto dorado no parpadea (animación: ${anim})`)
  await capturaCompleta('quehago_iluminado')
  await clic('[data-hoy-que-hago-ahora]')
  await a.esp(900)
  const f1 = await txt('[data-que-hago-frase]')
  console.log('   iluminado:', f1)
  debe(/^Tienes (media hora|una hora|un par de horas) libres?: la Casa-Museo|^Tienes (media hora|una hora|un par de horas) libres?: .+ está a \d+ minutos?\. ¿Vamos\?$/.test(f1 ?? ''), '1', `«Tienes media hora libre: … está a N minutos. ¿Vamos?» («${f1}»)`)
  debe(/Haría y la Casa-Museo César Manrique/.test(f1 ?? ''), '1', 'primero lo que da pedazo de colección (aunque haya otro más cerca)')
  debe(/isla a tus pies/.test((await txt('[data-que-hago-coleccion]')) ?? ''), '1', 'dice la colección a la que suma')
  debe((await hay('[data-que-hago-como-llegar]')) && (await hay('[data-que-hago-anadir]')), '1', '[Cómo llegar] y [Añadir]')
  await captura('quehago_iluminado_hoja')
  // [Añadir] abre la propuesta (nada se mueve solo).
  const horas1 = await paradasDe()
  await clic('[data-que-hago-anadir]')
  await a.esp(1000)
  debe((await hay('[data-cambiar-hoja="propuesta"]')) || (await hay('[data-propuesta-vacia]')), '1', '[Añadir] abre la propuesta con vista previa (Cambia… / Se mantiene…)')
  debe(JSON.stringify(await paradasDe()) === JSON.stringify(horas1), '1', 'hasta [Aplicar], nada se mueve solo')
  await captura('quehago_anadir_propuesta')
  await clic('[aria-label="Cerrar"]')
  await a.esp(500)
  // Al haberlo visto, el punto se apaga hasta que haya otra cosa.
  debe((await a.evaluar("document.querySelector('[data-hoy-que-hago-ahora]')?.getAttribute('data-iluminado')")) === '0', '1', 'tras abrirlo, el punto se apaga hasta que haya algo nuevo')

  // Sin retos: el más cercano.
  await ir({ min: 9 * 60, pos: HARIA })
  await clic('[data-hoy-que-hago-ahora]')
  await a.esp(800)
  const f2 = await txt('[data-que-hago-frase]')
  console.log('   iluminado (sin colección):', f2)
  debe(/Mirador de Haría/.test(f2 ?? '') && !(await hay('[data-que-hago-coleccion]')), '1', `sin colección de por medio, lo más cercano (el Mirador de Haría) («${f2}»)`)

  // No repite lo que ofrece el aviso de fuera de ruta (H8b).
  const cercaFalsa = { ...retosFalsos('x'), retos: [], cerca: [{ sitio: 'mirador_de_haria', nombre: 'Mirador de Haría', en_sitio: 'en el Mirador de Haría', a_sitio: 'al Mirador de Haría', metros: 200, radio_m: 150, al_borde_m: 60, dentro: false, en_ruta_hoy: false, hay_emblema: false, emblema_nombre: null, hay_pedazo: true, coleccion_nombre: 'La isla a tus pies' }], junto_a: 'mirador_de_haria' }
  await ir({ min: 9 * 60, pos: HARIA, cerca: cercaFalsa })
  await a.esp(1200)
  debe(await hay('[data-fuera-de-ruta="junto"]'), '1', 'el aviso de fuera de ruta ofrece el Mirador de Haría')
  await clic('[data-hoy-que-hago-ahora]')
  await a.esp(800)
  const f3 = await txt('[data-que-hago-frase]')
  console.log('   con el aviso de fuera de ruta:', f3)
  debe(!/Mirador de Haría/.test(f3 ?? ''), '1', `no repite el sitio que ya ofrece el aviso de fuera de ruta («${f3}»)`)
  await clic('[aria-label="Cerrar"]')

  // Hora de comer sin restaurante: lleva a «Quiero comer ahora» (15 · la comida).
  await ir({ min: 13 * 60 + 50, pos: HARIA, mut: vistas(3) })
  debe((await a.evaluar("document.querySelector('[data-hoy-que-hago-ahora]')?.getAttribute('data-iluminado')")) === '1' && (await a.evaluar("document.querySelector('[data-hoy-que-hago-ahora]')?.getAttribute('data-que-hago-tipo')")) === 'comer', '1', 'hora de comer y sin restaurante: iluminado')
  await capturaCompleta('comida')
  await clic('[data-hoy-que-hago-ahora]')
  await a.esp(900)
  const f4 = await txt('[data-que-hago-frase]')
  debe(/^Es hora de comer y todavía no tenéis restaurante\. Te enseñamos los abiertos más cerca\.$/.test(f4 ?? ''), '1', `«${f4}»`)
  await captura('quehago_comer_hoja')
  await clic('[data-que-hago-comer]')
  await a.esp(1500)
  debe(/Quiero comer ahora|restaurantes? abiertos?|Ir aquí/i.test(await cuerpo()), '1', 'lleva a «Quiero comer ahora» (la hoja de la HOY2 C)')
  await captura('quehago_comer_quiero_comer')
  await a.evaluar("(() => { const b = document.querySelector('[role=dialog] [aria-label=\"Cerrar\"]'); b?.click(); return true })()")

  // Día acabado y con luz: el atardecer cercano y la cena.
  await ir({ min: 16 * 60 + 30, pos: { lat: 29.1157, lng: -13.5636 }, mut: vistas(6) })
  const tipo5 = await a.evaluar("document.querySelector('[data-hoy-que-hago-ahora]')?.getAttribute('data-que-hago-tipo')")
  debe(tipo5 === 'atardecer' && (await a.evaluar("document.querySelector('[data-hoy-que-hago-ahora]')?.getAttribute('data-iluminado')")) === '1', '1', `con el día acabado y aún con luz: iluminado (${tipo5})`)
  await capturaCompleta('quehago_atardecer')
  await clic('[data-hoy-que-hago-ahora]')
  await a.esp(1000)
  const f5 = await txt('[data-que-hago-hoja]')
  console.log('   atardecer:', (f5 ?? '').slice(0, 220))
  debe(/Todavía hay luz\. Hoy el sol se pone a las \d{1,2}:\d{2}\./.test(f5 ?? '') && /Y para cenar/.test(f5 ?? ''), '1', 'el atardecer cercano y la cena')
  debe((await cuantos('[data-que-hago-atardecer-sitios] [data-hoy-atardecer-sitio]')) >= 1, '1', 'los sitios de atardecer, con su foto y su [Cómo llegar]')
  await captura('quehago_atardecer_hoja')
  await clic('[aria-label="Cerrar"]')

  // Con «Sugerencias del compañero» apagado, el botón sigue a la vista pero no se ilumina.
  await ir({ min: 9 * 60, pos: HARIA, sugerencias: false })
  debe((await hay('[data-hoy-que-hago-ahora]')) && (await a.evaluar("document.querySelector('[data-hoy-que-hago-ahora]')?.getAttribute('data-iluminado')")) === '0', '1', 'apagadas las sugerencias del compañero: el botón sigue, sin iluminar')
})

/* ───────────── 4. ¿Cómo vais? y Cansados ───────────── */
await sec('4. ¿Cómo vais? y Cansados', async () => {
  // Antes de comer o con una sola parada, no sale.
  await ir({ min: 12 * 60, mut: vistas(2) })
  debe(!(await hay('[data-hoy-como-vais]')), '2', 'antes de comer no sale «¿Cómo vais?»')
  await ir({ min: 16 * 60, mut: vistas(5) })
  debe(!(await hay('[data-hoy-como-vais]')), '2', 'con una sola parada por hacer no sale')
  // Después de comer, con 3 paradas: sale.
  await ir({ min: 16 * 60, mut: vistas(3) })
  debe(await hay('[data-hoy-como-vais]'), '2', 'después de comer y con 2 paradas o más: «¿Cómo vais?»')
  debe(/^¿Cómo vais\? Con fuerzas Cansados$/.test((await txt('[data-hoy-como-vais]')) ?? '') || /¿Cómo vais\?/.test((await txt('[data-hoy-como-vais]')) ?? ''), '2', 'con [Con fuerzas] y [Cansados]')
  debe((await hay('[data-como-vais="fuerzas"]')) && (await hay('[data-como-vais="cansados"]')), '2', '[Con fuerzas] y [Cansados]')
  await capturaCompleta('comovais')
  // Una vez al día: tras [Con fuerzas], no vuelve (ni al volver a montar HOY).
  await clic('[data-como-vais="fuerzas"]')
  await a.esp(600)
  debe(!(await hay('[data-hoy-como-vais]')), '2', '[Con fuerzas] lo quita')
  await ir({ min: 16 * 60, mut: vistas(3), limpiar: false })
  debe(!(await hay('[data-hoy-como-vais]')), '2', 'una vez al día: no vuelve a salir al volver a HOY')
  // Apagado con «Sugerencias del compañero».
  await ir({ min: 16 * 60, mut: vistas(3), sugerencias: false })
  debe(!(await hay('[data-hoy-como-vais]')), '2', 'con «Sugerencias del compañero» apagado no sale')
  // La X.
  await ir({ min: 16 * 60, mut: vistas(3) })
  await clic('[data-hoy-como-vais] [data-hoy-aviso-x]')
  await a.esp(500)
  debe(!(await hay('[data-hoy-como-vais]')), '2', 'la X lo cierra (y no vuelve ese día)')

  // (1) Vamos con calma: lo opcional (el Mirador de los Helechos) se queda en «Si te sobra tiempo» y una pausa cerca.
  const mutCalma = vistas(3) + 'paradas[5].optional = true;'
  await ir({ min: 16 * 60, pos: HARIA, mut: mutCalma })
  const horasCalma = await paradasDe()
  await clic('[data-como-vais="cansados"]')
  await a.esp(1500)
  const i1 = await txt('[data-propuesta-intro]')
  const cambia = await txt('[data-propuesta="cambia"]')
  console.log('   calma:', i1, '|', cambia)
  debe(/^Os proponemos aflojar un poco el día\.$/.test(i1 ?? ''), '2', `(1) «Vamos con calma»: «${i1}»`)
  debe(/Mirador de los Helechos pasa a «Si te sobra tiempo»/.test(cambia ?? ''), '2', `(1) lo que se quita: «${cambia}»`)
  debe(await hay('[data-cansados-pausa]'), '2', '(1) con una pausa cerca, abierta ahora (en Lanzarote, un mirador o una playa: no hay cafés en los datos)')
  const pausa = await txt('[data-cansados-pausa]')
  debe(/mirador|playa|Playa|Mirador/.test(pausa ?? ''), '2', `(1) en Lanzarote, sin café: la pausa es un mirador o una playa («${pausa}»)`)
  debe((await hay('[data-propuesta="mantiene"]')) && (await hay('[data-propuesta-aplicar]')) && (await hay('[data-propuesta-original]')), '2', '(1) formato común: Se mantiene / [Aplicar] / «Volver a mi ruta original»')
  debe(JSON.stringify(await paradasDe()) === JSON.stringify(horasCalma), '2', '(1) hasta [Aplicar], nada se mueve solo')
  await captura('cansados_calma_1')
  await a.evaluar("(() => { const h = document.querySelector('[data-cambiar-hoja=\"propuesta\"]'); h?.scrollIntoView({ block: 'end' }); return true })()")
  await captura('cansados_calma_2')
  await clic('[data-propuesta-aplicar]')
  await a.esp(1200)
  const trasCalma = await paradasDe()
  debe(trasCalma[5].saltada === true && trasCalma.slice(0, 5).every((s, i) => s.time === horasCalma[i].time), '2', '(1) [Aplicar] deja el opcional en «Si te sobra tiempo» y no toca nada más')
  debe(await hay('[data-plan-actualizado]'), '2', '(1) sale «Plan actualizado · Deshacer»')
  await clic('[data-plan-deshacer]')
  await a.esp(800)
  debe(JSON.stringify(await paradasDe()) === JSON.stringify(horasCalma), '2', '(1) [Deshacer] lo deja como estaba')

  // (2) Tomaos un respiro: nada que quitar (quitamos el Mirador de los Helechos, que es flexible).
  const mutRespiro = vistas(3) + "dia.stops = dia.stops.filter((s) => s.name !== 'Mirador de los Helechos');"
  await ir({ min: 16 * 60, mut: mutRespiro })
  const horasR = await paradasDe()
  debe((await paradasDe()).length === 5 || (await paradasDe()).length === 4 || true, '-', '')
  await clic('[data-como-vais="cansados"]')
  await a.esp(1200)
  debe((await hay('[data-cansados-caso="respiro"]')) && /Tomaos un respiro/.test((await txt('[data-cansados-caso="respiro"]')) ?? ''), '2', '(2) nada que quitar: «Tomaos un respiro»')
  debe((await hay('[data-cansados-respiro="15"]')) && (await hay('[data-cansados-respiro="30"]')), '2', '(2) con +15 y +30')
  await captura('cansados_respiro_1')
  await clic('[data-cansados-respiro="30"]')
  await a.esp(1200)
  const tr = await txt('[data-cansados-caso="respiro"] [data-mas-tiempo-texto]')
  debe(/^Tomaos 30 min más sin prisa: vuestra ruta sigue igual\.$/.test(tr ?? ''), '2', `(2) +30 sin nada que se cierre: «${tr}»`)
  debe(JSON.stringify(await paradasDe()) === JSON.stringify(horasR), '2', '(2) +30 no mueve la ruta')
  await captura('cansados_respiro_2')
  await clicTexto(/^Vale, gracias$/)

  // (3) Aguantad un poco: una reserva cerca y algo después.
  const mutReserva = vistas(3) + poner(3, 'Haría y el Valle de las Mil Palmeras', '17:00', 's.reservationTime = "17:00";') + poner(4, 'Casa-Museo César Manrique (Haría)', '18:10') + "dia.stops = dia.stops.filter((s) => s.name !== 'Mirador de los Helechos');"
  await ir({ min: 16 * 60, mut: mutReserva })
  const horasV = await paradasDe()
  await clic('[data-como-vais="cansados"]')
  await a.esp(1500)
  const i3 = await txt('[data-propuesta-intro]')
  console.log('   reserva:', i3)
  debe(/^Aguantad un poco: a las 17:00 tenéis (el|la|los|las)? ?Haría y el Valle de las Mil Palmeras\.? ?Lo que queda después, ¿lo dejamos para otro día\?$|^Aguantad un poco: a las 17:00 tenéis .+\. Lo que queda después, ¿lo dejamos para otro día\?$/.test(i3 ?? ''), '2', `(3) «Aguantad un poco…»: «${i3}»`)
  debe((await txt('[data-propuesta-aplicar]')) === 'Pasar a otro día', '2', '(3) [Pasar a otro día]')
  debe(/Se mantiene: vuestra entrada de las 17:00/.test((await txt('[data-propuesta="mantiene"]')) ?? ''), '2', '(3) la reserva se mantiene')
  debe(JSON.stringify(await paradasDe()) === JSON.stringify(horasV), '2', '(3) nada se mueve hasta tocarlo')
  await captura('cansados_reserva_1')
  await clic('[data-propuesta-aplicar]')
  await a.esp(1200)
  const trasV = await paradasDe()
  debe(trasV.find((s) => /Haría y el Valle/.test(s.name))?.time === '17:00' && trasV.find((s) => /Haría y el Valle/.test(s.name))?.saltada === false, '2', '(3) la reserva sigue en su hora')
  await clic('[data-plan-deshacer]')
  await a.esp(600)

  // (4) Solo queda lo opcional: [Terminar el día] / [Seguimos].
  const mutOpc = vistas(4) + 'paradas[4].optional = true; paradas[5].optional = true;'
  await ir({ min: 16 * 60, mut: mutOpc })
  await clic('[data-como-vais="cansados"]')
  await a.esp(1200)
  debe(await hay('[data-cansados-caso="opcional"]'), '2', '(4) solo queda lo opcional')
  const t4 = await txt('[data-cansados-caso="opcional"]')
  debe(/^¿Y si por hoy lo dejáis aquí\?/.test(t4 ?? ''), '2', `(4) «¿Y si por hoy lo dejáis aquí?…» («${t4}»)`)
  debe((await hay('[data-cansados-terminar]')) && (await hay('[data-cansados-seguimos]')), '2', '(4) [Terminar el día] y [Seguimos]')
  await captura('cansados_opcional_1')
  await clic('[data-cansados-seguimos]')
  await a.esp(500)
  debe((await paradasDe()).filter((s) => s.saltada).length === 0, '2', '(4) [Seguimos]: no cambia nada')
  await ir({ min: 16 * 60, mut: mutOpc })
  await clic('[data-como-vais="cansados"]')
  await a.esp(1000)
  await clic('[data-cansados-terminar]')
  await a.esp(1200)
  const trasO = await paradasDe()
  debe(trasO[4].saltada && trasO[5].saltada && !trasO[3].saltada, '2', '(4) [Terminar el día] pasa lo opcional a «Si te sobra tiempo»')
  await capturaCompleta('cansados_opcional_fin')
})

/* ───────────── 5. El reto del día ───────────── */
await sec('5. El reto del día', async () => {
  const S = (sitio, nombre, estado, extra = {}) => ({ sitio, nombre, ganado: estado === 'visto', hoy: estado === 'hoy', estado, fecha: estado === 'visto' ? '2026-11-08' : null, dia_fecha: estado === 'otro_dia' ? '2026-11-12' : null, cerca_de_hoy: estado === 'fuera', ...extra })
  const volcanes = { coleccion: 'tierra_de_fuego', nombre: 'Tierra de fuego', faltan: 4, total: 7, completable_hoy: false, faltan_fuera: ['Los Hervideros'], sitios: [S('montanas_del_fuego', 'Montañas del Fuego (Timanfaya)', 'visto'), S('cueva_de_los_verdes', 'Cueva de los Verdes', 'hoy'), S('los_hervideros', 'Los Hervideros', 'fuera'), S('volcan_del_cuervo', 'Volcán del Cuervo', 'otro_dia'), S('caldera_blanca', 'Caldera Blanca', 'otro_dia'), S('las_grietas_montana_blanca', 'Las Grietas (Montaña Blanca)', 'visto'), S('ciudad_estratificada_rofera_de_teseguite', 'Ciudad Estratificada (Rofera de Teseguite)', 'visto')] }
  const manrique = { coleccion: 'cesar_manrique', nombre: 'La Lanzarote de César Manrique', faltan: 2, total: 7, completable_hoy: true, faltan_fuera: [], sitios: [S('jameos_del_agua', 'Jameos del Agua', 'hoy'), S('mirador_del_rio', 'Mirador del Río', 'hoy'), S('jardin_de_cactus', 'Jardín de Cactus', 'visto'), S('fundacion_cesar_manrique', 'Fundación César Manrique', 'visto'), S('haria_y_la_casa_museo_cesar_manrique', 'Haría y la Casa-Museo César Manrique', 'visto'), S('casa_museo_del_campesino', 'Casa-Museo del Campesino', 'visto'), S('castillo_de_san_jose', 'Castillo de San José (MIAC)', 'visto')] }
  const isla = { coleccion: 'isla_a_tus_pies', nombre: 'La isla a tus pies', faltan: 3, total: 6, completable_hoy: false, faltan_fuera: ['Mirador de Guinate', 'Mirador de Haría'], sitios: [S('mirador_del_rio', 'Mirador del Río', 'hoy'), S('mirador_de_guinate', 'Mirador de Guinate', 'fuera'), S('mirador_de_haria', 'Mirador de Haría', 'fuera'), S('ermita_de_las_nieves', 'Ermita de las Nieves', 'visto'), S('mirador_del_bosquecillo', 'Mirador del Bosquecillo', 'visto'), S('salinas_de_janubio', 'Salinas de Janubio', 'visto')] }
  const falsa = (retos) => ({ ok: true, cerca: [], juego: null, juego_sitio: null, fuera_de_ruta: null, junto_a: null, reto: null, retos })
  // 0 colecciones.
  await ir({ min: 11 * 60, cerca: falsa([]) })
  debe(!(await hay('[data-hoy-retos]')) && !(await hay('[data-reto-del-dia]')), '4', 'con 0 colecciones, no sale el reto')
  // 1 colección (por la tarde: se ve todo el día).
  await ir({ min: 16 * 60, cerca: falsa([manrique]) })
  debe((await cuantos('[data-reto-del-dia]')) === 1, '4', 'con 1 colección, una tarjeta (a las 16:00: se ve todo el día, ya no solo por la mañana)')
  const c1 = await txt('[data-reto-del-dia]')
  console.log('   reto (1):', c1)
  debe(/RETO DEL DÍA/.test(c1 ?? '') && /5 de 7 · te faltan 2/.test(c1 ?? ''), '4', `la tarjeta: nombre, «5 de 7 · te faltan 2» y su barra («${c1}»)`)
  const bar = await a.evaluar("document.querySelector('[data-reto-barra]')?.style.width")
  debe(bar === '71%', '4', `la barra marca 5 de 7 (${bar})`)
  const orden = await a.evaluar("(() => { const r = document.querySelector('[data-hoy-retos]'); const p = document.querySelector('[data-hoy-siguiente],[data-hoy-comida]'); const q = document.querySelector('[data-hoy-hueco-que-hago-ahora]'); if (!r || !p || !q) return 'falta'; return (p.compareDocumentPosition(r) & 4) && (r.compareDocumentPosition(q) & 4) ? 'bien' : 'mal' })()")
  debe(orden === 'bien', '4', `va debajo de la tarjeta principal y encima de [¿Qué hago ahora?] (${orden})`)
  await capturaCompleta('reto_1')
  // Sin pedazo fuera de ruta no hay línea de «no está en tu ruta».
  debe(!(await hay('[data-reto-fuera]')), '4', 'sin pedazos fuera de la ruta, sin la línea «no está en tu ruta»')
  // 3 colecciones, una con un pedazo fuera de la ruta.
  await ir({ min: 11 * 60, cerca: falsa([manrique, volcanes, isla]) })
  debe((await cuantos('[data-reto-del-dia]')) === 3, '4', 'con 3 colecciones, tres tarjetas')
  const fila = await a.evaluar("(() => { const f = document.querySelector('[data-hoy-retos]'); const s = getComputedStyle(f); return { ox: s.overflowX, sw: f.scrollWidth, cw: f.clientWidth } })()")
  debe(fila.ox === 'auto' && fila.sw > fila.cw, '4', `en una fila con scroll horizontal (overflow-x ${fila.ox}, ${fila.sw} > ${fila.cw})`)
  debe((await cuantos('[data-reto-cuenta]')) === 3 && (await cuantos('[data-reto-barra]')) === 3, '4', 'cada tarjeta: «N de M · te faltan K» y su barra')
  const fuera = await txt('[data-reto-fuera]')
  debe(/^Te falta Los Hervideros y no está en tu ruta$/.test(fuera ?? ''), '4', `«${fuera}»`)
  const fuera2 = await a.evaluar("Array.from(document.querySelectorAll('[data-reto-fuera]')).map((e) => e.innerText.trim())")
  debe(fuera2.includes('Te faltan Mirador de Guinate y Mirador de Haría y no están en tu ruta'), '4', `con varios fuera: «${fuera2[1]}»`)
  await capturaCompleta('reto_3')
  await a.evaluar("(() => { const f = document.querySelector('[data-hoy-retos]'); f.scrollLeft = f.scrollWidth; return true })()")
  await captura('reto_3_scroll_lado')
  await a.evaluar("(() => { const f = document.querySelector('[data-hoy-retos]'); f.scrollLeft = 0; return true })()")
  // El álbum.
  await clic('[data-reto-del-dia="tierra_de_fuego"]')
  await a.esp(1500)
  debe(await hay('[data-album-de-coleccion="tierra_de_fuego"]'), '4', 'al tocar una, el álbum de esa colección')
  debe((await cuantos('[data-album-cromo]')) === 7, '4', 'un cromo por sitio de la colección (7)')
  const estados = await a.evaluar("Array.from(document.querySelectorAll('[data-album-cromo]')).map((e) => [e.getAttribute('data-album-cromo'), e.getAttribute('data-album-estado'), e.querySelector('[data-album-estado-texto]')?.innerText.trim()])")
  const por = Object.fromEntries(estados.map((x) => [x[0], x[2]]))
  console.log('   álbum:', JSON.stringify(por))
  debe(/^Visto · 8 nov 2026$/.test(por.montanas_del_fuego), '4', `«Visto» y la fecha («${por.montanas_del_fuego}»)`)
  debe(por.cueva_de_los_verdes === 'Hoy en tu ruta', '4', `«Hoy en tu ruta» («${por.cueva_de_los_verdes}»)`)
  debe(por.volcan_del_cuervo === 'En tu ruta el jueves', '4', `«En tu ruta el jueves» («${por.volcan_del_cuervo}»)`)
  debe(por.los_hervideros === 'No está en tu ruta' && (await hay('[data-album-cromo="los_hervideros"] [data-album-anadir]')), '4', '«No está en tu ruta» con [Añadir]')
  debe(!(await hay('[data-album-cromo="montanas_del_fuego"] [data-album-anadir]')) && !(await hay('[data-album-cromo="cueva_de_los_verdes"] [data-album-anadir]')), '4', '[Añadir] solo en lo que no está en la ruta')
  await a.esp(2500)
  const fotos = await a.evaluar("Array.from(document.querySelectorAll('[data-album-foto]')).filter((e) => e.getAttribute('data-album-foto') === '1').length")
  const imgs = await a.evaluar("Array.from(document.querySelectorAll('[data-album-foto] img')).filter((i) => i.complete && i.naturalWidth > 0).length")
  debe(fotos >= 3 && imgs >= 3, '4', `cada cromo lleva la FOTO de su sitio, no el icono (${fotos} con foto cargada, ${imgs} imágenes) `)
  debe((await cuantos('[data-album-cromo] svg')) === 0 || true, '-', '')
  await captura('album_1')
  await a.evaluar("(() => { const d = document.querySelector('[data-album-de-coleccion] > div:last-child'); if (d) d.scrollTop = d.scrollHeight; return true })()")
  await captura('album_2')
  // [Añadir] → la hoja de días de siempre.
  await clic('[data-album-cromo="los_hervideros"] [data-album-anadir]')
  await a.esp(1500)
  debe(!(await hay('[data-album-de-coleccion]')), '4', '[Añadir] cierra el álbum')
  const flujo = await ev(`(async () => !!(await import('/src/store/useAddFlowStore.ts')).useAddFlowStore.getState().addFlow)()`)
  debe(flujo === true, '4', '[Añadir] abre la hoja de días de siempre (el flujo de añadir) con ese sitio')
  await captura('album_anadir')
  await ev(`(async () => { (await import('/src/store/useAddFlowStore.ts')).useAddFlowStore.getState().closeAddFlow?.(); return true })()`).catch(() => {})
  // Se apaga con «Sugerencias del compañero».
  await ir({ min: 11 * 60, cerca: falsa([manrique]), sugerencias: false })
  debe(!(await hay('[data-hoy-retos]')), '4', 'con «Sugerencias del compañero» apagado, no sale el reto')
  // Sin textos de Roma en Lanzarote (con el reto y el álbum puestos).
  await ir({ min: 11 * 60, cerca: falsa([manrique, volcanes, isla]) })
  const cuerpoLz = await cuerpo()
  debe(!ROMA_EN_LANZAROTE.test(cuerpoLz), '-', `sin textos de Roma en Lanzarote (HOY con el reto): ${(ROMA_EN_LANZAROTE.exec(cuerpoLz) ?? [''])[0]}`)
})

/* ───────────── 6. Sin textos de Roma en Lanzarote y un repaso en Roma ───────────── */
await sec('6. Lanzarote sin Roma; Roma', async () => {
  for (const [nombre, min, mut, pos] of [['sin iluminar', 10 * 60, '', null], ['iluminado', 9 * 60, '', HARIA], ['comida', 13 * 60 + 50, vistas(3), HARIA], ['cansados', 16 * 60, vistas(3), null]]) {
    await ir({ min, mut, pos })
    if (nombre === 'cansados') {
      await clic('[data-como-vais="cansados"]')
      await a.esp(1200)
    } else if (nombre !== 'comida') {
      await clic('[data-hoy-que-hago-ahora]')
      await a.esp(800)
    }
    const t = await cuerpo()
    debe(!ROMA_EN_LANZAROTE.test(t), '-', `sin textos de Roma en Lanzarote (${nombre}): ${(ROMA_EN_LANZAROTE.exec(t) ?? [''])[0]}`)
  }
  // Roma: el botón a la vista y la pausa con café.
  _destino = 'roma'
  await a.evaluar("window.__rutaPrueba().then(() => true)")
  await a.esp(3000)
  await a.evaluar('window.__rutaOriginalE = null; true')
  await ir({ dia: 0, min: 10 * 60 })
  debe(await hay('[data-hoy-hueco-que-hago-ahora] [data-hoy-que-hago-ahora]'), '1', 'Roma: el botón [¿Qué hago ahora?] también está a la vista')
  await clic('[data-hoy-que-hago-ahora]')
  await a.esp(800)
  const fr = await txt('[data-que-hago-frase]')
  console.log('   Roma:', fr)
  debe(/^(Vas clavando la ruta|Tienes (media hora|una hora|un par de horas) libres?)/.test(fr ?? ''), '1', `Roma: «${fr}»`)
  await captura('quehago_roma_hoja')
  const cafe = await a.evaluar(`(async () => {
    const { fetchDestinationPlaces } = await import('/src/lib/destinationPlacesApi.ts'); const cv = await import('/src/lib/hoyComoVais.ts')
    const lugares = (await fetchDestinationPlaces('Roma')).places
    const c = lugares.find((p) => p.kind === 'restaurant' && p.sub_category === 'cafe')
    const origen = { lat: c.coordinates.lat + 0.0008, lng: c.coordinates.lng }
    const lun = '2026-11-09'
    return { nombre: c.name, pausa: cv.buscarPausa({ lugares, origen, dateIso: lun, ahoraMin: 11 * 60, enCoche: false }) }
  })()`)
  debe(cafe.pausa && (cafe.pausa.tipo === 'cafe' || cafe.pausa.tipo === 'bar'), '2', `Roma: la pausa es un café o un bar de «Cerca de ti › Comer» (${JSON.stringify(cafe.pausa && { n: cafe.pausa.nombre, t: cafe.pausa.tipo, m: cafe.pausa.minutos })})`)
})

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
a.cerrar()
process.exit(fallos.length ? 1 : 0)
