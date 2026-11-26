import { FREE_TOUR_HOURS } from './freeTourHoras'
import type { HoraLibre } from './civitatis'

/**
 * (V69, apartado 4; Design «Free Tour Hora» H1-H3) LAS HORAS EN BOTONES de «Elige día y hora» del Free Tour y de las actividades con horas fijas. Función pura: dice, para cada hora, en qué estado se pinta.
 *   · Con datos de Civitatis para ese día: sus horas libres con sus plazas. Las que la actividad ofrece otros días del viaje y ese día ya no tienen plazas salen tachadas con «Agotado» (la API solo da las libres: lo agotado se saca de lo que
 *     esa actividad ofrece en los demás días de las fechas del viaje).
 *   · Sin datos de Civitatis: las seis de siempre (`FREE_TOUR_HOURS`: 10:00, 12:00, 15:00, 17:00, 19:00, 21:00), sin plazas ni «Agotado» ni recomendación.
 *   · La recomendada (la de la V60) lleva el borde verde y «Te la recomendamos»; con pocas plazas, «Quedan 3» en ámbar.
 *   · El día de la llegada, las horas antes de quedar libre (`utilMin`, la hora útil del vuelo) salen en gris con «No llegas» y no se pueden pulsar (como el agotado).
 *   · La hora que el viajero ya tenía (`propia`) siempre sale, para que cambiar la reserva no pierda su hora.
 */
export type EstadoDeHora = 'libre' | 'recomendada' | 'pocas' | 'agotada' | 'no_llegas'
export interface HoraDeInicio {
  hora: string
  estado: EstadoDeHora
  /** Lo de debajo de la hora («Te la recomendamos», «Quedan 3», «Agotado», «No llegas»); null si no dice nada. */
  texto: string | null
}

const aMin = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const normal = (hhmm: string): string => (hhmm.length === 4 ? `0${hhmm}` : hhmm)

/** «Quedan 3» (con 1, «Última plaza»); null si quedan muchas o no se sabe. Las mismas cifras que `textoDePlazas` del servidor (hasta 10 se avisa). */
export function quedanPlazas(plazas: number | null | undefined, aviso: string | null | undefined): string | null {
  if (aviso == null) return null
  if (plazas == null || !Number.isInteger(plazas) || plazas <= 0) return aviso
  return plazas === 1 ? 'Última plaza' : `Quedan ${plazas}`
}

export function horasDeInicio(datos: {
  /** Las horas libres de ese día según Civitatis; null = sin datos (las de siempre). */
  libres: HoraLibre[] | null
  /** Todas las horas que la actividad ofrece algún día del viaje (para poder tachar las agotadas de este). */
  delViaje?: string[]
  recomendada?: string | null
  /** El día de llegada: desde cuándo está libre (minutos); null en los demás días. */
  utilMin?: number | null
  propia?: string | null
}): HoraDeInicio[] {
  const libres = datos.libres
  const base = libres ? [...new Set([...(datos.delViaje ?? []).map(normal), ...libres.map((h) => normal(h.hora))])] : [...FREE_TOUR_HOURS]
  const propia = datos.propia && /^\d{1,2}:\d{2}$/.test(datos.propia) ? normal(datos.propia) : null
  const todas = [...new Set(propia ? [...base, propia] : base)].sort()
  return todas.map((hora): HoraDeInicio => {
    const min = aMin(hora)
    if (datos.utilMin != null && min != null && min < datos.utilMin && hora !== propia) return { hora, estado: 'no_llegas', texto: 'No llegas' }
    const libre = libres?.find((h) => normal(h.hora) === hora) ?? null
    if (libres && !libre && hora !== propia) return { hora, estado: 'agotada', texto: 'Agotado' }
    if (datos.recomendada && normal(datos.recomendada) === hora) return { hora, estado: 'recomendada', texto: 'Te la recomendamos' }
    const quedan = libre ? quedanPlazas(libre.plazas, libre.aviso) : null
    return quedan ? { hora, estado: 'pocas', texto: quedan } : { hora, estado: 'libre', texto: null }
  })
}

/** ¿Se puede pulsar? (Las agotadas y las de «No llegas», no.) */
export const sePuedeElegir = (h: HoraDeInicio): boolean => h.estado !== 'agotada' && h.estado !== 'no_llegas'
