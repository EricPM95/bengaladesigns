/**
 * Las líneas de transporte público de un destino (Tanda 6f, 4k; completadas en la 6g con la sección «Líneas de transporte público de Roma que usa la app» de DIAS_ROMA_PARADAS.md):
 * «Transporte público» solo se ofrece en un trayecto si existe una línea de verdad que une los dos sitios, con su número («Tranvía 8 · 15 min», «Metro A · 10 min», «Bus 40 y 64 · 15 min»).
 * Una línea cuenta si los dos sitios quedan a 12 min andando o menos de una parada de ella (en cada punta). El tiempo es la caminata hasta la línea, el viaje y la caminata hasta el sitio.
 * Sin línea, la opción no sale (nada de estimaciones de bus o metro): se queda andando o en taxi.
 *
 * ROMA: de momento solo estas líneas y estas paradas (las del documento); las coordenadas son aproximadas. `pos` es el número de parada a lo largo de la línea (cuenta también las
 * paradas intermedias que la app no enseña), para calcular lo que se tarda. Lo comparten el cliente (los trayectos) y los scripts (el informe).
 */
const WALK_TO_LINE_MAX_MIN = 12
const METERS_PER_WALK_MIN = 80
const WALK_FACTOR = 1.3

const ROMA = [
  {
    name: 'Metro A',
    kind: 'metro',
    minutesPerStop: 2.5,
    stops: [
      { name: 'Ottaviano', pos: 0, coordinates: [41.9086, 12.4574] },
      { name: 'Flaminio', pos: 2, coordinates: [41.9117, 12.4764] },
      { name: 'Spagna', pos: 3, coordinates: [41.9061, 12.4824] },
      { name: 'Barberini', pos: 4, coordinates: [41.9035, 12.4888] },
      { name: 'Termini', pos: 6, coordinates: [41.9009, 12.5018] },
      { name: 'San Giovanni', pos: 9, coordinates: [41.8855, 12.5093] },
    ],
  },
  {
    name: 'Metro B',
    kind: 'metro',
    minutesPerStop: 2.5,
    stops: [
      { name: 'Termini', pos: 0, coordinates: [41.9009, 12.5018] },
      { name: 'Cavour', pos: 1, coordinates: [41.8957, 12.4924] },
      { name: 'Colosseo', pos: 2, coordinates: [41.8912, 12.493] },
      { name: 'Circo Massimo', pos: 3, coordinates: [41.883, 12.488] },
      { name: 'Piramide', pos: 4, coordinates: [41.8765, 12.4811] },
    ],
  },
  {
    name: 'Tranvía 8',
    kind: 'tranvia',
    minutesPerStop: 2.5,
    stops: [
      { name: 'Trastevere (Viale Trastevere)', pos: 0, coordinates: [41.8828, 12.4693] },
      { name: 'Largo di Torre Argentina', pos: 4, coordinates: [41.8957, 12.4766] },
      { name: 'Piazza Venezia', pos: 5, coordinates: [41.8957, 12.4823] },
    ],
  },
  {
    name: 'Bus 40 y 64',
    kind: 'bus',
    minutesPerStop: 3,
    stops: [
      { name: 'Termini', pos: 0, coordinates: [41.9009, 12.5018] },
      { name: 'Piazza Venezia', pos: 3, coordinates: [41.8957, 12.4823] },
      { name: 'Largo di Torre Argentina', pos: 4, coordinates: [41.8957, 12.4766] },
      { name: 'Corso Vittorio Emanuele', pos: 5, coordinates: [41.8985, 12.4713] },
      { name: 'El Borgo y San Pedro', pos: 7, coordinates: [41.9022, 12.4666] },
    ],
  },
  {
    name: 'Bus 23',
    kind: 'bus',
    minutesPerStop: 3,
    stops: [
      { name: "Castillo de Sant'Angelo (Lungotevere)", pos: 0, coordinates: [41.9022, 12.4663] },
      { name: 'Isla Tiberina', pos: 4, coordinates: [41.8913, 12.4742] },
      { name: 'Trastevere (Lungotevere)', pos: 6, coordinates: [41.8886, 12.4721] },
      { name: 'Testaccio', pos: 9, coordinates: [41.8795, 12.4770] },
    ],
  },
]


const LINES = { roma: ROMA }

const meters = (a, b) => {
  const rad = Math.PI / 180
  const dLat = (b[0] - a[0]) * rad
  const dLng = (b[1] - a[1]) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}
const walkMin = (a, b) => Math.round((meters(a, b) * WALK_FACTOR) / METERS_PER_WALK_MIN)
const keyOf = (city) => String(city ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** La mejor línea real entre dos puntos [lat, lng], o null si no hay ninguna (entonces «Transporte público» no se ofrece). */
export function findTransitLine(city, a, b) {
  const lines = LINES[keyOf(city)]
  if (!lines || !a || !b) return null
  let best = null
  for (const line of lines) {
    const near = (point) =>
      line.stops
        .map((stop, index) => ({ index, pos: stop.pos ?? index, walk: walkMin(point, stop.coordinates) }))
        .filter((candidate) => candidate.walk <= WALK_TO_LINE_MAX_MIN)
        .sort((x, y) => x.walk - y.walk)[0] ?? null
    const boarding = near(a)
    const alighting = near(b)
    if (!boarding || !alighting || boarding.index === alighting.index) continue
    const minutes = Math.round(boarding.walk + Math.abs(boarding.pos - alighting.pos) * line.minutesPerStop + alighting.walk)
    if (!best || minutes < best.minutes) best = { line: line.name, kind: line.kind, minutes }
  }
  return best
}
