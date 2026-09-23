/**
 * Validador de datos de un destino curado (kit de nuevo destino, paso 1).
 *
 *   node scripts/destino/validar.mjs roma             # todo, con red (Wikipedia + Mapbox, con caché)
 *   node scripts/destino/validar.mjs roma --sin-red   # sin comprobar coordenadas
 *
 * Revisa el JSON (data/pipeline_v2/<destino>.json) contra las reglas del motor que NO se pueden
 * deducir: lo que falta, lo que no cuadra y lo que hay que decidir a mano. No corrige nada; dice qué
 * mirar y, cuando puede, propone. Sale con código 1 si queda algo en rojo.
 *
 *   1. Referencias: todo nombre citado (grupos, zonas, joyas, relaciones, recorridos, rutas cortas,
 *      Free Tour, barrios de cena) existe.
 *   2. Grupos coherentes: miembros con su `group`, orden y pares inseparables dentro del grupo,
 *      miembros a menos de 800 m, acceso + monumento según la norma (INVARIANTES 17b).
 *   3. Nivel 1: 4-5 joyas y 10-12 lugares de nivel 1 en total (INVARIANTES 11).
 *   4. Visitas largas (>= 180 min, contando grupos) frente a `core_days`: como mucho una por día.
 *   5. Horarios: interiores sin horario (el motor supone 09:00-17:00), horarios que no se leen,
 *      exteriores de pago sin horario.
 *   6. Pares cercanos sin decidir, con propuesta de `contained_in` o `neighbor_of` (INVARIANTES 16):
 *      a menos de 150 m hay que decidir (rojo); de 150 a 300 m es una propuesta (amarillo). Lo
 *      decidido "sin relación" se apunta en `destination_config.unrelated_pairs`.
 *   7. Coordenadas contra Wikipedia: rojo si se separan más de 200 m. Mapbox solo como segunda
 *      opinión (amarillo) cuando Wikipedia no encuentra el sitio: su buscador devuelve tiendas y
 *      bares que se llaman como el monumento (medido en Roma: 27 de 67 a más de 200 m, ninguno
 *      con razón), así que por sí solo no puede dar un rojo. Wikipedia también se equivoca de
 *      artículo al buscar (Quartiere Coppedè salía en Génova): lo revisado a mano se marca en el lugar
 *      con `"coordinates_checked": true` y no vuelve a salir.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildUnits } from '../../shared/routeEngine/units.js'
import { parseHoursSessions } from '../../shared/routeEngine/openingHours.js'
import { straightLineMeters } from '../../shared/routeEngine/travelTimes.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const destino = (process.argv[2] ?? '').toLowerCase()
if (!destino || destino.startsWith('--')) {
  console.error('Uso: node scripts/destino/validar.mjs <destino> [--sin-red]')
  process.exit(2)
}
const SIN_RED = process.argv.includes('--sin-red')
const D = JSON.parse(readFileSync(join(ROOT, `data/pipeline_v2/${destino}.json`), 'utf8'))

/** Lugares de nivel 1 y joyas que pide el motor (decisión del 2026-09-23). */
const JOYAS = [4, 5]
const NIVEL_1 = [10, 12]
const VISITA_LARGA_MIN = 180
const PARES_METROS = 300
/** Por debajo de esto el par hay que decidirlo sí o sí (el umbral con el que se decidió Roma). */
const PARES_OBLIGATORIOS_METROS = 150
const GRUPO_MAX_METROS = 800
const COORD_MAX_METROS = 200
/** Pausa entre peticiones a Wikipedia: sin ella corta (429) a las pocas decenas. */
const WIKIPEDIA_PAUSE_MS = 1500
/** Sitios extensos: su punto es convencional y es normal que no coincida con el de Wikipedia. */
const EXTENSO = /\b(barrio|calle|parque|jard[ií]n|paseo|via|avenida|mercado)\b/i

const places = D.places ?? []
const byName = new Map(places.map((place) => [place.name, place]))
const sections = []
const section = (title) => {
  const entry = { title, red: [], warn: [], info: [] }
  sections.push(entry)
  return entry
}

// ── 1. Referencias ──────────────────────────────────────────────────────────────────────────
{
  const s = section('Referencias a lugares que no existen')
  const check = (where, name) => {
    if (typeof name === 'string' && !byName.has(name)) s.red.push(`${where}: "${name}"`)
  }
  for (const [id, group] of Object.entries(D.groups ?? {})) {
    for (const key of ['places', 'order', 'order_evening']) for (const name of group[key] ?? []) check(`groups.${id}.${key}`, name)
    for (const pair of group.inseparable ?? []) for (const name of pair) check(`groups.${id}.inseparable`, name)
  }
  for (const [id, zone] of Object.entries(D.zones ?? {})) for (const name of zone.places ?? []) check(`zones.${id}`, name)
  for (const name of D.joyas ?? []) check('joyas', name)
  for (const place of places) {
    check(`${place.name}.contained_in`, place.contained_in)
    for (const name of place.neighbor_of ?? []) check(`${place.name}.neighbor_of`, name)
    for (const name of place.approach_to ?? []) check(`${place.name}.approach_to`, name)
    check(`${place.name}.related_to`, place.related_to)
    for (const name of place.pass_by?.includes ?? []) check(`${place.name}.pass_by.includes`, name)
    if (place.zone && !D.zones?.[place.zone]) s.red.push(`${place.name}: zona "${place.zone}" no existe`)
    if (place.group && !D.groups?.[place.group]) s.red.push(`${place.name}: grupo "${place.group}" no existe`)
  }
  for (const [zone, flow] of Object.entries(D.afternoon_flow ?? {})) for (const name of flow) check(`afternoon_flow.${zone}`, name)
  for (const [id, block] of Object.entries(D.short_trips?.blocks ?? {})) {
    for (const name of [...(block.core ?? []), ...(block.extras_completo ?? [])]) check(`short_trips.blocks.${id}`, name)
    for (const [exp, swap] of Object.entries(block.swaps ?? {})) {
      for (const name of [...(swap.replace ?? []), ...(swap.with ?? []), ...(swap.add ?? []), ...(swap.add_at_end ?? [])]) check(`short_trips.blocks.${id}.swaps.${exp}`, name)
      if (swap.insert_before) check(`short_trips.blocks.${id}.swaps.${exp}.insert_before`, swap.insert_before)
    }
  }
  const tour = D.default_free_tour
  for (const name of [...(tour?.covers ?? []), ...(tour?.early_visit_ok ?? [])]) check('default_free_tour', name)
  for (const zone of D.destination_config?.dinner_zones ?? []) {
    if (!Array.isArray(D.meal_zones?.[zone]?.cena?.coordinates)) s.red.push(`destination_config.dinner_zones: "${zone}" sin meal_zones.${zone}.cena.coordinates`)
  }
  for (const pair of D.destination_config?.unrelated_pairs ?? []) for (const name of pair) check('destination_config.unrelated_pairs', name)
}

// ── 2. Grupos coherentes ────────────────────────────────────────────────────────────────────
{
  const s = section('Grupos')
  for (const [id, group] of Object.entries(D.groups ?? {})) {
    const members = places.filter((place) => place.group === id)
    const listed = group.places ?? []
    for (const place of members) if (!listed.includes(place.name)) s.red.push(`${id}: ${place.name} dice ser del grupo y no está en groups.${id}.places`)
    for (const name of listed) if (byName.has(name) && byName.get(name).group !== id) s.red.push(`${id}: ${name} está en el grupo pero su "group" es ${byName.get(name).group ?? 'ninguno'}`)
    const order = group.order ?? listed
    const byGroupOrder = [...members].sort((a, b) => (a.group_order ?? 0) - (b.group_order ?? 0)).map((place) => place.name)
    if (members.every((place) => place.group_order != null) && byGroupOrder.join('|') !== order.filter((name) => byGroupOrder.includes(name)).join('|')) {
      s.warn.push(`${id}: group_order (${byGroupOrder.join(' → ')}) no coincide con groups.${id}.order (${order.join(' → ')}); manda order`)
    }
    for (const pair of group.inseparable ?? []) for (const name of pair) if (!listed.includes(name)) s.red.push(`${id}: el par inseparable cita ${name}, que no es del grupo`)
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const meters = straightLineMeters(members[i].coordinates, members[j].coordinates)
        if (meters > GRUPO_MAX_METROS) s.warn.push(`${id}: ${members[i].name} y ${members[j].name} a ${Math.round(meters)} m — ¿de verdad es una visita?`)
      }
    }
  }
  // Norma acceso + monumento (INVARIANTES 17b).
  for (const access of places.filter((place) => place.approach_to)) {
    for (const name of access.approach_to) {
      const monument = byName.get(name)
      if (!monument) continue
      const free = monument.is_free_access ?? monument.type === 'exterior'
      if (!free && !monument.visible_from_outside) continue
      const group = access.group && access.group === monument.group ? D.groups[access.group] : null
      if (!group?.inseparable?.some((pair) => pair.includes(access.name) && pair.includes(monument.name))) {
        s.red.push(`${access.name} + ${monument.name}: deberían ser un grupo inseparable (${free ? 'se visita gratis' : 'se ve desde fuera'})`)
      }
    }
  }
  for (const place of places.filter((p) => p.related_to)) {
    const partner = byName.get(place.related_to)
    if (partner && partner.related_to !== place.name) s.warn.push(`related_to no es mutuo: ${place.name} → ${place.related_to}, pero ${partner.name} → ${partner.related_to ?? 'nada'}`)
  }
}

// ── 3. Nivel 1 ──────────────────────────────────────────────────────────────────────────────
{
  const s = section('Nivel 1: joyas e imprescindibles')
  const level1 = places.filter((place) => place.level === 1)
  const joyas = level1.filter((place) => place.tier === 'joya')
  const inRange = (n, [a, b]) => n >= a && n <= b
  ;(inRange(joyas.length, JOYAS) ? s.info : s.red).push(`${joyas.length} joyas (${JOYAS.join('-')}): ${joyas.map((p) => p.name).join(', ')}`)
  ;(inRange(level1.length, NIVEL_1) ? s.info : s.red).push(`${level1.length} lugares de nivel 1 en total (${NIVEL_1.join('-')})`)
  const listed = D.joyas ?? []
  const tierNames = joyas.map((p) => p.name)
  if (listed.length && (listed.some((name) => !tierNames.includes(name)) || tierNames.some((name) => !listed.includes(name)))) {
    s.red.push(`la lista "joyas" (${listed.join(', ')}) no coincide con los tier "joya" (${tierNames.join(', ')})`)
  }
  for (const place of level1.filter((p) => !p.tier)) s.red.push(`${place.name}: nivel 1 sin tier (joya o imprescindible)`)
}

// ── 4. Visitas largas frente a core_days ─────────────────────────────────────────────────────
{
  const s = section('Visitas largas')
  const units = buildUnits(D, false).filter((unit) => !unit.isFreeTour && unit.minutes >= VISITA_LARGA_MIN)
  const coreDays = D.destination_config?.core_days
  const essentialLong = units.filter((unit) => unit.level === 1)
  s.info.push(`${units.length} visitas de ${VISITA_LARGA_MIN}+ min: ${units.map((u) => `${u.places.map((p) => p.name).join(' + ')} (${u.minutes})`).join('; ')}`)
  if (!coreDays) s.red.push('destination_config.core_days no está')
  else if (essentialLong.length > coreDays) s.red.push(`${essentialLong.length} visitas largas de nivel 1 y core_days = ${coreDays}: no caben una por día`)
  else s.info.push(`core_days = ${coreDays}: caben (${essentialLong.length} de nivel 1)`)
}

// ── 5. Horarios ─────────────────────────────────────────────────────────────────────────────
{
  const s = section('Horarios')
  for (const place of places) {
    const free = place.is_free_access ?? place.type === 'exterior'
    if (!place.schedule) {
      if (place.type !== 'exterior') s.red.push(`${place.name}: interior sin horario (el motor supone 09:00-17:00)`)
      else if (!free) s.red.push(`${place.name}: exterior de pago sin horario`)
      continue
    }
    if (parseHoursSessions(place.schedule).length === 0 && !/24\s*h|siempre|abierto/i.test(place.schedule)) s.red.push(`${place.name}: el horario "${place.schedule}" no se lee`)
    if (place.last_entry && !/^\d{1,2}:\d{2}$/.test(place.last_entry)) s.red.push(`${place.name}: last_entry "${place.last_entry}" no es HH:MM`)
  }
}

// ── 6. Pares a menos de 300 m ───────────────────────────────────────────────────────────────
{
  const s = section(`Pares a menos de ${PARES_METROS} m sin decidir (a menos de ${PARES_OBLIGATORIOS_METROS} m, obligatorio)`)
  const unrelated = D.destination_config?.unrelated_pairs ?? []
  // Lo de dentro se decide por su contenedor: el Elefantino (dentro de la Minerva) frente al Panteón
  // ya está decidido si la Minerva y el Panteón lo están.
  const anchor = (place) => (place.contained_in && byName.get(place.contained_in)) || place
  const decided = (a, b) => decidedPair(a, b) || (anchor(a) !== a || anchor(b) !== b ? anchor(a) === anchor(b) || decidedPair(anchor(a), anchor(b)) : false)
  const decidedPair = (a, b) =>
    (a.group && a.group === b.group) ||
    a.contained_in === b.name ||
    b.contained_in === a.name ||
    (a.neighbor_of ?? []).includes(b.name) ||
    (b.neighbor_of ?? []).includes(a.name) ||
    (a.approach_to ?? []).includes(b.name) ||
    (b.approach_to ?? []).includes(a.name) ||
    // Lo de dentro de un mismo sitio ya va con él: la Minerva y su Elefantino, frente al Panteón.
    (a.contained_in && a.contained_in === b.contained_in) ||
    unrelated.some((pair) => pair.includes(a.name) && pair.includes(b.name))
  /** Lo pequeño dentro de lo grande (una fuente en su plaza o barrio); si no, vecinos. */
  const propose = (a, b) => {
    const area = (p) => EXTENSO.test(p.name) || (p.tags ?? []).some((t) => ['barrio', 'calle', 'parque', 'plaza'].includes(t))
    const small = (p) => (p.duration_minutes ?? 30) <= 15 || (p.tags ?? []).some((t) => ['fuente', 'curiosidad'].includes(t))
    if (a.level === 1 && b.level === 1) return 'sin relación (dos imprescindibles: cada uno tiene su sitio en el reparto)'
    if (area(a) && small(b) && !area(b)) return `${b.name} contained_in ${a.name}`
    if (area(b) && small(a) && !area(a)) return `${a.name} contained_in ${b.name}`
    // Secundario: el de menor nivel; a igualdad, el más corto.
    const [primary, secondary] = (a.level ?? 3) < (b.level ?? 3) || ((a.level ?? 3) === (b.level ?? 3) && (a.duration_minutes ?? 0) >= (b.duration_minutes ?? 0)) ? [a, b] : [b, a]
    return `${secondary.name} neighbor_of ${primary.name}`
  }
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const [a, b] = [places[i], places[j]]
      const meters = straightLineMeters(a.coordinates, b.coordinates)
      if (meters >= PARES_METROS || decided(a, b)) continue
      ;(meters < PARES_OBLIGATORIOS_METROS ? s.red : s.warn).push(`${String(Math.round(meters)).padStart(3)} m  ${a.name} (N${a.level}) — ${b.name} (N${b.level})  →  propuesta: ${propose(a, b)}`)
    }
  }
  if (s.red.length || s.warn.length) s.info.push('Lo que se decida "sin relación" va en destination_config.unrelated_pairs para que no vuelva a salir.')
}

// ── 7. Coordenadas contra Wikipedia y Mapbox ────────────────────────────────────────────────
if (!SIN_RED) {
  const s = section(`Coordenadas (Wikipedia y Mapbox, más de ${COORD_MAX_METROS} m)`)
  const cachePath = join(ROOT, `data/pipeline_v2/kit/${destino}/coordenadas.json`)
  const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}
  const token = readEnv('VITE_MAPBOX_TOKEN')
  const center = Object.values(D.zones ?? {})[0]?.center ?? places[0]?.coordinates
  // Mapbox, solo dentro del destino: sin caja devolvía un "Elefantino" en Camerún.
  const lats = places.map((p) => p.coordinates[0])
  const lngs = places.map((p) => p.coordinates[1])
  const bbox = [Math.min(...lngs) - 0.05, Math.min(...lats) - 0.05, Math.max(...lngs) + 0.05, Math.max(...lats) + 0.05]
  for (const place of places) {
    const key = place.name
    if (place.coordinates_checked) continue
    if (!cache[key] || cache[key].version !== 2) {
      const wikipedia = await wikipediaCoordinates(place)
      // undefined = la red falló (límite de peticiones): no se guarda, se reintenta en la próxima pasada.
      if (wikipedia === undefined) {
        s.warn.push(`${place.name}: Wikipedia no ha contestado — vuelve a pasar el validador`)
        continue
      }
      cache[key] = { version: 2, wikipedia, mapbox: !wikipedia && token ? await mapboxCoordinates(place, center, bbox, token) : null }
      mkdirSync(dirname(cachePath), { recursive: true })
      writeFileSync(cachePath, JSON.stringify(cache, null, 1))
    }
    const found = cache[key]
    const extenso = EXTENSO.test(place.name) || (place.tags ?? []).some((t) => ['barrio', 'calle', 'parque'].includes(t))
    const source = found.wikipedia ? 'wikipedia' : found.mapbox ? 'mapbox' : null
    if (!source) {
      s.warn.push(`${place.name}: ni Wikipedia ni Mapbox lo encuentran — revisar a mano`)
      continue
    }
    const coords = found[source]
    const meters = straightLineMeters(place.coordinates, coords)
    if (meters <= COORD_MAX_METROS) continue
    const line = `${place.name}${extenso ? ' (extenso)' : ''}: ${source} a ${Math.round(meters)} m (${coords.map((n) => n.toFixed(5)).join(', ')})`
    ;(source === 'wikipedia' && !extenso ? s.red : s.warn).push(line)
  }
  if (!token) s.info.push('Sin VITE_MAPBOX_TOKEN en .env.local: lo que Wikipedia no encuentra no tiene segunda opinión')
}

// ── Informe ─────────────────────────────────────────────────────────────────────────────────
console.log(`\n=== Validación de datos · ${D.destination} (${places.length} lugares) ===`)
for (const s of sections) {
  const mark = s.red.length ? '🔴' : s.warn.length ? '🟡' : '🟢'
  console.log(`\n${mark} ${s.title}${s.red.length ? ` — ${s.red.length} por resolver` : ''}`)
  for (const line of s.red) console.log(`   🔴 ${line}`)
  for (const line of s.warn) console.log(`   🟡 ${line}`)
  for (const line of s.info) console.log(`   · ${line}`)
}
const reds = sections.reduce((total, s) => total + s.red.length, 0)
console.log(`\n${reds === 0 ? '✅ Datos listos' : `❌ ${reds} cosas por resolver`} (🟡 = mirar, no bloquea)`)
if (reds > 0) process.exitCode = 1

// ── Red ─────────────────────────────────────────────────────────────────────────────────────

function readEnv(key) {
  if (process.env[key]) return process.env[key]
  const path = join(ROOT, '.env.local')
  if (!existsSync(path)) return null
  const line = readFileSync(path, 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${key}=`))
  return line ? line.slice(key.length + 1).trim() : null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * [lat, lng] de la página de Wikipedia: la del JSON (`wikipedia_title`, "en:Colosseum") o la primera
 * con coordenadas que se encuentra por `search_en`. null = no la encuentra; undefined = la red falló.
 * Una petición cada 1,5 s y reintentos al 429: sin pausa, Wikipedia corta a las pocas decenas.
 */
async function wikipediaCoordinates(place) {
  const [lang, title] = place.wikipedia_title?.includes(':') ? place.wikipedia_title.split(/:(.*)/) : ['en', place.wikipedia_title]
  // Buscando, se miran los 3 primeros: el primero a veces es un artículo general sin coordenadas.
  const params = title
    ? `titles=${encodeURIComponent(title)}`
    : `generator=search&gsrlimit=3&gsrsearch=${encodeURIComponent(place.search_en ?? `${place.name} ${D.destination}`)}`
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(attempt === 0 ? WIKIPEDIA_PAUSE_MS : 10_000 * attempt)
    let response
    try {
      response = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=coordinates&redirects=1&${params}`, { headers: { 'User-Agent': 'app-rutas-kit-destino/1.0 (validador local de datos de destinos)' } })
    } catch {
      continue
    }
    if (response.status === 429 || response.status >= 500) continue
    if (!response.ok) return null
    const json = await response.json()
    const pages = Object.values(json.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    const coords = pages.find((page) => page.coordinates?.[0])?.coordinates[0]
    return coords ? [coords.lat, coords.lon] : null
  }
  return undefined
}

/** [lat, lng] del primer resultado de Mapbox Search Box dentro del destino. */
async function mapboxCoordinates(place, center, bbox, token) {
  const query = encodeURIComponent(place.search_en ?? `${place.name} ${D.destination}`)
  try {
    const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/forward?q=${query}&limit=1&types=poi&bbox=${bbox.join(',')}&proximity=${center[1]},${center[0]}&access_token=${token}`)
    const json = await response.json()
    const coords = json.features?.[0]?.geometry?.coordinates
    return coords ? [coords[1], coords[0]] : null
  } catch {
    return null
  }
}
