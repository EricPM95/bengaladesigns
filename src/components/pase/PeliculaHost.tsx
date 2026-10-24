import { lazy, Suspense, useEffect, useState } from 'react'
import { EVENTO_PAGAR } from '../../lib/pago'
import { peliculaYaVista } from '../../lib/peliculaVista'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'

const PeliculaPase = lazy(() => import('./PeliculaPase').then((m) => ({ default: m.PeliculaPase })))

/**
 * EL ANFITRIÓN DE LA PELÍCULA DEL PASE (Tanda 10I). Siempre montado. `abrirPase()` (la función única que usan todos los candados, la pastilla de RUTA, [Ver el Pase de Roma] y [Escuchar historia] cerrado)
 * ya no abre la hoja de compra: abre la película. La primera vez, entera; después, directa al final (la lista del pase con [Elegir mi pase]). Al cerrarla se vuelve a la pantalla donde se estaba.
 * La película se baja cuando se abre (el cargador es pequeño).
 */
export function PeliculaHost() {
  const [abierta, setAbierta] = useState<{ destino: string; tripId: string | null; desde: 'principio' | 'final' } | null>(null)

  useEffect(() => {
    const alPedir = () => {
      const destino = useRouteStore.getState().route?.destination ?? null
      if (!destino) return
      const tripId = useSyncStore.getState().activeTripId
      void peliculaYaVista().then((vista) => setAbierta((ya) => ya ?? { destino, tripId, desde: vista ? 'final' : 'principio' }))
    }
    window.addEventListener(EVENTO_PAGAR, alPedir)
    return () => window.removeEventListener(EVENTO_PAGAR, alPedir)
  }, [])

  if (!abierta) return null
  return (
    <Suspense fallback={null}>
      <PeliculaPase destino={abierta.destino} tripId={abierta.tripId} desde={abierta.desde} onCerrar={() => setAbierta(null)} />
    </Suspense>
  )
}
