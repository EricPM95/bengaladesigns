import { lazy, Suspense, useEffect } from 'react'
import { logrosActivos } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { getTodayTripContext, resolveRealStops } from '../../../lib/todayMode'
import { isNumberedStop } from '../../../lib/stopKind'
import { useCuenta } from '../../cuenta/useCuenta'
import { useMomentosUI } from './useMomentosUI'

/**
 * EL ANFITRIÓN DE LOS MOMENTOS (Tanda 8B). Lo único de los momentos que va en el paquete de la app al abrir: es pequeño y todo lo demás se carga al hacer falta.
 *   - Lee lo que cae en `useLogrosStore.momentos` y, cuando no hay una hoja del Visto abierta (`hojaAbierta`), lo enseña con el reproductor.
 *   - Monta también el resumen del día y del viaje, «Compartir», la hoja sencilla de logros y «Hoy empiezas a ganar logros».
 * Con los logros apagados no monta nada.
 */
const Reproductor = lazy(() => import('./Reproductor'))
const ResumenDia = lazy(() => import('./ResumenDia').then((m) => ({ default: m.ResumenDia })))
const ResumenViaje = lazy(() => import('./ResumenViaje'))
const Compartir = lazy(() => import('./Compartir'))
const HojaLogros = lazy(() => import('./HojaLogros'))
const PrimerDia = lazy(() => import('./PrimerDia'))

export function MomentosHost() {
  if (!logrosActivos()) return null
  return <Encendido />
}

function Encendido() {
  const cuenta = useCuenta()
  const tripId = useSyncStore((s) => s.activeTripId)
  const hayMomentos = useLogrosStore((s) => s.momentos.length > 0)
  const hojaAbierta = useLogrosStore((s) => s.hojaAbierta)
  const ronda = useMomentosUI((s) => s.ronda)
  const resumenDia = useMomentosUI((s) => s.resumenDia)
  const resumenViaje = useMomentosUI((s) => s.resumenViaje)
  const compartir = useMomentosUI((s) => s.compartir)
  const hojaLogros = useMomentosUI((s) => s.hojaLogros)
  const primerDia = useMomentosUI((s) => s.primerDia)
  const ui = useMomentosUI

  // Solo en desarrollo: las pruebas de los momentos (window.__momentos).
  useEffect(() => {
    if (import.meta.env.DEV) void import('./demoMomentos')
  }, [])

  // Las sorpresas esperan a que se cierre la hoja del Visto; si llegan más mientras se enseñan, esperan a la siguiente ronda.
  useEffect(() => {
    if (!hayMomentos || hojaAbierta || ronda) return
    const nuevos = useLogrosStore.getState().tomarMomentos()
    if (nuevos.length > 0) ui.getState().empezarRonda(nuevos)
  }, [hayMomentos, hojaAbierta, ronda, ui])

  // El resumen del día, al acabar la ruta: cuando la última parada del día de hoy pasa a vista (o saltada), una sola vez por día. Las sorpresas que haya salen antes (el resumen espera a que acabe la ronda).
  useEffect(() => {
    if (cuenta.tipo !== 'cuenta' || !tripId) return undefined
    const completo = (route: ReturnType<typeof useRouteStore.getState>['route']) => {
      if (!route) return null
      const hoy = getTodayTripContext(route, useRouteStore.getState().dev_simulated_today_iso ?? undefined)
      if (!hoy) return null
      const paradas = resolveRealStops(hoy.day).filter(isNumberedStop)
      return paradas.length > 0 && paradas.every((p) => Boolean(p.checkedInAt) || p.saltada) ? `trazo:logros:resumendia:${tripId}:${hoy.dateIso}` : null
    }
    return useRouteStore.subscribe((estado, previo) => {
      const clave = completo(estado.route)
      if (!clave || completo(previo.route) === clave) return
      try {
        if (window.localStorage.getItem(clave) === 'si') return
        window.localStorage.setItem(clave, 'si')
      } catch {
        /* sin almacenamiento: puede salir otra vez */
      }
      ui.getState().abrirResumenDia()
    })
  }, [cuenta.tipo, tripId, ui])

  // «Hoy empiezas a ganar logros»: una vez, el primer día con logros.
  useEffect(() => {
    if (cuenta.tipo !== 'cuenta' || !tripId) return
    try {
      if (window.localStorage.getItem('trazo:logros:primerdia') === 'si') return
    } catch {
      /* sin almacenamiento: se comprueba igual */
    }
    void import('./PrimerDia').then((m) => m.comprobarPrimerDia(tripId))
  }, [cuenta.tipo, tripId])

  return (
    <Suspense fallback={null}>
      {ronda && <Reproductor momentos={ronda} onTerminar={() => ui.getState().terminarRonda()} />}
      {!ronda && !hojaAbierta && resumenDia && <ResumenDia ganado={[]} estado={null} alCerrar={() => ui.getState().cerrarResumenDia()} />}
      {resumenViaje && <ResumenViaje />}
      {compartir && <Compartir />}
      {hojaLogros && <HojaLogros />}
      {primerDia && !ronda && <PrimerDia />}
    </Suspense>
  )
}
