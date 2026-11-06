/**
 * El día de llegada y el de vuelta de un destino en coche (tanda LL, Lanzarote). Módulo puro: la hora útil, la fila de cada día y qué día de la tabla
 * hace ya la llegada. Las listas de cada fila y zona están en `data/dias/<destino>/_ll.json` (las genera scripts/destino/lanzaroteLlegadasDatos.mjs).
 *
 * Reglas de Eric (4-nov): hora útil = aterrizaje + 45 (salir con el equipaje) + 60 (recoger el coche de alquiler, solo si es de alquiler) + el trayecto
 * del aeropuerto a la zona + 60 (instalarse). Los imprescindibles grandes (D1, D2, DG) nunca el día de llegada ni el de vuelta.
 */
const hm = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m }
export const CONSTANTES_LL = { salir_aeropuerto_min: 45, recoger_coche_min: 60, instalarse_min: 60, devolver_coche_min: 30, aeropuerto_min: 120 }

/** La zona de la que se cuenta: la del viajero; sin zona, la que tiene el trayecto más largo desde el aeropuerto. */
export function zonaParaLlegada({ coche, zona, zonas }) {
  if (zona && coche.tiene(zona)) return zona
  return [...zonas].filter((z) => coche.tiene(z)).sort((a, b) => coche.min('aeropuerto_ace', b) - coche.min('aeropuerto_ace', a))[0] ?? null
}

/**
 * Hora útil en minutos. (6-nov) `recogidaMin`: la hora de recogida de la RESERVA del coche (RESERVAS). El coche no se recoge antes de que el viajero salga con el equipaje ni antes de la hora de su reserva: si la reserva es
 * más tarde que aterrizaje + salir, la hora útil cuenta desde la hora de la reserva. Sin reserva con hora (o con coche propio), igual que siempre.
 */
export function horaUtilMin({ aterrizaMin, alquiler, aZonaMin, k = CONSTANTES_LL, recogidaMin = null }) {
  const sale = aterrizaMin + k.salir_aeropuerto_min
  const empiezaARecoger = alquiler && Number.isFinite(recogidaMin) ? Math.max(sale, recogidaMin) : sale
  return empiezaARecoger + (alquiler ? k.recoger_coche_min : 0) + aZonaMin + k.instalarse_min
}

/** A (antes de las 11), B (11-13:59), C (hasta 1 h antes del atardecer), D (1 h a 30 min antes), E (hasta las 21:59), F (22:00 o más tarde). */
export function filaDeLlegadaLL(horaUtil, sol) {
  if (horaUtil < hm('11:00')) return 'A'
  if (horaUtil < hm('14:00')) return 'B'
  if (horaUtil < sol - 60) return 'C'
  if (horaUtil <= sol - 30) return 'D'
  if (horaUtil < hm('22:00')) return 'E'
  return 'F'
}

/** Fila de la vuelta según la hora del vuelo. */
export function filaDeVueltaLL(vueloMin) {
  if (vueloMin < hm('11:00')) return 'V0'
  if (vueloMin < hm('14:00')) return 'V1'
  if (vueloMin < hm('17:00')) return 'V2'
  if (vueloMin < hm('19:00')) return 'V3'
  if (vueloMin < hm('21:30')) return 'V4'
  return 'V5'
}

/**
 * El plan de la llegada: { aterrizaMin, horaUtil, fila, zona, absorbe ('D3'|'D4'|null), nocheLlegada }.
 * `aterriza` 'HH:MM'. null si no hay hora.
 */
export function planDeLlegadaLL({ aterriza, alquiler = true, coche, zona, zonas, sol, k = CONSTANTES_LL, recogida = null }) {
  if (!/^\d{1,2}:\d{2}$/.test(String(aterriza ?? ''))) return null
  const z = zonaParaLlegada({ coche, zona, zonas })
  if (!z) return null
  const aterrizaMin = hm(aterriza)
  const recogidaMin = /^\d{1,2}:\d{2}$/.test(String(recogida ?? '')) ? hm(recogida) : null
  const util = horaUtilMin({ aterrizaMin, alquiler, aZonaMin: coche.min('aeropuerto_ace', z), k, recogidaMin })
  const fila = filaDeLlegadaLL(util, sol)
  const absorbe = fila === 'A' || fila === 'B' ? (z === 'playa_blanca' ? 'D4' : 'D3') : null
  return { aterrizaMin, horaUtil: util, fila, zona: z, absorbe, nocheLlegada: fila === 'E' || fila === 'F' }
}

/**
 * El plan de la vuelta: { vueloMin, fila, zona, salirAntesMin, salirMin, limiteT1 (hora tope de estar con el coche devuelto en la T1), d3Corto }.
 * `d3Corto`: con el vuelo a las 17:00 o más tarde y el D3 aún dentro del viaje, su versión corta va el día de vuelta.
 */
export function planDeVueltaLL({ vuelo, coche, zona, zonas, salirAntesPorZona = {}, salirAntesDefecto = 165, k = CONSTANTES_LL, devolucion = null }) {
  if (!/^\d{1,2}:\d{2}$/.test(String(vuelo ?? ''))) return null
  const z = zonaParaLlegada({ coche, zona, zonas })
  const vueloMin = hm(vuelo)
  const salirAntesMin = (z && salirAntesPorZona[z]) ?? salirAntesDefecto
  // (6-nov) Con la hora de devolución de la reserva del coche, el coche tiene que estar devuelto ANTES de esa hora: si es más temprana que la que sale del vuelo, manda la de la reserva.
  const limiteDelVuelo = vueloMin - k.aeropuerto_min - k.devolver_coche_min
  const devolucionMin = /^\d{1,2}:\d{2}$/.test(String(devolucion ?? '')) ? hm(devolucion) : null
  const limiteT1 = devolucionMin != null ? Math.min(limiteDelVuelo, devolucionMin) : limiteDelVuelo
  return { vueloMin, fila: filaDeVueltaLL(vueloMin), zona: z, salirAntesMin, salirMin: vueloMin - salirAntesMin, limiteT1, ...(devolucionMin != null ? { devolucionMin } : {}), d3Corto: vueloMin >= hm('17:00') }
}
