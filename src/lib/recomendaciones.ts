/**
 * «Lo recomiendan» (Tanda 6z, rehecho en la 6y10). La cuenta de cada sitio es UNA, la misma en toda la app (`useMeGustaStore`): los «me gusta» de PARTIDA del sitio (las redes de Eric, aproximado por debajo
 * del real, de los datos del destino) más los de los viajeros. Ya no hay números de prueba inventados: los de partida son datos fijos y reales, y el Coliseo enseña lo mismo en su ficha, en EXPLORAR y en cualquier otro sitio.
 * Aquí solo vive lo que decide QUÉ se enseña de esa cuenta.
 */

/** Desde cuántos «me gusta» se enseña el número (por debajo, el corazón sí y el número no). */
export const MIN_RECOMENDACIONES = 20

/** ¿Es una copia de desarrollo o de prueba (local o versión de prueba de Vercel) y no la de producción? Lo usa el panel de pruebas y la lluvia de prueba. */
export function esEntornoDePrueba(): boolean {
  if (import.meta.env.VITE_VERCEL_ENV === 'production') return false
  if (import.meta.env.VITE_VERCEL_ENV === 'preview' || import.meta.env.DEV) return true
  const host = (typeof window === 'undefined' ? '' : window.location?.hostname) ?? ''
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost')) return true
  // Las versiones de prueba de Vercel: `proyecto-git-rama-equipo.vercel.app` y `proyecto-<9 letras>-equipo.vercel.app`.
  return host.endsWith('.vercel.app') && (host.includes('-git-') || /-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app$/.test(host))
}

/** El número que se puede enseñar de la cuenta de un sitio, o null (entonces solo el corazón). */
export function numeroDeRecomendaciones(total: number): number | null {
  return total >= MIN_RECOMENDACIONES ? total : null
}

/** 1240 → «1.240» (en español no se separa el millar de las cifras de cuatro dígitos con el formato normal). */
export const conMiles = (numero: number): string => String(numero).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** El texto del botón de la ficha: «154 lo recomiendan»; sin número que enseñar, nada de cifras. */
export function textoRecomendacion(total: number): string {
  const mostrado = numeroDeRecomendaciones(total)
  if (mostrado !== null) return `${conMiles(mostrado)} lo recomiendan`
  return total === 0 ? 'Sé el primero en recomendarlo' : 'Ya lo han recomendado'
}
