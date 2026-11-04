import { useEffect } from 'react'
import { create } from 'zustand'
import { llamar, logrosActivos } from './logros'

/**
 * EL RADIO DE CADA SITIO PARA «YA ESTÁS AQUÍ» (LG1, retoque de la HOY1, Eric 4-nov). El radio de cada sitio vive en los datos de logros (servidor): La Graciosa y Timanfaya, 2.500 m; un sitio sin radio, 150 m.
 * El móvil NO se baja los datos de logros (pesarían en la descarga): le pregunta al servidor, una vez por parada y sin ubicación, en `POST /api/logros/cerca` (`radios_hoy`: nombre de la parada → metros o null).
 * Mientras no llega, o si no hay respuesta, vale el de siempre (150 m).
 */
export const RADIO_YA_ESTAS_AQUI_SIN_DATOS_M = 150

interface Estado {
  /** nombre de la parada → radio en metros (null = el sitio no tiene radio en los datos). Solo lo pedido ya. */
  radios: Record<string, number | null>
}
export const useRadiosDeHoy = create<Estado>(() => ({ radios: {} }))

const pedidos = new Set<string>()

/** El radio (m) con el que «Ya estás aquí» cuenta esta parada: el de su sitio en los datos de logros, o 150. Pide el dato al servidor la primera vez que ve la parada. */
export function useRadioDeParada(tripId: string | null, nombre: string): number {
  const radio = useRadiosDeHoy((s) => s.radios[nombre])
  useEffect(() => {
    if (!tripId || !nombre || !logrosActivos()) return
    const clave = `${tripId}|${nombre}`
    if (pedidos.has(clave)) return
    pedidos.add(clave)
    void llamar<{ ok?: boolean; radios_hoy?: Record<string, number | null> }>('/api/logros/cerca', { cuerpo: { trip_id: tripId, ubicacion: null, sitios_hoy: [nombre] } }).then((r) => {
      if (!r?.ok) {
        pedidos.delete(clave)
        return
      }
      useRadiosDeHoy.setState((s) => ({ radios: { ...s.radios, [nombre]: r.radios_hoy?.[nombre] ?? null } }))
    })
  }, [tripId, nombre])
  return typeof radio === 'number' && radio > 0 ? radio : RADIO_YA_ESTAS_AQUI_SIN_DATOS_M
}
