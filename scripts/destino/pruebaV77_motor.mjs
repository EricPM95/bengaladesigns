// La prueba de la TANDA V77 (agente del motor): publicar los destinos, el atardecer de El Golfo, el Free Tour a sus horas reales, la visita que acaba tras el cierre y «Lugares pendientes» como única lista.
//   node scripts/destino/pruebaV77_motor.mjs        (sin navegador; no hace falta la API para nada de esto)
// 1. Lanzarote ya no está oculto: por defecto `DESTINOS_OCULTOS` vacío y la lista de destinos trae Roma y Lanzarote sin ser administrador (en un proceso aparte, con el entorno limpio).
// 2. (20) «Atardecer en El Golfo»: parada propia al final del día 1 de Lanzarote, a la hora de la puesta de sol de ese día (verano e invierno).
// 3. (17) Free Tour: reservado va a SU hora (10, 12, 15, 17, 19, 21) y en su franja; sin reserva el motor lo pone solo a sus horas reales; en la app (Reorganizar) nunca a una hora que no existe (16:40).
// 4. (18) Visita que acabaría tras el cierre (y no se acorta a más de la mitad): `cambioMinimo` la pasa al mejor día; si no cabe, se queda en pendientes.
// 5. (4) Una sola lista, «Lugares pendientes»: los `spareStops` de un viaje ya creado salen todos, una sola vez y sin perder ninguno; sin «Si te sobra tiempo» en HOY ni dentro de cada día de DÍAS.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { planCocheDia } from '../../shared/routeEngine/cocheTrip.js'
import { cocheDataFor } from '../../server/engine/cocheData.js'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { FREE_TOUR_HORAS } from '../../shared/routeEngine/freeTourHoras.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const toMin = (h) => Number(String(h).split(':')[0]) * 60 + Number(String(h).split(':')[1])
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/* ───────────── 1. Lanzarote ya no está oculto ───────────── */
console.log('1. Lanzarote visible para todos')
{
  const entorno = { ...process.env }
  delete entorno.DESTINOS_OCULTOS
  const sal = execFileSync(process.execPath, ['-e', "import('./server/destinosCurados.js').then((m) => console.log(JSON.stringify([m.DESTINOS_OCULTOS.size, m.leerDestinosCurados('data').map((d) => d.clave).sort()])))"], { env: entorno, cwd: process.cwd(), encoding: 'utf8' })
  const [tam, claves] = JSON.parse(sal.trim().split(/\r?\n/).pop())
  debe(tam === 0, 'visible', 'por defecto no hay ningún destino oculto')
  debe(claves.join() === 'lanzarote,roma', 'visible', `la lista de destinos sin administrador trae Lanzarote y Roma (${claves.join()})`)
  const servidor = fs.readFileSync('server/destinosCurados.js', 'utf8')
  debe(!servidor.includes("['lanzarote']"), 'visible', 'el servidor ya no esconde Lanzarote en el código')
  // El mecanismo sigue: con la variable puesta, un destino se esconde.
  const oculto = execFileSync(process.execPath, ['-e', "import('./server/destinosCurados.js').then((m) => console.log(JSON.stringify(m.leerDestinosCurados('data').map((d) => d.clave).sort())))"], { env: { ...entorno, DESTINOS_OCULTOS: 'lanzarote' }, cwd: process.cwd(), encoding: 'utf8' })
  debe(JSON.parse(oculto.trim().split(/\r?\n/).pop()).join() === 'roma', 'visible', 'con DESTINOS_OCULTOS=lanzarote en el entorno, el mecanismo sigue escondiéndolo')
  const scripts = fs.readdirSync('scripts/destino').filter((f) => /^prueba.*\.mjs$/.test(f) && f !== 'pruebaV77_motor.mjs')
  const conTruco = scripts.filter((f) => /DESTINOS_OCULTOS=\\?'-\\?'/.test(fs.readFileSync(path.join('scripts/destino', f), 'utf8')))
  debe(conTruco.length === 0, 'visible', `ninguna prueba pide ya el truco DESTINOS_OCULTOS='-' (${conTruco.join(', ')})`)
}

/* ───────────── 2. El atardecer en El Golfo (20) ───────────── */
console.log('2. «Atardecer en El Golfo», parada propia al final del día 1')
const lz = leer('data/pipeline_v2/lanzarote.json')
{
  const datos = cocheDataFor('lanzarote')
  for (const [fecha, zona] of [['2027-01-12', 'puerto_del_carmen'], ['2027-03-09', 'costa_teguise'], ['2027-07-13', 'playa_blanca'], ['2026-11-10', 'arrecife'], ['2027-10-05', 'el_norte']]) {
    const p = planCocheDia({ destData: lz, datos, dayId: 'D1', dayNumber: 1, contentDays: 5, dateIso: fecha, zona, pase: true })
    const ultima = p.stops.at(-1)
    debe(ultima?.name === 'Atardecer en El Golfo', 'atardecer', `${fecha} (${zona}): la última parada del día es «Atardecer en El Golfo» (${ultima?.name})`)
    const sol = p.sunset_min
    const entra = toMin(ultima.suggested_time)
    // «A la hora de la puesta de sol»: llega un cuarto de hora antes (cuando más bonito está) y se queda hasta que se pone.
    debe(Number.isFinite(sol) && entra >= sol - 20 && entra <= sol, 'atardecer', `${fecha}: empieza a la hora de la puesta de sol (sale ${ultima.suggested_time}, el sol se pone a las ${hhmm(sol)})`)
    debe(entra + ultima.duration_minutes >= sol + 5, 'atardecer', `${fecha}: dura hasta después de que se ponga el sol`)
    const golfo = p.stops.filter((s) => s.place_name === 'El Golfo y el Charco de los Clicos')
    debe(golfo.length === 2 && golfo[0].name !== golfo[1].name, 'atardecer', `${fecha}: El Golfo sale dos veces con nombres distintos (la visita y el atardecer)`)
    debe(!(p.spare_stops ?? []).length, 'atardecer', `${fecha}: no deja nada fuera del día por el atardecer`)
    debe(p.stops.every((s, i) => i === 0 || toMin(s.suggested_time) >= toMin(p.stops[i - 1].suggested_time)), 'atardecer', `${fecha}: las horas van en orden`)
  }
  const listas = leer('data/dias/lanzarote/listas.json')
  const filas = Object.values(listas.dias.D1.partes.unica).flat().filter((x) => x && x.tipo === 'parada' && x.lugar === 'El Golfo y el Charco de los Clicos')
  debe(filas.length === 2 && filas[1].titulo === 'Atardecer en El Golfo' && filas[1].hasta_atardecer === true, 'atardecer', 'en los datos del día D1 hay una fila propia «Atardecer en El Golfo» tras la de El Golfo')
  debe(!filas[0].hasta_atardecer, 'atardecer', 'la fila de El Golfo de siempre no cambia (sin «hasta el atardecer»)')
}

/* ───────────── 3. El Free Tour a sus horas reales (17) ───────────── */
console.log('3. El Free Tour: reservado, a SU hora y en su franja; sin reserva, solo a horas reales')
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const nombreTour = D.default_free_tour.name
const base = { destData: D, written, poolNames: [], experiencesPositive: [], travel }
const HORAS_REALES = FREE_TOUR_HORAS.map((x) => x.hora)
debe(HORAS_REALES.join() === '10:00,12:00,15:00,17:00,19:00,21:00', 'freetour', 'las horas reales son 10, 12, 15, 17, 19 y 21')
const diaDelTour = (plan) => (plan?.days ?? []).find((d) => (d.escritoRows ?? []).some((r) => r.tipo === 'tour' && !r.llegada))
const filaTour = (d) => d.escritoRows.find((r) => r.tipo === 'tour' && !r.llegada)
const FORMAS = [{ dias: 3, cuatro: null }, { dias: 5, cuatro: 'roma' }, { dias: 7, cuatro: 'roma' }]
for (const inicio of ['2027-03-02', '2027-03-06', '2027-06-05', '2027-10-12']) {
  for (const forma of FORMAS) {
    for (const hora of HORAS_REALES) {
      const plan = planListasTrip({ ...base, hasFreeTour: true, totalDays: forma.dias, dateRangeStartIso: inicio, diaCuatro: forma.cuatro, entradas: { [nombreTour]: hora } })
      const d = diaDelTour(plan)
      const et = `${inicio} · ${forma.dias} d · tour reservado a las ${hora}`
      if (!d) { debe(false, 'freetour', `${et}: ningún día lleva el Free Tour`); continue }
      const filas = d.escritoRows
      const t = filaTour(d)
      debe(t.hora === hora, 'freetour', `${et}: el tour sale a su hora (${t.hora})`)
      const iT = filas.indexOf(t)
      const antes = filas.slice(0, iT).filter((r) => r.tipo !== 'traslado' && !(r.tipo === 'tour' && r.llegada))
      const iComida = filas.findIndex((r) => r.tipo === 'comida')
      if (hora === '10:00') debe(antes.every((r) => r.tipo === 'desayuno'), 'freetour', `${et}: primero de la mañana, solo un desayuno antes (${antes.map((r) => r.tipo + ':' + (r.lugar ?? '')).join(' | ')})`)
      if (hora === '12:00') debe(iComida > iT, 'freetour', `${et}: a las 12:00 el tour va antes de comer`)
      if (hora === '15:00') debe(iComida >= 0 && iComida < iT && toMin(t.hora) >= 15 * 60, 'freetour', `${et}: a las 15:00 va después de comer, primera hora de la tarde`)
      if (hora === '17:00') debe(toMin(t.hora) === 17 * 60 && (iComida < 0 || iComida < iT), 'freetour', `${et}: a las 17:00, media tarde`)
      if (hora === '19:00' || hora === '21:00') debe(toMin(t.hora) >= 19 * 60 && filas.slice(iT).some((r) => r.tipo === 'cena') || filas.slice(0, iT).some((r) => r.tipo === 'cena'), 'freetour', `${et}: tarde-noche, con su cena`)
      // Nada se pierde: lo que lleva el día con el tour sigue en el viaje (los mismos sitios con y sin la reserva a las 10:00).
      if (hora === '10:00') {
        const sinReserva = planListasTrip({ ...base, hasFreeTour: true, totalDays: forma.dias, dateRangeStartIso: inicio, diaCuatro: forma.cuatro })
        const lugares = (p) => new Set((p.days ?? []).flatMap((x) => [...(x.escritoRows ?? []).map((r) => r.lugar), ...((x.spare ?? x.spareStops ?? []).map((s) => s.lugar ?? s.name))]).filter(Boolean))
        debe([...lugares(sinReserva)].every((l) => lugares(plan).has(l)), 'freetour', `${et}: pasar lo de antes detrás del tour no quita ningún sitio del viaje`)
      }
    }
    // Sin reserva (hasFreeTour, sin hora): solo a las horas reales.
    const sin = planListasTrip({ ...base, hasFreeTour: true, totalDays: forma.dias, dateRangeStartIso: inicio, diaCuatro: forma.cuatro })
    const dd = diaDelTour(sin)
    debe(Boolean(dd) && HORAS_REALES.includes(filaTour(dd).hora), 'freetour', `${inicio} · ${forma.dias} d · sin reserva: el tour sale a una hora real (${dd ? filaTour(dd).hora : 'ninguno'})`)
  }
}

/* ───────────── 4 y 5. La app: la visita tras el cierre, el Free Tour al mover y la lista única ───────────── */
console.log('4 y 5. Reorganizar (cambioMinimo) y la lista única «Lugares pendientes»')
const salida = path.join(os.tmpdir(), 'v77_app.mjs')
await build({
  stdin: {
    contents: `export { cambioMinimo, horaRealDelFreeTour, esPorCierre } from './src/lib/reorganizarMinimo.ts'
export { pendientesDelViaje } from './src/lib/hoyPendientes.ts'`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', outfile: salida, logLevel: 'error',
  plugins: [{ name: 'sin-glob', setup(b) { b.onLoad({ filter: /\.(ts|tsx)$/ }, async (a) => { const f = await import('node:fs/promises'); let t = await f.readFile(a.path, 'utf8'); if (!t.includes('import.meta.glob')) return null; t = t.replace(/import\.meta\.glob(<[^>]*>)?\([^)]*\)/g, '({})'); return { contents: t, loader: a.path.endsWith('x') ? 'tsx' : 'ts' } }) } }],
  define: { 'import.meta.env': '{"DEV":false,"MODE":"production"}' },
  banner: { js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);` },
})
const almacen = new Map()
globalThis.localStorage = { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k), clear: () => almacen.clear() }
globalThis.sessionStorage = globalThis.localStorage
globalThis.window = globalThis
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} }
globalThis.addEventListener = () => {}
globalThis.removeEventListener = () => {}
// Sin red: el catálogo y los horarios no se piden a ningún servidor (fetch falla → se sigue sin ellos).
globalThis.fetch = async () => ({ ok: false })
const L = await import(pathToFileURL(salida).href)

debe(L.horaRealDelFreeTour(16 * 60 + 40) === 17 * 60 && L.horaRealDelFreeTour(10 * 60) === 10 * 60 && L.horaRealDelFreeTour(10 * 60 + 1) === 12 * 60 && L.horaRealDelFreeTour(21 * 60 + 1) === null, 'freetour-app', 'horaRealDelFreeTour: 16:40 → 17:00, 10:00 se queda, 10:01 → 12:00 y después de las 21:00 ya no hay')

const parada = (id, name, time, durationMinutes = 45, extra = {}) => ({ id, name, time, durationMinutes, coordinates: { lat: 29.0 + (id.charCodeAt(0) % 7) * 0.002, lng: -13.6 }, ...extra })
const dia = (n, stops, extra = {}) => ({ id: `d${n}`, dayNumber: n, city: 'Lanzarote', stops, meals: [], ...extra })
const ruta = (days) => ({ id: 'r', destination: 'Lanzarote', days, answers: { dateRange: { start: '2027-03-07', end: '2027-03-10' }, month: 3 } })
const opciones = { hayLlegada: false, hayVuelta: false, enCoche: true, hoy: '2020-01-01' }
const porCierre = (stop) => ({ ...stop, time: '', spareReason: 'No cabe hoy: acabaría después de que cierre. Lo tienes en Lugares pendientes para otro día.' })
{
  // (18) El día 1 pierde «Los Hervideros» por el cierre; el día 2 va holgado: se pasa al día 2, al final, y sale de pendientes.
  const hervideros = parada('h1', 'Los Hervideros', '15:30', 30)
  const d1 = dia(1, [parada('a1', 'Timanfaya', '09:00', 90), parada('a2', 'La Geria', '11:00', 60), hervideros])
  const d2 = dia(2, [parada('b1', 'Jameos del Agua', '09:30', 90), parada('b2', 'Cueva de los Verdes', '11:30', 60)])
  const d3 = dia(3, [parada('c1', 'Playa Blanca', '10:00', 90)])
  const r = ruta([d1, d2, d3])
  const propuesto = { dayId: 'd1', dayNumber: 1, next: { ...d1, stops: d1.stops.filter((s) => s.id !== 'h1'), spareStops: [porCierre(hervideros)] }, movidas: [] }
  const res = await L.cambioMinimo(r, [propuesto], opciones)
  if (process.env.DEPURA) console.log(JSON.stringify(res.map((x) => ({ d: x.dayId, stops: x.next.stops.map((s) => s.name + '@' + s.time), sp: (x.next.spareStops || []).map((s) => s.name) }))))
  const nuevoD1 = res.find((x) => x.dayId === 'd1')?.next
  // El mejor día es el más cercano y menos lleno de los POSTERIORES (aquí el 3, con una sola parada).
  const nuevoD2 = res.filter((x) => x.dayId !== 'd1').map((x) => x.next).find((d) => d.stops.some((s) => s.name === 'Los Hervideros'))
  debe(Boolean(nuevoD2), 'cierre-app', 'la visita que acabaría tras el cierre pasa al mejor día posterior donde quepa')
  debe(!(nuevoD1?.spareStops ?? []).some((s) => s.name === 'Los Hervideros'), 'cierre-app', 'y sale de «Lugares pendientes» del día 1')
  debe(!nuevoD1?.stops.some((s) => s.name === 'Los Hervideros'), 'cierre-app', 'el día 1 no la lleva (acabaría tras el cierre)')
  const hv = nuevoD2?.stops.find((s) => s.name === 'Los Hervideros')
  debe(Boolean(hv) && nuevoD2?.stops.at(-1).id === 'h1' && /^\d\d:\d\d$/.test(hv.time), 'cierre-app', `entra al final de ese día con su hora (${hv?.time})`)
  const todos = res.flatMap((x) => x.next.stops.map((s) => s.name))
  debe(todos.filter((n) => n === 'Los Hervideros').length === 1, 'cierre-app', 'nada se repite')
}
{
  // (18) Si ningún día posterior tiene sitio, se queda en pendientes con su motivo (no desaparece).
  const hervideros = parada('h1', 'Los Hervideros', '15:30', 30)
  const lleno = (n) => dia(n, [parada(`x${n}`, `Sitio ${n}A`, '08:30', 120), parada(`y${n}`, `Sitio ${n}B`, '11:00', 120), parada(`z${n}`, `Sitio ${n}C`, '13:30', 120), parada(`w${n}`, `Sitio ${n}D`, '16:00', 270)])
  const d1 = dia(1, [parada('a1', 'Timanfaya', '09:00', 90), hervideros])
  const r = ruta([d1, lleno(2), lleno(3)])
  const res = await L.cambioMinimo(r, [{ dayId: 'd1', dayNumber: 1, next: { ...d1, stops: d1.stops.filter((s) => s.id !== 'h1'), spareStops: [porCierre(hervideros)] }, movidas: [] }], opciones)
  const nuevoD1 = res.find((x) => x.dayId === 'd1')?.next
  debe((nuevoD1?.spareStops ?? []).some((s) => s.name === 'Los Hervideros' && /No cabe hoy/.test(s.spareReason ?? '')), 'cierre-app', 'si no cabe en ningún día, se queda en «Lugares pendientes» con su motivo')
  debe(!res.some((x) => x.dayId !== 'd1'), 'cierre-app', 'y no se toca ningún otro día')
}
{
  // (18) Una reserva con hora no se manda sola a otro día; lo que ya estaba en pendientes de antes tampoco se mueve.
  const reservada = parada('r1', 'Cueva de los Verdes', '15:30', 60, { reservedId: 'res1', reservationTime: '15:30' })
  const previa = parada('p1', 'Jardín de Cactus', '', 45, { spareReason: 'Para otro momento' })
  const d1 = dia(1, [parada('a1', 'Timanfaya', '09:00', 90), reservada], { spareStops: [previa] })
  const d2 = dia(2, [parada('b1', 'Jameos del Agua', '09:30', 90)])
  const r = ruta([d1, d2])
  const res = await L.cambioMinimo(r, [{ dayId: 'd1', dayNumber: 1, next: { ...d1, stops: [d1.stops[0]], spareStops: [previa, porCierre(reservada)] }, movidas: [] }], opciones)
  const nuevoD1 = res.find((x) => x.dayId === 'd1')?.next
  debe(!res.some((x) => x.dayId === 'd2'), 'cierre-app', 'una reserva con hora no se pasa sola a otro día (se queda en pendientes con su reserva)')
  debe((nuevoD1?.spareStops ?? []).some((s) => s.name === 'Jardín de Cactus') && (nuevoD1?.spareStops ?? []).some((s) => s.name === 'Cueva de los Verdes'), 'cierre-app', 'lo que ya estaba en pendientes se queda y la reserva también')
}
{
  // (17) El Free Tour sin reserva que pasa a otro día va a una hora real (el día 2 acaba a las 15:51: sale por hueco a las 16:40 → 17:00).
  const tour = parada('t1', 'Free Tour por Roma', '10:00', 150, { isFreeTour: true, reservationTime: '10:00' })
  const roma = (n, stops) => ({ id: `d${n}`, dayNumber: n, city: 'Roma', stops, meals: [] })
  const d1 = roma(1, [parada('a1', 'Panteón', '09:00', 45), tour])
  const d2 = roma(2, [parada('b1', 'Foro Romano', '09:00', 120), parada('b2', 'Via Condotti', '14:00', 100)])
  const r = { id: 'r', destination: 'Roma', days: [d1, d2], answers: { dateRange: { start: '2027-03-07', end: '2027-03-08' }, month: 3 } }
  const res = await L.cambioMinimo(r, [{ dayId: 'd1', dayNumber: 1, next: { ...d1, stops: [d1.stops[0]] }, movidas: [] }], { hayLlegada: true, hayVuelta: false, enCoche: false, hoy: '2020-01-01' })
  const nuevoD2 = res.find((x) => x.dayId === 'd2')?.next
  const t = nuevoD2?.stops.find((s) => s.isFreeTour)
  debe(Boolean(t) && HORAS_REALES.includes(t.time), 'freetour-app', `el Free Tour que pasa a otro día sale a una hora real (${t?.time}), no a la que sale por hueco`)
  // ...y, si ya no queda ninguna hora real ese día, no se mete a una hora que no existe: se queda en pendientes.
  const tarde = roma(2, [parada('b1', 'Foro Romano', '09:00', 120), parada('b2', 'Via Condotti', '15:00', 300)])
  const res2 = await L.cambioMinimo({ ...r, days: [d1, tarde] }, [{ dayId: 'd1', dayNumber: 1, next: { ...d1, stops: [d1.stops[0]] }, movidas: [] }], { hayLlegada: true, hayVuelta: false, enCoche: false, hoy: '2020-01-01' })
  const t2 = res2.find((x) => x.dayId === 'd2')?.next.stops.find((s) => s.isFreeTour)
  debe(!t2 || HORAS_REALES.includes(t2.time), 'freetour-app', `con el día 2 lleno por la tarde, el tour no se mete a una hora que no existe (${t2?.time ?? 'se queda en pendientes'})`)
}
{
  // (4) Los viajes ya creados: sus `spareStops` salen todos en «Lugares pendientes», una sola vez y sin perder ninguno (la lista de pendientes ES esa lista: no hay nada que mover ni duplicar).
  const sobra = (id, name) => parada(id, name, '', 45, { spareReason: 'Para otro momento' })
  const d1 = dia(1, [parada('a1', 'Timanfaya', '09:00', 90)], { spareStops: [sobra('s1', 'Jardín de Cactus'), sobra('s2', 'Mirador del Río')] })
  const d2 = dia(2, [parada('b1', 'Jameos del Agua', '09:30', 90)], { spareStops: [sobra('s3', 'Fundación César Manrique')] })
  const d3 = dia(3, [parada('c1', 'Playa Blanca', '10:00', 90)])
  const r = ruta([d1, d2, d3])
  const semana = (d) => ({ 1: 'domingo', 2: 'lunes', 3: 'martes' })[d.dayNumber]
  const una = L.pendientesDelViaje({ route: r, hoy: null, semana })
  const otra = L.pendientesDelViaje({ route: r, hoy: null, semana })
  debe(una.length === 3 && una.map((p) => p.stop.id).sort().join() === 's1,s2,s3', 'lista-unica', 'los 3 «Si te sobra tiempo» de un viaje ya creado salen en pendientes, sin perder ninguno')
  debe(JSON.stringify(una.map((p) => [p.stop.id, p.texto])) === JSON.stringify(otra.map((p) => [p.stop.id, p.texto])), 'lista-unica', 'abrir el viaje otra vez da la misma lista (una sola vez, sin duplicar)')
  debe(una.find((p) => p.stop.id === 's3').texto === 'No cabía el lunes' && una.every((p) => p.origen === 'sobra'), 'lista-unica', 'cada uno con su motivo («No cabía el lunes»)')
  // Durante el viaje (HOY), la misma lista más lo saltado: nada se cuenta dos veces.
  const hoyDia = { ...d2, stops: [{ ...d2.stops[0], saltada: true }] }
  const enViaje = L.pendientesDelViaje({ route: { ...r, days: [d1, hoyDia, d3] }, hoy: hoyDia, semana })
  debe(enViaje.length === 4 && new Set(enViaje.map((p) => p.stop.id)).size === 4, 'lista-unica', 'en HOY: lo saltado + los 3 que no cabían, 4 en total y ninguno repetido')
}
{
  // El código: «Si te sobra tiempo» ya no está en HOY ni dentro de cada día de DÍAS.
  const hoyV2 = fs.readFileSync('src/components/route/hoy/v2/HoyDuranteV2.tsx', 'utf8')
  const panel = fs.readFileSync('src/components/route/dayDetail/DayDetailPanel.tsx', 'utf8')
  debe(!/<SiTeSobraTiempoHoy/.test(hoyV2) && /pendientesDelViaje/.test(hoyV2), 'lista-unica', 'HOY ya no pinta «Si te sobra tiempo» y saca los pendientes de la lista única')
  debe(!/<SpareStopsSection/.test(panel) && !fs.existsSync('src/components/route/dayDetail/SpareStopsSection.tsx'), 'lista-unica', 'dentro de cada día de DÍAS ya no hay «Si te sobra tiempo»')
  const lp = fs.readFileSync('src/components/route/hoy/v2/LugaresPendientes.tsx', 'utf8')
  debe(/Añadir a hoy/.test(lp) && /HojaPasarAOtroDia/.test(lp), 'lista-unica', 'en pendientes se puede [Añadir a hoy] o pasar a otro día')
  const maxS = fs.readFileSync('src/lib/reorganizarMinimo.ts', 'utf8')
  debe(/const MAX_SACADOS = 8\b/.test(maxS), 'sacados', '(15) MAX_SACADOS se queda en 8')
}

console.log(`\nPrueba de la V77 (motor): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos.slice(0, 60)) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
