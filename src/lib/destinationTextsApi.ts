/**
 * Textos del cuestionario que viven en el JSON del destino (decisión del 2026-09-26: la pantalla de ritmo).
 * Con `{destino}` dentro, que se rellena aquí. Sin JSON para esa ciudad (o sin servidor), los de siempre.
 */
/** Paradas reales por día de un ritmo y a qué hora empieza el día (medidas con el motor, ver paceStats.mjs). */
export interface PaceStat {
  /** Media de paradas reales por día en todos los viajes con ese ritmo (lo que se enseña). */
  media: number
  /** La hora de la primera parada (mediana del motor v4, de 5 en 5): ahí empieza el gráfico. */
  inicio: string
  /** Si no todos los días empiezan igual, el rango (cuartiles 25-75 %): «El día empieza entre las 08:45 y las 10:00». */
  inicio_desde?: string
  inicio_hasta?: string
}

export interface PaceTexts {
  completo: string
  tranquilo: string
  recomendado: string
  /** Solo destinos curados; sin ellos, los objetivos del motor (modes.js: 8-10 y 5-7, 08:00 y 10:00). */
  stats: { completo: PaceStat; tranquilo: PaceStat }
}

const FALLBACK_STATS: PaceTexts['stats'] = {
  completo: { media: 9, inicio: '08:00' },
  tranquilo: { media: 6, inicio: '10:00' },
}

const FALLBACK: Omit<PaceTexts, 'stats'> = {
  completo: 'La experiencia completa: todo lo imprescindible y los rincones que hacen especial {destino}. ¿Te sobra algo? ¡Edítala a tu gusto!',
  tranquilo: 'Lo básico de {destino}, a ritmo lento. Ideal si viajas con niños o prefieres ir con calma, aunque te perderás rincones que merecen la pena.',
  recomendado: 'Recomendado',
}

const fill = (text: string, destination: string) => text.replace(/\{destino\}/g, destination)

export function defaultPaceTexts(destination: string): PaceTexts {
  return { completo: fill(FALLBACK.completo, destination), tranquilo: fill(FALLBACK.tranquilo, destination), recomendado: FALLBACK.recomendado, stats: FALLBACK_STATS }
}

export async function fetchPaceTexts(destination: string): Promise<PaceTexts> {
  try {
    const response = await fetch('/api/destination-texts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination }),
    })
    if (!response.ok) return defaultPaceTexts(destination)
    const data = await response.json()
    if (data?.found !== true || !data.pace) return defaultPaceTexts(destination)
    return {
      completo: fill(String(data.pace.completo ?? FALLBACK.completo), destination),
      tranquilo: fill(String(data.pace.tranquilo ?? FALLBACK.tranquilo), destination),
      recomendado: String(data.pace.recomendado ?? FALLBACK.recomendado),
      stats: {
        completo: data.pace_stats?.completo ?? FALLBACK_STATS.completo,
        tranquilo: data.pace_stats?.tranquilo ?? FALLBACK_STATS.tranquilo,
      },
    }
  } catch {
    return defaultPaceTexts(destination)
  }
}
