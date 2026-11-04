// (Tanda LL, parte 2, Roma) Escribe en docs/dias/DIAS_ROMA_PARADAS.md las tablas y las listas del día 1 por franjas de hora útil (F0 a F7) y por zona.
//   node scripts/destino/romaLlegadasDoc.mjs        → sustituye el trozo entre «### Qué lleva el día 1 según la hora» y «### D1+Vaticano» (se puede repetir: es idempotente)
//   node scripts/destino/listasConvertir.mjs        → regenera data/dias/roma/listas.json desde el documento
// El documento manda: este fichero solo evita escribir a mano 25 listas casi iguales. Si cambia una lista, se cambia aquí y se vuelve a correr, o se edita el documento (y entonces este fichero ya no vale).
import fs from 'node:fs'

const DOC = 'docs/dias/DIAS_ROMA_PARADAS.md'
const ZONAS = ['navona', 'espana', 'trastevere', 'prati', 'monti']
const NOMBRE_ZONA = { navona: 'Navona', espana: 'la Plaza de España', trastevere: 'Trastevere', prati: 'Prati', monti: 'Monti y Termini' }
const EMPIEZA = { navona: 'Navona', espana: 'Plaza de España', trastevere: 'Trastevere', prati: 'Prati', monti: 'Monti' }

const TREVI_NOCHE = 'Fontana de Trevi iluminada'
const NAVONA_NOCHE = 'Piazza Navona de noche'
const ESPANA_NOCHE = 'Plaza de España de noche'
const TRASTEVERE_NOCHE = 'Trastevere de noche'
const PUENTE_NOCHE = "el Puente y el Castillo de Sant'Angelo iluminados"
const PANTEON_NOCHE = 'Panteón de noche'

const PAN = 'Panteón, por fuera'
const NOTA_PAN = ' (con su etiqueta de reserva)'
const p = (texto, min, extra = '') => `${texto} ~${min}${extra}`

// Cada zona: las paradas de la «entera» (F1: mañana, comida al llegar, tarde), de la ruta del centro a buen paso (F2 y F3), del anochecer (F4) y la cena y la noche de cada fila.
const LISTAS = {
  navona: {
    entera: { manana: [p('Piazza Navona', 30), p(PAN, 20, NOTA_PAN), p('Fontana de Trevi', 30), p('Via Condotti', 15)], tarde: [p('Plaza de España', 30), p('Escalinata y Trinità dei Monti', 20), p('Terraza del Pincio', 20), p('Piazza del Popolo', 20)], cena: 'Il Gabriello (o Poldo e Gianna Osteria), en el Tridente', noche: ESPANA_NOCHE },
    centro: { tarde: [p('Piazza Navona', 20), p(PAN, 15, NOTA_PAN), p('Fontana de Trevi', 20), p('Via Condotti', 10), p('Plaza de España', 20), p('Escalinata y Trinità dei Monti', 15)], cena: 'Il Gabriello (o Poldo e Gianna Osteria), en el Tridente', noche: TREVI_NOCHE, sobra: 'Terraza del Pincio ~20, Piazza del Popolo ~20' },
    anochecer: { tarde: [p('Piazza Navona', 20), p(PAN, 15, NOTA_PAN)], cena: 'Armando al Pantheon (o Da Baffetto)', noche: TREVI_NOCHE },
    noche: { cena: 'Armando al Pantheon (o Da Baffetto)', noche: TREVI_NOCHE, sitio: 'la Fontana de Trevi' },
  },
  espana: {
    entera: { manana: [p('Plaza de España', 30), p('Escalinata y Trinità dei Monti', 20), p('Terraza del Pincio', 20), p('Piazza del Popolo', 20)], tarde: ['*de camino:* Via del Corso', p('Fontana de Trevi', 30), p(PAN, 20, NOTA_PAN), p('Piazza Navona', 30)], cena: 'Armando al Pantheon (o Da Baffetto)', noche: NAVONA_NOCHE },
    centro: { tarde: [p('Plaza de España', 20), p('Escalinata y Trinità dei Monti', 15), '*de camino:* Via del Corso', p('Fontana de Trevi', 20), p(PAN, 15, NOTA_PAN), p('Piazza Navona', 20)], cena: 'Armando al Pantheon (o Da Baffetto)', noche: NAVONA_NOCHE, sobra: 'Terraza del Pincio ~20, Piazza del Popolo ~20' },
    anochecer: { tarde: [p('Plaza de España', 20), p('Escalinata y Trinità dei Monti', 15), p(PAN, 15, NOTA_PAN), p('Piazza Navona', 20)], cena: 'Armando al Pantheon (o Da Baffetto)', noche: TREVI_NOCHE },
    noche: { cena: 'Il Gabriello (o Poldo e Gianna Osteria), en el Tridente', noche: ESPANA_NOCHE, sitio: 'la Plaza de España' },
  },
  trastevere: {
    entera: { manana: [p('Plaza Trilussa', 15), p('Ponte Sisto', 15), p("Campo de' Fiori", 25), p('Piazza Navona', 30)], tarde: [p(PAN, 20, NOTA_PAN), p('Largo di Torre Argentina', 20), p('Barrio Judío', 30), p('Isla Tiberina', 20)], cena: 'Taverna Trilussa (o Da Lucia), en Trastevere', noche: TRASTEVERE_NOCHE },
    centro: { tarde: [p('Plaza Trilussa', 10), p('Ponte Sisto', 10), p("Campo de' Fiori", 20), p('Piazza Navona', 20), p(PAN, 15, NOTA_PAN), p('Largo di Torre Argentina', 15)], cena: 'Taverna Trilussa (o Da Lucia), en Trastevere', noche: TRASTEVERE_NOCHE, sobra: 'Barrio Judío ~20, Isla Tiberina ~15' },
    anochecer: { tarde: [p('Plaza Trilussa', 10), p('Ponte Sisto', 10), p("Campo de' Fiori", 20)], cena: 'Taverna Trilussa (o Da Lucia), en Trastevere', noche: TRASTEVERE_NOCHE },
    noche: { cena: 'Taverna Trilussa (o Da Lucia), en Trastevere', noche: TRASTEVERE_NOCHE, sitio: 'Trastevere' },
  },
  prati: {
    entera: { manana: [p("Castillo de Sant'Angelo, por fuera", 20), p("Puente Sant'Angelo", 10), p('Via dei Coronari', 10), p('Piazza Navona', 30)], tarde: [p(PAN, 20, NOTA_PAN), p('Fontana de Trevi', 30), p('Plaza de España', 30), p('Escalinata y Trinità dei Monti', 20)], cena: "L'Arcangelo (o Osteria dell'Angelo), en Prati", noche: PUENTE_NOCHE },
    centro: { tarde: [p("Castillo de Sant'Angelo, por fuera", 15), p("Puente Sant'Angelo", 10), p('Via dei Coronari', 10), p('Piazza Navona', 20), p(PAN, 15, NOTA_PAN)], cena: "L'Arcangelo (o Osteria dell'Angelo), en Prati", noche: PUENTE_NOCHE, sobra: 'Fontana de Trevi ~20, Largo di Torre Argentina ~15' },
    anochecer: { tarde: [p("Puente Sant'Angelo", 10), p("Castillo de Sant'Angelo, por fuera", 20)], cena: "L'Arcangelo (o Osteria dell'Angelo), en Prati", noche: PUENTE_NOCHE },
    noche: { cena: "L'Arcangelo (o Osteria dell'Angelo), en Prati", noche: PUENTE_NOCHE, sitio: "el Puente y el Castillo de Sant'Angelo" },
  },
  monti: {
    entera: { manana: [p('Basílica de Santa María la Mayor', 30), p('Plaza del Quirinal', 15), p('Fontana de Trevi', 30), p(PAN, 20, NOTA_PAN)], tarde: [p('Piazza Navona', 30), p('Via Condotti', 15), p('Plaza de España', 30), p('Escalinata y Trinità dei Monti', 20)], cena: 'Il Gabriello (o Poldo e Gianna Osteria), en el Tridente', noche: ESPANA_NOCHE },
    centro: { tarde: [p('Basílica de Santa María la Mayor', 20), p('Plaza del Quirinal', 10), p('Fontana de Trevi', 20), p(PAN, 15, NOTA_PAN), p('Piazza Navona', 20), p('Largo di Torre Argentina', 15)], cena: 'Armando al Pantheon (o Da Baffetto)', noche: PANTEON_NOCHE, sobra: 'Via Condotti ~10, Plaza de España ~20' },
    anochecer: { tarde: [p('Plaza del Quirinal', 15), p('Fontana de Trevi', 20)], cena: 'Trattoria Monti (o La Boccaccia), en Monti', noche: TREVI_NOCHE },
    noche: { cena: 'Trattoria Monti (o La Boccaccia), en Monti', noche: TREVI_NOCHE, sitio: 'la Fontana de Trevi' },
  },
}

const lista = (items) => items.map((x) => `  - ${x}`).join('\n')
const FIJA = ' (fija, repite)'
const TEXTO_F5 = (sitio) => `«{Llegada} a las {hora}. Cuando dejes las maletas, cena cerca de tu alojamiento y da un paseo corto de noche por ${sitio}. Mañana empezamos a tope.»`
const TEXTO_F6 = (sitio) => `«{Llegada} a las {hora}. Cuando dejes las maletas, si te apetece, da un paseo corto de noche por ${sitio}. Mañana empezamos a tope.»`

function seccion(id, titulo, intro, lineas) {
  return [`### ${titulo} · ${id}`, intro, '', ...lineas, '']
}

const out = []
const z = (zona, clave) => LISTAS[zona][clave]
const comidaDe = (zona) => zona

// ── Tablas ──
const celda = (prefijo) => ZONAS.map((k) => `${prefijo}-${k}`).join(' o ')
const FILAS = [
  ['llega de 0:00 a 4:59', 'D1 · desde las 9:00'],
  ['antes de las 9:31', 'D1'],
  ['de 9:31 a 12:00', `${celda('D1-centro-entera')} · comida al llegar · el D1 pasa al día 2`],
  ['de 12:01 a 15:00', `${celda('D1-centro')} · comida al llegar · el D1 pasa al día 2`],
  ['de 15:01 a 18:00', `${celda('D1-centro')} · el D1 pasa al día 2`],
  ['de 18:01 a 20:00', `${celda('D1-anochecer')} · el D1 pasa al día 2`],
  ['de 20:01 a 21:30', `${celda('D1-noche')} · el D1 pasa al día 2`],
  ['de 21:31 a 23:00', `${celda('D1-noche-sin-cena')} · el D1 pasa al día 2`],
  ['a las 23:01 o más tarde', 'D1-sin-ruta · el D1 pasa al día 2'],
]
const tabla = () => ['| Hora útil a las… | El día 1 |', '|---|---|', ...FILAS.map(([a, b]) => `| ${a} | ${b} |`)]

out.push('### Qué lleva el día 1 según la hora (viajes de 3 noches o más, sin Free Tour de mañana)')
out.push('Cada fila es una lista escrita (más abajo, con ese nombre). La hora que elige la fila es la **hora útil** (ver «Las horas: la hora útil y la hora de irse»). Las dos tablas, la de **marzo a octubre** y la de **invierno**, son iguales desde la tanda LL (4-nov-2026): el Coliseo ya no va nunca el día de llegada, así que su cierre de las 16:30 no cambia el día 1. Cubren las 24 horas. La primera fila es por la hora de **llegada** (el vuelo de madrugada); las demás, por la **hora útil**. Si el viajero reserva el Coliseo, manda la tabla de la hora del Coliseo del D1, como siempre (una reserva del viajero manda siempre). «Comida al llegar» es la parada «Comida, cerca de tu alojamiento» (sin restaurante nuestro); sale solo con hora útil hasta las 15:00 (la comida no empieza después).')
out.push('')
out.push('#### El día 1, de marzo a octubre')
out.push('')
out.push(...tabla())
out.push('')
out.push('#### El día 1, en invierno')
out.push('')
out.push(...tabla())
out.push('')
out.push('**Las franjas** (la hora útil de la tabla es la de Eric: aterrizas + 45 min + trayecto a tu zona + 1 h):')
out.push('- **F0 · día entero** (aterrizas de 0:00 a 4:59, o hora útil hasta las 9:30): el D1 de siempre, entero y desde las 9:00 (o desde que está libre): es el único día de llegada con un imprescindible grande.')
out.push('- **F1 · desde media mañana** (9:31 a 12:00): unas paradas ligeras cerca del alojamiento, la comida cerca, la ruta ligera del centro por la tarde, la cena y un paseo de noche corto. **La Roma antigua pasa al día 2 y se cae el último día.**')
out.push('- **F2 · desde la comida** (12:01 a 15:00): la comida cerca del alojamiento, la ruta ligera del centro a buen paso, la cena y un paseo de noche corto.')
out.push('- **F3 · tarde** (15:01 a 18:00): la ruta ligera a buen paso, la cena y un paseo de noche corto.')
out.push('- **F4 · antes de cenar** (18:01 a 20:00): 2 o 3 paradas al lado de casa, la cena y un paseo de noche corto.')
out.push('- **F5 · cena** (20:01 a 21:30): la cena cerca del alojamiento y UN sitio de noche, a menos de 15 min andando.')
out.push('- **F6 · noche** (21:31 a 23:00): sin cena con restaurante; un paseo corto de noche cerca, si apetece.')
out.push('- **F7 · muy tarde** (después de las 23:00): «Descansa, que mañana empezamos a tope.»')
out.push('')
out.push('- **Qué es una parada «ligera»:** se ve en 45 min o menos, sin entrada con hora fija, no es de los grandes (el Coliseo y el Foro, los Museos Vaticanos y la Galería Borghese; la Basílica de San Pedro sola NO es grande), y a esa hora está abierta. Las plazas, las fuentes, los miradores, las calles y las iglesias pequeñas se ven a cualquier hora.')
out.push('- **Los grandes, por la mañana y en días enteros:** nunca el día de llegada (salvo F0) ni el de vuelta (salvo el vuelo desde las 19:00). Excepciones: una reserva del viajero manda siempre (se avisa, nunca se quita); los cierres mandan primero; el día del Free Tour (Vaticano por la tarde) se queda como excepción; y un viaje con UN solo día entero (2 noches con llegada tarde) puede llevar dos grandes ese día.')
out.push('- **La parte ligera del día que se cae** (Plaza de España, Trinità, Via Condotti, el Pincio y el Popolo) va en el día de llegada; lo grande de ese día (la Galería Borghese) vuelve si se reserva.')
out.push('- **La nocturna de las rutas** es UNA, escrita en la lista y cerca de la cena («fija»: no cede su sitio a la primera imprescindible que falte, y puede repetir lo visto ese día: de noche es otra cosa). Por eso con una llegada de noche ya no sale el Coliseo a las 23:10 cuando el texto promete Trevi.')
out.push('- **La comida y la cena de la ruta:** se come donde esté la ruta; la cena, cerca del alojamiento o de la última parada, con el restaurante de esa zona. Si llega tarde, lo primero que sale de la ruta es lo último (el Pincio y el Popolo): va a «Si te sobra tiempo».')
out.push('')
out.push('### La «Llegada a Roma» (el día 1)')
out.push('Las listas de abajo son las de las tablas de arriba. Todas van **por fuera y a buen paso**, con sus propios minutos, salvo la que dice «entera». Cinco zonas: Navona (Centro y «Aún no lo sé»), la Plaza de España, Trastevere, Prati y Monti (con Termini).')
out.push('')
out.push('#### Por dónde empieza la ruta del centro (según la zona)')
out.push('La zona decide **por dónde empieza** la ruta ligera y dónde se cena. Desde Prati se cruza el Puente; desde Trastevere, el Ponte Sisto; desde Monti y Termini, a pie o en el bus 40 o 64.')
out.push('')
out.push('| Zona | Empieza en |')
out.push('|---|---|')
for (const [zona, empieza] of [['Centro', 'Navona'], ['Prati', 'Prati'], ['Trastevere', 'Trastevere'], ['Monti', 'Monti'], ['Aún no lo sé', 'Navona'], ['Plaza de España', 'Plaza de España'], ['Termini', 'Monti']]) out.push(`| ${zona} | ${empieza} |`)
out.push('')
out.push('- **Navona:** Piazza Navona · Panteón · Fontana de Trevi · Via Condotti · Plaza de España · Escalinata y Trinità dei Monti · Terraza del Pincio · Piazza del Popolo.')
out.push('- **Plaza de España:** Plaza de España · Escalinata y Trinità dei Monti · Terraza del Pincio · Piazza del Popolo · de camino Via del Corso · Fontana de Trevi · Panteón · Piazza Navona.')
out.push('- **Trastevere:** Plaza Trilussa · Ponte Sisto · Campo de\' Fiori · Piazza Navona · Panteón · Largo di Torre Argentina (el tranvía 8 vuelve de allí a Trastevere) · Barrio Judío · Isla Tiberina. Cena y nocturna en Trastevere.')
out.push('- **Prati:** el Castillo de Sant\'Angelo por fuera · el Puente · Via dei Coronari · Piazza Navona · Panteón. Cena y nocturna en Prati (el Puente y el Castillo).')
out.push('- **Monti:** Santa María la Mayor · Plaza del Quirinal · Fontana de Trevi · Panteón · Piazza Navona · Largo di Torre Argentina. Cena en Monti.')
out.push('- **Qué se «come» de otros días:** Trastevere y Prati llevan paradas del día del Vaticano y Trastevere (Isla Tiberina, el Castillo y el Puente); Monti, Santa María la Mayor (D5) y el Quirinal; el centro, lo que ya llevaban las rutas del centro. Esos días lo llevan «de camino» (regla 9), salvo los imprescindibles, que salen otra vez.')
out.push('')

for (const zona of ZONAS) {
  const d = LISTAS[zona]
  const desde = EMPIEZA[zona]
  out.push(...seccion(`D1-centro-entera-${zona}`, `La ruta del centro entera, desde ${NOMBRE_ZONA[zona] === 'Navona' ? 'Navona' : NOMBRE_ZONA[zona]}`, `Hora útil de 9:31 a 12:00 (F1), con la comida al llegar en medio: unas paradas ligeras antes de comer y el resto de la ruta por la tarde.`, [
    `- **Empieza en:** ${desde}`,
    '- **Mañana:**', lista(d.entera.manana),
    '- **Tarde:**', lista(d.entera.tarde),
    `- **Cena:** ${d.entera.cena}`,
    `- **Noche:** ${d.entera.noche}${FIJA}`,
  ]))
}
for (const zona of ZONAS) {
  const d = LISTAS[zona]
  out.push(...seccion(`D1-centro-${zona}`, `La ruta del centro a buen paso, desde ${NOMBRE_ZONA[zona] === 'Navona' ? 'Navona' : NOMBRE_ZONA[zona]}`, `Hora útil de 12:01 a 18:00 (F2 y F3; en F2, con la comida al llegar). Todo por fuera. Unas 2 h con los paseos.`, [
    `- **Empieza en:** ${EMPIEZA[zona]}`,
    '- **Tarde:**', lista(d.centro.tarde),
    `- **Cena:** ${d.centro.cena}`,
    `- **Noche:** ${d.centro.noche}${FIJA}`,
    `- **Si te sobra tiempo:** ${d.centro.sobra}`,
  ]))
}
for (const zona of ZONAS) {
  const d = LISTAS[zona]
  out.push(...seccion(`D1-anochecer-${zona}`, `La llegada al anochecer, desde ${NOMBRE_ZONA[zona] === 'Navona' ? 'Navona' : NOMBRE_ZONA[zona]}`, 'Hora útil de 18:01 a 20:00 (F4): unas paradas al lado de casa, la cena y un paseo de noche corto.', [
    `- **Empieza en:** ${EMPIEZA[zona]}`,
    '- **Tarde:**', lista(d.anochecer.tarde),
    `- **Cena:** ${d.anochecer.cena}`,
    `- **Noche:** ${d.anochecer.noche}${FIJA}`,
  ]))
}
for (const zona of ZONAS) {
  const d = LISTAS[zona]
  out.push(...seccion(`D1-noche-${zona}`, `La llegada de noche, con cena, desde ${NOMBRE_ZONA[zona] === 'Navona' ? 'Navona' : NOMBRE_ZONA[zona]}`, 'Hora útil de 20:01 a 21:30 (F5): la cena cerca del alojamiento y un sitio de noche a menos de 15 min andando.', [
    `- **Empieza en:** ${EMPIEZA[zona]}`,
    `- **Cena:** ${d.noche.cena}`,
    `- **Noche:** ${d.noche.noche}${FIJA}`,
    `- **Texto:** ${TEXTO_F5(d.noche.sitio)}`,
  ]))
}
for (const zona of ZONAS) {
  const d = LISTAS[zona]
  out.push(...seccion(`D1-noche-sin-cena-${zona}`, `La llegada de noche, sin cena, desde ${NOMBRE_ZONA[zona] === 'Navona' ? 'Navona' : NOMBRE_ZONA[zona]}`, 'Hora útil de 21:31 a 23:00 (F6): sin cena con restaurante; un paseo corto de noche cerca, si apetece.', [
    `- **Empieza en:** ${EMPIEZA[zona]}`,
    `- **Noche:** ${d.noche.noche}${FIJA}`,
    `- **Texto:** ${TEXTO_F6(d.noche.sitio)}`,
  ]))
}
out.push(...seccion('D1-sin-ruta', 'La llegada tardísima, sin ruta', 'Hora útil desde las 23:01 (también si pasa de la medianoche): nada, con su texto.', ['- **Texto:** «{Llegada} a las {hora}. Descansa, que mañana empezamos a tope.»']))
out.push(...seccion('D1-noche', 'La noche de la parte del Free Tour (la cena y la noche del día 1 con el tour a media tarde)', 'No es una fila de la tabla: es la cena y la noche que lleva el día 1 cuando solo hace la parte del Free Tour (`destination_config.llegada.free_tour.cena_y_noche_de`).', [
  '- **Cena:** Armando al Pantheon (o Da Baffetto)',
  '- **Noche:** Fontana de Trevi (fija, repite)',
  '- **Texto:** «{Llegada} a las {hora}. Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad. Mañana empezamos a tope.»',
]))
out.push('**Los textos de la llegada de noche:** `{Llegada}` según cómo llega: avión, «Aterrizas»; tren o autobús, «Llegas a {punto}» (Termini, Tiburtina…); barco, «Desembarcas». `{hora}` es la que puso el viajero. Ejemplos: «Aterrizas a las 21:00. Cuando dejes las maletas, cena cerca de tu alojamiento y da un paseo corto de noche por la Fontana de Trevi. Mañana empezamos a tope.» y «Llegas a Termini a las 23:30. Descansa, que mañana empezamos a tope.»')
out.push('')
out.push('**La nocturna de la llegada cuenta para el viaje:** no se repite otra noche.')
out.push('')
out.push('**Lo visto en la llegada sí cuenta como visto (regla 9),** como en cualquier otro día: los días siguientes lo pasan a «de camino», con «Ya lo visitaste el {día}», **salvo los imprescindibles**, que salen otra vez como parada, y salvo lo que se entra por dentro ese día (el Panteón del D1, la Basílica del D2), que se queda como parada.')
out.push('')

const bloque = out.join('\n')
const doc = fs.readFileSync(DOC, 'utf8').replace(/\r\n/g, '\n')
const ini = doc.indexOf('### Qué lleva el día 1 según la hora')
const fin = doc.indexOf('### D1+Vaticano (2 noches con llegada tarde)')
if (ini < 0 || fin < 0 || fin < ini) throw new Error('no encuentro los límites del trozo')
fs.writeFileSync(DOC, `${doc.slice(0, ini)}${bloque}\n${doc.slice(fin)}`)
console.log('hecho: ', bloque.split('\n').length, 'líneas')
