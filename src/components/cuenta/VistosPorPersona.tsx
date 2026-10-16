import { useEffect } from 'react'
import { cuentasActivas } from '../../lib/cuentas'
import { guardarVisto, listarMisVistos } from '../../lib/vistosApi'
import { cambiosDeVistos, conVistosDe } from '../../lib/vistosPorPersona'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useCuenta } from './useCuenta'

/**
 * LOS VISTOS DE CADA PERSONA (cuentas, parte 2, punto 4). Con las cuentas encendidas y una cuenta de verdad, la app pinta los Vistos de ESTA persona desde `stop_visits`
 * (no los del administrador, que van dentro de la ruta) y guarda en la tabla los que ella pone o quita. Sin renderizar nada. Con el interruptor apagado no se monta
 * nada de esto y los Vistos son los de siempre.
 */
export function VistosPorPersona() {
  if (!cuentasActivas()) return null
  return <VistosEncendidos />
}

let pintando = false

function VistosEncendidos() {
  const cuenta = useCuenta()
  const tripId = useSyncStore((s) => s.activeTripId)
  const rutaId = useRouteStore((s) => s.route?.id ?? null)
  const hayCuenta = cuenta.tipo === 'cuenta'

  // 1. Al abrir un viaje (o entrar con la cuenta): se pintan los vistos de esta persona.
  useEffect(() => {
    if (!hayCuenta || !tripId || !rutaId) return undefined
    let vivo = true
    void listarMisVistos(tripId).then((vistos) => {
      if (!vivo) return
      const route = useRouteStore.getState().route
      if (!route || route.id !== rutaId) return
      const pintada = conVistosDe(route, vistos)
      if (pintada !== route) {
        pintando = true // (pintar los vistos de la persona no es que ella los ponga ahora: no se vuelve a guardar)
        useRouteStore.setState({ route: pintada })
        pintando = false
      }
    })
    return () => {
      vivo = false
    }
  }, [hayCuenta, tripId, rutaId])

  // 2. Lo que esta persona pone o quita se guarda en su tabla.
  useEffect(() => {
    if (!hayCuenta || !tripId) return undefined
    return useRouteStore.subscribe((estado, previo) => {
      if (pintando) return
      for (const cambio of cambiosDeVistos(previo.route, estado.route)) void guardarVisto({ tripId, dayId: cambio.dayId, stopId: cambio.stopId }, cambio.visto)
    })
  }, [hayCuenta, tripId])

  return null
}
