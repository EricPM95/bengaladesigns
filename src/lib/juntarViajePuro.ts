import type { SavedTrip } from './tripPersistence'

// (V17) Las partes puras de juntarViaje.ts (sin Supabase ni almacenes): para poder probarlas sin la app.
const norma = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const rangoDe = (v: { route: { answers?: { dateRange?: { start?: string; end?: string } } } }): { start: string; end: string } | null => {
  const r = v.route.answers?.dateRange
  return r?.start && r?.end ? { start: r.start, end: r.end } : null
}

/** Pura: el viaje PROPIO (no invitada) al mismo destino que el compartido y con algún día en común (las dos fechas completas; inclusive). null si no hay. */
export function viajeQueSePisa(viajes: SavedTrip[], compartidoId: string): SavedTrip | null {
  const comp = viajes.find((v) => v.id === compartidoId)
  if (!comp) return null
  const rc = rangoDe(comp)
  if (!rc) return null
  return (
    viajes.find((v) => {
      if (v.id === compartidoId || v.esInvitado || v.generationState) return false
      if (norma(v.route.destination) !== norma(comp.route.destination)) return false
      const r = rangoDe(v)
      return r !== null && r.start <= rc.end && rc.start <= r.end
    }) ?? null
  )
}

/** Pura: «Ya tienes un viaje a Lanzarote en esas fechas.» y «¿Lo juntamos con el de Eric?». */
export function textosDeJuntar(destino: string, invitador: string | null): { titulo: string; pregunta: string } {
  const de = invitador?.trim() ? `el de ${invitador.trim()}` : 'el compartido'
  return { titulo: `Ya tienes un viaje a ${destino} en esas fechas.`, pregunta: `¿Lo juntamos con ${de}?` }
}
