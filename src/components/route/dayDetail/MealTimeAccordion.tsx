import type { Coordinates } from '../../../lib/types'
import { useZonaTuristica } from '../../../lib/useZonaTuristica'
import { KIND_ICON } from '../../../lib/stopKind'
import { MealCard } from './TrazoCards'

interface MealTimeAccordionProps {
  /** Nombre del destino — usado para resolver el nombre de zona turístico (useZonaTuristica). */
  destino: string
  /** Ciudad del día — fallback de zona mientras nada ha resuelto todavía o si las coordenadas son de plantilla/mock. */
  city: string
  /** Coordenadas de la parada tras la que cae esta franja — ancla tanto para geocodificar el barrio como para "Rápido y cerca" dentro de MealDetailSheet. */
  coordinates: Coordinates
  /** Barrio curado a mano (ver MealSlot.curatedZone) — cuando existe, se usa tal cual en vez de geocodificar en vivo (alimenta la búsqueda de restaurantes, ver useZonaTuristica). */
  curatedZone?: string | null
  /** Texto legible curado a mano para el TÍTULO (ver MealSlot.curatedZoneDisplay, Regla E — "en el Centro Histórico") — solo para mostrar, nunca para buscar. */
  curatedZoneDisplay?: string | null
  franja: 'comida' | 'cena'
  /** Hora que el viajero ha reservado en el restaurante («21:00»). La franja de la comida no se enseña nunca. */
  reservedTime?: string | null
  /** Texto propio en lugar de "Recomendaciones de restaurantes cerca" (día con excursión de medio día). */
  subtitle?: string | null
  /** El restaurante que ha elegido el viajero para esta comida o cena: sustituye a las recomendaciones. */
  chosenName?: string | null
  /** Los minutos andando con la parada anterior y la siguiente, medidos desde el restaurante ("8 min desde el Panteón"). */
  walkNote?: string | null
  /** "Cambiar": abre el mapa de restaurantes de la zona. */
  onChange?: () => void
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
export function MealTimeAccordion({ destino, city, coordinates, curatedZone, curatedZoneDisplay, franja, reservedTime, subtitle, chosenName = null, walkNote = null, onChange, onOpen }: MealTimeAccordionProps) {
  const { zonaMostrada } = useZonaTuristica(destino, city, coordinates, curatedZone)
  const franjaLabel = franja === 'cena' ? 'Hora de cenar' : 'Hora de comer'
  // Regla E: con zona curada, el texto ya viene formateado y listo ("en el Centro Histórico") — solo
  // en el fallback geocodificado en vivo hace falta anteponerle el conector "en" aquí.
  const zoneText = curatedZoneDisplay ?? (zonaMostrada ? `en ${zonaMostrada}` : null)

  // Diseño "Trazo Itinerario": la misma tarjeta alargada que las paradas, en terracota, sin número
  // (la comida no es un pin del mapa) y sin foto (no hay restaurante elegido todavía).
  // Con restaurante (el recomendado o el que ha elegido el viajero): "Comida · Giggetto al Portico d'Ottavia" y "Cambiar".
  // "Comidas A · Mesa" (PROMPT_UI, Parte 2): tarjeta terracota suave, el restaurante en grande y "Cambiar".
  const label = franja === 'cena' ? 'Cena' : 'Comida'
  if (chosenName) {
    return (
      <MealCard
        label={label}
        reservedTime={reservedTime ?? null}
        name={chosenName}
        sub={walkNote ?? (zoneText ? zoneText.replace(/^en /, 'En ') : null)}
        iconPath={franja === 'cena' ? KIND_ICON.moon : KIND_ICON.fork}
        onOpen={onOpen}
        onChange={onChange}
      />
    )
  }
  return (
    <MealCard
      label={label}
      reservedTime={reservedTime ?? null}
      name={zoneText ? `${franjaLabel} ${zoneText}` : franjaLabel}
      sub={subtitle ?? 'Recomendaciones de restaurantes cerca'}
      iconPath={franja === 'cena' ? KIND_ICON.moon : KIND_ICON.fork}
      onOpen={onOpen}
    />
  )
}
