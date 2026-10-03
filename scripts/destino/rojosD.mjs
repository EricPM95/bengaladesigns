// Un solo uso (3-oct-2026, PARA_CODE_ROJOS_D1_D2_D4_FREE_TOUR, parte D): D1.
//   - Coliseo desde las 15:30 con huecos de más de una hora: la comida en Monti se alarga y «Pasea y piérdete por Monti» (elástica, una vez por viaje) llena el rato que queda
//     hasta la hora de la entrada.
//   node scripts/destino/rojosD.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const read = (id) => JSON.parse(readFileSync(`data/dias/roma/${id}.json`, 'utf8').replace(/\r\n/g, '\n'))
const write = (id, data) => writeFileSync(`data/dias/roma/${id}.json`, (JSON.stringify(data, null, 2) + '\n').replace(/\n/g, '\r\n'))

const day = read('D1')
const variant = day.variantes['entrada:tarde']
const monti = { lugar: 'Monti', min: 30, titulo: 'Pasea y piérdete por Monti', elastica: 90, una_vez: true, tipo: 'opcional' }
for (const version of ['A', 'B', 'C', 'D']) {
  const list = variant[`tarde.${version}`].paradas
  const at = list.findIndex((stop) => stop.lugar === 'Monti')
  if (at >= 0) list[at] = clone(monti)
  else list.unshift(clone(monti))
}
if (!variant._nota.includes('Pasea y piérdete por Monti')) variant._nota += ' Con la entrada a las 15:30 o poco después sobra rato: la comida en Monti se alarga y «Pasea y piérdete por Monti» (elástica, una vez por viaje) llena lo que queda hasta la hora de la entrada.'
write('D1', day)
console.log('D1: paseo por Monti antes del Coliseo')

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}
