import { todayIso } from '../../lib/dateRange'
import { getTodayTripStatus } from '../../lib/todayMode'
import type { ResumenViaje } from '../../lib/viajesPerfil'

/**
 * Mis viajes agrupados como en el Perfil de Design: «En curso» (hoy está dentro de sus fechas), «Próximo» y «Ya hechos». Pura: la lista ya viene ordenada (los que vienen primero,
 * luego los hechos) y aquí solo se corta. Un grupo sin viajes no sale. (Los de «antes de la app» no son viajes guardados: los pinta el Perfil aparte.)
 */
export type GrupoDeViajes = { clave: 'en_curso' | 'proximo' | 'hecho'; titulo: string; viajes: ResumenViaje[] }

const TITULOS: Record<GrupoDeViajes['clave'], string> = { en_curso: 'En curso', proximo: 'Próximo', hecho: 'Ya hechos' }

export function agruparViajes(viajes: ResumenViaje[], hoyIso: string = todayIso()): GrupoDeViajes[] {
  const grupos: Record<GrupoDeViajes['clave'], ResumenViaje[]> = { en_curso: [], proximo: [], hecho: [] }
  for (const v of viajes) {
    const fase = getTodayTripStatus(v.route, hoyIso)?.phase
    grupos[fase === 'during' ? 'en_curso' : v.fase].push(v)
  }
  return (['en_curso', 'proximo', 'hecho'] as const).filter((c) => grupos[c].length > 0).map((c) => ({ clave: c, titulo: TITULOS[c], viajes: grupos[c] }))
}
