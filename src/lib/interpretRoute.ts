export interface InterpretedRoute {
  reconocida: boolean
  nombre_oficial?: string
  pais_region?: string
  punto_inicio?: string
  punto_fin?: string
  duracion_tipica_dias?: [number, number]
}

/** Fallback vía Claude cuando el texto libre no coincide con la lista curada de rutas. */
export async function interpretRoute(query: string): Promise<InterpretedRoute> {
  try {
    const response = await fetch('/api/interpret-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!response.ok) return { reconocida: false }
    return (await response.json()) as InterpretedRoute
  } catch {
    return { reconocida: false }
  }
}
