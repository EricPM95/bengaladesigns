// La prueba de la Tanda V37 (parte 1): «SELLO» → «MEDALLA» EN LOS TEXTOS. Node puro, sin navegador.
// Regla de Eric: en el código `sello` es la MEDALLA de un destino (bronce → diamante); el sello del PASAPORTE es otra cosa.
// En los textos que ve la gente, la medalla se llama siempre «medalla». «Sello» queda SOLO para el pasaporte.
//
// Recorre src/, server/, shared/, api/, data/logros/ y data/pase/ y mira los TEXTOS VISIBLES: las cadenas de texto ('…', "…", `…`)
// y el texto de JSX (lo que va entre > y <), y los valores de los JSON. NO mira los comentarios ni los identificadores
// (variables, funciones, tipos, claves como `sello`, `sellos`, `suma_sello`, `roma|sello|roma:plata`, nombres de archivo).
//   node scripts/destino/pruebaV37_textos.mjs
import fs from 'node:fs'
import path from 'node:path'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}

const RAIZ = process.cwd()
const CARPETAS = ['src', 'server', 'shared', 'api', 'data/logros', 'data/pase']

/* ── LISTA BLANCA: lo que SÍ puede decir «sello» porque es del PASAPORTE (o no lo ve la gente) ──────────────────────────────
   Cada entrada: { archivo: regex del camino, frase: regex del texto (opcional: sin ella vale todo el archivo), porque }.
   Si algo nuevo del pasaporte dice «sello», se añade aquí CON su porqué; si es una medalla, se cambia el texto. */
const BLANCA = [
  // Pantallas del pasaporte: todo lo que dicen es del sello estampado de un viaje.
  { archivo: /^src\/components\/logros\/pantallas\/PasaporteScreen\.tsx$/, porque: 'la hoja del pasaporte: «Tu sello de Roma aún no está», «te deja su sello», «3 SELLOS»…' },
  { archivo: /^src\/components\/logros\/pantallas\/mundo\//, porque: 'el globo y el sello del pasaporte («Sello de Lanzarote, por conseguir»)' },
  { archivo: /^src\/components\/logros\/pantallas\/perfil\/TarjetaPasaporte\.tsx$/, porque: 'la tarjeta «Mi pasaporte» del Perfil: sus sellos asoman' },
  { archivo: /^src\/components\/logros\/pantallas\/DondeHasEstado\.tsx$/, frase: /sellos? de recuerdo/i, porque: '«sello de recuerdo» es del pasaporte' },
  { archivo: /^src\/components\/logros\/momentos\/hoja\/AntesDelViaje\.tsx$/, frase: /sello en (tu|el) pasaporte|Tu sello en el pasaporte/i, porque: 'el sello del pasaporte que te llevas de la ciudad' },
  { archivo: /^src\/components\/logros\/momentos\/ResumenViaje\.tsx$/, frase: /^(Ver|Estampar) mi sello$/, porque: 'los botones que estampan o enseñan el sello del pasaporte' },
  { archivo: /^src\/components\/pase\/lista\/disenoLista\.ts$/, frase: /llenando de sellos con cada viaje/, porque: '«Tu pasaporte de viajero: se va llenando de sellos» es del pasaporte' },
  { archivo: /^src\/components\/route\/hoy\/v2\/HoyAntesV2\.tsx$/, frase: /^Logros y sellos$|pasaporte de sellos/, porque: 'HOY antes del viaje: «llena tu pasaporte de sellos» (y su título, que resume esa frase)' },
  { archivo: /^src\/components\/logros\/pantallas\/perfil\/api\.ts$/, frase: /Sellos, billetes y una ruta/, porque: 'la frase del rango de EXP (sellos del pasaporte y billetes), no una medalla' },
  // Pasaporte en datos del servidor (el texto del panel «3 países · 5 sellos»: los sellos del pasaporte).
  { archivo: /^server\/panel\/calculosUsuarios\.js$/, frase: /sellos?/i, porque: '«3 países · 5 sellos» del panel: el pasaporte' },
  // Herramientas internas que no ve la gente.
  { archivo: /^src\/dev\//, porque: 'menús y datos de desarrollo (no se ven en la app de verdad)' },
  { archivo: /^src\/components\/logros\/sonidos\//, porque: 'el estudio de sonidos del administrador: la tarjeta «Sello del pasaporte» y su visor' },
  { archivo: /^src\/lib\/sonidos(\.ts|\/)/, porque: 'el estudio de sonidos del administrador: describe la partitura `sello_pasaporte`' },
  // Estampado del pasaporte (lógica y copia local): sus textos son del pasaporte.
  { archivo: /^src\/lib\/(selloEstampado|tripPersistence|viajeEnDirecto|datosDelViajero|eliminarViajeNube)\.ts$/, porque: 'el sello estampado del pasaporte (viaje, copia y nube)' },
  { archivo: /^src\/lib\/logrosDemo_mundo\.ts$/, porque: 'datos de demo del pasaporte' },
]

const hayLaPalabra = (t) => /\bsellos?\b/i.test(t)

// Texto visible: lo que tiene pinta de frase o de rótulo, no de clave/identificador.
//   - una sola palabra en minúscula ('sello', 'sellos', 'suma_sello') = clave → no cuenta
//   - claves con | : _ entre medias (roma|sello|roma:plata, ej|sello|…) → no cuentan
function esTextoVisible(t) {
  const sin = t.replace(/\$\{[^}]*\}/g, ' ').trim() // fuera lo de dentro de ${…}
  if (!hayLaPalabra(sin)) return false
  if (/^[a-z0-9_.:|\-\[\]="' ]+$/.test(sin) && !/\s/.test(sin)) return false // una palabra o clave
  if (/^[\w.|:\-]+$/.test(sin)) return false // clave sin espacios (ej|sello|roma:plata)
  if (/(^|[\s|])\|?sello\|/.test(t)) return false // clave con tubos (`${destino}|sello|${id}`, `sello|${destino}|${id}`)
  if (/^sello(:(\$\{[^}]*\}|[\w.-]*))+$/.test(t.trim())) return false // (V79) clave interna de ficha «sello:${destino}:${id}» (sin espacios); una frase con espacios sí cuenta
  if (/^window\.__demo /.test(sin)) return false // la ayuda de la consola de desarrollo (window.__demo)
  if (/^\[[^\]]*\]/.test(sin)) return false // selector CSS ([data-balda="sellos"] button)
  if (/^[\w./:-]*\bSello\b[\w./:-]*$/.test(sin)) return false // ruta de import ('./Sello')
  return /\s/.test(sin) || /^[A-ZÁÉÍÓÚ]/.test(sin)
}

/** Saca de un archivo los textos con «sello»: [{ linea, texto }]. Sin comentarios. `esJson` y `esTsx` cambian lo que se mira. */
export function textosConSello(src, { esJson = false, esTsx = false } = {}) {
  const out = []
  const n = src.length
  let i = 0
  let linea = 1
  const anotar = (t, ln) => {
    if (esTextoVisible(t)) out.push({ linea: ln, texto: t.replace(/\s+/g, ' ').trim().slice(0, 160) })
  }
  while (i < n) {
    const c = src[i]
    const d = src[i + 1]
    if (c === '\n') { linea++; i++; continue }
    if (!esJson && c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue }
    if (!esJson && c === '/' && d === '*') {
      i += 2
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') linea++; i++ }
      i += 2
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      // (una comilla suelta de un apóstrofo en JSX/regex no pasa aquí con frases en español sin apóstrofos; ver el cierre por salto de línea)
      const q = c
      const ln = linea
      let j = i + 1
      let s = ''
      let profundidad = 0
      while (j < n) {
        const x = src[j]
        if (x === '\\') { s += x + src[j + 1]; j += 2; continue }
        if (q === '`' && x === '$' && src[j + 1] === '{') { profundidad++; s += '${'; j += 2; continue }
        if (q === '`' && profundidad > 0 && x === '}') { profundidad--; s += x; j++; continue }
        if (q === '`' && profundidad > 0) { if (x === '\n') linea++; s += x; j++; continue }
        if (x === q) break
        if (x === '\n') { linea++; if (q !== '`') break }
        s += x
        j++
      }
      anotar(s, ln)
      i = j + 1
      continue
    }
    if (esTsx && c === '>' && src[i - 1] !== '=') {
      // texto de JSX: de > hasta el siguiente < (si en medio hay código, no es texto)
      let j = i + 1
      let s = ''
      let llaves = 0
      const ln = linea
      while (j < n && src[j] !== '<' && src[j] !== '>' && src[j] !== ';') {
        if (src[j] === '{') llaves++
        else if (src[j] === '}') llaves--
        if (src[j] === '\n') linea++
        s += src[j]
        j++
      }
      if (j < n && src[j] === '<' && llaves === 0) {
        const texto = s.replace(/\{[^{}]*\}/g, ' ').replace(/\s+/g, ' ').trim()
        if (texto && !/[=()]|\/\*|\/\//.test(texto)) anotar(texto, ln)
      }
      i = j
      continue
    }
    i++
  }
  return out
}

function archivos(dir, acumulado = []) {
  if (!fs.existsSync(dir)) return acumulado
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) archivos(p, acumulado)
    else if (/\.(ts|tsx|js|jsx|mjs|json)$/.test(e.name)) acumulado.push(p)
  }
  return acumulado
}

const enListaBlanca = (rel, texto) => BLANCA.some((b) => b.archivo.test(rel) && (!b.frase || b.frase.test(texto)))

/* ── 0. El detector se prueba a sí mismo: tiene que cazar «Tu sello de Roma» y dejar pasar lo del pasaporte y las claves ── */
{
  const malo = "const a = 'Tu sello de Roma, bronce'\nconst b = `Tu sello ${n.de} · ${grado}`\nconst c = 'Sellos de ciudad'\n"
  const cazados = textosConSello(malo)
  debe(cazados.length === 3, 'detector', `caza «Tu sello de Roma», la plantilla «Tu sello \${n.de}» y «Sellos de ciudad» (${cazados.length} de 3)`)
  const bueno = "const k = 'sello'\nconst l = 'roma|sello|roma:plata'\nconst m = 'suma_sello'\n// Tu sello de Roma (un comentario)\n/* Sellos de ciudad */\nimport { Sello } from './Sello'\nconst o = 'Medalla de Roma'\n"
  debe(textosConSello(bueno).length === 0, 'detector', 'deja pasar claves, comentarios, imports y «Medalla de Roma»')
  debe(textosConSello("const k = `sello:${d}:${i}`\nconst z = 'sello:roma:vaticano'\n").length === 0, 'detector', '(V79) deja pasar la clave interna de ficha sello:${destino}:${id}')
  debe(textosConSello("const t = 'sello: Tu sello de Roma'\nconst u = `Tu sello:${n}`\n").length === 2, 'detector', '(V79) caso negativo: un texto visible con «sello» sigue cazado aunque lleve «sello:»')
  const jsx = 'export const X = () => <b>Tus sellos de Roma</b>\nconst y = () => <i>{sello.n} · {sello.grado}</i>\n'
  const cj = textosConSello(jsx, { esTsx: true })
  debe(cj.length === 1 && /Tus sellos de Roma/.test(cj[0].texto), 'detector', `caza el texto de JSX «Tus sellos de Roma» y no las llaves con código (${JSON.stringify(cj)})`)
  const json = '{ "nombre": "Primer sello", "clave": "sello", "sellos": [] }'
  debe(textosConSello(json, { esJson: true }).length === 1, 'detector', 'en un JSON caza el valor «Primer sello» y no las claves')
}

/* ── 1. El recorrido de verdad ──────────────────────────────────────────────────────────────────────────────────────────────── */
const encontrados = [] // { rel, linea, texto } fuera de la lista blanca
const dejados = new Map() // archivo → n de textos que se quedan como sello (lista blanca)
let revisados = 0
for (const carpeta of CARPETAS) {
  for (const p of archivos(path.join(RAIZ, carpeta))) {
    const rel = path.relative(RAIZ, p).replace(/\\/g, '/')
    const src = fs.readFileSync(p, 'utf8')
    if (!/sello/i.test(src)) { revisados++; continue }
    revisados++
    for (const t of textosConSello(src, { esJson: p.endsWith('.json'), esTsx: p.endsWith('.tsx') })) {
      if (enListaBlanca(rel, t.texto)) dejados.set(rel, (dejados.get(rel) ?? 0) + 1)
      else encontrados.push({ rel, ...t })
    }
  }
}
debe(revisados > 300, 'recorrido', `se recorrieron los archivos de la app (${revisados})`)
debe(encontrados.length === 0, 'sello', `ningún texto visible dice «sello» fuera del pasaporte (${encontrados.length} fuera de la lista blanca)`)
for (const e of encontrados.slice(0, 60)) console.log(`    ${e.rel}:${e.linea}  «${e.texto}»`)

/* ── 2. Lo nuevo dice «medalla» donde toca ─────────────────────────────────────────────────────────────────────────────────── */
const leer = (f) => fs.readFileSync(f, 'utf8')
const pantallas = leer('src/components/logros/momentos/pantallas.tsx')
debe(/Tu medalla \$\{n\.de\}, \$\{grado\}/.test(pantallas) && /Tu medalla \$\{n\.de\} · \$\{grado\}/.test(pantallas), 'medalla', 'la animación dice «Tu medalla {de Roma}, {grado}» y «Tu medalla {de Roma} · {grado}»')
const viajero = JSON.parse(leer('data/logros/viajero.json'))
const textosViajero = JSON.stringify(viajero)
debe(/Primera medalla/.test(textosViajero) && !/Primer sello/.test(textosViajero), 'medalla', 'viajero.json: «Primera medalla»')
debe(/Consigue una medalla de diamante/.test(textosViajero) && /Consigue la medalla de oro en 3 ciudades/.test(textosViajero) && /Consigue la medalla de diamante en 3 ciudades/.test(textosViajero), 'medalla', 'viajero.json: las tres descripciones de «Consigue … medalla …»')
const disena = leer('src/components/pase/lista/disenoLista.ts')
debe(/Las medallas de Roma y del Vaticano/.test(disena) && /Consigue la medalla de cada destino que visitas/.test(disena), 'medalla', 'disenoLista.ts: «Las medallas de Roma y del Vaticano» y «Consigue la medalla de cada destino que visitas»')
// Lo del pasaporte SIGUE diciendo sello.
debe(/Se va llenando de sellos con cada viaje/.test(disena), 'pasaporte', 'la frase del pasaporte («Se va llenando de sellos con cada viaje») se queda')
debe(/Estampar mi sello/.test(leer('src/components/logros/momentos/ResumenViaje.tsx')), 'pasaporte', '«Estampar mi sello» se queda (es del pasaporte)')
debe(/sello de recuerdo/.test(leer('src/components/logros/pantallas/DondeHasEstado.tsx')), 'pasaporte', '«sello de recuerdo» se queda (es del pasaporte)')

console.log(`\n  Textos que se QUEDAN como «sello» por ser del pasaporte o de herramientas internas: ${[...dejados.values()].reduce((a, b) => a + b, 0)} en ${dejados.size} archivos`)
console.log(`\nPrueba de la Tanda V37 (textos): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
