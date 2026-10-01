/**
 * Las excursiones desde un destino para la ventana del destino (pestaña Ruta, «Excursiones desde {destino}»).
 * Hoy no hay ninguna fuente: cuando se conecten las APIs de afiliados saldrán de ahí. Mientras la lista esté vacía el
 * bloque no se pinta (ni vacío ni con «próximamente»). PARA_CODE_TODO_2026-10-01, paso 6.1.
 */
export interface DestinationExcursion {
  id: string
  name: string
  photoUrl: string
}

export function destinationExcursions(_city: string): DestinationExcursion[] {
  return []
}
