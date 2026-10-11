/**
 * Autor y licencia de las fotos de Wikipedia / Wikimedia Commons que sirve la app (Tanda 6z6f, pregunta 1).
 *
 * Se pide UNA VEZ por foto a la API de Commons y se guarda en data/dias/<destino>/_fotos_wikimedia.json; la app no
 * consulta a Wikimedia cuando alguien abre una ficha. Reanudable e idempotente: lo que ya está en el JSON no se repite
 * (salvo con --rehacer). Educado: una pausa entre peticiones.
 *
 * Uso:   node scripts/destino/creditosWikimedia.mjs [--destino roma] [--servidor http://localhost:8787] [--rehacer] [--pausa 1200]
 *
 * Necesita un servidor de la app encendido (para saber qué foto sirve cada lugar: propia > Unsplash > Wikipedia). No usa Supabase directamente.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def
}
const DESTINO = opt('destino', 'roma')
const SERVIDOR = opt('servidor', 'http://localhost:8787')
const PAUSA = Number(opt('pausa', '1200'))
const REHACER = args.includes('--rehacer')
const UA = 'ViajesBengala/1.0 (route planner; contacto: bengala.ingresos@gmail.com) creditosWikimedia.mjs'
const SALIDA = join(ROOT, 'data', 'dias', DESTINO, '_fotos_wikimedia.json')
const QUE_ES =
  'Autor y licencia de las fotos de Wikipedia / Wikimedia Commons que la app enseña cuando no hay foto propia ni de Unsplash. ' +
  'Se piden UNA vez a la API de Commons con scripts/destino/creditosWikimedia.mjs (la app no consulta a Wikimedia al abrir una ficha). ' +
  'Las de dominio público (dominio_publico: true) no llevan línea de crédito. Las de "sin_autor" no se han podido atribuir: hay que cambiar la foto.'

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- Sitios con la foto rechazada (Tanda 6y3) ----------
// `fotos_rechazadas` de _fotos.json es la lista de sitios que van sin foto: su foto de Wikipedia no se acredita ni se vuelve a añadir aquí
// (aunque un servidor viejo aún la sirva). Mismo criterio que `fotoOculta` de server/engine/writtenDays.js (vale también para «X (noche)»).
const FOTOS_JSON = join(ROOT, 'data', 'dias', DESTINO, '_fotos.json')
const RECHAZADAS = new Set(existsSync(FOTOS_JSON) ? (JSON.parse(readFileSync(FOTOS_JSON, 'utf8')).fotos_rechazadas ?? []).map((r) => r.lugar) : [])
const estaRechazada = (lugar) => RECHAZADAS.has(lugar) || RECHAZADAS.has(String(lugar).replace(/\s*\(noche\)$|\s+de noche$/i, ''))

// ---------- Qué lugares hay y qué foto sirve el servidor ----------
function nombresDelDestino() {
  const d = JSON.parse(readFileSync(join(ROOT, 'data', 'pipeline_v2', `${DESTINO}.json`), 'utf8'))
  const names = new Set()
  for (const p of d.places ?? []) {
    names.add(p.name)
    if (p.search_en_fuera) names.add(`${p.name} (por fuera)`)
    if (p.search_en_dentro) names.add(`${p.name} (por dentro)`)
  }
  for (const k of ['night_experiences', 'zone_walks', 'evening_blocks']) for (const x of d[k] ?? []) names.add(x.name)
  for (const o of d.excursions?.options ?? []) names.add(o.name)
  for (const j of d.joyas ?? []) names.add(typeof j === 'string' ? j : j.name)
  return [...names].filter((n) => !estaRechazada(n))
}

/** En qué días (de listas.json) sale un lugar, para decirle al usuario dónde cambiar la foto. */
function paradasDe(lugar) {
  const file = join(ROOT, 'data', 'dias', DESTINO, 'listas.json')
  if (!existsSync(file)) return ''
  const dias = JSON.parse(readFileSync(file, 'utf8')).dias ?? {}
  const base = lugar.replace(/ \(por (fuera|dentro)\)$/, '')
  const ids = Object.entries(dias)
    .filter(([, day]) => {
      const s = JSON.stringify(day)
      return s.includes(`"${base}"`) || s.includes(`"${lugar}"`)
    })
    .map(([id]) => id)
  return ids.length ? `días ${ids.join(', ')}` : 'ningún día escrito (solo pool / ficha)'
}

/** Nombre del fichero de Commons a partir de la URL de la miniatura (…/thumb/a/ab/Nombre.jpg/330px-Nombre.jpg). */
export function archivoDeUrl(url) {
  const u = new URL(url)
  const partes = u.pathname.split('/').filter(Boolean)
  const i = partes.indexOf('thumb')
  const crudo = i >= 0 ? partes[i + 3] : partes[partes.length - 1]
  return crudo ? decodeURIComponent(crudo) : null
}

async function fotoDeWikipedia(name) {
  const r = await fetch(`${SERVIDOR}/api/place-photo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, city: DESTINO === 'roma' ? 'Roma' : DESTINO }) })
  const j = await r.json()
  return j.photo_source === 'wikipedia' && j.photo_url ? j.photo_url : null
}

// ---------- Commons ----------
function textoPlano(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

const SIN_AUTOR = /^(unknown|desconocid|anonymous|anónim|anonim|not specified|n\/a|\?+)/i
const esDominioPublico = (meta) => {
  const lic = `${meta.LicenseShortName?.value ?? ''} ${meta.License?.value ?? ''} ${meta.UsageTerms?.value ?? ''}`
  return meta.Copyrighted?.value === 'False' || /public domain|^\s*pd\b|\bpd-|cc0|cc-zero|dominio p/i.test(lic)
}

async function pedirCommons(archivo) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(`File:${archivo}`)}&prop=imageinfo&iiprop=extmetadata|url&format=json&formatversion=2`
  for (let intento = 0; intento < 4; intento++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (r.status === 429 || r.status >= 500) {
      await pausa(5000 * (intento + 1))
      continue
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const page = (await r.json())?.query?.pages?.[0]
    const info = page?.imageinfo?.[0]
    if (!info) return null
    return { meta: info.extmetadata ?? {}, pagina: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(archivo)}` }
  }
  throw new Error('Commons no responde')
}

function entradaDe(archivo, lugares, datos) {
  const { meta, pagina } = datos
  const pd = esDominioPublico(meta)
  // (Frases que pone Commons alrededor del nombre: se deja solo el nombre.)
  const autor = textoPlano(meta.Artist?.value)
    .replace(/^The original uploader was (.+?) at [A-Za-z]+ Wikipedia\.?$/i, '$1')
    .replace(/^No machine-readable author provided\.\s*(.+?) assumed.*$/i, '$1')
    .trim()
  const licencia = textoPlano(meta.LicenseShortName?.value)
  return {
    lugares,
    archivo,
    pagina,
    autor: autor && !SIN_AUTOR.test(autor) ? autor : '',
    licencia,
    licencia_url: textoPlano(meta.LicenseUrl?.value) || '',
    dominio_publico: pd,
  }
}

// ---------- Principal ----------
const previo = existsSync(SALIDA) && !REHACER ? JSON.parse(readFileSync(SALIDA, 'utf8')) : { fotos: [], sin_autor: [] }
// Lo que ya estuviera en el JSON de un sitio rechazado se quita (y si la foto la comparte con un sitio bueno, se queda solo el bueno).
for (const f of previo.fotos ?? []) f.lugares = (f.lugares ?? []).filter((l) => !estaRechazada(l))
previo.fotos = (previo.fotos ?? []).filter((f) => f.lugares.length > 0)
previo.sin_autor = (previo.sin_autor ?? []).filter((s) => !estaRechazada(s.lugar))
const fotos = new Map((previo.fotos ?? []).map((f) => [f.archivo, f]))
const sinAutor = new Map((previo.sin_autor ?? []).map((s) => [`${s.lugar}|${s.archivo}`, s]))

function guardar() {
  const lista = [...fotos.values()].sort((a, b) => a.archivo.localeCompare(b.archivo))
  for (const f of lista) f.lugares = [...new Set(f.lugares)].sort((a, b) => a.localeCompare(b))
  const sin = [...sinAutor.values()].sort((a, b) => a.lugar.localeCompare(b.lugar))
  writeFileSync(SALIDA, JSON.stringify({ _que_es: QUE_ES, fotos: lista, sin_autor: sin }, null, 2) + '\n')
}

const porArchivo = new Map() // archivo → [lugares]
for (const name of nombresDelDestino()) {
  const url = await fotoDeWikipedia(name)
  if (!url) continue
  const archivo = archivoDeUrl(url)
  if (!archivo) continue
  porArchivo.set(archivo, [...(porArchivo.get(archivo) ?? []), name])
}
console.log(`Fotos de Wikipedia servidas: ${porArchivo.size} ficheros (${[...porArchivo.values()].flat().length} lugares)`)

let nuevas = 0
for (const [archivo, lugares] of porArchivo) {
  const ya = fotos.get(archivo)
  if (ya) {
    ya.lugares = [...new Set([...ya.lugares, ...lugares])]
    continue
  }
  if ([...sinAutor.values()].some((s) => s.archivo === archivo) && lugares.every((l) => sinAutor.has(`${l}|${archivo}`))) continue
  await pausa(PAUSA)
  let datos = null
  try {
    datos = await pedirCommons(archivo)
  } catch (error) {
    console.warn(`  [!] ${archivo}: ${error.message} (se reintentará en la próxima ejecución)`)
    continue
  }
  nuevas++
  if (!datos) {
    for (const lugar of lugares) sinAutor.set(`${lugar}|${archivo}`, { lugar, parada: paradasDe(lugar), archivo, motivo: 'el fichero no existe en Commons' })
    console.log(`  SIN DATOS  ${archivo}`)
    guardar()
    continue
  }
  const entrada = entradaDe(archivo, lugares, datos)
  if (!entrada.dominio_publico && (!entrada.autor || !entrada.licencia)) {
    for (const lugar of lugares) sinAutor.set(`${lugar}|${archivo}`, { lugar, parada: paradasDe(lugar), archivo, motivo: !entrada.autor ? 'sin autor en Commons' : 'sin licencia en Commons' })
    console.log(`  SIN AUTOR  ${archivo}  (${lugares.join(' · ')})`)
  } else {
    fotos.set(archivo, entrada)
    console.log(`  ${entrada.dominio_publico ? 'DOMINIO PÚBLICO' : 'OK'}  ${archivo}  ${entrada.autor} · ${entrada.licencia}`)
  }
  guardar()
}
guardar()
console.log(`Hecho: ${nuevas} consultadas a Commons, ${fotos.size} con datos, ${sinAutor.size} sin autor → ${SALIDA}`)
