// Un solo uso (3-oct-2026, PARA_CODE_ROJOS_D1_D2_D4_FREE_TOUR, parte B): D4.
//   - verano (julio y agosto) con la entrada a la Galería de 15:00 a 17:45: comida, la Galería en las horas de calor, el Parque (elástica) cuando baja el sol
//     y, al final, los Jardines y la Terraza del Pincio al atardecer (variantes `entrada:quince@verano` y `entrada:tarde@verano`).
//   node scripts/destino/rojosB.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const read = (id) => JSON.parse(readFileSync(`data/dias/roma/${id}.json`, 'utf8').replace(/\r\n/g, '\n'))
const write = (id, data) => writeFileSync(`data/dias/roma/${id}.json`, (JSON.stringify(data, null, 2) + '\n').replace(/\n/g, '\r\n'))

const day = read('D4')
const galeria = {
  lugar: 'Galería Borghese',
  tipo: 'fija',
  hora: '16:00',
  min: 120,
  modo: 'dentro',
  entrada: true,
  turno: true,
  si_cerrado: { cambiar_por: { lugar: 'Parque de Villa Borghese', min: 60, titulo: 'El parque de Villa Borghese: el lago y el Templo de Esculapio' } },
}
const verano = (franja) => ({
  _nota: `Verano (julio y agosto) con la entrada de ${franja}: la regla de «nada al sol antes de las 16:30» es para el parque, no para la Galería, que es por dentro (PARA_CODE_ROJOS, 4). Orden: comida, la Galería en las horas de calor, el Parque de Villa Borghese (elástica) cuando baja el sol y, al final, los Jardines y la Terraza del Pincio al atardecer. La hora de la parada de la Galería es solo un ejemplo: la que vale es la reservada.`,
  'tarde.*': {
    paradas: [
      galeria,
      { lugar: 'Parque de Villa Borghese', min: 40, titulo: 'El lago y el Templo de Esculapio', elastica: 30 },
      { lugar: 'Jardines del Pincio', min: 20 },
      { lugar: 'Terraza del Pincio', modo: 'atardecer' },
    ],
  },
})
day.variantes['entrada:quince@verano'] = verano('15:00')
day.variantes['entrada:tarde@verano'] = verano('15:30 a 17:45')
write('D4', day)
console.log('D4: variantes de verano')
