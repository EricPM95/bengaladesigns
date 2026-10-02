// Un solo uso (3-oct-2026, PARA_CODE_D1_D2_D4_SEGUNDO_ORDEN): escribe en D1, D2 y D4 los órdenes nuevos según la hora de la entrada reservada
// (variantes `entrada:<franja>`, con las franjas como dato del día en `entradas`) y tapa los huecos que midió la prueba.
// Los ficheros se leen, se cambian como objetos y se vuelven a escribir con el mismo formato (2 espacios, CRLF).
//   node scripts/destino/segundoOrden.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const read = (id) => JSON.parse(readFileSync(`data/dias/roma/${id}.json`, 'utf8').replace(/\r\n/g, '\n'))
const write = (id, data) => writeFileSync(`data/dias/roma/${id}.json`, (JSON.stringify(data, null, 2) + '\n').replace(/\n/g, '\r\n'))
const clone = (value) => JSON.parse(JSON.stringify(value))

// ── Paradas que se repiten ───────────────────────────────────────────────────────────────────────────────────────────────────
const stop = (lugar, min, extra = {}) => ({ lugar, ...(min != null ? { min } : {}), ...extra })
const inside = (lugar, min, extra = {}) => stop(lugar, min, { modo: 'dentro', si_cerrado: 'fuera', ...extra })
const camino = (lugar, extra = {}) => stop(lugar, null, { modo: 'camino', ...extra })
const outside = (lugar, min, extra = {}) => stop(lugar, min, { modo: 'fuera', ...extra })
const MUSEOS = 'Museos Vaticanos y Capilla Sixtina'
const museos = (hora) => ({ lugar: MUSEOS, tipo: 'fija', hora, min: 180, modo: 'dentro', entrada: true, turno: true })
const cena = (restaurante, alternativa, hora) => ({ restaurante, alternativa, hora })
const TONNARELLO = (hora) => cena('Tonnarello', 'Trattoria Da Enzo al 29', hora)
const ARCANGELO = (hora) => cena("L'Arcangelo", 'Tonnarello', hora)
const BORGO = (extra = {}) => stop('Borgo Pio', 20, { titulo: 'Pasea y piérdete por Borgo Pio', elastica: 30, ...extra })
const JANICULO_TEXTO = 'Desde la balaustrada del Piazzale Garibaldi tienes Roma entera delante, cúpula a cúpula: con la luz de la tarde se distinguen el Panteón, Sant\'Andrea della Valle y el Altar de la Patria. Aquí arriba se está fresco y sin prisa.'
const PUENTE_TEXTO = 'Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo.'
const SISTO_TRILUSSA = () => [stop('Ponte Sisto', 10), stop('Plaza Trilussa', 10)]
const BUS_JANICULO = { como: 'el bus 115 o el 870 (desde Via Paola, junto al puente Vittorio Emanuele II, hasta el Piazzale Garibaldi)', min: 20 }
const STA_MARIA_TRASTEVERE = (extra = {}) => inside('Iglesia de Santa Maria in Trastevere', 20, extra)
const TEMPIETTO = (min = 20, extra = {}) => inside('San Pietro in Montorio y Tempietto de Bramante', min, extra)

// ── D2 · Vaticano ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
function d2() {
  const day = read('D2')
  day.entradas = { [MUSEOS]: { manana: ['08:00', '11:00'], mediodia: ['11:30', '12:30'], primera_tarde: ['13:00', '14:00'], tarde: ['14:30', '18:00'] } }
  day._nota_entradas = 'Entrada reservada a los Museos (3-oct-2026, PARA_CODE_D1_D2_D4_SEGUNDO_ORDEN): el orden de siempre sirve de 8:00 a 11:00; `entrada:mediodia` (11:30-12:30), `entrada:primera_tarde` (13:00-14:00) y `entrada:tarde` (14:30-18:00) son los órdenes nuevos. La hora de la parada de los Museos de cada variante es solo un ejemplo: la que vale es la reservada (siempre se llega 30 min antes). Lo que cambia en un día de la semana con cada orden va en `entrada:<franja>@<día>`.'

  // — Los huecos del orden de siempre (medidos por Code) —
  // A (comida → Borgo Pio, hasta 57 min): el paseo de Borgo Pio absorbe más.
  day.tarde.A.paradas = day.tarde.A.paradas.map((item) => (item.lugar === 'Borgo Pio' ? { ...item, elastica: 45 } : item))
  // B y C: Conciliazione → Puente → Castillo por fuera → Ponte Sisto y Plaza Trilussa → Santa Maria in Trastevere → Tempietto → Fontana → Janículo (elástica 30) → Trastevere.
  const subida = (version) => [
    camino('Via della Conciliazione'),
    stop('Puente Sant\'Angelo', 10),
    outside('Castillo de Sant\'Angelo', 20),
    ...SISTO_TRILUSSA(),
    STA_MARIA_TRASTEVERE(),
    TEMPIETTO(version === 'B' ? 20 : 15),
    stop('Fontana dell\'Acqua Paola', version === 'B' ? 10 : 15),
    stop('Mirador del Janículo', null, { modo: 'atardecer', elastica: 30, ...(version === 'C' ? { lead: 45 } : {}) }),
    stop('Trastevere', 30),
  ]
  day.tarde.B.paradas = subida('B')
  day.tarde.C.paradas = subida('C')
  // D: Tempietto → Fontana → Janículo → bajada por Santa Maria in Trastevere → Trastevere (elástica) → Ponte Sisto → Castillo por fuera → Puente al atardecer → cena en el Borgo.
  const bajada = () => [
    TEMPIETTO(),
    stop('Fontana dell\'Acqua Paola', 15),
    stop('Mirador del Janículo', 20, { texto: JANICULO_TEXTO }),
    STA_MARIA_TRASTEVERE(),
    stop('Trastevere', 45, { titulo: 'Pasea y piérdete por Trastevere', elastica: 30 }),
    stop('Ponte Sisto', 10),
    outside('Castillo de Sant\'Angelo', 20),
    stop('Puente Sant\'Angelo', null, { modo: 'atardecer', lead: 55, texto: PUENTE_TEXTO }),
  ]
  day.tarde.D.paradas = bajada()

  // — Orden 2 · entrada de 11:30 a 12:30 —
  const tardeA2 = () => [camino('Via della Conciliazione'), stop('Puente Sant\'Angelo', 10, { modo: 'atardecer', lead: 30, texto: PUENTE_TEXTO }), outside('Castillo de Sant\'Angelo', 20), STA_MARIA_TRASTEVERE(), stop('Trastevere', 45)]
  const manana2 = (extra = []) => [stop('Plaza de San Pedro', 20), inside('Basílica de San Pedro', 60), inside('Cúpula de San Pedro', 45, { tipo: 'opcional', entrada: true }), ...extra, BORGO({ elastica: 90 }), museos('12:00')]
  const orden2 = {
    _nota: 'Orden 2 (entrada de 11:30 a 12:30): la Plaza, la Basílica y la Cúpula a primera hora, Borgo Pio que absorbe hasta llegar a los Museos, y comida al salir (puede ser a las 15:00 o las 15:30: la hora la eligió el viajero). Tarde: en A, el Puente Sant\'Angelo al atardecer con el Castillo por fuera; en B, C y D, las de siempre.',
    manana: { empieza: '07:30', paradas: manana2(), comida: { restaurante: 'Pizzarium (Bonci)', alternativa: 'Borghiciana Pastificio Artigianale' } },
    'tarde.A': { empieza: '12:00', paradas: tardeA2(), cena: TONNARELLO('20:00') },
    'tarde.B': { empieza: '12:00', paradas: subida('B'), cena: TONNARELLO('20:30') },
    'tarde.C': { empieza: '12:00', paradas: subida('C'), cena: TONNARELLO('19:30') },
    'tarde.D': { empieza: '12:00', paradas: bajada(), cena: ARCANGELO('20:30'), noche: 'centro_iluminado', barrio_cena: 'vaticano' },
  }

  // — Orden 3 · entrada de 13:00 a 14:00 —
  const manana3 = [stop('Plaza de San Pedro', 20), inside('Basílica de San Pedro', 60), inside('Cúpula de San Pedro', 45, { tipo: 'opcional', entrada: true }), camino('Via della Conciliazione'), stop('Puente Sant\'Angelo', 10), outside('Castillo de Sant\'Angelo', 20), BORGO({ elastica: 60 })]
  const orden3 = {
    _nota: 'Orden 3 (entrada de 13:00 a 14:00): por la mañana la Plaza, la Basílica, la Cúpula, el Puente y el Castillo por fuera y Borgo Pio (que absorbe); comida antes de la entrada (Borghiciana o 200 Gradi) y los Museos de tarde. Después, según la luz: en A, sin atardecer (sales de noche); en B, el Janículo al atardecer subiendo en bus; en C y D, el Tempietto, la Fontana y el Janículo.',
    manana: { empieza: '07:30', paradas: manana3, comida: { restaurante: 'Borghiciana Pastificio Artigianale', alternativa: '200 Gradi' } },
    'tarde.A': { empieza: '12:00', paradas: [museos('13:30'), STA_MARIA_TRASTEVERE(), stop('Trastevere', 45)], cena: TONNARELLO('20:30') },
    'tarde.B': { empieza: '12:00', paradas: [museos('13:30'), stop('Mirador del Janículo', null, { modo: 'atardecer', traslado: BUS_JANICULO }), TEMPIETTO(20, { modo: 'fuera' }), STA_MARIA_TRASTEVERE(), stop('Trastevere', 45)], cena: TONNARELLO('20:30') },
    'tarde.C': { empieza: '12:00', paradas: [museos('13:30'), TEMPIETTO(15), stop('Fontana dell\'Acqua Paola', 15), stop('Mirador del Janículo', null, { modo: 'atardecer' }), STA_MARIA_TRASTEVERE(), stop('Trastevere', 45)], cena: TONNARELLO('20:30') },
    'tarde.D': { empieza: '12:00', paradas: [museos('13:30'), TEMPIETTO(15), stop('Fontana dell\'Acqua Paola', 15), stop('Mirador del Janículo', null, { modo: 'atardecer' }), STA_MARIA_TRASTEVERE(), stop('Trastevere', 45)], cena: TONNARELLO('21:00') },
  }

  // — Orden 4 · entrada de 14:30 a 18:00 —
  const manana4 = [
    stop('Plaza de San Pedro', 20),
    inside('Basílica de San Pedro', 60),
    inside('Cúpula de San Pedro', 45, { entrada: true }),
    camino('Via della Conciliazione'),
    stop('Puente Sant\'Angelo', 10),
    outside('Castillo de Sant\'Angelo', 20),
    ...SISTO_TRILUSSA(),
    STA_MARIA_TRASTEVERE(),
    TEMPIETTO(20),
    stop('Fontana dell\'Acqua Paola', 10),
    stop('Mirador del Janículo', 20, { texto: JANICULO_TEXTO }),
  ]
  const museos4 = { ...museos('15:00'), traslado: { como: 'el bus 23 por el Lungotevere o andando', min: 30 } }
  const tarde4 = (atardecer) => [museos4, ...(atardecer ? [stop('Puente Sant\'Angelo', null, { modo: 'atardecer', lead: 55, texto: PUENTE_TEXTO, tipo: 'opcional' })] : [])]
  const orden4 = {
    _nota: 'Orden 4 (entrada de 14:30 a 18:00): la Plaza, la Basílica y la Cúpula a primera hora; el Janículo y Trastevere, de día; los Museos, por la tarde (hasta el cierre, 20:00, como mucho); y la cena en el Borgo. El atardecer solo en D, si sales antes de la puesta: el Puente Sant\'Angelo. En A, B y C, el viajero manda: sin atardecer. Noche: el Castillo y el Puente iluminados.',
    manana: { empieza: '07:30', paradas: manana4, comida: { restaurante: 'Tonnarello', alternativa: 'Trattoria Da Enzo al 29' } },
    'tarde.A': { empieza: '12:00', paradas: tarde4(false), cena: ARCANGELO('20:30'), noche: 'centro_iluminado', barrio_cena: 'vaticano' },
    'tarde.B': { empieza: '12:00', paradas: tarde4(false), cena: ARCANGELO('20:30'), noche: 'centro_iluminado', barrio_cena: 'vaticano' },
    'tarde.C': { empieza: '12:00', paradas: tarde4(false), cena: ARCANGELO('20:30'), noche: 'centro_iluminado', barrio_cena: 'vaticano' },
    'tarde.D': { empieza: '12:00', paradas: tarde4(true), cena: ARCANGELO('20:30'), noche: 'centro_iluminado', barrio_cena: 'vaticano' },
  }

  // — Días de la semana con cada orden —
  const sinTempietto = { cambiar: { 'San Pietro in Montorio y Tempietto de Bramante': { lugar: 'San Pietro in Montorio y Tempietto de Bramante', modo: 'fuera' } } }
  const lunes = { _nota: 'Lunes: el Tempietto cierra (por fuera) y el Castillo ya va por fuera.', manana: sinTempietto, 'tarde.*': sinTempietto }
  // Miércoles (audiencia: la Plaza y la Basílica no abren a los turistas hasta las 12:30).
  const mie2 = {
    _nota: 'Miércoles con el orden 2: Borgo Pio por la mañana, los Museos y la comida; la Plaza y la Basílica, después de comer. La Cúpula, ese día, no.',
    manana: { empieza: '07:30', paradas: [BORGO({ elastica: 90 }), museos('12:00')], comida: { restaurante: 'Pizzarium (Bonci)', alternativa: 'Borghiciana Pastificio Artigianale' } },
    'tarde.*': { insertar: [{ al_principio: true, parada: inside('Basílica de San Pedro', 60) }, { al_principio: true, parada: stop('Plaza de San Pedro', 25) }] },
  }
  const mie3 = {
    _nota: 'Miércoles con el orden 3: por la mañana, el Puente, el Castillo y Borgo Pio; la Plaza y la Basílica, a las 12:30, antes de comer.',
    manana: { empieza: '07:30', paradas: [stop('Puente Sant\'Angelo', 10), outside('Castillo de Sant\'Angelo', 20), BORGO({ elastica: 60 }), stop('Plaza de San Pedro', 20, { tipo: 'fija', hora: '12:30' }), inside('Basílica de San Pedro', 60)], comida: { restaurante: 'Borghiciana Pastificio Artigianale', alternativa: '200 Gradi' } },
  }
  const mie4 = {
    _nota: 'Miércoles con el orden 4: la mañana empieza por el Puente y el Castillo y sigue con Trastevere y el Janículo. La Plaza y la Basílica, después de comer y antes de los Museos, solo si la entrada es a las 15:30 o más tarde; si no, quedan fuera ese día.',
    manana: { empieza: '07:30', paradas: manana4.filter((item) => !['Plaza de San Pedro', 'Basílica de San Pedro', 'Cúpula de San Pedro', 'Via della Conciliazione'].includes(item.lugar)) },
    'tarde.*': { insertar: [{ al_principio: true, parada: inside('Basílica de San Pedro', 60, { si_entrada_desde: '15:30' }) }, { al_principio: true, parada: stop('Plaza de San Pedro', 25, { si_entrada_desde: '15:30' }) }] },
  }
  day.variantes['entrada:mediodia'] = orden2
  day.variantes['entrada:mediodia@lunes'] = lunes
  day.variantes['entrada:mediodia@miercoles'] = mie2
  day.variantes['entrada:mediodia@domingo'] = { _nota: 'El último domingo de mes los Museos abren de 9:00 a 14:00 (última entrada 12:30): solo cabe el orden 2, tal cual.' }
  day.variantes['entrada:primera_tarde'] = orden3
  day.variantes['entrada:primera_tarde@lunes'] = lunes
  day.variantes['entrada:primera_tarde@miercoles'] = mie3
  day.variantes['entrada:tarde'] = orden4
  day.variantes['entrada:tarde@lunes'] = lunes
  day.variantes['entrada:tarde@miercoles'] = mie4
  write('D2', day)
}

// ── D1 · Coliseo ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
function d1() {
  const day = read('D1')
  day.entradas = { Coliseo: { manana: ['08:30', '15:00'], tarde: ['15:30', '18:15'] } }
  day._nota_entradas = 'Entrada reservada al Coliseo (3-oct-2026, PARA_CODE_D1_D2_D4_SEGUNDO_ORDEN): el orden de siempre sirve de 8:30 a 15:00; `entrada:tarde` (desde las 15:30) es el orden nuevo: la Roma antigua por la mañana sin el Coliseo y el Coliseo a su hora, con el centro barroco después. La entrada vale para el Foro y el Palatino el mismo día, antes o después del Coliseo.'
  const foro = (min, meses) => inside('Foro Romano y Palatino', min, { entrada: true, ...meses })
  const manana = [
    stop('Plaza del Campidoglio', 15, { tipo: 'opcional' }),
    camino('Plaza Venecia'),
    inside('Altar de la Patria', 40),
    foro(100, { no_meses: [7, 8] }),
    foro(90, { meses: [7, 8] }),
    camino('Via dei Fori Imperiali'),
    stop('Boca de la Verdad', 20, { tipo: 'opcional' }),
    stop('Circo Máximo', 20, { tipo: 'opcional' }),
  ]
  const coliseo = { lugar: 'Coliseo', tipo: 'fija', hora: '16:00', min: 75, modo: 'dentro', entrada: true, si_cerrado: 'fuera', turno: true }
  const centro = (atardecer) => [
    coliseo,
    stop('Arco de Constantino', 20),
    inside('Panteón', 30, { entrada: true }),
    camino('Elefantino de Bernini'),
    inside('Iglesia de Santa Maria sopra Minerva', 15),
    stop('Piazza Navona', 30, atardecer ? { modo: 'atardecer' } : {}),
  ]
  const cenaCentro = (hora) => ({ restaurante: 'Armando al Pantheon', alternativa: 'Pizzeria Da Baffetto', hora })
  const orden = {
    _nota: 'Orden 2 (entrada desde las 15:30, propuesta del usuario): Campidoglio, Plaza Venecia, Altar de la Patria y Foro y Palatino (con la misma entrada) por la mañana; comida en Monti; después el Coliseo a su hora, el Arco, el Panteón, la Minerva y Navona (al atardecer en B, C y D; en A el sol se pone mientras estás en el Coliseo y Navona va ya de noche). Lo que no quepa del centro barroco se queda fuera ese día, sin aviso.',
    manana: { empieza: '08:30', paradas: manana, comida: { restaurante: 'Trattoria Monti', alternativa: 'La Taverna dei Fori Imperiali' } },
    'tarde.A': { empieza: '12:00', paradas: centro(false), cena: cenaCentro('20:00') },
    'tarde.B': { empieza: '12:00', paradas: centro(true), cena: cenaCentro('20:00') },
    'tarde.C': { empieza: '12:00', paradas: centro(true), cena: cenaCentro('19:30') },
    'tarde.D': { empieza: '12:00', paradas: centro(true), cena: cenaCentro('20:30') },
  }
  const sabado = {
    _nota: 'Sábado con el orden 2: el Panteón solo vende hasta las 16:00 (misa a las 17:00), así que va por la mañana, después del Foro y antes de comer; por la tarde, después del Coliseo, directos a Navona.',
    manana: { insertar: [{ despues_de: 'Foro Romano y Palatino', parada: inside('Panteón', 30, { entrada: true }) }] },
    'tarde.*': { quitar: ['Panteón'] },
  }
  day.variantes['entrada:tarde'] = orden
  day.variantes['entrada:tarde@sabado'] = sabado
  write('D1', day)
}

// ── D4 · Galería Borghese ──────────────────────────────────────────────────────────────────────────────────────────────────────
function d4() {
  const day = read('D4')
  day.entradas = { 'Galería Borghese': { manana: ['09:00', '11:00'], mediodia: ['12:00', '14:00'], tarde: ['15:00', '17:45'] } }
  day._nota_entradas = 'Entrada reservada a la Galería Borghese (3-oct-2026, PARA_CODE_D1_D2_D4_SEGUNDO_ORDEN): el orden de siempre sirve de 9:00 a 11:00; `entrada:mediodia` (12:00-14:00) y `entrada:tarde` (15:00-17:45) son los órdenes nuevos. La hora de la parada de la Galería de cada variante es solo un ejemplo: la que vale es la reservada.'
  const galeria = clone(day.manana.paradas.find((item) => item.lugar === 'Galería Borghese'))
  galeria.hora = '13:00'
  const trevi = clone(day.manana.paradas.find((item) => item.lugar === 'Fontana de Trevi'))
  const desayuno = clone(day.manana.paradas.find((item) => item.lugar === 'Desayuno romano'))
  const trinita = clone(day.manana.paradas.find((item) => item.lugar === 'Trinità dei Monti'))
  const comida = { restaurante: 'Edy', alternativa: 'Poldo e Gianna Osteria' }
  const tridente = () => stop('Via Condotti', 30, { titulo: 'Pasea y piérdete por el Tridente', no_calle: true, elastica: 30, una_vez: true })
  const cenaTridente = (hora) => ({ restaurante: 'Il Gabriello', alternativa: 'Sgarro Bistrot', hora })

  // — Los huecos del orden de siempre: en C y D, después de comer, el paseo del Tridente (si no ha salido antes) y el Ara Pacis —
  for (const version of ['C', 'D']) {
    const list = day.tarde[version].paradas
    const ara = list.find((item) => item.lugar === 'Ara Pacis')
    day.tarde[version].paradas = [tridente(), ara, ...list.filter((item) => item.lugar !== 'Ara Pacis')]
  }

  // — Orden 2 · entrada de 12:00 a 14:00 —
  const manana2 = [
    trevi,
    desayuno,
    stop('Via Condotti', 10),
    stop('Plaza de España', 20),
    trinita,
    stop('Parque de Villa Borghese', 20, { elastica: 30, titulo: 'Camino de la Galería, por el parque y Piazza di Siena' }),
    galeria,
  ]
  const parque = () => stop('Parque de Villa Borghese', 30, { titulo: 'El lago y el Templo de Esculapio', elastica: 30 })
  const tarde2 = (version) => [
    parque(),
    stop('Jardines del Pincio', 20),
    stop('Terraza del Pincio', version === 'D' ? 10 : null, version === 'D' ? {} : { modo: 'atardecer' }),
    stop('Piazza del Popolo', 10),
    inside('Santa Maria del Popolo', 25),
    ...(version === 'D' ? [inside('Ara Pacis', 45, { tipo: 'opcional' })] : []),
  ]
  const orden2 = {
    _nota: 'Orden 2 (entrada de 12:00 a 14:00): Trevi a las 8:30, la Plaza de España y el Parque de Villa Borghese de camino a la Galería; comida en el Tridente; por la tarde el lago, el Pincio (al atardecer en A, B y C; de día en D), Piazza del Popolo y Santa Maria del Popolo, y el Ara Pacis solo en D y si abre.',
    manana: { empieza: '08:30', paradas: manana2, comida },
    'tarde.A': { empieza: '12:00', paradas: tarde2('A'), cena: cenaTridente('19:30') },
    'tarde.B': { empieza: '12:00', paradas: tarde2('B'), cena: cenaTridente('20:00') },
    'tarde.C': { empieza: '12:00', paradas: tarde2('C'), cena: cenaTridente('19:30') },
    'tarde.D': { empieza: '12:00', paradas: tarde2('D'), cena: cenaTridente('20:30') },
  }

  // — Orden 3 · entrada de 15:00 a 17:45 —
  const manana3 = [
    trevi,
    desayuno,
    stop('Via Condotti', 10),
    stop('Plaza de España', 20),
    trinita,
    tridente(),
    stop('Piazza del Popolo', 10),
    inside('Santa Maria del Popolo', 25),
    inside('Ara Pacis', 45),
  ]
  const tarde3 = (version) => [
    stop('Jardines del Pincio', 20),
    stop('Terraza del Pincio', 10, { titulo: 'La Terraza del Pincio, de día' }),
    parque(),
    { ...clone(galeria), hora: '16:00' },
    ...(version === 'A' ? [] : [stop('Terraza del Pincio', null, { modo: 'atardecer', tipo: 'opcional' })]),
  ]
  const orden3 = {
    _nota: 'Orden 3 (entrada de 15:00 a 17:45): Trevi a las 8:30, la Plaza de España, el paseo del Tridente (una sola vez en el viaje), Santa Maria del Popolo y el Ara Pacis por la mañana; comida en el Tridente; el Pincio de día, el parque y la Galería. Al salir, en B, C y D, la Terraza del Pincio al atardecer si se llega antes de la puesta (unos 15 min andando); en A, el sol se pone durante la Galería.',
    manana: { empieza: '08:30', paradas: manana3, comida },
    'tarde.A': { empieza: '12:00', paradas: tarde3('A'), cena: cenaTridente('19:30') },
    'tarde.B': { empieza: '12:00', paradas: tarde3('B'), cena: cenaTridente('20:00') },
    'tarde.C': { empieza: '12:00', paradas: tarde3('C'), cena: cenaTridente('19:30') },
    'tarde.D': { empieza: '12:00', paradas: tarde3('D'), cena: cenaTridente('20:30') },
  }
  day.variantes['entrada:mediodia'] = orden2
  day.variantes['entrada:tarde'] = orden3
  write('D4', day)
}

d2()
d1()
d4()
console.log('D1, D2 y D4 escritos')
