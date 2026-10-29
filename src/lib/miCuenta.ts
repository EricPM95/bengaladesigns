import type { Aportacion } from './cuentasGrupo'
import { repartir } from './cuentasGrupo'

/**
 * «MI CUENTA» DEL PRESUPUESTO (Tanda 10N10 §5b). Lo que cuesta el viaje a UNA persona = lo suyo (solo para ella) + su parte de lo común. Su parte de lo común sale del mismo reparto que las deudas
 * (`repartir`: a partes iguales entre los marcados y los céntimos que sobran los asume quien pagó), así «Tu parte de la cuenta conjunta» y «¿Quién debe a quién?» cuadran siempre al céntimo.
 * Todo en céntimos de la base de las cuentas (euros). Función pura, sin React ni red.
 */
export interface ParteDeUnGasto {
  aportacion: Aportacion
  /** Lo que le toca a esa persona de este gasto (céntimos). */
  centimos: number
}

/** Lo que le toca a `personaId` de cada gasto común en el que entra (los que no le tocan, no salen). */
export function partesDeUnaPersona(aportaciones: readonly Aportacion[], personaId: string | null): ParteDeUnGasto[] {
  if (!personaId) return []
  const salida: ParteDeUnGasto[] = []
  for (const a of aportaciones) {
    const toca = repartir(a.centimos, a.pagan, a.entre).toca.get(personaId) ?? 0
    if (toca > 0) salida.push({ aportacion: a, centimos: toca })
  }
  return salida
}

/** La suma de su parte de lo común (céntimos). */
export const miParteDeLoComun = (aportaciones: readonly Aportacion[], personaId: string | null): number => partesDeUnaPersona(aportaciones, personaId).reduce((t, p) => t + p.centimos, 0)

import type { BloqueId, BloquePresupuesto, LineaPresupuesto } from './presupuesto'
import { sumar } from './dinero'

/** A qué bloque de «Mi cuenta» pertenece una línea suya (Transporte y alojamiento, Ruta, Útil para el viaje o Extras). */
export function bloqueDeLaLinea(l: Pick<LineaPresupuesto, 'id' | 'abrir' | 'compartido'>): BloqueId {
  if ((l.compartido && l.compartido.gastoId) || l.id.startsWith('extra-') || l.id.startsWith('gasto-')) return 'extras'
  switch (l.abrir.tipo) {
    case 'llegada':
    case 'vuelta':
    case 'alojamiento':
    case 'transporte':
    case 'coche':
      return 'transporte'
    case 'seguro':
    case 'esim':
      return 'util'
    case 'reserva':
      return 'ruta'
    default:
      return l.id.startsWith('mi-') ? 'transporte' : 'extras'
  }
}

const TITULOS: Record<BloqueId, string> = { transporte: 'Transporte y alojamiento', ruta: 'Ruta', util: 'Útil para el viaje', extras: 'Extras' }

/** Lo que es solo mío (`presupuesto.loTuyo`), repartido en los mismos bloques de siempre. */
export function bloquesDeLoMio(lineas: readonly LineaPresupuesto[], moneda: string): BloquePresupuesto[] {
  const orden: BloqueId[] = ['transporte', 'ruta', 'util', 'extras']
  return orden
    .map((id) => ({ id, titulo: TITULOS[id], lineas: lineas.filter((l) => bloqueDeLaLinea(l) === id) }))
    .filter((b) => b.lineas.length > 0)
    .map((b) => ({ ...b, suma: sumar(b.lineas.flatMap((l) => (l.enMonedaViajero ? [l.enMonedaViajero] : [])), moneda) }))
}
