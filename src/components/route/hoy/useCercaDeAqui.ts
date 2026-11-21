import { useEffect, useRef, useState } from 'react'
import { unaSolaVez } from '../../../lib/sondeo'
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
  /** Los nombres de todas las colecciones donde este sitio da un pedazo por ganar (sin emblemas). */
  pedazos_nombres?: string[]
}

export interface RetoDelDia {
  coleccion: string
  nombre: string
  faltan: number
  total: number
  sitios: { sitio: string; nombre: string; ganado: boolean; hoy: boolean }[]
}

/** (HOY2b, 4) Un sitio de un reto del día con su estado: visto (con fecha), hoy en tu ruta, en tu ruta otro día (con su fecha) o fuera de tu ruta (cerca o no de la zona de hoy). */
export interface SitioDeReto {
  sitio: string
  nombre: string
  ganado: boolean
  hoy: boolean
  estado: 'visto' | 'hoy' | 'otro_dia' | 'fuera'
  fecha: string | null
  dia_fecha: string | null
  cerca_de_hoy: boolean
}

/** (HOY2b, 4) Una colección que se puede completar hoy, o que tiene un pedazo fuera de tu ruta pero cerca de la zona de hoy. */
export interface RetoDeHoy {
  coleccion: string
  nombre: string
  faltan: number
  total: number
  completable_hoy: boolean
  faltan_fuera: string[]
  sitios: SitioDeReto[]
}

export interface RespuestaCerca {
  ok: boolean
  cerca: SitioCerca[]
  juego: 'llegada' | 'mas_cerca' | 'brilla' | null
  juego_sitio: string | null
  fuera_de_ruta: string | null
  junto_a: string | null
  reto: RetoDelDia | null
  /** (HOY2b, 4) Todos los retos del día. */
  retos?: RetoDeHoy[]
}

const CADA_MS = 75000 // (V26) antes 45 s; solo con la app a la vista y una sola vez aunque haya varias pantallas de HOY pidiéndolo (ver lib/sondeo.ts)

/** (V36) Parado = a menos de esto de donde se preguntó la última vez; y lo más que se aguanta sin volver a preguntar aunque no se mueva nadie. */
const QUIETO_METROS = 60
const MAXIMO_SIN_PREGUNTAR_MS = 5 * 60 * 1000
function metrosEntre(a: Ubicacion, b: Ubicacion): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)))
}

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

export function useCercaDeAqui({ tripId, sitiosHoy, activo, enCoche = false }: { tripId: string | null; sitiosHoy: string[]; activo: boolean; /** (HOY2b, 4) Para contar «cerca de la zona de hoy»: 20 min en coche o 15 a pie. */ enCoche?: boolean }): RespuestaCerca | null {
  const [datos, setDatos] = useState<RespuestaCerca | null>(null)
  const clave = sitiosHoy.join('|')
  const ultima = useRef(0)
  const ultimaPregunta = useRef<{ en: number; ubicacion: Ubicacion | null; clave: string } | null>(null)
  useEffect(() => {
    if (!activo || !tripId || !logrosActivos()) {
      setDatos(null)
      return undefined
    }
    let vivo = true
    // `reloj`: lo pide el reloj de respaldo o el volver a la app (no una orden directa). (V36) Con el viajero parado (a menos de 60 m de donde se preguntó la última vez) y la última respuesta de hace menos de 5 minutos,
    // NO se vuelve a preguntar: la respuesta sería la misma. Antes se preguntaba cada 75 s aunque no se moviera nadie (unas 380 veces en un día de HOY).
    const preguntar = async (reloj = false) => {
      if (document.hidden) return
      if (import.meta.env.DEV) {
        const falsa = (window as unknown as VentanaDePrueba).__hoy1Cerca
        if (falsa) {
          if (vivo) setDatos({ ...falsa })
          return
        }
      }
      const ubicacion = await ubicacionConPermiso()
      const previa = ultimaPregunta.current
      if (reloj && previa && Date.now() - previa.en < MAXIMO_SIN_PREGUNTAR_MS && previa.clave === `${tripId}|${clave}|${enCoche}` && (ubicacion === null ? previa.ubicacion === null : previa.ubicacion !== null && metrosEntre(previa.ubicacion, ubicacion) < QUIETO_METROS)) return
      ultima.current = Date.now()
      const cuerpo = { trip_id: tripId, ubicacion, sitios_hoy: sitiosHoy, en_coche: enCoche }
      ultimaPregunta.current = { en: Date.now(), ubicacion, clave: `${tripId}|${clave}|${enCoche}` }
      const r = await unaSolaVez(`cerca:${JSON.stringify(cuerpo)}`, () => llamar<RespuestaCerca>('/api/logros/cerca', { cuerpo }), 20_000)
      if (vivo && r?.ok) setDatos(r)
    }
    void preguntar()
    const t = window.setInterval(() => void preguntar(true), CADA_MS)
    const alVolver = () => {
      if (!document.hidden && Date.now() - ultima.current > CADA_MS / 2) void preguntar(true)
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
