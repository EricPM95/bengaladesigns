import type { DidntMakeCutItem, Stop } from './types'

export function buildStopFromDidntMakeCut(item: DidntMakeCutItem, time: string): Stop {
  return {
    id: `stop-${item.id}-${Date.now()}`,
    time,
    name: item.name,
    description: item.suggestion,
    durationMinutes: 45,
    coordinates: item.coordinates ?? { lat: 0, lng: 0 },
    photoUrl: `https://picsum.photos/seed/${item.id}/600/400`,
  }
}

export function buildStopFromQuery(query: string, time: string): Stop {
  return {
    id: `stop-custom-${Date.now()}`,
    time,
    name: query,
    description: 'Añadido por ti',
    durationMinutes: 45,
    coordinates: { lat: 0, lng: 0 },
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}-${Date.now()}/600/400`,
  }
}
