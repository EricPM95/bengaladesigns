// Un solo uso (3-oct-2026, PARA_CODE_ROJOS_D1_D2_D4_FREE_TOUR, parte C): D2.
//   - miércoles con la entrada a los Museos de 13:00 a 14:00: la mañana como la del orden 2 (9:00 Puente, Castillo por fuera, Borgo Pio elástica), comida rápida en Pizzarium,
//     los Museos a su hora y la Plaza y la Basílica de San Pedro DESPUÉS de los Museos;
//   - lunes: el Castillo ya va siempre por fuera (su cierre del lunes no cambia nada); el Tempietto, si cierra, `si_cerrado: "quitar"` (nunca «por fuera» forzado).
//   node scripts/destino/rojosC.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const read = (id) => JSON.parse(readFileSync(`data/dias/roma/${id}.json`, 'utf8').replace(/\r\n/g, '\n'))
const write = (id, data) => writeFileSync(`data/dias/roma/${id}.json`, (JSON.stringify(data, null, 2) + '\n').replace(/\n/g, '\r\n'))
const TEMPIETTO = 'San Pietro in Montorio y Tempietto de Bramante'

const day = read('D2')
let changed = 0

// 1. Tempietto por dentro con «si está cerrado, por fuera» → «quitar». Y el cambio a «por fuera» de los lunes, fuera.
;(function walk(node) {
  if (Array.isArray(node)) return node.forEach(walk)
  if (!node || typeof node !== 'object') return
  if (node.lugar === TEMPIETTO && node.modo === 'dentro' && node.si_cerrado === 'fuera') {
    node.si_cerrado = 'quitar'
    changed++
  }
  if (node.cambiar && node.cambiar[TEMPIETTO]) {
    delete node.cambiar[TEMPIETTO]
    if (Object.keys(node.cambiar).length === 0) delete node.cambiar
    changed++
  }
  for (const value of Object.values(node)) walk(value)
})(day)
// En la variante del lunes (el Tempietto cierra siempre), la parada «por fuera» escrita a mano sobra: si cierra, se quita.
const lunes = day.variantes.lunes
for (const version of Object.keys(lunes['tarde.D']?.paradas ? { D: 1 } : {})) {
  const list = lunes[`tarde.${version}`].paradas
  const at = list.findIndex((stop) => stop.lugar === TEMPIETTO && stop.modo === 'fuera')
  if (at >= 0) {
    list.splice(at, 1)
    changed++
  }
}
for (const key of ['lunes', 'entrada:mediodia@lunes', 'entrada:primera_tarde@lunes', 'entrada:tarde@lunes']) {
  if (day.variantes[key]?._nota) day.variantes[key]._nota = day.variantes[key]._nota.replace(/el Tempietto cierra \(por fuera\) y el Castillo ya va por fuera/, 'el Tempietto cierra (si cierra, se quita) y el Castillo ya va por fuera')
}

// 2. Miércoles con la entrada de 13:00 a 14:00.
day.variantes['entrada:primera_tarde@miercoles'] = {
  _nota: 'Miércoles con el orden 3 (entrada de 13:00 a 14:00): la mañana como la del orden 2 del miércoles: a las 9:00 el Puente Sant\'Angelo, el Castillo por fuera y «Pasea y piérdete por Borgo Pio» (elástica); luego comida rápida en Pizzarium (Bonci), los Museos a su hora, y la Plaza y la Basílica de San Pedro después de los Museos (la Basílica, ese día, abre a las 12:30 y cierra a las 20:00; PARA_CODE_ROJOS, 5).',
  manana: {
    empieza: '09:00',
    paradas: [
      { lugar: "Puente Sant'Angelo", min: 10 },
      { lugar: "Castillo de Sant'Angelo", min: 20, modo: 'fuera' },
      { lugar: 'Borgo Pio', min: 20, titulo: 'Pasea y piérdete por Borgo Pio', elastica: 90 },
    ],
    comida: { restaurante: 'Pizzarium (Bonci)', alternativa: 'Borghiciana Pastificio Artigianale' },
  },
  'tarde.*': {
    insertar: [
      { despues_de: 'Museos Vaticanos y Capilla Sixtina', parada: { lugar: 'Basílica de San Pedro', min: 60, modo: 'dentro', si_cerrado: 'fuera' } },
      { despues_de: 'Museos Vaticanos y Capilla Sixtina', parada: { lugar: 'Plaza de San Pedro', min: 25 } },
    ],
  },
}
write('D2', day)
console.log(`D2: ${changed} cambios en el Tempietto; miércoles de 13:00 a 14:00 rehecho`)
