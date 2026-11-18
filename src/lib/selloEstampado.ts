/**
 * (V14) El sello de un viaje se estampa UNA sola vez: al estamparse se apunta aquí (en este móvil) y desde entonces el resumen del viaje dice [Ver mi sello] en vez de [Estampar mi sello].
 */
const CLAVE = 'jutrip.sellos_estampados'

const leer = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

export const selloYaEstampado = (tripId: string | null | undefined): boolean => Boolean(tripId) && leer().includes(String(tripId))

export function marcarSelloEstampado(tripId: string): void {
  try {
    const v = leer()
    if (!v.includes(tripId)) localStorage.setItem(CLAVE, JSON.stringify([...v, tripId]))
  } catch {
    /* sin almacenamiento: el sello se estampa igual */
  }
}
