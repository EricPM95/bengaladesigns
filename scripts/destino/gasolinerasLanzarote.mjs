// LZ1 (agente B): «Cerca de mí» de Lanzarote = GASOLINERAS y APARCAMIENTOS (en vez de baños y fuentes). Se descargan UNA vez de
// OpenStreetMap (Overpass API) y se guardan en el proyecto; la app no llama a OpenStreetMap.
//   node scripts/destino/gasolinerasLanzarote.mjs
// Salida: data/pipeline_v2/gasolineras/lanzarote.json y data/pipeline_v2/aparcamientos/lanzarote.json
// Datos © OpenStreetMap contributors, licencia ODbL (https://www.openstreetmap.org/copyright).
// Gasolineras: amenity=fuel. Aparcamientos: amenity=parking de acceso público (sin access, o yes/permissive/public) y que no sean
// «private», «customers» ni de un solo uso (parking_space/garage_boxes); los de superficie o multiplanta, con su nombre, de pago y plazas si los hay.
import { mkdirSync, writeFileSync } from 'node:fs'

// La isla entera (Lanzarote y La Graciosa quedan fuera a propósito: no hay coche).
const BBOX = '28.82,-13.90,29.25,-13.40'
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

async function overpass(query) {
  let ultimo = null
  for (let ronda = 0; ronda < 3; ronda += 1) {
    for (const url of ENDPOINTS) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'route-planner-data-fetch/1.0', accept: '*/*' },
          body: `data=${encodeURIComponent(query)}`,
        })
        const texto = await response.text()
        if (!response.ok) throw new Error(`${url} ${response.status}`)
        return JSON.parse(texto)
      } catch (error) {
        ultimo = error
        console.log('  reintento:', String(error.message ?? error).slice(0, 100))
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 8000))
  }
  throw ultimo
}

const PUBLICO = new Set([undefined, 'yes', 'permissive', 'public'])
const feeOf = (tags) => (['yes', '1', 'true'].includes(tags.fee) ? true : ['no', '0', 'false'].includes(tags.fee) ? false : null)
const punto = (element) => ({ lat: element.lat ?? element.center?.lat, lng: element.lon ?? element.center?.lon })
const redondea = (n) => Math.round(n * 1e6) / 1e6

// Zona de la isla según el punto más cercano de las zonas de alojamiento / sitios (para agrupar en la lista).
const ZONAS = [
  ['Puerto del Carmen', 28.92, -13.665],
  ['Playa Blanca', 28.863, -13.83],
  ['Costa Teguise', 28.998, -13.495],
  ['Arrecife', 28.963, -13.55],
  ['El norte', 29.14, -13.48],
  ['El interior', 29.03, -13.64],
  ['Aeropuerto', 28.945, -13.605],
]
const metros = (a, b) => {
  const rad = Math.PI / 180
  const x = (b[1] - a[1]) * rad * Math.cos(((a[0] + b[0]) / 2) * rad)
  const y = (b[0] - a[0]) * rad
  return Math.sqrt(x * x + y * y) * 6371000
}
const zonaDe = (lat, lng) => ZONAS.map(([nombre, la, lo]) => ({ nombre, d: metros([lat, lng], [la, lo]) })).sort((a, b) => a.d - b.d)[0].nombre

console.log('Gasolineras…')
const fuel = await overpass(`[out:json][timeout:90];(node["amenity"="fuel"](${BBOX});way["amenity"="fuel"](${BBOX}););out center tags;`)
const gasolineras = fuel.elements
  .map((element) => ({ element, ...punto(element), tags: element.tags ?? {} }))
  .filter(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng))
  .map(({ element, lat, lng, tags }) => ({
    id: `${element.type}/${element.id}`,
    lat: redondea(lat),
    lng: redondea(lng),
    name: tags.name ?? tags.brand ?? null,
    marca: tags.brand ?? null,
    horario: tags.opening_hours ?? null,
    de_noche_24h: tags.opening_hours === '24/7' ? true : null,
    zona: zonaDe(lat, lng),
  }))
  .sort((a, b) => a.id.localeCompare(b.id))

console.log('Aparcamientos…')
const park = await overpass(`[out:json][timeout:120];(node["amenity"="parking"](${BBOX});way["amenity"="parking"](${BBOX}););out center tags;`)
const aparcamientos = park.elements
  .map((element) => ({ element, ...punto(element), tags: element.tags ?? {} }))
  .filter(({ lat, lng, tags }) => Number.isFinite(lat) && Number.isFinite(lng) && PUBLICO.has(tags.access))
  .filter(({ tags }) => !['parking_space', 'garage_boxes', 'rooftop'].includes(tags.parking) && !tags.operator?.match?.(/^$/))
  // Solo los que dicen algo útil: su nombre o sus plazas (los miles de aparcamientos de calle sin nombre ni plazas no sirven en una lista).
  .filter(({ tags }) => tags.name || tags.capacity || tags.fee === 'yes')
  .map(({ element, lat, lng, tags }) => ({
    id: `${element.type}/${element.id}`,
    lat: redondea(lat),
    lng: redondea(lng),
    name: tags.name ?? null,
    de_pago: feeOf(tags),
    plazas: Number.isFinite(Number(tags.capacity)) ? Number(tags.capacity) : null,
    tipo: tags.parking ?? null,
    horario: tags.opening_hours ?? null,
    zona: zonaDe(lat, lng),
  }))
  .sort((a, b) => a.id.localeCompare(b.id))

const comun = {
  licencia: 'ODbL — © OpenStreetMap contributors (https://www.openstreetmap.org/copyright)',
  descargado: new Date().toISOString().slice(0, 10),
  zona_descargada: BBOX,
}
mkdirSync('data/pipeline_v2/gasolineras', { recursive: true })
mkdirSync('data/pipeline_v2/aparcamientos', { recursive: true })
writeFileSync(
  'data/pipeline_v2/gasolineras/lanzarote.json',
  `${JSON.stringify(
    {
      fuente: 'OpenStreetMap (amenity=fuel), descargado con la Overpass API',
      ...comun,
      datos_osm_del: fuel.osm3s?.timestamp_osm_base ?? null,
      nota: 'Todas las gasolineras de la isla. horario: el de OpenStreetMap (null = sin dato). En el norte hay pocas (Haría y Arrieta, según DATOS_NATURALEZA_PUEBLOS_COCHE.md; Órzola sin confirmar): la app avisa de repostar antes de subir. La del aeropuerto, de 07:00 a 23:00 (web de la petrolera, 2-nov-2026).',
      gasolineras,
    },
    null,
    1,
  )}\n`,
)
writeFileSync(
  'data/pipeline_v2/aparcamientos/lanzarote.json',
  `${JSON.stringify(
    {
      fuente: 'OpenStreetMap (amenity=parking), descargado con la Overpass API',
      ...comun,
      datos_osm_del: park.osm3s?.timestamp_osm_base ?? null,
      nota: 'Aparcamientos públicos con nombre, plazas o de pago (los de calle sin datos no entran). de_pago: true/false/null (sin dato). El aparcamiento propio de cada parada de la ruta va en lanzarote.json (coordinates en su aparcamiento).',
      aparcamientos,
    },
    null,
    1,
  )}\n`,
)
console.log(`gasolineras: ${gasolineras.length}; aparcamientos: ${aparcamientos.length}`)
