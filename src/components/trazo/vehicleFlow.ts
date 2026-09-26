import type { DestinationArchetype, TravelMode, VehicleOwnership, VehicleType } from '../../lib/types'
import { getTravelModeDescription } from '../../lib/travelModeCopy'

/**
 * Las preguntas que siguen a "cómo llegas" en cada tipo de destino, una a una, con las mismas reglas que
 * los flujos de antes (UrbanoTransportFlow, RoadtripTransportFlow, BaseYExcursionesTransportFlow,
 * MultidestinoTrenOVueloTransportFlow). Devuelve la pregunta pendiente, las respuestas ya dadas (tarjetas
 * con "Cambiar") y, si la única respuesta posible es obvia (destino no apto para camper), el cambio que se
 * aplica solo.
 */
export interface VehicleState {
  vehicle_type: VehicleType | null
  vehicle_ownership: VehicleOwnership | null
  vehicle_resolved: boolean
  travel_mode: TravelMode | null
  travel_pass_confirmed: boolean | null
}

export type VehiclePatch = Partial<VehicleState>

export interface FollowUpQuestion {
  title: string
  options: { label: string; description?: string; patch: VehiclePatch }[]
}

export interface FollowUpCard {
  label: string
  value: string
  reset: VehiclePatch
}

interface FollowUpInput extends VehicleState {
  archetype: DestinationArchetype | null
  optionId: string | null
  destinationName: string
  requiereCoche: boolean
  paseDominante: string | null
  camperOk: boolean
}

const TYPE_LABEL: Record<VehicleType, string> = { car: 'Coche', camper: 'Camper' }

export function followUp(input: FollowUpInput): { question: FollowUpQuestion | null; cards: FollowUpCard[]; auto: VehiclePatch | null } {
  const { archetype, optionId, destinationName: d, camperOk } = input
  const cards: FollowUpCard[] = []
  if (!optionId) return { question: null, cards, auto: null }

  const typeQuestion = (title: string, extra: VehiclePatch, resolves: boolean): { question: FollowUpQuestion | null; auto: VehiclePatch | null } => {
    const done = (type: VehicleType): VehiclePatch => ({ ...extra, vehicle_type: type, ...(resolves ? { vehicle_resolved: true } : {}) })
    // Destino no apto para camper: coche directamente, sin preguntar.
    if (!camperOk) return { question: null, auto: done('car') }
    return {
      question: { title, options: [{ label: 'Coche', patch: done('car') }, { label: 'Camper', patch: done('camper') }] },
      auto: null,
    }
  }

  if (archetype === 'urbano_clasico') {
    if (optionId === 'own_vehicle') {
      if (!input.vehicle_resolved) return { cards, ...typeQuestion('¿Qué tipo de vehículo tienes?', {}, true) }
      if (input.vehicle_type) cards.push({ label: 'Para moverte', value: TYPE_LABEL[input.vehicle_type], reset: { vehicle_type: null, vehicle_resolved: false } })
      return { question: null, cards, auto: null }
    }
    if (optionId === 'ferry') {
      if (!input.vehicle_resolved && input.vehicle_ownership === null) {
        return {
          cards,
          auto: null,
          question: {
            title: '¿Te llevas tu vehículo en el ferry?',
            options: [
              { label: 'Sí, voy con mi coche o camper', patch: { vehicle_ownership: 'own' } },
              { label: 'No, voy sin vehículo', patch: { vehicle_ownership: null, vehicle_type: null, vehicle_resolved: true } },
            ],
          },
        }
      }
      if (!input.vehicle_resolved) return { cards, ...typeQuestion('¿Con qué vehículo vas?', {}, true) }
      cards.push({
        label: 'Para moverte',
        value: input.vehicle_type ? TYPE_LABEL[input.vehicle_type] : 'Sin vehículo',
        reset: { vehicle_type: null, vehicle_ownership: null, vehicle_resolved: false },
      })
      return { question: null, cards, auto: null }
    }
    if (input.requiereCoche) {
      if (!input.vehicle_resolved) {
        return {
          cards,
          auto: null,
          question: {
            title: `El transporte público en ${d} es limitado — ¿te gustaría alquilar un coche para moverte con comodidad?`,
            options: [
              { label: 'Sí', patch: { vehicle_ownership: 'rental', vehicle_type: 'car', vehicle_resolved: true } },
              { label: 'No', patch: { vehicle_ownership: null, vehicle_type: null, vehicle_resolved: true } },
            ],
          },
        }
      }
      cards.push({ label: 'Para moverte', value: input.vehicle_type ? 'Coche' : 'Sin vehículo', reset: { vehicle_type: null, vehicle_ownership: null, vehicle_resolved: false } })
    }
    return { question: null, cards, auto: null }
  }

  if (archetype === 'roadtrip_exclusivo') {
    if (!input.vehicle_type) {
      if (optionId === 'own_vehicle') return { cards, ...typeQuestion('¿Qué tipo de vehículo tienes?', { vehicle_ownership: 'own' }, false) }
      if (optionId === 'flight') {
        if (!camperOk) return { cards, question: null, auto: { vehicle_ownership: 'rental', vehicle_type: 'car' } }
        return {
          cards,
          auto: null,
          question: {
            title: `¿Cómo te gustaría recorrer ${d}?`,
            options: [
              { label: 'En coche', description: 'Un hotel distinto cada noche, a tu ritmo', patch: { vehicle_ownership: 'rental', vehicle_type: 'car' } },
              { label: 'En camper o autocaravana', description: 'Duermes donde te lleve el camino', patch: { vehicle_ownership: 'rental', vehicle_type: 'camper' } },
            ],
          },
        }
      }
      if (optionId === 'ferry') {
        if (!input.vehicle_ownership) {
          return {
            cards,
            auto: null,
            question: {
              title: '¿Te llevas tu vehículo en el ferry o prefieres alquilar uno allí?',
              options: [
                { label: 'Me llevo el mío', patch: { vehicle_ownership: 'own' } },
                { label: 'Alquilo uno en destino', patch: { vehicle_ownership: 'rental' } },
              ],
            },
          }
        }
        cards.push({ label: 'Vehículo', value: input.vehicle_ownership === 'own' ? 'El mío' : 'De alquiler', reset: { vehicle_ownership: null } })
        return { cards, ...typeQuestion(input.vehicle_ownership === 'own' ? '¿Con qué vehículo vas a vivir esta experiencia?' : `¿Cómo te gustaría recorrer ${d}?`, {}, false) }
      }
      return { question: null, cards, auto: null }
    }
    cards.push({ label: 'Para moverte', value: TYPE_LABEL[input.vehicle_type], reset: { vehicle_type: null } })
    return { question: null, cards, auto: null }
  }

  if (archetype === 'base_y_excursiones') {
    const flightOrTrain = optionId === 'flight' || optionId === 'train'
    if (!input.vehicle_resolved) {
      if (flightOrTrain && input.vehicle_ownership === null) {
        return {
          cards,
          auto: null,
          question: {
            title: `¿Te gustaría alquilar un vehículo en ${d}?`,
            options: [
              { label: 'Sí, quiero alquilar', patch: { vehicle_ownership: 'rental' } },
              { label: 'No, prefiero moverme sin vehículo', patch: { vehicle_ownership: null, vehicle_resolved: true } },
            ],
          },
        }
      }
      if (optionId === 'ferry' && input.vehicle_ownership === null) {
        return {
          cards,
          auto: null,
          question: {
            title: '¿Vienes con tu propio vehículo, prefieres alquilar uno en destino, o vas sin vehículo?',
            options: [
              { label: 'Con mi propio vehículo', patch: { vehicle_ownership: 'own' } },
              { label: 'Alquilar uno en destino', patch: { vehicle_ownership: 'rental' } },
              { label: 'Sin vehículo', patch: { vehicle_ownership: null, vehicle_resolved: true } },
            ],
          },
        }
      }
      const title =
        optionId === 'own_vehicle' ? '¿Qué tipo de vehículo tienes?' : optionId === 'ferry' && input.vehicle_ownership === 'own' ? '¿Con qué vehículo vas a vivir esta experiencia?' : `¿Cómo te gustaría recorrer ${d}?`
      return { cards, ...typeQuestion(title, optionId === 'own_vehicle' ? { vehicle_ownership: 'own' } : {}, true) }
    }
    cards.push({
      label: 'Para moverte',
      value: input.vehicle_type ? TYPE_LABEL[input.vehicle_type] : 'Sin vehículo',
      reset: { vehicle_type: null, vehicle_ownership: null, vehicle_resolved: false },
    })
    if (!input.travel_mode) {
      return {
        cards,
        auto: null,
        question: {
          title: `¿Cómo prefieres explorar ${d}?`,
          options: [
            { label: 'Base fija', description: getTravelModeDescription('base_fija', input.vehicle_type), patch: { travel_mode: 'base_fija' } },
            { label: 'Ruta itinerante', description: getTravelModeDescription('itinerante', input.vehicle_type), patch: { travel_mode: 'itinerante' } },
          ],
        },
      }
    }
    cards.push({ label: 'Cómo exploras', value: input.travel_mode === 'base_fija' ? 'Base fija' : 'Ruta itinerante', reset: { travel_mode: null } })
    return { question: null, cards, auto: null }
  }

  if (archetype === 'multidestino_tren_o_vuelo' && input.paseDominante) {
    if (input.travel_pass_confirmed === null) {
      return {
        cards,
        auto: null,
        question: {
          title: `¿Vas a viajar con ${input.paseDominante}?`,
          options: [
            { label: `Sí, viajaré con el ${input.paseDominante}`, patch: { travel_pass_confirmed: true } },
            { label: 'No, prefiero billete a billete', patch: { travel_pass_confirmed: false } },
          ],
        },
      }
    }
    cards.push({ label: 'Entre ciudades', value: input.travel_pass_confirmed ? input.paseDominante : 'Billete a billete', reset: { travel_pass_confirmed: null } })
  }
  return { question: null, cards, auto: null }
}
