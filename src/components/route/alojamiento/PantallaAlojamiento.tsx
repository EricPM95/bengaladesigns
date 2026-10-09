import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { mapaAlojamientoUrl } from './mapaAlojamientoUrl'
import { monedaDelViajero } from '../../../lib/useMoneda'
import { EXPLORE_ICONS } from '../../../lib/exploreStyle'

/**
 * El mapa de alojamientos a pantalla completa (Tanda 6z), sin tirador: arriba una barra con «Alojamiento en {destino}» y la ✕; el mapa de Stay22 (el del destino, con las fechas del viaje y el código de campaña) llena el resto,
 * y debajo, fuera del mapa, el enlace «¿Ya tienes alojamiento? Añádelo» que abre «Tu alojamiento». Es lo único a lo que llevan los botones de hoteles de la app.
 */
export function PantallaAlojamiento({ route, ciudad, mapa, onTengo, onClose }: { route: Route; ciudad: string; mapa: DestinationExcursions['mapaAlojamiento']; onTengo: () => void; onClose: () => void }) {
  const campaignCode = useRouteStore((state) => state.campaignCode)
  const url = useMemo(() => (mapa ? mapaAlojamientoUrl(mapa, route, campaignCode, monedaDelViajero(route)) : null), [mapa, route, campaignCode])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div className="map-cover-overlay fixed inset-0 z-[100] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-labelledby="pantalla-alojamiento">
      <div className="flex shrink-0 items-center gap-3 px-4 pb-2.5 pt-[max(1rem,env(safe-area-inset-top))] md:px-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
          className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full bg-bg-card text-accent"
          style={{ border: '1.5px solid oklch(0.55 0.15 45)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d={EXPLORE_ICONS.close} />
          </svg>
        </button>
        <h2 id="pantalla-alojamiento" className="min-w-0 flex-1 truncate font-display text-[26px] leading-none text-text">
          Alojamiento en {ciudad}
        </h2>
      </div>
      <div className="mx-3 min-h-0 flex-1 overflow-hidden rounded-[22px] bg-[#F5EFE4] md:mx-8">
        {url ? (
          <iframe title={`Alojamientos en ${ciudad}`} src={url} className="h-full w-full border-0" allow="geolocation" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-text/60">Todavía no tenemos el mapa de alojamientos de este destino.</div>
        )}
      </div>
      <div className="flex shrink-0 justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <button type="button" onClick={onTengo} className="px-2 py-1.5 text-text underline underline-offset-[3px]" style={{ font: "italic 400 17px 'Instrument Serif',serif" }}>
          ¿Ya tienes alojamiento? Añádelo
        </button>
      </div>
    </div>,
    document.body,
  )
}
