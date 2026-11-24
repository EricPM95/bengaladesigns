import type { HorarioDeParada } from './horarioDeParada'

/**
 * (V47) LO QUE DICE LA CAJA «HORARIO» DE LA TARJETA DE LA PARADA, según la hora REAL. Pura (sin React) para poder probarla:
 *   · sin horario (plazas, calles, fuentes): «Abierto» (verde) y debajo «Sin horario»;
 *   · antes de abrir (o en la pausa del mediodía): el horario («9:00–16:30», en negro) y debajo, en rojo, «Cerrado ahora · abre a las 9:00»;
 *   · abierto: «Abierto» (verde) y debajo «Cierra a las 16:30»;
 *   · después del cierre: «Cerrado» (rojo) y debajo «Abre mañana a las 9:00» (o el próximo día que abra: `proxima`, «mañana a las 9:00» / «el jueves a las 9:00»);
 *   · cerrado todo el día: «Cerrado» (rojo) y debajo «Abre mañana…» si se sabe, si no «Cerrado hoy».
 */
export type TonoDeCaja = 'negro' | 'verde' | 'rojo'
export interface EstadoDelHorario {
  /** Lo grande: «9:00–16:30», «Abierto» o «Cerrado». */
  grande: string
  tono: TonoDeCaja
  /** La línea pequeña de debajo. */
  sub: string
  /** El color de la línea pequeña. */
  subTono: TonoDeCaja | 'gris'
  /** Cuál de los casos es (para las pruebas): sin_horario · antes · abierto · despues · cerrado_hoy. */
  caso: 'sin_horario' | 'antes' | 'abierto' | 'despues' | 'cerrado_hoy'
}

const aMin = (t: string | null | undefined): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

export function estadoDelHorario(h: HorarioDeParada | null, ahoraMin: number, proxima: string | null = null): EstadoDelHorario {
  if (!h || (!h.cerrado && h.tramos.length === 0)) return { grande: 'Abierto', tono: 'verde', sub: 'Sin horario', subTono: 'gris', caso: 'sin_horario' }
  if (h.cerrado) return { grande: 'Cerrado', tono: 'rojo', sub: proxima ? `Abre ${proxima}` : 'Cerrado hoy', subTono: 'rojo', caso: 'cerrado_hoy' }
  for (const t of h.tramos) {
    const a = aMin(t.abre)
    const c = aMin(t.cierra)
    if (a != null && c != null && a <= ahoraMin && ahoraMin < c) return { grande: 'Abierto', tono: 'verde', sub: `Cierra a las ${t.cierra}`, subTono: 'gris', caso: 'abierto' }
  }
  const siguiente = h.tramos.find((t) => (aMin(t.abre) ?? 0) > ahoraMin)
  if (siguiente) return { grande: `${h.tramos[0].abre}–${h.tramos[h.tramos.length - 1].cierra}`, tono: 'negro', sub: `Cerrado ahora · abre a las ${siguiente.abre}`, subTono: 'rojo', caso: 'antes' }
  return { grande: 'Cerrado', tono: 'rojo', sub: proxima ? `Abre ${proxima}` : 'Cerrado ahora', subTono: 'rojo', caso: 'despues' }
}

/** «2026-10-17» + 1 día → «2026-10-18» (sin pasar por la zona horaria). */
export function sumarDias(fechaIso: string | null, dias: number): string | null {
  if (!fechaIso || !/^\d{4}-\d{2}-\d{2}$/.test(fechaIso)) return null
  const d = new Date(`${fechaIso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

const DIAS_DE_LA_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** «mañana a las 9:00» / «el jueves a las 9:00»: la primera vez que abre en los próximos días (`horarios[k]` = el horario k+1 días después de hoy). */
export function proximaApertura(fechaIso: string | null, horarios: (HorarioDeParada | null)[]): string | null {
  for (let k = 0; k < horarios.length; k++) {
    const h = horarios[k]
    if (!h || h.cerrado || h.tramos.length === 0) continue
    const f = sumarDias(fechaIso, k + 1)
    if (k === 0) return `mañana a las ${h.tramos[0].abre}`
    const dia = f ? DIAS_DE_LA_SEMANA[new Date(`${f}T12:00:00Z`).getUTCDay()] : null
    return dia ? `el ${dia} a las ${h.tramos[0].abre}` : null
  }
  return null
}
