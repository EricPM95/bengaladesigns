/**
 * Borradores de lo que es CRITERIO nuestro (kit de nuevo destino, paso 3). Nosotros solo revisamos.
 *
 *   node scripts/destino/borradores.mjs roma
 *
 * Necesita el JSON del destino y su matriz de tiempos (node scripts/buildTravelMatrix.mjs <destino>).
 * Escribe data/pipeline_v2/kit/<destino>/borradores.json (fuera de la raíz de pipeline_v2: lo que hay
 * en la raíz se carga como destino) y enseña un resumen. Si el destino ya tiene esas partes curadas a
 * mano, compara el borrador con ellas: es la forma de saber cuánto fiarse del borrador.
 *
 *   1. Joyas e imprescindibles: por popularidad real (visitas a su página de Wikipedia en los
 *      últimos 60 días). 4-5 joyas; hasta 11 de nivel 1 en total (el centro del 10-12).
 *   2. Recorrido de tarde (`afternoon_flow`) de cada zona con una visita larga de mañana: desde
 *      donde acaba esa visita, lo más cercano que va HACIA la cena, hasta llenar la tarde. Respeta
 *      acceso antes que monumento y lo de dentro detrás de su contenedor.
 *   3. Rutas de 1 y 1,5 días (`short_trips`, mismo formato que Roma): un bloque por zona con nivel
 *      1, núcleo = lo que cabe en tranquilo, extras = lo que solo cabe en completo; combinaciones
 *      con las joyas. Se prueban con el motor de verdad (planShortTrip) antes de proponerlas.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildUnits } from '../../shared/routeEngine/units.js'
import { createTravelTimes } from '../../shared/routeEngine/travelTimes.js'
import { planShortTrip, shortTripSlots } from '../../shared/routeEngine/shortTrip.js'
import { PRIORITY, scheduleFixedOrder } from '../../shared/routeEngine/scheduleDay.js'
import { placesForScheduler } from '../../shared/routeEngine/planTrip.js'
import { MODES_V3 } from '../../shared/routeEngine/modes.js'
import { dinnerZones } from '../../shared/routeEngine/dinnerZones.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const destino = (process.argv[2] ?? '').toLowerCase()
if (!destino || destino.startsWith('--')) {
  console.error('Uso: node scripts/destino/borradores.mjs <destino>')
  process.exit(2)
}
const D = JSON.parse(readFileSync(join(ROOT, `data/pipeline_v2/${destino}.json`), 'utf8'))
const matrixPath = join(ROOT, `data/pipeline_v2/travel/${destino}.json`)
if (!existsSync(matrixPath)) {
  console.error(`Falta la matriz de tiempos: node scripts/buildTravelMatrix.mjs ${destino}`)
  process.exit(2)
}
const travel = createTravelTimes(JSON.parse(readFileSync(matrixPath, 'utf8')))
const kitDir = join(ROOT, `data/pipeline_v2/kit/${destino}`)
mkdirSync(kitDir, { recursive: true })

const JOYAS = [4, 5]
const NIVEL_1_OBJETIVO = 11
const VISITA_LARGA_MIN = 180
/** La tarde de un recorrido: de salir de la visita larga (~15:00) a ir a cenar (~19:45). */
const TARDE_MINUTOS = 285
/** Un paso del recorrido: más lejos ya no es "seguir andando", es ir a otra parte. */
const PASO_MAX_MIN = 15
/** Hacia la cena: cada parada puede alejarse de ella como mucho esto (la regla del motor). */
const ALEJARSE_MAX_MIN = 2
const WIKIPEDIA_PAUSE_MS = 1500

const places = D.places ?? []
const byName = new Map(places.map((place) => [place.name, place]))
const walk = (a, b) => travel.leg(a, b)?.minutes ?? Infinity
const dinnerPoints = dinnerZones(D).map((zone) => ({ zone: zone.id, coordinates: zone.coordinates }))
const nearestDinner = (coords) => [...dinnerPoints].sort((a, b) => walk(coords, a.coordinates) - walk(coords, b.coordinates))[0] ?? null
const borradores = { generado: 'scripts/destino/borradores.mjs', destino: D.destination }

// ── 1. Joyas e imprescindibles, por popularidad ─────────────────────────────────────────────
const popularityPath = join(kitDir, 'popularidad.json')
const popularity = existsSync(popularityPath) ? JSON.parse(readFileSync(popularityPath, 'utf8')) : {}
for (const place of places) {
  if (popularity[place.name]) continue
  const found = await wikipediaViews(place)
  if (found === undefined) continue // la red falló: se reintenta en la próxima pasada
  popularity[place.name] = found
  writeFileSync(popularityPath, JSON.stringify(popularity, null, 1))
}
{
  // Lo que está dentro de otro no compite: su fama es la del contenedor. Y dos lugares que caen en
  // el mismo artículo (Puente y Castillo Sant'Angelo) no cuentan dos veces: se queda el de visita
  // más larga, que es de quien habla el artículo.
  const byTitle = new Map()
  for (const place of places.filter((p) => !p.contained_in && popularity[p.name]?.views != null)) {
    const title = popularity[place.name].title
    const current = byTitle.get(title)
    if (!current || (place.duration_minutes ?? 0) > (current.duration_minutes ?? 0)) byTitle.set(title, place)
  }
  const ranked = [...byTitle.values()].sort((a, b) => popularity[b.name].views - popularity[a.name].views)
  const fourth = popularity[ranked[JOYAS[0] - 1]?.name]?.views ?? 0
  const joyaCount = (popularity[ranked[JOYAS[1] - 1]?.name]?.views ?? 0) >= fourth * 0.8 ? JOYAS[1] : JOYAS[0]
  const joyas = ranked.slice(0, joyaCount).map((p) => p.name)
  const imprescindibles = ranked.slice(joyaCount, NIVEL_1_OBJETIVO).map((p) => p.name)
  borradores.nivel_1 = {
    _nota: 'Por visitas a su página de Wikipedia (60 días). Revisar: la fama no es lo mismo que merecer el viaje.',
    joyas,
    imprescindibles,
    popularidad: ranked.slice(0, NIVEL_1_OBJETIVO + 5).map((p) => ({ name: p.name, views: popularity[p.name].views, title: popularity[p.name].title })),
    sin_datos: places.filter((p) => !p.contained_in && popularity[p.name]?.views == null).map((p) => p.name),
  }
}

// ── 2. Recorridos de tarde ──────────────────────────────────────────────────────────────────
const units = buildUnits(D, false)
const longUnits = units.filter((unit) => !unit.isFreeTour && unit.minutes >= VISITA_LARGA_MIN)
borradores.afternoon_flow = {}
for (const unit of longUnits) {
  const zone = unit.places[0].zone
  const end = unit.places.at(-1)
  const dinner = nearestDinner(end.coordinates)
  const used = new Set(unit.places.map((p) => p.name))
  const flow = []
  let position = end.coordinates
  let budget = TARDE_MINUTOS
  const candidates = places.filter((p) => p.level !== 1 && !used.has(p.name) && (p.duration_minutes ?? 30) <= 90 && walk(end.coordinates, p.coordinates) <= 20)
  for (;;) {
    const options = candidates
      .filter((p) => !used.has(p.name))
      // Lo de dentro solo detrás de su contenedor; el monumento solo después de su acceso.
      .filter((p) => !p.contained_in || !byName.has(p.contained_in) || used.has(p.contained_in) || !candidates.includes(byName.get(p.contained_in)))
      .filter((p) => !candidates.some((access) => !used.has(access.name) && (access.approach_to ?? []).includes(p.name)))
      .filter((p) => walk(position, p.coordinates) <= PASO_MAX_MIN)
      .filter((p) => !dinner || walk(p.coordinates, dinner.coordinates) <= walk(position, dinner.coordinates) + ALEJARSE_MAX_MIN)
      .sort((a, b) => walk(position, a.coordinates) - walk(position, b.coordinates) || (a.level ?? 3) - (b.level ?? 3))
    const next = options[0]
    if (!next) break
    const cost = walk(position, next.coordinates) + (next.duration_minutes ?? 30)
    if (cost > budget) break
    budget -= cost
    used.add(next.name)
    flow.push(next.name)
    position = next.coordinates
  }
  borradores.afternoon_flow[zone] = { desde: unit.places.map((p) => p.name).join(' + '), cena: dinner?.zone ?? null, recorrido: flow }
}

// ── 3. Rutas de 1 y 1,5 días ────────────────────────────────────────────────────────────────
{
  const zones = Object.entries(D.zones ?? {}).sort((a, b) => (a[1].zone_priority ?? 9) - (b[1].zone_priority ?? 9))
  const level1Units = units.filter((unit) => unit.level === 1 && !unit.isFreeTour)
  const blocks = {}
  let letter = 65
  for (const [zoneId, zone] of zones) {
    const inZone = level1Units.filter((unit) => unit.places[0].zone === zoneId)
    if (inZone.length === 0) continue
    // La visita larga primero (de mañana, a primera hora); el resto, por cercanía desde ella. Sin
    // visita larga, se acaba lo más cerca posible de la cena.
    const long = inZone.find((unit) => unit.minutes >= VISITA_LARGA_MIN)
    const dinner = nearestDinner(zone.center ?? inZone[0].places[0].coordinates)
    const rest = inZone.filter((unit) => unit !== long)
    const ordered = []
    let position = long ? long.places.at(-1).coordinates : null
    if (!long) {
      const farthest = [...rest].sort((a, b) => walk(b.places[0].coordinates, dinner?.coordinates) - walk(a.places[0].coordinates, dinner?.coordinates))[0]
      ordered.push(farthest)
      position = farthest.places.at(-1).coordinates
    } else ordered.push(long)
    while (ordered.length < inZone.length) {
      const next = rest.filter((unit) => !ordered.includes(unit)).sort((a, b) => walk(position, a.places[0].coordinates) - walk(position, b.places[0].coordinates))[0]
      ordered.push(next)
      position = next.places.at(-1).coordinates
    }
    // De mañana solo el bloque con visita larga (hay que entrar a primera hora); el resto, de tarde.
    const earlyBird = Boolean(long)
    const lastPlace = ordered.at(-1).places.at(-1)
    blocks[String.fromCharCode(letter++)] = {
      label: zone.name ?? zoneId,
      preferred_slot: earlyBird ? 'manana' : 'tarde',
      allowed_slots: earlyBird ? ['manana', 'tarde'] : ['tarde', 'manana'],
      core: ordered.flatMap((unit) => unit.places.map((p) => p.name)),
      extras_completo: [],
      lunch_zone_if_morning: zoneId,
      dinner_zone_if_afternoon: nearestDinner(lastPlace.coordinates)?.zone ?? zoneId,
      swaps: {},
    }
  }
  const covers = D.default_free_tour?.covers ?? []
  const tourBlock = Object.entries(blocks).find(([, block]) => covers.length && block.core.filter((name) => covers.includes(name)).length >= covers.length / 2)?.[0]
  if (tourBlock) blocks[tourBlock].free_tour = { replaces_block: true, _nota: 'El Free Tour recorre la mayor parte de este bloque.' }

  // Combinaciones: 1 día = mañana + tarde con más joyas; 1,5 días = las tres mejores.
  const joyasOf = (id) => blocks[id].core.filter((name) => byName.get(name)?.tier === 'joya').length
  const ids = Object.keys(blocks).sort((a, b) => joyasOf(b) - joyasOf(a) || blocks[b].core.length - blocks[a].core.length)
  const pairs = []
  for (const a of ids) for (const b of ids) if (a !== b && blocks[a].preferred_slot === 'manana' && blocks[b].preferred_slot !== 'manana') pairs.push([a, b])
  if (pairs.length === 0 && ids.length >= 2) pairs.push([ids[0], ids[1]])
  const bestPair = pairs.sort((x, y) => joyasOf(y[0]) + joyasOf(y[1]) - joyasOf(x[0]) - joyasOf(x[1]))[0] ?? ids.slice(0, 1)
  const excluded = ids.filter((id) => !bestPair.includes(id))
  const ifPool = {}
  for (const id of excluded) {
    for (const name of blocks[id].core.filter((n) => byName.get(n)?.tier === 'joya')) {
      const sameSlot = bestPair.find((other) => blocks[other].preferred_slot === blocks[id].preferred_slot) ?? bestPair[0]
      ifPool[name] = { blocks: bestPair.map((other) => (other === sameSlot ? id : other)) }
    }
  }
  const shortTrips = {
    franjas: D.short_trips?.franjas ?? { manana: 'hasta la comida', tarde: 'desde la comida hasta la cena, con cena y nocturna al final' },
    blocks,
    combinations: {
      '1_dia': {
        default: bestPair,
        if_pool_contains: ifPool,
        not_included: Object.fromEntries(excluded.map((id) => [id, `Con medio día más podrías ver ${blocks[id].label}.`])),
      },
      '1_5_dias': { default: ids.slice(0, 3), slot_rules: ids.slice(0, 3).map((id) => `${id} va ${blocks[id].preferred_slot === 'manana' ? 'en una mañana' : 'en una tarde'}.`) },
    },
    reglas: D.short_trips?.reglas,
  }

  // Núcleo = lo que cabe en tranquilo en su franja; lo que solo cabe en completo pasa a extras, y
  // en completo se prueba a añadir el principio del recorrido de tarde de su zona (Roma: el
  // Vaticano sigue por el Puente y el Castillo). Con el programador de verdad, bloque a bloque.
  const fitsInSlot = (block, names, mode) => {
    const unitOf = new Map()
    for (const name of names) {
      const unit = units.find((u) => u.places.some((p) => p.name === name))
      const key = unit ? unit.id : name
      if (!unitOf.has(key)) unitOf.set(key, { ...unit, places: [] })
      unitOf.get(key).places.push(byName.get(name))
    }
    const blockUnits = [...unitOf.values()].map((unit, index) => ({
      ...unit,
      places: placesForScheduler({ ...unit, id: unit.id }, D, null),
      slot: block.preferred_slot,
      dropRank: unit.places.some((p) => p.tier === 'joya') ? 0 : index + 1,
      priority: PRIORITY.ESSENTIAL,
    }))
    const morning = block.preferred_slot === 'manana'
    const dinner = dinnerPoints.find((point) => point.zone === block.dinner_zone_if_afternoon)?.coordinates ?? null
    const result = scheduleFixedOrder({
      units: blockUnits,
      mode,
      travel,
      start: { minutes: morning ? mode.dayStart : mode.lunchWindow[1] + mode.mealMinutes, coordinates: null },
      pendingMeals: morning ? { lunch: true, dinner: false } : { lunch: false, dinner: true },
      dinnerPoint: morning ? null : dinner,
      visitsEndByLunch: morning,
    })
    return new Set(result.dropped.flatMap((item) => item.unit.places.map((p) => p.name)))
  }
  for (const block of Object.values(blocks)) {
    const out = fitsInSlot(block, block.core, MODES_V3.tranquilo)
    // Por grupos enteros: un grupo no se parte entre núcleo y extras, y el que lleva una joya se queda.
    const unitNames = (name) => units.find((u) => u.places.some((p) => p.name === name))?.places.map((p) => p.name) ?? [name]
    const extras = block.core.filter((name) => unitNames(name).some((n) => out.has(n)) && !unitNames(name).some((n) => byName.get(n)?.tier === 'joya'))
    block.core = block.core.filter((name) => !extras.includes(name))
    block.extras_completo = extras.filter((name) => !fitsInSlot(block, [...block.core, ...extras], MODES_V3.completo).has(name))
    const flow = borradores.afternoon_flow[block.lunch_zone_if_morning]?.recorrido ?? []
    if (block.preferred_slot === 'manana') {
      for (const name of flow.slice(0, 2)) {
        const trial = [...block.core, ...block.extras_completo, name]
        if (!fitsInSlot(block, trial, MODES_V3.completo).size) block.extras_completo.push(name)
      }
    }
  }
  const probe = (pace) => {
    const trial = { ...D, short_trips: shortTrips }
    const dropped = new Set()
    for (const combo of [shortTrips.combinations['1_dia'].default, ...Object.values(ifPool).map((entry) => entry.blocks)]) {
      const pool = Object.keys(ifPool).filter((name) => combo.some((id) => blocks[id].core.includes(name)) && !bestPair.some((id) => blocks[id].core.includes(name)))
      const trip = planShortTrip({ destData: trial, slots: shortTripSlots('1_dia'), pace, hasFreeTour: false, poolNames: pool, experiencesPositive: ['imprescindibles'], travel })
      for (const item of trip.notIncluded) dropped.add(item.name)
    }
    return dropped
  }
  shortTrips._pruebas = { tranquilo_no_cabe: [...probe('tranquilo')], completo_no_cabe: [...probe('nonstop')] }
  borradores.short_trips = shortTrips
}

writeFileSync(join(kitDir, 'borradores.json'), JSON.stringify(borradores, null, 2))

// ── Resumen, y comparación con lo curado a mano si existe ───────────────────────────────────
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
const overlap = (a, b) => `${a.filter((x) => b.includes(x)).length}/${b.length}`
console.log(`\n=== Borradores · ${D.destination} → data/pipeline_v2/kit/${destino}/borradores.json ===`)

console.log('\n1. Nivel 1 (por visitas en Wikipedia)')
console.log(`   joyas: ${borradores.nivel_1.joyas.join(', ')}`)
console.log(`   imprescindibles: ${borradores.nivel_1.imprescindibles.join(', ')}`)
if (borradores.nivel_1.sin_datos.length) console.log(`   sin datos de Wikipedia: ${borradores.nivel_1.sin_datos.join(', ')}`)
const curatedJoyas = places.filter((p) => p.tier === 'joya').map((p) => p.name)
const curatedL1 = places.filter((p) => p.level === 1).map((p) => p.name)
if (curatedL1.length) {
  console.log(`   frente a lo curado: joyas ${overlap(borradores.nivel_1.joyas, curatedJoyas)} coinciden · nivel 1 ${overlap([...borradores.nivel_1.joyas, ...borradores.nivel_1.imprescindibles], curatedL1)} coinciden`)
  const missing = curatedL1.filter((n) => ![...borradores.nivel_1.joyas, ...borradores.nivel_1.imprescindibles].includes(n))
  if (missing.length) console.log(`   curado y no propuesto: ${missing.join(', ')}`)
}

console.log('\n2. Recorridos de tarde')
for (const [zone, flow] of Object.entries(borradores.afternoon_flow)) {
  console.log(`   ${zone} (después de ${flow.desde}, cena en ${flow.cena}): ${flow.recorrido.join(' → ') || '— nada cerca hacia la cena'}`)
  const curated = D.afternoon_flow?.[zone]
  if (curated) console.log(`      curado: ${curated.join(' → ')}  ·  en común ${overlap(flow.recorrido, curated)}`)
}

console.log('\n3. Rutas de 1 y 1,5 días')
for (const [id, block] of Object.entries(borradores.short_trips.blocks)) {
  console.log(`   ${id} ${block.label} (${block.preferred_slot}): ${block.core.join(' → ')}${block.extras_completo.length ? ` + completo: ${block.extras_completo.join(', ')}` : ''}${block.free_tour ? ' [el Free Tour lo sustituye]' : ''}`)
  const curated = Object.values(D.short_trips?.blocks ?? {}).find((b) => b.core?.some((name) => block.core.includes(name)))
  if (curated) console.log(`      curado "${curated.label}": ${curated.core.join(' → ')}${curated.extras_completo?.length ? ` + ${curated.extras_completo.join(', ')}` : ''}  ·  ${same(curated.core, block.core) ? 'igual' : `núcleo en común ${overlap(block.core, curated.core)}`}`)
}
const combos = borradores.short_trips.combinations
console.log(`   1 día: ${combos['1_dia'].default.join(' + ')}${Object.keys(combos['1_dia'].if_pool_contains).length ? ` · si el pool pide ${Object.entries(combos['1_dia'].if_pool_contains).map(([n, e]) => `${n}: ${e.blocks.join(' + ')}`).join('; ')}` : ''}`)
console.log(`   1,5 días: ${combos['1_5_dias'].default.join(' + ')}`)
const pruebas = borradores.short_trips._pruebas
console.log(`   probado con el motor: tranquilo ${pruebas.tranquilo_no_cabe.length ? `no cabe ${pruebas.tranquilo_no_cabe.join(', ')}` : 'cabe todo'} · completo ${pruebas.completo_no_cabe.length ? `no cabe ${pruebas.completo_no_cabe.join(', ')}` : 'cabe todo'}`)
if (D.short_trips?.combinations) console.log(`   curado: 1 día ${D.short_trips.combinations['1_dia']?.default?.join(' + ')} · 1,5 días ${D.short_trips.combinations['1_5_dias']?.default?.join(' + ')}`)

// ── Red ─────────────────────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Visitas a la página de Wikipedia del lugar en los últimos 60 días (la del JSON o la primera que
 * se encuentra por `search_en`). null = sin página; undefined = la red falló.
 */
async function wikipediaViews(place) {
  const [lang, title] = place.wikipedia_title?.includes(':') ? place.wikipedia_title.split(/:(.*)/) : ['en', place.wikipedia_title]
  const params = title ? `titles=${encodeURIComponent(title)}` : `generator=search&gsrlimit=1&gsrsearch=${encodeURIComponent(place.search_en ?? `${place.name} ${D.destination}`)}`
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(attempt === 0 ? WIKIPEDIA_PAUSE_MS : 10_000 * attempt)
    let response
    try {
      response = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageviews&pvipdays=60&redirects=1&${params}`, { headers: { 'User-Agent': 'app-rutas-kit-destino/1.0 (borradores locales de destinos)' } })
    } catch {
      continue
    }
    if (response.status === 429 || response.status >= 500) continue
    if (!response.ok) return null
    const json = await response.json()
    const page = Object.values(json.query?.pages ?? {})[0]
    if (!page || page.missing !== undefined) return { title: null, views: null }
    const views = Object.values(page.pageviews ?? {}).reduce((sum, n) => sum + (n ?? 0), 0)
    return { title: `${lang}:${page.title}`, views }
  }
  return undefined
}
