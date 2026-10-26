import { lazy, Suspense, useEffect } from 'react'
import { cuentasActivas } from '../../lib/cuentas'
import { demoActivo } from '../../lib/logros'
import { esInvitadoFingido, useModoInvitado } from '../../hooks/useModoInvitado'
import { usePuedeCambiarLaRuta } from '../../hooks/usePuedeCambiarLaRuta'
import { useLaPropuesta } from '../../hooks/useLaPropuesta'
import { esUnaPropuesta } from '../../lib/propuesta'
import { esElDiaAntes } from '../../lib/viajeEmpezado'
import { llamarServidor } from '../../lib/servidor'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { useR2Store } from '../../store/useR2Store'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { BotonDePropuesta } from './BotonDePropuesta'

// Las hojas se bajan cuando se abren (cuentas 3B, punto 2).
const HojaRecomendacionAbierta = lazy(() => import('./HojaRecomendacion').then((m) => ({ default: m.HojaRecomendacionAbierta })))
const HojaPropuestaDelDueno = lazy(() => import('./HojaPropuestaDelDueno').then((m) => ({ default: m.HojaPropuestaDelDueno })))
const HojaVerPropuesta = lazy(() => import('./HojaVerPropuesta').then((m) => ({ default: m.HojaVerPropuesta })))
const PropuestaEnviada = lazy(() => import('./PropuestaEnviada').then((m) => ({ default: m.PropuestaEnviada })))

const CADA_MS = 45_000

/**
 * EL ANFITRIÓN DEL VIAJE COMPARTIDO (cuentas parte 3; rehecho en la Tanda 10N). Siempre montado.
 *   · Con las cuentas encendidas: carga quién está en el viaje abierto y sus recomendaciones, y las vuelve a pedir cada poco mientras la app está a la vista (así el administrador ve «Ana te propone 5
 *     cambios» sin recargar y quien propone ve qué le han aceptado).
 *   · Enciende la PROPUESTA para quien solo recomienda antes de que empiece el viaje (la ruta de su teléfono pasa a ser su propuesta: `usePropuestaStore`) y la apaga cuando empieza el viaje o cambia su permiso.
 *   · Pinta el lápiz flotante, la hoja de la propuesta, «Se lo hemos mandado a…» y la hoja del administrador (la propuesta, cambio a cambio).
 *   · Durante el viaje, a quien solo recomienda se le esconden las herramientas de cambiar la ruta (`data-solo-ver`); el día antes, si tiene cambios sin enviar, le avisa en la campana.
 */
export function PropuestaHost() {
  return <Encendido />
}

function Encendido() {
  const tripActivo = useSyncStore((s) => s.activeTripId)
  const tripId = tripActivo ?? (esInvitadoFingido() ? 'dev' : null)
  const route = useRouteStore((s) => s.route)
  const simulada = useRouteStore((s) => s.dev_simulated_today_iso)
  const cargar = useViajeCompartido((s) => s.cargar)
  const enviada = usePropuestaStore((s) => s.enviada)
  const verAbierto = usePropuestaStore((s) => s.verAbierto)
  const activa = usePropuestaStore((s) => s.activa)
  const activar = usePropuestaStore((s) => s.activar)
  const desactivar = usePropuestaStore((s) => s.desactivar)
  const cerrarEnviada = usePropuestaStore((s) => s.cerrarEnviada)
  const r2 = useR2Store((s) => s.abierta)
  const cerrarR2 = useR2Store((s) => s.cerrar)
  const { nombreAdmin } = useModoInvitado()
  const { propone, soloRecomienda, enViaje } = usePuedeCambiarLaRuta()
  const { n } = useLaPropuesta()
  const rutaLista = Boolean(route)

  // Quien solo recomienda y todavía no ha empezado el viaje: su ruta es su propuesta. Si deja de poder proponer (empezó el viaje, o le cambian el permiso), se queda con la ruta del administrador.
  useEffect(() => {
    if (propone && tripId && rutaLista) void activar(tripId, useRouteStore.getState().route!)
    else if (activa) desactivar(true)
  }, [propone, tripId, rutaLista, activa, activar, desactivar])

  // Durante el viaje, quien solo recomienda no ve las herramientas de cambiar la ruta (el CSS las esconde con este atributo).
  useEffect(() => {
    if (soloRecomienda && enViaje) document.documentElement.setAttribute('data-solo-ver', '1')
    else document.documentElement.removeAttribute('data-solo-ver')
    return () => document.documentElement.removeAttribute('data-solo-ver')
  }, [soloRecomienda, enViaje])

  // El día antes del viaje, con cambios sin enviar: un aviso en su campana (una sola vez al día).
  useEffect(() => {
    if (!propone || !tripId || tripId === 'dev' || n === 0 || !esElDiaAntes(route, new Date(), simulada)) return
    const dia = route?.answers.dateRange?.start ?? ''
    const marca = `trazo:sin-enviar:${tripId}:${dia}:${n}`
    try {
      if (window.localStorage.getItem(marca)) return
      window.localStorage.setItem(marca, '1')
    } catch {
      /* sin almacenamiento: se avisa igualmente */
    }
    void llamarServidor('/api/avisos/sin-enviar', { metodo: 'POST', cuerpo: { tripId, n } })
  }, [propone, tripId, n, route, simulada])

  useEffect(() => {
    if (!cuentasActivas() || !tripActivo || demoActivo()) return undefined
    void cargar(tripActivo)
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void cargar(tripActivo)
    }, CADA_MS)
    const alVolver = () => {
      if (document.visibilityState === 'visible') void cargar(tripActivo)
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [tripActivo, cargar])

  return (
    <>
      <BotonDePropuesta />
      <Suspense fallback={null}>
        {verAbierto && <HojaVerPropuesta />}
        {enviada && <PropuestaEnviada nombre={nombreAdmin} onVolver={cerrarEnviada} />}
        {r2 && (esUnaPropuesta(r2.payload) ? <HojaPropuestaDelDueno rec={r2} onCerrar={cerrarR2} /> : <HojaRecomendacionAbierta rec={r2} onCerrar={cerrarR2} />)}
      </Suspense>
    </>
  )
}
