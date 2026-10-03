// Los baños públicos de un destino (3-oct-2026, PARA_CODE_EXPLORAR_Y_RESERVAS_DISENO, parte 1): se descargan UNA vez de OpenStreetMap
// (amenity=toilets y amenity=drinking_water —las fuentes, los «nasoni» de Roma—, en UNA sola descarga de la Overpass API) y se guardan en el proyecto: data/pipeline_v2/banos/<destino>.json y data/pipeline_v2/fuentes/<destino>.json. La app no llama a OpenStreetMap.
//   node scripts/destino/banos.mjs [destino=roma]
// Datos de © OpenStreetMap contributors, licencia ODbL (https://www.openstreetmap.org/copyright): la app lo dice en la lista de baños.
// Se quedan los públicos (sin access, o access=yes/permissive/public): fuera los «solo clientes», privados, «no» y con permiso.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split('=')))
const key = args.destino ?? 'roma'
const data = JSON.parse(readFileSync(`data/pipeline_v2/${key}.json`, 'utf8'))

// La zona que cubre el catálogo del destino (los lugares curados), con un margen de ~3 km.
const coords = data.places.map((place) => place.coordinates).filter(Array.isArray)
const margin = 0.03
const south = Math.min(...coords.map((c) => c[0])) - margin
const north = Math.max(...coords.map((c) => c[0])) + margin
const west = Math.min(...coords.map((c) => c[1])) - margin
const east = Math.max(...coords.map((c) => c[1])) + margin
const bbox = `${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)}`

const query = `[out:json][timeout:60];(node["amenity"~"^(toilets|drinking_water)$"](${bbox});way["amenity"~"^(toilets|drinking_water)$"](${bbox}););out center tags;`
const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'route-planner-data-fetch/1.0', accept: '*/*' },
  body: `data=${encodeURIComponent(query)}`,
})
if (!response.ok) throw new Error(`Overpass ${response.status}`)
const json = await response.json()

const PUBLIC_ACCESS = new Set([undefined, 'yes', 'permissive', 'public'])
const meters = (a, b) => {
  const toRad = Math.PI / 180
  const x = (b[1] - a[1]) * toRad * Math.cos(((a[0] + b[0]) / 2) * toRad)
  const y = (b[0] - a[0]) * toRad
  return Math.sqrt(x * x + y * y) * 6371000
}
const zoneOf = (point) => {
  let best = null
  for (const place of data.places) {
    if (!Array.isArray(place.coordinates) || !place.zone) continue
    const distance = meters(point, place.coordinates)
    if (!best || distance < best.distance) best = { distance, zone: place.zone }
  }
  return best ? (data.zones?.[best.zone]?.name ?? null) : null
}
const feeOf = (tags) => (['yes', '1', 'true'].includes(tags.fee) ? true : ['no', '0', 'false'].includes(tags.fee) ? false : null)
const wheelchairOf = (tags) => (['yes', 'designated'].includes(tags.wheelchair) ? 'si' : tags.wheelchair === 'limited' ? 'limitado' : tags.wheelchair === 'no' ? 'no' : null)

const toList = (amenity) => json.elements
  .filter((element) => element.tags?.amenity === amenity)
  .map((element) => {
    const lat = element.lat ?? element.center?.lat
    const lng = element.lon ?? element.center?.lon
    return { element, lat, lng, tags: element.tags ?? {} }
  })
  .filter(({ lat, lng, tags }) => Number.isFinite(lat) && Number.isFinite(lng) && PUBLIC_ACCESS.has(tags.access))
  .map(({ element, lat, lng, tags }) => ({
    id: `${element.type}/${element.id}`,
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    name: tags.name ?? null,
    de_pago: feeOf(tags),
    accesible: wheelchairOf(tags),
    horario: tags.opening_hours ?? null,
    zona: zoneOf([lat, lng]),
  }))
  .sort((a, b) => a.id.localeCompare(b.id))
const toilets = toList('toilets')
const fountains = toList('drinking_water').map(({ de_pago, accesible, ...rest }) => rest)

mkdirSync('data/pipeline_v2/banos', { recursive: true })
writeFileSync(
  `data/pipeline_v2/banos/${key}.json`,
  JSON.stringify(
    {
      fuente: 'OpenStreetMap (amenity=toilets), descargado con la Overpass API',
      licencia: 'ODbL — © OpenStreetMap contributors (https://www.openstreetmap.org/copyright)',
      descargado: new Date().toISOString().slice(0, 10),
      datos_osm_del: json.osm3s?.timestamp_osm_base ?? null,
      zona_descargada: bbox,
      nota: 'Solo baños públicos (sin access, o access=yes/permissive/public). de_pago: true/false/null (sin dato). accesible: si/limitado/no/null (sin dato).',
      banos: toilets,
    },
    null,
    1,
  ) + '\n',
)
mkdirSync('data/pipeline_v2/fuentes', { recursive: true })
writeFileSync(
  `data/pipeline_v2/fuentes/${key}.json`,
  JSON.stringify(
    {
      fuente: 'OpenStreetMap (amenity=drinking_water), descargado con la Overpass API (la misma descarga que los baños)',
      licencia: 'ODbL — © OpenStreetMap contributors (https://www.openstreetmap.org/copyright)',
      descargado: new Date().toISOString().slice(0, 10),
      datos_osm_del: json.osm3s?.timestamp_osm_base ?? null,
      zona_descargada: bbox,
      nota: 'Fuentes de agua potable (en Roma, los nasoni). Solo las públicas (sin access, o access=yes/permissive/public).',
      fuentes: fountains,
    },
    null,
    1,
  ) + '\n',
)
console.log(`${key}: ${fountains.length} fuentes de agua potable`)
const count = (field, value) => toilets.filter((toilet) => toilet[field] === value).length
console.log(`${key}: ${toilets.length} baños públicos (de ${json.elements.length} en OpenStreetMap); de pago ${count('de_pago', true)}, gratis ${count('de_pago', false)}, sin dato ${count('de_pago', null)}; accesibles ${count('accesible', 'si')}, no ${count('accesible', 'no')}, sin dato ${count('accesible', null)}`)
