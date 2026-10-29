import { lazy, Suspense, useEffect, useState } from 'react'
import { EVENTO_PAGAR } from '../../lib/pago'
import { usePaseEstado } from '../../lib/paseEstado'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'

const ListaDelPase = lazy(() => import('./ListaDelPase').then((m) => ({ default: m.ListaDelPase })))

/**
 * EL ANFITRIÓN DE LA LISTA DEL PASE (Tanda 10I; 10N10, 8b: antes, de la película). Siempre montado. `abrirPase()` (la función única que usan todos los candados, la pastilla de RUTA, [Ver el Pase de Roma]
 * y [Escuchar historia] cerrado) abre SIEMPRE la lista del pase con [Elegir mi pase], la primera vez y las siguientes. Al cerrarla se vuelve a la pantalla donde se estaba.
 */
export function ListaDelPaseHost() {
  // (Tanda 10N5 §0.2) El guardián del pase: siempre montado, pregunta al servidor si el viaje abierto tiene pase para que TODA la app (candados, cajas, RESERVAS, DÍAS…) lo sepa aunque no esté RUTA ni HOY a la vista.
  usePaseEstado(useSyncStore((st) => st.activeTripId))
  const [abierta, setAbierta] = useState<{ destino: string; tripId: string | null } | null>(null)

  useEffect(() => {
    const alPedir = () => {
      const destino = useRouteStore.getState().route?.destination ?? null
      if (!destino) return
      const tripId = useSyncStore.getState().activeTripId
      setAbierta((ya) => ya ?? { destino, tripId })
    }
    window.addEventListener(EVENTO_PAGAR, alPedir)
    return () => window.removeEventListener(EVENTO_PAGAR, alPedir)
  }, [])

  if (!abierta) return null
  return (
    <Suspense fallback={null}>
      <ListaDelPase destino={abierta.destino} tripId={abierta.tripId} desde="lista" onCerrar={() => setAbierta(null)} />
    </Suspense>
  )
}
