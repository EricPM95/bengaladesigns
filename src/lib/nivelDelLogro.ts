/**
 * (V79) UNA SOLA CUENTA para las medallas de los logros que van contando (países, destinos, capitales, patrimonios, viajes, con quién viajas…):
 * dado el logro y el TOTAL que lleva en ese momento, el nivel que le toca. La usan TODAS las pantallas (la pantalla grande al ganarlo, el resumen del día y el del viaje,
 * la ficha en grande y «Todos mis logros»): el 1.er país y el 2.º, la medalla de nivel 1; el 3.º sube a la del nivel 2 («Trotamundos»); el 5.º, nivel 3…
 * Los pasos son los de `escalones[].n` de `data/logros/viajero.json` (los mismos que ya dibujaba `Chapa.tsx`).
 */

/** Los pasos de cada logro que cuenta y, si no es 1, 2, 3…, el grado de la medalla de cada paso. */
export const PASOS_DE_LOGRO: Record<string, { pasos: number[]; grados?: number[] }> = {
  paises: { pasos: [1, 3, 5, 8, 10, 15, 20, 25, 30] },
  destinos: { pasos: [1, 3, 5, 10, 15, 20, 25, 30] },
  capitales: { pasos: [5, 10, 15, 25] },
  patrimonios: { pasos: [1, 5, 10, 15, 25] },
  viajes: { pasos: [1, 5, 10, 15, 20, 25, 30] },
  con_quien_solo: { pasos: [1, 3, 5, 10] },
  con_quien_pareja: { pasos: [1, 3, 5, 10] },
  con_quien_amigos: { pasos: [1, 3, 5, 10] },
  con_quien_familia: { pasos: [1, 3, 5, 10] },
  cazador_emblemas: { pasos: [5, 10, 15] },
  coleccionista: { pasos: [5, 10, 15] },
  conocedor: { pasos: [25, 50], grados: [5, 10] },
}

/** ¿Este logro va contando (tiene niveles por el total)? */
export const llevaNiveles = (logro: string): boolean => logro in PASOS_DE_LOGRO

/**
 * El nivel (1, 2, 3…) que le toca a un logro con `total` ya ganados: el del último paso que ya se ha pasado. Con 0 (o por debajo del primer paso) es 0 (aún no tiene medalla);
 * un logro que no cuenta por niveles da 0. `nivelDelLogro('paises', 4)` → 2 (Trotamundos: el 3.er país sube y el 4.º sigue ahí).
 */
export function nivelDelLogro(logro: string, total: number | string | null | undefined): number {
  const def = PASOS_DE_LOGRO[logro]
  const n = Number(total)
  if (!def || !Number.isFinite(n)) return 0
  return def.pasos.filter((p) => p <= n).length
}

/** El grado de la MEDALLA que se dibuja para ese total (siempre al menos el del primer nivel: una medalla nunca se pinta «sin nivel»). */
export function gradoDeLaMedalla(logro: string, total: number | string | null | undefined): number {
  const def = PASOS_DE_LOGRO[logro]
  if (!def) return 1
  const ix = Math.max(0, nivelDelLogro(logro, total) - 1)
  return def.grados?.[ix] ?? ix + 1
}
