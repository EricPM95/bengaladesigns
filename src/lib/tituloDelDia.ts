import { useDestinationExcursions, destinoYaCargado } from './destinationExcursions'
import { computeDayTravelInfo } from './dayTravelInfo'
import { FREE_DAY_DEFAULT_NAME } from './freeDays'
import { isManualRoute } from './manualPlan'
import { manualDayTitle } from './bookings'
import { parseTimeToMinutes } from './time'
import type { DayPlan, Route, Stop } from './types'

/**
 * EL TÍTULO DE UN DÍA (tanda 6y7, punto 6). Una sola regla, en un solo sitio: todo lugar que pinte el nombre de un día llama a `nombreDelDia` (o al gancho `useNombreDeDias`).
 * Se calcula al enseñarlo, con las paradas que el día YA tiene (no cambia qué paradas van en cada día) y no se guarda en el viaje. Sin horas.
 *
 * LA REGLA (los nombres salen del dato del destino: `grupos_dia` y el `grupo_dia` de cada sitio, nunca del código):
 *  1. Si el viajero le puso nombre al día (`nameByUser`), manda el suyo. Un día que añadió él con «+ Añadir día» se llama como lo escribió.
 *  2. Un día de excursión (de día entero) se llama «Excursión desde Roma»; sus paradas no se cuentan.
 *  3. Se cuenta cuántas paradas del día hay de cada grupo. Cuentan los sitios, los paseos por barrio y los paseos libres; no cuentan la comida y la cena, las pausas, los «pasas por…»,
 *     el tiempo libre, la «llegada a…» ni las nocturnas (las experiencias nocturnas y los miradores que llegan de noche: tanda 6y9, P11).
 *  4. El título junta COMO MUCHO DOS nombres con «y»:
 *     · si el día tiene Free Tour, va primero y solo se le suma el grupo con más paradas («Free Tour y Centro histórico»);
 *     · si el día lleva una excursión de medio día, es como el Free Tour: «Excursión desde Roma y Centro histórico»;
 *     · si no, el grupo con MÁS paradas va primero. Un segundo grupo solo se suma si tiene al menos 3 paradas (tanda 6y9, P14:
 *       una o dos paradas sueltas de otro grupo no cambian el título).
 *  5. Empates: gana el grupo que aparece antes en el día (por hora; sin horas, por orden).
 *  6. Un día sin paradas se llama «Día libre»; un día de LLEGADA o de VUELTA sin paradas (el de vuelta, `isReturnLeg`; el de llegada, `esDiaDeLlegada`), «Día de viaje», nunca «Día libre» (tanda 6y9, P13; tanda 7, punto 15). Si tiene paradas pero ninguna es de nuestros datos (un sitio que el viajero buscó en el mapa), queda el nombre de siempre.
 *     Tanda 10B: el de VUELTA sin paradas se llama «Hoy vuelves a casa» (`DIA_DE_VUELTA`, como su tarjeta), con «Roma → Barcelona · Día de viaje» debajo.
 *  7. El trayecto («Barcelona → Roma») NO es el título: va pequeño junto a «Día de viaje» (`viaje`).
 */

/** Con qué se nombra un día de un destino, del dato del destino (ver gruposDeDia en shared/routeEngine/fichaLugar.js). */
export interface GruposDelDestino {
  lista: string[]
  freeTour: string | null
  excursion: string | null
  /** nombre de sitio → grupo */
  porSitio: Record<string, string>
}

export interface NombreDelDia {
  titulo: string
  /** «Barcelona → Roma» (o «Roma → Barcelona» en la vuelta), pequeño junto a «Día de viaje»; null si el día no es de viaje. */
  viaje: string | null
  /** Solo el nombre de siempre de una ruta a mano sin nombre (destinos sin grupos): el título pide «Ponle nombre». */
  ponleNombre: boolean
}

/** El título del día de vuelta sintético sin paradas. Con ese título, la etiqueta pequeña del trayecto no repite las palabras (ver `etiquetaDeViaje`). */
export const DIA_DE_VIAJE = 'Día de viaje'
/** El título del día de vuelta sin paradas (Tanda 10B): el mismo nombre que la tarjeta de ese día; debajo va «Roma → Barcelona · Día de viaje». */
export const DIA_DE_VUELTA = 'Hoy vuelves a casa'

/** La marca pequeña junto al trayecto de un día de viaje: «Día de viaje · Madrid → Roma»; si el título ya dice «Día de viaje», vacía y solo queda «Madrid → Roma». */
export function etiquetaDeViaje(titulo: string): string {
  return titulo === DIA_DE_VIAJE ? '' : DIA_DE_VIAJE
}

/**
 * La línea pequeña de debajo del título de un día de llegada o de vuelta (Tanda 7, punto 15): «Barcelona → Roma · Día de viaje». Si el título ya dice «Día de viaje» (el día no lleva paradas),
 * solo el trayecto, sin repetir las palabras. Sin trayecto, vacía.
 */
export function lineaDeViaje(titulo: string, viaje: string | null): string {
  if (!viaje) return ''
  return titulo === DIA_DE_VIAJE ? viaje : `${viaje} · ${DIA_DE_VIAJE}`
}

/**
 * ¿Es el día que lleva la llegada? La única definición (la ficha, DÍAS, HOY y el título la usan): lo dice el motor (`arrivalDay.es_dia_1`) o, en un viaje con la hora de llegada puesta, es el primer día.
 */
export function esDiaDeLlegada(route: Pick<Route, 'days' | 'arrivalFlightTime'>, day: Pick<DayPlan, 'id' | 'arrivalDay'>): boolean {
  return day.arrivalDay?.es_dia_1 === true || (route.days[0]?.id === day.id && Boolean(route.arrivalFlightTime))
}

const quitarAcentos = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const indicePorNombre = new WeakMap<GruposDelDestino, Map<string, string>>()
/** nombre (sin acentos ni mayúsculas) → grupo, por si el nombre de la parada llega escrito un poco distinto. */
function indiceDe(grupos: GruposDelDestino): Map<string, string> {
  let indice = indicePorNombre.get(grupos)
  if (!indice) {
    indice = new Map(Object.entries(grupos.porSitio).map(([nombre, grupo]) => [quitarAcentos(nombre), grupo]))
    indicePorNombre.set(grupos, indice)
  }
  return indice
}

/** El grupo de una parada (null si no es de nuestros datos). */
export function grupoDeParada(stop: Pick<Stop, 'name' | 'fullName' | 'isFreeTour'>, grupos: GruposDelDestino): string | null {
  if (stop.isFreeTour) return grupos.freeTour
  const exacto = grupos.porSitio[stop.name] ?? (stop.fullName ? grupos.porSitio[stop.fullName] : undefined)
  if (exacto) return exacto
  const indice = indiceDe(grupos)
  return indice.get(quitarAcentos(stop.name)) ?? (stop.fullName ? indice.get(quitarAcentos(stop.fullName)) : undefined) ?? null
}

/** Las paradas del día que cuentan para el título, en orden de hora (sin horas, el orden del día). */
export function paradasParaElTitulo(day: DayPlan): Stop[] {
  const lista = day.stops.filter((stop) => !stop.isBreak && !stop.passThrough && !stop.isFreeTime && !stop.isArrival && !stop.isNightExperience && !stop.isNightView)
  const minutos = lista.map((stop) => (stop.time ? parseTimeToMinutes(stop.time) : NaN))
  if (minutos.some((valor) => Number.isNaN(valor))) return lista
  return lista.map((stop, indice) => ({ stop, indice, a: minutos[indice] })).sort((x, y) => x.a - y.a || x.indice - y.indice).map((entrada) => entrada.stop)
}

/** ¿Es un día de excursión de día entero? */
export function esDiaDeExcursion(day: DayPlan): boolean {
  return day.dayType === 'excursion' || day.interruptor?.mode === 'excursion'
}

/**
 * LA REGLA de los nombres de un día (puntos 3 a 5): de las paradas, los grupos que dan nombre, de uno a dos. Lista vacía = el día no tiene paradas de nuestros datos.
 * `soloGrupos`: las paradas ya convertidas a su grupo, en orden de día (null = parada que no es de nuestros datos).
 */
export function gruposQueNombranElDia(soloGrupos: (string | null)[], marcadores: string[]): string[] {
  const conocidos = soloGrupos.filter((grupo): grupo is string => grupo !== null && !marcadores.includes(grupo))
  const cuenta = new Map<string, number>()
  for (const grupo of conocidos) cuenta.set(grupo, (cuenta.get(grupo) ?? 0) + 1)
  // Por número de paradas; el empate lo gana el que aparece antes (Map conserva el orden de aparición y el orden de .sort es estable).
  const ordenados = [...cuenta.entries()].sort((a, b) => b[1] - a[1])
  if (marcadores.length > 0) return [...marcadores, ...ordenados.slice(0, 1).map(([grupo]) => grupo)].slice(0, 2)
  if (ordenados.length === 0) return []
  const [primero, segundo] = ordenados
  return segundo && segundo[1] >= 3 ? [primero[0], segundo[0]] : [primero[0]]
}

/** El trayecto pequeño de un día de viaje: «Barcelona → Roma». */
export function viajeDelDia(route: Route, day: DayPlan): string | null {
  const indice = route.days.findIndex((candidate) => candidate.id === day.id)
  const info = indice >= 0 ? computeDayTravelInfo(route, indice) : null
  return info && !day.userAdded ? `${info.fromCity} → ${info.toCity}` : null
}

/** El nombre de siempre (antes de los grupos): el de los destinos que no los traen y el de los sitios que no son de nuestros datos. */
function nombreDeSiempre(route: Route, day: DayPlan, conTrayecto: boolean): { titulo: string; ponleNombre: boolean } {
  const enExcursion = day.interruptor?.mode === 'excursion'
  if (day.userAdded) return { titulo: day.curatedTitle ?? day.title ?? day.city, ponleNombre: false }
  if (enExcursion) return { titulo: `Excursión desde ${day.city}`, ponleNombre: false }
  const viaje = conTrayecto ? viajeDelDia(route, day) : null
  if (viaje) return { titulo: viaje, ponleNombre: false }
  if (isManualRoute(route)) return { titulo: manualDayTitle(route, day), ponleNombre: !day.nameByUser && day.dayType !== 'excursion' }
  return { titulo: day.curatedTitle ?? day.city, ponleNombre: false }
}

/** El nombre de un día (título y trayecto). `grupos` null: el destino no los trae y todo queda como siempre. */
export function nombreDelDia(route: Route, day: DayPlan, grupos: GruposDelDestino | null): NombreDelDia {
  if (!grupos) {
    const antiguo = nombreDeSiempre(route, day, true)
    return { titulo: antiguo.titulo, viaje: null, ponleNombre: antiguo.ponleNombre }
  }
  const viaje = viajeDelDia(route, day)
  const sinTrayecto = (titulo: string): NombreDelDia => ({ titulo, viaje, ponleNombre: false })
  if (day.nameByUser || (day.userAdded && !esDiaDeExcursion(day))) return sinTrayecto(day.curatedTitle ?? day.title ?? day.city)
  if (esDiaDeExcursion(day)) return sinTrayecto(grupos.excursion ?? `Excursión desde ${day.city}`)

  const paradas = paradasParaElTitulo(day)
  const marcadores: string[] = []
  if (grupos.freeTour && paradas.some((stop) => stop.isFreeTour)) marcadores.push(grupos.freeTour)
  if (grupos.excursion && day.halfDayExcursion && !day.halfDayExcursionDeclined) marcadores.push(grupos.excursion)
  const soloGrupos = paradas.filter((stop) => !stop.isFreeTour).map((stop) => grupoDeParada(stop, grupos))
  const nombres = gruposQueNombranElDia(soloGrupos, marcadores)
  if (nombres.length > 0) return sinTrayecto(nombres.join(' y '))
  if (paradas.length === 0) return sinTrayecto(day.isReturnLeg ? DIA_DE_VUELTA : esDiaDeLlegada(route, day) ? DIA_DE_VIAJE : FREE_DAY_DEFAULT_NAME)
  return sinTrayecto(nombreDeSiempre(route, day, false).titulo)
}

/** El nombre de un día con lo que ya se sabe del destino, fuera de un componente. null = los datos del destino aún no han llegado. */
export function nombreDelDiaYaCargado(route: Route, day: DayPlan): NombreDelDia | null {
  const destino = destinoYaCargado(route.destination)
  return destino?.cargado ? nombreDelDia(route, day, destino.gruposDia) : null
}

/**
 * El gancho para los componentes: devuelve la función que da el nombre de un día. Mientras llegan los datos del destino el título va vacío (así no salta de un nombre a otro).
 */
export function useNombreDeDias(route: Route): (day: DayPlan) => NombreDelDia {
  const destino = useDestinationExcursions(route.destination)
  return (day) => (destino.cargado ? nombreDelDia(route, day, destino.gruposDia) : { titulo: '', viaje: viajeDelDia(route, day), ponleNombre: false })
}

/** El nombre que el viajero le dio a un día (para empezar «Cambiar el nombre» con él); vacío si el título lo calcula la app. */
export function nombrePropioDelDia(day: DayPlan | undefined): string {
  return day && (day.nameByUser || day.userAdded) ? (day.curatedTitle ?? day.title ?? '') : ''
}

/** Solo el texto del título, para donde cuelga de una frase (una hoja, el PDF): si aún no hay datos, el nombre de siempre. */
export function tituloSimpleDelDia(route: Route, day: DayPlan): string {
  return (nombreDelDiaYaCargado(route, day) ?? { ...nombreDelDia(route, day, null) }).titulo
}
