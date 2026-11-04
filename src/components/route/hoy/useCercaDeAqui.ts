import { useEffect, useRef, useState } from 'react'
import { llamar, logrosActivos, type Ubicacion } from '../../../lib/logros'

/**
 * LO QUE HAY CERCA DE DONDE ESTÁ EL VIAJERO (Tanda HOY1: fuera de ruta H8/H8b, el juego C16/C17 y el reto del día C18). Pregunta a `POST /api/logros/cerca` con la ubicación del momento y la ruta de hoy.
 *   - Solo mira la ubicación si el viajero YA dio permiso (nunca la pide: la pide el Visto, la primera vez). Sin permiso, solo trae el reto del día.
 *   - Cada 45 segundos mientras HOY está a la vista y la pantalla encendida; la ubicación no se guarda.
 *   - En desarrollo: `window.__hoy1Ubicacion = { lat, lng }` pone una ubicación de mentira y `window.__hoy1Cerca = {...}` una respuesta de mentira del servidor (para ver cada estado sin salir de casa).
 */
export interface SitioCerca {
  sitio: string
  nombre: string
  /** «en el Coliseo» · «en La Graciosa» y «al Coliseo» · «a la Boca de la Verdad»: con el artículo de cada sitio. */
  en_sitio: string
  a_sitio: string
  metros: number
  radio_m: number
  al_borde_m: number
  dentro: boolean
  en_ruta_hoy: boolean
  hay_emblema: boolean
  emblema_nombre: string | null
  hay_pedazo: boolean
  coleccion_nombre: string | null
}

export interface RetoDelDia {
  coleccion: string
  nombre: string
  faltan: number
  total: number
  sitios: { sitio: string; nombre: string; ganado: boolean; hoy: boolean }[]
}

export interface RespuestaCerca {
  ok: boolean
  cerca: SitioCerca[]
  juego: 'llegada' | 'mas_cerca' | 'brilla' | null
  juego_sitio: string | null
  fuera_de_ruta: string | null
  junto_a: string | null
  reto: RetoDelDia | null
}

const CADA_MS = 45000

interface VentanaDePrueba {
  __hoy1Ubicacion?: Ubicacion | null
  __hoy1Cerca?: RespuestaCerca | null
}

async function ubicacionConPermiso(): Promise<Ubicacion | null> {
  if (import.meta.env.DEV) {
    const falsa = (window as unknown as VentanaDePrueba).__hoy1Ubicacion
    if (falsa) return falsa
  }
  if (!('geolocation' in navigator)) return null
  try {
    const permiso = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
    if (permiso?.state !== 'granted') return null
  } catch {
    return null
  }
  return new Promise((resolver) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolver({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolver(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 },
    )
  })
}

export function useCercaDeAqui({ tripId, sitiosHoy, activo }: { tripId: string | null; sitiosHoy: string[]; activo: boolean }): RespuestaCerca | null {
  const [datos, setDatos] = useState<RespuestaCerca | null>(null)
  const clave = sitiosHoy.join('|')
  const ultima = useRef(0)
  useEffect(() => {
    if (!activo || !tripId || !logrosActivos()) {
      setDatos(null)
      return undefined
    }
    let vivo = true
    const preguntar = async () => {
      if (document.hidden) return
      if (import.meta.env.DEV) {
        const falsa = (window as unknown as VentanaDePrueba).__hoy1Cerca
        if (falsa) {
          if (vivo) setDatos({ ...falsa })
          return
        }
      }
      ultima.current = Date.now()
      const ubicacion = await ubicacionConPermiso()
      const r = await llamar<RespuestaCerca>('/api/logros/cerca', { cuerpo: { trip_id: tripId, ubicacion, sitios_hoy: sitiosHoy } })
      if (vivo && r?.ok) setDatos(r)
    }
    void preguntar()
    const t = window.setInterval(() => void preguntar(), CADA_MS)
    const alVolver = () => {
      if (!document.hidden && Date.now() - ultima.current > CADA_MS / 2) void preguntar()
    }
    document.addEventListener('visibilitychange', alVolver)
    // Solo desarrollo: las pruebas piden otra vez lo de ahora sin esperar a los 45 segundos.
    const pedirYa = () => void preguntar()
    if (import.meta.env.DEV) window.addEventListener('trazo:hoy1-repreguntar', pedirYa)
    return () => {
      vivo = false
      if (import.meta.env.DEV) window.removeEventListener('trazo:hoy1-repreguntar', pedirYa)
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', alVolver)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, tripId, clave])
  return datos
}
