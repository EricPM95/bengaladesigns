// La prueba de la Tanda LL, parte 1 (Lanzarote): el día de llegada (filas A a F), el de vuelta, el reparto y las cenas por día de la semana.
//   node scripts/destino/pruebaTandaLL_LZ.mjs
import fs from 'node:fs'
import { buildCocheDay, diasCoche } from '../../server/engine/cocheDay.js'

let comprobaciones = 0
let fallos = 0
const debe = (cond, texto) => { comprobaciones++; if (!cond) { fallos++; if (fallos <= 60) console.log(`✗ ${texto}`) } }
const hm = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m }
const destData = JSON.parse(fs.readFileSync('data/pipeline_v2/lanzarote.json', 'utf8'))
const rest = JSON.parse(fs.readFileSync('data/dias/lanzarote/_restaurantes.json', 'utf8'))
const placeById = new Map(destData.places.map((p) => [p.id, p]))
const ZONAS = ['puerto_del_carmen', 'playa_blanca', 'costa_teguise', 'arrecife', 'el_norte', 'el_interior']
const GRANDES = new Set(['montanas_del_fuego', 'jameos_del_agua', 'cueva_de_los_verdes', 'mirador_del_rio', 'la_geria_y_sus_bodegas', 'el_golfo_y_el_charco_de_los_clicos'])
const manual = (n) => ({ day_number: n, title: 'manual', stops: [] })
const dia = (totalDays, n, inicio, options) => buildCocheDay(destData, 'lanzarote', { totalDays, dayNumber: n, dateRangeStartIso: inicio, experiencesPositive: [], options, buildManualDay: manual })
const opt = (zona, llegada, vuelo, extra = {}) => ({ pase: true, zona, coche: 'alquiler', llegada: { hora: llegada, medio: 'avion' }, vuelta: { hora: vuelo, modo: 'flight' }, ...extra })
const semanaDe = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay()
const abiertoEseDia = (nombre, semana) => {
  const todos = [...Object.values(rest.comidas).flat(), ...Object.values(rest.cenas_por_zona).flat()].filter((x) => x.nombre === nombre)
  return todos.length > 0 && todos.every((x) => !(x.cierra_dias ?? []).includes(semana) && !x.dias_sin_confirmar)
}

// ── 1. La hora útil y las filas ──
{
  const d = dia(6, 1, '2026-11-08', opt('costa_teguise', '08:25', '19:40'))
  debe(d?.dia_id === 'LL' && d.llegada_ll?.hora_util === '11:25' && d.llegada_ll.fila === 'B', `Eric: aterriza 08:25, Costa Teguise, alquiler → hora útil 11:25, fila B (sale ${d?.llegada_ll?.hora_util} ${d?.llegada_ll?.fila})`)
  const propio = dia(6, 1, '2026-11-08', opt('costa_teguise', '08:25', '19:40', { coche: 'propio' }))
  debe(propio?.llegada_ll?.hora_util === '10:25', `con coche propio, 1 h menos (${propio?.llegada_ll?.hora_util})`)
  const sinZona = dia(6, 1, '2026-11-08', opt(null, '10:00', '19:40'))
  debe(sinZona?.llegada_ll?.zona === 'playa_blanca', `sin zona se cuenta la más lejana del aeropuerto (${sinZona?.llegada_ll?.zona})`)
  const sinPase = dia(6, 1, '2026-11-08', { ...opt('costa_teguise', '08:25', '19:40'), pase: false })
  debe(sinPase?.dia_id === 'D1' && !sinPase.llegada_ll, 'sin pase el día 1 es el D1 de siempre (la adaptación a los vuelos es del pase)')
}

// ── 2. Filas A a F desde las 6 zonas, en noviembre y en julio ──
const HORAS = ['06:30', '08:25', '10:00', '12:00', '14:30', '17:00', '19:00', '23:00']
const filasVistas = new Set()
for (const [mes, inicio] of [['noviembre', '2026-11-10'], ['julio', '2026-07-14']]) {
  for (const z of ZONAS) {
    for (const h of HORAS) {
      const o = opt(z, h, '19:40')
      const d = dia(6, 1, inicio, o)
      const etq = `${mes} · ${z} · llegada ${h}`
      if (!d) { debe(false, `${etq}: no hay día de llegada`); continue }
      const fila = d.llegada_ll?.fila
      filasVistas.add(fila)
      debe(d.dia_id === 'LL' && 'ABCDEF'.includes(fila ?? 'x'), `${etq}: el día 1 es LL con fila (${d.dia_id} ${fila})`)
      const util = hm(d.llegada_ll.hora_util)
      debe(d.stops.length === 0 || hm(d.coche.ida.salir) >= util, `${etq}: no sale de la zona antes de la hora útil (${d.coche?.ida?.salir} < ${d.llegada_ll.hora_util})`)
      if ('ABCD'.includes(fila)) debe(d.stops.length > 0, `${etq}: fila ${fila} con tiempo y el día de llegada sale vacío`)
      if (fila === 'E') debe(d.meals.some((m) => m.time === 'dinner'), `${etq}: fila E sin cena`)
      if (fila === 'F') debe(d.stops.length === 0 && !d.meals.some((m) => m.time === 'dinner'), `${etq}: fila F debería ir sin ruta y sin cena`)
      for (const s of d.stops) {
        debe(!GRANDES.has(s.site_id), `${etq}: un imprescindible grande (${s.name}) el día de llegada`)
        const p = placeById.get(s.site_id)
        if (p?.last_entry) debe(hm(s.suggested_time) <= hm(p.last_entry), `${etq}: ${s.name} a las ${s.suggested_time}, después de su última entrada (${p.last_entry})`)
        if (p?.windows?.length) { const cierra = Math.max(...p.windows.map((w) => hm(w.split('-')[1]))); debe(hm(s.suggested_time) < cierra, `${etq}: ${s.name} a las ${s.suggested_time}, ya cerrado (${cierra})`) }
      }
      debe((d.coche?.coche_min ?? 0) <= 180, `${etq}: más de 3 h de coche (${d.coche?.coche_min})`)
      for (const m of d.meals) for (const o2 of m.options ?? []) debe(abiertoEseDia(o2.name, semanaDe(d.date_iso)), `${etq}: ${o2.name} cerrado o sin confirmar el ${d.date_iso}`)
      if (d.llegada_ll.absorbe) debe(!diasCoche(destData, 'lanzarote', { totalDays: 6, dateRangeStartIso: inicio, options: o }).includes(d.llegada_ll.absorbe), `${etq}: ${d.llegada_ll.absorbe} se repite después de la llegada`)
    }
  }
}
debe(['A', 'B', 'C', 'D', 'E', 'F'].every((f) => filasVistas.has(f)), `salen las seis filas (${[...filasVistas].sort().join('')})`)

// ── 3. El reparto ──
{
  const ids = (h, inicio = '2026-11-10', total = 6, vuelo = '19:40', zona = 'costa_teguise') => diasCoche(destData, 'lanzarote', { totalDays: total, dateRangeStartIso: inicio, options: opt(zona, h, vuelo) })
  const a = ids('08:25', '2026-11-08')
  debe(a.join() === 'LL,D1,D2,DG,D4', `viaje de Eric: LL, D1, D2, DG, D4 (${a.join()})`)
  const noche = ids('23:00')
  debe(noche[0] === 'LL' && noche[1] === 'D2' && noche[2] === 'D1', `llegada de noche: el día 2 es el norte y el sur pasa al día 3 (${noche.join()})`)
  const tarde = ids('14:30', '2026-11-10', 5, '19:40')
  debe(tarde.join() === 'LL,D1,D2,DG', `5 días, llegada 14:30, vuelo 19:40: LL,D1,D2,DG y el D3 corto va el día de vuelta (${tarde.join()})`)
  const tempr = ids('14:30', '2026-11-10', 5, '15:00')
  debe(tempr.join() === 'LL,D1,D2,D3', `5 días, vuelo a las 15:00: el D3 entero y La Graciosa fuera (${tempr.join()})`)
  for (const h of HORAS) for (const z of ZONAS) { const i = ids(h, '2026-11-10', 7, '19:40', z); debe(i[0] === 'LL' && !i.slice(1).includes('LL'), `LL solo el día 1 (${h} ${z}: ${i.join()})`); debe(i.indexOf('D1') !== 0, 'el D1 nunca el día de llegada') }
  const dos = diasCoche(destData, 'lanzarote', { totalDays: 3, dateRangeStartIso: '2026-11-10', options: opt('costa_teguise', '10:00', '19:40') })
  debe(dos.join() === 'LL,D1', `2 días de ruta: llegada y D1 (${dos.join()})`)
  const uno = diasCoche(destData, 'lanzarote', { totalDays: 2, dateRangeStartIso: '2026-11-10', options: opt('costa_teguise', '10:00', '19:40') })
  debe(uno.join() === 'LL', `1 día de ruta: solo llegada (${uno.join()})`)
}

// ── 4. El viaje de Eric, tal cual (apartado 6.1) ──
{
  const o = opt('costa_teguise', '08:25', '19:40')
  const d = (n) => dia(6, n, '2026-11-08', o)
  const [d1, d2, d3, d4, d5, d6] = [1, 2, 3, 4, 5, 6].map(d)
  debe(d1.dia_id === 'LL', 'domingo: día de llegada')
  debe(d1.stops[0]?.name.startsWith('Teguise') && d1.stops[0].suggested_time === '11:58', `domingo: Teguise y el mercadillo a las 11:58 (${d1.stops[0]?.name} ${d1.stops[0]?.suggested_time})`)
  debe(d1.stops.some((s) => /Fundación/.test(s.name)) && d1.stops.some((s) => /Charco/.test(s.name)), 'domingo: Fundación y Charco de San Ginés')
  debe(d1.meals.find((m) => m.time === 'dinner')?.options.every((x) => x.name !== 'SeBE'), 'domingo: la cena no es SeBE (cierra el domingo)')
  debe(d2.dia_id === 'D1' && d2.stops[0].name.startsWith('Montañas del Fuego') && d2.stops[0].suggested_time === '09:00', 'lunes: el sur volcánico con Timanfaya a las 09:00')
  debe(d3.dia_id === 'D2', 'martes: el norte')
  debe(d4.dia_id === 'DG', 'miércoles: La Graciosa')
  debe(d4.meals.some((m) => m.time === 'lunch' && m.restaurant === 'El Veril'), `miércoles: comida en El Veril, Casa Enriqueta cierra (${d4.meals.find((m) => m.time === 'lunch')?.restaurant})`)
  debe(d4.meals.find((m) => m.time === 'dinner')?.options.every((x) => x.name !== 'SeBE' && x.name !== 'La Bohemia'), 'miércoles: la cena no es SeBE (solo comidas) ni La Bohemia (cierra)')
  debe(d5.dia_id === 'D4', 'jueves: Papagayo')
  debe(hm(d5.stops[0].suggested_time) === 600 && hm(d5.coche.ida.salir) >= hm('08:30'), `jueves: en invierno llega a Papagayo hacia las 10:00 y no sale a las 7:47 (sale ${d5.coche.ida.salir}, llega ${d5.stops[0].suggested_time})`)
  debe(d6.dia_id === 'V' && d6.return_day?.limite_t1 === '17:10', `viernes: el coche en la T1 antes de las 17:10 (${d6.return_day?.limite_t1})`)
  debe(hm(d6.coche.vuelta.llegas) <= hm('17:10'), `viernes: llega a la T1 a las ${d6.coche.vuelta.llegas}, antes de las 17:10`)
  debe(d6.stops.length >= 3, `viernes: la mañana cerca con paradas (${d6.stops.length})`)
  debe(!d6.stops.some((s) => GRANDES.has(s.site_id)), 'viernes: sin imprescindibles grandes')
  const laGeria = d2.stops.find((s) => /La Geria/.test(s.name))
  const com = d2.meals.find((m) => m.time === 'lunch')
  debe(hm(com.suggested_time) - (hm(laGeria.suggested_time) + laGeria.duration_minutes) <= 45, `lunes: la comida no deja un hueco de más de 30 min tras La Geria (${com.suggested_time})`)
  debe(hm(com.suggested_time) >= 12 * 60 + 30, 'lunes: la comida no antes de las 12:30')
}

// ── 5. El día de vuelta ──
for (const z of ZONAS) {
  for (const v of ['08:30', '10:00', '12:00', '15:00', '17:30', '20:00', '22:30']) {
    const o = opt(z, '10:00', v)
    const d = dia(6, 6, '2026-11-10', o)
    const etq = `vuelta · ${z} · vuelo ${v}`
    if (!d) { debe(false, `${etq}: no hay día de vuelta`); continue }
    debe(d.dia_id === 'V' && d.is_return_leg === true && d.return_day, `${etq}: es el día de vuelta con su tarjeta`)
    debe(d.stops.length === 0 || hm(d.coche.vuelta.llegas) <= hm(d.return_day.limite_t1), `${etq}: llega a la T1 a las ${d.coche.vuelta.llegas}, después de su límite ${d.return_day.limite_t1}`)
    for (const s of d.stops) debe(!GRANDES.has(s.site_id), `${etq}: un imprescindible grande (${s.name})`)
    debe(!d.meals.some((m) => m.time === 'dinner'), `${etq}: el día de vuelta no lleva cena`)
    if (hm(v) < hm('14:00')) debe(d.stops.length === 0 && d.return_day.tarjeta, `${etq}: vuelo temprano, solo el traslado con su tarjeta`)
    if (hm(v) >= hm('15:00')) debe(d.stops.length > 0, `${etq}: con tiempo, la mañana no sale vacía`)
    for (const m of d.meals) for (const o2 of m.options ?? []) debe(abiertoEseDia(o2.name, semanaDe(d.date_iso)), `${etq}: ${o2.name} cerrado ese día`)
  }
}
debe(dia(6, 6, '2026-11-10', { pase: true, zona: 'costa_teguise', llegada: { hora: '10:00', medio: 'avion' } }) === null, 'sin la hora del vuelo no hay día de vuelta del motor')
debe(dia(6, 6, '2026-11-10', { ...opt('costa_teguise', '10:00', '19:40'), pase: false }) === null, 'sin pase no hay día de vuelta del motor')

// ── 6. Las cenas y comidas según el día de la semana (7 inicios × 4 días × 6 zonas) ──
for (const z of ZONAS) {
  for (let n = 2; n <= 5; n++) {
    for (const inicio of ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14']) {
      const d = dia(6, n, inicio, opt(z, '14:30', '19:40'))
      if (!d) continue
      for (const m of d.meals) for (const o2 of m.options ?? []) debe(abiertoEseDia(o2.name, semanaDe(d.date_iso)), `${z} · ${inicio} · día ${n}: ${o2.name} (${m.time}) cerrado el ${d.date_iso}`)
    }
  }
}
{ const d = dia(6, 1, '2026-11-08', opt('costa_teguise', '14:30', '19:40')); debe(!d.meals.some((m) => (m.options ?? []).some((x) => x.name === 'SeBE')), 'domingo: SeBE no aparece') }

console.log(`${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
