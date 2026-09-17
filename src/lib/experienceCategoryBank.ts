import type { ExperienceCategoryId, ExperienceId } from './types'

export interface ExperienceCategoryDefinition {
  id: ExperienceCategoryId
  icon: string
  title: string
  description: string
  /** Solo se muestra cuando `answers.season === 'winter'` — ver isCategoryVisible. */
  winterOnly?: boolean
  /** 'imprescindibles': siempre empieza en "Me interesa" y no se puede arrastrar a "No me lo recomiendes" — ver ExperienceCategorySelector.tsx. */
  lockedPositive?: boolean
}

/**
 * "Elige tus experiencias" v2 (punto 4 del prompt DEFINITIVO) — mismos 7 ids que EXPERIENCE_CATEGORY_BANK
 * en server/index.js, solo icono/título/descripción visibles aquí (la lógica de qué hace cada
 * categoría sobre el pipeline vive en el backend, igual que el banco de 18 en experienceBank.ts).
 */
export const EXPERIENCE_CATEGORY_BANK: ExperienceCategoryDefinition[] = [
  { id: 'imprescindibles', icon: '🏛', title: 'Imprescindibles', description: 'Lo esencial del destino', lockedPositive: true },
  { id: 'sabores_locales', icon: '🍝', title: 'Sabores locales', description: 'Gastronomía real, mercados y comida local' },
  { id: 'fuera_de_lo_tipico', icon: '💎', title: 'Fuera de lo típico', description: 'Joyas ocultas, barrios auténticos' },
  { id: 'arte_museos', icon: '🎨', title: 'Arte y Museos', description: 'Galerías, museos y arte' },
  { id: 'miradores_atardeceres', icon: '📸', title: 'Miradores y Atardeceres', description: 'Vistas panorámicas y puntos fotogénicos' },
  { id: 'free_tour', icon: '🚶', title: 'Free Tour', description: 'Recorrido guiado a pie de 2-3 horas' },
  { id: 'mercadillos_navidenos', icon: '🎄', title: 'Mercadillos Navideños', description: 'Mercadillos de Navidad y ambiente invernal', winterOnly: true },
]

export const MAX_POSITIVE_CATEGORIES = 3
export const MAX_NEGATIVE_CATEGORIES = 2

export function isCategoryVisible(category: ExperienceCategoryDefinition, season: string | undefined): boolean {
  return !category.winterOnly || season === 'winter'
}

/** Codifica positivas/negativas con prefijo +/- en un único array — mismo formato que decodeExperienceCategories en server/index.js, reutiliza la columna `experiences text[]` de route_cache sin migración. */
export function encodeExperienceCategories(positive: ExperienceCategoryId[], negative: ExperienceCategoryId[]): string[] {
  return [...positive.map((id) => `+${id}`), ...negative.map((id) => `-${id}`)]
}

/**
 * Puente hacia el banco de 18 (ExperienceId) para que "Elige lugares" (PlaceSelector/suggestPlaces)
 * siga recibiendo una señal de afinidad razonable sin tener que tocar ese sistema — solo las
 * categorías POSITIVAS aportan ids (una categoría en negativo o neutra simplemente no añade nada,
 * nunca resta). 'mercadillos_navidenos' no tiene un id de 18 banco parecido, se deja sin mapear
 * antes que forzar una aproximación mala.
 */
const LEGACY_ID_BY_CATEGORY: Partial<Record<ExperienceCategoryId, ExperienceId>> = {
  imprescindibles: 'atracciones',
  sabores_locales: 'gastronomia',
  fuera_de_lo_tipico: 'joyas_ocultas',
  arte_museos: 'arte_cultura',
  miradores_atardeceres: 'paisajes_miradores',
  free_tour: 'free_tour',
}

export function deriveLegacyExperienceIds(positive: ExperienceCategoryId[]): ExperienceId[] {
  const ids = positive.map((category) => LEGACY_ID_BY_CATEGORY[category]).filter((id): id is ExperienceId => Boolean(id))
  return [...new Set(ids)]
}
