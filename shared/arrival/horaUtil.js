/**
 * LA HORA ÚTIL DE LLEGADA Y LA HORA DE IRSE (tanda LL, parte 2, Roma; decisión de Eric, 4-nov-2026). UNA SOLA CUENTA para el motor, la tarjeta, los logros y el día de prueba.
 *
 *   hora útil   = aterrizas (o llegas) + salir del punto (45 min en cualquier aeropuerto; 10 en una estación; 45 en el puerto) + trayecto hasta la zona del alojamiento + instalarse (60)
 *   hora de irse = vuelo − 2 h de aeropuerto (30 min en tren o autobús; 2 h en barco) − trayecto desde la zona al punto − 30 min para recoger la maleta
 *
 * Los números salen de los datos del destino (`_llegada.json › hora_util`, y `destination_config.llegada.instalarse_min`): aquí no hay nada de Roma. Sin esos datos (otro destino) vale la
 * cuenta de antes: llegada + traslado al centro del punto + 30 min («libre») y vuelo − margen del punto.
 * Módulo PURO (sin Node, sin React): lo usan shared/routeEngine/llegadaDia1.js y vueltaDia.js y, por el cliente, src/lib (diaDeVuelta.ts y la tarjeta de llegada sin pase).
 *
 * Nada de esto se enseña como hora calculada, salvo la frase de la tarjeta de llegada SIN pase, que solo informa: «Con tu vuelo estarás libre hacia las 17:30» (`fraseLibreHacia`).
 */

const aMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** «Aún no lo sé» y una zona sin datos cuentan como la zona de referencia del destino (Roma: el Centro). */
export const ZONA_DE_REFERENCIA = 'centro'

/** La columna de la tabla de trayectos de un punto: fco, cia, termini, tiburtina (también la estación de autobuses), civitavecchia. */
export function columnaDePunto(info, puntoId, medio = 'avion') {
  const porId = { fco: 'fco', cia: 'cia', termini: 'termini', tiburtina: 'tiburtina', tibus: 'tiburtina', civitavecchia: 'civitavecchia', civ: 'civitavecchia' }
  if (puntoId && porId[puntoId]) return porId[puntoId]
  // Sin punto (un viaje viejo): el del traslado más largo de ese medio, como siempre (avión: Fiumicino; tren: Tiburtina; autobús: Tiburtina; barco: Civitavecchia).
  const puntos = info?.medios?.[medio]?.puntos ?? []
  const mayor = puntos.reduce((a, b) => ((b.al_centro_min ?? 0) > (a?.al_centro_min ?? -1) ? b : a), null)
  return porId[mayor?.id] ?? null
}

/** Minutos de salir del punto con el equipaje (45 en un aeropuerto, siempre). null si el destino no tiene la tabla. */
export function salirDelPuntoMin(info, puntoId, medio = 'avion') {
  const tabla = info?.hora_util?.salir_del_punto_min
  if (!tabla) return null
  const col = columnaDePunto(info, puntoId, medio)
  const v = tabla[col] ?? tabla[puntoId]
  return Number.isFinite(v) ? v : null
}

/** Minutos de trayecto puerta a puerta entre el punto y la zona del alojamiento (la tabla 5.1). null si no hay tabla o el punto no está en ella. */
export function trayectoAZonaMin(info, puntoId, zona, medio = 'avion') {
  const tabla = info?.hora_util?.trayectos
  if (!tabla) return null
  const col = columnaDePunto(info, puntoId, medio)
  const fila = tabla[zona && tabla[zona] ? zona : (info.hora_util.zona_de_referencia ?? ZONA_DE_REFERENCIA)] ?? null
  const v = fila?.[col]
  return Number.isFinite(v) ? v : null
}

/** La zona que se usa de verdad: la del viajero si está en la tabla; si no («nose», sin zona), la de referencia. */
export function zonaDeCuenta(info, zona) {
  const tabla = info?.hora_util?.trayectos
  return zona && tabla?.[zona] ? zona : info?.hora_util?.zona_de_referencia ?? ZONA_DE_REFERENCIA
}

/**
 * La hora útil, en minutos desde las 0:00 (puede pasar de 1440). Redondeada hacia arriba de 5 en 5.
 * @param {{ info: object, medio?: string, puntoId?: string|null, zona?: string|null, aterrizaMin: number, instalarseMin?: number, extraMin?: number }} c
 *   `info`: _llegada.json. `instalarseMin`: `destination_config.llegada.instalarse_min` (60). `extraMin`: lo de antes (30) cuando el destino no tiene la tabla.
 * @returns {{ min: number, salirMin: number, trayectoMin: number, instalarseMin: number, conTabla: boolean }}
 */
export function horaUtilMin({ info, medio = 'avion', puntoId = null, zona = null, aterrizaMin, instalarseMin = 60, extraMin = 30 }) {
  const salir = salirDelPuntoMin(info, puntoId, medio)
  const trayecto = trayectoAZonaMin(info, puntoId, zona, medio)
  if (salir == null || trayecto == null) {
    // Sin la tabla del destino: la cuenta de antes (llegada + traslado del punto al centro + maleta). Se redondea igual.
    const puntos = info?.medios?.[medio]?.puntos ?? []
    const punto = puntos.find((p) => p.id === puntoId) ?? puntos.reduce((a, b) => ((b.al_centro_min ?? 0) > (a?.al_centro_min ?? -1) ? b : a), null)
    const bruto = aterrizaMin + (punto?.al_centro_min ?? 0) + extraMin
    return { min: bruto, salirMin: 0, trayectoMin: punto?.al_centro_min ?? 0, instalarseMin: extraMin, conTabla: false }
  }
  const bruto = aterrizaMin + salir + trayecto + instalarseMin
  return { min: Math.ceil(bruto / 5) * 5, salirMin: salir, trayectoMin: trayecto, instalarseMin, conTabla: true }
}

/**
 * La hora de irse del alojamiento, en minutos desde las 0:00 (negativa = la noche de antes). Redondeada hacia ABAJO de 5 en 5 (nunca se llega tarde).
 * @param {{ info: object, medio?: string, puntoId?: string|null, zona?: string|null, vueloMin: number, margenAntiguoMin?: number }} c
 *   `medio`: 'avion' | 'tren' | 'bus' | 'ferry'. `margenAntiguoMin`: el margen de siempre del punto (vale cuando el destino no tiene la tabla).
 * @returns {{ irseMin: number, margenMin: number, aeropuertoMin: number, trayectoMin: number, maletaMin: number, conTabla: boolean }}
 */
export function horaDeIrseMin({ info, medio = 'avion', puntoId = null, zona = null, vueloMin, margenAntiguoMin = 180 }) {
  const cfg = info?.hora_util
  const trayecto = trayectoAZonaMin(info, puntoId, zona, medio)
  const antes = cfg?.antes_del_billete_min?.[medio]
  if (!cfg || trayecto == null || !Number.isFinite(antes)) {
    return { irseMin: vueloMin - margenAntiguoMin, margenMin: margenAntiguoMin, aeropuertoMin: margenAntiguoMin, trayectoMin: 0, maletaMin: 0, conTabla: false }
  }
  const maleta = Number.isFinite(cfg.maleta_min) ? cfg.maleta_min : 30
  const bruto = vueloMin - antes - trayecto - maleta
  const irse = Math.floor(bruto / 5) * 5
  return { irseMin: irse, margenMin: vueloMin - irse, aeropuertoMin: antes, trayectoMin: trayecto, maletaMin: maleta, conTabla: true }
}

/**
 * «Con tu vuelo estarás libre hacia las 17:30»: la frase de la tarjeta de llegada SIN pase (solo informa; no mueve nada). Con la hora útil en minutos (`horaUtilMin().min`).
 * Pasada la medianoche (o desde las 23:00) no hay «libre hacia»: null (la tarjeta no dice nada).
 */
export function fraseLibreHacia(horaUtil) {
  if (!Number.isFinite(horaUtil) || horaUtil >= 24 * 60) return null
  const m = Math.ceil(horaUtil / 5) * 5
  return `Con tu vuelo estarás libre hacia las ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

/** Atajo para el cliente: la hora útil desde la hora «HH:MM» del billete. null si no hay hora. */
export function horaUtilDeBillete({ info, medio = 'avion', puntoId = null, zona = null, hora, instalarseMin = 60 }) {
  const a = aMin(hora)
  return a == null ? null : horaUtilMin({ info, medio, puntoId, zona, aterrizaMin: a, instalarseMin })
}
