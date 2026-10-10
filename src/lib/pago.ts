/**
 * El interruptor de pago (Tanda 6s): UN solo sitio para toda la app. Todo lo que es de pago va detrás de `pagoActivo()`; con él apagado no sale
 * nada de eso, ni candados ni avisos. De pago en la 6s: el bloque «Llegada y vuelta», la pregunta de la zona del alojamiento, el resumen de arriba y
 * lo de la barra de llegada y de vuelta de DÍAS («+ AÑADIR VUELO», el punto elegido en la ventana).
 *
 * Ahora va ENCENDIDO (`PAGO_ACTIVO`), para hacer las pruebas. Para ver la versión gratis sin tocar nada se añade `?version=gratis` a la dirección, y
 * `?version=completa` para volver; la elección se guarda mientras la pestaña esté abierta.
 */
export const PAGO_ACTIVO = true

const CLAVE = 'trazo:version'

function versionPedida(): 'gratis' | 'completa' | null {
  try {
    const param = new URLSearchParams(window.location.search).get('version')
    if (param === 'gratis' || param === 'completa') {
      window.sessionStorage.setItem(CLAVE, param)
      return param
    }
    const guardada = window.sessionStorage.getItem(CLAVE)
    return guardada === 'gratis' || guardada === 'completa' ? guardada : null
  } catch {
    return null
  }
}

/** ¿Está encendido lo de pago? La dirección manda (`?version=gratis` / `?version=completa`); si no dice nada, el dato de configuración. */
export function pagoActivo(): boolean {
  const pedida = versionPedida()
  return pedida === null ? PAGO_ACTIVO : pedida === 'completa'
}

/** Quita un parámetro de la dirección sin recargar (si no, `?version=gratis` mandaría siempre sobre lo que se elige en el panel de pruebas). */
export function quitarParametroDeLaDireccion(nombre: string): void {
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(nombre)) return
    url.searchParams.delete(nombre)
    window.history.replaceState(null, '', url)
  } catch {
    /* sin dirección (pruebas en el servidor): nada que quitar */
  }
}

/** El panel de pruebas elige la versión (lo mismo que `?version=gratis` / `?version=completa`): se guarda mientras la pestaña esté abierta. */
export function fijarVersion(version: 'gratis' | 'completa'): void {
  try {
    window.sessionStorage.setItem(CLAVE, version)
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
  quitarParametroDeLaDireccion('version')
}
