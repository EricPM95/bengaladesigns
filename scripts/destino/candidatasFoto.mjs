// Candidatas de foto en Unsplash para que el usuario elija (PARA_CODE_FOTOS, 4). No usa ninguna: solo las lista, con su
// autor y su enlace. La clave de Unsplash se lee del entorno del servidor (.env.local) y no se imprime.
//   node scripts/destino/candidatasFoto.mjs "Piazza Navona Christmas market" "Piazza Navona Natale" [pide=navona]
import { existsSync, readFileSync } from 'node:fs'

if (!process.env.UNSPLASH_ACCESS_KEY && existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^\s*UNSPLASH_ACCESS_KEY\s*=\s*(.+?)\s*$/.exec(line)
    if (match) process.env.UNSPLASH_ACCESS_KEY = match[1].replace(/^['"]|['"]$/g, '')
  }
}
const key = process.env.UNSPLASH_ACCESS_KEY
if (!key) throw new Error('Falta UNSPLASH_ACCESS_KEY en el entorno del servidor.')
const args = process.argv.slice(2)
const must = (args.find((arg) => arg.startsWith('pide=')) ?? 'pide=').slice(5).toLowerCase()
const seen = new Set()
for (const query of args.filter((arg) => !arg.startsWith('pide='))) {
  const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&orientation=landscape&content_filter=high`, { headers: { Authorization: `Client-ID ${key}` } })
  if (!response.ok) {
    console.log(`«${query}»: Unsplash devolvió ${response.status}`)
    continue
  }
  const data = await response.json()
  console.log(`\n«${query}»: ${data.total} resultados`)
  for (const photo of data.results ?? []) {
    if (seen.has(photo.id)) continue
    const text = [photo.description ?? '', photo.alt_description ?? '', ...(photo.tags ?? []).map((tag) => tag?.title ?? '')].join(' · ')
    if (must && !text.toLowerCase().includes(must)) continue
    seen.add(photo.id)
    console.log(`- ${photo.links?.html} | ${photo.user?.name} (${photo.user?.links?.html}) | ${photo.width}x${photo.height} | ${text.slice(0, 220)}`)
  }
}
