// Tanda 6y7, punto 7: pasa las 31 historias (versión 4) de HISTORIAS_ROMA.md al campo `historia` de la ficha de cada sitio
// (data/pipeline_v2/detalle/roma/*.json). Se puede repetir: no duplica nada.
//   node scripts/destino/pasarHistorias6y7.mjs [ruta/a/HISTORIAS_ROMA.md]      (por defecto docs/dias/HISTORIAS_ROMA.md o la variable HISTORIAS)
// De cada historia se coge SOLO el texto (ni el título, ni las líneas «> Comprobar», ni las notas del final).
import fs from 'node:fs'

const DIR = 'data/pipeline_v2/detalle/roma/'
const DOC = process.argv[2] ?? process.env.HISTORIAS ?? 'docs/dias/HISTORIAS_ROMA.md'

// El número de cada historia en el documento -> el nombre del sitio en la ficha.
const SITIO_DE_CADA_HISTORIA = {
  1: 'Coliseo',
  2: 'Foro Romano y Palatino',
  3: 'Arco de Constantino',
  4: 'Fontana de Trevi',
  5: 'Panteón',
  6: 'Piazza Navona',
  7: 'Plaza de España',
  8: 'Museos Vaticanos y Capilla Sixtina',
  9: 'Basílica de San Pedro',
  10: 'Plaza de San Pedro',
  11: 'Altar de la Patria',
  12: "Castillo de Sant'Angelo",
  13: 'Boca de la Verdad',
  14: 'Largo di Torre Argentina',
  15: "Campo de' Fiori",
  16: 'Plaza del Campidoglio',
  17: 'Basílica de San Clemente',
  18: 'Iglesia de San Pietro in Vincoli',
  19: 'Ojo de la Cerradura del Aventino',
  20: 'Isla Tiberina',
  21: 'Galería Borghese',
  22: 'Basílica de Santa María la Mayor',
  23: 'Circo Máximo',
  24: 'Termas de Caracalla',
  25: 'Via Appia Antica',
  26: 'Columna de Trajano',
  27: 'Iglesia de San Luigi dei Francesi',
  28: 'Iglesia de Santa Maria della Vittoria',
  29: 'Mirador del Janículo',
  30: 'Piazza del Popolo',
  31: 'Iglesia de Santa Maria in Trastevere',
}
// La historia que suena gratis para todos, como muestra (Eric, 11-oct).
const GRATIS = new Set(['Coliseo'])

/** Las historias del documento: { numero: texto }. Solo el texto, párrafos separados por una línea en blanco. */
function leerHistorias(texto) {
  const cuerpo = texto.split(/^## Datos de las fichas/m)[0]
  const historias = {}
  const trozos = cuerpo.split(/^## (\d+)\. .*$/m)
  for (let i = 1; i < trozos.length; i += 2) {
    const parrafos = []
    for (const linea of trozos[i + 1].split(/\r?\n/)) {
      if (/^>/.test(linea) || /^---\s*$/.test(linea)) break
      parrafos.push(linea.trim())
    }
    historias[Number(trozos[i])] = parrafos.join('\n').replace(/\n{2,}/g, '\n\n').trim()
  }
  return historias
}

const leerJson = (f) => JSON.parse(fs.readFileSync(DIR + f, 'utf8'))
// Los ficheros usan fin de línea de Windows con un salto al final: se respeta tal cual para que el cambio sea solo el campo.
const escribirJson = (f, json) => fs.writeFileSync(DIR + f, JSON.stringify(json, null, 2).replace(/\n/g, '\r\n') + '\r\n')

const historias = leerHistorias(fs.readFileSync(DOC, 'utf8'))
const numeros = Object.keys(historias).map(Number)
if (numeros.length !== 31) throw new Error(`El documento trae ${numeros.length} historias, no 31`)

const ficheros = new Map(fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => [f, leerJson(f)]))
const sitios = new Map()
for (const [fichero, json] of ficheros) for (const place of json.places) sitios.set(place.name, { fichero, place })

const sinFicha = []
for (const [numero, sitio] of Object.entries(SITIO_DE_CADA_HISTORIA)) {
  const donde = sitios.get(sitio)
  if (!donde) {
    sinFicha.push(`${numero}. ${sitio}`)
    continue
  }
  donde.place.historia = historias[numero]
  if (GRATIS.has(sitio)) donde.place.historia_gratis = true
  else delete donde.place.historia_gratis
}

for (const [fichero, json] of ficheros) escribirJson(fichero, json)
console.log(`Historias pasadas: ${31 - sinFicha.length} de 31. Sin ficha: ${sinFicha.length ? sinFicha.join('; ') : 'ninguna'}.`)
