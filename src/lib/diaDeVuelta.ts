/**
 * EL DÍA DE VUELTA, «HOY VUELVES A CASA» (10S11 §4, Eric 1-nov). Los textos y el cálculo de «hasta las HH:MM» de la tarjeta del día de vuelta de DÍAS (con y sin pase). Todo en la app, sin motor.
 *
 * «Hasta las HH:MM» = la hora de salida − el margen de estar en el aeropuerto (avión 2 h; tren y autobús 30 min; barco, el embarque de su naviera o 2 h) − el trayecto hasta el aeropuerto/estación/puerto,
 * redondeado HACIA ABAJO al cuarto de hora. El trayecto es el de su zona de alojamiento si la tabla «Para tu zona» lo da entero (todos los tramos con su tiempo escrito como «unos 45 min»); si no (sin zona,
 * traslado privado, algún tramo sin tiempo), el del centro (`al_centro_min` del punto). Sin tiempo para ver nada (menos de 1 h desde las 9:00): «sin tiempo», sin [+ Añadir lugares].
 */
import { paraTuZona } from '../../shared/arrival/paraTuZona.js'
import type { ArrivalInfo, ArrivalMedio, ArrivalMode, ArrivalPoint } from './arrivalReturn'
import { puntoCorto } from './arrivalReturn'

const aMin = (hhmm: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
const dos = (n: number) => String(n).padStart(2, '0')
export const hhmm = (min: number): string => `${dos(Math.floor(min / 60))}:${dos(min % 60)}`

/** Cuándo empieza el día de un viajero (la primera parada): con menos de 1 h desde ahí hasta que tiene que irse, «sin tiempo». */
export const INICIO_DEL_DIA_MIN = 9 * 60
export const MINIMO_PARA_VER_ALGO_MIN = 60

/** Cuánto antes hay que estar en el punto de salida. */
export function margenDeEstarMin(modo: ArrivalMode, medio: ArrivalMedio | null): number {
  if (modo === 'avion') return 120
  if (modo === 'ferry') return medio?.salir_antes_min ?? 120
  return 30
}
/** «2 horas», «30 minutos», «1 hora y media». */
export function textoDelMargen(min: number): string {
  if (min % 60 === 0) return min === 60 ? '1 hora' : `${min / 60} horas`
  if (min === 90) return '1 hora y media'
  return `${min} minutos`
}

const TIEMPO_LIMPIO = /^(?:unos\s+)?(\d+)(?:\s*-\s*(\d+))?\s*min(?:,\s*sin paradas)?$/i

/** El trayecto desde su zona hasta el punto: la suma de los tiempos de la mejor opción, o null si no se puede sumar entera. */
export function trayectoDesdeSuZonaMin(info: ArrivalInfo | null | undefined, zonaId: string | null | undefined, punto: ArrivalPoint | null): number | null {
  if (!info || !punto || !zonaId || zonaId === 'nose') return null
  const r = paraTuZona(info, { zona: zonaId, puntoId: punto.id, sentido: 'vuelta' }) as { sinZona?: boolean; mejor?: { tipo: string; tramos?: { medio?: string; tiempo?: string }[] } } | null
  if (!r || r.sinZona || r.mejor?.tipo !== 'opcion') return null
  let total = 0
  for (const tramo of r.mejor.tramos ?? []) {
    if (tramo.medio === 'andando' && !tramo.tiempo) continue
    const m = TIEMPO_LIMPIO.exec(String(tramo.tiempo ?? '').trim())
    if (!m) return null
    total += Number(m[2] ?? m[1])
  }
  return total > 0 ? total : null
}

export type MedioDeLaVuelta = 'avion' | 'tren' | 'bus' | 'ferry' | 'coche'

export interface DatosDelDiaDeVuelta {
  modo: MedioDeLaVuelta
  /** «vuelo», «tren», «autobús», «barco» (en coche, null). */
  palabra: string | null
  /** «aeropuerto», «estación», «puerto». */
  sitio: string | null
  hora: string | null
  /** «Ciampino», «Termini», «Civitavecchia» (el punto elegido; null si no se sabe). */
  lugar: string | null
  /** La hora hasta la que tiene el día libre («15:00»). Null sin hora o en coche. */
  hasta: string | null
  /** Sin hora o en coche: no hay cuenta. */
  conHora: boolean
  /** Con hora pero sin tiempo para ver nada: día de irse con calma, sin [+ Añadir lugares]. */
  sinTiempo: boolean
  /** De dónde sale el trayecto: su zona o el centro (para las pruebas). */
  trayecto: { min: number; de: 'zona' | 'centro' } | null
  /** Cuánto antes hay que estar allí (minutos); 0 sin hora. */
  margen: number
}

const PALABRA: Record<MedioDeLaVuelta, string | null> = { avion: 'vuelo', tren: 'tren', bus: 'autobús', ferry: 'barco', coche: null }
const SITIO: Record<MedioDeLaVuelta, string | null> = { avion: 'aeropuerto', tren: 'estación', bus: 'estación', ferry: 'puerto', coche: null }

export function datosDelDiaDeVuelta(entrada: { modo: MedioDeLaVuelta; hora: string | null; punto: ArrivalPoint | null; medio: ArrivalMedio | null; info: ArrivalInfo | null; zonaId: string | null | undefined }): DatosDelDiaDeVuelta {
  const { modo, hora, punto, medio, info, zonaId } = entrada
  const base = { modo, palabra: PALABRA[modo], sitio: SITIO[modo], hora: hora || null, lugar: punto ? puntoCorto(punto) : null }
  const salida = aMin(hora)
  if (modo === 'coche' || salida == null) return { ...base, hasta: null, conHora: false, sinTiempo: false, trayecto: null, margen: 0 }
  const zona = trayectoDesdeSuZonaMin(info, zonaId, punto)
  const trayecto = zona != null ? { min: zona, de: 'zona' as const } : { min: punto?.al_centro_min ?? 0, de: 'centro' as const }
  const margen = margenDeEstarMin(modo, medio)
  const limite = salida - margen - trayecto.min
  const hasta = Math.floor(limite / 15) * 15
  const sinTiempo = hasta - INICIO_DEL_DIA_MIN < MINIMO_PARA_VER_ALGO_MIN
  return { ...base, hasta: sinTiempo ? null : hhmm(hasta), conHora: true, sinTiempo, trayecto, margen }
}

export interface TextosDelDiaDeVuelta {
  titulo: string
  /** El párrafo de arriba (la hora del vuelo y hasta cuándo es suyo, o «Aún no sabemos…»). */
  texto: string
  /** Sin hora: [Añadir tu vuelo] (null con hora o en coche). */
  botonAnadirVuelo: string | null
  /** «¿Quieres aprovecharlo? Añade lo que te quedó por ver.» / «Mientras tanto, añade lo que te quedó por ver.» (null sin tiempo). */
  invitacion: string | null
  /** Con [+ Añadir lugares] y [Explorar]. */
  conLugares: boolean
  /** La línea del pase: con el pase, sin candado (o nada); sin él, con candado (o nada). `{pase}` va en oro. */
  lineaPase: string | null
}

export function textosDelDiaDeVuelta(d: DatosDelDiaDeVuelta, conPase: boolean): TextosDelDiaDeVuelta {
  const titulo = 'Hoy vuelves a casa'
  const tuMedio = d.palabra ? `tu ${d.palabra}` : null
  if (d.modo === 'coche') {
    return {
      titulo,
      texto: 'Hoy es tu día de volver a casa en coche: tú decides a qué hora sales.',
      botonAnadirVuelo: null,
      invitacion: '¿Quieres aprovecharlo? Añade lo que te quedó por ver.',
      conLugares: true,
      lineaPase: conPase ? null : 'Con el {pase}, te preparamos este día con lo que te queda por ver.',
    }
  }
  if (!d.conHora) {
    return {
      titulo,
      texto: `Aún no sabemos a qué hora sale ${tuMedio}. Añádelo y te diremos hasta qué hora tienes el día libre.`,
      botonAnadirVuelo: `Añadir tu ${d.palabra}`,
      invitacion: 'Mientras tanto, añade lo que te quedó por ver.',
      conLugares: true,
      lineaPase: conPase ? `Pon tu ${d.palabra} y te preparamos este día con lo que te queda por ver.` : `Con el {pase}, al poner tu ${d.palabra} te preparamos este día con lo que te queda por ver.`,
    }
  }
  const de = d.lugar ? ` de ${d.lugar}` : ''
  const sale = `Tu ${d.palabra} sale${de} a las ${d.hora}.`
  const antes = `estar en ${d.sitio === 'estación' ? 'la' : 'el'} ${d.sitio} ${textoDelMargen(d.margen)} antes`
  if (d.sinTiempo) {
    return { titulo, texto: `${sale} Te recomendamos ${antes}. Hoy es día de irse con calma.`, botonAnadirVuelo: null, invitacion: null, conLugares: false, lineaPase: null }
  }
  return {
    titulo,
    texto: `${sale} Te recomendamos ${antes}: hasta las ${d.hasta}, más o menos, el día es tuyo.`,
    botonAnadirVuelo: null,
    invitacion: '¿Quieres aprovecharlo? Añade lo que te quedó por ver.',
    conLugares: true,
    lineaPase: conPase ? null : 'Con el {pase}, te preparamos este día con lo que te queda por ver, a tiempo para tu ' + d.palabra + '.',
  }
}
