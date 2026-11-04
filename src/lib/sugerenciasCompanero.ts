/**
 * «SUGERENCIAS DEL COMPAÑERO» (Ajustes, C27 de Design; HOY1 apartado 10). El ajuste que apaga lo que el compañero propone solo en HOY: el juego de los emblemas ocultos, el reto del día y «Estás en… / Estás junto a…»
 * (fuera de ruta). Encendido por defecto. Aquí solo vive el valor (en el móvil); la pantalla de Ajustes lo cambia con `ponerSugerenciasDelCompanero`.
 */
const CLAVE = 'trazo:ajuste:sugerencias-companero'
const EVENTO = 'trazo:ajuste-sugerencias'

export function sugerenciasDelCompanero(): boolean {
  try {
    return window.localStorage.getItem(CLAVE) !== '0'
  } catch {
    return true
  }
}

export function ponerSugerenciasDelCompanero(activas: boolean): void {
  try {
    window.localStorage.setItem(CLAVE, activas ? '1' : '0')
    window.dispatchEvent(new Event(EVENTO))
  } catch {
    /* sin almacenamiento: se queda como estaba */
  }
}

/** Para que HOY se repinte al cambiarlo. */
export function alCambiarSugerencias(oyente: () => void): () => void {
  window.addEventListener(EVENTO, oyente)
  window.addEventListener('storage', oyente)
  return () => {
    window.removeEventListener(EVENTO, oyente)
    window.removeEventListener('storage', oyente)
  }
}
