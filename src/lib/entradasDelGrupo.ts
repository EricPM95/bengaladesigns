/**
 * LAS ENTRADAS PARA VARIOS, LAS COMPRE QUIEN LAS COMPRE (Tanda 10N6 §1l). Funciones puras, sin React ni red.
 *
 * Una entrada la reserva alguien (el administrador, que la guarda en el viaje, o un invitado, que la guarda en lo suyo: `reservas_invitado`) y dice «¿Para quién es?» (`paraQuien`). A cada marcado le sale como suya
 * (verde en DÍAS, «Tu entrada» en la ficha, en su RESERVAS); a los demás, en azul con dorado quién la tiene. Aquí: de dónde salen todas, a quién cubre cada una y cómo se dice en plural.
 */
import type { Reservation } from './bookings'
import { dayOfReservation } from './bookings'
import { diaProsa } from './nombreDeDia'
import type { Route } from './types'

export interface EntradaDeAlguien {
  reserva: Reservation
  /** Quién la reservó (y la pagó). */
  compradorId: string
}

/**
 * Todas las entradas del grupo con su comprador: las del administrador (las del viaje) y las que han reservado los invitados para otras personas (`entradasInv`, que ya no trae las personales). Sin repetir.
 * `yoId` y `soyInvitado` dicen cuáles son MÍAS: las mías no cuentan como «de otros».
 */
export function todasLasEntradas(e: { adminId: string | null; reservasDelDueno: readonly Reservation[]; entradasInv: readonly { userId: string; reservas: readonly Reservation[] }[] }): EntradaDeAlguien[] {
  const salida: EntradaDeAlguien[] = []
  if (e.adminId) for (const r of e.reservasDelDueno) salida.push({ reserva: r, compradorId: e.adminId })
  for (const g of e.entradasInv) for (const r of g.reservas) if (r.kind === 'entrada' && !salida.some((x) => x.reserva.id === r.id)) salida.push({ reserva: r, compradorId: g.userId })
  return salida
}

/** Los ids de quienes tienen esta entrada: los marcados (sin lista, solo quien la compró). */
export const quienesLaTienen = (x: EntradaDeAlguien): string[] => (x.reserva.paraQuien && x.reserva.paraQuien.length > 0 ? x.reserva.paraQuien : [x.compradorId])

/** ¿Cubre a esta persona? */
export const meCubre = (x: EntradaDeAlguien, yoId: string | null | undefined): boolean => Boolean(yoId) && quienesLaTienen(x).includes(yoId as string)

/** La entrada de ese sitio (por el nombre de la reserva o por los sitios que cubre) o del Free Tour. */
export function cubreElSitio(r: Reservation, sitio: { name: string; isFreeTour?: boolean }): boolean {
  return r.kind === 'entrada' && (sitio.isFreeTour ? r.refId === 'Free Tour' : r.refId === sitio.name || r.placeNames.includes(sitio.name))
}

/** «Eric», «Eric y Ana», «Eric, Ana y Laura». */
export function frase(nombres: readonly string[]): string {
  const limpios = nombres.filter(Boolean)
  if (limpios.length <= 1) return limpios[0] ?? ''
  return `${limpios.slice(0, -1).join(', ')} y ${limpios[limpios.length - 1]}`
}

const horaCorta = (hhmm: string): string => {
  const [h, m] = String(hhmm).split(':')
  return `${Number(h)}:${m ?? '00'}`
}

export function diaDeLaEntrada(route: Route, reserva: Reservation): string {
  const dia = dayOfReservation(route, reserva)
  if (dia) return diaProsa(route, dia.dayNumber)
  if (reserva.dateIso) return diaProsa({ answers: { ...route.answers, dateRange: { start: reserva.dateIso, end: reserva.dateIso } } } as Pick<Route, 'answers'>, 1)
  return reserva.dayNumber != null ? `día ${reserva.dayNumber}` : ''
}

/** Une los nombres de varias entradas del mismo día y hora (dos reservas iguales de personas distintas cuentan como un solo grupo). */
export function porCuando(route: Route, entradas: readonly { nombres: string[]; reserva: Reservation }[]): { nombres: string[]; dia: string; hora: string }[] {
  const grupos: { nombres: string[]; dia: string; hora: string }[] = []
  for (const x of entradas) {
    const dia = diaDeLaEntrada(route, x.reserva)
    const hora = horaCorta(x.reserva.time)
    const g = grupos.find((y) => y.dia === dia && y.hora === hora)
    if (g) g.nombres = [...new Set([...g.nombres, ...x.nombres])]
    else grupos.push({ nombres: [...x.nombres], dia, hora })
  }
  return grupos
}

/**
 * La línea de la ficha para quien no la tiene: «Eric y Ana la tienen para el jueves 12 · 9:15» (una sola hora) o «Eric la tiene a las 9:15 · Ana a las 11:00» (cada uno a una hora distinta).
 * Con más de dos: «Eric, Ana y Laura la tienen…». Si las horas caen en días distintos, cada una lleva su día.
 */
export function textoLaTienen(route: Route, entradas: readonly { nombres: string[]; reserva: Reservation }[]): string {
  const grupos = porCuando(route, entradas)
  if (grupos.length === 0) return ''
  const verbo = (n: number) => (n > 1 ? 'la tienen' : 'la tiene')
  if (grupos.length === 1) return `${frase(grupos[0].nombres)} ${verbo(grupos[0].nombres.length)} para el ${grupos[0].dia} · ${grupos[0].hora}`
  const mismoDia = grupos.every((g) => g.dia === grupos[0].dia)
  const cuando = (g: { dia: string; hora: string }) => (mismoDia ? `a las ${g.hora}` : `el ${g.dia} a las ${g.hora}`)
  return grupos.map((g, i) => (i === 0 ? `${frase(g.nombres)} ${verbo(g.nombres.length)} ${cuando(g)}` : `${frase(g.nombres)} ${cuando(g)}`)).join(' · ')
}

/** Cuántas personas distintas la tienen (el numerito del botón de DÍAS). */
export const cuantosLaTienen = (entradas: readonly { nombres: string[] }[]): number => new Set(entradas.flatMap((x) => x.nombres)).size
