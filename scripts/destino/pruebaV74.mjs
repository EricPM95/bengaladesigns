// La prueba de la TANDA V74, apartado 2 (el motor). Todo por script, sin navegador ni API (salvo lo que dice la V68, que se pasa aparte: pruebaV68.mjs).
//   node scripts/destino/pruebaV74.mjs
// 1. Los minutos de Lanzarote (41): El Golfo sin «hasta el atardecer» y con sus 45; Papagayo 180; Salinas de Janubio 30; Montaña Bermeja 20.
// 2. Los «de camino» (V68_V71-17): Fuente de las Tortugas y Elefantino (Roma) y Mirador de los Helechos (Lanzarote) llevan `passThrough` en los datos.
// 3. Una visita que acabaría después del cierre (42), en el motor de coche: con más de la mitad de su tiempo, se acorta hasta el cierre; con la mitad o menos, sale del día a «Lugares pendientes» (`spare_stops`).
// 4. El sitio que sale por el tiempo va DE VERDAD a «Lugares pendientes» y [Deshacer] lo devuelve (V68_V71-12): `opParadas` de hoyLluvia vía `proponerSiLlueveRoma` y `aplicarOps`.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { cocheDataFor } from '../../server/engine/cocheData.js'
import { planCocheDia } from '../../shared/routeEngine/cocheTrip.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))

/* ───────────── 1. Los minutos de Lanzarote (41) ───────────── */
console.log('1. Lanzarote: los minutos (El Golfo, Papagayo, Salinas de Janubio, Montaña Bermeja)')
const lz = leer('data/pipeline_v2/lanzarote.json')
const lugar = (id) => lz.places.find((p) => p.id === id)
debe(lugar('el_golfo_y_el_charco_de_los_clicos').duration_minutes === 45, 'minutos', 'El Golfo: su tiempo normal de visita (45)')
debe(lugar('playas_de_papagayo').duration_minutes === 180 && lugar('playas_de_papagayo').min_max === 480, 'minutos', 'Playas de Papagayo: 180 (su máximo sigue en 480)')
debe(lugar('salinas_de_janubio').duration_minutes === 30, 'minutos', 'Salinas de Janubio: 30')
debe(lugar('playa_de_montana_bermeja').duration_minutes === 20, 'minutos', 'Playa de Montaña Bermeja: 20')
const listasLz = leer('data/dias/lanzarote/listas.json')
const filasD1 = Object.values(listasLz.dias.D1.partes.unica).flat().filter((x) => x && x.tipo === 'parada')
const fila = (n) => filasD1.find((x) => x.lugar === n)
debe(fila('El Golfo y el Charco de los Clicos') && !fila('El Golfo y el Charco de los Clicos').hasta_atardecer, 'minutos', 'El Golfo: la fila del día 1 ya no dice «hasta el atardecer»')
debe(fila('Salinas de Janubio')?.min === 30 && fila('Playa de Montaña Bermeja')?.min === 20, 'minutos', 'Salinas 30 y Bermeja 20 también en la fila del día escrito')

/* ───────────── 2. Los «de camino» (V68_V71-17) ───────────── */
console.log('2. Los «de camino» llevan passThrough en los datos')
const roma = leer('data/pipeline_v2/roma.json')
for (const id of ['fuente_de_las_tortugas', 'elefantino_de_bernini']) debe(roma.places.find((p) => p.id === id)?.passThrough === true, 'de-camino', `Roma: ${id} lleva passThrough`)
debe(lugar('mirador_de_los_helechos').passThrough === true, 'de-camino', 'Lanzarote: el Mirador de los Helechos (de camino hacia Teguise) lleva passThrough')

/* ───────────── 3. Cierre en el motor de coche (42) ───────────── */
console.log('3. Una visita que acabaría después del cierre (motor de coche)')
// (Una copia de los datos y sin el opcional de la tarde: si no, lo primero que sale del día es la playa opcional y todo lo demás se corre.)
const datos = structuredClone(cocheDataFor('lanzarote'))
for (const x of datos.listas.dias.D1.partes.unica.tarde) delete x.opcional
const plan = (cierraHervideros) => {
  const destData = JSON.parse(JSON.stringify(lz))
  const p = destData.places.find((x) => x.id === 'los_hervideros')
  p.windows = [`09:00-${cierraHervideros}`]
  return planCocheDia({ destData, datos, dayId: 'D1', dayNumber: 1, contentDays: 5, dateIso: '2027-03-09', zona: 'puerto_del_carmen', pase: true })
}
const base = plan('23:00')
const hervideros = base.stops.find((s) => s.place_name === 'Los Hervideros')
const entra = (hhmm) => Number(hhmm.split(':')[0]) * 60 + Number(hhmm.split(':')[1])
debe(Boolean(hervideros), 'cierre', 'sin cierre cercano, Los Hervideros está en el día 1')
const e = entra(hervideros.suggested_time)
const dur = hervideros.duration_minutes // 30
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
// Cierra cuando le quedan 20 de 30 minutos (más de la mitad): se acorta hasta el cierre y sigue en el día.
const largo = plan(hhmm(e + 20))
const hLargo = largo.stops.find((s) => s.place_name === 'Los Hervideros')
debe(Boolean(hLargo) && hLargo.duration_minutes <= 20 && !(largo.spare_stops ?? []).some((s) => s.place_name === 'Los Hervideros'), 'cierre', `con 20 de ${dur} minutos antes del cierre (más de la mitad) se acorta hasta el cierre y se queda (dura ${hLargo?.duration_minutes})`)
// Cierra cuando le quedan 10 de 30 minutos (menos de la mitad): sale del día y va a «Lugares pendientes».
const corto = plan(hhmm(e + 10))
debe(!corto.stops.some((s) => s.place_name === 'Los Hervideros'), 'cierre', 'con 10 de 30 minutos antes del cierre (menos de la mitad) ya no está en el día')
const sp = (corto.spare_stops ?? []).find((s) => s.place_name === 'Los Hervideros')
debe(Boolean(sp) && sp.suggested_time === '' && /Lugares pendientes/.test(sp.spare_reason ?? ''), 'cierre', `va a «Lugares pendientes» con su motivo (${sp?.spare_reason})`)
// Justo la mitad: «con más de la mitad se acorta», con la mitad o menos va a otro día.
const mitad = plan(hhmm(e + dur / 2))
debe(!mitad.stops.some((s) => s.place_name === 'Los Hervideros') && (mitad.spare_stops ?? []).some((s) => s.place_name === 'Los Hervideros'), 'cierre', 'con justo la mitad ya no se acorta: va a otro día')

/* ───────────── 4. El tiempo: lo que sale de hoy va a «Lugares pendientes» ───────────── */
console.log('4. El plan de lluvia y el viento mandan a «Lugares pendientes» lo que sale (y Deshacer lo devuelve)')
const salida = path.join(os.tmpdir(), 'v74_lluvia.mjs')
await build({
  stdin: {
    contents: `export { proponerSiLlueveRoma, proponerVolverAlPlan } from './src/lib/hoyLluvia.ts'
export { aplicarOps } from './src/lib/hoyCambiarPlan.ts'`,
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
const L = await import(pathToFileURL(salida).href)
const stop = (id, name, time, extra = {}) => ({ id, name, time, durationMinutes: 45, coordinates: { lat: 41.9, lng: 12.49 }, ...extra })
const dia = {
  id: 'd1', dayNumber: 1, city: 'Roma', meals: [],
  stops: [stop('a', 'Coliseo', '09:00'), stop('b', 'Villa Borghese', '11:00'), stop('c', 'Mirador del Pincio', '13:00'), stop('r', 'Galería Borghese', '15:00', { reservedId: 'res1', reservationTime: '15:00' })],
  rainPlan: { text: 'Si llueve, el Pincio sale y entra el Panteón.', remove: ['Villa Borghese', 'Mirador del Pincio'], add: [stop('p', 'Panteón', '13:00')] },
}
const ctx = { fijasDe: (d) => new Set(d.stops.filter((s) => s.reservedId).map((s) => s.id)), datos: { importanciaPorSitio: {}, nivelPorSitio: {} }, enCoche: false, etiquetaDia: () => 'hoy' }
const ruta = { id: 'r', destination: 'Roma', days: [dia], answers: {} }
const props = L.proponerSiLlueveRoma({ day: dia, ctx })
debe(props.length === 1, 'tiempo', 'el plan de lluvia de Roma da una propuesta')
const ops = props[0].ops
const aplicada = L.aplicarOps(ruta, ops, 'adelante').days[0]
const enPend = (aplicada.spareStops ?? []).map((s) => s.name).sort()
debe(enPend.join() === 'Mirador del Pincio,Villa Borghese', 'tiempo', `lo que sale por la lluvia va a Lugares pendientes (${enPend.join(', ')})`)
debe((aplicada.spareStops ?? []).every((s) => /tiempo/i.test(s.spareReason ?? '')), 'tiempo', 'cada uno lleva su motivo («Salió de hoy por el tiempo.»)')
debe(aplicada.stops.some((s) => s.name === 'Galería Borghese') && !(aplicada.spareStops ?? []).some((s) => s.name === 'Galería Borghese'), 'tiempo', 'la reserva no sale nunca ni va a pendientes')
const deshecha = L.aplicarOps({ ...ruta, days: [aplicada] }, ops, 'atras').days[0]
debe((deshecha.spareStops ?? []).length === 0 && deshecha.stops.map((s) => s.id).join() === dia.stops.map((s) => s.id).join(), 'tiempo', '[Deshacer] devuelve el día y vacía pendientes')
// «¿Volvemos al plan?»: lo que entró por la lluvia (el Panteón) se queda para otro día, en pendientes.
const volver = L.proponerVolverAlPlan({ day: aplicada, ctx })
const despuesVolver = L.aplicarOps({ ...ruta, days: [aplicada] }, volver[0].ops, 'adelante').days[0]
debe(!(despuesVolver.spareStops ?? []).some((s) => s.name === 'Villa Borghese') && (despuesVolver.spareStops ?? []).some((s) => s.name === 'Panteón'), 'tiempo', 'al volver al plan, lo de antes sale de pendientes y lo que entró por la lluvia se queda en pendientes')

console.log(`\nPrueba de la V74 (motor): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
