import { nombreDelPase } from './nombrePase'

/**
 * EL DÍA DE PRUEBA EN HOY SIN PASE (Tanda 10H; reglas de Eric en docs/dias/APUNTES_TRAS_TANDA7.md §33 y la tabla del prompt). Pura: de lo que sabe la app (la fase del viaje, hoy, las fechas y lo que dice el servidor de la prueba)
 * dice QUÉ sale en HOY y con qué textos. El destino, el día y el pase salen siempre de los datos («Roma», «sábado 25», «Pase de Roma»). Nada de esto toca el servidor: la prueba (una por cuenta, para siempre; se gasta
 * al usar HOY; la pregunta de las 12:00) la decide `server/logros/pase.js`; aquí solo se cuenta.
 *
 *   antes_sin_prueba        más de 5 días antes del viaje, o la prueba ya se usó en otro viaje: la cuenta atrás y lo que tendrás, SIN hablar de la prueba.
 *   prueba_otro_dia         desde 5 días antes, prueba sin usar y NO es el primer día: «Te regalamos un día con HOY… el domingo 26, gratis y completo…».
 *   prueba_primer_dia       desde 5 días antes, prueba sin usar y ES el primer día: «Te regalamos tu primer día con HOY…».
 *   manana_es_prueba        durante el viaje, mañana es el día de prueba: «Mañana es tu día de prueba…».
 *   hoy_es_prueba           el día de la prueba, de las 00:00 a las 23:59 (hora del destino): HOY entero y, arriba, la franja «Hoy es tu día de prueba…».
 *   prueba_mas_adelante     durante el viaje, la prueba es otro día más adelante: «Tu día de prueba con HOY es el miércoles 28…».
 *   tras_prueba             durante el viaje, después de la prueba: «¿Qué tal ayer con HOY?…» y [Ver el Pase].
 *   parte_del_pase          durante el viaje, la prueba ya se usó en otro viaje: «Tu modo Hoy es parte del Pase de Roma.».
 *   viaje_terminado         después del viaje: nada de la prueba.
 *   pon_fechas              sin fechas: «Pon tus fechas» (sin prueba hasta que haya fechas).
 */

/** Cuántos días antes del viaje empieza a hablarse de la prueba. */
export const DIAS_ANTES_DE_LA_PRUEBA = 5

/**
 * «Lo que veas el sábado también suma a tus logros» NO es cierto con [Visto]: sin pase, [Visto] no guarda nada (server/logros/servicio.js › visto). Lo que sí suma después es «Lo de ayer también cuenta»: las FOTOS de la galería
 * subidas cuando ya se tiene acceso. Por eso el texto promete las fotos, no lo que se vea. (Para cambiarlo, aquí, en un solo sitio.)
 */
export const FRASE_QUE_SUMA = (elDia: string) => `Y si luego te quedas con el pase, las fotos que hagas ${elDia} también suman a tus logros.`

export interface PruebaDelPase {
  /** 'pendiente' (sin usar), 'gastada' (usada) o 'sin_viaje' (sin viaje con fechas donde ponerla); null = no se sabe. */
  estado: 'pendiente' | 'gastada' | 'sin_viaje' | null
  /** El viaje de la prueba (null = ninguno o «este»). */
  tripId?: string | null
  /** El día de la prueba (AAAA-MM-DD), si está pendiente o gastada. */
  fecha?: string | null
}

export type TipoDeFila =
  | 'antes_sin_prueba'
  | 'prueba_otro_dia'
  | 'prueba_primer_dia'
  | 'manana_es_prueba'
  | 'hoy_es_prueba'
  | 'prueba_mas_adelante'
  | 'tras_prueba'
  | 'parte_del_pase'
  | 'viaje_terminado'
  | 'pon_fechas'

export interface FilaDeHoy {
  tipo: TipoDeFila
  /** El texto de la tarjeta de la prueba (sin las marcas «HOY» y «Pase de X» resaltadas: las resalta `TextoConPase`). null = no hay tarjeta. */
  texto: string | null
  /** ¿Sale [Ver el Pase de X]? */
  verElPase: boolean
}

const DIA_MS = 86_400_000
const aFecha = (iso: string) => new Date(`${iso}T12:00:00Z`)
/** Días de calendario de `a` a `b` (positivo si `b` es posterior). */
export const diasEntre = (a: string, b: string): number => Math.round((aFecha(b).getTime() - aFecha(a).getTime()) / DIA_MS)
export const sumarDias = (iso: string, n: number): string => new Date(aFecha(iso).getTime() + n * DIA_MS).toISOString().slice(0, 10)

const SEMANA = new Intl.DateTimeFormat('es', { weekday: 'long', timeZone: 'UTC' })
/** «sábado» */
export const nombreDelDia = (iso: string): string => SEMANA.format(aFecha(iso))
/** «sábado 25» */
export const diaYNumero = (iso: string): string => `${nombreDelDia(iso)} ${Number(iso.slice(8, 10))}`

export interface EntradaDeFila {
  /** La fase del viaje respecto a hoy (null = sin fechas). */
  fase: 'before' | 'during' | 'after' | null
  /** Hoy, en la hora del destino (AAAA-MM-DD). */
  hoyIso: string
  /** El primer y el último día del viaje (null = sin fechas). */
  inicioIso: string | null
  finIso?: string | null
  prueba: PruebaDelPase
  /** El id de ESTE viaje (para saber si la prueba se usó en otro). */
  tripId?: string | null
  destino: string
}

const esDeEsteViaje = (p: PruebaDelPase, tripId?: string | null) => !p.tripId || !tripId || p.tripId === tripId

export function filaDeHoySinPase(e: EntradaDeFila): FilaDeHoy {
  const { destino } = e
  const pase = nombreDelPase(destino)
  if (!e.inicioIso || e.fase === null) return { tipo: 'pon_fechas', texto: null, verElPase: false }
  if (e.fase === 'after') return { tipo: 'viaje_terminado', texto: `Tu viaje a ${destino} ha terminado. La próxima vez, con el ${pase}, te acompañamos todo el viaje.`, verElPase: true }

  const p = e.prueba
  const pendiente = p.estado === 'pendiente' && Boolean(p.fecha) && esDeEsteViaje(p, e.tripId)
  const gastadaAqui = p.estado === 'gastada' && Boolean(p.fecha) && esDeEsteViaje(p, e.tripId)

  if (e.fase === 'before') {
    if (diasEntre(e.hoyIso, e.inicioIso) > DIAS_ANTES_DE_LA_PRUEBA || !pendiente) return { tipo: 'antes_sin_prueba', texto: null, verElPase: false }
    if (p.fecha === e.inicioIso) return { tipo: 'prueba_primer_dia', texto: `Te regalamos tu primer día con HOY para que lo pruebes: el ${diaYNumero(e.inicioIso)}, gratis y completo.`, verElPase: false }
    return {
      tipo: 'prueba_otro_dia',
      texto: `Te regalamos un día con HOY para que lo pruebes: el ${diaYNumero(p.fecha as string)}, gratis y completo. ${FRASE_QUE_SUMA(`el ${nombreDelDia(e.inicioIso)}`)}`,
      verElPase: false,
    }
  }

  // Durante el viaje.
  if (pendiente) {
    const fecha = p.fecha as string
    if (fecha === e.hoyIso) return { tipo: 'hoy_es_prueba', texto: `Hoy es tu día de prueba: tienes el ${pase} completo, gratis, hasta medianoche. Disfrútalo.`, verElPase: false }
    if (fecha === sumarDias(e.hoyIso, 1)) {
      return { tipo: 'manana_es_prueba', texto: `Mañana es tu día de prueba: queremos que vivas ${destino} con el ${pase} completo, gratis, un día entero.`, verElPase: false }
    }
    if (fecha > e.hoyIso) return { tipo: 'prueba_mas_adelante', texto: `Tu día de prueba con HOY es el ${diaYNumero(fecha)}: gratis y completo.`, verElPase: false }
  }
  if (gastadaAqui) {
    const fecha = p.fecha as string
    if (fecha === e.hoyIso) return { tipo: 'hoy_es_prueba', texto: `Hoy es tu día de prueba: tienes el ${pase} completo, gratis, hasta medianoche. Disfrútalo.`, verElPase: false }
    if (fecha < e.hoyIso) {
      const ayer = fecha === sumarDias(e.hoyIso, -1)
      return {
        tipo: 'tras_prueba',
        texto: `¿Qué tal ${ayer ? 'ayer' : `el ${nombreDelDia(fecha)}`} con HOY? Sigue con tu compañero el resto del viaje y completa los secretos y las colecciones de ${destino}. Lo que conseguiste ${ayer ? 'ayer' : 'ese día'} ya es tuyo.`,
        verElPase: true,
      }
    }
  }
  return { tipo: 'parte_del_pase', texto: `Tu modo Hoy es parte del ${pase}.`, verElPase: true }
}
