import { useEffect, useMemo, useState } from 'react'

/**
 * Las mejores horas para reservar un sitio grande (Coliseo, Museos Vaticanos, Galería Borghese) el día que está en la ruta (Tanda 6j, 9b.3). Salen de las
 * listas escritas de ese día (TABLA_RESERVAS) a través del servidor, nunca de una hora sin lista.
 */
export interface BestHoursItem {
  curatedId: string
  place: string
}

const cache = new Map<string, string[] | null>()
const keyOf = (destination: string, item: BestHoursItem) => `${destination}|${item.curatedId}|${item.place}`

/** «Mejor hora este día: 9:00 o 16:00» (varias: «9:00, 11:00 o 15:00»). */
export function bestHoursLine(hours: string[] | null | undefined): string | null {
  if (!hours || hours.length === 0) return null
  const text = hours.length > 1 ? `${hours.slice(0, -1).join(', ')} o ${hours.at(-1)}` : hours[0]
  return `Mejor hora este día: ${text}`
}

/** Las mejores horas de cada sitio pedido, por «{día escrito}|{sitio}». Mientras llegan, vacío. */
export function useBestHours(destination: string | undefined, items: BestHoursItem[]): Record<string, string[]> {
  const wanted = useMemo(() => (destination ? items : []), [destination, items])
  const signature = wanted.map((item) => `${item.curatedId}|${item.place}`).sort().join(';')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!destination) return
    const missing = wanted.filter((item) => !cache.has(keyOf(destination, item)))
    if (missing.length === 0) return
    let cancelled = false
    fetch('/api/reservation-best-hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, items: missing.map((item) => ({ curated_day_id: item.curatedId, place: item.place })) }),
    })
      .then((response) => (response.ok ? (response.json() as Promise<{ hours: Record<string, string[]> }>) : null))
      .then((body) => {
        for (const item of missing) cache.set(keyOf(destination, item), body?.hours?.[`${item.curatedId}|${item.place}`] ?? null)
        if (!cancelled) setVersion((value) => value + 1)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, signature])
  return useMemo(() => {
    const out: Record<string, string[]> = {}
    if (!destination) return out
    for (const item of wanted) {
      const hours = cache.get(keyOf(destination, item))
      if (hours) out[`${item.curatedId}|${item.place}`] = hours
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, signature, version])
}
