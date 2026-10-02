// Un solo uso (3-oct-2026, PARA_CODE_DECISIONES_D1_D2_D4_FREE_TOUR, parte B): las decisiones del usuario sobre D1, D2 y D4 tras la medida por franja.
//   node scripts/destino/decisiones.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const read = (id) => JSON.parse(readFileSync(`data/dias/roma/${id}.json`, 'utf8').replace(/\r\n/g, '\n'))
const write = (id, data) => writeFileSync(`data/dias/roma/${id}.json`, (JSON.stringify(data, null, 2) + '\n').replace(/\n/g, '\r\n'))
const clone = (value) => JSON.parse(JSON.stringify(value))
const stop = (lugar, min, extra = {}) => ({ lugar, ...(min != null ? { min } : {}), ...extra })
const inside = (lugar, min, extra = {}) => stop(lugar, min, { modo: 'dentro', si_cerrado: 'fuera', ...extra })
const camino = (lugar, extra = {}) => stop(lugar, null, { modo: 'camino', ...extra })
const outside = (lugar, min, extra = {}) => stop(lugar, min, { modo: 'fuera', ...extra })
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const museos = (hora) => ({ lugar: MUSEOS, tipo: 'fija', hora, min: 180, modo: 'dentro', entrada: true, turno: true })
const BORGO = (extra = {}) => stop('Borgo Pio', 20, { titulo: 'Pasea y piérdete por Borgo Pio', elastica: 30, ...extra })

// ── D2 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function d2() {
  const day = read('D2')
  // Los Museos: el último turno online es siempre a las 16:00 (regla 4).
  day.entradas[MUSEOS].tarde = ['14:30', '16:00']
  // Orden 3 (13:00-14:00): comida rápida en Pizzarium (Bonci), a dos minutos de la entrada (punto 5; la comida se adapta a la reserva, regla 1).
  day.variantes['entrada:primera_tarde'].manana.comida = { restaurante: 'Pizzarium (Bonci)', alternativa: 'Borghiciana Pastificio Artigianale' }
  day.variantes['entrada:primera_tarde']._nota += ' La comida, rápida (30 min) desde las 12:00 en Pizzarium (Bonci), a dos minutos de los Museos.'
  // Miércoles con el orden 2 (punto 9): la mañana empieza a las 9:00 con el Puente Sant'Angelo, el Castillo por fuera y Borgo Pio (elástica).
  day.variantes['entrada:mediodia@miercoles'].manana = {
    empieza: '09:00',
    paradas: [stop("Puente Sant'Angelo", 10), outside("Castillo de Sant'Angelo", 20), BORGO({ elastica: 90 }), museos('12:00')],
    comida: { restaurante: 'Pizzarium (Bonci)', alternativa: 'Borghiciana Pastificio Artigianale' },
  }
  day.variantes['entrada:mediodia@miercoles']._nota = 'Miércoles con el orden 2: la Plaza y la Basílica no abren hasta las 12:30. La mañana empieza a las 9:00 con el Puente Sant\'Angelo, el Castillo por fuera y Borgo Pio (elástica); después, los Museos y la comida; la Plaza y la Basílica, después de comer. La Cúpula, ese día, no.'
  // Ponte Sisto y Plaza Trilussa (punto 10): una vez por viaje; 15 min en total (10 + 5); si se saltan, del Castillo a Santa Maria in Trastevere en el bus 23.
  const walk = (node) => {
    if (Array.isArray(node)) node.forEach(walk)
    else if (node && typeof node === 'object') {
      if (node.lugar === 'Ponte Sisto') Object.assign(node, { min: 10, una_vez: true, traslado_si_se_salta: { como: 'el bus 23 por el Lungotevere', min: 15 } })
      if (node.lugar === 'Plaza Trilussa') Object.assign(node, { min: 5, una_vez: true })
      Object.values(node).forEach(walk)
    }
  }
  walk(day)
  write('D2', day)
}

// ── D4 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function d4() {
  const day = read('D4')
  const baseStop = (name) => clone(day.manana.paradas.find((item) => item.lugar === name))
  const trevi = baseStop('Fontana de Trevi')
  const desayuno = baseStop('Desayuno romano')
  const trinita = baseStop('Trinità dei Monti')
  const galeria = (hora) => ({ ...baseStop('Galería Borghese'), hora })
  const comida = { restaurante: 'Edy', alternativa: 'Poldo e Gianna Osteria' }
  const cenaTridente = (hora) => ({ restaurante: 'Il Gabriello', alternativa: 'Sgarro Bistrot', hora })
  const parqueCamino = () => stop('Parque de Villa Borghese', 20, { elastica: 30, titulo: 'Camino de la Galería, por el parque y Piazza di Siena' })
  const parqueLago = (min = 30) => stop('Parque de Villa Borghese', min, { titulo: 'El lago y el Templo de Esculapio', elastica: 30 })
  const sinHora = (item) => {
    const copy = clone(item)
    delete copy.tipo
    delete copy.hora
    return copy
  }
  // Franjas (puntos 6 y 7): 9:00, 10:00, de siempre (11:00), 12:00-14:00, 15:00 y 15:30-17:45.
  day.entradas['Galería Borghese'] = { manana: ['10:30', '11:00'], nueve: ['09:00', '09:30'], diez: ['10:00', '10:29'], mediodia: ['12:00', '14:00'], quince: ['15:00', '15:29'], tarde: ['15:30', '17:45'] }
  day._nota_entradas = 'Entrada reservada a la Galería Borghese (3-oct-2026): `entrada:nueve` (9:00), `entrada:diez` (10:00), el orden de siempre (10:30-11:00), `entrada:mediodia` (12:00-14:00), `entrada:quince` (15:00) y `entrada:tarde` (15:30-17:45). La hora de la Galería de cada variante es solo un ejemplo: la que vale es la reservada.'
  // Lo que queda de la mañana de siempre por la tarde (Plaza de España, Trinità y, con la Galería lo primero, Trevi).
  const centroDeTarde = (version, conTrevi) => [
    ...(conTrevi ? [sinHora(trevi)] : []),
    stop('Via Condotti', 10),
    stop('Plaza de España', 20),
    clone(trinita),
    stop('Jardines del Pincio', 20),
    stop('Terraza del Pincio', version === 'D' ? 10 : null, version === 'D' ? {} : { modo: 'atardecer' }),
    stop('Piazza del Popolo', 10),
    inside('Santa Maria del Popolo', 25),
    ...(version === 'D' ? [inside('Ara Pacis', 45, { tipo: 'opcional' })] : []),
  ]
  const porVersion = (list) => Object.fromEntries(['A', 'B', 'C', 'D'].map((v) => [`tarde.${v}`, { empieza: '12:00', paradas: list(v), cena: cenaTridente(v === 'B' ? '20:00' : v === 'D' ? '20:30' : '19:30') }]))

  day.variantes['entrada:nueve'] = {
    _nota: 'Entrada a las 9:00: la Galería lo primero. Trevi, la Plaza de España y la Trinità dei Monti, por la tarde (la nocturna de Trevi no repite el mismo día si la visita fue por la tarde: regla 3).',
    manana: { empieza: '08:30', paradas: [galeria('09:00'), parqueCamino()], comida },
    ...porVersion((v) => centroDeTarde(v, true)),
  }
  day.variantes['entrada:diez'] = {
    _nota: 'Entrada a las 10:00: Trevi a las 8:00 y de ahí a la Galería (el tiempo de más es margen: regla 2). La Plaza de España y la Trinità dei Monti pasan a la tarde.',
    manana: { empieza: '07:30', paradas: [{ ...clone(trevi), hora: '08:00' }, desayuno, parqueCamino(), galeria('10:00')], comida },
    ...porVersion((v) => centroDeTarde(v, false)),
  }
  // Entrada a las 15:00 (punto 7): antes de la Galería, solo la comida y el Parque; los Jardines y la Terraza del Pincio, después, al atardecer.
  const manana15 = clone(day.variantes['entrada:tarde'].manana)
  day.variantes['entrada:quince'] = {
    _nota: 'Entrada a las 15:00: por la mañana lo de siempre (Trevi, Plaza de España, Tridente, Santa Maria del Popolo, Ara Pacis); antes de la Galería solo la comida y el Parque de Villa Borghese (elástica); los Jardines y la Terraza del Pincio, después, al atardecer.',
    manana: manana15,
    ...porVersion((v) => [parqueLago(40), galeria('15:00'), stop('Jardines del Pincio', 20), stop('Terraza del Pincio', null, v === 'A' ? { modo: 'atardecer', tipo: 'opcional' } : { modo: 'atardecer' })]),
  }
  // Zigzag del Tridente (punto 12): el paseo de la tarde de C y D, desde Piazza del Popolo por Via del Babuino y Via Margutta (no vuelve a Via Condotti ni a la Plaza de España).
  for (const version of ['C', 'D']) {
    day.tarde[version].paradas = day.tarde[version].paradas.map((item) => (item.titulo === 'Pasea y piérdete por el Tridente' ? stop('Via del Babuino', 30, { titulo: 'Pasea y piérdete por Via del Babuino y Via Margutta', no_calle: true, elastica: 30, una_vez: true, texto: 'Desde Piazza del Popolo, por Via del Babuino y Via Margutta: la calle de los artistas, con sus galerías y talleres, lejos del bullicio de la escalinata.' }) : item))
  }
  write('D4', day)
}

// ── D1 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function d1() {
  const day = read('D1')
  const variant = day.variantes['entrada:tarde']
  // La mañana empieza por el Foro Romano y Palatino a las 9:00; se sale hacia el Campidoglio y el Altar de la Patria, ya abierto (hacia las 11:00) (punto 8).
  const foro = (min, meses) => ({ lugar: 'Foro Romano y Palatino', tipo: 'fija', hora: '09:00', min, modo: 'dentro', entrada: true, si_cerrado: 'fuera', ...meses })
  variant.manana = {
    empieza: '09:00',
    paradas: [
      foro(100, { no_meses: [7, 8] }),
      foro(90, { meses: [7, 8] }),
      stop('Plaza del Campidoglio', 15, { tipo: 'opcional' }),
      camino('Plaza Venecia'),
      inside('Altar de la Patria', 40),
      camino('Via dei Fori Imperiali'),
      stop('Boca de la Verdad', 20, { tipo: 'opcional' }),
      stop('Circo Máximo', 20, { tipo: 'opcional' }),
    ],
    comida: { restaurante: 'Trattoria Monti', alternativa: 'La Taverna dei Fori Imperiali' },
  }
  // Piazza Navona no puede caerse (nivel 1): si no cabe por la tarde, va de noche después de cenar.
  variant.noche_si_cae = { lugar: 'Piazza Navona', noche: 'navona_y_fuentes' }
  variant._nota += ' La mañana empieza por el Foro y el Palatino a las 9:00 (abre a esa hora), sigue con el Campidoglio y el Altar de la Patria (ya abierto, hacia las 11:00). Piazza Navona no se cae: si no cabe por la tarde, va de noche, después de cenar.'
  write('D1', day)
}

d2()
d4()
d1()
console.log('decisiones aplicadas a D1, D2 y D4')
