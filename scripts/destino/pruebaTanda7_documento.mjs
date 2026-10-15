// La prueba de la Tanda 7, parte del DOCUMENTO (punto 18): las listas nuevas de las llegadas y las vueltas, tal como las pide el prompt, ya convertidas a datos.
//   node scripts/destino/pruebaTanda7_documento.mjs
// Da fallo si:
//   1. falta alguna lista nueva de `data/dias/roma/listas.json`, o no lleva sus paradas, sus tiempos, sus modos, su comida, su cena, su noche o su «Si te sobra tiempo»;
//   2. las tablas «Qué lleva el día 1 según la hora» (marzo a octubre e invierno) y «Qué lleva el día de vuelta» no cubren las 24 horas, o una hora de las fronteras del prompt
//      (0:00, 4:59, 5:00, 9:59, 10:00, 11:59, 12:00, 12:59, 13:00, 13:59, 14:00, 14:59, 15:00, 18:59, 19:00, 20:29, 20:30, 21:59, 22:00, 22:59, 23:00; y la vuelta
//      0:00, 4:59, 5:00, 8:59, 9:00, 13:29, 13:30, 14:59, 15:00, 16:59, 17:00, 22:59, 23:00) cae en otra fila que la que dice el prompt;
//   3. las últimas mañanas no son las 5 del prompt en su orden, más la hoja «Ya has visto lo mejor de Roma», o falta alguna de las 5 mañanas cortas;
//   4. algún imprescindible (`tier` imprescindible o joya) va «de camino» en cualquier lista de Roma (salvo la fachada de la Basílica del D0-medio y el «bajar la escalinata»);
//   5. el texto nuevo del documento lleva una hora calculada («sal a las…», «SAL A LAS», la hoja «Ese día sales hacia el aeropuerto a las 12:00…»), un nombre de empresa,
//      «taxi» como forma de llegar o irse, «Día n» con número, o sigue el «orden nuevo» o el «Toda esta sección es de la Tanda 7»;
//   6. los textos nuevos de los datos (llegada de noche, «Hoy vuelves a casa») llevan «taxi», «centro», una empresa o una hora calculada;
//   7. «Ya lo visitaste el día 1» sigue en el documento (ahora «el {día}»), o «Lo que sea gratis o de pago: se decide al final» sigue en «Lo que no entra todavía»;
//   8. (aviso, no fallo) una mañana corta o una última mañana no cabe con la hora más temprana de su fila: sale en la lista de «NO CABE» para las PREGUNTAS.
import fs from 'node:fs'
import { findPipelineV2Data } from '../../server/routeAlgorithm.js'
import { travelTimesFor } from '../../server/engine/buildDayV3.js'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const D = findPipelineV2Data('Roma')
const L = JSON.parse(fs.readFileSync('data/dias/roma/listas.json', 'utf8'))
const doc = fs.readFileSync('docs/dias/DIAS_ROMA_PARADAS.md', 'utf8').replace(/\r\n/g, '\n')
const bloque = doc.slice(doc.indexOf('## Llegadas y vueltas'))
const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ═══ 1. Las listas nuevas ═══
console.log('1. Las listas nuevas')
const firma = (lista) => (lista ?? []).map((s) => `${s.lugar ?? s.texto}|${s.min}|${s.modo}`).join('; ')
const MESA = (m) => (m ? `${m.restaurante} / ${m.alternativa}${m.zona ? ` / ${m.zona}` : ''}` : null)
const SOBRA_D1 = 'Barrio Judío|30|null; Fuente de las Tortugas|5|null; Largo di Torre Argentina|15|null; Iglesia de San Luigi dei Francesi|20|null; Iglesia del Gesù|20|null'
const ROMA_ANTIGUA = 'Coliseo|75|dentro; Arco de Constantino|10|null; Foro Romano y Palatino|90|dentro; Plaza del Campidoglio|30|null; Plaza Venecia|10|null; Altar de la Patria|45|dentro'
const QUIERO = {
  'D1-rapido': { manana: 'Piazza Navona|20|null; Panteón|15|fuera; Fontana de Trevi|20|null', comida: 'Armando al Pantheon / Pizzeria Da Baffetto', tarde: ROMA_ANTIGUA, cena: 'Il Gabriello / Poldo e Gianna Osteria / en el Tridente', noche: ['Plaza de España (noche)'], sobra: SOBRA_D1 },
  'D1-rapido-invierno-10': { manana: 'Coliseo|75|dentro; Arco de Constantino|10|null; Foro Romano y Palatino|90|dentro; Plaza del Campidoglio|30|null', comida: "Nonna Betta / Giggetto al Portico d'Ottavia / en el Barrio Judío", tarde: 'Plaza Venecia|10|null; Altar de la Patria|45|dentro; Panteón|30|dentro; Piazza Navona|20|null', cena: 'Il Gabriello / Poldo e Gianna Osteria / en el Tridente', noche: ['Fontana de Trevi (noche)', 'Plaza de España (noche)'], sobra: SOBRA_D1 },
  'D1-rapido-invierno-11': { manana: '', comida: 'La Taverna dei Fori Imperiali / Trattoria Valentino / en Monti', tarde: `${ROMA_ANTIGUA}; Panteón|30|dentro; Piazza Navona|20|null`, cena: 'Il Gabriello / Poldo e Gianna Osteria / en el Tridente', noche: ['Fontana de Trevi (noche)', 'Plaza de España (noche)'], sobra: SOBRA_D1 },
  'D1-tarde': { manana: '', comida: null, tarde: `${ROMA_ANTIGUA}; Panteón|45|dentro; Piazza Navona|45|null`, cena: 'Pizzeria Da Baffetto / Armando al Pantheon', noche: ['Fontana de Trevi (noche)', 'Plaza de España (noche)'], sobra: SOBRA_D1 },
  'D1-centro-navona': { inicio: 'navona', tarde: 'Piazza Navona|20|null; Panteón|15|fuera; Fontana de Trevi|20|null; Via Condotti|10|null; Plaza de España|20|null; Trinità dei Monti|15|null', cena: 'Il Gabriello / Poldo e Gianna Osteria / en el Tridente', libre: true, sobra: 'Terraza del Pincio|20|null; Piazza del Popolo|20|null' },
  'D1-centro-espana': { inicio: 'plaza_de_espana', tarde: 'Plaza de España|20|null; Trinità dei Monti|15|null; Via del Corso|5|camino; Fontana de Trevi|20|null; Panteón|15|fuera; Piazza Navona|20|null', cena: 'Armando al Pantheon / Pizzeria Da Baffetto', libre: true, sobra: 'Terraza del Pincio|20|null; Piazza del Popolo|20|null' },
  'D1-centro-entera-navona': { inicio: 'navona', tarde: 'Piazza Navona|45|null; Panteón|30|fuera; Fontana de Trevi|45|null; Via Condotti|15|null; Plaza de España|45|null; Trinità dei Monti|20|null; Terraza del Pincio|20|null; Piazza del Popolo|20|null', cena: 'Il Gabriello / Poldo e Gianna Osteria / en el Tridente', libre: true },
  'D1-centro-entera-espana': { inicio: 'plaza_de_espana', tarde: 'Plaza de España|45|null; Trinità dei Monti|20|null; Terraza del Pincio|20|null; Piazza del Popolo|20|null; Via del Corso|5|camino; Fontana de Trevi|45|null; Panteón|30|fuera; Piazza Navona|45|null', cena: 'Armando al Pantheon / Pizzeria Da Baffetto', libre: true },
  'D1-anochecer-navona': { inicio: 'navona', tarde: 'Piazza Navona|20|null; Panteón|15|fuera', cena: 'Armando al Pantheon / Pizzeria Da Baffetto', noche: ['Fontana de Trevi (noche)', 'Plaza de España (noche)'] },
  'D1-anochecer-espana': { inicio: 'plaza_de_espana', tarde: 'Plaza de España|20|null; Trinità dei Monti|15|null; Panteón|15|fuera; Piazza Navona|20|null', cena: 'Armando al Pantheon / Pizzeria Da Baffetto', noche: ['Fontana de Trevi (noche)'] },
  'D1-noche': { cena: 'Armando al Pantheon / Pizzeria Da Baffetto', noche: ['Fontana de Trevi (noche)'], texto: /Cuando dejes las maletas, visita la Fontana de Trevi de noche para un primer contacto con la ciudad\. Mañana empezamos a tope\.$/ },
  'D1-noche-sin-cena': { cena: null, noche: ['Fontana de Trevi (noche)'], texto: /Cuando dejes las maletas, visita la Fontana de Trevi de noche/ },
  'D1-sin-ruta': { sinPartes: true, texto: /^\{Llegada\} a las \{hora\}\. Descansa, que mañana empezamos a tope\.$/ },
  'D1-vaticano': { manana: ROMA_ANTIGUA, comida: "Nonna Betta / Giggetto al Portico d'Ottavia / en el Barrio Judío", tarde: "Taxi a la entrada de los Museos|undefined|undefined; Museos Vaticanos y Capilla Sixtina|150|null; Plaza de San Pedro|30|null; Basílica de San Pedro|60|dentro; Via della Conciliazione|10|null; Castillo de Sant'Angelo|30|fuera; Puente Sant'Angelo|15|null", cena: "L'Arcangelo / Osteria dell'Angelo / en Prati", libre: true, nombre: 'D1+Vaticano (2 noches con llegada tarde)' },
  'DC-vaticano': { manana: 'Plaza de San Pedro|30|null; Basílica de San Pedro|45|dentro; Via della Conciliazione|10|null', miercoles: true },
  'DC-roma-antigua': { manana: 'Coliseo|30|fuera; Arco de Constantino|10|null; Plaza del Campidoglio|20|null; Foro Romano y Palatino|15|fuera' },
  'DC-pincio-popolo': { manana: 'Plaza de España|30|null; Trinità dei Monti|15|null; Terraza del Pincio|20|null; Piazza del Popolo|15|null' },
  'DC-aventino': { manana: 'Circo Máximo|15|null; Jardín de los Naranjos|20|null; Ojo de la Cerradura del Aventino|15|null; Pirámide Cestia|10|null' },
  'DC-cupula': { manana: 'Cúpula de San Pedro|75|null; Plaza de San Pedro|10|null', miercoles: true },
}
for (const [id, q] of Object.entries(QUIERO)) {
  const dia = L.dias[id]
  debe(!!dia, '1 lista', `${id}: no está en listas.json`)
  if (!dia) continue
  const p = dia.partes.unica
  if (q.nombre) debe(dia.nombre === q.nombre, '1 nombre', `${id}: se llama «${dia.nombre}» y tiene que llamarse «${q.nombre}»`)
  if (q.sinPartes) debe(!p || (p.manana.length === 0 && p.tarde.length === 0 && !p.comida && !p.cena && !p.noche), '1 partes', `${id}: no debería llevar paradas`)
  else debe(!!p, '1 partes', `${id}: sin parte`)
  if (!p || q.sinPartes) { if (q.texto) debe(q.texto.test(dia.textos?.texto ?? ''), '1 texto', `${id}: el texto no es el del prompt: «${dia.textos?.texto}»`); continue }
  if ('manana' in q) debe(firma(p.manana) === q.manana, '1 mañana', `${id}: la mañana es «${firma(p.manana)}» y tiene que ser «${q.manana}»`)
  if ('tarde' in q) debe(firma(p.tarde) === q.tarde, '1 tarde', `${id}: la tarde es «${firma(p.tarde)}» y tiene que ser «${q.tarde}»`)
  if ('comida' in q) debe((MESA(p.comida) ?? null) === (q.comida ?? null) || (q.comida && MESA(p.comida)?.startsWith(q.comida)), '1 comida', `${id}: la comida es «${MESA(p.comida)}» y tiene que ser «${q.comida}»`)
  if ('cena' in q) debe((MESA(p.cena) ?? null) === (q.cena ?? null) || (q.cena && MESA(p.cena)?.startsWith(q.cena)), '1 cena', `${id}: la cena es «${MESA(p.cena)}» y tiene que ser «${q.cena}»`)
  if (q.noche) debe(JSON.stringify(p.noche?.lista) === JSON.stringify(q.noche), '1 noche', `${id}: la noche es ${JSON.stringify(p.noche?.lista)} y tiene que ser ${JSON.stringify(q.noche)}`)
  if (q.libre) debe(p.noche?.libre === true, '1 noche', `${id}: la nocturna tiene que ser «la que toque» (regla 13)`)
  if ('sobra' in q) debe(firma(p.sobra) === q.sobra, '1 sobra', `${id}: «Si te sobra tiempo» es «${firma(p.sobra)}» y tiene que ser «${q.sobra}»`)
  if (q.inicio) debe(dia.inicio === q.inicio, '1 inicio', `${id}: empieza en «${dia.inicio}» y tiene que empezar en «${q.inicio}»`)
  if (q.texto) debe(q.texto.test(dia.textos?.texto ?? ''), '1 texto', `${id}: el texto no es el del prompt: «${dia.textos?.texto}»`)
  if (q.miercoles) debe(dia.miercoles === 'siguiente', '1 miércoles', `${id}: el miércoles tiene que usar la siguiente de la tabla`)
  if (id.startsWith('DC-')) {
    const total = p.manana.reduce((n, s) => n + (s.min ?? 0), 0)
    debe(total >= 60 && total <= 90 + 1, '1 minutos', `${id}: ${total} min de paradas (tiene que estar entre 1 h y 1 h 30)`)
  }
}
{
  const t = L.dias['DV-traslado']?.textos ?? {}
  debe(t.titulo === 'Hoy vuelves a casa', '1 hoy vuelves', `DV-traslado: el título es «${t.titulo}»`)
  debe(/^Tu vuelo sale de \{punto\} a las \{hora\}\. Te recomendamos estar en el aeropuerto 2 horas antes, por eso hoy no te hemos puesto paradas: es el día de irte con calma\.$/.test(t.avion ?? ''), '1 hoy vuelves', 'DV-traslado: el texto del avión no es el del prompt')
  debe(/^Tu tren sale de \{punto\} a las \{hora\}\. Llega a la estación con tiempo, por eso hoy no te hemos puesto paradas\.$/.test(t.tren_o_autobus ?? ''), '1 hoy vuelves', 'DV-traslado: el texto del tren o autobús no es el del prompt')
  debe(/^Tu barco sale de Civitavecchia a las \{hora\}\. Mira en tu reserva a qué hora cierra el embarque; por eso hoy no te hemos puesto paradas\.$/.test(t.barco ?? ''), '1 hoy vuelves', 'DV-traslado: el texto del barco no es el del prompt')
  debe(t.despedida === 'Esperamos que hayas disfrutado de Roma. ¡Nos vemos en tu próximo viaje!', '1 hoy vuelves', 'DV-traslado: falta la despedida')
  debe(t.explorar === '¿Crees que te da tiempo a ver algo? Aquí tienes los monumentos de Roma.', '1 hoy vuelves', 'DV-traslado: falta el texto de explorar')
  debe(t.desde_tu_zona?.startsWith('Desde tu zona ({zona}): {su mejor opción}'), '1 hoy vuelves', 'DV-traslado: falta «Desde tu zona»')
  debe(t.tarde_libre === 'La tarde es tuya hasta que te vayas.', '1 tarde libre', 'DV-traslado: falta «La tarde es tuya hasta que te vayas.»')
  debe(!!t.madrugada, '1 hoy vuelves', 'DV-traslado: falta el texto de la madrugada («Tu vuelo sale esta noche…»)')
}

// ═══ 2. Las tablas, hora por hora ═══
console.log('2. Las tablas por filas')
const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
/** La fila de un instante (libre) en una tabla; la fila «llega de…» solo se mira con `llegada`. */
const filaDe = (filas, hhmm, llegada = false) => {
  if (llegada) { const f = filas.find((x) => x.por === 'llegada' && mins(hhmm) >= mins(x.desde) && mins(hhmm) <= mins(x.hasta)); if (f) return f }
  return filas.find((x) => x.por !== 'llegada' && mins(hhmm) >= mins(x.desde) && (x.hasta == null || mins(hhmm) <= mins(x.hasta)))
}
const listasDe = (f) => (f?.listas ?? []).map((l) => (l.variante ? `${l.lista}/${l.variante}` : l.lista)).join(' o ')
const FRONTERAS = ['0:00', '4:59', '5:00', '9:59', '10:00', '10:59', '11:00', '11:59', '12:00', '12:59', '13:00', '13:59', '14:00', '14:59', '15:00', '18:59', '19:00', '20:29', '20:30', '21:59', '22:00', '22:59', '23:00', '23:59']
const CENTRO = 'D1-centro-navona o D1-centro-espana'
const CENTRO_E = 'D1-centro-entera-navona o D1-centro-entera-espana'
const ANOCHECER = 'D1-anochecer-navona o D1-anochecer-espana'
const QUIERO_VERANO = { '0:00': ['D1', 'llegada'], '4:59': ['D1', 'llegada'], '5:00': ['D1/coliseo_tarde'], '9:59': ['D1/coliseo_tarde'], '10:00': ['D1-rapido'], '10:59': ['D1-rapido'], '11:00': ['D1-rapido'], '11:59': ['D1-rapido'], '12:00': ['D1-tarde'], '12:59': ['D1-tarde'], '13:00': ['D1-tarde'], '13:59': ['D1-tarde'], '14:00': [CENTRO], '14:59': [CENTRO], '15:00': [CENTRO], '18:59': [CENTRO], '19:00': [ANOCHECER], '20:29': [ANOCHECER], '20:30': ['D1-noche'], '21:59': ['D1-noche'], '22:00': ['D1-noche-sin-cena'], '22:59': ['D1-noche-sin-cena'], '23:00': ['D1-sin-ruta'], '23:59': ['D1-sin-ruta'] }
const QUIERO_INVIERNO = { ...QUIERO_VERANO, '5:00': ['D1'], '9:59': ['D1'], '10:00': ['D1-rapido-invierno-10'], '10:59': ['D1-rapido-invierno-10'], '11:00': ['D1-rapido-invierno-11'], '11:59': ['D1-rapido-invierno-11'], '12:00': ['D1-tarde'], '12:59': ['D1-tarde'], '13:00': [CENTRO_E], '13:59': [CENTRO_E] }
const PASA_VERANO = new Set(['14:00', '14:59', '15:00', '18:59', '19:00', '20:29', '20:30', '21:59', '22:00', '22:59', '23:00', '23:59'])
const PASA_INVIERNO = new Set(['13:00', '13:59', ...PASA_VERANO])
for (const [clave, quiero, pasa] of [['marzo_octubre', QUIERO_VERANO, PASA_VERANO], ['invierno', QUIERO_INVIERNO, PASA_INVIERNO]]) {
  const filas = L.llegadas?.dia1?.[clave] ?? []
  debe(filas.length > 0, '2 tabla', `la tabla del día 1 «${clave}» no está en listas.json`)
  for (const h of FRONTERAS) {
    const llega = quiero[h][1] === 'llegada'
    const f = filaDe(filas, h, llega)
    debe(!!f, '2 hueco', `día 1 ${clave}: la hora ${h} no cae en ninguna fila`)
    if (!f) continue
    debe(quiero[h][0] === listasDe(f), '2 fila', `día 1 ${clave}: a las ${h} sale «${listasDe(f)}» y tiene que salir «${quiero[h][0]}»`)
    debe(llega ? !f.pasa_al_dia_2 : !!f.pasa_al_dia_2 === pasa.has(h), '2 pasa al día 2', `día 1 ${clave}: a las ${h} «el D1 pasa al día 2» está ${f.pasa_al_dia_2 ? 'puesto' : 'sin poner'} y tiene que estar ${pasa.has(h) ? 'puesto' : 'sin poner'}`)
    // La hora de la frontera no se redondea: la fila empieza en su hora.
    if (!llega) debe(mins(f.desde) <= mins(h) && (f.hasta == null || mins(h) <= mins(f.hasta)), '2 borde', `día 1 ${clave}: ${h} fuera de su fila`)
  }
  const comidaAlLlegar = filas.filter((f) => f.comida_al_llegar).map((f) => f.desde)
  const esperada = clave === 'marzo_octubre' ? ['12:00', '14:00'] : ['12:00', '13:00', '14:00']
  debe(JSON.stringify(comidaAlLlegar) === JSON.stringify(esperada), '2 comida al llegar', `día 1 ${clave}: «comida al llegar» en las filas ${comidaAlLlegar} y tiene que ser en ${esperada}`)
  // Las filas de la ruta del centro llevan las dos listas (las dos zonas) y cada una empieza donde dice la tabla de zonas.
  for (const f of filas.filter((x) => (x.listas ?? []).length === 2)) {
    debe(f.segun_zona === true && (f.listas ?? []).map((l) => L.dias[l.lista]?.inicio).sort().join() === 'navona,plaza_de_espana', '2 zonas', `día 1 ${clave}: la fila de ${f.desde} no tiene las dos entradas (Navona y Plaza de España)`)
  }
}
debe(L.llegadas?.dia1?.invierno?.find((f) => f.desde === '12:00')?.comida_corta_min === 45, '2 comida corta', 'invierno de 12:00 a 12:59: falta la comida corta de 45 min')
debe(L.llegadas?.dia1?.marzo_octubre?.find((f) => f.desde === '12:00')?.comida_corta_min == null, '2 comida corta', 'la comida corta es solo de invierno')
debe(L.llegadas?.dia1?.marzo_octubre?.find((f) => f.por === 'llegada')?.empieza === '09:00', '2 madrugada', 'la llegada de madrugada empieza a las 9:00')
{
  // La zona decide por dónde empieza la ruta del centro: Plaza de España y Termini empiezan en la Plaza de España; las demás, en Navona.
  const z = L.llegadas?.inicio_por_zona ?? {}
  const esperado = { centro: 'navona', prati: 'navona', trastevere: 'navona', monti: 'navona', nose: 'navona', plaza_de_espana: 'plaza_de_espana', termini: 'plaza_de_espana' }
  debe(JSON.stringify(Object.fromEntries(Object.entries(z).sort())) === JSON.stringify(Object.fromEntries(Object.entries(esperado).sort())), '2 zonas', `por dónde empieza la ruta del centro: ${JSON.stringify(z)}`)
  const zonasDelDestino = (D.destination_config?.zonas_alojamiento ?? []).map((x) => x.id).sort().join()
  debe(Object.keys(z).sort().join() === zonasDelDestino, '2 zonas', 'las zonas de la tabla no son las del destino')
}
{
  const filas = L.llegadas?.vuelta?.filas ?? []
  const QUIERO_VUELTA = { '0:00': 'solo_traslado', '4:59': 'solo_traslado', '5:00': 'solo_traslado', '8:59': 'solo_traslado', '9:00': 'solo_traslado', '13:29': 'solo_traslado', '13:30': 'manana_corta', '14:59': 'manana_corta', '15:00': 'manana_sin_comida', '16:59': 'manana_sin_comida', '17:00': 'manana_con_comida', '22:59': 'manana_con_comida', '23:00': 'dia_mas', '23:59': 'dia_mas' }
  debe(filas.length === 7, '2 vuelta', `la tabla de la vuelta tiene ${filas.length} filas y tiene que tener 7`)
  for (const [h, lleva] of Object.entries(QUIERO_VUELTA)) {
    const f = filaDe(filas, h)
    debe(f?.lleva === lleva, '2 vuelta', `vuelta: a las ${h} sale «${f?.lleva}» y tiene que salir «${lleva}»`)
  }
  debe(filaDe(filas, '0:00')?.dia_antes === 'con_cena_sin_nocturna', '2 vuelta', 'vuelo de 0:00 a 4:59: falta «el día de antes con cena y sin nocturna»')
  debe(filaDe(filas, '17:00')?.tarde_libre === true, '2 vuelta', 'vuelo de 17:00 a 22:59: falta la tarde libre')
  debe(filaDe(filas, '23:00')?.sin_cena_ni_noche === true, '2 vuelta', 'vuelo de las 23:00 o más tarde: falta «sin cena ni noche»')
  debe(L.llegadas?.vuelta?.punto_de_la_tabla === 'fiumicino' && L.llegadas?.vuelta?.margen_de_la_tabla === '03:00', '2 vuelta', 'falta decir de qué punto es la tabla de la vuelta')
}

// ═══ 3. Las últimas mañanas y las cortas ═══
console.log('3. Las últimas mañanas y las mañanas cortas')
{
  const u = L.llegadas?.ultimas_mananas ?? []
  const QUIERO_U = [
    ['D0-medio', 'manana', 'DC-vaticano', ['Plaza de San Pedro'], ['12-25', 'pascua']],
    ['D1', 'unica', 'DC-roma-antigua', ['Coliseo', 'Foro Romano y Palatino'], []],
    ['DT-medio', 'manana', 'DC-pincio-popolo', ['Terraza del Pincio', 'Piazza del Popolo'], []],
    ['DA-medio', 'unica', 'DC-aventino', ['Jardín de los Naranjos', 'Circo Máximo'], []],
    ['D6', 'unica', 'DC-cupula', ['Cúpula de San Pedro'], []],
  ]
  debe(u.length === 6, '3 filas', `hay ${u.length} últimas mañanas y tiene que haber 6 (5 más la hoja)`)
  QUIERO_U.forEach(([lista, parte, corta, principal, salta], i) => {
    const f = u[i]
    debe(f?.orden === i + 1 && f?.lista === lista && f?.parte === parte && f?.franja === 'manana' && f?.corta === corta && JSON.stringify(f?.lo_principal) === JSON.stringify(principal) && JSON.stringify(f?.se_salta) === JSON.stringify(salta), '3 orden', `última mañana ${i + 1}: ${JSON.stringify(f)} no es la del prompt (${lista}, ${corta})`)
    debe(!!L.dias[lista]?.partes?.[parte]?.manana?.length, '3 existe', `última mañana ${i + 1}: la lista ${lista} no tiene mañana`)
  })
  debe(u[5]?.hoja === 'Ya has visto lo mejor de Roma' && u[5]?.corta == null, '3 hoja', 'la sexta fila tiene que ser la hoja «Ya has visto lo mejor de Roma»')
}

// ═══ 4. Ningún imprescindible «de camino» ═══
console.log('4. Ningún imprescindible «de camino»')
{
  const place = new Map(D.places.map((p) => [p.name, p]))
  const PERMITIDO = (ruta, stop) => (stop.lugar === 'Basílica de San Pedro' && /^(D0-medio|DCC-vaticano)/.test(ruta)) || /escalinata/i.test(stop.titulo ?? '')
  const malos = []
  const recorre = (o, ruta) => {
    if (Array.isArray(o)) o.forEach((x, i) => recorre(x, `${ruta}[${i}]`))
    else if (o && typeof o === 'object') {
      if (o.lugar && o.modo === 'camino' && ['imprescindible', 'joya'].includes(place.get(o.lugar)?.tier) && !PERMITIDO(ruta, o)) malos.push(`${ruta}: ${o.lugar}`)
      for (const [k, v] of Object.entries(o)) recorre(v, `${ruta}.${k}`)
    }
  }
  for (const [id, d] of Object.entries(L.dias)) recorre(d, id)
  debe(malos.length === 0, '4 de camino', `imprescindibles «de camino»: ${malos.join(' · ')}`)
  const d6 = L.dias.D6.partes.unica.manana
  for (const n of ['Plaza de San Pedro', 'Piazza Navona', 'Panteón']) {
    const s = d6.find((x) => x.lugar === n)
    debe(s && s.modo !== 'camino' && s.min === 10, '4 D6', `D6: ${n} tiene que ser una parada corta de ~10 min y es ${s?.modo}/${s?.min}`)
  }
  const dm = L.dias['DM-medio'].partes.unica.manana[0]
  debe(dm.lugar === 'Fontana de Trevi' && dm.modo !== 'camino' && dm.min === 10, '4 DM-medio', 'DM-medio: Trevi tiene que ser una parada corta de ~10 min')
  const fachada = L.dias['D0-medio'].partes.manana.manana.find((s) => s.lugar === 'Basílica de San Pedro')
  debe(fachada?.modo === 'camino', '4 fachada', 'la fachada de la Basílica del D0-medio se queda de camino')
}

// ═══ 5. El texto nuevo del documento ═══
console.log('5. El texto nuevo del documento')
{
  const MALOS = [
    [/SAL A LAS|Sal a las|sal a las/, 'una hora de salir calculada («sal a las…»)'],
    [/Ese día sales hacia el aeropuerto a las/, 'la hoja «Ese día sales hacia el aeropuerto a las 12:00…»'],
    [/EN EL CENTRO \d|En el centro \d|libre hacia|Libre hasta|Maleta a las/, 'una hora calculada a la vista'],
    [/El orden nuevo de los días|Toda esta sección es de la Tanda 7|se decide al final/, 'un resto de lo que se quita'],
    [/Terravision|Rome Airport Bus|Rome Airport|ATRAL|KiPoint|KiBag|Trenitalia|Italo|Uber|Booking|Civitatis|GetYourGuide|Viator|Omio|Stay22|Airbnb/i, 'un nombre de empresa'],
    [/\bDía \d/, '«Día n» con número'],
    [/Ya lo visitaste el día \d|Ya lo visitaste el día \{n\}/, '«Ya lo visitaste el día n» (ahora «el {día}»)'],
  ]
  // (Las frases que explican la regla —«Nunca «sal a las…»», «nunca «Día 1» con fechas»— no cuentan.)
  const META = ['Nunca «sal a las…».', 'nunca «Día 1» con fechas.']
  for (const [re, que] of MALOS) {
    const m = re.exec(META.reduce((t, x) => t.split(x).join(''), bloque)) ?? re.exec(META.reduce((t, x) => t.split(x).join(''), doc))
    debe(!m, '5 texto', `el documento lleva ${que}: «${m?.[0]}»`)
  }
  // «taxi»: solo como parada ya escrita dentro de una ruta (Taxi a…), la nocturna en taxi de las rutas del centro, y la frase que dice que el taxi se va.
  const lineas = bloque.split('\n')
  const taxis = lineas.filter((l) => /taxi/i.test(l) && !/^\s*- Taxi a |\(taxi, 15 min o menos\)|^- \*\*El taxi se va\*\*|El taxi se va|en taxi de 15 min o menos|Sin taxi|sin taxi/.test(l))
  debe(taxis.length === 0, '5 taxi', `«taxi» como forma de llegar o irse en el documento: ${taxis.map((l) => l.slice(0, 90)).join(' · ')}`)
  const zona = bloque.slice(bloque.indexOf('### Para tu zona'), bloque.indexOf('### Lo que no entra todavía'))
  const tablaZona = zona.split('\n').filter((l) => l.startsWith('|')).join('\n')
  debe(!/taxi/i.test(tablaZona), '5 taxi', 'la tabla «Para tu zona» lleva «taxi»')
  debe(tablaZona.split('\n').length >= 8, '5 zona', 'la tabla «Para tu zona» no está entera')
  debe(/Trastevere \| tren FL1 a Roma Trastevere y tranvía 8/.test(tablaZona) && !/Trastevere \| [^|]*Leonardo Express/.test(tablaZona), '5 zona', 'Trastevere desde Fiumicino tiene que ser el FL1, sin Leonardo Express')
  debe(/Para tu zona/.test(bloque) && !/### Cómo llegar a tu zona/.test(doc), '5 zona', 'falta «Para tu zona» o sigue «Cómo llegar a tu zona»')
  debe(/Lo que no entra todavía/.test(doc) && !/gratis o de pago/.test(doc.slice(doc.indexOf('### Lo que no entra todavía'))), '5 no entra', '«Lo que no entra todavía» sigue con lo de gratis o de pago')
  for (const t of ['El orden nuevo de los días', 'Toda esta sección es de la Tanda 7']) debe(!doc.includes(t), '5 fuera', `sigue en el documento: ${t}`)
  for (const t of ['Qué días lleva cada viaje', 'El día de excursión', 'El orden de los días']) debe(doc.includes(`**${t}**`), '5 se queda', `«${t}» tiene que quedarse en el documento`)
  debe(/Ya lo visitaste el \{día\}/.test(doc), '5 ya lo visitaste', 'falta «Ya lo visitaste el {día}»')
  debe(/Los imprescindibles nunca van «de camino»/.test(doc), '5 imprescindibles', 'falta la regla de los imprescindibles nunca «de camino»')
}

// ═══ 6. Los textos nuevos de los datos ═══
console.log('6. Los textos nuevos de los datos')
{
  const textos = Object.entries(L.dias).flatMap(([id, d]) => Object.entries(d.textos ?? {}).map(([k, v]) => [`${id}.${k}`, v]))
  debe(textos.length >= 12, '6 hay textos', `solo ${textos.length} textos nuevos`)
  for (const [k, v] of textos) {
    debe(!/taxi|centro|Terravision|Rome Airport|ATRAL|KiPoint|KiBag|Trenitalia|sal a las/i.test(v), '6 texto', `${k}: «${v}» lleva taxi, «centro», una empresa o una hora calculada`)
    debe(!/\b\d{1,2}:\d{2}\b/.test(v), '6 hora', `${k}: «${v}» lleva una hora escrita (solo {hora} del viajero)`)
    debe(!/\bDía \d/.test(v), '6 día n', `${k}: «${v}» lleva «Día n»`)
  }
}

// ═══ 7. Que las mañanas cortas y las últimas mañanas cabrían (aviso, no fallo) ═══
console.log('7. ¿Caben con la hora más temprana de su fila? (aviso)')
const noCabe = []
{
  const travel = travelTimesFor('roma')
  const coord = (s) => s.coordenadas ?? D.places.find((p) => p.name === s.lugar)?.coordinates
  const andando = (a, b) => { const x = coord(a); const y = coord(b); return x && y ? (travel.leg(x, y)?.minutes ?? 0) : 0 }
  /** Minutos de una lista de paradas: lo que dura cada una más lo que se anda entre ellas. */
  const duracion = (paradas) => {
    const reales = paradas.filter((s) => s.tipo !== 'traslado')
    let total = 0
    reales.forEach((s, i) => { total += s.min ?? 0; if (i > 0) total += andando(reales[i - 1], s) })
    return total
  }
  const SALIR_FCO = 180 // el margen de Fiumicino, el más largo: es la hora más temprana de la fila
  const inicioDe = (lista) => (lista.partes?.manana?.empieza ?? lista.partes?.unica?.empieza ? mins(lista.partes?.manana?.empieza ?? lista.partes?.unica?.empieza) : 9 * 60)
  const COMIDA = 60
  const cortas = [['DC-vaticano', '13:30'], ['DC-roma-antigua', '13:30'], ['DC-pincio-popolo', '13:30'], ['DC-aventino', '13:30'], ['DC-cupula', '13:30']]
  for (const [id, vuelo] of cortas) {
    const ventana = mins(vuelo) - SALIR_FCO - inicioDe(L.dias[id])
    const necesita = duracion(L.dias[id].partes.unica.manana)
    console.log(`  ${id}: vuelo ${vuelo} → ventana ${ventana} min; la lista necesita ${necesita} min`)
    if (necesita > ventana) noCabe.push(`${id}: necesita ${necesita} min y con el vuelo de ${vuelo} desde Fiumicino hay ${ventana}`)
  }
  for (const f of L.llegadas.ultimas_mananas.filter((x) => x.lista)) {
    const dia = L.dias[f.lista]
    const parte = dia.partes[f.parte]
    // «sin comida» (vuelo de 15:00): lo de antes de la comida; «con comida» (17:00): lo de antes, la comida, y lo de después.
    const antes = parte.manana
    // (Solo la lista plana del Aventino sigue después de la comida; en el D1 y el D6 la tarde es la del día entero.)
    const despues = f.lista === 'DA-medio' ? parte.tarde ?? [] : []
    for (const [vuelo, conComida] of [['15:00', false], ['17:00', true]]) {
      const ventana = mins(vuelo) - SALIR_FCO - inicioDe(dia)
      const paradas = conComida ? [...antes, ...despues] : antes
      const necesita = duracion(paradas) + (conComida && (parte.comida || f.lista === 'DA-medio') ? COMIDA : 0)
      console.log(`  ${f.lista} (${f.parte}) con vuelo ${vuelo}${conComida ? ' con comida' : ' sin comida'}: ventana ${ventana} min; necesita ${necesita} min`)
      if (necesita > ventana) noCabe.push(`${f.lista} ${conComida ? 'con comida' : 'sin comida'}: necesita ${necesita} min y con el vuelo de ${vuelo} desde Fiumicino hay ${ventana}`)
    }
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
if (noCabe.length) { console.log('\nNO CABE (para las PREGUNTAS, sin recortar nada):'); for (const t of noCabe) console.log(`  - ${t}`) }
process.exitCode = fallos.length ? 1 : 0
