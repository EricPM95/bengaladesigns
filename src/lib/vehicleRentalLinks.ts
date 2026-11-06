import { enlaceAlquilerDeCoche } from './enlacesAfiliado'

/**
 * Broker de alquiler de camper/autocaravana, según destino — igual que Booking/Civitatis en
 * DestinationDetailModal.tsx: enlace real a la home del sitio, sin integración de afiliación real.
 * Northbound está especializado en Islandia; MotorhomeRepublic cubre el resto del mundo.
 */
export function buildCamperRentalLink(countryCode: string | null): { url: string; label: string } {
  if (countryCode?.toLowerCase() === 'is') {
    return { url: 'https://www.northbound.is', label: 'Northbound' }
  }
  return { url: 'https://www.motorhomerepublic.com', label: 'MotorhomeRepublic' }
}

/** Coche de alquiler (no camper) — DiscoverCars con nuestro código de afiliado (6-nov: la dirección vive en `enlacesAfiliado.ts`, el único sitio donde se cambian los códigos). `label` es interno: nunca va en un botón. */
export function buildCarRentalLink(): { url: string; label: string } {
  return { url: enlaceAlquilerDeCoche(), label: 'DiscoverCars' }
}
