import type { QuestionnaireAnswers, TransportContext } from './types'

const PARAM = 'trip'

interface SharedTrip {
  destination: string
  answers: QuestionnaireAnswers
  transportContext: TransportContext
}

export function encodeTripToUrl(destination: string, answers: QuestionnaireAnswers, transportContext: TransportContext): string {
  const payload: SharedTrip = { destination, answers, transportContext }
  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)))
  const url = new URL(window.location.href)
  url.search = `?${PARAM}=${encoded}`
  return url.toString()
}

export function decodeTripFromUrl(): SharedTrip | null {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get(PARAM)
  if (!encoded) return null
  try {
    const json = decodeURIComponent(atob(encoded))
    return JSON.parse(json) as SharedTrip
  } catch {
    return null
  }
}
