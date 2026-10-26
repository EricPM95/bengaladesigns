import { useEffect } from 'react'
import { SEGUNDOS_PARA_GASTAR, sincronizarUnaVez, useHistoriaDePrueba } from './historiaDePrueba'
import type { EstadoEscucha } from './useEscuchar'

/**
 * Gasta la historia de prueba (Tanda 10P) cuando lleva SEGUNDOS_PARA_GASTAR segundos seguidos sonando. `activo`: solo en la historia de prueba aún sin gastar (sin pase y fuera del día de prueba).
 * Si se pausa o se para antes, no se gasta. Además sincroniza con la cuenta una vez por carga.
 */
export function useGastarHistoriaAl3s(destino: string | undefined, nombre: string | undefined, estado: EstadoEscucha, activo: boolean): void {
  const gastar = useHistoriaDePrueba((s) => s.gastar)
  useEffect(() => {
    if (activo) sincronizarUnaVez()
  }, [activo])
  useEffect(() => {
    if (!activo || estado !== 'hablando' || !destino || !nombre) return
    const t = window.setTimeout(() => gastar(destino, nombre), SEGUNDOS_PARA_GASTAR * 1000)
    return () => window.clearTimeout(t)
  }, [activo, estado, destino, nombre, gastar])
}
