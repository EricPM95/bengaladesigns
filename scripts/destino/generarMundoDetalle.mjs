// (V14) Genera src/components/logros/pantallas/mundo/tierra50.json: las costas con MÁS detalle (world-atlas 50m: con las islas pequeñas, Canarias, Baleares, las griegas…) para acercarse a una isla y verla.
// Va aparte de tierra110.json y solo se baja al abrir el pasaporte. Hace falta tener a mano (fuera del proyecto): world-countries, world-atlas, topojson-client.
//   node scripts/destino/generarMundoDetalle.mjs <carpeta con node_modules de esos tres paquetes> [factor, por defecto 25 = 0,04 grados]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const base = path.resolve(process.argv[2] ?? '.')
const K = Number(process.argv[3] ?? 25)
const req = createRequire(path.join(base, 'x.js'))
const wc = req('world-countries')
const atlas = req('world-atlas/countries-50m.json')
const topo = req('topojson-client')
const feats = topo.feature(atlas, atlas.objects.countries).features
const lista = wc.filter((c) => c.independent === true || ['TW', 'XK'].includes(c.cca2))
const porCcn = new Map(lista.map((c) => [c.ccn3, c.cca2.toLowerCase()]))
const q = (v) => Math.round(v * K)
const salida = {}
for (const f of feats) {
  const iso = porCcn.get(String(f.id).padStart(3, '0'))
  if (!iso) continue
  const polis = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  const anillos = []
  for (const p of polis) {
    const pts = p[0].map(([x, y]) => [q(x), q(y)]).filter((pt, k, a) => k === 0 || pt[0] !== a[k - 1][0] || pt[1] !== a[k - 1][1])
    if (pts.length >= 4) anillos.push(pts.flat())
  }
  salida[iso] = anillos
}
fs.writeFileSync('src/components/logros/pantallas/mundo/tierra50.json', JSON.stringify({ k: K, t: salida }))
const canarias = (salida.es ?? []).filter((a) => { const x = a[0] / K, y = a[1] / K; return x < -13 && x > -19 && y > 27 && y < 30 }).length
console.log(Object.keys(salida).length, 'países;', fs.statSync('src/components/logros/pantallas/mundo/tierra50.json').size, 'bytes; anillos de Canarias en España:', canarias)
