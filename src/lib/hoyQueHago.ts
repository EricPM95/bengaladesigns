import { hasRealCoordinates } from './distanceMock'
import { displayStopName } from './format'
import { candidatosParaAnadir, minDe, viajeMin, type Candidato } from './hoyCambiarPlan'
import type { DestinationPlace } from './destinationPlacesApi'
import { numberedStopsOf } from './stopKind'
import type { Coordinates, DayPlan, MealSlot, Stop } from './types'

/**
 * (HOY2b, E, apartado 1; Eric, 5-nov) «¿QUÉ HAGO AHORA?» (17 y Completa 1 a 6). Todo puro (sin React ni almacén): decide QUÉ dice el botón al tocarlo y si está iluminado (el punto dorado, sin parpadeo).
 * El botón está SIEMPRE a la vista; se ilumina solo si hay algo nuevo:
 *  · hueco: 30 min libres o más antes de lo siguiente con hora → lo más cercano no visto, primero lo que da pedazo de colección («Tienes media hora libre: el Mirador de Haría está a 8 minutos. ¿Vamos?»);
 *  · comer: es hora de comer y no hay restaurante elegido → lleva a «Quiero comer ahora»;
 *  · atardecer: el día está acabado y aún hay luz → el atardecer cercano y la cena;
 *  · clavando (sin iluminar): «Vas clavando la ruta… Ahora toca X, a N minutos.» [Cómo llegar].
 * No repite un sitio que el aviso de fuera de ruta (H8b) ya ofrece.
 */

export type QueHago =
  | { tipo: 'hueco'; candidato: Candidato; ida: number; libreMin: number; frase: string; coleccion: string | null }
  | { tipo: 'comer'; meal: MealSlot }
  | { tipo: 'atardecer' }
  | { tipo: 'clavando'; siguiente: Stop | null; minutos: number | null; aqui: boolean; frase: string }

export const LIBRE_MINIMO_MIN = 30

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** «la Plaza de España», «el Mirador de Haría»: el nombre con su artículo (el de los datos, o por la primera palabra); sin saberlo, el nombre solo. */
export function conArticuloDe(nombre: string): string {
  const limpio = displayStopName(nombre).trim()
  if (/^(el|la|los|las)\s/i.test(limpio)) return limpio.replace(/^(El|La|Los|Las)\s/, (a) => a.toLowerCase())
  const primera = norm(limpio.split(/\s+/)[0] ?? '')
  const F = ['plaza', 'piazza', 'villa', 'basilica', 'iglesia', 'catedral', 'fontana', 'fuente', 'capilla', 'cueva', 'casa', 'playa', 'ermita', 'galeria', 'isla', 'laguna', 'calle', 'torre', 'boca', 'fundacion', 'caleta', 'ciudad', 'salina', 'cala']
  const FP = ['playas', 'salinas', 'montanas', 'termas', 'grietas', 'catacumbas']
  const M = ['mirador', 'castillo', 'puente', 'museo', 'parque', 'jardin', 'foro', 'palacio', 'teatro', 'coliseo', 'panteon', 'faro', 'volcan', 'pueblo', 'barrio', 'monasterio', 'templo', 'arco', 'centro', 'mercado', 'paseo', 'charco', 'lago', 'monte', 'campo', 'circo', 'trastevere', 'janiculo', 'pincio']
  const MP = ['museos', 'jardines', 'foros', 'jameos', 'hervideros']
  if (MP.includes(primera)) return `los ${limpio}`
  if (FP.includes(primera)) return `las ${limpio}`
  if (F.includes(primera)) return `la ${limpio}`
  if (M.includes(primera)) return `el ${limpio}`
  return limpio
}

/** «media hora», «una hora», «un par de horas»: nunca minutos crudos. */
export function ratoLibre(min: number): string {
  if (min < 50) return 'media hora libre'
  if (min < 100) return 'una hora libre'
  return 'un par de horas libres'
}

export const minutosTexto = (min: number) => `${min} ${min === 1 ? 'minuto' : 'minutos'}`

export function decidirQueHago(p: {
  day: DayPlan
  /** La siguiente parada por hacer (null = día acabado). */
  siguiente: Stop | null
  /** Dónde estás (ubicación, o la última parada vista o la casa). */
  desde: Coordinates | null
  ahoraMin: number
  enCoche: boolean
  lugares: DestinationPlace[]
  /** Los nombres de los sitios que dan pedazo de colección (norm → nombre de la colección). */
  coleccionDe: Map<string, string>
  /** El sitio que el aviso de fuera de ruta ya ofrece (no se repite). */
  ofrecido: string | null
  /** La comida o cena que toca ahora y no se ha dado por hecha. */
  comida: MealSlot | null
  /** Hay atardecer cercano que enseñar con el día acabado. */
  hayAtardecer: boolean
  /** «Ya estás aquí» (estás en la siguiente parada). */
  aqui: boolean
  route: Parameters<typeof candidatosParaAnadir>[0]['route']
}): QueHago {
  const { siguiente } = p
  const paradas = numberedStopsOf(p.day)
  if (siguiente) {
    // 1 · Hora de comer y sin restaurante.
    if (p.comida && !(p.comida.chosenRestaurant ?? p.comida.recommendedRestaurant)) return { tipo: 'comer', meal: p.comida }
    // 2 · Tiempo libre: 30 min o más antes de lo siguiente con hora.
    const t = minDe(siguiente.time)
    const origen = p.desde && hasRealCoordinates(p.desde) ? p.desde : null
    if (t != null && !p.aqui) {
      const aSiguiente = viajeMin(origen ? { coordinates: origen } : null, siguiente, p.enCoche)
      const libre = t - p.ahoraMin - aSiguiente
      if (libre >= LIBRE_MINIMO_MIN && origen) {
        const logros = new Set(p.lugares.filter((l) => p.coleccionDe.has(norm(l.name))).map((l) => l.name))
        const cercanos = candidatosParaAnadir({ route: p.route, lugares: p.lugares, desde: origen, logros, enCoche: p.enCoche, maxMetros: p.enCoche ? 12000 : 1500, limite: 12 })
        const elegido = cercanos
          .filter((c) => !p.ofrecido || norm(c.nombre) !== norm(p.ofrecido))
          .map((c) => ({ c, ida: viajeMin({ coordinates: origen }, c, p.enCoche), vuelta: viajeMin(c, siguiente, p.enCoche) }))
          .find((x) => x.ida + Math.min(x.c.duracionMin, 30) + x.vuelta <= libre + aSiguiente)
        if (elegido) {
          const coleccion = p.coleccionDe.get(norm(elegido.c.nombre)) ?? null
          return { tipo: 'hueco', candidato: elegido.c, ida: elegido.ida, libreMin: libre, coleccion, frase: `Tienes ${ratoLibre(libre)}: ${conArticuloDe(elegido.c.nombre)} está a ${minutosTexto(elegido.ida)}. ¿Vamos?` }
        }
      }
    }
    // 3 · Sin nada mejor.
    const minutos = p.aqui ? null : viajeMin(p.desde && hasRealCoordinates(p.desde) ? { coordinates: p.desde } : null, siguiente, p.enCoche)
    const toca = conArticuloDe(siguiente.name)
    return {
      tipo: 'clavando',
      siguiente,
      minutos,
      aqui: p.aqui,
      frase: `Vas clavando la ruta: si sigues así, hoy lo ves todo. Ahora mismo no hay nada mejor que hacer. ${p.aqui ? `Ahora toca ${toca}, y ya estás aquí.` : `Ahora toca ${toca}, a ${minutosTexto(minutos ?? 0)}.`}`,
    }
  }
  // Día acabado.
  if (paradas.length > 0 && p.hayAtardecer) return { tipo: 'atardecer' }
  return { tipo: 'clavando', siguiente: null, minutos: null, aqui: false, frase: 'Hoy lo tienes todo visto. Descansa: mañana seguimos.' }
}

/** ¿Está iluminado (hay algo nuevo)? */
export const estaIluminado = (q: QueHago): boolean => q.tipo === 'hueco' || q.tipo === 'comer' || q.tipo === 'atardecer'
