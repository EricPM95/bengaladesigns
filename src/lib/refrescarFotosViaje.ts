import type { DayPlan, Route, Stop } from './types'
import { addDaysToIso } from './dateRange'
import { photoNameOf } from './placePhoto'

/**
 * LAS FOTOS DE UN VIAJE YA CREADO (6-nov, ARREGLO_FOTOS_VIAJE). Cada parada guarda su foto (`photoUrl`) al crearse el viaje. Si después cambian nuestras fotos del destino
 * (Lanzarote, Roma), un viaje antiguo se quedaba con las viejas. Al abrir un viaje, se pregunta al servidor (`/api/fotos-viaje`) por la foto PROPIA de cada parada, con el mismo cruce
 * que al crear (nombre normalizado o id): la propia sustituye a la guardada; «sin foto» (Lanzarote sin foto nuestra, restaurantes) deja el color de fondo; y lo que el servidor no
 * decide (una foto de Wikipedia o de Unsplash de Roma) se queda como estaba. Nunca busca fotos nuevas ni toca las paradas con foto fija (Free Tour).
 */

type Respuesta = { photo_source: 'propia'; photo_url: string } | { photo_source: 'none' } | null

/** Las paradas de un día cuya foto se puede refrescar. */
function paradasDelDia(day: DayPlan): Stop[] {
  return [...day.stops, ...(day.spareStops ?? []), ...(day.rainPlan?.add ?? [])].filter((stop) => !(stop.isBreak || stop.isArrival || stop.fixedPhotoUrl || (stop.isFreeWalk && !stop.photoName)))
}

/**
 * Devuelve, por id de parada, la foto nueva (`''` = sin foto) de las paradas cuya foto cambia. Vacío si no cambia nada o si el servidor no contesta.
 * No modifica la ruta.
 */
export async function fotosNuevasDelViaje(route: Route, pedir: typeof fetch = fetch): Promise<Map<string, string>> {
  const cambios = new Map<string, string>()
  const startIso = route.answers.dateRange?.start ?? null
  const preguntas: { stop: Stop; day: DayPlan }[] = []
  for (const day of route.days) for (const stop of paradasDelDia(day)) preguntas.push({ stop, day })
  if (preguntas.length === 0) return cambios
  let resultados: Respuesta[] = []
  try {
    const respuesta = await pedir('/api/fotos-viaje', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: preguntas.map(({ stop, day }) => ({
          name: photoNameOf(stop),
          city: day.city,
          ...(startIso ? { date: addDaysToIso(startIso, day.dayNumber - 1) } : {}),
          ...(stop.noOwnPhoto ? { exclude_own: true } : {}),
        })),
      }),
    })
    if (!respuesta.ok) return cambios
    resultados = ((await respuesta.json()) as { resultados?: Respuesta[] }).resultados ?? []
  } catch {
    return cambios
  }
  // Nunca la misma foto en dos paradas del mismo día (como al crear el viaje): la segunda se queda como estaba.
  const usadas = new Map<string, Set<string>>()
  preguntas.forEach(({ stop, day }, i) => {
    const r = resultados[i]
    if (!r) return
    const usadasDelDia = usadas.get(day.id) ?? new Set<string>()
    usadas.set(day.id, usadasDelDia)
    if (r.photo_source === 'propia' && r.photo_url) {
      if (usadasDelDia.has(r.photo_url.replace(/\?.*$/, ''))) return
      usadasDelDia.add(r.photo_url.replace(/\?.*$/, ''))
      if (stop.photoUrl !== r.photo_url) cambios.set(stop.id, r.photo_url)
    } else if (r.photo_source === 'none') {
      if (stop.photoUrl) cambios.set(stop.id, '')
    }
  })
  return cambios
}

/** Aplica los cambios a una ruta SIN mutarla: solo el `photoUrl` de las paradas que cambian (el resto de la ruta queda igual aunque el viajero la haya tocado mientras tanto). */
export function conLasFotosNuevas(route: Route, cambios: Map<string, string>): Route {
  if (cambios.size === 0) return route
  const cambia = (stop: Stop): Stop => (cambios.has(stop.id) ? { ...stop, photoUrl: cambios.get(stop.id) ?? '' } : stop)
  return {
    ...route,
    days: route.days.map((day) => ({
      ...day,
      stops: day.stops.map(cambia),
      ...(day.spareStops ? { spareStops: day.spareStops.map(cambia) } : {}),
      ...(day.rainPlan ? { rainPlan: { ...day.rainPlan, add: (day.rainPlan.add ?? []).map(cambia) } } : {}),
    })),
  }
}
