import type { DestinationArchetype, Place, TransportOption } from '../../lib/types'
import { buildBusOption, buildFerryOption, buildFlightOption, buildOwnVehicleOption, buildTrainOption, type TransportFeasibility } from '../../lib/transportFeasibility'

export type ModeId = 'flight' | 'train' | 'bus' | 'ferry' | 'own_vehicle'

export interface TransportRow {
  id: ModeId
  label: string
  /** "Ir en {en}" del botón de continuar. */
  en: string
  apt: boolean
  recommended: boolean
  /** "≈ 2 h 30", o '' si no hay tiempo. */
  time: string
  /** Horas aproximadas (para la barra), o null. */
  hours: number | null
  option: TransportOption | null
}

const ROWS: { id: ModeId; key: 'flight' | 'train' | 'bus' | 'ferry' | 'roadtrip'; label: string; en: string }[] = [
  { id: 'flight', key: 'flight', label: 'Avión', en: 'avión' },
  { id: 'train', key: 'train', label: 'Tren', en: 'tren' },
  { id: 'bus', key: 'bus', label: 'Autobús', en: 'autobús' },
  { id: 'ferry', key: 'ferry', label: 'Ferry', en: 'ferry' },
  { id: 'own_vehicle', key: 'roadtrip', label: 'En tu coche', en: 'tu coche' },
]

/**
 * Paso B de FLUJO_TRANSPORTE.md: qué vías tienen sentido para cada tipo de destino. Las que no, salen en
 * gris aunque la geografía las permita.
 */
export function allowedByArchetype(archetype: DestinationArchetype | null, id: ModeId): boolean {
  switch (archetype) {
    case null:
    case 'urbano_clasico':
      return true
    case 'roadtrip_exclusivo':
      return id !== 'train' && id !== 'bus'
    case 'base_y_excursiones':
      return id !== 'bus'
    case 'multidestino_tren_o_vuelo':
    case 'multidestino_mixto_o_circuito':
      return id !== 'ferry' && id !== 'own_vehicle'
    default:
      // Tipos de destino sin flujo propio todavía: avión, como hasta ahora.
      return id === 'flight'
  }
}

/** Horas de una etiqueta de duración ("2 h 30", "4-5 h", "9-10 horas de conducción", "2h puerta a puerta"). */
export function parseHours(label: string): number | null {
  if (!label) return null
  const text = label.toLowerCase().replace(',', '.')
  const range = /(\d+(?:\.\d+)?)\s*(?:-|–|a)\s*(\d+(?:\.\d+)?)\s*(?:h|hora)/.exec(text)
  if (range) return (Number(range[1]) + Number(range[2])) / 2
  const hm = /(\d+(?:\.\d+)?)\s*h(?:oras?)?\s*(?:y\s*)?(\d{1,2})?\s*(?:min|m)?/.exec(text)
  if (hm) return Number(hm[1]) + (hm[2] ? Number(hm[2]) / 60 : 0)
  const min = /(\d+)\s*min/.exec(text)
  if (min) return Number(min[1]) / 60
  return null
}

/** "≈ 2 h 30" a partir de la etiqueta; los rangos se dejan como rango ("≈ 4-5 h"). */
export function formatTime(label: string): string {
  if (!label) return ''
  const text = label.toLowerCase().replace(',', '.')
  const range = /(\d+(?:\.\d+)?)\s*(?:-|–|a)\s*(\d+(?:\.\d+)?)\s*(?:h|hora)/.exec(text)
  if (range) return `≈ ${range[1]}-${range[2]} h`
  const hours = parseHours(label)
  if (hours == null) return ''
  const minutes = Math.max(5, Math.round((hours * 60) / 5) * 5)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `≈ ${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}` : `≈ ${m} min`
}

/**
 * Las cinco filas del paso de transporte, siempre las cinco. Apta = el Paso A la marca viable (o nuestra
 * tabla curada) y el tipo de destino la permite. Si ninguna es apta, el avión hace de red de seguridad.
 */
export function buildTransportRows(feasibility: TransportFeasibility | null, archetype: DestinationArchetype | null, origin: Place | null): TransportRow[] {
  const rows: TransportRow[] = ROWS.map(({ id, key, label, en }) => {
    const leg = feasibility?.[key] as TransportFeasibility[typeof key] | undefined
    const apt = Boolean(leg?.feasible) && allowedByArchetype(archetype, id)
    const option = !feasibility || !apt ? null : buildOption(id, feasibility, origin)
    return {
      id,
      label,
      en,
      apt,
      recommended: apt && Boolean(leg?.recommended),
      time: apt ? formatTime(leg?.duration_label ?? '') : '',
      hours: apt ? parseHours(leg?.duration_label ?? '') : null,
      option,
    }
  })
  if (feasibility && !rows.some((row) => row.apt)) {
    const flight = rows[0]
    flight.apt = true
    flight.option = buildFlightOption({ ...feasibility.flight, feasible: true, price_label: '' })
    flight.time = formatTime(feasibility.flight.duration_label)
    flight.hours = parseHours(feasibility.flight.duration_label)
  }
  return rows
}

function buildOption(id: ModeId, f: TransportFeasibility, origin: Place | null): TransportOption {
  // Sin precios, nunca (decisión del 2026-09-27).
  const noPrice = <T extends { price_label: string }>(leg: T): T => ({ ...leg, price_label: '' })
  switch (id) {
    case 'flight':
      return buildFlightOption(noPrice(f.flight))
    case 'train':
      return buildTrainOption(noPrice(f.train))
    case 'bus':
      return buildBusOption(noPrice(f.bus))
    case 'ferry':
      return buildFerryOption(noPrice(f.ferry))
    case 'own_vehicle':
      return buildOwnVehicleOption(noPrice(f.roadtrip), origin)
  }
}
