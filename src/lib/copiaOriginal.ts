/**
 * (V37) LA «RUTA ORIGINAL» YA NO VIAJA DENTRO DEL VIAJE.
 *
 * Antes, `route.originalRoute` (días + respuestas tal como salió la ruta, para «Volver a mi ruta original») se subía y se bajaba dentro de cada
 * `trips.route`: el viaje pesaba el doble (Lanzarote 97 KB en vez de 49; Roma ~160 KB en vez de ~80). Ahora:
 *  - en MEMORIA el viaje la sigue llevando (la leen la varita, «Recuperar» y el número de día original), pero NUNCA se sube, ni se baja, ni entra en la caché de HOY del móvil;
 *  - se guarda UNA vez y aparte, solo en este móvil (localStorage, por id de ruta), la primera vez que se crea o se abre el viaje aquí;
 *  - un viaje viejo que aún la trae de la nube la entrega aquí (se guarda en el móvil y se quita en memoria del `route` que se sube).
 * Sin copia en este móvil (otro móvil, datos borrados): la «original» es la ruta tal como se abre aquí (lo mismo que ya pasaba con los viajes de antes de la varita).
 *
 * Funciones puras o con try/catch: sin localStorage (pruebas de node, modo privado) no hacen nada y no fallan.
 */
import type { Route } from './types'

type Copia = NonNullable<Route['originalRoute']>

const PREFIJO = 'jutrip-ruta-original:'
const MAX_COPIAS = 8

/** La ruta SIN la copia original (la que se sube, se baja y se compara). Si no la lleva, devuelve la misma ruta (misma identidad). */
export function sinCopiaOriginal<T extends { originalRoute?: unknown }>(ruta: T): T
export function sinCopiaOriginal<T extends { originalRoute?: unknown }>(ruta: T | null | undefined): T | null | undefined
export function sinCopiaOriginal<T extends { originalRoute?: unknown }>(ruta: T | null | undefined): T | null | undefined {
  if (!ruta || typeof ruta !== 'object' || !('originalRoute' in ruta)) return ruta
  const { originalRoute: _copia, ...resto } = ruta
  void _copia
  return resto as T
}

function almacen(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function leerCopiaOriginal(rutaId: string | null | undefined): Copia | null {
  if (!rutaId) return null
  try {
    const texto = almacen()?.getItem(PREFIJO + rutaId)
    const copia = texto ? (JSON.parse(texto) as Copia) : null
    return copia && Array.isArray(copia.days) ? copia : null
  } catch {
    return null
  }
}

/** Guarda la copia en este móvil. `reemplazar`: al rehacer la ruta (otra ruta original). Sin él, no pisa la que ya hay. Se conservan las últimas 8. */
export function guardarCopiaOriginal(rutaId: string | null | undefined, copia: Copia | null | undefined, reemplazar = false): void {
  if (!rutaId || !copia) return
  const bd = almacen()
  if (!bd) return
  try {
    if (!reemplazar && bd.getItem(PREFIJO + rutaId)) return
    bd.setItem(PREFIJO + rutaId, JSON.stringify(copia))
    const orden: string[] = JSON.parse(bd.getItem(PREFIJO + 'orden') ?? '[]')
    const nuevo = [...orden.filter((id) => id !== rutaId), rutaId]
    while (nuevo.length > MAX_COPIAS) {
      const viejo = nuevo.shift()
      if (viejo) bd.removeItem(PREFIJO + viejo)
    }
    bd.setItem(PREFIJO + 'orden', JSON.stringify(nuevo))
  } catch {
    /* sin sitio o sin permiso: la varita sigue funcionando en esta sesión con la copia en memoria */
  }
}

/** Cierra sesión / borrar cuenta: las copias son de esta persona. */
export function borrarCopiasOriginales(): void {
  const bd = almacen()
  if (!bd) return
  try {
    for (const clave of Object.keys(bd)) if (clave.startsWith(PREFIJO)) bd.removeItem(clave)
  } catch {
    /* nada */
  }
}
