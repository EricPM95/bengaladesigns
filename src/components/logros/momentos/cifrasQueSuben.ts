import { useEffect, useState } from 'react'
import { sonar } from '../../../lib/sonidos'
import { TIEMPOS_DE_RESUMEN } from '../../../lib/sonidos/tiempos'

/**
 * (V38C) LOS NÚMEROS QUE SUBEN DEL RESUMEN, Y SU SONIDO. Regla de Eric para TODA la app: un sonido suena solo a la vez que una animación que se ve, y cuadrado con ella; una pantalla quieta no suena nunca.
 * Los resúmenes (del viaje y del día) suenan SOLO la primera vez (cuando el viajero los ve por primera vez, al acabar el viaje o el día) y SOLO si hay números que suben de verdad en pantalla:
 * los números suben de 0 a su valor en `TIEMPOS_DE_RESUMEN.sube` s con un tic cada `tic` s (la partitura `dia_completo`: `tics()` + el brillo al final). Abiertos otra vez, en silencio y con los números ya puestos.
 * «Ya se vio» se guarda en el móvil (localStorage), con la misma forma que `claveDelResumen` (el resumen del día): una marca por viaje (`trazo:logros:resumenviaje:<viaje>`).
 */
export const claveResumenViaje = (tripId: string): string => `trazo:logros:resumenviaje:${tripId}`

export function yaSeVio(clave: string): boolean {
  try {
    return window.localStorage.getItem(clave) === 'si'
  } catch {
    return false
  }
}
export function marcarVisto(clave: string): void {
  try {
    window.localStorage.setItem(clave, 'si')
  } catch {
    /* sin almacenamiento: puede sonar otra vez */
  }
}
export const movimientoReducido = (): boolean => {
  try {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  } catch {
    return false
  }
}
export const dentroDelEstudio = (): boolean => Boolean((window as unknown as { __estudioVisor?: unknown }).__estudioVisor)

/** De 0 a 1 mientras suben los números (`sube` s). Sin `activa`, 1 (los números ya puestos, sin movimiento). Empieza cuando `activa` pasa a verdadero. */
export function useProgresoDeCifras(activa: boolean): number {
  const [p, setP] = useState<number | null>(null)
  useEffect(() => {
    if (!activa) return undefined
    let raf = 0
    const t0 = performance.now()
    const paso = (ahora: number) => {
      const x = Math.min(1, (ahora - t0) / (TIEMPOS_DE_RESUMEN.sube * 1000))
      setP(x)
      if (x < 1) raf = window.requestAnimationFrame(paso)
    }
    setP(0)
    raf = window.requestAnimationFrame(paso)
    return () => window.cancelAnimationFrame(raf)
  }, [activa])
  return activa ? (p ?? 0) : 1
}
/** El número que se ve en cada momento de la subida. */
export const cifraQueSube = (n: number, progreso: number): number => Math.round(n * progreso)

/**
 * Hace sonar el resumen UNA vez, a la vez que empiezan a subir los números: solo si de verdad suben (`conCifras`) y sin «Reducir movimiento» (sin movimiento no hay nada que suene).
 * Dentro del estudio de sonidos no suena (lo hace sonar él al pulsar ▶).
 */
export function sonarResumenUnaVez(conCifras: boolean): void {
  if (!conCifras || movimientoReducido() || dentroDelEstudio()) return
  void sonar('dia_completo')
}
