// Tanda 7 (vuelta): añade a los sitios grandes de roma.json el bloque de cada uno (lo que lleva a un medio día cuando se reserva ese día) y cómo se dice en el aviso
// («Tu entrada al Coliseo…»). Edita el texto de las líneas, sin reescribir el fichero entero (el formato y los saltos de línea se quedan como están).
import { readFileSync, writeFileSync } from 'node:fs'

const FICHERO = new URL('../../data/pipeline_v2/roma.json', import.meta.url)
let texto = readFileSync(FICHERO, 'utf8')

const PONER = [
  ['"nombre": "Coliseo", "del": "del Coliseo", "el": "el Coliseo", "dias": ["D1", "D1-FT"] }',
    '"nombre": "Coliseo", "del": "del Coliseo", "el": "el Coliseo", "entrada_a": "al Coliseo", "dias": ["D1", "D1-FT"], "bloque": { "paradas": ["Coliseo", "Arco de Constantino", "Foro Romano y Palatino"] } }'],
  ['"nombre": "Museos Vaticanos y Capilla Sixtina", "del": "del Vaticano", "el": "el Vaticano", "dias": ["D2", "D3"], "nunca_se_quita": true }',
    '"nombre": "Museos Vaticanos y Capilla Sixtina", "del": "del Vaticano", "el": "el Vaticano", "entrada_a": "a los Museos Vaticanos", "dias": ["D2", "D3"], "nunca_se_quita": true, "bloque": { "paradas": ["Museos Vaticanos y Capilla Sixtina", "Plaza de San Pedro", "Basílica de San Pedro"], "despues_de_comer": { "dias_semana": ["miércoles"], "paradas": ["Plaza de San Pedro", "Basílica de San Pedro"] } } }'],
]
let hechos = 0
for (const [antes, despues] of PONER) {
  if (texto.includes(despues)) continue
  if (!texto.includes(antes)) throw new Error(`No encuentro: ${antes.slice(0, 60)}`)
  texto = texto.replace(antes, despues)
  hechos++
}
// La Galería lleva tilde en el nombre: se busca por el principio de la línea.
{
  const re = /"nombre": "Galería Borghese", "del": "de la Galería Borghese", "el": "la Galería Borghese", "dias": \["D4"\], "nunca_se_quita": true \}/
  const nuevo = '"nombre": "Galería Borghese", "del": "de la Galería Borghese", "el": "la Galería Borghese", "entrada_a": "a la Galería Borghese", "dias": ["D4"], "nunca_se_quita": true, "bloque": { "paradas": ["Galería Borghese", "Parque de Villa Borghese"] } }'
  if (re.test(texto)) { texto = texto.replace(re, nuevo); hechos++ } else if (!texto.includes('"bloque": { "paradas": ["Galería Borghese"')) throw new Error('No encuentro la línea de la Galería')
}
{
  // El texto de la nota de los sitios grandes: se añade lo nuevo al final de su frase.
  const marca = 'Un destino sin este campo no tiene sitios grandes.'
  const extra = ' Tanda 7 (vuelta): `entrada_a` (cómo se dice «Tu entrada …» en los avisos de reservas contra el vuelo) y `bloque` (lo que lleva a un medio día —el día de llegada desde las 14:00 o el de vuelta— una reserva de ese sitio: las paradas en el orden de su día escrito para esa hora; `despues_de_comer`: en esos días de la semana, esas paradas nunca van antes de comer: después de la comida si la fila la lleva, y si no, a «Si te sobra tiempo»).'
  if (texto.includes(marca) && !texto.includes('Tanda 7 (vuelta): `entrada_a`')) { texto = texto.replace(marca, marca + extra); hechos++ }
}
writeFileSync(FICHERO, texto)
JSON.parse(texto)
console.log('Cambios hechos:', hechos)
