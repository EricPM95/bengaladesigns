/**
 * Textos del cuestionario que viven en el JSON del destino (decisión del 2026-09-26: la pantalla de ritmo).
 * Con `{destino}` dentro, que se rellena aquí. Sin JSON para esa ciudad (o sin servidor), los de siempre.
 */
export interface PaceTexts {
  completo: string
  tranquilo: string
  recomendado: string
}

const FALLBACK: PaceTexts = {
  completo: 'La experiencia completa: todo lo imprescindible y los rincones que hacen especial {destino}. ¿Te sobra algo? ¡Edítala a tu gusto!',
  tranquilo: 'Lo básico de {destino}, a ritmo lento. Ideal si viajas con niños o prefieres ir con calma, aunque te perderás rincones que merecen la pena.',
  recomendado: 'Recomendado',
}

const fill = (text: string, destination: string) => text.replace(/\{destino\}/g, destination)

export function defaultPaceTexts(destination: string): PaceTexts {
  return { completo: fill(FALLBACK.completo, destination), tranquilo: fill(FALLBACK.tranquilo, destination), recomendado: FALLBACK.recomendado }
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
    }
  } catch {
    return defaultPaceTexts(destination)
  }
}
