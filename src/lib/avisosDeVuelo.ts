import type { Route } from './types'
import type { BloqueReservasId } from '../store/useReservasFocusStore'
import { botonesDe, vaALaCampana, type AvisoDelMotor } from './planLlegadaVuelta'
import { conFechasDeLosDias } from './resumenDeVuelo'

/**
 * LOS AVISOS DE LA CAMPANA QUE VIENEN DE LOS VUELOS (Tanda 7, punto 14). Los dan los motores de la llegada y de la vuelta como datos (`/api/avisos-de-vuelo`, sin Claude, sin ningún día): una reserva que
 * empieza antes de que llegues, una que acaba después de que te vayas, el Free Tour que no te da tiempo y la excursión que no cuadra. Aquí solo se eligen los que van a la campana, se les pone título y se
 * escriben las fechas. Se quedan hasta que el viajero lo arregla (cambia la reserva o el vuelo) y se van solos: no se pueden marcar como leídos. Los textos son los del motor, palabra por palabra:
 * ninguna hora calculada, solo las del viajero y las de sus reservas.
 */
export interface AvisoDeVueloCampana {
  id: string
  titulo: string
  texto: string
  /** Los botones del aviso, con su id: `ver_reserva` y, en la excursión que vuelve tarde, `pasar_a_roma`. */
  botones: { id: string; texto: string }[]
  mitad: 'arrival' | 'departure'
  aviso: AvisoDelMotor
}

const TITULOS: Record<string, string> = {
  reserva_antes_de_llegar: 'No llegas a tu reserva',
  free_tour_antes_de_llegar: 'No llegas a tu Free Tour',
  excursion_antes_de_llegar: 'No llegas a tu excursión',
  reserva_despues_de_salir: 'Tu reserva no te da tiempo',
  excursion_vuelve_tarde: 'Tu excursión vuelve tarde',
}

/** Los avisos de «dos reservas coinciden» ya los da `reservationOverlaps` (con sus nombres cortos): los de los motores no se repiten en la campana. */
const YA_LOS_DA_LA_CAMPANA = new Set(['reservas_coinciden', 'coinciden'])

export function avisosParaLaCampana(avisos: { llegada: AvisoDelMotor[]; vuelta: AvisoDelMotor[] }, route: Pick<Route, 'answers'>): AvisoDeVueloCampana[] {
  const salida: AvisoDeVueloCampana[] = []
  const meter = (lista: AvisoDelMotor[], mitad: 'arrival' | 'departure') => {
    for (const aviso of lista) {
      if (!vaALaCampana(aviso) || YA_LOS_DA_LA_CAMPANA.has(aviso.tipo)) continue
      const texto = conFechasDeLosDias(aviso.texto, route)
      salida.push({ id: `vuelo:${mitad}:${aviso.tipo}:${texto}`, titulo: TITULOS[aviso.tipo] ?? 'Revisa tu reserva', texto, botones: botonesDe(aviso.botones), mitad, aviso })
    }
  }
  meter(avisos.llegada, 'arrival')
  meter(avisos.vuelta, 'departure')
  return salida
}

/** El bloque de RESERVAS al que lleva [Ver mi reserva]: las excursiones, o las entradas (que incluyen el Free Tour). */
export function bloqueDeReservasDelAviso(aviso: AvisoDelMotor): BloqueReservasId {
  return aviso.tipo.startsWith('excursion') ? 'excursiones' : 'entradas'
}

/** El número del día del viaje al que se refiere el aviso (el día de vuelta, el último día de ruta, el 1); null si el motor no lo dijo. */
export const diaDelAviso = (aviso: AvisoDelMotor, mitad: 'arrival' | 'departure'): number | null => (typeof aviso.dayNumber === 'number' ? aviso.dayNumber : mitad === 'arrival' ? 1 : null)
