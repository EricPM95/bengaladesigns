/**
 * Las líneas de transporte público de un destino (Tanda 6f, 4k): «Transporte público» solo se ofrece en un trayecto si existe una línea de verdad que une los dos sitios, con su número
 * («Tranvía 8 · 15 min», «Metro A · 10 min», «Bus 40 · 15 min»). Una línea cuenta si los dos sitios quedan a 8 min andando o menos de una parada de ella. El tiempo es la caminata
 * hasta la línea, el viaje y la caminata hasta el sitio. Sin línea, la opción no sale (nada de estimaciones de bus o metro).
 *
 * ROMA: la sección «Líneas de transporte público de Roma que usa la app» no está en DIAS_ROMA_PARADAS.md; estas son las líneas y paradas que la app conoce hoy (con coordenadas
 * aproximadas): hay que revisarlas y completarlas (PREGUNTAS_TANDA6F.md). Lo comparten el cliente (los trayectos) y los scripts (el informe).
 */
const WALK_TO_LINE_MAX_MIN = 8
const METERS_PER_WALK_MIN = 80
const WALK_FACTOR = 1.3

const ROMA = [
  {
    name: 'Metro A',
    kind: 'metro',
    minutesPerStop: 2.5,
    stops: [
      { name: 'Ottaviano', coordinates: [41.9086, 12.4574] },
      { name: 'Lepanto', coordinates: [41.9102, 12.4644] },
      { name: 'Flaminio', coordinates: [41.9117, 12.4764] },
      { name: 'Spagna', coordinates: [41.9061, 12.4824] },
      { name: 'Barberini', coordinates: [41.9035, 12.4888] },
      { name: 'Repubblica', coordinates: [41.9028, 12.4953] },
      { name: 'Termini', coordinates: [41.9009, 12.5018] },
      { name: 'Vittorio Emanuele', coordinates: [41.8956, 12.5052] },
      { name: 'Manzoni', coordinates: [41.8912, 12.5086] },
      { name: 'San Giovanni', coordinates: [41.8855, 12.5093] },
    ],
  },
  {
    name: 'Metro B',
    kind: 'metro',
    minutesPerStop: 2.5,
    stops: [
      { name: 'Termini', coordinates: [41.9009, 12.5018] },
      { name: 'Cavour', coordinates: [41.8957, 12.4924] },
      { name: 'Colosseo', coordinates: [41.8912, 12.493] },
      { name: 'Circo Massimo', coordinates: [41.883, 12.488] },
      { name: 'Piramide', coordinates: [41.8765, 12.4811] },
    ],
  },
  {
    name: 'Tranvía 8',
    kind: 'tranvia',
    minutesPerStop: 2.5,
    stops: [
      { name: 'Largo Argentina', coordinates: [41.8957, 12.4766] },
      { name: 'Arenula', coordinates: [41.8935, 12.4715] },
      { name: 'Belli', coordinates: [41.8905, 12.4696] },
      { name: 'Trastevere', coordinates: [41.8879, 12.4697] },
      { name: 'Induno', coordinates: [41.8845, 12.4675] },
    ],
  },
  {
    name: 'Bus 40',
    kind: 'bus',
    minutesPerStop: 3,
    stops: [
      { name: 'Termini', coordinates: [41.9009, 12.5018] },
      { name: 'Nazionale', coordinates: [41.9005, 12.4909] },
      { name: 'Piazza Venezia', coordinates: [41.8957, 12.4823] },
      { name: 'Largo Argentina', coordinates: [41.8957, 12.4766] },
      { name: 'Corso Vittorio Emanuele', coordinates: [41.8985, 12.4713] },
      { name: 'Piazza Pia (Vaticano)', coordinates: [41.9022, 12.4666] },
    ],
  },
  {
    name: 'Bus 23',
    kind: 'bus',
    minutesPerStop: 3,
    stops: [
      { name: 'Piramide', coordinates: [41.8765, 12.4811] },
      { name: 'Ponte Garibaldi (Isla Tiberina)', coordinates: [41.8913, 12.4742] },
      { name: 'Lungotevere Prati', coordinates: [41.906, 12.469] },
      { name: 'Castel Sant\'Angelo', coordinates: [41.9022, 12.4663] },
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
        .map((stop, index) => ({ index, walk: walkMin(point, stop.coordinates) }))
        .filter((candidate) => candidate.walk <= WALK_TO_LINE_MAX_MIN)
        .sort((x, y) => x.walk - y.walk)[0] ?? null
    const boarding = near(a)
    const alighting = near(b)
    if (!boarding || !alighting || boarding.index === alighting.index) continue
    const minutes = Math.round(boarding.walk + Math.abs(boarding.index - alighting.index) * line.minutesPerStop + alighting.walk)
    if (!best || minutes < best.minutes) best = { line: line.name, kind: line.kind, minutes }
  }
  return best
}
