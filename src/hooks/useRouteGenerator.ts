import { useCallback } from 'react'
import type { QuestionnaireAnswers, Route, TransportContext } from '../lib/types'
import { mapGeneratedRouteToRoute, type GeneratedRouteResponse } from '../lib/mapGeneratedRoute'

type GenerateRouteEvent =
  | { type: 'progress'; step: number }
  | { type: 'done'; route: GeneratedRouteResponse }
  | { type: 'error'; message: string }

export function useRouteGenerator() {
  const generateRoute = useCallback(
    async (
      destination: string,
      answers: QuestionnaireAnswers,
      transportContext: TransportContext,
      mustIncludePlaces: string[] = [],
      onProgress?: (step: number) => void,
    ): Promise<Route> => {
      const response = await fetch('/api/generate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, answers, ...transportContext, must_include_places: mustIncludePlaces }),
      })

      if (!response.ok || !response.body) {
        throw new Error('No se pudo generar la ruta con IA. Inténtalo de nuevo.')
      }

      // El backend responde en NDJSON (una línea = un evento JSON: progreso por paso real según lo
      // que Claude ya ha generado, y al final el resultado completo) en vez de un único res.json() —
      // así LoadingScreen.tsx puede mostrar progreso por pasos real, ver computeGenerationStep en
      // server/index.js.
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let generated: GeneratedRouteResponse | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let newlineIndex: number
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)
          if (!line) continue

          // Una línea NDJSON puntualmente malformada (p. ej. un corte de red a mitad de escritura)
          // no debe tirar toda la generación abajo — se ignora esa línea y se sigue esperando el
          // resto del stream, mismo espíritu que "no bloquear ni mostrar error prematuro".
          let event: GenerateRouteEvent
          try {
            event = JSON.parse(line) as GenerateRouteEvent
          } catch {
            continue
          }
          if (event.type === 'progress') onProgress?.(event.step)
          else if (event.type === 'done') generated = event.route
          else if (event.type === 'error') throw new Error(event.message || 'No se pudo generar la ruta con IA.')
        }
      }

      if (!generated) throw new Error('No se pudo generar la ruta con IA. Inténtalo de nuevo.')
      return mapGeneratedRouteToRoute(generated, destination, answers, transportContext)
    },
    [],
  )

  return { generateRoute }
}
