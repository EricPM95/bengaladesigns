import type { ExperienceId } from './types'
import type { NombreIcono } from './iconos'

export interface ExperienceDefinition {
  id: ExperienceId
  icon: NombreIcono
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
  { id: 'atracciones', icon: 'columnas', title: 'Atracciones' },
  { id: 'arte_cultura', icon: 'arte', title: 'Arte y Cultura' },
  { id: 'paseos_encanto', icon: 'andando', title: 'Paseos con Encanto' },
  { id: 'trekking_outdoor', icon: 'montana', title: 'Trekking & Outdoor' },
  { id: 'playas_calas', icon: 'playa', title: 'Arena y Sal' },
  { id: 'paseos_barco', icon: 'barco', title: 'Paseos en Barco' },
  { id: 'gastronomia', icon: 'comida', title: 'Gastronomía' },
  { id: 'bienestar', icon: 'bienestar', title: 'Bienestar' },
  { id: 'nieve', icon: 'nieve', title: 'Nieve' },
  { id: 'paisajes_miradores', icon: 'camara', title: 'Paisajes y Miradores' },
  { id: 'compras', icon: 'bolsa', title: 'Compras' },
  { id: 'ocio', icon: 'fiesta', title: 'Ocio' },
  { id: 'fenomenos_naturales', icon: 'destello', title: 'Fenómenos Naturales' },
  { id: 'parques', icon: 'explorar', title: 'Parques' },
  { id: 'resorts', icon: 'copa', title: 'Resorts' },
  { id: 'turismo_rural', icon: 'casa', title: 'Turismo Rural' },
  { id: 'naturaleza', icon: 'parque', title: 'Naturaleza' },
  { id: 'joyas_ocultas', icon: 'gema', title: 'Joyas Ocultas' },
]

const EXPERIENCE_IDS = new Set(EXPERIENCE_BANK.map((entry) => entry.id))

export function isKnownExperienceId(id: string): id is ExperienceId {
  return EXPERIENCE_IDS.has(id as ExperienceId) || id === FREE_TOUR_EXPERIENCE.id
}

/**
 * "Free Tour" — deliberadamente FUERA de EXPERIENCE_BANK: no es una categoría de lugares por destino
 * (Claude no la filtra en /api/suggest-experiences, ni se usa para etiquetar sitios sueltos en
 * suggest-places), es una experiencia fija que existe en casi cualquier destino urbano. Por eso se
 * muestra siempre fijada en el selector (ver ExperienceSelector.tsx), no como parte de la rejilla de
 * sugeridas por Claude.
 */
export const FREE_TOUR_EXPERIENCE: ExperienceDefinition = { id: 'free_tour', icon: 'free', title: 'Free Tour' }
