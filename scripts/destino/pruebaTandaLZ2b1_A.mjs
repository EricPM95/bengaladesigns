// LZ2b-1, agente A: las fichas de Lanzarote, los aparcamientos y el motor sin «sin coche».
//   node scripts/destino/pruebaTandaLZ2b1_A.mjs
// Comprueba: los 34 sitios con por_que_recomendamos, description, what_to_see, tips y aparcar; ninguno con aparcar_verificar true sin explicar (si lo hay, tiene que estar en la tabla
// de docs/dias/_lz2b1_tabla_aparcamientos.json con su motivo); las 12 historias sin líneas «Comprobar»; ninguna parada repetida con el mismo nombre en un día; Timanfaya a las 9:00;
// sin sin_coche; «Coche de alquiler» y «Mi coche» con la misma ruta y los mismos trayectos; el tramo a pie entre filas del mismo aparcamiento.
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const D = findPipelineV2Data('Lanzarote')
let ok = 0
const fallos = []
const eq = (cond, msg) => { if (cond) ok++; else fallos.push(msg) }
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// ── 1. Fichas ──
const detalleDir = 'data/pipeline_v2/detalle/lanzarote/'
const detalle = new Map()
for (const f of fs.readdirSync(detalleDir).filter((x) => x.endsWith('.json'))) for (const p of leer(detalleDir + f).places) detalle.set(p.name, p)
const tabla = fs.existsSync('docs/dias/_lz2b1_tabla_aparcamientos.json') ? leer('docs/dias/_lz2b1_tabla_aparcamientos.json') : { sitios: [] }
const explicados = new Set((tabla.sitios ?? []).map((x) => x.id))
eq(D.places.length === 34, `Lanzarote tiene ${D.places.length} sitios, no 34`)
for (const p of D.places) {
  const d = detalle.get(p.name)
  eq(typeof p.por_que_recomendamos === 'string' && p.por_que_recomendamos.length > 20, `${p.id}: sin por_que_recomendamos`)
  eq(typeof p.description === 'string' && p.description.length > 20, `${p.id}: sin description`)
  eq(typeof p.aparcar === 'string' && p.aparcar.length > 5, `${p.id}: sin aparcar en lanzarote.json`)
  eq(Boolean(d), `${p.id}: sin ficha en detalle/lanzarote`)
  if (!d) continue
  eq(Array.isArray(d.what_to_see) && d.what_to_see.length >= 2, `${p.id}: what_to_see vacío`)
  eq(Array.isArray(d.tips) && d.tips.length >= 1, `${p.id}: tips vacío`)
  eq(d.aparcar === p.aparcar && d.aparcar_verificar === p.aparcar_verificar, `${p.id}: aparcar de la ficha y del catálogo no coinciden`)
  eq(p.aparcar_verificar !== true || explicados.has(p.id), `${p.id}: aparcar_verificar true sin explicar en la tabla`)
  eq(!/\b(Roma|Pompeya|Florencia)\b/.test(`${p.por_que_recomendamos} ${p.description} ${(d.what_to_see ?? []).join(' ')} ${(d.tips ?? []).join(' ')} ${p.aparcar}`), `${p.id}: ficha con texto de Roma`)
}
// ── 2. Historias ──
const HISTORIAS = ['Montañas del Fuego (Timanfaya)', 'Jameos del Agua', 'Cueva de los Verdes', 'Mirador del Río', 'Fundación César Manrique', 'Jardín de Cactus', 'La Geria y sus bodegas',
  'El Golfo y el Charco de los Clicos', 'Teguise (villa)', 'Haría y la Casa-Museo César Manrique', 'Casa-Museo del Campesino', 'La Graciosa']
for (const n of HISTORIAS) {
  const h = detalle.get(n)?.historia
  eq(typeof h === 'string' && h.split(/\s+/).length > 300, `historia de ${n}: falta o es corta`)
  eq(typeof h === 'string' && !/Comprobar|^>|Dudas que quedan/m.test(h), `historia de ${n}: lleva líneas «Comprobar» o dudas`)
}
eq([...detalle.values()].filter((p) => p.historia).length === 12, 'tiene que haber 12 historias en total')
// ── 3. Los días: motor ──
const dias = async (fecha, total, extra = {}) => {
  const out = []
  for (let n = 1; n <= total; n++) out.push(await buildDayBlockV3(D, total + 1, false, n, null, fecha, [], ['imprescindibles'], { city: 'Lanzarote', scheduler: 'v3', ...extra }))
  return out
}
const ruta = (d) => JSON.stringify({ s: (d.stops ?? []).map((s) => [s.name, s.suggested_time, s.trayecto_previo?.texto ?? null]), c: d.coche?.coche_min, v: d.coche?.vuelta?.minutos })
for (const fecha of ['2026-11-08', '2026-11-14', '2027-07-10']) {
  for (const zona of ['costa_teguise', 'el_norte', 'playa_blanca']) {
    const a = await dias(fecha, 5, { zona, pase: true, coche: 'alquiler' })
    const b = await dias(fecha, 5, { zona, pase: true, coche: 'propio' })
    const c = await dias(fecha, 5, { zona, pase: true, coche: 'no' })
    a.forEach((d, i) => {
      const et = `${fecha}/${zona}/día${i + 1}`
      eq(ruta(d) === ruta(b[i]), `${et}: «Coche de alquiler» y «Mi coche» dan rutas distintas`)
      eq(ruta(d) === ruta(c[i]), `${et}: coche:'no' ya no cambia la ruta`)
      eq(d.sin_coche === null || d.sin_coche === undefined, `${et}: ${d.dia_id} aún lleva sin_coche`)
      eq(d.coche?.activo !== false, `${et}: ${d.dia_id} con coche desactivado`)
      const nombres = (d.stops ?? []).map((s) => s.name)
      eq(new Set(nombres).size === nombres.length, `${et}: ${d.dia_id} tiene paradas con el mismo nombre (${nombres.join(' | ')})`)
    })
    eq(a[0].stops[0].name.startsWith('Montañas del Fuego') && a[0].stops[0].suggested_time === '09:00', `${fecha}/${zona}: Timanfaya no es a las 09:00 (${a[0].stops[0].name} ${a[0].stops[0].suggested_time})`)
  }
}
// El rato de recoger el coche el día 1: alquiler 45, mi coche 20 (la ruta es la misma; solo cambia la hora de salir)
{
  const ll = { hora: '11:00', medio: 'avion' }
  const [al] = await dias('2026-11-08', 2, { zona: 'costa_teguise', pase: true, coche: 'alquiler', llegada: ll })
  const [pr] = await dias('2026-11-08', 2, { zona: 'costa_teguise', pase: true, coche: 'propio', llegada: ll })
  eq(al.llegada_aeropuerto?.recoger_coche_min === 45 && pr.llegada_aeropuerto?.recoger_coche_min === 20, 'recoger el coche: alquiler 45 min, mi coche 20 min')
}
// Haría y su Casa-Museo: a pie, sin coche; Playa Blanca y el Faro: cada uno con su nombre (el Faro, en coche desde su aparcamiento)
{
  const [, d2] = await dias('2026-11-08', 3, { zona: 'costa_teguise', pase: true, coche: 'alquiler', experiencesPositive: ['arte'] }).then((x) => x)
  const i = (d2.stops ?? []).findIndex((s) => /Casa-Museo César Manrique/.test(s.name))
  if (i > 0) eq(d2.stops[i].trayecto_previo?.modo === 'walk' && /^A pie · \d+ min$/.test(d2.stops[i].trayecto_previo.texto) && d2.stops[i - 1].name !== d2.stops[i].name, 'Haría → Casa-Museo: «A pie · N min» y nombres distintos')
  else eq(false, 'el D2 con arte no lleva la Casa-Museo César Manrique')
}
// ── 4. Aparcamientos: la tabla y los textos ──
for (const x of tabla.sitios ?? []) {
  const p = D.places.find((q) => q.id === x.id)
  if (x.nota) continue // solo parada de coche (puerto, aeropuerto)
  eq(Boolean(p), `tabla: ${x.id} no es un sitio`)
  if (p && x.texto_nuevo) eq(p.aparcar === x.texto_nuevo, `tabla: ${x.id}: el texto nuevo no es el del catálogo`)
}
for (const p of D.places) eq(!/\b(zona nudista)\b/i.test(p.aparcar ?? ''), `${p.id}: aparcar con texto que no es de aparcar`)
void norm

console.log(`pruebaTandaLZ2b1_A: ${ok} comprobaciones bien, ${fallos.length} fallos`)
for (const f of fallos.slice(0, 40)) console.log(`  FALLO: ${f}`)
if (fallos.length) process.exit(1)
