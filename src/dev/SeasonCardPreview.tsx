import type { Route } from '../lib/types'
import { SeasonCard } from '../components/route/SeasonCard'

/**
 * Solo en desarrollo (`?tarjeta=navidad|semana_santa|cumpleanos`): la tarjeta especial sola, con el texto de ejemplo del motor, para revisarla
 * y hacer las capturas (PROMPT_TARJETA_TEMPORADA, Tanda 10M).
 */
const TEXTS: Record<string, string> = {
  navidad: '¡Vas a vivir Roma en Navidad! Uno de los momentos más bonitos del año para recorrerla. Te hemos preparado la mejor ruta para que disfrutes cada rincón de la ciudad.',
  semana_santa: '¡Vas a vivir Roma en Semana Santa! Uno de los momentos más especiales del año en la ciudad. Te hemos preparado la mejor ruta para que lo vivas todo.',
  cumpleanos: '¡Estás en Roma el día de su cumpleaños! El 21 de abril la ciudad celebra su fundación, hace más de 2.700 años. Te hemos preparado la mejor ruta para que lo disfrutes.',
}
const TITULOS: Record<string, string> = { navidad: 'Navidad en Roma', semana_santa: 'Semana Santa en Roma', cumpleanos: 'El cumpleaños de Roma' }

export function SeasonCardPreview({ season }: { season: string }) {
  const clave = TEXTS[season] ? season : 'navidad'
  const route = {
    destination: 'Roma, Italia',
    seasonNote: { season: clave, title: TITULOS[clave], text: TEXTS[clave], ...(clave === 'navidad' ? { icon: 'navidad' } : {}) },
    seasonNoteDismissed: false,
  } as unknown as Route
  return (
    <div className="min-h-screen bg-bg">
      <SeasonCard route={route} />
    </div>
  )
}
