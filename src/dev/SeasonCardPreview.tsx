import type { Route } from '../lib/types'
import { SeasonCard } from '../components/route/SeasonCard'

/**
 * Solo en desarrollo (`?tarjeta=primavera|verano|otono|invierno|navidad`): la tarjeta de temporada sola, con un texto de
 * ejemplo del motor, para revisarla y hacer las capturas (PROMPT_TARJETA_TEMPORADA).
 */
const TEXTS: Record<string, string> = {
  primavera: '¡Vas a vivir Roma en primavera! Las terrazas vuelven a llenarse y los días se alargan. Como anochece sobre las 20:00, hemos preparado tu ruta para aprovechar la luz y llegar a los miradores con el atardecer.',
  verano: '¡Vas a vivir Roma en verano! Días largos, noches templadas y la ciudad en la calle. Hemos preparado tu ruta para esquivar el calor: lo más importante, a primera hora, y después de comer, descanso o sitios a cubierto. Y como anochece sobre las 20:45, las mejores vistas llegan al atardecer.',
  otono: '¡Vas a vivir Roma en otoño! Luz dorada, menos calor y la ciudad a su ritmo. Como anochece sobre las 18:30, hemos colocado tu ruta para que veas lo mejor con luz y llegues a los miradores con el atardecer.',
  invierno: '¡Vas a vivir Roma en invierno! Mañanas frías y claras, y menos turistas que en verano. Como anochece pronto, sobre las 17:15, hemos adaptado tu ruta: lo que se ve al aire libre, con luz, y por la noche, Roma iluminada.',
  navidad: '¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, y como anochece sobre las 16:45, también iluminado.',
}

export function SeasonCardPreview({ season }: { season: string }) {
  const route = {
    destination: 'Roma, Italia',
    seasonNote: { season, text: TEXTS[season] ?? TEXTS.primavera, ...(season === 'navidad' ? { icon: 'navidad' } : {}) },
    seasonNoteDismissed: false,
  } as unknown as Route
  return (
    <div className="min-h-screen bg-bg">
      <SeasonCard route={route} />
    </div>
  )
}
