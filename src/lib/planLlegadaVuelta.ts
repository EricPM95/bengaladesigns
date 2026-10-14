/**
 * LO QUE EL MOTOR DEVUELVE DE LA LLEGADA Y DE LA VUELTA (Tanda 7), tal como llega del servidor (ver INFORME_PARTE_MOTORLLEGADA_TANDA7.md y INFORME_PARTE_MOTORVUELTA_TANDA7.md).
 *
 * El servidor lo manda en dos días: `day.arrival_plan` en el día 1 (el plan de la llegada, con sus avisos y su resumen) y `day.return_day` en el día de vuelta (la tarjeta «Hoy vuelves a casa»,
 * el resumen y los avisos de la vuelta). La app los guarda en la ruta (`Route.planLlegada`, `Route.planVuelta`) al generar o rehacer, para que las pantallas (ficha de llegada y vuelta, tarjeta,
 * hoja del resumen, campana) lean de ahí y no calculen nada. Nunca se enseña lo marcado «interno» ni las filas de las tablas: son para depurar.
 *
 * Los campos que la app no usa se dejan abiertos (`[clave: string]: unknown`) para que un campo nuevo del motor no rompa nada.
 */

import type { DayPlan, Route, TarjetaHoyVuelvesDato } from './types'

/** Un botón de un aviso o de la hoja: la llegada manda solo el id (`'ver_reserva'`) y la vuelta el id con su texto. */
export type BotonDeAviso = string | { id: string; texto: string }

export interface AvisoDelMotor {
  tipo: string
  /** Con `{dia:N}` donde va un día: las pantallas lo escriben con su fecha («mar 10», sin fechas «día 1»). */
  texto: string
  /** La llegada lo marca con `campana`; la vuelta con `donde: 'campana'`. */
  campana?: boolean
  donde?: 'campana' | 'hoja'
  botones?: BotonDeAviso[]
  dayNumber?: number
  dateIso?: string | null
  /** Reserva de la que habla (la llegada: el nombre del sitio; la vuelta: nombre y hora). */
  sitio?: string
  sitios?: string[]
  reserva?: { name: string; hora: string }
  reservas?: { name: string; hora: string }[]
  [clave: string]: unknown
}

export interface ResumenDelMotor {
  tipo: string
  texto: string
  dayNumber?: number
  dia_id?: string
  botones?: BotonDeAviso[]
  [clave: string]: unknown
}

export interface PlanLlegada {
  entrada?: { hora: string; medio: string; punto_id?: string | null; punto?: string | null; zona?: string | null; invierno?: boolean }
  caso?: string
  dia1?: { lista?: string; nombre?: string; sin_paradas?: boolean; texto?: string | null; de_noche?: boolean; comida_al_llegar?: boolean; [clave: string]: unknown }
  pasa_al_dia_2?: boolean
  dia_caido?: { id: string; nombre: string; motivo: string } | null
  dia_sustituido?: { id?: string; motivo?: string; [clave: string]: unknown } | null
  free_tour?: { hora: string | null; sin_hora: boolean; dia: number } | null
  dejado_fuera?: { lugar: string; dia: number; parada?: string; motivo?: string; de_dia?: string }[]
  avisos?: AvisoDelMotor[]
  resumen?: ResumenDelMotor[]
  hooks?: { vuelta?: { dia_caido?: unknown; pendientes?: unknown[]; vuelve_como_dia_mas?: string | null; sustituidos?: unknown } }
  [clave: string]: unknown
}

export interface PlanVuelta {
  activo?: boolean
  aMano?: boolean
  medio?: string
  hora?: string
  lleva?: string
  madrugada?: boolean
  contenido?: string | null
  fecha?: { dayNumber: number; dateIso: string | null; weekday?: string | null }
  ultimoDiaDeRuta?: { dayNumber: number; dateIso: string | null }
  /** «Hoy vuelves a casa»: solo si el día va sin paradas. */
  tarjeta?: TarjetaHoyVuelvesDato | null
  /** Solo con una salida de madrugada: la misma tarjeta, al final del último día de ruta. */
  tarjetaUltimoDia?: TarjetaHoyVuelvesDato | null
  resumen?: { tipo: string; plantilla: string; dayNumber: number; dateIso: string | null; madrugada?: boolean } | null
  avisos?: AvisoDelMotor[]
  [clave: string]: unknown
}

/** El texto de un botón por su id, para los botones que el motor de la llegada manda solo con el id. */
const TEXTO_DE_BOTON: Record<string, string> = {
  ver_reserva: 'Ver mi reserva',
  ver_mis_reservas: 'Ver mis reservas',
  ver_reservas: 'Ver mis reservas',
  ver_disponibilidad: 'Ver disponibilidad',
  de_acuerdo: 'De acuerdo',
  cambiar_fechas: 'Cambiar fechas',
  pasar_a_roma: 'Pasar este día a Roma',
}

/** Los botones de un aviso, siempre con id y texto. */
export function botonesDe(botones: BotonDeAviso[] | undefined): { id: string; texto: string }[] {
  return (botones ?? []).map((boton) => (typeof boton === 'string' ? { id: boton, texto: TEXTO_DE_BOTON[boton] ?? boton } : { id: boton.id, texto: boton.texto || (TEXTO_DE_BOTON[boton.id] ?? boton.id) }))
}

/** ¿Va a la campana? (la llegada lo marca con `campana: true`, la vuelta con `donde: 'campana'`). */
export const vaALaCampana = (aviso: AvisoDelMotor): boolean => aviso.campana === true || aviso.donde === 'campana'

/**
 * La tarjeta «Hoy vuelves a casa» que toca a un día, la misma en DÍAS y en HOY: la del día de vuelta (`planVuelta.tarjeta`, solo si el día va sin paradas) y, con una salida de madrugada, la del final
 * del último día de ruta (`planVuelta.tarjetaUltimoDia`). null en cualquier otro día.
 */
export function tarjetaHoyVuelvesDelDia(route: Pick<Route, 'days' | 'planVuelta'>, day: Pick<DayPlan, 'id' | 'isReturnLeg'>): TarjetaHoyVuelvesDato | null {
  const plan = route.planVuelta
  if (!plan) return null
  if (day.isReturnLeg) return plan.tarjeta ?? null
  const ultimoDiaDeRuta = [...route.days].reverse().find((candidate) => !candidate.isReturnLeg)
  return day.id === ultimoDiaDeRuta?.id ? (plan.tarjetaUltimoDia ?? null) : null
}
