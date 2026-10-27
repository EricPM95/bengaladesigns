import type { Route } from './types'

/**
 * (Tanda 10N4 §2) El aviso «Sobre tu ruta» lo escribe el motor UNA vez, al crear la ruta, con los días de ese momento («2 días en Roma dan para mucho…»). Si después el viaje cambia de duración
 * (fechas nuevas, días añadidos o quitados), el texto se quedaba contando una ruta que ya no existe: un viaje de 5 días con «2 días en Roma…». Ahora solo vale si el número de días que dice
 * (o «Un día») sigue siendo el de la ruta de ahora; los textos de invierno que no cuentan los días valen siempre. Pura.
 */
export function bannerDeContextoVigente(route: Pick<Route, 'contextBanner' | 'days'>): string | null {
  const texto = route.contextBanner?.trim()
  if (!texto) return null
  const dias = /^(\d+) días? en /.exec(texto)
  const dicho = dias ? Number(dias[1]) : /^Un día en /.test(texto) ? 1 : null
  if (dicho !== null && dicho !== route.days.length) return null
  return texto
}
