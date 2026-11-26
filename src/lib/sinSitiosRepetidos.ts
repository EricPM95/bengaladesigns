import type { DayPlan, Route, Stop } from './types'

/**
 * (V68, apartado 2) NUNCA UN SITIO DOS VECES EN EL VIAJE. Funciones puras (sin React ni almacén) para poder probarlas desde un script.
 *
 * Después de cualquier cambio (una reserva, mover una parada, Reorganizar, recuperar un día) ningún sitio puede salir en dos paradas del viaje. Cuentan las visitas de verdad: las nocturnas
 * (`isNightExperience` / `isNightView`, «Fontana de Trevi de noche») son OTRA visita del mismo sitio y no cuentan; tampoco las comidas, las pausas, los paseos, el tiempo libre, lo «de paso» ni las llegadas.
 *
 * `sitiosRepetidos(route)` dice qué sitios están repetidos AHORA. Un viaje que ya traía un sitio repetido a propósito (el viajero añadió «otra reserva» de la Cúpula otro día) no es un fallo nuevo:
 * `repetidosNuevos(antes, despues)` solo da los que el cambio ha CREADO, y `guardianDeSitios(antes, despues, que)` es el que decide: si el cambio creó alguno, devuelve la ruta de antes (no se guarda) y lo dice en el
 * registro (consola de desarrollo: «[V68] …»).
 */
export interface SitioRepetido {
  /** El nombre del sitio, tal como sale en la ruta. */
  nombre: string
  /** Dónde está: cada día y parada. */
  en: { dayId: string; dayNumber: number; stopId: string }[]
}

const sinTildes = (texto: string): string => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/** La clave con la que se compara el nombre de un sitio, o null si esa parada no es una visita a un sitio (se ignora). */
export function claveDeSitio(stop: Stop): string | null {
  if (stop.isNightExperience || stop.isNightView) return null
  if (stop.isBreak || stop.isZoneWalk || stop.isFreeWalk || stop.isFreeTime || stop.passThrough || stop.isArrival) return null
  if (stop.saltada) return null
  const nombre = sinTildes(stop.name ?? '')
  if (!nombre || /\((noche|de noche)\)\s*$/.test(nombre)) return null
  return nombre
}

/** Los sitios que están en más de una parada del viaje ahora mismo (sin contar las visitas nocturnas). */
export function sitiosRepetidos(route: Pick<Route, 'days'> | null | undefined): SitioRepetido[] {
  const porClave = new Map<string, SitioRepetido>()
  for (const day of route?.days ?? []) {
    for (const stop of day.stops) {
      const clave = claveDeSitio(stop)
      if (!clave) continue
      const fila = porClave.get(clave) ?? { nombre: stop.name, en: [] }
      fila.en.push({ dayId: day.id, dayNumber: day.dayNumber, stopId: stop.id })
      porClave.set(clave, fila)
    }
  }
  return [...porClave.values()].filter((fila) => fila.en.length > 1)
}

/** Los sitios que `despues` tiene repetidos y `antes` no (o que `despues` repite MÁS veces que `antes`): lo que el cambio ha creado. */
export function repetidosNuevos(antes: Pick<Route, 'days'> | null | undefined, despues: Pick<Route, 'days'> | null | undefined): SitioRepetido[] {
  const yaEstaban = new Map(sitiosRepetidos(antes).map((fila) => [sinTildes(fila.nombre), fila.en.length]))
  return sitiosRepetidos(despues).filter((fila) => fila.en.length > (yaEstaban.get(sinTildes(fila.nombre)) ?? 1))
}

/** El texto del registro para un cambio que repetiría sitios. */
export function textoDeRepetidos(que: string, repetidos: SitioRepetido[]): string {
  return `[V68] «${que}» no se guarda: dejaría ${repetidos.map((r) => `«${r.nombre}» en ${r.en.map((e) => `el día ${e.dayNumber}`).join(' y ')}`).join(', ')} dos veces en el viaje.`
}

export interface ResultadoDelGuardian {
  ok: boolean
  /** La ruta que se guarda: la nueva si va bien; la de antes si el cambio repetía sitios. */
  route: Route
  repetidos: SitioRepetido[]
}

/** Lo registrado por los guardianes en esta sesión (para la prueba: `window.__sitiosRepetidosLog`). */
export const registroDeRepetidos: string[] = []

/**
 * El guardián: compara la ruta de antes con la de después de un cambio. Si el cambio ha creado un sitio repetido, NO se guarda (devuelve la de antes), y se dice en el registro. `que` es el nombre del cambio
 * («guardar reserva», «recuperar el día», «reorganizar»…). Con `antes` null, no hay con qué comparar: se da por buena.
 */
export function guardianDeSitios(antes: Route | null | undefined, despues: Route, que: string): ResultadoDelGuardian {
  if (!antes) return { ok: true, route: despues, repetidos: [] }
  const repetidos = repetidosNuevos(antes, despues)
  if (repetidos.length === 0) return { ok: true, route: despues, repetidos }
  const texto = textoDeRepetidos(que, repetidos)
  registroDeRepetidos.push(texto)
  if (typeof console !== 'undefined') console.error(texto)
  if (typeof window !== 'undefined') (window as unknown as { __sitiosRepetidosLog?: string[] }).__sitiosRepetidosLog = registroDeRepetidos
  return { ok: false, route: antes, repetidos }
}

/** Todas las paradas de un día que son visitas a un sitio (por si una pieza necesita la lista con la misma regla). */
export const visitasDeSitio = (day: DayPlan): Stop[] => day.stops.filter((stop) => claveDeSitio(stop) != null)
