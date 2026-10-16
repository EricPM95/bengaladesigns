// «Por qué te lo recomendamos» en Roma: los textos son nuestros (campo `por_que_recomendamos`), iguales a los del documento aprobado, sin logística de la ruta, y la ficha los lee sin IA.
//   node scripts/destino/pruebaPorQueRoma.mjs
import fs from 'node:fs'

let comprobaciones = 0
const fallos = []
const debe = (cond, donde, texto) => {
  comprobaciones++
  if (!cond) fallos.push(`[${donde}] ${texto}`)
}
const leer = (ruta) => fs.readFileSync(ruta, 'utf8')

/* ── El documento aprobado ── */
const doc = new Map()
for (const m of leer('docs/dias/POR_QUE_RECOMENDAMOS_ROMA.md').matchAll(/^\*\*(.+?):\*\* (.+)$/gm)) doc.set(m[1], m[2].trim())
doc.delete('Regla')
debe(doc.size === 95, 'documento', `el documento trae 95 sitios: ${doc.size}`)

/* ── Los datos ── */
const roma = JSON.parse(leer('data/pipeline_v2/roma.json'))
const sitios = roma.places
const nombres = sitios.map((s) => s.name)
debe(new Set(nombres).size === nombres.length, 'datos', 'ningún sitio repetido')
// Plaza Colonna y Piazza Colonna eran el mismo sitio dos veces: queda uno solo (el de las rutas), con el texto de «Plaza Colonna» y el otro nombre como alias.
debe(!nombres.includes('Plaza Colonna') && nombres.includes('Piazza Colonna'), 'colonna', 'queda solo Piazza Colonna (el que sale en las rutas)')
const colonna = sitios.find((s) => s.name === 'Piazza Colonna')
debe(colonna?.search_aliases?.includes('plaza colonna'), 'colonna', '«plaza colonna» sigue sirviendo para buscarla (alias)')
debe(colonna?.por_que_recomendamos === doc.get('Plaza Colonna'), 'colonna', 'Piazza Colonna lleva el texto de «Plaza Colonna»')
debe(sitios.length === 94, 'datos', `95 nombres del documento = 94 sitios (Colonna es una sola vez): ${sitios.length}`)
for (const sitio of sitios) {
  const esperado = sitio.name === 'Piazza Colonna' ? doc.get('Plaza Colonna') : doc.get(sitio.name)
  debe(typeof sitio.por_que_recomendamos === 'string' && sitio.por_que_recomendamos === esperado, 'texto', `${sitio.name}: su texto es el del documento, palabra por palabra`)
}
const sinTexto = sitios.filter((s) => !s.por_que_recomendamos).map((s) => s.name)
debe(sinTexto.length === 0, 'texto', `ningún sitio sin texto: ${sinTexto.join(', ')}`)

/* ── Ninguno habla de la ruta ── */
const LOGISTICA = [/desde aqu[ií].{0,60}(minutos|metros|cerca|a un paso)/i, /\ba (un|dos|tres|cuatro|cinco|diez|quince|veinte|\d+) (min|metros|m\b|km|minutos)/i, /\d+ minutos (a pie|andando|caminando)/i, /(minutos|metros) (de|desde) /i, /de camino/i, /en tu ruta/i, /\bantes de (ir|seguir|llegar)/i, /despu[eé]s de (ir|visitar|ver)/i, /ruta de hoy/i, /a un paso de/i, /de paso/i, /sigue (hacia|por)/i]
debe(['Desde aquí el Panteón está a cinco minutos.', 'Está a 5 minutos andando del Coliseo.', 'Es el último paso de la ruta de hoy.'].every((ejemplo) => LOGISTICA.some((r) => r.test(ejemplo))), 'logistica', 'el detector coge la logística de la ruta (así que sus ceros valen algo)')
for (const sitio of sitios) {
  const t = sitio.por_que_recomendamos ?? ''
  const malo = LOGISTICA.find((r) => r.test(t))
  debe(!malo, 'logistica', `${sitio.name}: no habla de la ruta (${malo})`)
}

/* ── Las rutas no se rompen: nada apunta ya al sitio que se quitó ── */
const todo = JSON.stringify(roma)
debe(!/"lugar": ?"Plaza Colonna"/.test(todo) && !todo.includes('"Plaza Colonna":'), 'rutas', 'ningún día ni lista usa ya «Plaza Colonna» como sitio')
const lugaresDeLasListas = new Set([...leer('data/dias/roma/listas.json').matchAll(/"lugar": "([^"]+)"/g)].map((m) => m[1]))
debe(!lugaresDeLasListas.has('Plaza Colonna') && lugaresDeLasListas.has('Piazza Colonna'), 'rutas', 'las listas escritas usan Piazza Colonna')
for (const ruta of ['data/pipeline_v2/detalle/roma/centro_historico.json', 'data/pipeline_v2/kit/roma/coordenadas.json', 'data/pipeline_v2/kit/roma/popularidad.json']) {
  const t = leer(ruta)
  debe(t.includes('Piazza Colonna') && !/"(name|Plaza Colonna)": ?"?Plaza Colonna/.test(t) && !t.includes('"Plaza Colonna": {'), 'rutas', `${ruta}: la ficha/kit va a nombre de Piazza Colonna`)
}

/* ── La ficha lee el campo, sin IA ── */
const servidor = leer('server/index.js')
debe(servidor.includes('por_que_recomendamos: typeof place.por_que_recomendamos'), 'ficha', 'el servidor da el campo en el catálogo del destino')
const hoja = leer('src/components/route/dayDetail/StopDetailSheet.tsx')
debe(hoja.includes('porQueRecomendamosDe(') && hoja.includes('whyRecommended: porQueNuestro'), 'ficha', 'la ficha pone el texto nuestro en «Por qué te lo recomendamos»')

/* ── El pedido de la IA para los sitios que no son nuestros ── */
const pedido = /"why_recommended": "([^"\n]*(?:\\"[^"\n]*)*)"/.exec(servidor)?.[1] ?? ''
debe(/NEVER route logistics/.test(pedido) && /unique or iconic/.test(pedido), 'ia', 'el pedido dice por qué vale la pena el sitio y prohíbe la logística de la ruta')
debe(servidor.includes('`describe2:${') && !servidor.includes('`describe:${'), 'ia', 'los textos viejos guardados de la IA ya no se leen (clave nueva «describe2:»)')

/* ── El servidor de verdad (si está en marcha) ── */
const url = process.env.SERVIDOR ?? process.env.API_URL
if (url) {
  try {
    const r = await fetch(`${url}/api/destination-places`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) })
    const cuerpo = await r.json()
    const lugares = (cuerpo.places ?? []).filter((p) => p.kind === 'place')
    debe(lugares.length === 94 && lugares.every((p) => typeof p.por_que_recomendamos === 'string' && p.por_que_recomendamos.length > 20), 'servidor', `el servidor da los 94 textos: ${lugares.filter((p) => p.por_que_recomendamos).length}/${lugares.length}`)
    debe(lugares.find((p) => p.name === 'Coliseo')?.por_que_recomendamos === doc.get('Coliseo'), 'servidor', 'el del Coliseo llega tal cual')
  } catch (e) {
    debe(false, 'servidor', `no responde: ${e.message}`)
  }
}

console.log(`\nPor qué te lo recomendamos en Roma: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log('  FALLO ' + f)
process.exit(fallos.length ? 1 : 0)
