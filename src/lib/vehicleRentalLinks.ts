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

/** Coche de alquiler (no camper) — DiscoverCars vía Travelpayouts, mismo "enlace real, sin integración de afiliación real" que el resto de la app. */
export function buildCarRentalLink(): { url: string; label: string } {
  return { url: 'https://www.discovercars.com', label: 'DiscoverCars' }
}
