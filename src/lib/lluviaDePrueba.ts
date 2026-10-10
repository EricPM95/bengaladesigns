import { esEntornoDePrueba } from './recomendaciones'

const CLAVE_LLUVIA = 'trazo:lluvia-de-prueba'

/**
 * LA LLUVIA DE PRUEBA (Tanda 6z6d; solo en local y en las vistas previas, nunca en producción): la enciende el panel de pruebas y hace que la app se comporte como si nuestro servidor dijera que llueve
 * (`rainForecast.ts`, un solo sitio). En producción devuelve siempre `false`, aunque alguien escriba la clave a mano. Se recuerda mientras dure la sesión de la pestaña.
 */
export function lluviaDePruebaActiva(): boolean {
  if (!esEntornoDePrueba()) return false
  try {
    return window.sessionStorage.getItem(CLAVE_LLUVIA) === '1'
  } catch {
    return false
  }
}

/** El panel de pruebas enciende o apaga la lluvia de prueba. En producción no hace nada. */
export function fijarLluviaDePrueba(encendida: boolean): void {
  if (!esEntornoDePrueba()) return
  try {
    window.sessionStorage.setItem(CLAVE_LLUVIA, encendida ? '1' : '0')
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
}
