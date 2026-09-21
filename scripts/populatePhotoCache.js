/**
 * Pre-poblado de la caché de fotos de un destino (Prompt 5).
 *
 *   node scripts/populatePhotoCache.js [destino] [--force]
 *   node scripts/populatePhotoCache.js Roma
 *
 * Necesita el backend levantado (npm run server): pega contra /api/place-photo, que es quien tiene
 * la clave de Unsplash y la cascada completa (caché -> Unsplash validado -> Wikipedia -> nada).
 *
 * Por qué existe: Unsplash en modo demo da 50 peticiones/HORA. Resolver los 67 lugares de Roma en
 * caliente, mientras un viajero espera, no es viable — pero hacerlo una vez desde aquí sí, y a
 * partir de ahí todo sale de la caché compartida de Supabase. Por eso espera 72 segundos entre
 * lugares que necesiten llamar a Unsplash (50/hora = 1 cada 72s); los que ya estén cacheados no
 * esperan nada, así que repetir el script cuesta segundos.
 *
 * Al terminar imprime el reparto por fuente y la lista de lugares sin foto, que es lo que hay que
 * revisar a ojo: que las de Unsplash sean DEL LUGAR y no de otro sitio bonito.
 */
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const API = process.env.PHOTO_API ?? 'http://localhost:8787/api/place-photo'
/** 50 req/hora = 1 cada 72s. Solo se espera cuando la llamada ha ido de verdad a Unsplash. */
const ESPERA_MS = 72_000

const destino = process.argv[2] ?? 'Roma'
const force = process.argv.includes('--force')

const archivo = join(__dirname, '..', 'data', 'pipeline_v2', `${destino.toLowerCase()}.json`)
let destData
try {
  destData = JSON.parse(readFileSync(archivo, 'utf8'))
} catch {
  console.error(`No encuentro el JSON del destino: ${archivo}`)
  process.exit(1)
}

const lugares = destData.places ?? []
const sinSearchEn = lugares.filter((p) => !p.search_en).map((p) => p.name)
if (sinSearchEn.length > 0) {
  console.warn(`Aviso: ${sinSearchEn.length} lugares sin search_en (buscarán por su nombre en español):`)
  for (const n of sinSearchEn) console.warn(`   · ${n}`)
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
const conteo = { unsplash: 0, wikipedia: 0, none: 0, error: 0 }
const sinFoto = []
const deUnsplash = []

console.log(`\nPre-poblando fotos de ${destino} — ${lugares.length} lugares${force ? ' (forzando, ignora caché)' : ''}\n`)

for (const [i, place] of lugares.entries()) {
  const etiqueta = `[${String(i + 1).padStart(2)}/${lugares.length}] ${place.name}`
  let data
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: place.name, city: destino, force }),
    })
    data = await res.json()
  } catch (error) {
    conteo.error += 1
    console.log(`${etiqueta}  ⚠ no se pudo consultar: ${error.message}`)
    continue
  }

  const fuente = data.photo_source ?? 'none'
  conteo[fuente] = (conteo[fuente] ?? 0) + 1

  if (fuente === 'unsplash') {
    deUnsplash.push({ nombre: place.name, autor: data.unsplash_photographer, url: data.unsplash_small })
    console.log(`${etiqueta}  ✅ unsplash — foto de ${data.unsplash_photographer}`)
  } else if (fuente === 'wikipedia') {
    const archivoFoto = decodeURIComponent((data.photo_url ?? '').split('/').pop() ?? '')
    console.log(`${etiqueta}  ✅ wikipedia — ${archivoFoto.slice(0, 52)}`)
  } else {
    sinFoto.push(place.name)
    console.log(`${etiqueta}  ❌ sin foto (se mostrará el icono de categoría)`)
  }

  // Solo cuesta cuota lo que NO vino de caché. Repetir el script es por tanto casi instantáneo.
  const ultimo = i === lugares.length - 1
  if (!data.cached && !ultimo) await pausa(ESPERA_MS)
}

console.log(`\n── Resumen ${destino} ─────────────────────────────`)
console.log(`  unsplash : ${conteo.unsplash}`)
console.log(`  wikipedia: ${conteo.wikipedia}`)
console.log(`  sin foto : ${conteo.none}`)
if (conteo.error) console.log(`  errores  : ${conteo.error}`)

if (sinFoto.length > 0) {
  console.log(`\nSin foto (enseñarán el icono de su categoría):`)
  for (const n of sinFoto) console.log(`   · ${n}`)
}
if (deUnsplash.length > 0) {
  console.log(`\nREVISAR A OJO que estas sean del lugar correcto:`)
  for (const p of deUnsplash) console.log(`   · ${p.nombre}\n     ${p.url}`)
}
