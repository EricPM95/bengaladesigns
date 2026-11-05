import { useRouteStore } from '../store/useRouteStore'

/**
 * HOY3: AL TOCAR UN AVISO DEL VIAJE SE ABRE HOY. El aviso del móvil lleva `/?hoy=1` (server/avisosViaje.js); con la app cerrada se abre esa dirección y con la app ya abierta el service worker avisa por
 * mensaje `{ tipo: 'hoy' }` (public/sw.js). En los dos casos, en cuanto hay un viaje cargado se pone la pestaña HOY. Si en 20 segundos no hay viaje, no hace nada.
 */
export function hoyDeLaDireccion(busqueda: string): boolean {
  return new URLSearchParams(busqueda).get('hoy') === '1'
}

export function abrirHoy(): void {
  const poner = (): boolean => {
    const estado = useRouteStore.getState()
    if (!estado.route) return false
    estado.setMode('today')
    return true
  }
  if (poner()) return
  const dejarDeMirar = useRouteStore.subscribe(() => {
    if (poner()) dejarDeMirar()
  })
  window.setTimeout(dejarDeMirar, 20_000)
}
