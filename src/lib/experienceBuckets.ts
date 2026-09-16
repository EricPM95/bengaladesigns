import type { ExperienceId } from './types'
import { EXPERIENCE_BANK } from './experienceBank'

export type ExperienceBucketId = 'imprescindibles' | 'sabores_locales' | 'fuera_de_lo_tipico' | 'shopping' | 'free_tour'

export interface ExperienceBucket {
  id: ExperienceBucketId
  icon: string
  title: string
  /** Ids del banco de 18 (o el pseudo-id `free_tour`) que este bucket puede llegar a resolver. */
  memberIds: ExperienceId[]
  /** Si es false, el bucket solo se muestra cuando `suggested_experiences` contiene alguno de memberIds. */
  alwaysVisible: boolean
}

/**
 * Formulario rediseñado: las 18 categorías internas del banco (ver experienceBank.ts, nunca
 * tocado por este mapeo) se agrupan en 5 "buckets" de cara al usuario. Backend/pipeline de
 * generación siguen operando solo con los ExperienceId reales — este mapeo es puramente de UI,
 * confirmado por el usuario como Opción 1: "las 5 categorías nuevas son solo la cara que ve el
 * usuario, por detrás cada una mapea a un grupo de las 18 internas".
 *
 * `free_tour.alwaysVisible = true` es una asunción propia (no confirmada explícitamente) — sigue
 * el mismo criterio que FREE_TOUR_EXPERIENCE en experienceBank.ts, que ya se muestra siempre fijo
 * en el selector actual, sin depender del filtrado por destino de Claude.
 */
export const EXPERIENCE_BUCKETS: ExperienceBucket[] = [
  {
    id: 'imprescindibles',
    icon: '🏛',
    title: 'Imprescindibles',
    memberIds: [
      'atracciones',
      'arte_cultura',
      'paisajes_miradores',
      'fenomenos_naturales',
      'naturaleza',
      'parques',
      'trekking_outdoor',
      'playas_calas',
      'nieve',
      'turismo_rural',
      'paseos_barco',
      'resorts',
      'bienestar',
      'ocio',
    ],
    alwaysVisible: true,
  },
  {
    id: 'sabores_locales',
    icon: '🍝',
    title: 'Sabores locales',
    memberIds: ['gastronomia'],
    alwaysVisible: true,
  },
  {
    id: 'fuera_de_lo_tipico',
    icon: '💎',
    title: 'Fuera de lo típico',
    memberIds: ['joyas_ocultas', 'paseos_encanto'],
    alwaysVisible: true,
  },
  {
    id: 'shopping',
    icon: '🛍',
    title: 'Shopping',
    memberIds: ['compras'],
    alwaysVisible: false,
  },
  {
    id: 'free_tour',
    icon: '🚶',
    title: 'Free Tour',
    memberIds: ['free_tour'],
    alwaysVisible: true,
  },
]

// Chequeo en desarrollo: cada uno de los 18 ids del banco (+ el pseudo-id free_tour) debe caer en
// EXACTAMENTE un bucket — si alguien añade/renombra una categoría en experienceBank.ts sin
// actualizar este mapeo, avisa en vez de dejar la categoría huérfana en silencio.
if (import.meta.env.DEV) {
  const allBankIds: ExperienceId[] = [...EXPERIENCE_BANK.map((entry) => entry.id), 'free_tour']
  const seen = new Map<ExperienceId, ExperienceBucketId[]>()
  for (const bucket of EXPERIENCE_BUCKETS) {
    for (const id of bucket.memberIds) {
      seen.set(id, [...(seen.get(id) ?? []), bucket.id])
    }
  }
  for (const id of allBankIds) {
    const buckets = seen.get(id) ?? []
    if (buckets.length !== 1) {
      console.error(`[experienceBuckets] "${id}" está en ${buckets.length} buckets (debería estar en exactamente 1):`, buckets)
    }
  }
}

/** Un bucket "no siempre visible" (Shopping) solo aparece si Claude sugirió alguna de sus categorías para este destino. */
export function isBucketVisible(bucket: ExperienceBucket, suggestedExperiences: ExperienceId[]): boolean {
  if (bucket.alwaysVisible) return true
  return bucket.memberIds.some((id) => suggestedExperiences.includes(id))
}

/**
 * Ids reales que representa un bucket al quedar seleccionado: la intersección con lo que Claude
 * sugirió para el destino (para no meter categorías irrelevantes), o el bucket completo si esa
 * intersección queda vacía (pasa con Imprescindibles/Sabores/Fuera de lo típico en destinos donde
 * Claude sugirió pocas categorías — siguen mostrándose siempre, así que necesitan resolver a algo).
 */
export function resolveBucketExperiences(bucket: ExperienceBucket, suggestedExperiences: ExperienceId[]): ExperienceId[] {
  if (bucket.id === 'free_tour') return bucket.memberIds
  const overlap = bucket.memberIds.filter((id) => suggestedExperiences.includes(id))
  return overlap.length > 0 ? overlap : bucket.memberIds
}

/** Unión (sin duplicados) de los ExperienceId reales de todos los buckets marcados — esto es lo que se guarda en `answers.experiences`. */
export function resolveSelectedBucketExperiences(selectedBucketIds: ExperienceBucketId[], suggestedExperiences: ExperienceId[]): ExperienceId[] {
  const resolved = new Set<ExperienceId>()
  for (const bucketId of selectedBucketIds) {
    const bucket = EXPERIENCE_BUCKETS.find((entry) => entry.id === bucketId)
    if (!bucket) continue
    for (const id of resolveBucketExperiences(bucket, suggestedExperiences)) {
      resolved.add(id)
    }
  }
  return [...resolved]
}
