import { useCallback, useEffect, useState } from 'react'
import { useDestinationTips } from '../../lib/destinationTips'
import { TripTipsSheet } from './TripTipsSheet'
import type { Route } from '../../lib/types'
import { buildDestinationSegments, formatSegmentNightsLabel, segmentCentroid } from '../../lib/destinationSegments'
import { PastillaPase } from '../pase/PastillaPase'
import { dayCountryCode } from '../../lib/flagColors'
import { addDaysToIso } from '../../lib/dateRange'
import { useRouteStore } from '../../store/useRouteStore'
import { DestinationDistanceConnector } from './DestinationDistanceConnector'
import { DestinationDetailModal } from './DestinationDetailModal'
import { ConfirmDialog } from './ConfirmDialog'
import { destinoCambiado } from '../../lib/recuperarDestino'
import { withUndo } from '../../store/useAddFlowStore'
import { Icono } from '../ui/Icono'
import { BanderaDestino } from '../ui/BanderaDestino'
import { TarjetaRecuerdosEnRuta } from './fotos/TarjetaRecuerdos'
import { BotonCompartirViaje, BotonesDeViaje } from '../propuesta/BotonesDeViaje'
import { textoDeDuracion } from '../../lib/duracionViaje'

interface RouteOverviewProps {
  route: Route
  /** La ventana del destino abierta o cerrada: RouteView desmonta su mapa mientras tanto. */
  onDetailOpenChange?: (open: boolean) => void
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
/** «03 sept» */
const shortDate = (iso: string) => `${iso.slice(8, 10)} ${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]}`

/**
 * La bombilla de la tarjeta de un destino: mismo botón redondo que la varita, a su izquierda. Solo sale si ese destino
 * tiene tips (mientras cargan o si no hay, no se pinta); no depende de que haya ruta original.
 */
function TipsButton({ city, onOpen }: { city: string; onOpen: () => void }) {
  const data = useDestinationTips(city, true)
  // (Tanda 10C: la bombilla sale siempre; sin tips de ese destino, apagada.)
  return (
    <button type="button" onClick={onOpen} disabled={!data} title={data ? `Tips de ${city}` : `Aún no hay tips de ${city}`} aria-label={`Tips de ${city}`} className="group flex h-9 w-9 shrink-0 items-center justify-center disabled:cursor-not-allowed">
      <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-text/60 hover:bg-bg-hover group-disabled:opacity-40 group-disabled:hover:bg-bg-card">
        <Icono nombre="tips" className="h-[16px] w-[16px]" />
      </span>
    </button>
  )
}

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
  // Los tips del viaje (la bombilla de cada tarjeta): los del destino de ESA tarjeta.
  const [tipsCity, setTipsCity] = useState<string | null>(null)
  const closeTips = useCallback(() => setTipsCity(null), [])
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
      {/* RS1 y RW3 (cuentas parte 3): [Compartir viaje] para quien administra el viaje, [Recomendar otra ruta] para quien lo mira. */}
      <BotonesDeViaje />
      <TarjetaRecuerdosEnRuta route={route} />
      {segments.map((segment, index) => {
        const segmentDays = route.days.filter((day) => segment.dayIds.includes(day.id) && !day.isReturnLeg)
        const count = segmentDays.length
        const cityChanged = destinoCambiado(route, segment.city)
        const firstNumber = segmentDays[0]?.dayNumber ?? 1
        const lastNumber = segmentDays[segmentDays.length - 1]?.dayNumber ?? firstNumber
        // «5 días · 4 noches» (Tanda 7, punto 1): el último tramo cuenta también el día de vuelta (que duerme en casa, no en el destino), con su fecha.
        const esElUltimo = index === segments.length - 1
        const conVuelta = esElUltimo && route.days.some((day) => day.isReturnLeg)
        // (Un tramo que no es el último duerme todos sus días; el último, uno menos si no lleva el día de vuelta aparte.)
        const duracion = textoDeDuracion(count + (conVuelta ? 1 : 0), esElUltimo && !conVuelta ? count - 1 : count)
        const dates = tripStart ? `${shortDate(addDaysToIso(tripStart, firstNumber - 1))} – ${shortDate(addDaysToIso(tripStart, lastNumber - 1 + (conVuelta ? 1 : 0)))}` : null
        return (
          <div key={segment.id}>
            {index > 0 && <DestinationDistanceConnector from={segmentCentroid(segments[index - 1], route.days)} to={segmentCentroid(segment, route.days)} />}
            <div className="relative flex w-full flex-col overflow-hidden rounded-[28px] border border-text/10 bg-bg-card p-3.5 shadow-[0_1px_2px_rgba(28,34,48,.05),0_12px_30px_-20px_rgba(28,34,48,.3)]">
            <button type="button" onClick={() => setDetailCity(segment.city)} className="flex w-full min-w-0 items-center gap-3.5 text-left">
              {/* La bandera: sus colores en franjas inclinadas, en un cuadrado de esquinas redondeadas. */}
              <BanderaDestino countryCode={segment.countryCode} recta />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="truncate font-display text-[24px] leading-[1.05] text-text">{segment.city}</span>
                {/* Dos líneas: «5 días · 4 noches» y debajo las fechas (junto a la bombilla y el deshacer no caben en una a 375 px). */}
                <span data-duracion-del-viaje="1" className="whitespace-nowrap text-[12px] text-text/55">
                  {duracion}
                </span>
                {dates && <span className="whitespace-nowrap text-[12px] leading-none text-text/40">{dates}</span>}
              </span>
              <span aria-hidden="true" className="flex h-full w-[28px] shrink-0 items-center justify-end text-text/45">
                <Icono nombre="adelante" size={18} />
              </span>
            </button>
            {/* (Tanda 10G, el diseño P0c y P0d: una línea fina y, debajo, la pastilla del pase a la izquierda y los tres iconos a la derecha.) */}
            <div aria-hidden="true" className="my-3 h-px bg-text/10" />
            <div className="flex items-center gap-2">
              <PastillaPase destino={segment.city} />
              <span className="flex-1" />
            <TipsButton city={segment.city} onOpen={() => setTipsCity(segment.city)} />
            {/* Compartir el viaje (Tanda 10B): el icono de siempre, en la primera tarjeta; abre la hoja de invitar de Cuentas. */}
            {index === 0 && <BotonCompartirViaje />}
            {/* La flecha de volver a la ruta de antes SIEMPRE a la vista (Tanda 10C): apagada si no hay una ruta anterior que recuperar o si no hay nada cambiado. */}
            <button
              type="button"
              disabled={!canRestoreRoute || !cityChanged}
              onClick={() => setAskRestoreCity(segment.city)}
              title={!canRestoreRoute ? 'Todavía no hay una ruta anterior que recuperar' : cityChanged ? 'Recuperar mi ruta' : 'Tu ruta está tal como te la preparamos'}
              data-edit-tool="1"
              aria-label="Recuperar mi ruta"
              className="group flex h-9 w-9 shrink-0 items-center justify-center disabled:cursor-not-allowed"
            >
              <span className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-text/[.14] bg-bg-card text-text/60 hover:bg-bg-hover group-disabled:opacity-40 group-disabled:hover:bg-bg-card">
                <Icono nombre="recuperar" className="h-[16px] w-[16px]" />
              </span>
            </button>
            </div>
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

      <TripTipsSheet open={tipsCity !== null} destination={tipsCity ?? ''} onClose={closeTips} />

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
