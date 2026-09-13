import { seededRandom } from './mockDayDetail'

/**
 * Ticket/tour mock de una parada — pestaña "Tickets & Entradas" de StopDetailSheet. Forma EXACTA
 * pensada para que conectar las APIs reales de Civitatis/GetYourGuide más adelante sea solo cambiar
 * el origen de estos datos (esta función), sin tocar StopTicketCard.tsx ni StopDetailSheet.tsx.
 * `idioma` es el idioma de la visita guiada — al conectar la API real, confirmar que el feed de
 * afiliados trae este campo (no solo la web pública, que no siempre lo expone igual).
 */
export interface StopTicket {
  proveedor: 'civitatis' | 'getyourguide'
  nombre: string
  imagen: string
  valoracion: number
  /** 10 para Civitatis, 5 para GetYourGuide — cada proveedor puntúa en su propia escala. */
  escala_valoracion: number
  num_opiniones: number
  duracion: string
  idioma: string
  precio: number
  moneda: string
  url_afiliado: string
}

const TOUR_NAME_TEMPLATES = [
  { proveedor: 'civitatis' as const, template: (place: string) => `Visita guiada por ${place}` },
  { proveedor: 'getyourguide' as const, template: (place: string) => `Tour guiado por ${place}` },
  { proveedor: 'civitatis' as const, template: (place: string) => `Entrada + audioguía de ${place}` },
  { proveedor: 'getyourguide' as const, template: (place: string) => `Acceso prioritario a ${place}` },
]

const DURATIONS = ['1h', '1h 30min', '2h', '2h 30min', '3h']

function randomBetween(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min)
}

/** 3-4 tickets mock, mezcla Civitatis/GetYourGuide, deterministas por `stopId` (nunca cambian entre renders). */
export function buildMockStopTickets(stopId: string, placeName: string): StopTicket[] {
  const rand = seededRandom(`${stopId}-tickets`)
  const count = 3 + Math.floor(rand() * 2) // 3 o 4

  return TOUR_NAME_TEMPLATES.slice(0, count).map(({ proveedor, template }, index) => {
    const escala = proveedor === 'civitatis' ? 10 : 5
    const valoracion = Math.round(randomBetween(rand, escala * 0.72, escala * 0.98) * 10) / 10
    return {
      proveedor,
      nombre: template(placeName),
      imagen: `https://picsum.photos/seed/${encodeURIComponent(stopId)}-ticket-${index}/300/200`,
      valoracion,
      escala_valoracion: escala,
      num_opiniones: Math.round(randomBetween(rand, 300, 90000)),
      duracion: DURATIONS[Math.floor(rand() * DURATIONS.length)],
      idioma: 'Español',
      precio: Math.round(randomBetween(rand, 18, 75)),
      moneda: 'EUR',
      url_afiliado: '#',
    }
  })
}
