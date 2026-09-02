import type { DestinationArchetype } from './types'

export interface DestinationClassification {
  archetype: DestinationArchetype
  is_region: boolean
  /**
   * true cuando el destino podría vivirse igual de bien como roadtrip_exclusivo o como
   * base_y_excursiones y Claude no puede decidirlo con seguridad — en ese caso `archetype` es
   * solo la mejor estimación y la app debe preguntarle al usuario en vez de usarlo directo.
   */
  ambiguous: boolean
  /**
   * Solo relevante cuando archetype es urbano_clasico (en cualquier otro caso, false): true si el
   * transporte público de la ciudad es insuficiente o poco práctico para un visitante, por diseño
   * urbano disperso (ej. Los Ángeles, Phoenix). Activa la pregunta de alquiler de coche en Fase 2.
   */
  requiere_coche: boolean
  /**
   * Solo relevante cuando archetype es multidestino_tren_o_vuelo (en cualquier otro caso, null):
   * nombre del pase de transporte dominante del destino (ej. "JR Pass"), o null si no hay ninguno
   * lo bastante dominante como para asumirlo por defecto (ej. Corea del Sur, Taiwán, EE.UU.).
   */
  pase_dominante: string | null
}

/** Clasifica el destino (arquetipo + is_region + ambiguous + requiere_coche + pase_dominante) vía Claude. Devuelve null si la llamada falla. */
export async function classifyDestination(destination: string): Promise<DestinationClassification | null> {
  try {
    const response = await fetch('/api/classify-destination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination }),
    })
    if (!response.ok) return null

    const data = (await response.json()) as Partial<DestinationClassification>
    if (!data.archetype || typeof data.is_region !== 'boolean') return null

    return {
      archetype: data.archetype,
      is_region: data.is_region,
      ambiguous: Boolean(data.ambiguous),
      requiere_coche: Boolean(data.requiere_coche),
      pase_dominante: typeof data.pase_dominante === 'string' ? data.pase_dominante : null,
    }
  } catch {
    return null
  }
}
