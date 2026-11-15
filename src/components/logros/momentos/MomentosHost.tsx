import { lazy, Suspense, useEffect } from 'react'
import { logrosActivos } from '../../../lib/logros'
import { useLogrosStore } from '../../../store/useLogrosStore'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { getTodayTripContext } from '../../../lib/todayMode'
import { useCuenta } from '../../cuenta/useCuenta'
import { ExpHost } from './ExpHost'
import type { PantallaDeMomentos } from './fila'
import { claveDelResumen, diaCompleto, diaPendienteDeResumen } from './resumenDelDia'
import { useMomentosUI } from './useMomentosUI'

/**
 * EL ANFITRIÓN DE LOS MOMENTOS (Tanda 8B). Lo único de los momentos que va en el paquete de la app al abrir: es pequeño y todo lo demás se carga al hacer falta.
 *   - Lee lo que cae en `useLogrosStore.momentos` y, cuando le toca, lo enseña con el reproductor.
 *   - Monta también el resumen del día y del viaje, «Compartir», la hoja sencilla de logros y «Hoy empiezas a ganar logros».
 * Con los logros apagados no monta nada.
 * DE UNO EN UNO (V3, regla de Eric, para todos los destinos): nada de esto sale si hay otra cosa en pantalla. Cada pantalla pide su turno en la fila (`fila.ts`, guardada en
 * `useMomentosUI.fila`) y solo se enseña cuando le toca; al cerrarse la que había, sale la siguiente que esperaba. «Compartir» y la hoja del Visto los abre la persona encima de lo
 * que mira: mientras estén abiertos, no sale nada de la fila.
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

/** Pide su turno mientras `quiere` y lo suelta cuando deja de querer; devuelve si le toca ahora (la pantalla solo se enseña entonces). */
function useTurno(k: PantallaDeMomentos, quiere: boolean): boolean {
  useEffect(() => {
    if (quiere) useMomentosUI.getState().pedir(k)
    else useMomentosUI.getState().soltar(k)
  }, [k, quiere])
  const toca = useMomentosUI((s) => s.fila.mostrando === k)
  return toca && quiere
}

function Encendido() {
  const cuenta = useCuenta()
  const tripId = useSyncStore((s) => s.activeTripId)
  const hayMomentos = useLogrosStore((s) => s.momentos.length > 0)
  const ronda = useMomentosUI((s) => s.ronda)
  const rondaExp = useMomentosUI((s) => s.rondaExp)
  const mostrando = useMomentosUI((s) => s.fila.mostrando)
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

  // Las sorpresas piden su turno en la fila (esperan a que se cierre lo que haya; si llegan más mientras se enseñan, esperan a la siguiente ronda).
  useEffect(() => {
    if (!hayMomentos || ronda) return undefined
    // Un momento de espera: lo del [Visto] y lo de la foto llegan en dos respuestas casi juntas y salen en la misma ronda.
    const h = window.setTimeout(() => {
      if (useLogrosStore.getState().momentos.length > 0 && !ui.getState().ronda) ui.getState().pedir('ronda')
    }, 900)
    return () => window.clearTimeout(h)
  }, [hayMomentos, ronda, ui])
  // Cuando le toca a la ronda, se cogen las sorpresas que haya y empieza; si no queda ninguna, se suelta el turno.
  useEffect(() => {
    if (mostrando !== 'ronda' || ronda) return
    const nuevos = useLogrosStore.getState().tomarMomentos()
    // (V3) La EXP ganada va como una línea dentro de la primera pantalla (no como un cartel aparte).
    if (nuevos.length > 0) ui.getState().empezarRonda(nuevos, useLogrosStore.getState().tomarExp())
    else ui.getState().soltar('ronda')
  }, [mostrando, ronda, ui])

  // El resumen del día, UNA vez al final de cada día (V3): al marcar o SALTAR la última parada, o, si el día acaba sin marcarla, la primera vez que se abre la app esa noche o al día siguiente.
  // Las sorpresas que haya salen antes (el resumen espera su turno en la fila). Nunca tras cada foto.
  useEffect(() => {
    if (cuenta.tipo !== 'cuenta' || !tripId) return undefined
    const yaSalio = (iso: string) => {
      try {
        return window.localStorage.getItem(claveDelResumen(tripId, iso)) === 'si'
      } catch {
        return false
      }
    }
    const abrir = (iso: string) => {
      try {
        window.localStorage.setItem(claveDelResumen(tripId, iso), 'si')
      } catch {
        /* sin almacenamiento: puede salir otra vez */
      }
      ui.getState().abrirResumenDia()
    }
    const hoyDe = (route: NonNullable<ReturnType<typeof useRouteStore.getState>['route']>) => getTodayTripContext(route, useRouteStore.getState().dev_simulated_today_iso ?? undefined)
    // Al abrir la app (con el viaje ya cargado): ¿quedó el resumen de anoche o de ayer sin enseñar?
    let comprobadoAlAbrir = false
    const alAbrir = () => {
      const route = useRouteStore.getState().route
      if (comprobadoAlAbrir || !route || !route.answers.dateRange?.start) return
      comprobadoAlAbrir = true
      const simulado = useRouteStore.getState().dev_simulated_today_iso
      const ahora = new Date()
      const hoyIso = simulado ?? `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
      const hora = simulado ? 23 : ahora.getHours()
      const pendiente = diaPendienteDeResumen(route, hoyIso, hora, yaSalio)
      if (pendiente) abrir(pendiente)
    }
    alAbrir()
    return useRouteStore.subscribe((estado, previo) => {
      alAbrir()
      const hoy = estado.route ? hoyDe(estado.route) : null
      if (!hoy || !estado.route || !diaCompleto(estado.route, hoy.dateIso)) return
      if (previo.route && diaCompleto(previo.route, hoy.dateIso)) return
      if (!yaSalio(hoy.dateIso)) abrir(hoy.dateIso)
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

  const tocaResumenDia = useTurno('resumenDia', resumenDia)
  const tocaResumenViaje = useTurno('resumenViaje', resumenViaje)
  const tocaHoja = useTurno('hojaLogros', hojaLogros)
  const tocaPrimerDia = useTurno('primerDia', primerDia)

  return (
    <Suspense fallback={null}>
      {ronda && mostrando === 'ronda' && <Reproductor momentos={ronda} exp={rondaExp} onTerminar={() => {
        // Si la EXP de la ronda subía de nivel o de rango, eso sale después (sin el cartel «+EXP»: ya se vio como línea).
        const e = ui.getState().rondaExp
        ui.getState().terminarRonda()
        if (e && (e.despues.nivel > e.antes.nivel || e.despues.rango_ix > e.antes.rango_ix)) useLogrosStore.setState((s) => ({ exp: s.exp ? { ...s.exp, antes: e.antes, sinCartel: true } : { ...e, sinCartel: true } }))
        ui.getState().soltar('ronda')
      }} />}
      {tocaResumenDia && <ResumenDia ganado={[]} estado={null} alCerrar={() => ui.getState().cerrarResumenDia()} />}
      {tocaResumenViaje && <ResumenViaje />}
      {compartir && <Compartir />}
      {tocaHoja && <HojaLogros />}
      {tocaPrimerDia && <PrimerDia />}
      <ExpHost />
    </Suspense>
  )
}
