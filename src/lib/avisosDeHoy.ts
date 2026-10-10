import type { HorarioDeParada } from './horarioDeParada'

/**
 * Los avisos de cierre de HOY (Tanda 6z6, de pago): «Panteón cierra hoy a las 17:00», una línea por parada de la ruta de hoy que cierra ese día, los que cierran antes primero y como mucho 3.
 * La hora es el horario real de la parada (`horarioDeParada`, el mismo de la tarjeta): la app no calcula nada. Solo cuentan las paradas que quedan por ver (ni vistas ni saltadas), con una hora de cierre ese día
 * (un sitio cerrado todo el día, o sin horario, no avisa; un parque que «cierra al anochecer» tampoco: su hora no es una hora de verdad).
 */
export const MAXIMO_AVISOS_DE_CIERRE = 3

export interface AvisoDeCierre {
  id: string
  nombre: string
  cierra: string
  texto: string
}

const aMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function avisosDeCierre<P extends { id: string; name: string; saltada?: boolean; checkedInAt?: unknown }>(
  paradas: readonly P[],
  horarioDe: (parada: P) => HorarioDeParada | null,
  nombreDe: (parada: P) => string = (parada) => parada.name,
  maximo: number = MAXIMO_AVISOS_DE_CIERRE,
): AvisoDeCierre[] {
  const avisos: (AvisoDeCierre & { minutos: number })[] = []
  for (const parada of paradas) {
    if (parada.saltada || parada.checkedInAt) continue
    const horario = horarioDe(parada)
    if (!horario || horario.cerrado || !horario.cierra || /al anochecer/i.test(horario.texto)) continue
    const nombre = nombreDe(parada)
    avisos.push({ id: parada.id, nombre, cierra: horario.cierra, texto: `${nombre} cierra hoy a las ${horario.cierra}`, minutos: aMinutos(horario.cierra) })
  }
  return avisos
    .sort((a, b) => a.minutos - b.minutos)
    .slice(0, maximo)
    .map(({ minutos: _minutos, ...aviso }) => aviso)
}
