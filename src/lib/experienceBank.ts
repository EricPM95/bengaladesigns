import type { ExperienceId } from './types'

export interface ExperienceDefinition {
  id: ExperienceId
  icon: string
  title: string
}

/**
 * Banco fijo de 18 experiencias — solo icono+título, nunca visibles descripciones/definiciones
 * (esas viven solo en el prompt del backend, para que Claude desambigüe overlaps como
 * atracciones/naturaleza/paisajes-miradores/trekking). Claude filtra 4-8 relevantes por destino
 * vía `POST /api/suggest-experiences`; el orden aquí no importa para el filtrado (el backend
 * valida por id), solo se usa si hiciera falta iterar el banco completo en el frontend.
 */
export const EXPERIENCE_BANK: ExperienceDefinition[] = [
  { id: 'atracciones', icon: '🏛️', title: 'Atracciones' },
  { id: 'arte_cultura', icon: '🖼️', title: 'Arte y Cultura' },
  { id: 'paseos_encanto', icon: '🚶‍♂️', title: 'Paseos con Encanto' },
  { id: 'trekking_outdoor', icon: '🥾', title: 'Trekking & Outdoor' },
  { id: 'playas_calas', icon: '🏖️', title: 'Arena y Sal' },
  { id: 'paseos_barco', icon: '⛵', title: 'Paseos en Barco' },
  { id: 'gastronomia', icon: '🍽️', title: 'Gastronomía' },
  { id: 'bienestar', icon: '🧖‍♀️', title: 'Bienestar' },
  { id: 'nieve', icon: '🎿', title: 'Nieve' },
  { id: 'paisajes_miradores', icon: '📸', title: 'Paisajes y Miradores' },
  { id: 'compras', icon: '🛍️', title: 'Compras' },
  { id: 'ocio', icon: '🎉', title: 'Ocio' },
  { id: 'fenomenos_naturales', icon: '✨', title: 'Fenómenos Naturales' },
  { id: 'parques', icon: '🎢', title: 'Parques' },
  { id: 'resorts', icon: '🍹', title: 'Resorts' },
  { id: 'turismo_rural', icon: '🏡', title: 'Turismo Rural' },
  { id: 'naturaleza', icon: '🌲', title: 'Naturaleza' },
  { id: 'joyas_ocultas', icon: '💎', title: 'Joyas Ocultas' },
]

const EXPERIENCE_IDS = new Set(EXPERIENCE_BANK.map((entry) => entry.id))

export function isKnownExperienceId(id: string): id is ExperienceId {
  return EXPERIENCE_IDS.has(id as ExperienceId)
}
