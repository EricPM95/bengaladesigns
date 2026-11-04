// LZ2b-1 (agente A, apartado 1): pasa FICHAS_LANZAROTE.json (what_to_see, tips, aparcar) y las 12 historias de HISTORIAS_LANZAROTE.md
// a data/pipeline_v2/detalle/lanzarote/ (como detalle/roma/). por_que_recomendamos y description van en lanzarote.json (lo hace lanzaroteDatos.mjs).
//   node scripts/destino/pasarFichasLanzarote.mjs      (se puede repetir; sobrescribe los ficheros)
// De cada historia se coge SOLO el texto (ni el título, ni las líneas «> Comprobar», ni dudas y fuentes del final).
import fs from 'node:fs'

const DIR = 'data/pipeline_v2/detalle/lanzarote/'
const fichas = JSON.parse(fs.readFileSync('docs/destinos/lanzarote/FICHAS_LANZAROTE.json', 'utf8'))
delete fichas._nota
const catalogo = JSON.parse(fs.readFileSync('data/pipeline_v2/lanzarote.json', 'utf8'))
const doc = fs.readFileSync('docs/destinos/lanzarote/HISTORIAS_LANZAROTE.md', 'utf8')

const HISTORIA_DE = {
  1: 'montanas_del_fuego', 2: 'jameos_del_agua', 3: 'cueva_de_los_verdes', 4: 'mirador_del_rio', 5: 'fundacion_cesar_manrique', 6: 'jardin_de_cactus',
  7: 'la_geria_y_sus_bodegas', 8: 'el_golfo_y_el_charco_de_los_clicos', 9: 'teguise', 10: 'haria_y_la_casa_museo_cesar_manrique', 11: 'casa_museo_del_campesino', 12: 'LA_GRACIOSA',
}
const cuerpo = doc.split(/^## Dudas que quedan/m)[0]
const trozos = cuerpo.split(/^## (\d+)\. .*$/m)
const historias = {}
for (let i = 1; i < trozos.length; i += 2) {
  const parrafos = []
  for (const linea of trozos[i + 1].split(/\r?\n/)) {
    if (/^>/.test(linea) || /^---\s*$/.test(linea)) break
    parrafos.push(linea.trim())
  }
  historias[Number(trozos[i])] = parrafos.join('\n').replace(/\n{2,}/g, '\n\n').trim()
}
if (Object.keys(historias).length !== 12) throw new Error(`Salen ${Object.keys(historias).length} historias, no 12`)
const historiaDeId = Object.fromEntries(Object.entries(HISTORIA_DE).map(([n, id]) => [id, historias[n]]))

const porZona = new Map()
for (const p of catalogo.places) {
  const f = fichas[p.id]
  if (!f) throw new Error(`Sin ficha: ${p.id}`)
  const entrada = { name: p.name, description: f.description, what_to_see: f.what_to_see, aparcar: f.aparcar, aparcar_verificar: f.aparcar_verificar === true, tips: f.tips }
  if (historiaDeId[p.id]) entrada.historia = historiaDeId[p.id]
  if (!porZona.has(p.zone)) porZona.set(p.zone, [])
  porZona.get(p.zone).push(entrada)
}
// La Graciosa no es un sitio del catálogo (es una excursión de día entero): su historia va en su propia ficha.
porZona.set('excursiones', [{ name: 'La Graciosa', what_to_see: [], tips: [], historia: historiaDeId.LA_GRACIOSA }])

fs.mkdirSync(DIR, { recursive: true })
for (const [zona, places] of porZona) fs.writeFileSync(`${DIR}${zona}.json`, `${JSON.stringify({ zone: zona, places }, null, 2)}\n`)
console.log(`Detalle de Lanzarote: ${[...porZona.values()].reduce((a, b) => a + b.length, 0)} fichas en ${porZona.size} ficheros; historias: ${Object.values(historiaDeId).filter(Boolean).length}`)
