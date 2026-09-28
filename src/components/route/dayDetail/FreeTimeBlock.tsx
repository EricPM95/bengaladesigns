/**
 * Tiempo libre antes de cenar: un bloque SIN lugar — no es parada ni restaurante.
 *
 * Tras un día completo desde las 08:00, hora y media o dos antes de cenar es descanso, no un hueco
 * que haya que rellenar (decisión del 2026-09-23). Se dice así, y se deja la puerta abierta: el
 * enlace abre "Añadir parada" centrado donde está el viajero, por si le quedan ganas.
 */
import type { ReactNode } from 'react'

/** Diseño "Trazo Itinerario": el tiempo libre no lleva tarjeta ni número — una fila discreta con la hora. */
function Row({ time, children }: { time?: string | null; children: ReactNode }) {
  return (
    <div className="relative flex items-start gap-2 py-2 text-[12.5px] leading-[1.4] text-text/65">
      <span className="absolute -left-[19px] top-[13px] h-[9px] w-[9px] rounded-full border-[1.5px] border-text/30 bg-bg-card" aria-hidden="true" />
      {time && <span className="shrink-0 pt-px font-mono text-[11px] font-semibold text-text/50">{time}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

interface FreeTimeBlockProps {
  /** Hora a la que empieza el hueco ("17:15") — la fila la enseña delante, como el resto del día. */
  time?: string | null
  /** Horas que lleva el día descubriendo la ciudad (de la primera visita al final de la última). */
  hours: number
  city: string
  onOpenMap: () => void
  /** Tarde libre (motor v3): el destino ya no daba para más ese día. Sugerencias cerca, que el viajero
      añade si quiere (pueden ser de pago). */
  suggestions?: { name: string; walkMinutes: number; requiresTicket: boolean }[]
  onPickSuggestion?: (name: string) => void
  /** Hueco a mitad de día (no antes de cenar): minutos libres, la parada que viene después y, si no hay
      sugerencias de lugares, una idea corta de la zona. */
  midDay?: { minutes: number; before: string; hint?: string | null; title?: string | null }
  /** 90 min o menos antes de cenar en un barrio con ambiente: "Aperitivo y paseo por {barrio}". */
  aperitivo?: { title: string; minutes: number }
}

export function FreeTimeBlock({ time, hours, city, onOpenMap, suggestions, onPickSuggestion, midDay, aperitivo }: FreeTimeBlockProps) {
  if (aperitivo) {
    return (
      <Row time={time}>
        <p className="font-semibold text-text">{aperitivo.title}</p>
        <p className="mt-0.5">
          Tienes {aperitivo.minutes} min antes de cenar: tómate algo y date una vuelta.
          {suggestions && suggestions.length > 0 ? ' De camino, también te puede interesar:' : ''}
        </p>
        {suggestions && suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => onPickSuggestion?.(item.name)}
                className="rounded-full border border-text/[.12] bg-bg-card px-2.5 py-1 text-[11.5px] font-medium text-text transition-colors hover:bg-bg-hover"
              >
                {item.name} · {item.walkMinutes} min{item.requiresTicket ? ' · entrada' : ''}
              </button>
            ))}
          </div>
        )}
      </Row>
    )
  }
  // Hueco a mitad de día sin nada abierto y de camino que proponer: se dice igual, sin sugerencias.
  if (midDay && !(suggestions && suggestions.length > 0)) {
    return (
      <Row time={time}>
        <p className="font-semibold text-text">{midDay.title ?? 'Tiempo libre'}</p>
        <p className="mt-0.5">
          Tienes {midDay.minutes} min libres antes de la siguiente parada ({midDay.before}).{' '}
          {midDay.title && midDay.hint ? midDay.hint : midDay.hint ? `Una idea: ${midDay.hint}` : 'Tómate algo o descansa un rato.'}
        </p>
      </Row>
    )
  }
  if (suggestions && suggestions.length > 0) {
    return (
      <Row time={time}>
        <p className="font-semibold text-text">{midDay ? (midDay.title ?? 'Tiempo libre') : 'Tarde libre'}</p>
        <p className="mt-0.5">
          {midDay ? (
            <>
              Tienes {midDay.minutes} min libres antes de la siguiente parada ({midDay.before}). Tómate algo o, si te apetece, también te puede
              interesar, cerca de aquí:
            </>
          ) : (
            <>
              Llevas {hours} {hours === 1 ? 'hora' : 'horas'} descubriendo {city}. El resto de la tarde es tuya. Si te quedan ganas, también te
              puede interesar, cerca de aquí:
            </>
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => onPickSuggestion?.(item.name)}
              className="rounded-full border border-text/[.12] bg-bg-card px-2.5 py-1 text-[11.5px] font-medium text-text transition-colors hover:bg-bg-hover"
            >
              {item.name} · {item.walkMinutes} min{item.requiresTicket ? ' · entrada' : ''}
            </button>
          ))}
        </div>
        <button type="button" onClick={onOpenMap} className="mt-2 font-semibold text-accent-hover underline transition-opacity hover:opacity-80">
          Ver todo en el mapa
        </button>
      </Row>
    )
  }
  return (
    <Row time={time}>
      Llevas {hours} {hours === 1 ? 'hora' : 'horas'} descubriendo {city}. Tienes tiempo libre hasta la cena: tómate un helado, un
      aperitivo o descansa en el hotel. Y si te quedan ganas de seguir, aquí tienes todo lo que hay cerca →{' '}
      <button type="button" onClick={onOpenMap} className="font-semibold text-accent-hover underline transition-opacity hover:opacity-80">
        Ver en el mapa
      </button>
    </Row>
  )
}
