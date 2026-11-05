import { tokenDeLaCuenta } from './servidor'

/**
 * LA CUENTA EN CADA LLAMADA A /api (arreglo del 5-nov, «no se puede crear un viaje a Lanzarote»). El guardián de los destinos ocultos (server/destinoOculto.js) deja pasar al administrador
 * solo si la petición trae su sesión (`Authorization: Bearer …`). Casi todas las llamadas del formulario (clasificar el destino, la viabilidad del transporte, las experiencias, la ruta…)
 * se hacían SIN ella: el administrador era un desconocido, el servidor contestaba «Not found» y la app lo contaba como un fallo de Claude.
 * Ahora TODA llamada a una dirección de este mismo sitio que empiece por `/api/` lleva la sesión del viajero (si tiene una y si la llamada no trae ya su `Authorization`). No cambia nada para
 * quien no tiene sesión, ni para ninguna otra dirección.
 */
export function crearFetchConCuenta(original: typeof fetch, obtenerToken: () => Promise<string | null>): typeof fetch {
  const rutaDe = (entrada: RequestInfo | URL): string => {
    try {
      const url = typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url
      const absoluta = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
      const mismoSitio = typeof window === 'undefined' || absoluta.origin === window.location.origin
      return mismoSitio ? absoluta.pathname : ''
    } catch {
      return ''
    }
  }
  return async (entrada, init) => {
    try {
      if (!rutaDe(entrada).startsWith('/api/')) return original(entrada, init)
      const cabeceras = new Headers(init?.headers ?? (entrada instanceof Request ? entrada.headers : undefined))
      if (cabeceras.has('Authorization')) return original(entrada, init)
      const token = await obtenerToken()
      if (!token) return original(entrada, init)
      cabeceras.set('Authorization', `Bearer ${token}`)
      return entrada instanceof Request && !init ? original(new Request(entrada, { headers: cabeceras })) : original(entrada, { ...init, headers: cabeceras })
    } catch {
      return original(entrada, init)
    }
  }
}

/** Se instala una sola vez, al arrancar la app. */
export function instalarFetchConCuenta(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { __fetchConCuenta?: boolean }
  if (w.__fetchConCuenta) return
  w.__fetchConCuenta = true
  window.fetch = crearFetchConCuenta(window.fetch.bind(window), tokenDeLaCuenta)
}
