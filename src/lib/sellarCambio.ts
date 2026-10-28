import type { Route } from './types'
import { resumirCambio, sinCambios, ultimoCambioDe } from '../../shared/avisos/cambioViaje.js'

/**
 * (Tanda 10N8, apartado 4) CADA GUARDADO DE LA RUTA LLEVA LO QUE HA PASADO. Hasta ahora solo los cambios «con nombre propio» (Free Tour, excursión, recuperar…) apuntaban su `route.ultimoCambio`; el resto (quitar un día,
 * cambiar el orden de los días, añadir un restaurante, añadir sitios) llegaba a la base de datos sin él, que lo juntaba con el aviso anterior sin leer (y ese ni salía como nuevo ni sonaba) o, si solo cambiaba
 * un restaurante, ni lo veía. Ahora, justo antes de guardar, se compara la ruta con la que se guardó la última vez (o la que se cargó de la nube) y, si de verdad ha cambiado algo, se le pone un `ultimoCambio`
 * nuevo con un `id` propio; el disparador (migración 0058) hace de ahí un aviso NUEVO para los demás, con la frase de lo último que ha pasado. Si no ha cambiado nada que contar (se ha marcado un aviso como
 * leído, se ha cerrado un texto…), la ruta sale con el `ultimoCambio` que ya tenía la nube, para que el disparador no vea un cambio donde no lo hay.
 * Pura salvo la memoria de cada viaje (qué se guardó la última vez); la prueba la reinicia con `olvidarBases`.
 */
interface Base {
  ruta: Route
  /** Cuándo se guardó (para reconocer los pasos siguientes de una misma acción con nombre propio). */
  en: number
}
const bases = new Map<string, Base>()
/** Los `id` de `ultimoCambio` que ya se han guardado o que llegaron de la nube: un `id` que NO está aquí lo acaba de apuntar una acción con nombre propio. */
const idsUsados = new Set<string>()
/** Un paso de una acción con nombre propio que llega dentro de este plazo del anterior sigue siendo la misma acción (no es un aviso nuevo). */
export const PLAZO_MISMA_ACCION_MS = 20_000

const idDe = (r: Route | null | undefined): string | null => {
  const id = (r?.ultimoCambio as { id?: unknown } | undefined)?.id
  return typeof id === 'string' ? id : null
}
const sinUltimoCambio = (r: Route): Route => {
  const { ultimoCambio: _quitado, ...resto } = r
  void _quitado
  return resto as Route
}
const huella = (r: Route): string => JSON.stringify(sinUltimoCambio(r))

/** Apunta cómo está el viaje en la nube (cargado, recibido de otra persona o recién guardado). */
export function recordarBase(tripId: string, ruta: Route | null | undefined, en: number = Date.now()): void {
  if (!tripId || !ruta) return
  bases.set(tripId, { ruta, en })
  const id = idDe(ruta)
  if (id) idsUsados.add(id)
}
export function olvidarBases(): void {
  bases.clear()
  idsUsados.clear()
}

/** La ruta que se guarda: con su `ultimoCambio` nuevo si de verdad ha cambiado algo. `respaldo`: la ruta guardada de la lista, si este móvil aún no ha guardado nada de este viaje. */
export function sellarRuta(tripId: string, ruta: Route, respaldo?: Route | null, ahora: number = Date.now()): Route {
  const base = bases.get(tripId) ?? (respaldo ? { ruta: respaldo, en: 0 } : null)
  if (!base) return ruta
  if (huella(base.ruta) === huella(ruta)) return conElDeLaNube(base.ruta, ruta)
  const id = idDe(ruta)
  // Una acción con nombre propio acaba de apuntar su `id` (nunca guardado): manda ella.
  if (id && !idsUsados.has(id)) return ruta
  // Los pasos siguientes de una acción con nombre propio (rehacer los días uno a uno…) siguen siendo la misma acción.
  const accionDeBase = (base.ruta.ultimoCambio as { accion?: unknown } | undefined)?.accion
  if (id && id === idDe(base.ruta) && accionDeBase && ahora - base.en < PLAZO_MISMA_ACCION_MS) return ruta
  const resumen = resumirCambio(base.ruta, ruta)
  if (sinCambios(resumen)) return conElDeLaNube(base.ruta, ruta)
  return { ...ruta, ultimoCambio: ultimoCambioDe(base.ruta, ruta, null) as Record<string, unknown> }
}

/** La ruta con el `ultimoCambio` que tiene la nube: así el disparador no cree que hay una acción nueva. */
function conElDeLaNube(nube: Route, ruta: Route): Route {
  if (nube.ultimoCambio) return { ...ruta, ultimoCambio: nube.ultimoCambio }
  return ruta.ultimoCambio ? sinUltimoCambio(ruta) : ruta
}
