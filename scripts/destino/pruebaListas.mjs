// La prueba del motor de listas: todos los viajes de 1 a 6 días, las 365 fechas de 2027, con y sin pool, Free Tour y reservas.
//   node scripts/destino/pruebaListas.mjs [paso=N] [dias=1,2,3…] [fallos=ruta.txt] [out=docs/dias/PRUEBA_LISTAS.md]
// (`paso`: una de cada N fechas, para mirar rápido; sin él, las 365.)
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'
import { comprobarViaje } from './comprobacionesListas.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const paso = Number(args.paso ?? 1)
const SOLO = args.dias ? new Set(args.dias.split(',')) : null
const out = args.out ?? 'docs/dias/PRUEBA_LISTAS.md'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'

// Las formas de viaje (días de contenido; el viaje dura uno más: el último es la vuelta).
const FORMAS = [
  { g: '1', clave: '1 día', dias: 1 },
  { g: '1.5', clave: '1,5 días, medio día de tarde', dias: 2, medio: { franja: 'tarde' } },
  { g: '1.5', clave: '1,5 días, medio día de mañana', dias: 2, medio: { franja: 'manana', salida: '15:00' } },
  { g: '2', clave: '2 días', dias: 2 },
  { g: '2', clave: '2 días con Free Tour', dias: 2, ft: true },
  { g: '2.5', clave: '2,5 días, medio día de tarde', dias: 3, medio: { franja: 'tarde' } },
  { g: '2.5', clave: '2,5 días, medio día de mañana', dias: 3, medio: { franja: 'manana', salida: '15:00' } },
  { g: '2.5', clave: '2,5 días con Free Tour, medio día de tarde', dias: 3, ft: true, medio: { franja: 'tarde' } },
  { g: '2.5', clave: '2,5 días con Free Tour, medio día de mañana', dias: 3, ft: true, medio: { franja: 'manana', salida: '15:00' } },
  { g: '3', clave: '3 días', dias: 3 },
  { g: '3', clave: '3 días con Free Tour', dias: 3, ft: true },
  { g: '3.5', clave: '3,5 días, medio día de mañana', dias: 4, medio: { franja: 'manana', salida: '15:00' } },
  { g: '3.5', clave: '3,5 días con Free Tour, medio día de mañana', dias: 4, ft: true, medio: { franja: 'manana', salida: '15:00' } },
  { g: '3.5', clave: '3,5 días, medio día de tarde', dias: 4, medio: { franja: 'tarde' } },
  { g: '4', clave: '4 días', dias: 4 },
  { g: '4', clave: '4 días con Free Tour', dias: 4, ft: true },
  { g: '4', clave: '4 días con excursión de medio día', dias: 4, mediaExcursion: { id: 'ostia_antica', dia: 4 } },
  { g: '5', clave: '5 días', dias: 5 },
  { g: '5', clave: '5 días con Free Tour', dias: 5, ft: true },
  { g: '5', clave: '5 días, «Prefiero quedarme en Roma»', dias: 5, sinExcursion: true },
  { g: '5', clave: '5 días con excursión de medio día', dias: 5, mediaExcursion: { id: 'tivoli_villas', dia: null } },
  { g: '6', clave: '6 días', dias: 6 },
  { g: '6', clave: '6 días con Free Tour', dias: 6, ft: true },
  { g: '6', clave: '6 días, «Prefiero quedarme en Roma»', dias: 6, sinExcursion: true },
  { g: '6', clave: '6 días con excursión de medio día', dias: 6, mediaExcursion: { id: 'ostia_antica', dia: null } },
]
// Lo que el viajero puede añadir a cada forma (cada uno es una variante del mismo viaje).
const EXTRAS = [
  { clave: '', pool: [], entradas: {}, exp: [] },
  { clave: 'pool Galería Borghese', pool: ['Galería Borghese'] },
  { clave: 'pool Coliseo', pool: ['Coliseo'] },
  { clave: 'pool Museos Vaticanos', pool: [MUSEOS] },
  { clave: 'pool Castillo y Cúpula', pool: ["Castillo de Sant'Angelo", 'Cúpula de San Pedro'] },
  { clave: 'pool Capitolinos y Letrán', pool: ['Museos Capitolinos', 'Basílica de San Juan de Letrán'] },
  { clave: 'pool Boca, Naranjos y Ojo', pool: ['Boca de la Verdad', 'Jardín de los Naranjos', 'Ojo de la Cerradura del Aventino'] },
  { clave: 'reserva Coliseo 9:30', entradas: { Coliseo: '09:30' } },
  { clave: 'reserva Coliseo 12:00', entradas: { Coliseo: '12:00' } },
  { clave: 'reserva Coliseo 16:00', entradas: { Coliseo: '16:00' } },
  { clave: 'reserva Galería 11:00', entradas: { 'Galería Borghese': '11:00' } },
  { clave: 'reserva Museos 14:00', entradas: { [MUSEOS]: '14:00' } },
  { clave: 'experiencias', exp: ['arte_museos', 'barrios_sabores', 'naturaleza_vistas', 'mercadillos_navidenos'] },
  { clave: 'Free Tour de tarde', ftDespues: { franja: 'tarde', hora: '17:00' } },
  { clave: 'Free Tour de noche', ftDespues: { franja: 'noche', hora: '18:30' } },
]
const fechas = []
for (let d = 0; d < 365; d += paso) fechas.push(addDays('2027-01-01', d))

const todos = []
const resumen = { viajes: 0, dias: 0, fallos: 0 }
const porRegla = new Map()
const infoPorRegla = new Map()
const fallos = []
const vistoInfo = []
let nulos = 0
const t0 = Date.now()
for (const forma of FORMAS) {
  if (SOLO && !SOLO.has(forma.g)) continue
  for (const extra of EXTRAS) {
    // El Free Tour de después solo en viajes de 2 días o más sin Free Tour de mañana; las reservas y el pool, en todos.
    if (extra.ftDespues && (forma.ft || forma.dias < 2 || forma.medio)) continue
    for (const inicio of fechas) {
      const poolNames = extra.pool ?? []
      const entradas = extra.entradas ?? {}
      const exp = [...(forma.ft ? ['imprescindibles', 'free_tour'] : []), ...(extra.exp ?? [])]
      const plan = planListasTrip({ destData: D, written, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames, experiencesPositive: exp, dateRangeStartIso: inicio, travel, entradas, freeTourDespues: extra.ftDespues ?? null, mediaJornada: forma.medio ?? null, sinExcursion: forma.sinExcursion === true, mediaExcursion: forma.mediaExcursion ?? null })
      resumen.viajes++
      if (!plan) { nulos++; fallos.push({ regla: 'sin_plan', texto: `${forma.clave}${extra.clave ? ` + ${extra.clave}` : ''} · ${inicio}: el motor no devuelve plan` }); porRegla.set('sin_plan', (porRegla.get('sin_plan') ?? 0) + 1); continue }
      const etiqueta = `${forma.clave}${extra.clave ? ` + ${extra.clave}` : ''} · inicio ${inicio}`
      const r = comprobarViaje({ D, plan, etiqueta, entradas, poolNames, hasFreeTour: Boolean(forma.ft), listas: written, franjas: written.destino?.franjas })
      resumen.dias += plan.days.filter((d) => d.curatedDay?.id).length
      for (const f of r.fallos) { fallos.push(f); porRegla.set(f.regla, (porRegla.get(f.regla) ?? 0) + 1) }
      for (const f of r.info) { infoPorRegla.set(f.regla, (infoPorRegla.get(f.regla) ?? 0) + 1); if (vistoInfo.length < 400 && ['no_cabe_del_todo', 'comida_tarde', 'comida_tras_hora_fija', 'restaurante_repetido', 'reserva_tarde'].includes(f.regla)) vistoInfo.push(f) }
    }
  }
}
resumen.fallos = fallos.length
const segundos = Math.round((Date.now() - t0) / 1000)
const lineas = [
  '# Prueba del motor de listas (Tanda 6)',
  '',
  `${resumen.viajes} viajes (${resumen.dias} días) en ${fechas.length} fechas de 2027, con y sin pool, Free Tour, reservas y experiencias. ${segundos} s.`,
  '',
  `**Fallos: ${resumen.fallos}.**`,
  '',
  '## Por regla',
  '',
  ...['orden', 'cerrado', 'zigzag', 'piramide', 'dentro_dos_veces', 'restaurante_repetido', 'noche_repetida', 'reserva', 'comida_tarde', 'comida_tras_hora_fija', 'dia_empieza_tarde', 'cerrado_a_la_llegada', 'camino_en_sobra', 'lluvia', 'sin_explicar', 'pool', 'sin_plan'].map((regla) => `- ${regla}: ${porRegla.get(regla) ?? 0}`),
  '',
  '## Lo que se apunta (no es un fallo)',
  '',
  ...[...infoPorRegla].map(([regla, n]) => `- ${regla}: ${n}`),
  '',
  '## Primeros fallos de cada regla',
  '',
  ...[...porRegla.keys()].flatMap((regla) => [`### ${regla} (${porRegla.get(regla)})`, '', ...fallos.filter((f) => f.regla === regla).slice(0, 12).map((f) => `- ${f.texto}`), '']),
]
fs.writeFileSync(out, lineas.join('\n'))
if (args.fallos) fs.writeFileSync(args.fallos, fallos.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
if (args.info) fs.writeFileSync(args.info, vistoInfo.map((f) => `[${f.regla}] ${f.texto}`).join('\n'))
if (args.json) fs.writeFileSync(args.json, JSON.stringify({ ...resumen, segundos, porRegla: Object.fromEntries(porRegla), info: Object.fromEntries(infoPorRegla) }))
console.log(JSON.stringify({ ...resumen, segundos, porRegla: Object.fromEntries(porRegla), info: Object.fromEntries(infoPorRegla) }))
