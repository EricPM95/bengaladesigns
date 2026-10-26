/**
 * (Tanda 10N3 §2.3) La propuesta SIN ENVIAR de quien ya no ve el viaje (lo quitaron, o salió) se borra de su móvil. La propuesta a medias vive en `localStorage` con la clave
 * `trazo:propuesta:<id del viaje>` (y `trazo:propuesta-procesada:<id>`); cuando ese viaje ya no está entre los viajes que carga la app, esas claves no sirven para nada.
 * Se llama al abrir la app (con los viajes ya cargados) y al dejar de ver un viaje en directo. Pura salvo por el almacenamiento que se le pasa.
 */
const PREFIJOS = ['trazo:propuesta:', 'trazo:propuesta-procesada:']

export interface AlmacenSimple {
  length: number
  key(i: number): string | null
  removeItem(k: string): void
}

/** Borra las propuestas guardadas de los viajes que NO están en `idsVisibles`. Devuelve las claves borradas. */
export function limpiarPropuestasHuerfanas(idsVisibles: Iterable<string>, almacen?: AlmacenSimple): string[] {
  const visibles = new Set(idsVisibles)
  const borradas: string[] = []
  try {
    const a = almacen ?? window.localStorage
    const claves: string[] = []
    for (let i = 0; i < a.length; i++) {
      const k = a.key(i)
      if (k) claves.push(k)
    }
    for (const k of claves) {
      const prefijo = PREFIJOS.find((p) => k.startsWith(p))
      if (!prefijo) continue
      if (!visibles.has(k.slice(prefijo.length))) {
        a.removeItem(k)
        borradas.push(k)
      }
    }
  } catch {
    /* sin almacenamiento: nada que limpiar */
  }
  return borradas
}

/** Borra la propuesta guardada de UN viaje (te han quitado de él con la app abierta). */
export function olvidarPropuestaDe(tripId: string): void {
  try {
    for (const p of PREFIJOS) window.localStorage.removeItem(p + tripId)
  } catch {
    /* nada que quitar */
  }
}
