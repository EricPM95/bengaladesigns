/**
 * Datos mock para "Alojamientos en {destino}" (resultados vía agregador Stay22, que enlaza a
 * Booking/Expedia) y "Actividades en {destino}" (Civitatis/GetYourGuide) — pestaña RUTA, vista de
 * detalle de un destino. No hay ninguna integración real todavía (mismo estado que el resto de
 * afiliación de la app, ver FLUJO_TRANSPORTE.md). Determinista por ciudad (mismo seed ⇒ mismos
 * resultados) para que no cambien en cada render.
 */
export interface MockHotelResult {
  id: string
  name: string
  stars: number
  pricePerNight: number
  rating: number
  provider: 'Booking' | 'Expedia'
  photoUrl: string
}

export interface MockActivityResult {
  id: string
  name: string
  price: number
  durationLabel: string
  rating: number
  provider: 'Civitatis' | 'GetYourGuide'
  photoUrl: string
}

const HOTEL_NAME_TEMPLATES = ['Hotel Centro {city}', '{city} Boutique Hotel', 'Plaza {city}', 'Grand {city} Hotel']
const ACTIVITY_TEMPLATES = ['Tour a pie por {city}', 'Visita guiada: lo esencial de {city}', 'Experiencia gastronómica en {city}', 'Free tour {city}']

function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return () => {
    h = (h * 1103515245 + 12345) >>> 0
    return (h % 1000) / 1000
  }
}

export function mockHotels(city: string): MockHotelResult[] {
  const rand = seededRandom(`hotel-${city}`)
  return HOTEL_NAME_TEMPLATES.map((template, index) => ({
    id: `mock-hotel-${city}-${index}`,
    name: template.replace('{city}', city),
    stars: 3 + Math.floor(rand() * 3),
    pricePerNight: 60 + Math.floor(rand() * 180),
    rating: Math.round((7.5 + rand() * 2) * 10) / 10,
    provider: index % 2 === 0 ? 'Booking' : 'Expedia',
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(city)}-hotel-${index}/300/200`,
  }))
}

export function mockActivities(city: string): MockActivityResult[] {
  const rand = seededRandom(`activity-${city}`)
  return ACTIVITY_TEMPLATES.map((template, index) => ({
    id: `mock-activity-${city}-${index}`,
    name: template.replace('{city}', city),
    price: 15 + Math.floor(rand() * 60),
    durationLabel: rand() > 0.5 ? '2-3 horas' : 'Medio día',
    rating: Math.round((4 + rand()) * 10) / 10,
    provider: index % 2 === 0 ? 'Civitatis' : 'GetYourGuide',
    photoUrl: `https://picsum.photos/seed/${encodeURIComponent(city)}-activity-${index}/300/200`,
  }))
}
