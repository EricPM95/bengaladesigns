import { hasRealCoordinates, haversineMeters } from './distanceMock'
import type { Coordinates, Route, Stop } from './types'
import { articuloDeLosDatos } from './articulos'

/**
 * V44 §1: DÓNDE ESTÁ EL VIAJERO respecto al viaje. El GPS solo cuenta para los minutos y los cierres cuando está EN LA RUTA; si no, HOY cuenta con el tiempo del plan.
 * (Caso real: Eric, en Barcelona, con el viaje en Roma: «A pie · 10407 min» y el Coliseo y el Foro a «Ya ha cerrado» a las 8:30.)
 *  · `ruta`: a 30 min andando o menos de la parada (en coche, a un cuarto de hora de carretera): «12 min · Desde ti».
 *  · `destino`: en el destino pero lejos de la ruta (el aeropuerto): el tiempo del plan, «Del alojamiento al Coliseo».
 *  · `fuera`: a más de 50 km de todo el viaje: «—» y «Estás lejos».
 *  · `sin`: sin ubicación (no se ha dado permiso o aún no ha llegado): el tiempo del plan.
 * La app lo nota sola al acercarse: se recalcula con cada posición nueva, sin botón.
 */
export type ZonaUbicacion = 'ruta' | 'destino' | 'fuera' | 'sin'

export const KM_FUERA_DEL_DESTINO = 50
const M_RUTA_A_PIE = 30 * 80
const M_RUTA_EN_COCHE = 25000

export function zonaDeUbicacion(p: { ubicacion: Coordinates | null; route: Route; referencia: Stop | null; enCoche: boolean }): ZonaUbicacion {
  const u = p.ubicacion
  if (!u || !hasRealCoordinates(u)) return 'sin'
  const paradas = p.route.days.flatMap((d) => d.stops).filter((s) => hasRealCoordinates(s.coordinates))
  if (paradas.length > 0 && paradas.every((s) => haversineMeters(u, s.coordinates) > KM_FUERA_DEL_DESTINO * 1000)) return 'fuera'
  const ref = p.referencia && hasRealCoordinates(p.referencia.coordinates) ? p.referencia : null
  if (ref && haversineMeters(u, ref.coordinates) <= (p.enCoche ? M_RUTA_EN_COCHE : M_RUTA_A_PIE)) return 'ruta'
  return 'destino'
}

/** «al Coliseo», «a la Fontana de Trevi», «a los Museos Vaticanos»: el artículo se saca de la primera palabra (no hay género en los datos). */
export function aDestino(nombre: string): string {
  const limpio = nombre.trim()
  // (V58 §5) Primero lo que dicen los datos del destino («Montserrat» no lleva artículo); si el sitio no está, se adivina por la terminación.
  if (!/^(el|la|los|las)s/i.test(limpio)) {
    const delDato = articuloDeLosDatos(limpio)
    if (delDato !== null) return delDato === 'el' ? `al ${limpio}` : delDato ? `a ${delDato} ${limpio}` : `a ${limpio}`
  }
  const m = /^(el|la|los|las)\s+(.*)$/i.exec(limpio)
  if (m) {
    const art = m[1].toLowerCase()
    return art === 'el' ? `al ${m[2]}` : `a ${art} ${m[2]}`
  }
  const primera = limpio.split(/\s+/)[0].toLowerCase()
  const art = primera.endsWith('as') ? 'las' : primera.endsWith('os') ? 'los' : primera.endsWith('a') ? 'la' : 'el'
  return art === 'el' ? `al ${limpio}` : `a ${art} ${limpio}`
}

/** «del Panteón», «de la Fontana de Trevi», «de los Museos Vaticanos». */
export function deOrigen(nombre: string): string {
  const a = aDestino(nombre)
  return a.startsWith('al ') ? `del ${a.slice(3)}` : `de ${a.slice(2)}`
}

/** «el Panteón», «la Fontana de Trevi», «los Museos Vaticanos» (con su artículo, para «Desde el Panteón»). */
export function conArticulo(nombre: string): string {
  const a = aDestino(nombre)
  return a.startsWith('al ') ? `el ${a.slice(3)}` : a.slice(2)
}

/**
 * (V46) La línea corta de la caja de minutos cuando se cuenta con el plan (sin ubicación en la ruta): «Desde el alojamiento» en la primera parada del día, «Desde el Panteón» en las demás.
 * Sin alojamiento en el viaje, los minutos se cuentan desde el centro de su zona: «Desde el centro».
 */
export function desdeDonde(origen: string | null, sinAlojamiento = false, zonaNombre: string | null = null): string {
  // (V58 §1) Con el hotel puesto, «Desde el alojamiento»; solo con la zona, «Desde Costa Teguise»; sin nada, «Desde el centro».
  return origen ? `Desde ${conArticulo(origen)}` : zonaNombre ? `Desde ${zonaNombre}` : sinAlojamiento ? 'Desde el centro' : 'Desde el alojamiento'
}

/** La frase de la caja de minutos cuando se cuenta con el plan: «Del alojamiento al Coliseo», «Del Panteón a la Fontana de Trevi». */
export function deDondeADonde(origen: string | null, destino: string): string {
  const de = origen ? deOrigen(origen) : 'del alojamiento'
  return `${de.charAt(0).toUpperCase()}${de.slice(1)} ${aDestino(destino)}`
}
