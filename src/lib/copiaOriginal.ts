/**
 * (V37) LA «RUTA ORIGINAL» YA NO VIAJA DENTRO DEL VIAJE.
 *
 * Antes, `route.originalRoute` (días + respuestas tal como salió la ruta, para «Volver a mi ruta original») se subía y se bajaba dentro de cada
 * `trips.route`: el viaje pesaba el doble (Lanzarote 97 KB en vez de 49; Roma ~160 KB en vez de ~80). Ahora:
 *  - en MEMORIA el viaje la sigue llevando (la leen la varita, «Recuperar» y el número de día original), pero NUNCA se sube, ni se baja, ni entra en la caché de HOY del móvil;
 *  - se guarda UNA vez y aparte, solo en este móvil (localStorage, por id de ruta), la primera vez que se crea o se abre el viaje aquí;
 *  - un viaje viejo que aún la trae de la nube la entrega aquí (se guarda en el móvil y se quita en memoria del `route` que se sube).
 * (V37b) Para que cualquier móvil tenga la original: la de verdad (la que sale al crear o rehacer la ruta) se SUBE UNA vez a `trips.route_original` (migración 0092) junto a un guardado normal, y SOLO se BAJA al
 * confirmar «Sí, recuperar» en la varita (copiaOriginalNube.ts), nunca al abrir ni sincronizar. La «derivada» (la ruta tal como se abre en un móvil que no la tiene) nunca se sube: pisaría la original.
 * Sin copia en este móvil ni en la nube (o sin la 0092): la «original» es la ruta tal como se abre aquí (lo mismo que ya pasaba con los viajes de antes de la varita).
 *
 * Funciones puras o con try/catch: sin localStorage (pruebas de node, modo privado) no hacen nada y no fallan.
 */
import type { Route } from './types'

type Copia = NonNullable<Route['originalRoute']>

const BASE = 'jutrip-ruta-original'
const PREFIJO = `${BASE}:`
const REAL = `${BASE}-real:` // (V37b) esta copia es la original de verdad
const SUBIR = `${BASE}-subir:` // (V37b) falta subirla a la nube (una vez)
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

/** ¿Esta copia es la ORIGINAL de verdad (la que salió al crear o rehacer la ruta, o la que bajó de la nube) y no la «derivada» de abrir un viaje en otro móvil (la ruta tal como estaba al abrirlo)? */
export function copiaEsReal(rutaId: string | null | undefined): boolean {
  if (!rutaId) return false
  try {
    return almacen()?.getItem(REAL + rutaId) === '1'
  } catch {
    return false
  }
}

/**
 * Guarda la copia en este móvil. `reemplazar`: al rehacer la ruta (otra ruta original). Sin él, no pisa la que ya hay, salvo que la nueva sea `genuina` y la que hay sea derivada.
 * `genuina` (V37b): es la original de verdad (se acaba de crear la ruta, o la entregó un viaje viejo de la nube): se marca como real y PENDIENTE DE SUBIR a `trips.route_original` con el próximo guardado
 * (una sola vez; ver tripPersistence.ts). Las derivadas (abrir un viaje en otro móvil) nunca se suben: pisarían la original con una ruta ya editada. Se conservan las últimas 8.
 */
export function guardarCopiaOriginal(rutaId: string | null | undefined, copia: Copia | null | undefined, reemplazar = false, genuina = false): void {
  if (!rutaId || !copia) return
  const bd = almacen()
  if (!bd) return
  try {
    const hay = Boolean(bd.getItem(PREFIJO + rutaId))
    if (!reemplazar && hay && !(genuina && !copiaEsReal(rutaId))) return
    bd.setItem(PREFIJO + rutaId, JSON.stringify(copia))
    if (genuina) {
      bd.setItem(REAL + rutaId, '1')
      bd.setItem(SUBIR + rutaId, '1')
    } else {
      bd.removeItem(REAL + rutaId)
      bd.removeItem(SUBIR + rutaId)
    }
    const orden: string[] = JSON.parse(bd.getItem(PREFIJO + 'orden') ?? '[]')
    const nuevo = [...orden.filter((id) => id !== rutaId), rutaId]
    while (nuevo.length > MAX_COPIAS) {
      const viejo = nuevo.shift()
      if (viejo) {
        bd.removeItem(PREFIJO + viejo)
        bd.removeItem(REAL + viejo)
        bd.removeItem(SUBIR + viejo)
      }
    }
    bd.setItem(PREFIJO + 'orden', JSON.stringify(nuevo))
  } catch {
    /* sin sitio o sin permiso: la varita sigue funcionando en esta sesión con la copia en memoria */
  }
}

/** La copia que falta por subir a la nube (la original de verdad, aún no subida), o null. */
export function copiaPendienteDeSubir(rutaId: string | null | undefined): Copia | null {
  if (!rutaId) return null
  try {
    return almacen()?.getItem(SUBIR + rutaId) === '1' ? leerCopiaOriginal(rutaId) : null
  } catch {
    return null
  }
}

/** Ya se subió (o la nube ya la tiene): no se vuelve a subir. */
export function marcarCopiaSubida(rutaId: string | null | undefined): void {
  if (!rutaId) return
  try {
    almacen()?.removeItem(SUBIR + rutaId)
  } catch {
    /* nada */
  }
}

/** La que bajó de la nube al pulsar la varita: es la original de verdad y no hay nada que subir. */
export function guardarCopiaRealDeLaNube(rutaId: string | null | undefined, copia: Copia): void {
  if (!rutaId) return
  guardarCopiaOriginal(rutaId, copia, true, true)
  marcarCopiaSubida(rutaId)
}

/** La nube ya se consultó para este viaje y no tenía copia: la derivada de este móvil es lo que hay (no se vuelve a preguntar). */
export function marcarCopiaConsultada(rutaId: string | null | undefined): void {
  if (!rutaId) return
  try {
    almacen()?.setItem(REAL + rutaId, '1')
  } catch {
    /* nada */
  }
}

/** Cierra sesión / borrar cuenta: las copias son de esta persona. */
export function borrarCopiasOriginales(): void {
  const bd = almacen()
  if (!bd) return
  try {
    for (const clave of Object.keys(bd)) if (clave.startsWith(BASE)) bd.removeItem(clave)
  } catch {
    /* nada */
  }
}
