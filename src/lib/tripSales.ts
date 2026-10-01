/**
 * Las ventas del afiliado que llegan con el código de campaña de este viaje (PARA_CODE_RESERVAS, 5): se piden al servidor al abrir el viaje y se
 * unen a una entrada o excursión de la ruta por el nombre del producto. Lo que no se reconoce no se enseña (no se inventa una fila). Nunca se leen
 * correos: las ventas llegan de la API o del informe de ventas del afiliado (`/api/sales/ingest`).
 */
import type { Route } from './types'
import type { EssentialEntry, SaleMatch } from './bookings'
import { stopHasEntrance } from './bookings'
import type { DestinationExcursions } from './destinationExcursions'

export interface RawSale {
  id: string
  product: string
  date: string
  time: string | null
  people: number | null
  locator: string | null
  status: 'confirmed' | 'cancelled'
}

export async function fetchTripSales(campaign: string): Promise<RawSale[]> {
  try {
    const response = await fetch('/api/trip-sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaign }) })
    if (!response.ok) return []
    const data = (await response.json()) as { sales?: RawSale[] }
    return data.sales ?? []
  } catch {
    return []
  }
}

const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'a', 'en', 'con', 'desde', 'por', 'excursion', 'entrada', 'entradas', 'tour', 'visita', 'guiada', 'ticket', 'billete'])

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
}

/** ¿Hablan de lo mismo? Casi todas las palabras del más corto están en el otro (Pompeya y Sorrento ≈ Excursión a Pompeya y Sorrento desde Roma). */
function sameThing(a: string, b: string): boolean {
  const ta = tokens(a)
  const tb = new Set(tokens(b))
  if (ta.length === 0 || tb.size === 0) return false
  const shared = ta.filter((token) => tb.has(token)).length
  return shared >= Math.min(ta.length, tb.size) * 0.75 && shared >= 1
}

/** Une una venta con la excursión o la entrada de la ruta a la que corresponde (null si no la reconoce). */
export function matchSale(sale: RawSale, route: Route, info: DestinationExcursions): Omit<SaleMatch, 'status'> | null {
  const base = { id: sale.id, dateIso: sale.date, time: sale.time ?? '', people: sale.people, locator: sale.locator }
  const excursion = info.excursions.find((option) => sameThing(sale.product, option.title))
  if (excursion) return { ...base, kind: 'excursion', refId: excursion.id, name: excursion.title, placeNames: [], excursionId: excursion.id }
  const essential: EssentialEntry | undefined = info.entradas.find((entry) => sameThing(sale.product, entry.name) || entry.places.some((place) => sameThing(sale.product, place)))
  if (essential) return { ...base, kind: 'entrada', refId: essential.name, name: essential.name, placeNames: essential.places }
  const stop = route.days.flatMap((day) => day.stops).find((candidate) => stopHasEntrance(candidate) && sameThing(sale.product, candidate.name))
  if (stop) return { ...base, kind: 'entrada', refId: stop.name, name: stop.name, placeNames: [stop.name] }
  return null
}
