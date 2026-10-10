import { useCallback, useEffect, useState } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { alCambiarFotos, listarFotos, type FotoViaje } from './fotosViaje'

/** Las URLs firmadas duran una hora (fotosViaje.ts): se renuevan antes de que caduquen. */
const REFRESCO_MS = 45 * 60 * 1000

/**
 * Las fotos del viaje actual (`route.id`). Se cargan al entrar, se refrescan cuando se sube o borra
 * una foto en cualquier parte de la app (alCambiarFotos) y cada 45 minutos para renovar las URLs.
 * Sin Supabase o sin la migración: lista vacía, sin errores.
 */
export function useFotosViaje(): { fotos: FotoViaje[]; cargando: boolean; refrescar: () => Promise<void> } {
  const tripId = useRouteStore((state) => state.route?.id ?? null)
  const [fotos, setFotos] = useState<FotoViaje[]>([])
  const [cargando, setCargando] = useState(false)

  const refrescar = useCallback(async () => {
    setFotos(tripId ? await listarFotos(tripId) : [])
  }, [tripId])

  useEffect(() => {
    let vivo = true
    const cargar = async () => {
      const lista = tripId ? await listarFotos(tripId) : []
      if (vivo) setFotos(lista)
    }
    setCargando(true)
    void cargar().finally(() => {
      if (vivo) setCargando(false)
    })
    const quitar = alCambiarFotos(() => void cargar())
    const reloj = window.setInterval(() => void cargar(), REFRESCO_MS)
    return () => {
      vivo = false
      quitar()
      window.clearInterval(reloj)
    }
  }, [tripId])

  return { fotos, cargando, refrescar }
}
