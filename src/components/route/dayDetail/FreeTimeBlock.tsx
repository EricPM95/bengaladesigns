/**
 * Tiempo libre antes de cenar: un bloque SIN lugar — no es parada ni restaurante.
 *
 * Tras un día completo desde las 08:00, hora y media o dos antes de cenar es descanso, no un hueco
 * que haya que rellenar (decisión del 2026-09-23). Se dice así, y se deja la puerta abierta: el
 * enlace abre "Añadir parada" centrado donde está el viajero, por si le quedan ganas.
 */

interface FreeTimeBlockProps {
  /** Horas que lleva el día descubriendo la ciudad (de la primera visita al final de la última). */
  hours: number
  city: string
  onOpenMap: () => void
  /** Tarde libre (motor v3): el destino ya no daba para más ese día. Sugerencias cerca, que el viajero
      añade si quiere (pueden ser de pago). */
  suggestions?: { name: string; walkMinutes: number; requiresTicket: boolean }[]
  onPickSuggestion?: (name: string) => void
  /** Hueco a mitad de día (no antes de cenar): minutos libres y la parada que viene después. */
  midDay?: { minutes: number; before: string }
  /** 90 min o menos antes de cenar en un barrio con ambiente: "Aperitivo y paseo por {barrio}". */
  aperitivo?: { title: string; minutes: number }
}

export function FreeTimeBlock({ hours, city, onOpenMap, suggestions, onPickSuggestion, midDay, aperitivo }: FreeTimeBlockProps) {
  if (aperitivo) {
    return (
      <div className="rounded-xl border border-dashed border-border px-3 py-2.5 text-small text-text-soft">
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
                className="rounded-full border border-border px-2.5 py-1 text-caption font-medium text-text transition-colors hover:bg-bg-hover"
              >
                {item.name} · {item.walkMinutes} min{item.requiresTicket ? ' · entrada' : ''}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
  // Hueco a mitad de día sin nada abierto y de camino que proponer: se dice igual, sin sugerencias.
  if (midDay && !(suggestions && suggestions.length > 0)) {
    return (
      <div className="rounded-xl border border-dashed border-border px-3 py-2.5 text-small text-text-soft">
        <p className="font-semibold text-text">Tiempo libre</p>
        <p className="mt-0.5">
          Tienes {midDay.minutes} min libres antes de la siguiente parada ({midDay.before}). Tómate algo o descansa un rato.
        </p>
      </div>
    )
  }
  if (suggestions && suggestions.length > 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-3 py-2.5 text-small text-text-soft">
        <p className="font-semibold text-text">{midDay ? 'Tiempo libre' : 'Tarde libre'}</p>
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
              className="rounded-full border border-border px-2.5 py-1 text-caption font-medium text-text transition-colors hover:bg-bg-hover"
            >
              {item.name} · {item.walkMinutes} min{item.requiresTicket ? ' · entrada' : ''}
            </button>
          ))}
        </div>
        <button type="button" onClick={onOpenMap} className="mt-2 font-semibold text-accent-hover underline transition-opacity hover:opacity-80">
          Ver todo en el mapa
        </button>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-dashed border-border px-3 py-2.5 text-small text-text-soft">
      Llevas {hours} {hours === 1 ? 'hora' : 'horas'} descubriendo {city}. Tienes tiempo libre hasta la cena: tómate un helado, un
      aperitivo o descansa en el hotel. Y si te quedan ganas de seguir, aquí tienes todo lo que hay cerca →{' '}
      <button type="button" onClick={onOpenMap} className="font-semibold text-accent-hover underline transition-opacity hover:opacity-80">
        Ver en el mapa
      </button>
    </div>
  )
}
