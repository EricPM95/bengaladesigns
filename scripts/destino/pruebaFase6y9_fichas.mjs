// La prueba de la Tanda 6y9, agente F: los textos de las fichas de Roma (P15) y los superlativos de los días escritos (P16).
//   node scripts/destino/pruebaFase6y9_fichas.mjs      (no necesita servidor)
// Da fallo si:
//   1. P15: alguna de las 11 correcciones no está en su sitio con su frase nueva, o alguna frase vieja sigue en algún dato servido
//      (fichas de detalle, data/pipeline_v2/roma.json, docs/roma_por_que.json, data/dias, data/destinations.json);
//   2. P15.10: la Piazza del Popolo ya no dice lo que decía (se deja como está);
//   3. P16: queda algún superlativo viejo en roma.json o roma_por_que.json, o falta el suavizado;
//   4. alguna historia comparte 15 palabras seguidas con su ficha (descripción, «Qué vas a ver», consejos o secretos);
//   5. los ficheros dejan de ser JSON válido, o la frase de la moneda de Trevi (que mira otra prueba) ha cambiado.
import fs from 'node:fs'
import path from 'node:path'
import { P15, P16 } from './corregirFichas6y9.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const DIR = 'data/pipeline_v2/detalle/roma/'
const FICHEROS_P16 = ['data/pipeline_v2/roma.json', 'docs/roma_por_que.json']

// ═══════════ 5. JSON válido ═══════════
const fichas = new Map()
const textoDe = new Map()
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  let j = null
  try { j = JSON.parse(leer(DIR + f)) } catch (e) { debe(false, '5 json', `${DIR + f} no es JSON válido: ${e.message}`) }
  if (j) for (const p of j.places) fichas.set(p.name, p)
  textoDe.set(DIR + f, leer(DIR + f))
}
for (const f of FICHEROS_P16) {
  try { JSON.parse(leer(f)) } catch (e) { debe(false, '5 json', `${f} no es JSON válido: ${e.message}`) }
  textoDe.set(f, leer(f))
}
// Todos los datos servidos (sin el archivo ni las fotos): para buscar las frases viejas.
const servidos = [...textoDe.keys()]
const recorre = (d) => {
  if (!fs.existsSync(d)) return
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name).split(path.sep).join('/')
    if (e.isDirectory()) { if (e.name !== 'archivo') recorre(p) } else if (p.endsWith('.json') && !servidos.includes(p) && !/_fotos/.test(p)) servidos.push(p)
  }
}
recorre('data/dias')
recorre('data/pipeline_v2')
if (fs.existsSync('data/destinations.json')) servidos.push('data/destinations.json')
const todo = new Map(servidos.map((f) => [f, textoDe.get(f) ?? leer(f)]))
const esc = (s) => JSON.stringify(s).slice(1, -1)
const aparece = (frase) => [...todo].filter(([, t]) => t.includes(esc(frase))).map(([f]) => f)

// ═══════════ 1. Las 11 correcciones ═══════════
for (const [fichero, antes, despues] of P15) {
  debe(textoDe.get(DIR + fichero).includes(esc(despues)), '1 p15', `${fichero}: falta la frase nueva: ${despues.slice(0, 70)}`)
  debe(aparece(antes).length === 0, '1 p15', `la frase vieja sigue en ${aparece(antes).join(', ')}: ${antes.slice(0, 70)}`)
}
const una = (nombre) => { const p = fichas.get(nombre); debe(!!p, '1 p15', `no está la ficha de ${nombre}`); return p ?? {} }
const todoDe = (p) => [p.description, ...(p.what_to_see ?? []), ...(p.tips ?? []), ...(p.secrets ?? [])].filter((x) => typeof x === 'string').join('\n')
{
  const pan = una('Panteón')
  debe(pan.secrets?.some((x) => /^El 21 de abril, el día del nacimiento de Roma, al mediodía.*se dice que lo diseñaron así\.$/.test(x)), '1.1', 'Panteón: el rayo no dice «se dice que lo diseñaron así»')
  const plaza = una('Plaza de San Pedro')
  const textoPlaza = todoDe(plaza)
  debe(/obelisco de 25 metros del centro lo trajo de Egipto el emperador Calígula/.test(plaza.description ?? '') && plaza.secrets?.some((x) => /^El obelisco central lo trajo de Egipto el emperador Calígula/.test(x)), '1.2', 'Plaza de San Pedro: las dos frases del obelisco no dicen solo que lo trajo Calígula de Egipto')
  debe(!/egipcio original|inscripción jeroglífica|único que nunca cayó|mandado tallar/.test(textoPlaza), '1.2', 'Plaza de San Pedro: queda algo de la contradicción del obelisco')
  const nav = una('Piazza Navona')
  debe(nav.secrets?.some((x) => /El agua llegó a la plaza en el siglo XVI, y Bernini la aprovechó para su fuente\./.test(x)), '1.3', 'Piazza Navona: falta la frase del agua')
  const ta = una('Largo di Torre Argentina')
  debe(!/Mussolini|batalla/.test(todoDe(ta)), '1.4', 'Torre Argentina: queda la frase de la batalla con Mussolini')
  debe((ta.secrets ?? []).length === 1, '1.4', 'Torre Argentina: tiene que quedar 1 secreto')
  const altar = una('Altar de la Patria')
  debe(!/toneladas/.test(todoDe(altar)) && (altar.what_to_see ?? []).some((x) => x === 'Las cuadrigas de bronce en la parte superior'), '1.5', 'Altar de la Patria: quedan las toneladas, o falta la línea de las cuadrigas')
  const cas = una("Castillo de Sant'Angelo")
  debe((cas.what_to_see ?? []).some((x) => /preso Benvenuto Cellini; junto al puente fue ejecutada Beatrice Cenci en 1599/.test(x)), '1.6', 'Castillo: falta Cellini preso y Cenci ejecutada junto al puente en 1599')
  debe(!/según la tradición, Beatrice Cenci|Cenci[^.]{0,40}\bpresa\b|\bpresa\b[^.]{0,40}Cenci/.test(todoDe(cas)), '1.6', 'Castillo: dice que Cenci estuvo presa')
  const sp = una('Basílica de San Pedro')
  debe(/la tumba del apóstol Pedro está bajo la basílica, en la necrópolis/.test(sp.description ?? '') && !/Grutas Vaticanas con la tumba de San Pedro/.test(sp.description ?? ''), '1.7', 'San Pedro: la tumba del apóstol no está «bajo la basílica, en la necrópolis»')
  const bor = una('Galería Borghese')
  debe(/le confiscaron sus 100 cuadros \(incluyendo los Caravaggios\)/.test(todoDe(bor)) && !/impago|impuestos/.test(todoDe(bor)), '1.8', 'Galería Borghese: d\'Arpino sin «le confiscaron sus cuadros» o con el motivo')
  const ojo = una('Ojo de la Cerradura del Aventino')
  debe(/Se cuenta que alineó la cerradura, los setos y la cúpula a propósito\./.test(todoDe(ojo)), '1.9', 'Ojo de la Cerradura: falta «Se cuenta que alineó…»')
  const tras = una('Iglesia de Santa Maria in Trastevere')
  debe(/^Una de las iglesias más antiguas de Roma dedicadas a la Virgen María/.test(tras.description ?? '') && !/primera dedicada|primera iglesia mariana/.test(todoDe(tras)), '1.11', 'Santa Maria in Trastevere: sigue diciendo «la primera»')
  const cle = una('Basílica de San Clemente')
  debe(!/sangre de toro/.test(todoDe(cle)) && /banquetes rituales exactamente debajo/.test(todoDe(cle)), '1.12', 'San Clemente: queda la sangre de toro o faltan los banquetes rituales')
  const hay = [...todo.values()].some((t) => /sangre de toro/.test(t))
  debe(!hay, '1.12', 'queda «sangre de toro» en algún dato')
}
// 2. Piazza del Popolo: no se toca
{
  const pop = [...fichas.values()].find((p) => /Popolo/.test(p.name))
  debe(!!pop && /álamos/.test(todoDe(pop)), '2 popolo', 'Piazza del Popolo: la ficha ya no habla de los álamos (se dejaba como estaba)')
}

// ═══════════ 3. P16: superlativos ═══════════
for (const [antes, despues] of P16) {
  for (const f of FICHEROS_P16) {
    debe(!textoDe.get(f).includes(esc(antes)), '3 p16', `${f}: sigue el superlativo viejo: ${antes}`)
  }
  debe(FICHEROS_P16.some((f) => textoDe.get(f).includes(esc(despues))), '3 p16', `falta el texto suavizado: ${despues}`)
}
for (const f of FICHEROS_P16) {
  const t = textoDe.get(f)
  debe(!/La fuente más famosa del mundo|La escalinata más famosa del mundo|La mejor colección de Bernini|puerto romano mejor conservado del mundo|la mejor colección de Bernini del mundo/.test(t), '3 p16', `${f}: queda alguno de los cinco superlativos de Eric`)
}
{
  const t = textoDe.get('data/pipeline_v2/roma.json')
  debe(/mayor cúpula de hormigón sin armar del mundo/.test(textoDe.get(DIR + 'centro_historico.json')), '3 p16', 'la cúpula del Panteón («la mayor cúpula de hormigón sin armar del mundo») se queda')
  debe(/una de las fachadas más copiadas del mundo/.test(t), '3 p16', 'el Gesù ya decía «una de las fachadas más copiadas del mundo» y se queda así')
  // Trevi: la frase de la moneda que mira la prueba 6y6 sigue.
  const trevi = t.match(/Una de las fuentes más famosas del mundo, y desde la plaza se ve gratis\.[^"]*/)
  debe(!!trevi && /moneda/.test(trevi[0]), '5 trevi', 'Trevi: el texto suavizado ya no lleva la frase de la moneda')
}

// ═══════════ 4. Ninguna historia comparte 15 palabras seguidas con su ficha ═══════════
const norma = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim().split(' ').filter(Boolean)
const N = 15
let conHistoria = 0
for (const p of fichas.values()) {
  if (typeof p.historia !== 'string') continue
  conHistoria++
  const h = norma(p.historia)
  const otros = new Set()
  const w = norma(todoDe(p))
  for (let i = 0; i + N <= w.length; i++) otros.add(w.slice(i, i + N).join(' '))
  let comparte = null
  for (let i = 0; i + N <= h.length && !comparte; i++) { const s = h.slice(i, i + N).join(' '); if (otros.has(s)) comparte = s }
  debe(!comparte, '4 historias', `${p.name}: la historia comparte ${N} palabras seguidas con su ficha: «${comparte}»`)
}
debe(conHistoria === 31, '4 historias', `hay ${conHistoria} historias (deben ser 31)`)

if (fallos.length) {
  console.log(`FALLOS: ${fallos.length} de ${comprobaciones} comprobaciones`)
  for (const f of fallos) console.log(` - [${f.regla}] ${f.texto}`)
  process.exit(1)
}
console.log(`OK: 0 fallos en ${comprobaciones} comprobaciones`)
