// Mide qué cambia al mover el límite de la comida de las 14:30 a las 15:00 (Tanda 6u, punto 2): en qué días lo que antes iba a «Si te sobra tiempo» ahora cabe.
//   node scripts/destino/medirComida6u.mjs [paso=15] [antes=14:30] [ahora=15:00] [out=docs/dias/COMIDA_15_00_6U.md]
// Recorre los mismos viajes que pruebaListas (de 1 a 6 días, con y sin Free Tour, con el pool y las reservas de siempre) con los dos límites y apunta, por día escrito, lo que cambia.
import fs from 'node:fs'
import { planListasTrip } from '../../shared/routeEngine/listasTrip.js'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { writtenDaysFor } from '../../server/engine/writtenDays.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const D = findPipelineV2Data('Roma')
const written = writtenDaysFor('roma')
const travel = travelTimesFor('roma')
const paso = Number(args.paso ?? 15)
const con = (hasta) => ({ ...written, destino: { ...written.destino, franjas: { ...(written.destino?.franjas ?? {}), comida_hasta: hasta } } })
const antes = con(args.antes ?? '14:30')
const ahora = con(args.ahora ?? '15:00')
const out = args.out ?? 'docs/dias/COMIDA_15_00_6U.md'
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const FORMAS = [
  { clave: '1 día', dias: 1 },
  { clave: '2 días', dias: 2 },
  { clave: '2 días con Free Tour', dias: 2, ft: true },
  { clave: '3 días', dias: 3 },
  { clave: '3 días con Free Tour', dias: 3, ft: true },
  { clave: '4 días', dias: 4, diaCuatro: 'roma' },
  { clave: '4 días con Free Tour', dias: 4, ft: true, diaCuatro: 'roma' },
  { clave: '5 días', dias: 5, diaCuatro: 'roma' },
  { clave: '6 días', dias: 6, diaCuatro: 'roma' },
]
const EXTRAS = [
  { clave: '' },
  { clave: 'Museos 11:00', entradas: { [MUSEOS]: '11:00' } },
  { clave: 'Museos 13:30', entradas: { [MUSEOS]: '13:30' } },
  { clave: 'Coliseo 12:00', entradas: { Coliseo: '12:00' } },
  { clave: 'Coliseo 14:00', entradas: { Coliseo: '14:00' } },
  { clave: 'pool Galería y Museos', pool: ['Galería Borghese', MUSEOS] },
]
const fechas = []
for (let d = 0; d < 365; d += paso) fechas.push(addDays('2027-01-01', d))
const cambios = new Map()
let viajes = 0
let conCambio = 0
for (const forma of FORMAS) {
  for (const extra of EXTRAS) {
    for (const inicio of fechas) {
      const base = { destData: D, totalDays: forma.dias + 1, hasFreeTour: Boolean(forma.ft), poolNames: extra.pool ?? [], experiencesPositive: forma.ft ? ['imprescindibles', 'free_tour'] : ['imprescindibles'], dateRangeStartIso: inicio, travel, entradas: extra.entradas ?? {}, mediaJornada: null, diaCuatro: forma.diaCuatro ?? null }
      const a = planListasTrip({ ...base, written: antes })
      const b = planListasTrip({ ...base, written: ahora })
      if (!a || !b) continue
      viajes++
      let hubo = false
      a.days.forEach((dia, i) => {
        const id = dia.curatedDay?.id
        if (!id) return
        const visitas = (d) => (d.schedule?.visits ?? []).map((v) => v.place?.name).filter(Boolean)
        const sobra = (d) => (d.spare ?? []).map((s) => s.place?.name ?? s.lugar ?? s.name ?? s.titulo).filter(Boolean)
        const sa = sobra(dia)
        const sb = sobra(b.days[i])
        const va = visitas(dia).join('|')
        const vb = visitas(b.days[i]).join('|')
        if (sa.join('|') === sb.join('|') && va === vb) return
        hubo = true
        const clave = `${id}`
        const entrada = cambios.get(clave) ?? { veces: 0, vuelven: new Map(), ejemplos: [] }
        entrada.veces++
        for (const nombre of sa.filter((n) => !sb.includes(n))) entrada.vuelven.set(nombre, (entrada.vuelven.get(nombre) ?? 0) + 1)
        if (entrada.ejemplos.length < 3) entrada.ejemplos.push(`${forma.clave}${extra.clave ? ` + ${extra.clave}` : ''} · ${inicio}`)
        cambios.set(clave, entrada)
      })
      if (hubo) conCambio++
    }
  }
}
const lineas = [
  '# Qué cambia con la comida hasta las 15:00 (Tanda 6u)',
  '',
  `Se comparan los viajes de siempre con el límite de la comida en las ${args.antes ?? '14:30'} y en las ${args.ahora ?? '15:00'}: ${viajes} viajes (una de cada ${paso} fechas de 2027), ${conCambio} con algún cambio.`,
  '',
  ...(cambios.size === 0 ? ['No cambia ningún día.'] : [...cambios].flatMap(([id, e]) => [`## ${id} (${e.veces} veces)`, '', e.vuelven.size > 0 ? `- Lo que antes iba a «Si te sobra tiempo» y ahora cabe: ${[...e.vuelven].map(([n, k]) => `${n} (${k})`).join(', ')}.` : '- No vuelve nada de «Si te sobra tiempo»; cambia el orden o la hora de la comida.', `- Ejemplos: ${e.ejemplos.join(' · ')}`, ''])),
]
fs.writeFileSync(out, lineas.join('\n'))
console.log(JSON.stringify({ viajes, conCambio, dias: [...cambios].map(([id, e]) => `${id}:${e.veces}`) }))
