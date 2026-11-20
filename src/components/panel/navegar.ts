/**
 * (V35A) Ir a otra pantalla del panel sin recargar: cambia la dirección y avisa al panel (que escucha `popstate`). Usado por los enlaces a la ficha de una persona (Ventas, Reportes, Logros…).
 */
export function irA(ruta: string): void {
  try {
    window.history.pushState(null, '', ruta)
    window.dispatchEvent(new PopStateEvent('popstate'))
  } catch {
    window.location.assign(ruta)
  }
}
/** La ficha de una persona: `/admin/usuarios?ficha=<id>`. */
export const direccionDeFicha = (id: string): string => `/admin/usuarios?ficha=${encodeURIComponent(id)}`
export const irAFicha = (id: string): void => irA(direccionDeFicha(id))
