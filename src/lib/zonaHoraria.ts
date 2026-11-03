/**
 * LA ZONA HORARIA DEL DESTINO (LZ1, apartado 1: lo atado a Roma). Antes, `'Europe/Rome'` estaba escrito en tres sitios del móvil; ahora sale de aquí.
 * El servidor ya usa `timezone` de los datos del destino (`data/pipeline_v2/<clave>.json`); el móvil no lleva esos datos enteros, así que lleva esta tabla corta
 * (la misma que `timezone` de cada JSON: si un destino nuevo trae el suyo, se añade aquí también; la prueba `pruebaTandaLZ1_A` compara las dos).
 * Roma: `Europe/Rome` (como siempre). Lanzarote: `Atlantic/Canary` (una hora menos que la península).
 */
const ZONAS: Record<string, string> = { roma: 'Europe/Rome', rome: 'Europe/Rome', lanzarote: 'Atlantic/Canary', cancun: 'America/Cancun' }

const clave = (destino: string) => destino.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** La zona horaria del destino por su nombre («Roma», «Lanzarote»), o `null` si no está en la tabla (quien llama decide qué hace: la del teléfono, o la de Roma si es el destino de siempre). */
export function zonaDelDestino(destino: string | null | undefined): string | null {
  if (!destino) return null
  return ZONAS[clave(destino)] ?? null
}

/** Para quien siempre ha sido Roma: la zona del destino y, si no se sabe, `Europe/Rome` (el comportamiento de antes, igual). */
export function zonaDelDestinoORoma(destino: string | null | undefined): string {
  return zonaDelDestino(destino) ?? 'Europe/Rome'
}
