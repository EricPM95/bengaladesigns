// Pasa las tablas de docs/dias/DIAS_ESCRITOS_ROMA.md a los ficheros de data/dias/roma/ (formato "escrito").
//   node scripts/destino/escritosConvertir.mjs          → escribe D0, D0-medio, D1, D1-corto, D2, D3, D1-FT, DT-medio y DM-medio
//   node scripts/destino/escritosConvertir.mjs --solo-comprobar   → no escribe: solo cuenta tablas y filas
// Las horas, los minutos y el «cómo» se copian TAL CUAL. Lo único que se añade es el enlace de cada fila con su lugar de la ficha y el texto
// de cada colchón (la tabla «Qué hay en cada colchón» del documento).
// (Tanda 2, 5-oct-2026: el documento trae 62 tablas; el número de cada una es su orden de aparición. Si se edita el documento y cambia el orden,
// la comprobación de abajo —la primera fila de cada tabla— falla en vez de copiar una tabla equivocada.)
import fs from 'node:fs'
import { anadirExtras, completarAlternativas } from './escritosExtras.mjs'

const root = 'C:/Users/ERIC/Desktop/CLAUDE PROYECTS/APP RUTAS/'
const md = fs.readFileSync(root + 'docs/dias/DIAS_ESCRITOS_ROMA.md', 'utf8').split(/\r?\n/)

// ── 1. Las tablas del documento, en orden ────────────────────────────────────────────────────
const tables = []
let h2 = ''
let h3 = ''
let label = ''
let inTable = false
for (let i = 0; i < md.length; i++) {
  const line = md[i]
  if (/^## /.test(line)) { h2 = line.slice(3); h3 = '' }
  else if (/^### /.test(line)) h3 = line.slice(4)
  else if (!line.startsWith('|') && !inTable && (/^\*\*.*\*\*\s*$/.test(line) || /^\*\*.*\*\*/.test(line) || /^(Tarde|Tardes) .*:$/.test(line))) label = line.replace(/\*/g, '').trim()
  if (/^\| Hora/.test(line)) {
    inTable = true
    const rows = []
    let j = i + 2
    while (md[j] && md[j].startsWith('|')) {
      const m = /^\| (\d\d:\d\d) \| (.+?) \|\s*(\d*)\s*\| ?(.*?) ?\|$/.exec(md[j])
      if (!m) throw new Error('Fila rara: ' + md[j])
      // (Una fila sin minutos es solo un aviso de llegada —«Galería Borghese: llegada con la reserva»—: la hace la regla de márgenes, no es una parada.)
      if (m[3] === '') { j++; continue }
      rows.push({ hora: m[1], texto: m[2], min: Number(m[3]), como: m[4] })
      j++
    }
    tables.push({ n: tables.length + 1, h2, h3, label, rows, line: i + 1 })
  } else if (!line.startsWith('|')) inTable = false
}

// ── 2. De una fila del documento a una fila del motor ────────────────────────────────────────
const LUGARES = {
  'Plaza de San Pedro': 'Plaza de San Pedro',
  'Basílica de San Pedro': 'Basílica de San Pedro',
  'Via della Conciliazione': 'Via della Conciliazione',
  "Castillo de Sant'Angelo": "Castillo de Sant'Angelo",
  "Puente Sant'Angelo": "Puente Sant'Angelo",
  'Piazza Navona': 'Piazza Navona',
  'Panteón': 'Panteón',
  'Fontana de Trevi': 'Fontana de Trevi',
  'Piazza Venezia': 'Plaza Venecia',
  'Altar de la Patria': 'Altar de la Patria',
  'Plaza del Campidoglio': 'Plaza del Campidoglio',
  'Via dei Fori Imperiali': 'Via dei Fori Imperiali',
  'Coliseo': 'Coliseo',
  'Arco de Constantino': 'Arco de Constantino',
  'Foro Romano y Palatino': 'Foro Romano y Palatino',
  'Museos Vaticanos y Capilla Sixtina': 'Museos Vaticanos y Capilla Sixtina',
  'Santa Maria in Trastevere': 'Iglesia de Santa Maria in Trastevere',
  'San Pietro in Montorio y el Tempietto': 'San Pietro in Montorio y Tempietto de Bramante',
  "Fontana dell'Acqua Paola": "Fontana dell'Acqua Paola",
  'Mirador del Janículo': 'Mirador del Janículo',
  'Isla Tiberina': 'Isla Tiberina',
  'Barrio Judío': 'Barrio Judío',
  'Fuente de las Tortugas': 'Fuente de las Tortugas',
  'Largo di Torre Argentina': 'Largo di Torre Argentina',
  'Elefantino de Bernini': 'Elefantino de Bernini',
  'Santa Maria sopra Minerva': 'Iglesia de Santa Maria sopra Minerva',
  'San Luigi dei Francesi': 'Iglesia de San Luigi dei Francesi',
  'Iglesia del Gesù': 'Iglesia del Gesù',
  "Campo de' Fiori": "Campo de' Fiori",
  'Teatro de Marcelo': 'Teatro de Marcelo',
  'Ponte Sisto': 'Ponte Sisto',
  // Tanda 2
  'Plaza de España': 'Plaza de España',
  'Piazza del Popolo': 'Piazza del Popolo',
  'Boca de la Verdad': 'Boca de la Verdad',
  'Jardín de los Naranjos': 'Jardín de los Naranjos',
  'Ojo de la Cerradura del Aventino': 'Ojo de la Cerradura del Aventino',
  'Terraza del Pincio': 'Terraza del Pincio',
  'Parque de Villa Borghese': 'Parque de Villa Borghese',
  'Galería Borghese': 'Galería Borghese',
  'Basílica de San Juan de Letrán': 'Basílica de San Juan de Letrán',
  'Via dei Coronari': 'Via dei Coronari',
  'Via Condotti': 'Via Condotti',
  'Santa Maria del Popolo': 'Santa Maria del Popolo',
  'Trinità dei Monti': 'Trinità dei Monti',
  'Santa Maria Maggiore': 'Basílica de Santa María la Mayor',
  'San Pietro in Vincoli': 'Iglesia de San Pietro in Vincoli',
  'Plaza del Quirinal': 'Plaza del Quirinal',
  'Via del Babuino': 'Via del Babuino',
}
const RESTAURANTES = {
  'Armando al Pantheon': 'Armando al Pantheon',
  'Da Baffetto': 'Pizzeria Da Baffetto',
  'Pizzeria Da Baffetto': 'Pizzeria Da Baffetto',
  'Borghiciana': 'Borghiciana Pastificio Artigianale',
  'Nonna Betta': 'Nonna Betta',
  'Giggetto': "Giggetto al Portico d'Ottavia",
  "Giggetto al Portico d'Ottavia": "Giggetto al Portico d'Ottavia",
  'Supplizio': 'Supplizio',
  "L'Arcangelo": "L'Arcangelo",
  "Osteria dell'Angelo": "Osteria dell'Angelo",
  'Tonnarello': 'Tonnarello',
  'Da Enzo al 29': 'Trattoria Da Enzo al 29',
  'Pizzarium': 'Pizzarium (Bonci)',
  'Il Gabriello': 'Il Gabriello',
  // Tanda 2
  'Poldo e Gianna Osteria': 'Poldo e Gianna Osteria',
  'Edy': 'Edy',
  'Dal Toscano': 'Dal Toscano',
  'Piccolo Arancio': 'Piccolo Arancio',
  'SantoPalato': 'SantoPalato',
  'Il Bocconcino': 'Il Bocconcino',
  'La Boccaccia': 'La Boccaccia',
  'Trattoria Monti': 'Trattoria Monti',
}
const NOCHES = {
  'Piazza Navona de noche': 'Piazza Navona (noche)',
  'Fontana de Trevi iluminada': 'Fontana de Trevi (noche)',
  'Plaza de España de noche': 'Plaza de España (noche)',
  'El Foro Romano desde el Campidoglio (noche)': 'Foro Romano desde el Campidoglio (noche)',
  "El Puente y el Castillo de Sant'Angelo iluminados": "El Puente y el Castillo de Sant'Angelo (noche)",
  'Coliseo iluminado': 'Coliseo (noche)',
  'Trastevere de noche': 'Trastevere de noche',
}
// Los traslados: no son una parada, llevan al sitio de después (los minutos son los del documento).
const TRASLADOS = [
  [/^Bus 23 /, 'el bus 23 por el Lungotevere'],
  [/^Bus 40 o taxi/, 'el bus 40 o un taxi'],
  [/^Taxi /, 'un taxi'],
  [/^Metro B /, 'el metro B'],
]
// Los paseos no son un sitio: para andar usan las coordenadas de un sitio de su zona (el título es el del documento).
const PASEO_LUGAR = [
  [/Via Condotti/, 'Via Condotti'],
  [/Jardines del Pincio/, 'Jardines del Pincio'],
  [/Villa Borghese/, 'Parque de Villa Borghese'],
  [/Monti/, 'Monti'],
  [/Trastevere/, 'Trastevere'],
  [/Prati|Borgo Pio/, 'Borgo Pio'],
  [/hacia la Plaza de España/, 'Plaza Colonna'],
  [/centro iluminado/, 'Piazza Navona'],
  [/Centro Histórico/, "Campo de' Fiori"],
]
const LARGO = new Set(['Museos Vaticanos y Capilla Sixtina', 'Coliseo', 'Foro Romano y Palatino', 'Galería Borghese'])
// Filas cuyo título es una frase del documento (el sitio es otro): { lugar } y, si el título se ve tal cual, { titulo }.
const FRASES = [
  [/^Trinità dei Monti y su mirador/, { lugar: 'Trinità dei Monti', titulo: true }],
  [/^Via (del Babuino y Via Margutta|Margutta y Via del Babuino)/, { lugar: 'Via del Babuino', titulo: true }],
  [/^Bajar la escalinata de la Plaza de España/, { lugar: 'Plaza de España', titulo: true }],
  [/^San Juan de Letrán y la Escalera Santa/, { lugar: 'Basílica de San Juan de Letrán', titulo: true }],
  [/^Plaza de San Pedro: la bendición/, { lugar: 'Plaza de San Pedro', titulo: true }],
  [/^Plaza de San Pedro, ya iluminada/, { lugar: 'Plaza de San Pedro' }],
  [/^Plaza del Quirinal/, { lugar: 'Plaza del Quirinal', titulo: true, paren: true }],
  [/^Santa Maria del Popolo/, { lugar: 'Santa Maria del Popolo', titulo: true, paren: true }],
  [/^San Pietro in Vincoli/, { lugar: 'San Pietro in Vincoli', titulo: true, paren: true }],
  [/^Terraza del Pincio \(/, { lugar: 'Terraza del Pincio', titulo: true, paren: true }],
  [/^El Foro Romano, desde la terraza del Campidoglio/, { lugar: 'Foro Romano y Palatino', titulo: true }],
  [/^Parque de Villa Borghese/, { lugar: 'Parque de Villa Borghese' }],
  [/^Pasea por Villa Borghese hasta el Pincio/, { lugar: 'Parque de Villa Borghese', paseo: true }],
]

// ── Qué hay en cada colchón (tabla «Qué hay en cada colchón» del documento: se cuenta en el texto de la parada) ─────────────────
const FINAL_NOCHE_TRASTEVERE = ' De noche, ropa tendida, faroles y terrazas.'
const COLCHONES = [
  [/Trastevere/, (titulo) => `Piazza Trilussa con su fuente, Via della Lungaretta, Vicolo del Cinque, Via della Scala con la hiedra y la Piazza di Santa Maria in Trastevere con la fuente más antigua de Roma.${/iluminado/.test(titulo) ? FINAL_NOCHE_TRASTEVERE : ''}`],
  [/Borgo Pio y Prati/, () => 'La calle peatonal del Borgo y el Passetto di Borgo, el pasadizo elevado por el que los Papas escapaban al Castillo; Via Cola di Rienzo, la calle de compras de los romanos, y la Piazza Cavour con el Palacio de Justicia, el «Palazzaccio».'],
  [/Prati y el Borgo, hacia los Museos/, () => 'Borgo Pio, el Passetto, la Piazza del Risorgimento y los muros vaticanos hasta la entrada de los Museos.'],
  [/Prati/, () => 'Via Cola di Rienzo, la calle de compras de los romanos; la Piazza Cavour con el Palacio de Justicia, el «Palazzaccio»; la Piazza del Risorgimento junto a los muros vaticanos.'],
  [/Borgo Pio/, () => 'La calle peatonal del Borgo y el Passetto di Borgo, el pasadizo elevado por el que los Papas escapaban al Castillo.'],
  [/Via Condotti y el Tridente iluminados/, () => 'Los escaparates de Via Condotti, el Antico Caffè Greco (abierto desde 1760), Via Frattina y Via della Croce, y la Fontana della Barcaccia iluminada al pie de la escalinata. En Navidad, las luces.'],
  [/Jardines del Pincio/, () => 'Los bustos de italianos ilustres, el obelisco de Antínoo, el reloj de agua y la Casina Valadier por fuera.'],
  [/Villa Borghese/, () => 'Se sube por la rampa del Pincio a los jardines, con los bustos de italianos ilustres; el reloj de agua del Pincio (un hidrocronómetro del siglo XIX, en el Viale dell\'Orologio); el lago con el Templo de Esculapio, donde se alquilan barcas de remos (unos 20 min); la Fontana dei Cavalli Marini y la Piazza di Siena, entre pinos; y, si sobra tiempo, una bici o un risciò (cuatriciclo) para dar la vuelta al parque. La vuelta, por el Viale delle Magnolie, acaba en la terraza del Pincio a la hora del sol.'],
  [/Passeggiata del Gianicolo/, () => 'La avenida de los bustos de Garibaldi, el monumento ecuestre a Garibaldi, el de Anita Garibaldi y el Faro de los Argentinos, con Roma a los pies.'],
  [/^Plaza de San Pedro, ya iluminada/, () => 'La columnata de Bernini, el obelisco y las dos fuentes; los dos discos del suelo desde donde las cuatro filas de columnas se ven como una sola.'],
  [/^Piazza Navona/, () => 'Las tres fuentes (los Cuatro Ríos, el Moro y Neptuno), Sant\'Agnese in Agone y los pintores de la plaza.'],
  [/hacia la Plaza de España/, () => 'La Piazza di Pietra con el Templo de Adriano, la Piazza Colonna con la Columna de Marco Aurelio y Via Frattina.'],
  [/Centro Histórico/, () => 'Via del Governo Vecchio, la Piazza di Pasquino con su «estatua parlante» y Via dei Coronari, la calle de los anticuarios.'],
]
// («hacia la Plaza de España» va antes que «Centro Histórico»: el título dice las dos cosas.)
const colchonTexto = (titulo) => {
  const orden = [...COLCHONES].sort((a, b) => (/hacia la Plaza de España/.test(a[0].source) ? -1 : 0) - (/hacia la Plaza de España/.test(b[0].source) ? -1 : 0))
  const hit = orden.find(([re]) => re.test(titulo))
  return hit ? hit[1](titulo) : null
}

function fila(row) {
  const { hora, min } = row
  const texto = row.texto.replace(/\*\*/g, '').trim()
  const como = row.como
  const base = { hora, min, texto_documento: row.texto, como_documento: como }
  const colchon = /\(colchón\)/.test(texto)
  const atardecer = /al atardecer/.test(texto)
  const nota = [...texto.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]).filter((n) => n !== 'colchón' && !/^o /.test(n))
  const limpio = texto.replace(/\s*\([^)]*\)/g, '').trim()
  const out = { ...base, ...(colchon ? { colchon: true } : {}), ...(nota.length ? { nota: nota.join('; ') } : {}) }

  // Comidas y cenas: «A (o B; si cierran los dos, C), en zona»
  const meal = /^(Comida rápida|Comida|Cena):\s*(.+)$/.exec(texto)
  if (meal) {
    const [first, ...rest] = meal[2].split(/\s+\(o\s+/)
    const altTexto = rest.length ? rest[0].replace(/\).*$/, '').trim() : null
    const [alt, tercera] = altTexto ? altTexto.split(/;\s*si cierran los dos,\s*/) : [null, null]
    const principal = first.replace(/,\s*(en|al lado|junto).*$/, '').trim()
    const zona = (first.match(/,\s*(en .+|al lado .+|junto .+)$/) ?? [])[1] ?? ((rest[0] ?? '').match(/,\s*(en .+)$/) ?? [])[1] ?? null
    const full = (name) => RESTAURANTES[String(name).replace(/,.*$/, '').trim()] ?? null
    const restaurante = full(principal)
    const alternativa = alt ? full(alt) : null
    const terceraFull = tercera ? full(tercera) : null
    if (!restaurante) throw new Error('Restaurante sin enlace: ' + principal)
    if (alt && !alternativa && !/alternativa abierta/.test(alt)) throw new Error('Alternativa sin enlace: ' + alt)
    return { ...out, tipo: meal[1] === 'Cena' ? 'cena' : 'comida', rapida: meal[1] === 'Comida rápida' || undefined, restaurante, ...(alternativa ? { alternativa } : {}), ...(terceraFull ? { tercera: terceraFull } : {}), ...(zona ? { zona } : {}) }
  }
  // Free Tour
  if (/^Free Tour/.test(limpio)) return { ...out, tipo: 'tour', lugar: 'Free Tour Centro Histórico', hora_tipo: 'turno', guia: true, modo: null }
  // Traslados (bus, metro o taxi): no son una parada, llevan al sitio de después
  const traslado = TRASLADOS.find(([re]) => re.test(limpio))
  if (traslado) return { ...out, tipo: 'traslado', traslado: { como: traslado[1], min } }
  // Noches («(de mayo a septiembre)» es solo una nota: lo decide la hora límite de la noche)
  if (NOCHES[limpio] || NOCHES[texto]) return { ...out, tipo: 'noche', noche: NOCHES[limpio] ?? NOCHES[texto] }
  // Desayuno
  if (/^Desayuno (en|cerca)/.test(limpio)) return { ...out, tipo: 'desayuno', lugar: 'Desayuno romano', titulo: limpio }
  // Paseos
  if (/^(Pasea y piérdete|La Passeggiata)/.test(limpio)) {
    const titulo = /^Pasea y piérdete por Monti/.test(limpio) ? texto.replace(/\s*\(colchón\)/, '').trim() : limpio
    const textoColchon = colchon ? colchonTexto(titulo) : null
    const extra = { ...(textoColchon ? { texto: textoColchon } : {}) }
    if (/^La Passeggiata/.test(limpio)) return { ...out, ...extra, ...(colchon && !textoColchon ? { texto: colchonTexto(limpio) } : {}), tipo: 'paseo', lugar: 'Mirador del Janículo', titulo: limpio }
    const lugar = PASEO_LUGAR.find(([re]) => re.test(limpio))?.[1]
    if (!lugar) throw new Error('Paseo sin lugar: ' + limpio)
    return { ...out, ...extra, tipo: 'paseo', lugar, titulo }
  }
  // Paradas con lugar
  let modo = null
  let turno = false
  let reserva = false
  if (/por dentro/.test(como)) modo = 'dentro'
  if (/por fuera/.test(como)) modo = 'fuera'
  if (/de camino/.test(como)) modo = 'camino'
  if (/\(turno/.test(como)) turno = true
  if (/\(reserva\)/.test(como)) reserva = true
  let nombre = limpio.replace(/,?\s*al atardecer$/, '').replace(/,\s*ya iluminada$/, '').replace(/,\s*sin gente$/, '').replace(/,\s*aún tranquila$/, '').replace(/,\s*(frente|bajando).*$/, '').replace(/ \(el lago\)$/, '')
  let titulo = null
  const frase = FRASES.find(([re]) => re.test(texto))
  if (frase) {
    const [, def] = frase
    if (def.titulo) titulo = def.paren ? texto : limpio
    nombre = def.lugar
    if (def.paseo) {
      const textoColchon = colchon ? colchonTexto(limpio) : null
      return { ...out, ...(textoColchon ? { texto: textoColchon } : {}), tipo: 'paseo', lugar: def.lugar, titulo: limpio }
    }
  }
  const lugar = LUGARES[nombre]
  if (!lugar) throw new Error('Lugar sin enlace: «' + limpio + '» → «' + nombre + '»')
  const mod = atardecer ? 'atardecer' : modo
  const guia = (LARGO.has(lugar) && modo === 'dentro') || undefined
  const textoColchon = colchon ? colchonTexto(limpio) : null
  return { ...out, ...(textoColchon ? { texto: textoColchon } : {}), tipo: 'parada', lugar, ...(titulo ? { titulo } : {}), modo: mod, ...(turno ? { turno: true, hora_tipo: 'turno' } : {}), ...(reserva ? { reserva: true, hora_tipo: 'reserva' } : {}), ...(guia ? { guia: true } : {}), ...(/Grutas/.test(texto) ? { con_grutas: true } : {}) }
}

// La primera fila de cada tabla (hora y texto): si el documento cambia de orden, el convertidor lo dice en vez de copiar otra tabla.
const PRIMERA = {
  1: '09:45 Plaza de San Pedro', 2: '10:00 Coliseo', 3: '09:00 Coliseo', 4: '17:45 Pasea', 5: '17:10 Campo', 6: '17:10 Campo',
  7: '09:30 Plaza de San Pedro', 8: '15:00 Plaza de San Pedro', 9: '16:00 Plaza de San Pedro', 10: '08:00 Museos', 11: '13:45 Plaza de San Pedro',
  12: '08:30 Coliseo', 13: '13:50 **Comida', 14: '13:50 **Comida', 15: '13:50 **Comida', 16: '13:50 **Comida', 17: '07:45 Basílica de San Juan', 18: '13:50 **Comida',
  19: '08:00 Museos', 20: '15:50 Puente', 21: '15:50 Puente', 22: '15:50 Puente', 23: '07:45 Fontana de Trevi', 24: '13:50 Bus 40',
  25: '08:30 Coliseo', 26: '16:40 Santa Maria in Trastevere', 27: '16:40 Santa Maria in Trastevere', 28: '16:40 Santa Maria in Trastevere',
  29: '13:50 **Comida', 30: '07:45 Basílica de San Juan', 31: '13:50 **Comida',
  32: '07:45 Fontana de Trevi', 33: '15:00 Plaza de España', 34: '15:00 Plaza de España', 35: '15:00 Plaza de España', 36: '16:00 Plaza de España', 37: '16:00 Plaza de España',
  38: '07:40 Fontana de Trevi', 39: '15:00 Galería Borghese', 40: '15:00 Galería Borghese', 41: '15:00 Plaza de España', 42: '09:00 Fontana de Trevi', 43: '09:00 Plaza del Quirinal',
  44: '08:00 Museos', 45: '08:00 Museos', 46: '08:00 Museos', 47: '09:00 Plaza de San Pedro', 48: '09:00 Plaza de San Pedro',
  49: '09:00 Puente', 50: '09:00 Puente', 51: '09:00 Puente', 52: '08:30 Plaza de San Pedro', 53: '08:30 Plaza de San Pedro', 54: '08:30 Plaza de San Pedro', 55: '08:30 Plaza de San Pedro',
  56: '09:00 Santa Maria in Trastevere', 57: '09:00 Santa Maria in Trastevere', 58: '07:45 Fontana de Trevi', 59: '07:45 Fontana de Trevi', 60: '08:30 Coliseo', 61: '08:30 Coliseo', 62: '08:30 Pasea',
}
const T = (n) => {
  const table = tables.find((t) => t.n === n)
  if (!table) throw new Error('Falta la tabla ' + n)
  const first = `${table.rows[0].hora} ${table.rows[0].texto}`
  if (PRIMERA[n] && !first.startsWith(PRIMERA[n])) throw new Error(`La tabla ${n} (línea ${table.line}) ya no empieza por «${PRIMERA[n]}» sino por «${first}»: el documento ha cambiado de orden`)
  return table.rows.map(fila)
}
const idRows = (rows) => {
  const seen = new Map()
  return rows.map((row) => {
    const slug = (row.titulo ?? row.lugar ?? row.restaurante ?? row.noche ?? row.traslado?.como ?? row.tipo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    const key = `${row.tipo}_${slug}`
    const count = (seen.get(key) ?? 0) + 1
    seen.set(key, count)
    return { id: count > 1 ? `${key}#${count}` : key, ...row }
  })
}
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const mm = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3))

/** B, C y D del D2: la mañana de la A con la comida de 60 min (15 min menos) y las filas siguientes 15 min antes, hasta el Castillo; luego, la tabla. */
function desdeA(rowsA, hastaLugar, comidaMin, resto) {
  const iComida = rowsA.findIndex((r) => r.tipo === 'comida')
  const iHasta = rowsA.findIndex((r) => r.lugar === hastaLugar)
  const delta = rowsA[iComida].min - comidaMin
  const parte = rowsA.slice(0, iHasta + 1).map((r, i) => (i < iComida ? r : i === iComida ? { ...r, min: comidaMin, derivada: true } : { ...r, hora: hhmm(mm(r.hora) - delta), derivada: true }))
  return [...parte, ...resto]
}
/** Las filas de la A hasta un lugar (incluido) y la tabla de B, C o D. */
function hastaLugar(rowsA, lugar, resto) {
  const i = rowsA.findIndex((r) => r.lugar === lugar)
  return [...rowsA.slice(0, i + 1), ...resto]
}
/** Las filas de la A hasta un lugar (sin incluirlo) y la tabla de C o D, que empieza por ese lugar. */
function hastaAntesDe(rowsA, lugar, resto) {
  const i = rowsA.findIndex((r) => r.lugar === lugar)
  return [...rowsA.slice(0, i), ...resto]
}

const out = {}

// ── D0 ───────────────────────────────────────────────────────────────────────────────────────
out['D0'] = {
  id: 'D0',
  nombre: 'Roma en un día (crucero)',
  versiones: { normal: { unica: T(1) }, reves: { unica: T(2) } },
}
// ── D1-corto: el día entero del viaje de 1,5 días (todo por fuera) ─────────────────────────────
const a1c = T(3)
out['D1-corto'] = {
  id: 'D1-corto',
  nombre: 'Día entero del viaje de 1,5 días: la Roma antigua, el centro y Trastevere',
  versiones: {
    normal: {
      A: a1c,
      B: hastaLugar(a1c, "Campo de' Fiori", T(4)),
      C: hastaAntesDe(a1c, "Campo de' Fiori", T(5)),
      D: hastaAntesDe(a1c, "Campo de' Fiori", T(6)),
    },
  },
}
// ── D0-medio: medio día del Vaticano (por fuera; con los Museos solo con reserva o pool) ──────────
out['D0-medio'] = {
  id: 'D0-medio',
  nombre: 'Medio día del Vaticano',
  versiones: {
    manana: { unica: T(7) },
    manana_con_museos: { unica: T(10) },
    tarde_sin_museos: { AB: T(8), CD: T(9) },
    tarde_con_museos: { unica: T(11) },
  },
}
// ── D1 ───────────────────────────────────────────────────────────────────────────────────────
const manana1 = T(12).filter((r) => r.tipo !== 'comida')
const d1ab = [...manana1, ...T(13)]
out['D1'] = {
  id: 'D1',
  nombre: 'Día de la Roma antigua',
  versiones: {
    normal: { AB: d1ab, C: d1ab.map((r) => ({ ...r, derivada: true })), D: [...manana1, ...T(14)] },
    free_tour_tarde: { unica: T(60) },
    free_tour_noche: { unica: T(61) },
  },
}
// ── D2 ───────────────────────────────────────────────────────────────────────────────────────
const a2 = T(19)
out['D2'] = {
  id: 'D2',
  nombre: 'Día del Vaticano y Trastevere',
  versiones: {
    normal: {
      A: a2,
      B: desdeA(a2, "Castillo de Sant'Angelo", 60, T(20)),
      C: desdeA(a2, "Castillo de Sant'Angelo", 60, T(21)),
      D: desdeA(a2, "Castillo de Sant'Angelo", 60, T(22)),
    },
    miercoles: { A: T(44), B: T(45), CD: T(46) },
    domingo: { AB: T(47), CD: T(48) },
    miercoles_sin_museos: { A: T(49), B: T(50), CD: T(51) },
    reserva_10_12: { AB: T(52), CD: T(53) },
    reserva_13: { AB: T(54), CD: T(55) },
    reserva_14_16: { ABC: T(56), D: T(57) },
    fiesta: { unica: T(62) },
  },
}
// ── D3 ───────────────────────────────────────────────────────────────────────────────────────
// (La tabla C y D del documento empieza en el bus al Vaticano: la mañana, hasta la comida, es la de la A y la B.)
const d3ab = T(23)
out['D3'] = {
  id: 'D3',
  nombre: 'Día del Free Tour y el Vaticano por la tarde',
  versiones: { normal: { AB: d3ab, CD: [...d3ab.slice(0, d3ab.findIndex((row) => row.tipo === 'comida') + 1), ...T(24)] }, domingo: { AB: T(58), CD: T(59) } },
}
// ── D1-FT ────────────────────────────────────────────────────────────────────────────────────
const a1ft = T(25)
out['D1-FT'] = {
  id: 'D1-FT',
  nombre: 'Día de la Roma antigua, el Gueto y Trastevere',
  versiones: {
    normal: {
      A: a1ft,
      B: hastaLugar(a1ft, 'Isla Tiberina', T(26)),
      C: hastaLugar(a1ft, 'Isla Tiberina', T(27)),
      D: hastaLugar(a1ft, 'Isla Tiberina', T(28)),
    },
  },
}
// ── DT-medio: medio día del Tridente y el Pincio (2,5 días) ───────────────────────────────────────
out['DT-medio'] = {
  id: 'DT-medio',
  nombre: 'Medio día del Tridente y el Pincio',
  versiones: {
    manana: { unica: T(32) },
    tarde: { A: T(33), B: T(35), C: T(36), D: T(37) },
    tarde_invierno: { unica: T(34) },
  },
}
// ── DM-medio: medio día de Monti (2,5 días con Free Tour de mañana, por la mañana) ───────────────────
out['DM-medio'] = {
  id: 'DM-medio',
  nombre: 'Medio día de Monti',
  versiones: { manana: { unica: T(42) } },
}

anadirExtras(out, { T, hastaLugar, hastaAntesDe })
completarAlternativas(out)

// ── Escritura ────────────────────────────────────────────────────────────────────────────────
const soloComprobar = process.argv.includes('--solo-comprobar')
let filas = 0
for (const [id, day] of Object.entries(out)) {
  const full = { formato: 'escrito', fuente: 'docs/dias/DIAS_ESCRITOS_ROMA.md', ...day }
  for (const group of Object.values(full.versiones)) for (const [k, rows] of Object.entries(group)) { group[k] = idRows(rows); filas += rows.length }
  if (!soloComprobar) fs.writeFileSync(root + `data/dias/roma/${id}.json`, JSON.stringify(full, null, 2) + '\n')
}
console.log(`tablas ${tables.length}, días ${Object.keys(out).length}, filas copiadas ${filas}`)
