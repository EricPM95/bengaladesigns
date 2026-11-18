/**
 * LO ÚLTIMO QUE SE VIO DE LOS LOGROS (Tanda V9, apartado 1, «que Logros abra al instante», como el Perfil con `perfilEnCache`): la última respuesta de lo que enseñan las pantallas de logros
 * (`GET /api/logros/estado` por viaje y `GET /api/logros/ganados`) se guarda en el móvil. Al abrir se enseña AL INSTANTE; lo nuevo llega por detrás y solo cambia lo que cambie (sin parpadeo).
 * Se guarda en memoria (para la misma sesión) y en el móvil (para la próxima vez); se borra al cerrar la sesión (es de la cuenta que sale). «Un momento…» solo la primera vez en un móvil nuevo.
 */
const PREFIJO = 'trazo:logros:v1:'
const memoria = new Map<string, unknown>()

export function leerEnCache<T>(clave: string): T | null {
  if (memoria.has(clave)) return memoria.get(clave) as T
  try {
    const crudo = window.localStorage.getItem(PREFIJO + clave)
    if (!crudo) return null
    const v = JSON.parse(crudo) as T
    memoria.set(clave, v)
    return v
  } catch {
    return null
  }
}

export function guardarEnCache(clave: string, valor: unknown): void {
  memoria.set(clave, valor)
  try {
    window.localStorage.setItem(PREFIJO + clave, JSON.stringify(valor))
  } catch {
    /* sin almacenamiento o lleno: se queda solo en memoria */
  }
}

/** Al cerrar la sesión: lo guardado era de la cuenta que sale. */
export function olvidarCacheDeLogros(): void {
  memoria.clear()
  try {
    for (const k of Object.keys(window.localStorage)) if (k.startsWith(PREFIJO)) window.localStorage.removeItem(k)
  } catch {
    /* nada que quitar */
  }
}

/** Pura: ¿son iguales dos respuestas? (para no repintar ni parpadear cuando el servidor dice lo mismo). */
export const mismaRespuesta = (a: unknown, b: unknown): boolean => a === b || (a != null && b != null && JSON.stringify(a) === JSON.stringify(b))
