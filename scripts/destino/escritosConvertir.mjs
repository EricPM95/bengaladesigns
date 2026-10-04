// Pasa las tablas de docs/dias/DIAS_ESCRITOS_ROMA.md a los ficheros de data/dias/roma/ (formato "escrito").
//   node scripts/destino/escritosConvertir.mjs          → escribe D0, D0-medio, D1, D2, D3 y D1-FT
//   node scripts/destino/escritosConvertir.mjs --solo-comprobar   → no escribe: solo cuenta tablas y filas
// Las horas, los minutos y el «cómo» se copian TAL CUAL. Lo único que se añade es el enlace de cada fila con su lugar de la ficha.
import fs from 'node:fs'

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
      const m = /^\| (\d\d:\d\d) \| (.+?) \| (\d+) \| ?(.*?) ?\|$/.exec(md[j])
      if (!m) throw new Error('Fila rara: ' + md[j])
      rows.push({ hora: m[1], texto: m[2], min: Number(m[3]), como: m[4] })
      j++
    }
    tables.push({ n: tables.length + 1, h2, h3, label, rows })
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
}
const NOCHES = {
  'Piazza Navona de noche': 'Piazza Navona (noche)',
  'Fontana de Trevi iluminada': 'Fontana de Trevi (noche)',
  'Plaza de España de noche': 'Plaza de España (noche)',
  'El Foro Romano desde el Campidoglio (noche)': 'Foro Romano desde el Campidoglio (noche)',
  "El Puente y el Castillo de Sant'Angelo iluminados": "El Puente y el Castillo de Sant'Angelo (noche)",
}
const TRASLADOS = {
  'Bus 23 por el Lungotevere hasta Trastevere': { como: 'el bus 23 por el Lungotevere' },
  'Bus 40 o taxi al Vaticano': { como: 'el bus 40 o un taxi' },
  'Taxi a Trevi': { como: 'un taxi' },
}
// Los paseos no son un sitio: para andar usan las coordenadas de un sitio de su zona (el título es el del documento).
const PASEO_LUGAR = [
  [/Trastevere/, 'Trastevere'],
  [/Prati|Borgo Pio/, 'Borgo Pio'],
  [/hacia la Plaza de España/, 'Plaza Colonna'],
  [/Centro Histórico/, "Campo de' Fiori"],
]
const LARGO = new Set(['Museos Vaticanos y Capilla Sixtina', 'Coliseo', 'Foro Romano y Palatino', 'Galería Borghese'])

function fila(row) {
  const { hora, min } = row
  let texto = row.texto.replace(/\*\*/g, '').trim()
  const como = row.como
  const base = { hora, min, texto_documento: row.texto, como_documento: como }
  const colchon = /\(colchón\)/.test(texto)
  const atardecer = /al atardecer/.test(texto)
  const nota = [...texto.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]).filter((n) => n !== 'colchón')
  let limpio = texto.replace(/\s*\([^)]*\)/g, '').trim()
  const out = { ...base, ...(colchon ? { colchon: true } : {}), ...(nota.length ? { nota: nota.join('; ') } : {}) }

  // Comidas y cenas
  const meal = /^(Comida rápida|Comida|Cena):\s*(.+)$/.exec(limpio)
  if (meal) {
    const [first, ...rest] = meal[2].split(/\s+\(o\s+/)
    const alt = rest.length ? rest[0].replace(/\).*$/, '').trim() : null
    const principal = first.replace(/,\s*(en|al lado).*$/, '').trim()
    const zona = (first.match(/,\s*(en .+|al lado .+)$/) ?? [])[1] ?? ((alt ?? '').match(/,\s*(en .+)$/) ?? [])[1] ?? null
    const full = (name) => RESTAURANTES[name.replace(/,.*$/, '').trim()] ?? null
    const restaurante = full(principal)
    const alternativa = alt ? full(alt.replace(/\).*$/, '')) : null
    if (!restaurante) throw new Error('Restaurante sin enlace: ' + principal)
    return { ...out, tipo: meal[1] === 'Cena' ? 'cena' : 'comida', rapida: meal[1] === 'Comida rápida' || undefined, restaurante, ...(alternativa ? { alternativa } : {}), ...(zona ? { zona } : {}) }
  }
  // Free Tour
  if (/^Free Tour/.test(limpio)) return { ...out, tipo: 'tour', lugar: 'Free Tour Centro Histórico', hora_tipo: 'turno', guia: true, modo: null }
  // Traslados (bus o taxi): no son una parada, llevan al sitio de después
  if (TRASLADOS[limpio]) return { ...out, tipo: 'traslado', traslado: { como: TRASLADOS[limpio].como, min }, ...(/julio y agosto/.test(texto) ? { nota: 'en julio y agosto' } : {}) }
  // Noches
  const nocheKey = texto.replace(/\s*\(en julio y agosto\)/, '')
  if (NOCHES[nocheKey] || NOCHES[limpio]) return { ...out, tipo: 'noche', noche: NOCHES[nocheKey] ?? NOCHES[limpio], ...(/julio y agosto/.test(texto) ? { solo_meses: [7, 8] } : {}) }
  // Desayuno
  if (/^Desayuno en/.test(limpio)) return { ...out, tipo: 'desayuno', lugar: 'Desayuno romano', titulo: limpio }
  // Paseos
  if (/^(Pasea y piérdete|La Passeggiata)/.test(limpio)) {
    if (/^La Passeggiata/.test(limpio)) return { ...out, tipo: 'paseo', lugar: 'Mirador del Janículo', titulo: limpio }
    const lugar = PASEO_LUGAR.find(([re]) => re.test(limpio))?.[1]
    if (!lugar) throw new Error('Paseo sin lugar: ' + limpio)
    return { ...out, tipo: 'paseo', lugar, titulo: limpio }
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
  let nombre = limpio.replace(/,?\s*al atardecer$/, '').replace(/,\s*ya iluminada$/, '').replace(/,\s*sin gente$/, '').replace(/,\s*(frente|bajando).*$/, '')
  let titulo = null
  if (nombre === 'El Foro Romano, desde la terraza del Campidoglio') { titulo = nombre; nombre = 'Foro Romano y Palatino' }
  if (nombre === 'Plaza de San Pedro, ya iluminada') nombre = 'Plaza de San Pedro'
  const lugar = LUGARES[nombre]
  if (!lugar) throw new Error('Lugar sin enlace: «' + limpio + '» → «' + nombre + '»')
  const mod = atardecer ? 'atardecer' : modo
  const guia = (LARGO.has(lugar) && modo === 'dentro') || undefined
  return { ...out, tipo: 'parada', lugar, ...(titulo ? { titulo } : {}), modo: mod, ...(turno ? { turno: true, hora_tipo: 'turno' } : {}), ...(reserva ? { reserva: true, hora_tipo: 'reserva' } : {}), ...(guia ? { guia: true } : {}), ...(/Grutas/.test(texto) ? { con_grutas: true } : {}) }
}

const T = (n) => {
  const table = tables.find((t) => t.n === n)
  if (!table) throw new Error('Falta la tabla ' + n)
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
/** La A de D1-FT hasta la Isla Tiberina y la tabla de B, C o D. */
function hastaLugar(rowsA, lugar, resto) {
  const i = rowsA.findIndex((r) => r.lugar === lugar)
  return [...rowsA.slice(0, i + 1), ...resto]
}

const out = {}

// ── D0 ───────────────────────────────────────────────────────────────────────────────────────
out['D0'] = {
  id: 'D0',
  nombre: 'Roma en un día (crucero)',
  versiones: { normal: { unica: T(1) }, reves: { unica: T(2) } },
}
// ── D0-medio ─────────────────────────────────────────────────────────────────────────────────
out['D0-medio'] = {
  id: 'D0-medio',
  nombre: 'Medio día del Vaticano',
  versiones: {
    manana: { unica: T(3) },
    tarde_con_museos: { unica: T(4) },
    tarde_sin_museos: { AB: T(5) },
    miercoles_manana: { unica: T(31) },
    domingo_manana: { unica: T(32) },
  },
}
// ── D1 ───────────────────────────────────────────────────────────────────────────────────────
const manana1 = T(6).filter((r) => r.tipo !== 'comida')
out['D1'] = {
  id: 'D1',
  nombre: 'Día de la Roma antigua',
  versiones: {
    normal: { AB: [...manana1, ...T(7)], C: [...manana1, ...T(8)], D: [...manana1, ...T(9)] },
    free_tour_tarde: { unica: T(35) },
    free_tour_noche: { unica: T(36) },
  },
}
// ── D2 ───────────────────────────────────────────────────────────────────────────────────────
const a2 = T(10)
out['D2'] = {
  id: 'D2',
  nombre: 'Día del Vaticano y Trastevere',
  versiones: {
    normal: {
      A: a2,
      B: desdeA(a2, "Castillo de Sant'Angelo", 60, T(11)),
      C: desdeA(a2, "Castillo de Sant'Angelo", 60, T(12)),
      D: desdeA(a2, "Castillo de Sant'Angelo", 60, T(13)),
    },
    miercoles: { A: T(20), B: T(21), CD: T(22) },
    domingo: { AB: T(23), CD: T(24) },
    reserva_10_12: { AB: T(25), CD: T(26) },
    reserva_13: { AB: T(27), CD: T(28) },
    reserva_14_16: { ABC: T(29), D: T(30) },
  },
}
// ── D3 ───────────────────────────────────────────────────────────────────────────────────────
out['D3'] = {
  id: 'D3',
  nombre: 'Día del Free Tour y el Vaticano por la tarde',
  versiones: { normal: { AB: T(14), CD: T(15) }, domingo: { AB: T(33), CD: T(34) } },
}
// ── D1-FT ────────────────────────────────────────────────────────────────────────────────────
const a1ft = T(16)
out['D1-FT'] = {
  id: 'D1-FT',
  nombre: 'Día de la Roma antigua, el Gueto y Trastevere',
  versiones: {
    normal: {
      A: a1ft,
      B: hastaLugar(a1ft, 'Isla Tiberina', T(17)),
      C: hastaLugar(a1ft, 'Isla Tiberina', T(18)),
      D: hastaLugar(a1ft, 'Isla Tiberina', T(19)),
    },
  },
}

// ── Escritura ────────────────────────────────────────────────────────────────────────────────
const soloComprobar = process.argv.includes('--solo-comprobar')
let filas = 0
for (const [id, day] of Object.entries(out)) {
  const full = { formato: 'escrito', fuente: 'docs/dias/DIAS_ESCRITOS_ROMA.md', ...day }
  for (const group of Object.values(full.versiones)) for (const [k, rows] of Object.entries(group)) { group[k] = idRows(rows); filas += rows.length }
  if (!soloComprobar) fs.writeFileSync(root + `data/dias/roma/${id}.json`, JSON.stringify(full, null, 2) + '\n')
}
console.log(`tablas ${tables.length}, días ${Object.keys(out).length}, filas copiadas ${filas}`)
