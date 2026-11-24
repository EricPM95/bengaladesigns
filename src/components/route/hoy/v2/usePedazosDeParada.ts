import { useEffect, useState } from 'react'
import { llamar, logrosActivos } from '../../../../lib/logros'
import { unaSolaVez } from '../../../../lib/sondeo'
import type { Stop } from '../../../../lib/types'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import type { RespuestaCerca } from '../useCercaDeAqui'

/**
 * LOS PEDAZOS QUE SE GANAN EN ESTA PARADA (V2, «Aquí ganas 2 pedazos: «…» y «…»»): los nombres de las colecciones donde ese sitio da un pedazo AÚN POR GANAR. Los emblemas ocultos NUNCA se anuncian
 * (el servidor ni los manda en `pedazos_nombres`). Se le pregunta al servidor con la coordenada de la propia parada (no hace falta el GPS) y solo cuando hace falta (`activo`: la tarjeta de «Ya estás aquí»).
 */
// (V46) Lo ya preguntado, en memoria: al llegar a la parada la línea «Aquí ganas 1 pedazo» sale en el MISMO pintado que la tarjeta (antes se preguntaba al servidor justo al llegar y la línea aparecía un segundo tarde, empujando lo de debajo).
const guardados = new Map<string, string[]>()
// (V47) La colección y el sitio del PRIMER pedazo de cada parada, para dibujar su trozo en color sobre el círculo blanco.
const piezas = new Map<string, { coleccion: string; sitio: string }>()

/** El trozo que se gana en esta parada (la primera colección), si el servidor mandó sus ids. */
export function piezaDeParada(tripId: string | null, paradaId: string): { coleccion: string; sitio: string } | null {
  return piezas.get(`${tripId}:${paradaId}`) ?? null
}

/** «Aquí ganas 1 pedazo» / «Aquí ganas 2 pedazos». */
export function etiquetaDePedazos(nombres: string[]): string {
  return nombres.length === 1 ? 'Aquí ganas 1 pedazo' : `Aquí ganas ${nombres.length} pedazos`
}

/** El nombre de la colección; con dos o más, la primera y «y 1 más». */
export function nombreDePedazos(nombres: string[]): string {
  return nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres[0]} y ${nombres.length - 1} más`
}

export function usePedazosDeParada(tripId: string | null, parada: Stop, activo: boolean): string[] {
  const [nombres, setNombres] = useState<{ id: string; lista: string[] } | null>(() => (guardados.has(`${tripId}:${parada.id}`) ? { id: parada.id, lista: guardados.get(`${tripId}:${parada.id}`) ?? [] } : null))
  useEffect(() => {
    // Solo desarrollo: `window.__pedazosDemo = { 'Plaza de San Pedro': ['A', 'B'] }` pone lo que diría el servidor para esa parada (en la demo no hay servidor que conteste).
    if (import.meta.env.DEV && activo) {
      const demoPieza = (window as unknown as { __piezaDemo?: Record<string, { coleccion: string; sitio: string }> }).__piezaDemo?.[parada.name]
      if (demoPieza) piezas.set(`${tripId}:${parada.id}`, demoPieza)
      const falso = (window as unknown as { __pedazosDemo?: Record<string, string[]> }).__pedazosDemo?.[parada.name]
      if (falso) {
        setNombres({ id: parada.id, lista: falso })
        return undefined
      }
    }
    if (!activo || !tripId || !logrosActivos() || !hasRealCoordinates(parada.coordinates)) return undefined
    let vivo = true
    // (V36) Una sola pregunta por parada y viaje cada 2 minutos, aunque la ruta se vuelva a pintar (antes, cada vez que cambiaba el objeto `coordinates` se volvía a preguntar al servidor).
    const cuerpo = { trip_id: tripId, ubicacion: { lat: parada.coordinates.lat, lng: parada.coordinates.lng }, sitios_hoy: [parada.name], en_coche: false }
    void unaSolaVez(`pedazos:${tripId}:${parada.id}`, () => llamar<RespuestaCerca>('/api/logros/cerca', { cuerpo }), 120_000).then((r) => {
      if (!vivo || !r?.ok) return
      const aqui = r.cerca.find((c) => c.dentro && c.hay_pedazo)
      const lista = aqui?.pedazos_nombres ?? (aqui?.coleccion_nombre ? [aqui.coleccion_nombre] : [])
      guardados.set(`${tripId}:${parada.id}`, lista)
      if (aqui?.pedazos_colecciones?.[0]) piezas.set(`${tripId}:${parada.id}`, { coleccion: aqui.pedazos_colecciones[0], sitio: aqui.sitio })
      setNombres({ id: parada.id, lista })
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- las coordenadas se miran por sus números (el objeto cambia de identidad con cada pintado de la ruta)
  }, [activo, tripId, parada.id, parada.name, parada.coordinates?.lat, parada.coordinates?.lng])
  // Solo desarrollo: lo que diga `window.__pedazosDemo` para esta parada, se ponga cuando se ponga (la tarjeta ya no espera a «Ya estás aquí» para preguntar).
  if (import.meta.env.DEV && activo) {
    const falso = (window as unknown as { __pedazosDemo?: Record<string, string[]> }).__pedazosDemo?.[parada.name]
    if (falso) return falso
  }
  const guardado = guardados.get(`${tripId}:${parada.id}`)
  return nombres && nombres.id === parada.id ? nombres.lista : (guardado ?? [])
}

/** «Aquí ganas 2 pedazos: «A» y «B»» (null si no hay ninguno). */
export function textoDePedazos(nombres: string[]): string | null {
  if (nombres.length === 0) return null
  const q = nombres.map((n) => `«${n}»`)
  const lista = q.length === 1 ? q[0] : `${q.slice(0, -1).join(', ')} y ${q[q.length - 1]}`
  return `Aquí ${nombres.length === 1 ? 'ganas 1 pedazo' : `ganas ${nombres.length} pedazos`}: ${lista}`
}
