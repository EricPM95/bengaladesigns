/**
 * EL INTERRUPTOR DE HOY V2 (Tanda 8B). Lo nuevo de HOY (pantallas de Design, hojas, lista con fotos) va detrás de este interruptor: apagado en producción,
 * encendido con `VITE_HOY_V2=true`; en desarrollo también vale `?hoy2=on` (y `?hoy2=off`), que se recuerda en la sesión. Con él apagado, HOY es el de hoy.
 * Los logros siguen detrás de los suyos (`logrosActivos()`); este interruptor no los enciende.
 */

const CLAVE = 'trazo:hoy2'

/** Pura, para poder probarla sin navegador. */
export function calcularHoyV2Activo(datos: { entorno?: string | undefined; desarrollo: boolean; parametro?: string | null; guardado?: string | null }): boolean {
  if (datos.desarrollo) {
    const elegido = datos.parametro === 'on' || datos.parametro === 'off' ? datos.parametro : datos.guardado
    if (elegido === 'on') return true
    if (elegido === 'off') return false
  }
  return datos.entorno === 'true'
}

export function hoyV2Activo(): boolean {
  let parametro: string | null = null
  let guardado: string | null = null
  try {
    parametro = new URLSearchParams(window.location.search).get('hoy2')
    if (import.meta.env.DEV && (parametro === 'on' || parametro === 'off')) window.sessionStorage.setItem(CLAVE, parametro)
    guardado = window.sessionStorage.getItem(CLAVE)
  } catch {
    /* sin ventana o sin almacenamiento: manda el valor de configuración */
  }
  return calcularHoyV2Activo({ entorno: import.meta.env.VITE_HOY_V2, desarrollo: import.meta.env.DEV, parametro, guardado })
}
