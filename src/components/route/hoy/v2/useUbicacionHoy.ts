import { useCallback, useEffect, useRef, useState } from 'react'
import type { Coordinates } from '../../../../lib/types'

/** Cada cuánto se vuelve a mirar dónde está el viajero, mientras HOY está abierto y ya hay permiso (ms). */
export const REFRESCO_UBICACION_MS = 45000

/**
 * LA UBICACIÓN DE HOY (HOY1). `pedir()` la pide una vez (la primera vez, el navegador pregunta). Si el permiso YA estaba dado, se mira sola al abrir HOY y se refresca cada 45 s mientras la pantalla
 * está abierta: así «Ya estás aquí» y «Sal ahora» se enteran sin que el viajero toque nada. Sin permiso nunca se pide sola.
 */
export function useUbicacionHoy(): { ubicacion: Coordinates | null; estado: 'libre' | 'pidiendo' | 'no'; pedir: () => void } {
  const [ubicacion, setUbicacion] = useState<Coordinates | null>(null)
  const [estado, setEstado] = useState<'libre' | 'pidiendo' | 'no'>('libre')
  const viva = useRef(true)

  const pedir = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return setEstado('no')
    setEstado('pidiendo')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (!viva.current) return
        setUbicacion({ lat: p.coords.latitude, lng: p.coords.longitude })
        setEstado('libre')
      },
      () => viva.current && setEstado('no'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 20000 },
    )
  }, [])

  useEffect(() => {
    viva.current = true
    let reloj: number | undefined
    const mirar = () => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return
      navigator.geolocation.getCurrentPosition(
        (p) => viva.current && setUbicacion({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => undefined,
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 20000 },
      )
    }
    const permisos = typeof navigator !== 'undefined' ? navigator.permissions : undefined
    permisos
      ?.query({ name: 'geolocation' as PermissionName })
      .then((r) => {
        if (!viva.current || r.state !== 'granted') return
        mirar()
        reloj = window.setInterval(mirar, REFRESCO_UBICACION_MS)
      })
      .catch(() => undefined)
    return () => {
      viva.current = false
      if (reloj) window.clearInterval(reloj)
    }
  }, [])

  return { ubicacion, estado, pedir }
}
