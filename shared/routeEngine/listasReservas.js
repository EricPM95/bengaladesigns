/**
 * Reservas «solo lo escrito» (regla 17 del documento, Tanda 6e): cada reserva grande tiene su día escrito para cada tramo de hora, y el motor no se inventa otro.
 * Aquí se sabe, para un día (`dia`, de listas.json) y un sitio, qué horas tienen lista escrita, cuáles son «el día normal» y cuáles no tienen lista.
 * No mira relojes de visita ni distancias: solo las horas que el documento escribe (los `cuando.reserva` de las variantes y `dia.reservas`).
 */
const toMin = (hhmm) => Number(String(hhmm).split(':')[0]) * 60 + Number(String(hhmm).split(':')[1])
const hhmm = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

const SIN_SITIOS = new Set()
const cacheSitios = new WeakMap()

/**
 * Los sitios grandes de un destino (Tanda 6y10): los que tienen su día escrito por tramos de hora (regla 17); en un día que no los trae escritos, la hora no tiene lista.
 * Salen de los datos del destino (`sitios_grandes.lugares`: { nombre, del, el, dias, nunca_se_quita }); un destino que no trae el campo no tiene sitios grandes.
 * Devuelve un Set de nombres de lugar.
 */
export function sitiosGrandesDe(destData) {
  const lugares = destData?.sitios_grandes?.lugares
  if (!Array.isArray(lugares)) return SIN_SITIOS
  let set = cacheSitios.get(destData)
  if (!set) {
    set = new Set(lugares.map((sitio) => sitio?.nombre).filter((nombre) => typeof nombre === 'string'))
    cacheSitios.set(destData, set)
  }
  return set
}

/**
 * Las horas hasta las que un sitio grande NO cabe en un día con excursión de mañana (`sitios_grandes.lugares[].no_cabe_con_excursion_hasta`; en Roma, el Coliseo hasta las 16:30). Antes estaba escrito
 * en `claseDeReserva`. Devuelve { nombre: 'HH:MM' }; un destino que no lo marca no tiene límite.
 */
export function limitesConExcursionDe(destData) {
  const out = {}
  for (const sitio of destData?.sitios_grandes?.lugares ?? []) if (sitio?.nombre && typeof sitio.no_cabe_con_excursion_hasta === 'string') out[sitio.nombre] = sitio.no_cabe_con_excursion_hasta
  return out
}

/** La ficha de un sitio grande (`{ nombre, del, el, dias, nunca_se_quita }`), o null si el destino no lo marca como grande. */
export function sitioGrandeDe(destData, nombre) {
  return (destData?.sitios_grandes?.lugares ?? []).find((sitio) => sitio?.nombre === nombre) ?? null
}

/** Los tramos con lista escrita de un sitio en un día: [{ id, desde, hasta, horas }] (minutos desde las 0:00; sin duplicar los pares «el Foro después / antes»). */
export function tramosDeReserva(dia, lugar) {
  const tramos = []
  for (const variante of dia?.variantes ?? []) {
    for (const cuando of [].concat(variante.cuando ?? [])) {
      // (`reserva`: una; `reservas`: varias a la vez —el Free Tour y los Museos del D3—: cuenta la del sitio que se pregunta.)
      const r = cuando?.reserva ?? (cuando?.reservas ?? []).find((candidata) => candidata.lugar === lugar)
      if (!r || r.lugar !== lugar) continue
      const desde = r.desde ? toMin(r.desde) : 0
      const hasta = r.hasta ? toMin(r.hasta) : 24 * 60
      if (tramos.some((t) => t.desde === desde && t.hasta === hasta)) continue
      tramos.push({ id: variante.id, desde, hasta, horas: variante.horas ?? [] })
    }
  }
  return tramos
}

/** El «día normal» de ese sitio (sin variante): { desde, hasta } o null. */
export function tramoNormal(dia, lugar) {
  const n = dia?.reservas?.[lugar]?.normal
  if (!n) return null
  return { desde: n.desde ? toMin(n.desde) : 0, hasta: n.hasta ? toMin(n.hasta) : 24 * 60 }
}

/** ¿Este día tiene reservas escritas para ese sitio? */
export function tieneReservasEscritas(dia, lugar) {
  return Boolean(dia?.reservas?.[lugar]) || tramosDeReserva(dia, lugar).length > 0
}

/**
 * Qué lista tiene ese día para esa hora (Tanda 6u, regla 17: la app solo lo usa para montar el día; nunca propone otra hora). `contexto.sitiosGrandes`: el Set de `sitiosGrandesDe(destData)`; sin él, ningún sitio es grande.
 * `contexto.destData` (Tanda 7): los datos del destino. De ahí sale la regla de la excursión de mañana: un sitio grande con `no_cabe_con_excursion_hasta: "HH:MM"` no cabe
 * con una excursión de mañana si su reserva es a esa hora o antes (en Roma, el Coliseo: 16:30). Sin `destData` o sin el campo, no hay regla.
 */
export function claseDeReserva(dia, lugar, hora, contexto = {}) {
  if (!tieneReservasEscritas(dia, lugar)) return (contexto.sitiosGrandes ?? SIN_SITIOS).has(lugar) ? { clase: 'sin_lista' } : { clase: 'sin_definir' }
  const m = toMin(hora)
  const lim = dia?.reservas?.[lugar]?.no_cabe_antes
  if (contexto.tieneFreeTour && lim && m < toMin(lim)) return { clase: 'no_cabe', motivo: 'free_tour_museos', desde: lim }
  const hastaConExcursion = (contexto.limitesConExcursion ?? limitesConExcursionDe(contexto.destData))[lugar]
  if (contexto.excursionManana && hastaConExcursion && m <= toMin(hastaConExcursion)) return { clase: 'no_cabe', motivo: 'excursion_coliseo' }
  const tramo = tramosDeReserva(dia, lugar).find((t) => m >= t.desde && m <= t.hasta)
  if (tramo) return { clase: 'lista', tramo: tramo.id }
  const normal = tramoNormal(dia, lugar)
  if (normal && m >= normal.desde && m <= normal.hasta) return { clase: 'normal' }
  return { clase: 'sin_lista' }
}

export { toMin as reservaToMin, hhmm as reservaHhmm }
