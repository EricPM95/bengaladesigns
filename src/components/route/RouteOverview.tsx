import { useEffect, useState } from 'react'
import type { Route } from '../../lib/types'
import { buildDestinationSegments, formatSegmentNightsLabel, segmentCentroid } from '../../lib/destinationSegments'
import { dayCountryCode, flagStripesGradient } from '../../lib/flagColors'
import { addDaysToIso } from '../../lib/dateRange'
import { useRouteStore } from '../../store/useRouteStore'
import { DestinationDistanceConnector } from './DestinationDistanceConnector'
import { DestinationDetailModal } from './DestinationDetailModal'
import { ConfirmDialog } from './ConfirmDialog'
import { destinoCambiado } from '../../lib/recuperarDestino'
import { withUndo } from '../../store/useAddFlowStore'
import { Icono } from '../ui/Icono'
import { TarjetaRecuerdosEnRuta } from './fotos/TarjetaRecuerdos'

interface RouteOverviewProps {
  route: Route
  /** La ventana del destino abierta o cerrada: RouteView desmonta su mapa mientras tanto. */
  onDetailOpenChange?: (open: boolean) => void
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
/** «03 sept» */
const shortDate = (iso: string) => `${iso.slice(8, 10)} ${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]}`

/**
 * Pestaña RUTA (PROMPT_UI_REPASO_3, 1): una tarjeta por destino, en el orden del viaje, con la bandera de su país, el
 * nombre del destino y sus días y fechas («4 días · 03 sept – 06 sept»; sin fechas, solo «4 días»). Entre dos destinos,
 * la distancia. Tocar una tarjeta abre la ventana del destino, con sus hoteles y sus actividades.
 */
export function RouteOverview({ route, onDetailOpenChange }: RouteOverviewProps) {
  const [detailCity, setDetailCity] = useState<string | null>(null)
  // «Recuperar mi ruta» (la varita de la tarjeta del destino): la pregunta antes de volver a la ruta que preparamos.
  const [askRestoreCity, setAskRestoreCity] = useState<string | null>(null)
  const restoreOriginalRoute = useRouteStore((state) => state.restoreOriginalRoute)
  useEffect(() => {
    onDetailOpenChange?.(detailCity !== null)
    return () => onDetailOpenChange?.(false)
  }, [detailCity, onDetailOpenChange])

  // Rutas guardadas antes de que la ruta llevara el país: el del destino elegido en el formulario.
  const fallbackCountry = useRouteStore((state) => state.destinationPlace?.countryCode ?? null)
  const segments = buildDestinationSegments(route.days).map((segment) => (segment.countryCode ? segment : { ...segment, countryCode: dayCountryCode(fallbackCountry, segment.city) }))
  const detailSegment = detailCity ? segments.find((segment) => segment.city === detailCity) : undefined
  const tripStart = route.answers.dateRange?.start ?? null
  // La varita sale en cada destino y recupera solo los días de ese destino (la copia de la ruta inicial se filtra por destino).
  const canRestoreRoute = Boolean(route.originalRoute)

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-3.5 pb-6 pt-4">
      <TarjetaRecuerdosEnRuta route={route} />
      {segments.map((segment, index) => {
        const segmentDays = route.days.filter((day) => segment.dayIds.includes(day.id) && !day.isReturnLeg)
        const count = segmentDays.length
        const cityChanged = destinoCambiado(route, segment.city)
        const firstNumber = segmentDays[0]?.dayNumber ?? 1
        const lastNumber = segmentDays[segmentDays.length - 1]?.dayNumber ?? firstNumber
        const dates = tripStart ? `${shortDate(addDaysToIso(tripStart, firstNumber - 1))} – ${shortDate(addDaysToIso(tripStart, lastNumber - 1))}` : null
        return (
          <div key={segment.id}>
            {index > 0 && <DestinationDistanceConnector from={segmentCentroid(segments[index - 1], route.days)} to={segmentCentroid(segment, route.days)} />}
            <div className="relative flex h-20 w-full items-center overflow-hidden rounded-3xl border border-text/10 bg-bg-card shadow-[0_1px_2px_rgba(28,34,48,.05),0_12px_30px_-20px_rgba(28,34,48,.3)]">
            <button type="button" onClick={() => setDetailCity(segment.city)} className="flex h-full min-w-0 flex-1 items-center gap-3.5 pl-4 pr-1 text-left">
              {/* La bandera: sus colores en franjas inclinadas, en un cuadrado de esquinas redondeadas. */}
              <span
                aria-hidden="true"
                className="h-10 w-10 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(28,34,48,.08)]"
                style={{ background: flagStripesGradient(segment.countryCode) }}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="truncate font-display text-[24px] leading-[1.05] text-text">{segment.city}</span>
                <span className="whitespace-nowrap text-[12px] text-text/55">
                  {count} día{count === 1 ? '' : 's'}
                  {dates ? ` · ${dates}` : ''}
                </span>
              </span>
            </button>
            {canRestoreRoute && (
              <button
                type="button"
                disabled={!cityChanged}
                onClick={() => setAskRestoreCity(segment.city)}
                title={cityChanged ? 'Recuperar mi ruta' : 'Tu ruta está tal como te la preparamos'}
                aria-label="Recuperar mi ruta"
                className="group flex h-11 w-11 shrink-0 items-center justify-center disabled:cursor-not-allowed"
              >
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-text/60 hover:bg-bg-hover group-disabled:opacity-40 group-disabled:hover:bg-bg-card">
                  <Icono nombre="recuperar" className="h-[19px] w-[19px]" />
                </span>
              </button>
            )}
            <button type="button" onClick={() => setDetailCity(segment.city)} aria-label={segment.city} tabIndex={-1} className="flex h-full w-[34px] shrink-0 items-center justify-center pr-2 text-text/45">
              <Icono nombre="adelante" size={18} />
            </button>
            </div>
          </div>
        )
      })}

      {askRestoreCity && (
        <ConfirmDialog
          eyebrow="Ruta original"
          text={`¿Recuperar tu ruta de ${askRestoreCity}?`}
          detail="Volverás a la ruta inicial y se perderá todo lo modificado."
          confirmLabel="Recuperar"
          cancelLabel="Cancelar"
          onCancel={() => setAskRestoreCity(null)}
          onConfirm={() => {
            setAskRestoreCity(null)
            withUndo('Ruta recuperada', () => restoreOriginalRoute(askRestoreCity))
          }}
        />
      )}

      <DestinationDetailModal
        city={detailCity}
        days={route.days}
        nightsLabel={detailSegment ? formatSegmentNightsLabel(detailSegment, route.days, route.answers.dateRange?.start) : null}
        isCamper={route.transportContext.vehicle_type === 'camper'}
        onClose={() => setDetailCity(null)}
      />
    </div>
  )
}
