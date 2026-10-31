/**
 * LA RESERVA DEL ALOJAMIENTO (10S7 §5; `Piezas/Entradas Billete` A1 y A2). Lo que dice la confirmación del hotel: dirección, fechas y noches, hora de entrada y de salida, teléfono y localizador.
 * SIN código (los hoteles no lo usan). Se guarda DENTRO del alojamiento del viaje (`accommodationSelections[...].reserva`), así que viaja con el viaje igual que el nombre y el precio, y «Eliminar alojamiento»
 * se la lleva con él. Todo es opcional y se puede escribir o cambiar a mano. La dirección de la reserva es la del hotel; la que usa «Cómo llegar a tu alojamiento» (solo con pase) es `route.accommodationAddress`:
 * si la leída es distinta de la que ya había, la app PREGUNTA antes de cambiarla (`direccionesDistintas`).
 */
import { nochesTexto } from './tuAlojamiento'

export interface ReservaAlojamiento {
  direccion: string | null
  /** `YYYY-MM-DD`. */
  entrada: string | null
  salida: string | null
  noches: number | null
  /** `HH:MM` (la hora desde la que se puede entrar / hasta la que hay que salir). */
  horaEntrada: string | null
  horaSalida: string | null
  telefono: string | null
  localizador: string | null
}

export const reservaVacia = (): ReservaAlojamiento => ({ direccion: null, entrada: null, salida: null, noches: null, horaEntrada: null, horaSalida: null, telefono: null, localizador: null })

const limpio = (t: string | null | undefined): string | null => (typeof t === 'string' && t.trim() ? t.trim() : null)

/** Una reserva «con algo»: si no trae ni un dato, es como no tenerla. */
export const reservaConDatos = (r: Partial<ReservaAlojamiento> | null | undefined): r is ReservaAlojamiento =>
  Boolean(r) && Object.values(r as object).some((v) => v != null && String(v).trim() !== '')

const aMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

/** Las noches entre dos días (`YYYY-MM-DD`), o null si falta alguno o la salida no es posterior. */
export function nochesEntre(entrada: string | null | undefined, salida: string | null | undefined): number | null {
  if (!entrada || !salida) return null
  const dias = Math.round((aMs(salida) - aMs(entrada)) / 86_400_000)
  return Number.isFinite(dias) && dias >= 1 ? dias : null
}

/** Normaliza lo que llega de la hoja (texto) a una reserva limpia. Las noches salen de las fechas si las hay. */
export function reservaDeCampos(c: { direccion: string; entrada: string; salida: string; noches: string; horaEntrada: string; horaSalida: string; telefono: string; localizador: string }): ReservaAlojamiento {
  const entrada = limpio(c.entrada)
  const salida = limpio(c.salida)
  const escritas = Number.parseInt(c.noches, 10)
  return {
    direccion: limpio(c.direccion),
    entrada,
    salida,
    noches: nochesEntre(entrada, salida) ?? (Number.isInteger(escritas) && escritas >= 1 ? escritas : null),
    horaEntrada: limpio(c.horaEntrada),
    horaSalida: limpio(c.horaSalida),
    telefono: limpio(c.telefono),
    localizador: limpio(c.localizador)?.toUpperCase() ?? null,
  }
}

const SEMANA = new Intl.DateTimeFormat('es-ES', { weekday: 'long' })
const MES = new Intl.DateTimeFormat('es-ES', { month: 'long' })
/** «Jueves 26» (como en Design A2); con `conMes`, «Jueves 26 octubre». */
export function diaCorto(iso: string, conMes = false): string {
  const fecha = new Date(`${iso}T12:00:00`)
  const semana = SEMANA.format(fecha)
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)} ${fecha.getDate()}${conMes ? ` ${MES.format(fecha)}` : ''}`
}

/** «Jueves 26 → Domingo 29 · 3 noches» (con lo que haya; con el mes si las dos fechas son de meses distintos). Null si no hay ni fechas ni noches. */
export function textoFechasReserva(r: Pick<ReservaAlojamiento, 'entrada' | 'salida' | 'noches'>): string | null {
  const noches = r.noches ?? nochesEntre(r.entrada, r.salida)
  const mesesDistintos = Boolean(r.entrada && r.salida) && (r.entrada as string).slice(0, 7) !== (r.salida as string).slice(0, 7)
  const dias = r.entrada && r.salida ? `${diaCorto(r.entrada, mesesDistintos)} → ${diaCorto(r.salida, mesesDistintos)}` : r.entrada ? `Entrada ${diaCorto(r.entrada, true)}` : r.salida ? `Salida ${diaCorto(r.salida, true)}` : null
  if (dias && noches) return `${dias} · ${nochesTexto(noches)}`
  return dias ?? (noches ? nochesTexto(noches) : null)
}

/** «Entrada desde las 15:00 · Salida hasta las 11:00» (con lo que haya). Null si no hay ninguna hora. */
export function textoHorasReserva(r: Pick<ReservaAlojamiento, 'horaEntrada' | 'horaSalida'>): string | null {
  const partes = [r.horaEntrada ? `Entrada desde las ${r.horaEntrada}` : null, r.horaSalida ? `Salida hasta las ${r.horaSalida}` : null].filter(Boolean)
  return partes.length ? partes.join(' · ') : null
}

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
/** Para comparar dos direcciones: sin acentos, sin signos y sin diferencias de espacios («Via Cavour, 12» = «via cavour 12»). */
const normaDireccion = (t: string) => sinAcentos(t).replace(/[^a-z0-9]+/g, ' ').trim()

/** ¿La dirección leída es distinta de la que ya había? (Las dos con algo; la misma escrita de otra forma no cuenta como distinta.) */
export function direccionesDistintas(leida: string | null | undefined, actual: string | null | undefined): boolean {
  const a = limpio(leida)
  const b = limpio(actual)
  if (!a || !b) return false
  const na = normaDireccion(a)
  const nb = normaDireccion(b)
  return na !== nb && !na.includes(nb) && !nb.includes(na)
}
