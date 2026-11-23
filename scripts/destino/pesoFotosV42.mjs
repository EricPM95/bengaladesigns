// V42 §3: cuánto pesan las fotos de la página de todas las excursiones, antes (la pequeña de Civitatis) y después (la grande, perezosa). Solo pide las cabeceras (HEAD): no baja ninguna foto.
import fs from 'node:fs'
const grande = (u) => u.replace(/-(m|list|grid)(\.jpe?g)(\?.*)?$/i, '-grid$2$3')
const peso = async (u) => Number((await fetch(u, { method: 'HEAD' })).headers.get('content-length') ?? 0)
const salida = {}
const destinos = {
  Roma: JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8')).excursions.options.map((o) => o.photo_url).filter(Boolean),
  Lanzarote: JSON.parse(fs.readFileSync('data/dias/lanzarote/_civitatis.json', 'utf8')).excursiones.map((e) => e.photo_url).filter(Boolean),
}
for (const [d, urls] of Object.entries(destinos)) {
  const pequenas = await Promise.all(urls.map(peso))
  const grandes = await Promise.all(urls.map((u) => peso(grande(u))))
  const suma = (l) => Math.round(l.reduce((a, b) => a + b, 0) / 1024)
  salida[d] = { fotos: urls.length, antesKB: suma(pequenas), despuesTodasKB: suma(grandes), despuesPrimerasTresKB: suma(grandes.slice(0, 3)) }
}
console.log(JSON.stringify(salida, null, 1))
fs.writeFileSync('docs/dias/_pesoFotosV42.json', JSON.stringify(salida, null, 1))
