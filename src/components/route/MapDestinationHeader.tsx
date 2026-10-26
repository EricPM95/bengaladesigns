import type { DateRange } from '../../lib/types'
import { useDatesCalendarStore } from '../../store/useDatesCalendarStore'
import { usePermisosDelViaje } from '../../hooks/usePermisosDelViaje'
import { formatHeaderDateRangeEs, formatHeaderDateRangeShortEs } from '../../lib/dateRange'

interface MapDestinationHeaderProps {
  destination: string
  dateRange?: DateRange
}

/**
 * Cabecera flotante centrada sobre el mapa de RUTA (Ronda 9, Mejora 2) — destino + fechas exactas del
 * viaje si existen, o "Añadir fechas" clicable si no (abre el calendario de toda la app, a pantalla completa: DatesCalendarModal). Las fechas viven en
 * `route.answers.dateRange`, la misma fuente que ya usan DayList.tsx (fecha real de cada día) y
 * destinationSegments.ts (rango de cada tramo) — fijarlas aquí las propaga automáticamente a toda la
 * app sin tocar nada más. No cambia el número de días de la ruta ya generada, solo le da fecha real.
 */
export function MapDestinationHeader({ destination, dateRange }: MapDestinationHeaderProps) {
  // (Tanda 10N3 §1) Quien no es el administrador ve las fechas, pero el botón no abre el calendario.
  const { esAdmin } = usePermisosDelViaje()
  return (
    <div className="absolute left-1/2 top-3.5 z-10 -translate-x-1/2">
      <button
        type="button"
        data-fechas-del-viaje={esAdmin ? 'editable' : 'fijas'}
        disabled={!esAdmin}
        onClick={() => useDatesCalendarStore.getState().request()}
        className="flex flex-col items-center gap-[3px] rounded-[22px] border-[1.5px] border-accent bg-bg-card px-[22px] pb-[10px] pt-[9px] text-center shadow-[0_10px_28px_-10px_rgba(28,34,48,.35)] transition-colors hover:bg-bg-hover max-[479px]:h-[38px] max-[479px]:flex-row max-[479px]:gap-1.5 max-[479px]:rounded-full max-[479px]:px-3.5 max-[479px]:py-0"
      >
        {/* En el móvil, una línea: "Roma · 9 – 12 jun", sin tapar el mapa (decisión del usuario, 2026-09-29). */}
        <p className="whitespace-nowrap font-display text-[26px] leading-none text-text max-[479px]:text-[20px]">{destination}</p>
        {dateRange ? (
          <>
            <p className="whitespace-nowrap text-[12px] font-medium text-accent max-[479px]:hidden">{formatHeaderDateRangeEs(dateRange.start, dateRange.end)}</p>
            <p className="hidden whitespace-nowrap text-[12px] font-medium text-accent max-[479px]:block">· {formatHeaderDateRangeShortEs(dateRange.start, dateRange.end)}</p>
          </>
        ) : (
          <p className="text-[12px] font-medium text-accent">Añadir fechas</p>
        )}
      </button>

    </div>
  )
}
