/**
 * (Tanda 10S10, apartado 2) EL AVISO DE HORARIO, SIN DAR NADA POR HECHO. Una línea pequeña y gris debajo de la parada, siempre con «posiblemente», que se calcula al pintar con la hora que tiene la parada
 * AHORA: si el viajero la mueve, el aviso se quita (o aparece) solo. Cuatro tipos, de nuestros datos:
 *  · por dentro y por fuera (el Castillo de Sant'Angelo, el Coliseo…): «A esta hora, posiblemente el Castillo de Sant'Angelo ya esté cerrado, pero puedes verlo por fuera igualmente.»
 *  · solo por dentro (los Museos Vaticanos, la Galería Borghese…): «A esta hora, posiblemente los Museos Vaticanos ya estén cerrados.»
 *  · antes de abrir: «A esta hora, posiblemente aún no haya abierto.»
 *  · una experiencia nocturna antes de la cena: «Esta parada es para verla de noche: a esta hora posiblemente aún sea de día.»
 * Cómo se ve cada sitio lo dice el dato del sitio (`shared/verPor.js`, que el servidor manda dentro de `hours_data`); el horario de ese día, `horarioDeParada` (el mismo de la tarjeta).
 * Nunca se avisa de lo que la tarjeta ya dice en rojo con la misma verdad (cerrado todo el día, «A esta hora ya ha cerrado» del motor).
 */
import { frasePorHora } from '../../shared/verPor.js'
import { sunsetMinutesOn } from '../../shared/routeEngine/sunset.js'
import { zonaDelDestinoORoma } from './zonaHoraria'
import type { HorarioDeParada } from './horarioDeParada'
import { normalizaNombre } from './horarioDeParada'

/** «9:00» / «09:00» → minutos desde las 0:00. */
function aMinutos(hora: string | null | undefined): number | null {
  const coincide = /^(\d{1,2}):(\d{2})/.exec(hora ?? '')
  return coincide ? Number(coincide[1]) * 60 + Number(coincide[2]) : null
}

/** Los datos de un sitio del catálogo (por nombre normalizado), con los campos del aviso que manda el servidor. */
type DatosDelSitio = Record<string, unknown> | undefined

export interface ParadaParaAviso {
  name: string
  fullName?: string
  isNightExperience?: boolean
  isNightView?: boolean
  isSunset?: boolean
  isFreeWalk?: boolean
  isBreak?: boolean
  isArrival?: boolean
  isZoneWalk?: boolean
  passThrough?: boolean
  visitMode?: string
  outsideKind?: string
  closedThisDay?: boolean
  nightViewTitle?: string
}

/** Los datos del catálogo de una parada: por su nombre o por su nombre largo. */
export function datosDelSitio(parada: Pick<ParadaParaAviso, 'name' | 'fullName'>, datos: Map<string, Record<string, unknown>>): DatosDelSitio {
  return datos.get(normalizaNombre(parada.name)) ?? (parada.fullName ? datos.get(normalizaNombre(parada.fullName)) : undefined)
}

/**
 * La puesta de sol del día de la parada (minutos locales), con la fecha del día o, sin fechas, la de mediados del mes del viaje. null si no se puede saber.
 * (El destino curado es Roma: su hora local; la hora de las paradas son horas del reloj del destino.)
 */
export function ocasoDelDia(dateIso: string | null, mes: number | null, coordenadas: { lat: number; lng: number } | null | undefined, destino?: string | null): number | null {
  if (!coordenadas) return null
  const fecha = dateIso && /^\d{4}-\d{2}-\d{2}/.test(dateIso) ? dateIso.slice(0, 10) : typeof mes === 'number' && mes >= 0 && mes <= 11 ? `2027-${String(mes + 1).padStart(2, '0')}-15` : null
  if (!fecha) return null
  return sunsetMinutesOn(fecha, [coordenadas.lat, coordenadas.lng], zonaDelDestinoORoma(destino)) as number | null
}

export interface EntradaDelAviso {
  parada: ParadaParaAviso
  /** El catálogo del destino (nombre normalizado → datos del horario y del aviso). */
  datos: Map<string, Record<string, unknown>>
  /** El horario de ese día (el de la tarjeta); null si no tiene. */
  horario: HorarioDeParada | null
  /** Cuándo empieza la parada (minutos); null = el día no tiene horas (no se avisa de nada). */
  inicio: number | null
  /** Va antes de la cena en el día, por posición. */
  antesDeCena: boolean
  /** La puesta de sol de ese día; null si no se sabe. */
  ocaso: number | null
}

/** El aviso (o null). */
export function avisoDeHorario({ parada, datos, horario, inicio, antesDeCena, ocaso }: EntradaDelAviso): string | null {
  if (inicio === null) return null
  if (parada.isBreak || parada.isArrival || parada.isZoneWalk || parada.isFreeWalk || parada.passThrough || parada.closedThisDay) return null

  // Una experiencia nocturna antes de la cena, mientras aún sea de día.
  if ((parada.isNightExperience || parada.isNightView) && !parada.isSunset) {
    if (antesDeCena && (ocaso === null || inicio < ocaso + 15)) return frasePorHora({ tipo: 'noche', nombre: null })
    return null
  }

  // Si el motor ya decidió verla por fuera, la tarjeta ya lo dice.
  if (parada.visitMode === 'fuera') return null
  if (!horario || horario.cerrado || horario.tramos.length === 0) return null
  // «Al anochecer» (parques): el cierre de los datos es una hora prudente, no la real: sin aviso.
  if (/al anochecer/.test(horario.texto)) return null

  const sitio = datosDelSitio(parada, datos)
  const verPor = sitio?.ver_por === 'dentro_y_fuera' || sitio?.ver_por === 'solo_dentro' ? sitio.ver_por : null
  const nombre = verPor && typeof sitio?.aviso_nombre === 'string' ? { frase: sitio.aviso_nombre, genero: sitio.aviso_genero === 'f' ? 'f' : 'm', plural: sitio.aviso_plural === true } : null

  const tramos = horario.tramos.map((tramo) => ({ abre: aMinutos(tramo.abre) ?? 0, cierra: aMinutos(tramo.cierra) ?? 24 * 60 }))
  const abre = tramos[0].abre
  const cierra = tramos[tramos.length - 1].cierra
  // Lo mismo que ya dice el motor en la tarjeta («A esta hora ya ha cerrado» / «A esta hora no abre»): no se repite.
  if (inicio < abre) return parada.outsideKind === 'no_abre' ? null : frasePorHora({ tipo: 'sin_abrir', nombre: nombre as never })
  if (!verPor || !nombre) return null
  if (inicio >= cierra) return parada.outsideKind === 'ya_cerrado' ? null : frasePorHora({ tipo: 'cerrado', verPor, nombre: nombre as never })
  // En el cierre de mediodía (una iglesia entre dos tramos): cerrado, sin el «ya».
  const enElHueco = tramos.some((tramo, indice) => indice < tramos.length - 1 && inicio >= tramo.cierra && inicio < tramos[indice + 1].abre)
  if (enElHueco) return frasePorHora({ tipo: 'cerrado', verPor, nombre: nombre as never, hueco: true })
  return null
}
