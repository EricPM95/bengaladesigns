// La muestra de 60 viajes: comprueba que las RUTAS (qué paradas, en qué día, a qué hora y cuánto) salen exactamente iguales que en una versión guardada. Se usa en las tandas que solo cambian lo que se le dice al viajero
// (avisos, tarjetas…) y no el reparto de los días: los textos de los avisos NO cuentan, las paradas sí.
//   node scripts/destino/muestraRutas60.mjs --guardar     (guarda la huella de ahora en scripts/destino/_salidas/muestra60_huella.json)
//   node scripts/destino/muestraRutas60.mjs               (compara lo de ahora con la huella guardada; sale con 1 si algo cambia)
import fs from 'node:fs'
import { buildDayBlockV3 } from '../../server/engine/index.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'

const HUELLA = 'scripts/destino/_salidas/muestra60_huella.json'
const D = findPipelineV2Data('Roma')
const sumar = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

/** 60 viajes: fechas repartidas por el año (con domingos, lunes, el último domingo de mes, Navidad, Semana Santa, Ferragosto…), de 2 a 5 días. */
export function muestra() {
  const fechas = [
    '2026-11-05', '2026-11-07', '2026-11-14', '2026-11-22', '2026-11-28', '2026-12-04', '2026-12-08', '2026-12-12', '2026-12-18', '2026-12-23',
    '2026-12-26', '2026-12-30', '2027-01-02', '2027-01-05', '2027-01-16', '2027-02-06', '2027-02-13', '2027-02-20', '2027-03-06', '2027-03-20',
    '2027-03-24', '2027-03-27', '2027-04-03', '2027-04-17', '2027-04-20', '2027-04-24', '2027-05-01', '2027-05-08', '2027-05-29', '2027-06-01',
    '2027-06-12', '2027-06-26', '2027-06-28', '2027-07-10', '2027-07-24', '2027-07-31', '2027-08-07', '2027-08-13', '2027-08-14', '2027-08-28',
    '2027-09-04', '2027-09-18', '2027-09-25', '2027-10-02', '2027-10-09', '2027-10-23', '2027-10-30', '2027-11-01', '2027-11-06', '2027-11-20',
    '2027-11-27', '2027-12-04', '2027-12-06', '2027-12-11', '2027-12-17', '2027-12-22', '2027-12-24', '2027-12-27', '2028-01-01', '2028-01-08',
  ]
  return fechas.map((fecha, i) => ({ fecha, dias: 2 + (i % 4) }))
}

/** Lo que cuenta de un día: sus paradas con día, hora y minutos (sin ningún texto de aviso). */
function huellaDelDia(day) {
  const stops = day?.schedule?.visits ?? day?.stops ?? []
  return stops.map((v) => [v.place?.name ?? v.name, v.start ?? v.time ?? null, v.duration ?? v.minutes ?? null, v.visit_mode ?? (v.outside ? 'fuera' : null)])
}

async function huellaDeTodo() {
  const salida = {}
  for (const { fecha, dias } of muestra()) {
    const dias_ = []
    for (let n = 1; n <= dias; n++) {
      const day = await buildDayBlockV3(D, dias + 1, false, n, null, fecha, [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null })
      dias_.push({ titulo: day?.title ?? day?.theme ?? null, paradas: huellaDelDia(day) })
    }
    salida[`${fecha}|${dias}`] = dias_
  }
  return salida
}

const guardar = process.argv.includes('--guardar')
const ahora = await huellaDeTodo()
if (guardar) {
  fs.mkdirSync('scripts/destino/_salidas', { recursive: true })
  fs.writeFileSync(HUELLA, JSON.stringify(ahora))
  console.log(`Huella guardada: ${Object.keys(ahora).length} viajes en ${HUELLA}`)
} else {
  const antes = JSON.parse(fs.readFileSync(HUELLA, 'utf8'))
  const distintos = Object.keys(ahora).filter((k) => JSON.stringify(ahora[k]) !== JSON.stringify(antes[k]))
  console.log(`Muestra de ${Object.keys(ahora).length} viajes: ${distintos.length === 0 ? 'las rutas salen exactamente iguales que antes' : `${distintos.length} viajes distintos: ${distintos.slice(0, 8).join(', ')}`}`)
  process.exit(distintos.length ? 1 : 0)
}
