// Tanda 6y10: añade `sitios_grandes` a los datos de Roma. Solo AÑADE líneas (no reformatea el fichero). Se puede repetir: si ya está, no hace nada.
// Cada sitio lleva lo que antes estaba repartido en listas fijas del código: su nombre, cómo se dice en los avisos («del Coliseo», «el Coliseo»),
// los días escritos (`curated_days`) que son suyos, y si el motor nunca lo quita de su día.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const ruta = join(dirname(fileURLToPath(import.meta.url)), '../../data/pipeline_v2/roma.json')
const texto = readFileSync(ruta, 'utf8')
if (texto.includes('\n  "sitios_grandes"')) {
  console.log('ya está')
} else {
  const ancla = '\n  "entradas_reservas": ['
  if (!texto.includes(ancla)) throw new Error('no encuentro el ancla')
  const bloque = [
    '',
    '  "sitios_grandes": {',
    '    "_nota": "Tanda 6y10. Los sitios grandes del destino: los que tienen su día escrito por tramos de hora. Una reserva de uno de ellos en otro día mueve el día entero; la de un sitio pequeño solo mueve esa parada. Antes eran listas fijas en el código; ahora el motor y la app lo leen de aquí. Cada sitio: nombre (el del lugar), del y el (cómo se dice en los avisos), dias (los días escritos que son suyos) y nunca_se_quita (el motor no lo quita de su día aunque cierre). Un destino sin este campo no tiene sitios grandes.",',
    '    "lugares": [',
    '      { "nombre": "Coliseo", "del": "del Coliseo", "el": "el Coliseo", "dias": ["D1", "D1-FT"] },',
    '      { "nombre": "Museos Vaticanos y Capilla Sixtina", "del": "del Vaticano", "el": "el Vaticano", "dias": ["D2", "D3"], "nunca_se_quita": true },',
    '      { "nombre": "Galería Borghese", "del": "de la Galería Borghese", "el": "la Galería Borghese", "dias": ["D4"], "nunca_se_quita": true },',
    '      { "nombre": "Free Tour por Roma", "del": "del Free Tour", "el": "el Free Tour", "dias": ["D3", "D1"] }',
    '    ]',
    '  },',
  ].join('\n')
  writeFileSync(ruta, texto.replace(ancla, bloque + ancla))
  JSON.parse(readFileSync(ruta, 'utf8'))
  console.log('añadido')
}
