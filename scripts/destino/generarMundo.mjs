// Genera (una sola vez, en desarrollo) los dos archivos del mundo de «¿Dónde has estado ya?» y del pasaporte (Tanda 8C2):
//   data/logros/paises_mundo.json                              el catálogo de países con su nombre en español, su continente y su centro
//   src/components/logros/pantallas/mundo/tierra110.json     las costas de cada país (world-atlas 110m), en décimas de grado, para dibujar el globo sin pedir nada a internet
// Hace falta tener a mano (fuera del proyecto, no se instalan): world-countries, world-atlas, topojson-client.
//   node scripts/destino/generarMundo.mjs <carpeta con node_modules de esos tres paquetes>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const base = path.resolve(process.argv[2] ?? '.')
const req = createRequire(path.join(base, 'x.js'))
const wc = req('world-countries')
const atlas = req('world-atlas/countries-110m.json')
const topo = req('topojson-client')

const CONT = (c) => {
  if (c.region === 'Europe') return 'Europa'
  if (c.region === 'Asia') return 'Asia'
  if (c.region === 'Africa') return 'África'
  if (c.region === 'Oceania') return 'Oceanía'
  return c.subregion === 'South America' ? 'América del Sur' : 'América del Norte'
}
const feats = topo.feature(atlas, atlas.objects.countries).features
const dibujados = new Map(feats.map((f) => [String(f.id).padStart(3, '0'), f]))
const lista = wc.filter((c) => c.independent === true || ['TW', 'XK'].includes(c.cca2))
const paises = lista
  .map((c) => ({ i: c.cca2.toLowerCase(), n: c.translations.spa.common, c: CONT(c), lat: Math.round(c.latlng[0] * 10) / 10, lng: Math.round(c.latlng[1] * 10) / 10, p: dibujados.has(c.ccn3) ? 0 : 1 }))
  .sort((a, b) => a.n.localeCompare(b.n, 'es'))
fs.writeFileSync('data/logros/paises_mundo.json', JSON.stringify(paises))

const porCcn = new Map(lista.map((c) => [c.ccn3, c.cca2.toLowerCase()]))
const q = (v) => Math.round(v * 10)
const salida = {}
for (const [ccn, f] of dibujados) {
  const iso = porCcn.get(ccn)
  if (!iso) continue
  const polis = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  salida[iso] = polis.map((p) => p[0].map(([x, y]) => [q(x), q(y)]).filter((pt, k, a) => k === 0 || pt[0] !== a[k - 1][0] || pt[1] !== a[k - 1][1]).flat())
}
fs.writeFileSync('src/components/logros/pantallas/mundo/tierra110.json', JSON.stringify(salida))
console.log(paises.length, 'países;', Object.keys(salida).length, 'con costa;', fs.statSync('src/components/logros/pantallas/mundo/tierra110.json').size, 'bytes')
