/**
 * Reservas «solo lo escrito» (regla 17 del documento, Tanda 6e): cada reserva grande tiene su día escrito para cada tramo de hora, y el motor no se inventa otro.
 * Aquí se sabe, para un día (`dia`, de listas.json) y un sitio, qué horas tienen lista escrita, cuáles son «el día normal» y cuáles no tienen lista.
 * No mira relojes de visita ni distancias: solo las horas que el documento escribe (los `cuando.reserva` de las variantes y `dia.reservas`).
 */
const toMin = (hhmm) => Number(String(hhmm).split(':')[0]) * 60 + Number(String(hhmm).split(':')[1])
const hhmm = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

/** Las reservas grandes: las que tienen su día escrito por tramos de hora (regla 17). En un día que no las trae escritas, la hora no tiene lista. */
export const RESERVAS_GRANDES = new Set(['Coliseo', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese', 'Free Tour por Roma'])

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

/** Qué lista tiene ese día para esa hora (Tanda 6u, regla 17: la app solo lo usa para montar el día; nunca propone otra hora). */
export function claseDeReserva(dia, lugar, hora, contexto = {}) {
  if (!tieneReservasEscritas(dia, lugar)) return RESERVAS_GRANDES.has(lugar) ? { clase: 'sin_lista' } : { clase: 'sin_definir' }
  const m = toMin(hora)
  const lim = dia?.reservas?.[lugar]?.no_cabe_antes
  if (contexto.tieneFreeTour && lim && m < toMin(lim)) return { clase: 'no_cabe', motivo: 'free_tour_museos', desde: lim }
  if (contexto.excursionManana && lugar === 'Coliseo' && m <= 16 * 60 + 30) return { clase: 'no_cabe', motivo: 'excursion_coliseo' }
  const tramo = tramosDeReserva(dia, lugar).find((t) => m >= t.desde && m <= t.hasta)
  if (tramo) return { clase: 'lista', tramo: tramo.id }
  const normal = tramoNormal(dia, lugar)
  if (normal && m >= normal.desde && m <= normal.hasta) return { clase: 'normal' }
  return { clase: 'sin_lista' }
}

export { toMin as reservaToMin, hhmm as reservaHhmm }
