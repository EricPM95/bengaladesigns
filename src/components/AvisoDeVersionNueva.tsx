import { useEffect, useSyncExternalStore } from 'react'
import { actualizarAhora, avisarVersionNueva, suscribirVersionNueva, versionNuevaAvisada } from '../lib/cargaSegura'
import { BOTON_ORO } from './ui/botonesOro'

/**
 * «HAY UNA VERSIÓN NUEVA · [ACTUALIZAR]» (19-nov, decisión de Eric): cuando se publica una versión con la app abierta, una franja pequeña abajo avisa; la app solo se recarga al tocar [Actualizar] (o la próxima vez que se abra).
 * Nadie pierde lo que estaba haciendo. Se detecta de dos maneras: una parte de la app que ya no existe (`vite:preloadError`, ver main.tsx y PiezaSegura) y, al volver a la app, comparando el archivo principal del
 * servidor con el que se cargó (como mucho una vez cada 10 minutos). En desarrollo (sin archivos con huella) no se comprueba.
 */
const CADA_COMPROBACION_MS = 10 * 60 * 1000
let ultimaComprobacion = 0

const archivoPrincipalCargado = (): string | null => {
  const s = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]')).map((x) => x.getAttribute('src') ?? '').find((x) => /\/assets\/index-[\w-]+\.js/.test(x))
  return s ? (s.match(/\/assets\/index-[\w-]+\.js/)?.[0] ?? null) : null
}

async function comprobarVersion(): Promise<void> {
  if (import.meta.env.DEV || versionNuevaAvisada()) return
  const cargado = archivoPrincipalCargado()
  if (!cargado || Date.now() - ultimaComprobacion < CADA_COMPROBACION_MS) return
  ultimaComprobacion = Date.now()
  try {
    const r = await fetch('/', { cache: 'no-store', headers: { Accept: 'text/html' } })
    if (!r.ok) return
    const html = await r.text()
    const servidor = html.match(/\/assets\/index-[\w-]+\.js/)?.[0]
    if (servidor && servidor !== cargado) avisarVersionNueva()
  } catch {
    /* sin red: no se sabe */
  }
}

export function AvisoDeVersionNueva() {
  const hay = useSyncExternalStore(suscribirVersionNueva, versionNuevaAvisada, versionNuevaAvisada)
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible') void comprobarVersion()
    }
    document.addEventListener('visibilitychange', alVolver)
    const t = window.setTimeout(alVolver, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      window.clearTimeout(t)
    }
  }, [])
  if (!hay) return null
  return (
    <div role="status" data-version-nueva style={{ position: 'fixed', left: 16, right: 16, bottom: 'calc(env(safe-area-inset-bottom,0px) + 84px)', zIndex: 9700, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 10px 16px', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', boxShadow: '0 14px 30px -12px rgba(0,0,0,.5)', font: "500 13.5px/1.2 'Geist',system-ui,sans-serif" }}>
      <span style={{ flex: 1 }}>Hay una versión nueva</span>
      <button type="button" data-actualizar-version onClick={actualizarAhora} style={{ flex: 'none', height: 40, padding: '0 18px', borderRadius: 999, border: 0, cursor: 'pointer', ...BOTON_ORO, font: "700 13.5px 'Geist',system-ui,sans-serif" }}>
        Actualizar
      </button>
    </div>
  )
}
