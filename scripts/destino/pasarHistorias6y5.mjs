// Tanda 6y5, punto 1 y punto 4: pasa las 31 historias de HISTORIAS_ROMA.md al campo `historia` de la ficha de cada sitio
// (data/pipeline_v2/detalle/roma/*.json) y corrige las 6 frases dudosas de las fichas. Se puede repetir: no duplica nada.
//   node scripts/destino/pasarHistorias6y5.mjs [ruta/a/HISTORIAS_ROMA.md]      (por defecto docs/dias/HISTORIAS_ROMA.md o la variable HISTORIAS)
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
  const cuerpo = texto.split(/^## Datos dudosos/m)[0]
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

/** Cambia una frase exacta dentro de un texto; si ya está cambiada no hace nada; si no encuentra ni lo uno ni lo otro, avisa. */
function cambiar(texto, antes, despues, donde) {
  if (texto.includes(despues)) return texto
  if (!texto.includes(antes)) throw new Error(`No encuentro la frase de «${donde}»: ${antes}`)
  return texto.replace(antes, despues)
}

// ── Punto 4: las frases dudosas ──
const CORRECCIONES = [
  { sitio: 'Fontana de Trevi', campo: 'description', antes: 'donde Neptuno domina las aguas', despues: 'donde Océano domina las aguas' },
  { sitio: 'Fontana de Trevi', campo: 'what_to_see', antes: 'La figura central de Neptuno (Océano) dominando las aguas desde su carro', despues: 'La figura central de Océano dominando las aguas desde su carro' },
  { sitio: 'Fontana de Trevi', campo: 'secrets', antes: "La costumbre de la moneda viene de la película 'Tres monedas en la fuente' (1954) — y ahora genera más de 1 millón de euros al año para Cáritas.", despues: 'La película de 1954 hizo famosa la costumbre de la moneda, pero echar monedas al agua es mucho más antiguo. Hoy las monedas generan más de 1 millón de euros al año para Cáritas.' },
  { sitio: 'Panteón', campo: 'secrets', antes: 'El 21 de junio (solsticio de verano), al mediodía,', despues: 'El 21 de abril, el día del nacimiento de Roma, al mediodía,' },
  { sitio: 'Panteón', campo: 'secrets', antes: 'La cúpula es técnicamente imposible para la ingeniería moderna: el hormigón romano', despues: 'Todavía hoy es la mayor cúpula de hormigón sin armar del mundo. El hormigón romano' },
  {
    sitio: 'Piazza Navona',
    campo: 'tips',
    antes: 'La rivalidad Bernini-Borromini está en esta plaza: cuenta la leyenda que la figura del Río de la Plata se tapa los ojos para no ver la fachada de Borromini. Es falso (la fuente es anterior a la iglesia), pero la anécdota es divertida.',
    despues: 'La rivalidad Bernini-Borromini está en esta plaza. Se cuenta que el Río de la Plata levanta la mano como si la iglesia de enfrente se le fuera a caer encima, y que el Nilo se tapa la cabeza para no verla. Es solo una leyenda: la fuente es de antes que la fachada.',
  },
  { sitio: 'Basílica de San Pedro', campo: 'secrets', antes: 'El Baldaquino de Bernini está hecho con bronce arrancado del pórtico del Panteón por orden del Papa Barberini.', despues: 'Se cuenta que el bronce del Baldaquino salió del pórtico del Panteón, aunque la mayor parte de aquel bronce parece que acabó en cañones.' },
]

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

for (const c of CORRECCIONES) {
  const { place } = sitios.get(c.sitio) ?? {}
  if (!place) throw new Error(`No hay ficha de ${c.sitio}`)
  if (c.campo === 'description') place.description = cambiar(place.description, c.antes, c.despues, c.sitio)
  else {
    const lista = place[c.campo]
    const i = lista.findIndex((t) => t.includes(c.antes) || t.includes(c.despues))
    if (i < 0) throw new Error(`No encuentro la frase de «${c.sitio}» en ${c.campo}: ${c.antes}`)
    lista[i] = cambiar(lista[i], c.antes, c.despues, c.sitio)
  }
}

for (const [fichero, json] of ficheros) escribirJson(fichero, json)
console.log(`Historias pasadas: ${31 - sinFicha.length} de 31. Sin ficha: ${sinFicha.length ? sinFicha.join('; ') : 'ninguna'}.`)
