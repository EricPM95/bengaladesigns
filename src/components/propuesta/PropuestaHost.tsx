import { lazy, Suspense, useEffect } from 'react'
import { cuentasActivas } from '../../lib/cuentas'
import { demoActivo } from '../../lib/logros'
import { useModoInvitado } from '../../hooks/useModoInvitado'
import { usePropuestaStore } from '../../store/usePropuestaStore'
import { useR2Store } from '../../store/useR2Store'
import { useSyncStore } from '../../store/useSyncStore'
import { useViajeCompartido } from '../../store/useViajeCompartido'
import { BarraDePropuesta } from './BarraDePropuesta'

// Las hojas se bajan cuando se abren (cuentas 3B, punto 2).
const HojaRecomendacionAbierta = lazy(() => import('./HojaRecomendacion').then((m) => ({ default: m.HojaRecomendacionAbierta })))
const HojaVerPropuesta = lazy(() => import('./HojaVerPropuesta').then((m) => ({ default: m.HojaVerPropuesta })))
const PropuestaEnviada = lazy(() => import('./PropuestaEnviada').then((m) => ({ default: m.PropuestaEnviada })))

const CADA_MS = 45_000

/**
 * EL ANFITRIÓN DEL VIAJE COMPARTIDO (cuentas parte 3). Siempre montado; con las cuentas apagadas no hace nada.
 *   · Carga quién está en el viaje abierto y sus recomendaciones, y las vuelve a pedir cada poco mientras la app está a la vista (así el administrador ve «1 recomendación» sin recargar).
 *   · Pinta la barra «Tu propuesta» (RM), la lista de cambios (RV), «Se lo hemos mandado a…» (RSent) y la hoja del administrador (R2).
 */
export function PropuestaHost() {
  if (!cuentasActivas()) return null
  return <Encendido />
}

function Encendido() {
  const tripId = useSyncStore((s) => s.activeTripId)
  const cargar = useViajeCompartido((s) => s.cargar)
  const enviada = usePropuestaStore((s) => s.enviada)
  const verAbierto = usePropuestaStore((s) => s.verAbierto)
  const cerrarEnviada = usePropuestaStore((s) => s.cerrarEnviada)
  const r2 = useR2Store((s) => s.abierta)
  const cerrarR2 = useR2Store((s) => s.cerrar)
  const { nombreAdmin, soloVer } = useModoInvitado()

  // Quien mira el viaje de otra persona no ve las herramientas de editar (el CSS lo esconde con este atributo).
  useEffect(() => {
    if (soloVer) document.documentElement.setAttribute("data-solo-ver", "1")
    else document.documentElement.removeAttribute("data-solo-ver")
    return () => document.documentElement.removeAttribute("data-solo-ver")
  }, [soloVer])

  useEffect(() => {
    if (!tripId || demoActivo()) return undefined
    void cargar(tripId)
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void cargar(tripId)
    }, CADA_MS)
    const alVolver = () => {
      if (document.visibilityState === 'visible') void cargar(tripId)
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [tripId, cargar])

  return (
    <>
      <BarraDePropuesta />
      <Suspense fallback={null}>
        {verAbierto && <HojaVerPropuesta />}
        {enviada && <PropuestaEnviada nombre={nombreAdmin} onVolver={cerrarEnviada} />}
        {r2 && <HojaRecomendacionAbierta rec={r2} onCerrar={cerrarR2} />}
      </Suspense>
    </>
  )
}
