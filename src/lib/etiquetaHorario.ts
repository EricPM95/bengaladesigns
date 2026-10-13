import type { HorarioDeParada } from './horarioDeParada'

const conCero = (hora: string) => hora.padStart(5, '0')

/**
 * La etiqueta del reloj de la ficha (Tanda 6y10): solo el horario de ese día, sin texto —«08:30–16:00»—, o «Cerrado» si ese día no abre. Con dos tramos (cierre de mediodía), los dos: «09:00–13:00 y 15:00–19:00».
 * Sin fechas, es el horario del mes del viaje (lo decide `horarioDeParada`, la misma función que las tarjetas de DÍAS y HOY: la etiqueta no puede decir otra cosa que la tarjeta). Sin horario (una plaza, una calle), null: no sale reloj.
 * Un parque que cierra «al anochecer» lo dice así en vez de enseñar la hora prudente de los datos.
 */
export function etiquetaDeHorario(horario: HorarioDeParada | null): string | null {
  if (!horario) return null
  if (horario.cerrado) return 'Cerrado'
  if (horario.tramos.length === 0) return null
  const alAnochecer = /–\s*al anochecer/.test(horario.texto)
  return horario.tramos.map((tramo, indice) => `${conCero(tramo.abre)}–${alAnochecer && indice === horario.tramos.length - 1 ? 'anochecer' : conCero(tramo.cierra)}`).join(' y ')
}
