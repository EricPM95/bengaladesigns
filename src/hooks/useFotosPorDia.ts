import { useEffect, useState } from 'react'
import { alCambiarFotos } from '../lib/fotosViaje'
import { fotosParaPortada } from '../lib/portadaViaje'
import { useSyncStore } from '../store/useSyncStore'

/**
 * (V24) Cuántas fotos tiene cada día del viaje abierto (por número de día): «Hecho · 12 fotos» en los días pasados de DÍAS. Solo pide las fotos si `activo` (hay algún día pasado); se repone al subir o quitar una.
 * Sin viaje guardado o sin fotos, vacío.
 */
export function useFotosPorDia(activo: boolean): Map<number, number> {
  const tripId = useSyncStore((state) => state.activeTripId)
  const [cuentas, setCuentas] = useState<Map<number, number>>(new Map())
  useEffect(() => {
    if (!activo || !tripId) {
      setCuentas(new Map())
      return undefined
    }
    let vivo = true
    const cargar = () =>
      void fotosParaPortada(tripId)
        .then((lista) => {
          if (!vivo) return
          const mapa = new Map<number, number>()
          for (const foto of lista) mapa.set(foto.dayNumber, (mapa.get(foto.dayNumber) ?? 0) + 1)
          setCuentas(mapa)
        })
        .catch(() => undefined)
    cargar()
    const quitar = alCambiarFotos(cargar)
    return () => {
      vivo = false
      quitar()
    }
  }, [activo, tripId])
  return cuentas
}
