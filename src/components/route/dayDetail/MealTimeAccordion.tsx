import type { Coordinates } from '../../../lib/types'
import { useZonaTuristica } from '../../../lib/useZonaTuristica'

const GOLD_BG = '#FDF3E2'
const GOLD_BORDER = '#F3DDA9'

interface MealTimeAccordionProps {
  /** Nombre del destino — usado para resolver el nombre de zona turístico (useZonaTuristica). */
  destino: string
  /** Ciudad del día — fallback de zona mientras nada ha resuelto todavía o si las coordenadas son de plantilla/mock. */
  city: string
  /** Coordenadas de la parada tras la que cae esta franja — ancla tanto para geocodificar el barrio como para "Rápido y cerca" dentro de MealDetailSheet. */
  coordinates: Coordinates
  /** Zona curada a mano (ver MealSlot.curatedZone) — cuando existe, se usa tal cual en vez de geocodificar en vivo. */
  curatedZone?: string | null
  franja: 'comida' | 'cena'
  /** Abre MealDetailSheet (pantalla completa) — gestionado por DayDetailPanel.tsx, igual que StopDetailSheet/ArrivalDetailSheet, para poder desmontar el mapa de este panel mientras esa pantalla está abierta encima (ver mapHiddenBySheet). */
  onOpen: () => void
}

/**
 * Fila dorada (fondo/borde diferenciado del resto de tarjetas de la ruta) que aparece en el
 * timeline de un día justo cuando cruza la franja de comida o cena — ver `findMealInsertionIndex`
 * en DayDetailPanel.tsx. Ya NO se expande inline: tocarla abre MealDetailSheet a pantalla completa
 * (mismo patrón que tocar una parada abre StopDetailSheet) — ver feedback de calidad, "Nueva
 * ventana para bloques de comida y cena".
 *
 * El nombre de zona del título se resuelve aquí (useZonaTuristica, barato y cacheado) para que se
 * vea correcto en la fila cerrada sin tener que abrir la pantalla — MealDetailSheet vuelve a
 * resolverlo por su cuenta al abrir (mismo hook, prácticamente gratis gracias al caché).
 */
export function MealTimeAccordion({ destino, city, coordinates, curatedZone, franja, onOpen }: MealTimeAccordionProps) {
  const { zonaMostrada } = useZonaTuristica(destino, city, coordinates, curatedZone)
  const franjaLabel = franja === 'cena' ? 'Hora de cenar' : 'Hora de comer'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border p-3 text-left"
      style={{ backgroundColor: GOLD_BG, borderColor: GOLD_BORDER }}
    >
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-body" style={{ backgroundColor: GOLD_BORDER }}>
        🍽️
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-text">{zonaMostrada ? `${franjaLabel} en ${zonaMostrada}` : franjaLabel}</p>
        <p className="text-caption text-text-soft">Recomendaciones de restaurantes cerca</p>
      </div>
    </button>
  )
}
