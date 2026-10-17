import { useEffect } from 'react'
import { demoActivo, enviarDeshacerVisto, logrosActivos, vaciarCola } from '../../lib/logros'
import { cambiosDeVistos } from '../../lib/vistosPorPersona'
import { sonar, vibrar } from '../../lib/sonidos'
import { alQuitarVisto, procesarVisto, VistoFlujo } from './visto/VistoFlujo'
import { useLogrosStore } from '../../store/useLogrosStore'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useCuenta } from '../cuenta/useCuenta'

/**
 * LOS HECHOS DE LOS LOGROS (Tanda 8A). Sin renderizar nada. Con los logros encendidos y una cuenta de verdad:
 *   - cada [Visto] que pone la persona se manda al servidor (con su hora y la ubicación de ese momento) y cada Visto que quita, también;
 *   - lo que el servidor devuelve (lo ganado) cae en el almacén de logros, y suena el momento (un ajuste lo quita siempre);
 *   - lo que quedó sin mandar por falta de cobertura se manda al volver la señal.
 * Apagado, no se monta nada. Las pantallas de los momentos llegan en la 8b.
 */
export function LogrosPorVisto() {
  if (!logrosActivos()) return null
  return <Encendido />
}

function Encendido() {
  const cuenta = useCuenta()
  const idSincronizado = useSyncStore((s) => s.activeTripId)
  const idDeLaRuta = useRouteStore((s) => s.route?.id ?? null)
  // (En el modo demo de desarrollo no hay Supabase: el viaje es el de la ruta abierta.)
  const tripId = idSincronizado ?? (demoActivo() ? idDeLaRuta : null)
  const hayCuenta = cuenta.tipo === 'cuenta'

  useEffect(() => {
    if (!hayCuenta) return undefined
    const mandar = () => void vaciarCola().then((rs) => rs.forEach((r) => useLogrosStore.getState().recibir(r)))
    mandar()
    window.addEventListener('online', mandar)
    return () => window.removeEventListener('online', mandar)
  }, [hayCuenta])

  useEffect(() => {
    if (!hayCuenta || !tripId) return undefined
    return useRouteStore.subscribe((estado, previo) => {
      for (const cambio of cambiosDeVistos(previo.route, estado.route)) {
        const parada = estado.route?.days.find((d) => d.id === cambio.dayId)?.stops.find((s) => s.id === cambio.stopId)
        if (!parada) continue
        const datos = { tripId, stopId: cambio.stopId, nombre: parada.name }
        if (cambio.visto) {
          // Suena en el propio toque (es cuando el móvil deja sonar); lo que se gane después suena al llegar la respuesta.
          void sonar('visto')
          vibrar('visto')
          // 8b: el aviso de 5 segundos, la tarjeta que toque y el envío (src/components/logros/visto/VistoFlujo.tsx).
          void procesarVisto({ ...datos, dayId: cambio.dayId })
        } else {
          alQuitarVisto(cambio.stopId)
          void enviarDeshacerVisto(datos).then((r) => useLogrosStore.getState().recibir(r))
        }
      }
    })
  }, [hayCuenta, tripId])

  return <VistoFlujo tripId={tripId} />
}
