// Genera public/datos/excursiones.json (V27): por cada excursión de los destinos curados, lo que la tarjeta necesita (foto, desde, nota, opiniones, cancelación…) y la foto propia de respaldo.
// La app lo usa para completar las excursiones de los viajes YA guardados, que llevan solo el nombre (Lanzarote: photoUrl null, precio 0). Nunca inventa: solo copia lo que dicen nuestros datos.
//   node scripts/destino/generarExcursionesPublicas.mjs
import fs from 'node:fs'
const leer = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const salida = {}
const redondea = (n) => (typeof n === 'number' ? n : null)

// Lanzarote: cada excursión apunta a su ficha de Civitatis (_civitatis.json) con `civitatis_id`.
const lz = leer('data/pipeline_v2/lanzarote.json')
const civ = leer('data/dias/lanzarote/_civitatis.json').excursiones
const PROPIA_LZ = { la_graciosa: '/fotos/lanzarote/la_graciosa.jpg' }
for (const o of lz.excursions.options) {
  const c = civ.find((x) => x.id === o.civitatis_id)
  const propia = PROPIA_LZ[o.id] ?? null
  if (!c && !propia) continue
  salida[o.id] = {
    ...(c ? { price: redondea(c.price_from_eur), rating: redondea(c.rating), ratingMax: c.rating_max === 10 ? 10 : 5, reviewCount: redondea(c.review_count), cancellation: c.cancellation ?? null, durationText: c.duration_label ?? null, bookUrl: c.url ?? null, photoUrl: c.photo_url ?? null, incluye: c.incluye ?? null, recogida: c.recogida_o_punto ?? null } : {}),
    fotoPropia: propia,
  }
}
// Roma (y cualquier destino cuyas excursiones ya traen sus datos): se copian tal cual.
for (const f of ['roma']) {
  const d = leer(`data/pipeline_v2/${f}.json`)
  for (const o of d.excursions?.options ?? []) {
    salida[o.id] = { price: redondea(o.price_from_eur), rating: redondea(o.rating), ratingMax: o.rating_max === 10 ? 10 : 5, reviewCount: redondea(o.review_count), cancellation: o.cancellation ?? null, durationText: o.duration_label ?? null, photoUrl: o.photo_url ?? null, photoUrlBig: o.photo_url_big ?? o.photo_url ?? null, fotoPropia: null }
  }
}
fs.writeFileSync('public/datos/excursiones.json', JSON.stringify(salida))
console.log('public/datos/excursiones.json', Object.keys(salida).length, 'excursiones')
