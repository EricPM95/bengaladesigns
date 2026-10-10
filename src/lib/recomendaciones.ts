/**
 * «Viajeros lo recomiendan» (Tanda 6z). La app NUNCA enseña a nadie un número de recomendaciones, valoraciones o «me gusta» que no sea real (INVARIANTES, regla 513).
 *
 * - Versión de verdad: solo los «me gusta» reales (`place_likes`), y el número solo sale desde 20; por debajo, el corazón sí y el número no.
 * - Modo de prueba (`?prueba=1`, como `?version=gratis`): números inventados y fijos por lugar, solo para ver cómo queda el diseño. Salen del nombre (siempre el mismo) y del nivel del lugar:
 *   imprescindibles (nivel 1) de 800 a 2.500; nivel 2 de 80 a 600; nivel 3 y lo que no tiene nivel, ninguno. No se guardan en `place_likes` ni en ningún sitio, no se suman a los reales y,
 *   en producción, `?prueba=1` no hace nada: solo funciona en local y en las versiones de prueba de Vercel.
 */

import { quitarParametroDeLaDireccion } from './pago'

/** Desde cuántos «me gusta» reales se enseña el número. */
export const MIN_RECOMENDACIONES = 20

const CLAVE_PRUEBA = 'trazo:prueba'

/** ¿Es una copia de desarrollo o de prueba (local o versión de prueba de Vercel) y no la de producción? */
export function esEntornoDePrueba(): boolean {
  if (import.meta.env.VITE_VERCEL_ENV === 'production') return false
  if (import.meta.env.VITE_VERCEL_ENV === 'preview' || import.meta.env.DEV) return true
  const host = typeof window === 'undefined' ? '' : window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost')) return true
  // Las versiones de prueba de Vercel: `proyecto-git-rama-equipo.vercel.app` y `proyecto-<9 letras>-equipo.vercel.app`.
  return host.endsWith('.vercel.app') && (host.includes('-git-') || /-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app$/.test(host))
}

/** ¿Está encendido el modo de prueba? `?prueba=1` lo enciende (se recuerda mientras la pestaña esté abierta), `?prueba=0` lo apaga; en producción nunca. */
export function pruebaActiva(): boolean {
  if (!esEntornoDePrueba()) return false
  try {
    const param = new URLSearchParams(window.location.search).get('prueba')
    if (param === '1' || param === '0') {
      window.sessionStorage.setItem(CLAVE_PRUEBA, param)
      return param === '1'
    }
    return window.sessionStorage.getItem(CLAVE_PRUEBA) === '1'
  } catch {
    return false
  }
}

/** El panel de pruebas enciende o apaga los números de prueba (lo mismo que `?prueba=1` / `?prueba=0`). En producción no hace nada. */
export function fijarPrueba(encendida: boolean): void {
  if (!esEntornoDePrueba()) return
  try {
    window.sessionStorage.setItem(CLAVE_PRUEBA, encendida ? '1' : '0')
  } catch {
    /* sin almacenamiento: no se recuerda */
  }
  quitarParametroDeLaDireccion('prueba')
}

/** Un número entre 0 y 1 que sale del nombre y siempre es el mismo. */
function huellaDe(nombre: string): number {
  let h = 2166136261
  for (let i = 0; i < nombre.length; i++) {
    h ^= nombre.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return (h % 10007) / 10007
}

/** El número inventado de un lugar en el modo de prueba, o null si por su nivel no lleva. */
export function recomendacionesDePrueba(place: { name: string; level: number | null; kind?: string }): number | null {
  if (place.kind && place.kind !== 'place') return null
  if (place.level === 1) return 800 + Math.floor(huellaDe(place.name) * 1701)
  if (place.level === 2) return 80 + Math.floor(huellaDe(place.name) * 521)
  return null
}

/**
 * El número que se puede enseñar de un lugar, o null (entonces solo el corazón). `real` son los «me gusta» de verdad. En el modo de prueba y con nivel 1 o 2 sale el número inventado
 * (nunca sumado al real); si no, el real, solo desde 20.
 */
export function numeroDeRecomendaciones(place: { name: string; level: number | null; kind?: string }, real: number): number | null {
  if (pruebaActiva()) {
    const inventado = recomendacionesDePrueba(place)
    if (inventado !== null) return inventado
  }
  return real >= MIN_RECOMENDACIONES ? real : null
}

/** 1240 → «1.240» (en español no se separa el millar de las cifras de cuatro dígitos con el formato normal). */
export const conMiles = (numero: number): string => String(numero).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** El texto de la ficha: «1.240 viajeros lo recomiendan»; sin número que enseñar, nada de cifras. */
export function textoRecomendacion(mostrado: number | null, real: number): string {
  if (mostrado !== null) return `${conMiles(mostrado)} viajeros lo recomiendan`
  return real === 0 ? 'Sé el primero en recomendarlo' : 'Ya lo han recomendado viajeros'
}
