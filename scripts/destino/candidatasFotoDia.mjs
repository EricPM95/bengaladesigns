// Busca en Unsplash fotos de DÍA de los sitios que se han quedado sin foto de día (Coliseo, Puente Sant'Angelo, San Giovanni) y deja
// las candidatas en un JSON para elegirlas a ojo y ponerlas en la hoja de revisión (docs/revision_fotos_roma.html).
//   node scripts/destino/candidatasFotoDia.mjs [salida.json]
import dotenv from 'dotenv'
import { writeFileSync } from 'node:fs'
dotenv.config({ path: '.env.local' })
const key = process.env.UNSPLASH_ACCESS_KEY
if (!key) throw new Error('Falta UNSPLASH_ACCESS_KEY')

const QUERIES = {
  Coliseo: ['Colosseum Rome daytime', 'Colosseum Rome blue sky', 'Colosseum exterior Rome', 'Colosseo Roma day'],
  "Puente Sant'Angelo": ["Ponte Sant'Angelo Rome angels daytime", "Ponte Sant'Angelo Castel Sant'Angelo day", "Castel Sant'Angelo bridge angels Rome"],
  'Pasear por San Giovanni': ['Basilica di San Giovanni in Laterano', 'San Giovanni in Laterano', 'Lateran Basilica Rome', 'Arcibasilica San Giovanni Laterano facciata', 'Piazza San Giovanni in Laterano'],
}
const NIGHT = /night|sunset|sunrise|dusk|dawn|evening|illuminat|lights|twilight|blue hour|golden hour|noche|atardecer/i

const out = {}
for (const [place, queries] of Object.entries(QUERIES)) {
  const seen = new Map()
  for (const query of queries) {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape&content_filter=high`, { headers: { Authorization: `Client-ID ${key}` } })
    if (!res.ok) {
      console.warn(query, res.status)
      continue
    }
    const data = await res.json()
    for (const photo of data.results ?? []) {
      if (seen.has(photo.id)) continue
      const text = [photo.description, photo.alt_description, ...(photo.tags ?? []).map((tag) => tag.title)].filter(Boolean).join(' ')
      if (NIGHT.test(text)) continue
      seen.set(photo.id, {
        id: photo.id,
        descripcion: photo.description ?? photo.alt_description ?? '',
        small: photo.urls.small,
        regular: photo.urls.regular,
        autor: photo.user?.name ?? '',
        enlace: photo.links?.html ?? '',
        ancho: photo.width,
        likes: photo.likes,
      })
    }
  }
  out[place] = [...seen.values()].sort((a, b) => b.likes - a.likes).slice(0, 10)
  console.log(place, out[place].length)
}
writeFileSync(process.argv[2] ?? 'candidatas_foto_dia.json', JSON.stringify(out, null, 1))
