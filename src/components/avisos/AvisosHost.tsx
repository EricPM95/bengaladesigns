import { useEffect } from 'react'
import { avisoDeLaDireccion } from '../../lib/avisos'
import { cuentasActivas } from '../../lib/cuentas'
import { demoActivo } from '../../lib/logros'
import { prepararAudioAlPrimerToque } from '../../lib/sonidos'
import { FranjaDeAviso } from './FranjaDeAviso'
import { guardarMiZona, pedirPermisoUnaVez, prepararPermisoDeAvisos } from '../../lib/permisoAvisos'
import { useAvisosStore } from '../../store/useAvisosStore'
import { useMiPerfil } from '../../store/useMiPerfil'
import { useRouteStore } from '../../store/useRouteStore'
import { useCuenta } from '../cuenta/useCuenta'

const CADA_MS = 60_000

const hoyEnLocal = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * EL ANFITRIÓN DE LA CAMPANITA DE AVISOS (cuentas parte 3, punto 4). Siempre montado; con las cuentas apagadas no hace nada. Con una cuenta de verdad:
 *   · carga los avisos al empezar, al volver a la app y cada minuto mientras está a la vista (así el puntito aparece sin recargar);
 *   · si se llega por el aviso del móvil (`/?aviso=ID`, o el aviso lo toca con la app abierta) abre la campanita en ese aviso (AV6);
 *   · guarda la zona horaria de la persona (para no avisarle de noche) y deja lista la clave del aviso del móvil;
 *   · al acabar el primer día del viaje, en el primer toque, sale la ventana del móvil que pide permiso para los avisos (una sola vez en la vida).
 */
export function AvisosHost() {
  if (!cuentasActivas()) return null
  return <Encendido />
}

function Encendido() {
  const cuenta = useCuenta()
  const real = cuenta.tipo === 'cuenta' && !demoActivo()
  const cargar = useAvisosStore((s) => s.cargar)
  const abrir = useAvisosStore((s) => s.abrir)
  const inicio = useRouteStore((s) => s.route?.answers.dateRange?.start ?? null)

  useEffect(() => {
    if (!real) return undefined
    void guardarMiZona()
    // Mi nombre y mi foto (de la cuenta; si entra con Google, su nombre de pila y su foto de Google hasta que ponga otros).
    if (cuenta.tipo === 'cuenta') void useMiPerfil.getState().cargar(cuenta.uid, cuenta.deGoogle ?? undefined)
    void prepararPermisoDeAvisos()
    const delAviso = avisoDeLaDireccion(window.location.search)
    if (delAviso) {
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete('aviso')
        window.history.replaceState(null, '', url)
      } catch {
        /* sin historial */
      }
    }
    void cargar().then(() => {
      if (delAviso) abrir(delAviso)
    })
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void cargar()
    }, CADA_MS)
    const alVolver = () => {
      if (document.visibilityState === 'visible') void cargar()
    }
    document.addEventListener('visibilitychange', alVolver)
    // El aviso del móvil con la app ya abierta: el service worker avisa por mensaje.
    const alMensaje = (e: MessageEvent) => {
      if (e.data?.tipo === 'aviso') void cargar().then(() => abrir(e.data.id ?? null))
    }
    navigator.serviceWorker?.addEventListener('message', alMensaje)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', alVolver)
      navigator.serviceWorker?.removeEventListener('message', alMensaje)
    }
  }, [real, cargar, abrir]) // eslint-disable-line react-hooks/exhaustive-deps

  // Al acabar el primer día del viaje: el siguiente toque de la persona pide el permiso (la ventana del móvil exige un toque suyo).
  useEffect(() => {
    if (!real || !inicio || hoyEnLocal() <= inicio) return undefined
    const alToque = () => {
      void pedirPermisoUnaVez()
      window.removeEventListener('pointerup', alToque, true)
    }
    window.addEventListener('pointerup', alToque, true)
    return () => window.removeEventListener('pointerup', alToque, true)
  }, [real, inicio])

  // (10N4 §4b) La franja de aviso nuevo, siempre lista; y el audio preparado en el primer toque (en el iPhone la web solo suena si la persona ya tocó la pantalla).
  useEffect(() => {
    prepararAudioAlPrimerToque()
  }, [])

  return <FranjaDeAviso />
}
