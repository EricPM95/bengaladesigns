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
}

export function FreeTimeBlock({ hours, city, onOpenMap }: FreeTimeBlockProps) {
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
