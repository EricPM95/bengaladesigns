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

/**
 * Coordenadas de la Tanda 6h (tabla de PARA_CODE_TANDA6H.md): las del metro y las del tranvía son las de la estación o la parada; las del autobús son, casi todas, las del sitio de al lado
 * (a menos de 250 m de la parada), que vale para la regla de los 12 min andando. `directed`: una línea que solo se coge en ese sentido (el bus 23, cada sentido por una orilla): se sube en una
 * parada y se baja en otra que va DESPUÉS. `pos` sigue el orden del recorrido.
 */
const ROMA = [
  {
    name: 'Metro A',
    kind: 'metro',
    minutesPerStop: 2.5,
    stops: [
      { name: 'Ottaviano', pos: 0, coordinates: [41.90944, 12.45806] },
      { name: 'Flaminio', pos: 2, coordinates: [41.91194, 12.47583] },
      { name: 'Spagna', pos: 3, coordinates: [41.9065, 12.48306] },
      { name: 'Barberini', pos: 4, coordinates: [41.90389, 12.48889] },
      { name: 'Termini', pos: 6, coordinates: [41.9015, 12.5006] },
      { name: 'San Giovanni', pos: 9, coordinates: [41.88528, 12.50944] },
    ],
  },
  {
    name: 'Metro B',
    kind: 'metro',
    minutesPerStop: 2.5,
    stops: [
      { name: 'Termini', pos: 0, coordinates: [41.9015, 12.5006] },
      { name: 'Cavour', pos: 1, coordinates: [41.895, 12.49361] },
      { name: 'Colosseo', pos: 2, coordinates: [41.89139, 12.49139] },
      { name: 'Circo Massimo', pos: 3, coordinates: [41.88361, 12.48806] },
      { name: 'Piramide', pos: 4, coordinates: [41.87556, 12.48222] },
    ],
  },
  {
    name: 'Tranvía 8',
    kind: 'tranvia',
    minutesPerStop: 2.5,
    stops: [
      { name: 'Trastevere/Mastai (Viale Trastevere)', pos: 0, coordinates: [41.88758, 12.47294] },
      { name: 'Belli (Viale Trastevere)', pos: 1, coordinates: [41.89013, 12.47433] },
      { name: 'Torre Argentina (Via Arenula)', pos: 4, coordinates: [41.89533, 12.47641] },
      { name: 'Piazza Venezia', pos: 5, coordinates: [41.89528, 12.48121] },
    ],
  },
  {
    // Las paradas que comparten el 40 y el 64. (El 40 ya no llega a la Traspontina ni a Via della Conciliazione: acaba en el Lungotevere de Sassia, a unos 400 m.)
    name: 'Bus 40 y 64',
    kind: 'bus',
    minutesPerStop: 3,
    stops: [
      { name: 'Termini (Piazza dei Cinquecento)', pos: 0, coordinates: [41.90083, 12.50194] },
      { name: 'Piazza Venezia', pos: 3, coordinates: [41.8964, 12.4825] },
      { name: 'Largo di Torre Argentina', pos: 4, coordinates: [41.89528, 12.47694] },
      { name: 'Chiesa Nuova', pos: 6, coordinates: [41.89861, 12.46917] },
      { name: 'Lungotevere de Sassia (el Borgo)', pos: 8, coordinates: [41.90154, 12.46267] },
    ],
  },
  {
    // El 64 sigue hasta la estación de San Pietro, junto a la Plaza de San Pedro, y para en Sant'Andrea della Valle.
    name: 'Bus 64',
    kind: 'bus',
    minutesPerStop: 3,
    stops: [
      { name: 'Termini (Piazza dei Cinquecento)', pos: 0, coordinates: [41.90083, 12.50194] },
      { name: 'Piazza Venezia', pos: 3, coordinates: [41.8964, 12.4825] },
      { name: 'Largo di Torre Argentina', pos: 4, coordinates: [41.89528, 12.47694] },
      { name: "Sant'Andrea della Valle (Corso Vittorio)", pos: 5, coordinates: [41.89583, 12.47444] },
      { name: 'Chiesa Nuova', pos: 6, coordinates: [41.89861, 12.46917] },
      { name: 'Lungotevere de Sassia (el Borgo)', pos: 8, coordinates: [41.90154, 12.46267] },
      { name: 'Estación de San Pietro', pos: 11, coordinates: [41.89639, 12.45444] },
    ],
  },
  {
    // Bus 23 hacia el sur (Castillo → Pirámide), por la orilla de Trastevere: es el único sentido que pasa por Trastevere.
    name: 'Bus 23',
    kind: 'bus',
    directed: true,
    minutesPerStop: 3,
    stops: [
      { name: "Lungotevere de Sassia (el Castillo de Sant'Angelo)", pos: 0, coordinates: [41.90154, 12.46267] },
      { name: 'Lungotevere Sanzio (Trastevere)', pos: 5, coordinates: [41.89113, 12.47459] },
      { name: 'Lungotevere Alberteschi (la Isla Tiberina)', pos: 7, coordinates: [41.8908, 12.4772] },
      { name: 'Marmorata (Testaccio)', pos: 10, coordinates: [41.87956, 12.47706] },
      { name: 'Ostiense-Piramide', pos: 12, coordinates: [41.87667, 12.48139] },
    ],
  },
  {
    // Bus 23 hacia el norte (Pirámide → Castillo), por la otra orilla: NO pasa por Trastevere.
    name: 'Bus 23',
    kind: 'bus',
    directed: true,
    minutesPerStop: 3,
    stops: [
      { name: 'Ostiense-Piramide', pos: 0, coordinates: [41.87667, 12.48139] },
      { name: 'Marmorata (Testaccio)', pos: 2, coordinates: [41.87956, 12.47706] },
      { name: 'Lungotevere Aventino / Emporio', pos: 4, coordinates: [41.88326, 12.47523] },
      { name: 'Monte Savello (la Isla Tiberina)', pos: 7, coordinates: [41.8908, 12.4772] },
      { name: "Traspontina (el Castillo de Sant'Angelo)", pos: 13, coordinates: [41.90278, 12.46222] },
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
    // (Una línea con sentido: se sube en una parada y se baja en otra que va después. Se prueba cada pareja de paradas cercanas, no solo la más cercana de cada punta.)
    const candidatas = (point) => line.stops.map((stop, index) => ({ index, pos: stop.pos ?? index, name: stop.name, walk: walkMin(point, stop.coordinates) })).filter((candidate) => candidate.walk <= WALK_TO_LINE_MAX_MIN)
    for (const boarding of candidatas(a)) {
      for (const alighting of candidatas(b)) {
        if (boarding.index === alighting.index || (line.directed && alighting.pos <= boarding.pos)) continue
        const minutes = Math.round(boarding.walk + Math.abs(boarding.pos - alighting.pos) * line.minutesPerStop + alighting.walk)
        if (!best || minutes < best.minutes) best = { line: line.name, kind: line.kind, minutes, boardAt: boarding.name, alightAt: alighting.name }
      }
    }
  }
  return best
}
