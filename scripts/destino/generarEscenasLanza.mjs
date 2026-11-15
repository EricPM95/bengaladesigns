// Genera las 11 escenas de los emblemas de Lanzarote a partir de la pieza de Design (V3, 15-nov):
//   node scripts/destino/generarEscenasLanza.mjs
// Lee `docs/diseno/proyecto/Piezas/Emblema Cine Lanza.dc.html` (los dibujos SVG de cada escena, sus fondos y sus frases) y escribe un archivo por emblema en
// `src/components/logros/momentos/escenas/lanza/`. Los dibujos van tal cual los dejó Design (ni una coordenada tocada); si Design los cambia, se vuelve a correr.
// Los textos de la revelación (nombre y línea) salen de `data/logros/lanzarote.json` (ya coinciden con los de Design; lo comprueba pruebaV3).
import fs from 'node:fs'

const PIEZA = 'docs/diseno/proyecto/Piezas/Emblema Cine Lanza.dc.html'
const SALIDA = 'src/components/logros/momentos/escenas/lanza'
// El número de «kind» de Design → el id del emblema (los de data/logros/lanzarote.json).
const IDS = { 1: 'timanfaya', 2: 'jameos', 3: 'cueva_de_los_verdes', 4: 'mirador_del_rio', 5: 'fundacion_manrique', 6: 'el_golfo', 7: 'la_geria', 8: 'la_graciosa', 9: 'papagayo', 10: 'lz_madrugador', 11: 'atardecer_atlantico' }

const html = fs.readFileSync(PIEZA, 'utf8')
const ini = html.indexOf('const A=(at,cls)')
const fin = html.indexOf('class Component extends DCLogic')
if (ini < 0 || fin < 0) throw new Error('No encuentro las escenas en la pieza de Design.')
const codigo = html.slice(ini, fin) + '\nreturn SC;'
const SC = new Function(codigo)()

// Los textos de la revelación de Design (están dentro de renderVals).
const txt = html.slice(html.indexOf('const TXT={'), html.indexOf('}[K];'))
const TXT = new Function(`return ${txt.slice('const TXT='.length)}}`)()

const datos = JSON.parse(fs.readFileSync('data/logros/lanzarote.json', 'utf8'))
fs.mkdirSync(SALIDA, { recursive: true })
const generados = []
for (const [k, id] of Object.entries(IDS)) {
  const e = SC[k]
  const em = datos.emblemas.find((x) => x.id === id)
  if (!e || !em) throw new Error(`Falta la escena ${k} o el emblema ${id}.`)
  const cuerpo = `// GENERADO por scripts/destino/generarEscenasLanza.mjs desde «Piezas/Emblema Cine Lanza» de Design (escena ${k}: ${TXT[k][0]}). No se edita a mano: se vuelve a generar.
import type { ConfigLanza } from '../cineLanza'

const config: ConfigLanza = {
  tipo: 'lanza',
  id: ${JSON.stringify(id)},
  nombre: ${JSON.stringify(em.nombre)},
  linea: ${JSON.stringify(em.linea)},
  bg: ${JSON.stringify(e.bg)},
  halo: ${JSON.stringify(e.halo)},
  frase: ${JSON.stringify(e.ph)},
  c1: ${JSON.stringify(e.c1)},
  c2: ${JSON.stringify(e.c2)},
  svg: ${JSON.stringify(e.s)},
}
export default config
`
  fs.writeFileSync(`${SALIDA}/${id}.ts`, cuerpo)
  generados.push(id)
}
console.log(`Escenas de Lanzarote generadas: ${generados.length} (${generados.join(', ')})`)

// Las animaciones (@keyframes lz…) de la pieza, tal cual.
const frames = html.split('\n').filter((l) => l.startsWith('@keyframes lz'))
fs.writeFileSync(`${SALIDA}/lanza.css`, `/* GENERADO por scripts/destino/generarEscenasLanza.mjs desde «Piezas/Emblema Cine Lanza» de Design. */\n${frames.join('\n')}\n`)
console.log(`Animaciones: ${frames.length}`)
