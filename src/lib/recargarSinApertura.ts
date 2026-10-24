/**
 * La recarga que hace la propia app justo después de entrar en la cuenta o de unirse a un viaje (Tanda 10G): la pantalla de apertura sale en cada apertura, pero no dos veces seguidas por esta
 * recarga. Deja una marca en la pestaña (`sessionStorage`) que index.html lee UNA vez, quita y borra.
 */
export const MARCA_SIN_APERTURA = 'jutrip:sin-apertura'

export function recargarSinApertura(): void {
  try {
    window.sessionStorage.setItem(MARCA_SIN_APERTURA, '1')
  } catch {
    /* sin almacenamiento: la apertura saldrá otra vez, nada más */
  }
  window.location.reload()
}
