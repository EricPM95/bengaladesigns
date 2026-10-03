/**
 * Un `id` por sitio y lo que enseña cada parada (REGLAS_RUTAS, reglas 0 y 5).
 *
 * Cada ficha de `places` (y cada nocturna y cada paseo) lleva su `id` fijo en el JSON del destino. Una parada lleva `site_id` (su sitio
 * principal) y `muestra` (la lista de ids de todo lo que enseña): una nocturna como «El Puente y el Castillo iluminados» enseña dos; el
 * Free Tour, todo lo que recorre (`covers`); «X visto desde Y», lo que se ve desde ahí. La prueba y el motor comparan siempre por id,
 * nunca por el texto del nombre.
 */
const stripNight = (name) => String(name ?? '').replace(/\s*\(noche\)$/, '')

/** nombre → id y lista de ids válidos (fichas + sitios extra + nocturnas + paseos). */
export function siteRegistry(destData) {
  const byName = new Map()
  const names = new Map()
  for (const place of destData.places ?? []) {
    if (!place.id) continue
    byName.set(place.name, place.id)
    names.set(place.id, place.name)
  }
  for (const [id, name] of Object.entries(destData.destination_config?.sitios_extra ?? {})) {
    if (id.startsWith('_')) continue
    names.set(id, name)
  }
  for (const entry of [...(destData.night_experiences ?? []), ...(destData.zone_walks ?? [])]) if (entry.id) names.set(entry.id, entry.name)
  return { byName, names, ids: new Set(names.keys()) }
}

const idsOf = (registry, list) => (list ?? []).map((name) => registry.byName.get(name) ?? null).filter(Boolean)

/** El título con el que sale un paseo libre → su zona y cuál de sus nombres es (nombre, iluminado, navidad, si_visto). */
function paseoKey(destData, title) {
  const zonas = destData.destination_config?.paseo_libre?.zonas ?? {}
  const prefix = 'Pasea y piérdete por '
  for (const [zone, config] of Object.entries(zonas)) {
    if (title === `${prefix}${config.nombre}`) return [zone, 'nombre']
    if (config.iluminado && title === `${prefix}${config.iluminado}`) return [zone, 'iluminado']
    if (config.titulo_navidad && title === config.titulo_navidad) return [zone, 'navidad']
    if (config.si_visto_nombre && title === `${prefix}${config.si_visto_nombre}`) return [zone, 'si_visto']
  }
  return null
}

/** @returns {{ site_id: string|null, muestra: string[] }} */
export function muestraOf(destData, stop, registry = siteRegistry(destData)) {
  const config = destData.destination_config ?? {}
  const own = (list) => [...new Set(list)]
  // El Free Tour: lo que recorre.
  if (stop.is_free_tour) return { site_id: 'free_tour', muestra: own(idsOf(registry, destData.default_free_tour?.covers)) }
  // Una nocturna: lo que dice su ficha.
  if (stop.is_night_experience) {
    const night = (destData.night_experiences ?? []).find((entry) => entry.name === stop.name)
    return { site_id: night?.id ?? null, muestra: own(night?.muestra ?? []) }
  }
  const name = stop.place_name ?? stop.name
  const place = (destData.places ?? []).find((candidate) => candidate.name === name)
  // Un mirador que llega de noche: «{lugar} iluminado» (o el título propio de ese lugar, con lo que enseña).
  if (stop.night_view) {
    const override = config.night_view_overrides?.[name]
    if (override?.muestra) return { site_id: place?.id ?? null, muestra: own(override.muestra) }
  }
  // Un paseo libre del motor: lo de su zona y su título.
  if (stop.is_free_walk && !place) {
    const key = paseoKey(destData, stop.name)
    const muestra = key ? config.paseo_muestras?.[key[0]]?.[key[1]] : null
    return { site_id: key ? `paseo_${key[0]}` : null, muestra: own(muestra ?? []) }
  }
  // Una parada escrita que enseña otra cosa que su ficha (el lago de Villa Borghese, Via Margutta).
  const titled = config.sitios_por_titulo?.[stop.display_title] ?? config.sitios_por_titulo?.[stop.photo_name]
  if (titled) return { site_id: titled[0], muestra: own(titled) }
  if (!place) return { site_id: null, muestra: [] }
  // Por fuera o visto desde otro sitio: también lo que se ve con ello (el Altar y la Plaza Venecia, el Coliseo y el Arco).
  const seen = idsOf(registry, stop.pass_by_includes)
  return { site_id: place.id, muestra: own([place.id, ...seen]) }
}

/** Escribe `site_id` y `muestra` en cada parada del día. */
export function attachSites(destData, day) {
  const registry = siteRegistry(destData)
  for (const stop of day.stops ?? []) {
    const { site_id, muestra } = muestraOf(destData, stop, registry)
    stop.site_id = site_id
    stop.muestra = muestra
  }
  return day
}

export { stripNight }
