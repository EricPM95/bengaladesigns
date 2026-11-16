import { useEffect, useState } from 'react'
import { llamar, logrosActivos } from '../../../../lib/logros'
import type { Stop } from '../../../../lib/types'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import type { RespuestaCerca } from '../useCercaDeAqui'

/**
 * LOS PEDAZOS QUE SE GANAN EN ESTA PARADA (V2, «Aquí ganas 2 pedazos: «…» y «…»»): los nombres de las colecciones donde ese sitio da un pedazo AÚN POR GANAR. Los emblemas ocultos NUNCA se anuncian
 * (el servidor ni los manda en `pedazos_nombres`). Se le pregunta al servidor con la coordenada de la propia parada (no hace falta el GPS) y solo cuando hace falta (`activo`: la tarjeta de «Ya estás aquí»).
 */
export function usePedazosDeParada(tripId: string | null, parada: Stop, activo: boolean): string[] {
  const [nombres, setNombres] = useState<{ id: string; lista: string[] } | null>(null)
  useEffect(() => {
    if (!activo || !tripId || !logrosActivos() || !hasRealCoordinates(parada.coordinates)) return undefined
    let vivo = true
    void llamar<RespuestaCerca>('/api/logros/cerca', { cuerpo: { trip_id: tripId, ubicacion: { lat: parada.coordinates.lat, lng: parada.coordinates.lng }, sitios_hoy: [parada.name], en_coche: false } }).then((r) => {
      if (!vivo || !r?.ok) return
      const aqui = r.cerca.find((c) => c.dentro && c.hay_pedazo)
      setNombres({ id: parada.id, lista: aqui?.pedazos_nombres ?? (aqui?.coleccion_nombre ? [aqui.coleccion_nombre] : []) })
    })
    return () => {
      vivo = false
    }
  }, [activo, tripId, parada.id, parada.name, parada.coordinates])
  return nombres && nombres.id === parada.id ? nombres.lista : []
}

/** «Aquí ganas 2 pedazos: «A» y «B»» (null si no hay ninguno). */
export function textoDePedazos(nombres: string[]): string | null {
  if (nombres.length === 0) return null
  const q = nombres.map((n) => `«${n}»`)
  const lista = q.length === 1 ? q[0] : `${q.slice(0, -1).join(', ')} y ${q[q.length - 1]}`
  return `Aquí ${nombres.length === 1 ? 'ganas 1 pedazo' : `ganas ${nombres.length} pedazos`}: ${lista}`
}
