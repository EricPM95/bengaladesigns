/**
 * LA EDAD POR FRANJAS (V41). La primera vez ya no pregunta «¿En qué año naciste?» sino «¿Cuántos años tienes?», con seis franjas. Aquí vive todo lo puro (sin red ni base de datos), compartido por el servidor,
 * el panel y la app (la demo de desarrollo lo importa de aquí, como otros archivos de `server/`).
 *
 *   · Los seis valores que se guardan en `viajero_primera_vez.franja_edad` (migración 0094): '18-24', '25-34', '35-44', '45-54', '55-64' y '65+'.
 *   · Una respuesta VIEJA (solo `anio_nacimiento`) sale con su franja usando la edad de hoy = año actual − año de nacimiento (a propósito sin mirar el mes: no se guarda el día y la franja es una cifra aproximada).
 *   · Menores de 18: NO tienen franja (null). La app no tiene una franja «menos de 18» ni queremos apuntar a nadie en una franja que no es la suya; en el panel esa respuesta simplemente no cuenta en la edad.
 *   · La edad de hoy se INYECTA (`anioActual`): así las pruebas no dependen del día en que se pasan.
 */
export const FRANJAS_EDAD = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']

/** Cómo se llama cada franja para quien la lee (el panel pone «años» detrás; «65+» se dice «65 o más»). */
export const NOMBRE_FRANJA = { '18-24': '18-24', '25-34': '25-34', '35-44': '35-44', '45-54': '45-54', '55-64': '55-64', '65+': '65 o más' }

/** La franja de una edad en años: null si no llega a 18 o no es un número. */
export function franjaDeEdad(edad) {
  const e = Number(edad)
  if (!Number.isFinite(e) || e < 18) return null
  if (e <= 24) return '18-24'
  if (e <= 34) return '25-34'
  if (e <= 44) return '35-44'
  if (e <= 54) return '45-54'
  if (e <= 64) return '55-64'
  return '65+'
}

/** La franja de una persona que dio su AÑO de nacimiento (respuestas viejas). Año imposible (antes de 1900 o en el futuro) = null. */
export function franjaDeAnio(anio, anioActual = new Date().getFullYear()) {
  const a = Number(anio)
  if (anio === null || anio === undefined || anio === '' || !Number.isInteger(a) || a < 1900 || a > anioActual) return null
  return franjaDeEdad(anioActual - a)
}

/** El valor tal cual si es una de las seis franjas; si no, null. */
export const franjaValida = (valor) => (FRANJAS_EDAD.includes(valor) ? valor : null)

/** La franja de una fila de `viajero_primera_vez`: la guardada manda; si no hay (fila vieja o sin la 0094), la que sale de su año de nacimiento. */
export const franjaDeFila = (fila, anioActual = new Date().getFullYear()) => franjaValida(fila?.franja_edad) ?? franjaDeAnio(fila?.anio_nacimiento, anioActual)
