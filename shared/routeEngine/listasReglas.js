/**
 * Las comprobaciones de siempre (regla 13 del documento de días por paradas), en un solo sitio.
 *
 * Cuando el motor mueve, quita o mete una parada (una reserva, el pool, una experiencia, un cierre, «Si te sobra tiempo»), el día que sale tiene que cumplir:
 *   - sin zigzag: no se vuelve a menos de 300 m de una parada anterior después de alejarse más de 600 m;
 *   - la pirámide: se quita de abajo arriba y nunca un imprescindible la primera vez que sale en el viaje;
 *   - por dentro una sola vez en el viaje;
 *   - nada repetido (una parada no sale dos veces en un día);
 *   - se come y se cena donde acaba esa parte del día;
 *   - nada cerrado en su franja.
 * Si un cambio rompe alguna que antes no se rompía, el cambio no se hace. Las que ya rompe la lista escrita (el documento manda) no cuentan como nuevas.
 *
 * Este módulo solo MIRA: devuelve violaciones con una clave estable para poder compararlas antes y después de un cambio.
 */

export const ZIGZAG_VUELTA_M = 300
export const ZIGZAG_LEJOS_M = 600
/** Lo que más se anda de la última parada a la mesa para que cuente como «donde acaba». */
export const MESA_MAX_ANDAR_MIN = 20

/** Cuánto vale una parada para la pirámide: de ella depende qué se quita primero. Más es más importante. */
export function valorDe(item, nivelDe) {
  if (item.kind === 'comida' || item.kind === 'cena' || item.kind === 'noche') return 1000
  const nivel = nivelDe(item.lugar) ?? 3
  if (item.protegido) return nivel === 1 ? 100 : 80
  if (nivel === 1) return 100
  const base = nivel === 2 ? 50 : 10
  return item.modo === 'camino' ? base - 5 : base
}

export function crearReglas(env) {
  const { coordsOf, nivelDe, walk, meters } = env
  const esParada = (item) => item.kind === 'stop' && item.lugar && !item.llegada
  const clave = (regla, ...partes) => `${regla}:${partes.join('>')}`

  /** Algo que se podía ver al pasar: de camino, por fuera o de pocos minutos. Una visita con hora (una reserva, un turno) o larga no es eso: se vuelve a ella a propósito. */
  const sePodiaVerAlPasar = (item) => !item.hora && !item.hora_tipo && (item.modo === 'camino' || item.modo === 'fuera' || (item.min ?? 30) <= 20)
  /** El zigzag: volver cerca de lo que se dejó atrás para ver algo que se podía ver al pasar. Una parada que es el mismo lugar que la anterior no cuenta (la escalinata de la Plaza de España). */
  function zigzag(items) {
    const out = []
    const stops = items.filter(esParada).map((item) => ({ item, c: coordsOf(item) })).filter((s) => s.c)
    for (let j = 2; j < stops.length; j++) {
      if (!sePodiaVerAlPasar(stops[j].item)) continue
      for (let i = 0; i < j - 1; i++) {
        if (stops[i].item.lugar === stops[j].item.lugar) continue
        if (meters(stops[i].c, stops[j].c) >= ZIGZAG_VUELTA_M) continue
        let lejos = 0
        for (let k = i + 1; k < j; k++) lejos = Math.max(lejos, meters(stops[i].c, stops[k].c))
        if (lejos > ZIGZAG_LEJOS_M) out.push({ regla: 'zigzag', clave: clave('zigzag', stops[i].item.id, stops[j].item.id), texto: `«${stops[j].item.titulo ?? stops[j].item.lugar}» vuelve a menos de ${ZIGZAG_VUELTA_M} m de «${stops[i].item.titulo ?? stops[i].item.lugar}» después de alejarse ${Math.round(lejos)} m` })
      }
    }
    return out
  }

  /** Nada repetido en el día: la misma parada (mismo sitio, mismo modo de visita) no sale dos veces; de camino y por dentro/por fuera del mismo sitio sí pueden coincidir. */
  function repetidos(items) {
    const out = []
    const vistos = new Map()
    for (const item of items.filter(esParada)) {
      if (item.modo === 'camino') continue
      const k = `${item.lugar}|${item.titulo ?? ''}`
      if (vistos.has(k) && item.modo !== 'camino') out.push({ regla: 'repetido', clave: clave('repetido', item.lugar, item.titulo ?? ''), texto: `«${item.titulo ?? item.lugar}» sale dos veces el mismo día` })
      vistos.set(k, true)
    }
    return out
  }

  /** Por dentro una sola vez en el viaje: `vistos` son los sitios que un día anterior del viaje ya lleva por dentro. */
  function dentroUnaVez(items, dentroAntes) {
    const out = []
    const hoy = new Set()
    for (const item of items.filter(esParada)) {
      if (item.modo !== 'dentro') continue
      if (dentroAntes.has(item.lugar) || hoy.has(item.lugar)) out.push({ regla: 'dentro_dos_veces', clave: clave('dentro', item.lugar), texto: `«${item.lugar}» va por dentro más de una vez en el viaje` })
      hoy.add(item.lugar)
    }
    return out
  }

  /** La pirámide: lo que pasa a «Si te sobra tiempo» no es más importante que lo que se queda en su franja, y nunca un imprescindible la primera vez. */
  function piramide(items, spare, vistosAntes) {
    const out = []
    for (const quitada of spare) {
      const nivel = nivelDe(quitada.lugar) ?? 3
      if (nivel === 1 && !vistosAntes.has(quitada.lugar) && !quitada.camino_antes) out.push({ regla: 'imprescindible_quitado', clave: clave('imprescindible', quitada.lugar), texto: `«${quitada.lugar}» es un imprescindible y pasa a «Si te sobra tiempo» la primera vez` })
      const mia = valorDe(quitada, nivelDe)
      for (const resto of items.filter(esParada)) {
        if (resto.franja !== quitada.franja || resto.hora || resto.hora_tipo || resto.llegada || resto.protegido_fijo) continue
        if (valorDe(resto, nivelDe) < mia) out.push({ regla: 'piramide', clave: clave('piramide', quitada.lugar, resto.id), texto: `«${quitada.titulo ?? quitada.lugar}» se quita y «${resto.titulo ?? resto.lugar}», de menos importancia, se queda` })
      }
    }
    return out
  }

  /** Se come y se cena donde acaba esa parte del día: la mesa a pocos minutos andando de la parada anterior. */
  function mesas(items) {
    const out = []
    items.forEach((item, i) => {
      if (item.kind !== 'comida' && item.kind !== 'cena') return
      const c = coordsOf(item)
      const anterior = [...items.slice(0, i)].reverse().find((other) => other.kind === 'stop' && coordsOf(other))
      if (!c || !anterior) return
      const min = walk(coordsOf(anterior), c)
      if (min > MESA_MAX_ANDAR_MIN) out.push({ regla: 'mesa_lejos', clave: clave('mesa', item.id), texto: `la ${item.kind} (${item.restaurante}) queda a ${min} min andando de «${anterior.titulo ?? anterior.lugar}»` })
    })
    return out
  }

  /** Nada cerrado en su franja (todo el día cerrado, o cerrado todo el rato de su franja). */
  function cerrados(items) {
    const out = []
    for (const item of items.filter(esParada)) {
      if (item.modo === 'fuera' || item.modo === 'camino') continue
      if (env.cerradoEnFranja(item)) out.push({ regla: 'cerrado', clave: clave('cerrado', item.id), texto: `«${item.titulo ?? item.lugar}» está cerrado en su franja` })
    }
    return out
  }

  function todas(items, { spare = [], vistosAntes = new Set(), dentroAntes = new Set() } = {}) {
    return [...zigzag(items), ...repetidos(items), ...dentroUnaVez(items, dentroAntes), ...piramide(items, spare, vistosAntes), ...mesas(items), ...cerrados(items)]
  }
  /** Lo que `despues` rompe y `antes` no rompía. */
  function nuevas(antes, despues) {
    const conocidas = new Set(antes.map((v) => v.clave))
    return despues.filter((v) => !conocidas.has(v.clave))
  }
  return { zigzag, repetidos, dentroUnaVez, piramide, mesas, cerrados, todas, nuevas }
}
