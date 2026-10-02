// Un solo uso (3-oct-2026, PARA_CODE_DECISIONES_D1_D2_D4_FREE_TOUR, parte C): el Free Tour añadido después, en viajes de 3 días o más.
// El tour sustituye la parte del día que enseña lo mismo (variantes `free_tour_despues:<franja>` en D1 y D4):
//   - de mañana (10:00): la mañana del centro de D4 (Plaza de España, Via Condotti, Trinità…); Trevi temprano, a las 8:00; la Galería, con su orden de tarde;
//   - de tarde (17:00): la tarde del centro barroco de D1 (Navona, San Luigi, Campo de' Fiori…); el Panteón, por dentro, justo antes (el tour no entra);
//   - de noche: la nocturna del día (Trevi, Navona, Plaza de España iluminadas); el centro de día se queda y la cena va después del tour.
//   node scripts/destino/freeTourDespues.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const read = (id) => JSON.parse(readFileSync(`data/dias/roma/${id}.json`, 'utf8').replace(/\r\n/g, '\n'))
const write = (id, data) => writeFileSync(`data/dias/roma/${id}.json`, (JSON.stringify(data, null, 2) + '\n').replace(/\n/g, '\r\n'))
const TOUR = 'Free Tour Centro Histórico'
const tour = (hora) => ({ lugar: TOUR, tipo: 'fija', hora, min: 150, modo: 'parada' })
const PREAMBULO = 'Free Tour añadido después (3-oct-2026, PARA_CODE_DECISIONES_D1_D2_D4_FREE_TOUR). Lo que el tour ya enseña no se repite ese día. La hora de la parada del tour es solo un ejemplo: la que vale es la reservada.'

function d4() {
  const day = read('D4')
  day.variantes['free_tour_despues:manana'] = {
    _nota: `${PREAMBULO} De mañana (10:00): el tour sustituye la mañana del centro: Trevi temprano, a las 8:00, antes del tour; la Galería pasa a su orden de tarde. Se quita lo que el tour ya enseña (Via Condotti, Plaza de España, Trinità dei Monti) y lo que queda de la mañana al otro lado de la ciudad.`,
    usa_entrada: 'tarde',
    manana: {
      empieza: '07:30',
      quitar: ['Via Condotti', 'Via Condotti', 'Plaza de España', 'Trinità dei Monti', 'Piazza del Popolo', 'Santa Maria del Popolo', 'Ara Pacis'],
      ajustar: { 'Fontana de Trevi': { hora: '08:00', tipo: 'fija' } },
      insertar: [{ despues_de: 'Desayuno romano', parada: tour('10:00') }],
    },
  }
  day.variantes['free_tour_despues:noche'] = {
    _nota: `${PREAMBULO} De noche: el tour sustituye la nocturna de ese día (Trevi, Navona y Plaza de España iluminadas); el centro de día se queda y la cena va después del tour.`,
    noche: 'sin_paseo',
    'tarde.*': { insertar: [{ parada: tour('18:30') }] },
  }
  write('D4', day)
}

function d4m() {
  const day = read('D4M')
  day.variantes ??= {}
  day.variantes['free_tour_despues:manana'] = {
    _nota: `${PREAMBULO} De mañana (10:00): el tour sustituye la mañana del centro de D4M: Trevi temprano, a las 8:00, antes del tour; se quita lo que el tour ya enseña (Plaza de España, Via Condotti, San Ignacio) y lo que queda de la mañana al otro lado de la ciudad.`,
    manana: {
      empieza: '07:30',
      quitar: ['Iglesia de San Ignacio de Loyola', 'Via Condotti', 'Plaza de España', 'Trinità dei Monti', 'Piazza del Popolo', 'Santa Maria del Popolo', 'Terraza del Pincio', 'Parque de Villa Borghese'],
      ajustar: { 'Fontana de Trevi': { hora: '08:00', tipo: 'fija' } },
      insertar: [{ despues_de: 'Desayuno romano', parada: tour('10:00') }],
    },
  }
  write('D4M', day)
}

function d1() {
  const day = read('D1')
  day.variantes['free_tour_despues:tarde'] = {
    _nota: `${PREAMBULO} De tarde (17:00): el tour sustituye la tarde del centro barroco del día del Coliseo (Navona, San Luigi, Campo de' Fiori…); el Panteón, por dentro, justo antes (el tour no entra en los sitios).`,
    'tarde.*': {
      quitar: ['Iglesia de San Luigi dei Francesi', 'Iglesia de San Luigi dei Francesi', 'Piazza Navona', "Campo de' Fiori", 'Ponte Sisto', 'Iglesia del Gesù', 'Iglesia de Santa Maria sopra Minerva', 'Iglesia de Santa Maria sopra Minerva', 'Elefantino de Bernini', 'Elefantino de Bernini'],
      insertar: [{ parada: tour('17:00') }],
    },
    noche: 'sin_paseo',
  }
  day.variantes['free_tour_despues:noche'] = {
    _nota: `${PREAMBULO} De noche: el tour sustituye la nocturna de ese día; el centro de día se queda y la cena va después del tour.`,
    noche: 'sin_paseo',
    'tarde.*': { insertar: [{ parada: tour('18:30') }] },
  }
  write('D1', day)
}

d4()
d4m()
d1()
console.log('Free Tour añadido después: D1 y D4')
