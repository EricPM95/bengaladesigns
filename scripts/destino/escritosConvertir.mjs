// Pasa las tablas de docs/dias/DIAS_ESCRITOS_ROMA.md a los ficheros de data/dias/roma/ (formato "escrito").
//   node scripts/destino/escritosConvertir.mjs          → escribe D0, D0-medio, D1, D1-corto, D2, D3, D1-FT, DT-medio y DM-medio
//   node scripts/destino/escritosConvertir.mjs --solo-comprobar   → no escribe: solo cuenta tablas y filas
// Las horas, los minutos y el «cómo» se copian TAL CUAL. Lo único que se añade es el enlace de cada fila con su lugar de la ficha y el texto
// de cada colchón (la tabla «Qué hay en cada colchón» del documento).
// (Tanda 2, 5-oct-2026: el documento trae 62 tablas; el número de cada una es su orden de aparición. Si se edita el documento y cambia el orden,
// la comprobación de abajo —la primera fila de cada tabla— falla en vez de copiar una tabla equivocada.)
import fs from 'node:fs'
import { anadirExtras, completarAlternativas } from './escritosExtras.mjs'
import { corregirDistancias } from './distancias.mjs'

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
    // (Tanda 4: el texto de un colchón va POR TABLA, no por sitio: el documento lo escribe debajo de la tabla, «Texto del colchón de … de esta mañana … : «…».)
    let textoColchon = null
    for (let k = j; k < Math.min(j + 6, md.length) && !/^(#|\| Hora)/.test(md[k]); k++) {
      const m = /^\*\*Texto del colchón de .*?\*\*.*?«(.+)»\s*$/.exec(md[k])
      if (m) { textoColchon = m[1]; break }
    }
    tables.push({ n: tables.length + 1, h2, h3, label, rows, line: i + 1, textoColchon })
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
  // Tanda 3
  'Ara Pacis': 'Ara Pacis',
  'Cementerio Protestante': 'Cementerio Protestante',
  'Circo Máximo': 'Circo Máximo',
  'Cúpula de San Pedro': 'Cúpula de San Pedro',
  'Fuente del Tritón': 'Fuente del Tritón',
  'Pirámide Cestia': 'Pirámide Cestia',
  'Porta Pinciana': 'Porta Pinciana',
  'Termas de Caracalla': 'Termas de Caracalla',
  'Basílica de San Clemente': 'Basílica de San Clemente',
  'Castillo de Sant\'Angelo, hasta la terraza del ángel': "Castillo de Sant'Angelo",
  'Basílica de San Clemente, con las excavaciones': 'Basílica de San Clemente',
  'Museos Capitolinos': 'Museos Capitolinos',
  'Santa Maria in Aracoeli': 'Santo Bambino de Aracoeli',
  'Terraza del Altar de la Patria': 'Altar de la Patria',
  'Via Veneto': 'Via Veneto',
  'Cripta de los Capuchinos': 'Cripta de los Capuchinos',
  'Terraza de Largo Gaetana Agnesi': 'Terraza de Largo Gaetana Agnesi',
  'Mirador de San Pietro in Montorio': 'Mirador de San Pietro in Montorio',
  'Villa Farnesina': 'Villa Farnesina',
  'Basílica de Santa Cecilia in Trastevere': 'Basílica de Santa Cecilia in Trastevere',
  'Catacumbas de San Calixto': 'Catacumbas de San Calixto',
  'Via Appia Antica': 'Via Appia Antica',
  'El Coliseo desde el Colle Oppio': 'Colle Oppio',
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
  // Tanda 3
  'Enoteca Corsi': 'Enoteca Corsi',
  'Felice a Testaccio': 'Felice a Testaccio',
  'Dar Filettaro a Santa Barbara': 'Dar Filettaro a Santa Barbara',
  'Trattoria Dal Cavalier Gino': 'Trattoria Dal Cavalier Gino',
  'Ristorante Arlù': 'Ristorante Arlù',
  '200 Gradi': '200 Gradi',
  'Sgarro Bistrot': 'Sgarro Bistrot',
  'Buccone Vini e Olii': 'Buccone Vini e Olii',
  'Mordi e Vai': 'Mordi e Vai',
  'La Taverna dei Fori Imperiali': 'La Taverna dei Fori Imperiali',
  'Trattoria Valentino': 'Trattoria Valentino',
  'en el Mercado de Testaccio, Mordi e Vai': 'Mordi e Vai',
}
const NOCHES = {
  'Piazza Navona de noche': 'Piazza Navona (noche)',
  'Fontana de Trevi iluminada': 'Fontana de Trevi (noche)',
  'Plaza de España de noche': 'Plaza de España (noche)',
  'El Foro Romano desde el Campidoglio (noche)': 'Foro Romano desde el Campidoglio (noche)',
  "El Puente y el Castillo de Sant'Angelo iluminados": "El Puente y el Castillo de Sant'Angelo (noche)",
  'Coliseo iluminado': 'Coliseo (noche)',
  'Trastevere de noche': 'Trastevere de noche',
  'El Foro Romano desde el Campidoglio, de noche': 'Foro Romano desde el Campidoglio (noche)',
  'Panteón de noche': 'Panteón (noche)',
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
  // (El tercer dato es el nombre con el que se pide la foto del paseo —hueco en _fotos.json—; sin él, la foto del lugar.)
  [/Trastevere tranquilo/, 'Trastevere', 'Trastevere tranquilo'],
  [/Testaccio/, 'Testaccio', 'Paseo por Testaccio'],
  [/Aventino/, 'Ojo de la Cerradura del Aventino', 'Paseo por el Aventino'],
  [/Gueto/, 'Teatro de Marcelo'],
  [/Tridente/, 'Via del Babuino'],
  [/Foros de Trajano/, 'Columna de Trajano', 'Foros de Trajano'],
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
  [/^Castillo de Sant'Angelo, hasta la terraza/, { lugar: "Castillo de Sant'Angelo", titulo: true }],
  [/^Basílica de San Clemente, con las excavaciones/, { lugar: 'Basílica de San Clemente', titulo: true, paren: true }],
  [/^Museos Capitolinos, con la terraza/, { lugar: 'Museos Capitolinos', titulo: true }],
  [/^Santa Maria in Aracoeli y su escalinata/, { lugar: 'Santa Maria in Aracoeli', titulo: true, campos: { foto: 'Santa Maria in Aracoeli' } }],
  // (La terraza con el ascensor panorámico es otra visita que la del interior del Altar —el D1—: la regla de «por dentro una sola vez» no las junta.)
  [/^Terraza del Altar de la Patria/, { lugar: 'Terraza del Altar de la Patria', titulo: true, campos: { otra_visita: true, foto: 'Terraza del Altar de la Patria' } }],
  [/^El Foro Romano desde la terraza del Campidoglio, con la luz/, { lugar: 'Foro Romano y Palatino', titulo: true, modo: 'fuera' }],
  [/^Recorre la Vía Appia Antica en bici/, { lugar: 'Via Appia Antica', titulo: true, paren: true }],
  [/^Atardecer en la Vía Appia Antica/, { lugar: 'Via Appia Antica', titulo: true }],
  [/^Cripta de los Capuchinos/, { lugar: 'Cripta de los Capuchinos', titulo: true }],
  // (El Coliseo desde la terraza de Largo Gaetana Agnesi usa la foto del Coliseo: Tanda 4.)
  [/^El Coliseo desde la terraza de Largo Gaetana Agnesi/, { lugar: 'Terraza de Largo Gaetana Agnesi', titulo: true, campos: { foto: 'Coliseo' } }],
  [/^Via Veneto, la calle de/, { lugar: 'Via Veneto', titulo: true }],
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
  [/Villa Borghese/, () => 'Pinos, el lago con el Templo de Esculapio en su isla (se alquilan barcas de remos, unos 20 min), la Fontana dei Cavalli Marini y la Piazza di Siena; y, si sobra tiempo, una bici o un risciò (cuatriciclo) para dar la vuelta al parque.'],
  [/Passeggiata del Gianicolo/, () => 'La avenida de los bustos de Garibaldi, el monumento ecuestre a Garibaldi, el de Anita Garibaldi y el Faro de los Argentinos, con Roma a los pies.'],
  [/^Plaza de San Pedro, ya iluminada/, () => 'La columnata de Bernini, el obelisco y las dos fuentes; los dos discos del suelo desde donde las cuatro filas de columnas se ven como una sola.'],
  [/^Piazza Navona/, () => 'Las tres fuentes (los Cuatro Ríos, el Moro y Neptuno), Sant\'Agnese in Agone y los pintores de la plaza.'],
  [/hacia la Plaza de España/, () => 'La Piazza di Pietra con el Templo de Adriano, la Piazza Colonna con la Columna de Marco Aurelio y Via Frattina.'],
  [/Centro Histórico/, () => 'Via del Governo Vecchio, la Piazza di Pasquino con su «estatua parlante» y Via dei Coronari, la calle de los anticuarios.'],
]
// («hacia la Plaza de España» va antes que «Centro Histórico»: el título dice las dos cosas.)
const CONTADO = [
  [/Testaccio: /, 'La Piazza Testaccio, el Monte dei Cocci (una colina hecha de ánforas rotas romanas) y el antiguo matadero.'],
  [/el Aventino: /, (t) => 'Santa Sabina, el Parque Savello y la Via di Santa Sabina' + (/Rosaleda/.test(t) ? ' y, en mayo y junio, la Rosaleda.' : '.')],
  [/Gueto iluminado/, () => 'El Gueto con sus calles estrechas, el Pórtico de Octavia y el Teatro de Marcelo, iluminados.'],
  [/Tridente/, (t) => 'Via Margutta, Via del Babuino, Via della Croce y el Caffè Greco' + (/iluminado/.test(t) ? ', con las luces de la noche.' : '.')],
  [/Foros de Trajano/, () => 'La Columna de Trajano y los Mercados de Trajano, por fuera.'],
]
const colchonTexto = (titulo) => {
  const contado = CONTADO.find(([re]) => re.test(titulo))
  if (contado) return typeof contado[1] === 'function' ? contado[1](titulo) : contado[1]
  const orden = [...COLCHONES].sort((a, b) => (/hacia la Plaza de España/.test(a[0].source) ? -1 : 0) - (/hacia la Plaza de España/.test(b[0].source) ? -1 : 0))
  const hit = orden.find(([re]) => re.test(titulo))
  return hit ? hit[1](titulo) : null
}

const FALLOS = new Set()
process.on('exit', () => {
  if (FALLOS.size) console.log([...FALLOS].join('\n'))
})
function fila(row) {
  if (process.env.CONV_TODOS) { try { return fila0(row) } catch (e) { FALLOS.add(e.message + "  <<" + row.texto + "|" + row.como + ">>"); return { tipo: "x", hora: row.hora, min: row.min, lugar: "x" } } }
  return fila0(row)
}
function fila0(row) {
  const { hora, min } = row
  const texto = row.texto.replace(/\*\*/g, '').trim()
  const como = row.como
  const base = { hora, min, texto_documento: row.texto, como_documento: como }
  const colchon = /\(colchón\)/.test(texto)
  const atardecer = /(al|del) atardecer/.test(texto) || /^Atardecer en/.test(texto)
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
    const full = (name) => RESTAURANTES[/^en el Mercado de Testaccio/.test(name) ? 'Mordi e Vai' : String(name).replace(/,.*$/, '').trim()] ?? null
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
    const [, lugar, foto] = PASEO_LUGAR.find(([re]) => re.test(limpio)) ?? []
    if (!lugar) throw new Error('Paseo sin lugar: ' + limpio)
    return { ...out, ...extra, tipo: 'paseo', lugar, titulo, ...(foto ? { foto } : {}) }
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
    if (def.modo) modo = def.modo
    if (def.paseo) {
      const textoColchon = colchon ? colchonTexto(limpio) : null
      return { ...out, ...(textoColchon ? { texto: textoColchon } : {}), tipo: 'paseo', lugar: def.lugar, titulo: limpio, ...(/reloj de agua/.test(limpio) ? { foto: 'Reloj de agua del Pincio' } : {}) }
    }
  }
  const lugar = LUGARES[nombre]
  if (!lugar) throw new Error('Lugar sin enlace: «' + limpio + '» → «' + nombre + '»')
  // («Al atardecer» con su «cómo» —por dentro, por fuera— sigue con su «cómo» y se marca `atardecer`: el motor lo ajusta al sol. Sin «cómo», el modo es atardecer, como siempre.)
  const mod = atardecer && !modo ? 'atardecer' : modo
  const guia = (LARGO.has(lugar) && modo === 'dentro') || undefined
  const textoColchon = colchon ? colchonTexto(limpio) : null
  return { ...out, ...(textoColchon ? { texto: textoColchon } : {}), tipo: 'parada', lugar, ...(titulo ? { titulo } : {}), modo: mod, ...(turno ? { turno: true, hora_tipo: 'turno' } : {}), ...(reserva ? { reserva: true, hora_tipo: 'reserva' } : {}), ...(guia ? { guia: true } : {}), ...(atardecer && modo ? { atardecer: true } : {}), ...(frase?.[1]?.campos ?? {}), ...(/Grutas/.test(texto) ? { con_grutas: true } : {}) }
}

// La primera fila de cada tabla (hora y texto): si el documento cambia de orden, el convertidor lo dice en vez de copiar otra tabla.
const PRIMERA = JSON.parse(fs.readFileSync(new URL('./escritosPrimeras.json', import.meta.url), 'utf8'))
const T = (n) => {
  const table = tables.find((t) => t.n === n)
  if (!table) throw new Error('Falta la tabla ' + n)
  const first = `${table.rows[0].hora} ${table.rows[0].texto}`
  if (PRIMERA[n] && !first.startsWith(PRIMERA[n])) throw new Error(`La tabla ${n} (línea ${table.line}) ya no empieza por «${PRIMERA[n]}» sino por «${first}»: el documento ha cambiado de orden`)
  const filas = table.rows.map(fila)
  if (table.textoColchon) {
    const colchon = filas.find((row) => row.colchon)
    if (colchon) colchon.texto = table.textoColchon
  }
  return filas
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
  nombre: 'Día de la Roma antigua, el centro y Trastevere',
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
    miercoles_manana: { unica: T(12) },
    manana_con_museos: { unica: T(10) },
    tarde_sin_museos: { AB: T(8), CD: T(9) },
    tarde_con_museos: { unica: T(11) },
  },
}
// ── D1 ───────────────────────────────────────────────────────────────────────────────────────
const manana1 = T(13).filter((r) => r.tipo !== 'comida')
const d1ab = [...manana1, ...T(14)]
out['D1'] = {
  id: 'D1',
  nombre: 'Día de la Roma antigua',
  versiones: {
    normal: { AB: d1ab, C: d1ab.map((r) => ({ ...r, derivada: true })), D: [...manana1, ...T(15)] },
    free_tour_tarde: { unica: T(83) },
    free_tour_noche: { unica: T(84) },
  },
}
// ── D2 ───────────────────────────────────────────────────────────────────────────────────────
const a2 = T(20)
out['D2'] = {
  id: 'D2',
  nombre: 'Día del Vaticano y Trastevere',
  versiones: {
    normal: {
      A: a2,
      B: desdeA(a2, "Castillo de Sant'Angelo", 60, T(21)),
      C: desdeA(a2, "Castillo de Sant'Angelo", 60, T(22)),
      D: desdeA(a2, "Castillo de Sant'Angelo", 60, T(23)),
    },
    miercoles: { A: T(67), B: T(68), CD: T(69) },
    domingo: { AB: T(70), CD: T(71) },
    miercoles_sin_museos: { A: T(72), B: T(73), CD: T(74) },
    reserva_10_12: { AB: T(75), CD: T(76) },
    reserva_13: { AB: T(77), CD: T(78) },
    reserva_14_16: { ABC: T(79), D: T(80) },
    fiesta: { unica: T(85) },
  },
}
// ── D3 ───────────────────────────────────────────────────────────────────────────────────────
// (La tabla C y D del documento empieza en el bus al Vaticano: la mañana, hasta la comida, es la de la A y la B.)
const d3ab = T(24)
out['D3'] = {
  id: 'D3',
  nombre: 'Día del Free Tour y el Vaticano por la tarde',
  versiones: { normal: { AB: d3ab, CD: [...d3ab.slice(0, d3ab.findIndex((row) => row.tipo === 'comida') + 1), ...T(25)] }, domingo: { AB: T(81), CD: T(82) } },
}
// ── D1-FT ────────────────────────────────────────────────────────────────────────────────────
const a1ft = T(26)
out['D1-FT'] = {
  id: 'D1-FT',
  nombre: 'Día de la Roma antigua, el Gueto y Trastevere',
  versiones: {
    normal: {
      A: a1ft,
      B: hastaLugar(a1ft, 'Isla Tiberina', T(27)),
      C: hastaLugar(a1ft, 'Isla Tiberina', T(28)),
      D: hastaLugar(a1ft, 'Isla Tiberina', T(29)),
    },
  },
}
// ── DT-medio: medio día del Tridente y el Pincio (2,5 días) ───────────────────────────────────────
out['DT-medio'] = {
  id: 'DT-medio',
  nombre: 'Medio día del Tridente y el Pincio',
  versiones: {
    manana: { unica: T(33) },
    tarde: { A: T(34), B: T(36), C: T(37), D: T(38) },
    tarde_invierno: { unica: T(35) },
  },
}
// ── DM-medio: medio día de Monti (2,5 días con Free Tour de mañana, por la mañana) ───────────────────
out['DM-medio'] = {
  id: 'DM-medio',
  nombre: 'Medio día de Monti',
  versiones: { manana: { unica: T(43) } },
}

// ── Tanda 3: D4, DA-medio, D5, D6 y D7 ────────────────────────────────────────────────────────
// (Lo que el documento dice que hace el motor —lunes, miércoles, cierres, Free Tour de mañana— no se copia aquí: lo hace el motor y lo apunta en el registro.
// Aquí solo van las tablas escritas y lo que el documento reescribe a mano: el lunes del DA-medio y el lunes y el domingo del D5.)
const copiar = (rows) => rows.map((row) => ({ ...row }))
const unir = (manana, tardes) => Object.fromEntries(Object.entries(tardes).map(([letra, tarde]) => [letra, [...copiar(manana), ...tarde]]))
// D4: Villa Borghese, el Popolo y la Plaza de España
// (Lunes —o cualquier día en que la Galería cierra—: la mañana con la Cripta de los Capuchinos, tabla del documento; la tarde, la de siempre. Su colchón no habla de la Galería.)
const mananaLunes = T(50)
const colchonLunes = mananaLunes.find((row) => row.colchon)
if (colchonLunes?.texto) colchonLunes.texto = colchonLunes.texto.replace(/,? y a las 10:30 en la puerta de la Galería\.?$/, '.').replace(/ Si sobra tiempo, una bici o un risciò para dar una vuelta\.$/, ' Si sobra tiempo, una bici o un risciò para dar una vuelta.')
out['D4'] = { id: 'D4', nombre: 'Día de Villa Borghese, el Popolo y la Plaza de España', versiones: { normal: unir(T(45), { A: T(46), B: T(47), C: T(48), D: T(49) }), lunes: unir(mananaLunes, { A: T(46), B: T(47), C: T(48), D: T(49) }) } }
// DA-medio: el Aventino y Testaccio (mañana de vuelta)
out['DA-medio'] = { id: 'DA-medio', nombre: 'Medio día del Aventino y Testaccio', versiones: { manana: { unica: T(51) }, lunes: { unica: T(52) } } }
// D5: las basílicas y el Aventino
const d5 = unir(T(53), { A: T(54), B: T(55), C: T(56), D: T(57) })
// - Lunes: las Termas cierran: en B, C y D la tarde es como la A (el colchón del Aventino de la C se mete para llegar con el sol).
// - Domingo: San Clemente solo abre por la tarde: Letrán a las 11:30, comida a las 12:45 y San Clemente a las 14:00, y el taxi sale de San Clemente.
const reordenarDomingo = (rows) => {
  const iComida = rows.findIndex((row) => row.tipo === 'comida')
  const clemente = rows.find((row) => row.lugar === 'Basílica de San Clemente')
  const letran = rows.find((row) => row.lugar === 'Basílica de San Juan de Letrán')
  const antes = rows.slice(0, iComida).filter((row) => row !== clemente && row !== letran)
  const d = 'domingo: San Clemente solo abre por la tarde'
  return [...antes, { ...letran, hora: '11:30', derivada: d }, { ...rows[iComida], hora: '12:45', derivada: d }, { ...clemente, hora: '14:00', derivada: d }, ...rows.slice(iComida + 1)]
}
const colchonAventino = d5.C.find((row) => row.colchon && /Aventino/.test(row.titulo ?? row.texto_documento ?? ''))
out['D5'] = {
  id: 'D5',
  nombre: 'Día de las basílicas y el Aventino',
  versiones: {
    normal: d5,
    lunes: { A: d5.A, B: d5.A, C: d5.A, D: d5.A },
    domingo: Object.fromEntries(Object.entries(d5).map(([letra, rows]) => [letra, reordenarDomingo(rows)])),
  },
  // (Una fila que el motor mete antes del mirador si la tarde llega pronto al sol: el lunes, sin Termas, para B, C y D.)
  // (Con su `id`: el colchón que se mete para llegar con el sol no se vuelve a acortar —va «protegido»—.)
  colchon_insertable: { dia_semana: 'lunes', fila: { id: 'paseo_pasea_y_pierdete_por_el_aventino_lunes', ...colchonAventino } },
}
// D6: Roma desde arriba
// (Miércoles con audiencia —la Basílica y la Cúpula cierran hasta las 12:30—: la mañana de la tabla del documento y la tarde de su versión, «con las horas corridas desde las 15:35»: Plaza del Campidoglio.)
const tardesD6 = { A: T(59), B: T(60), C: T(61), D: T(62) }
const miercolesD6 = Object.fromEntries(Object.entries(tardesD6).map(([letra, tarde]) => [letra, [...copiar(T(63)), ...tarde.map((row, i) => (i === 0 ? { ...row, hora: '15:35', recorrer_desde: 'miércoles con audiencia: la tarde se corre desde las 15:35' } : row))]]))
out['D6'] = { id: 'D6', nombre: 'Roma desde arriba', versiones: { normal: unir(T(58), tardesD6), miercoles: miercolesD6 } }
// D7: la Vía Appia y Trastevere tranquilo
out['D7'] = { id: 'D7', nombre: 'La Vía Appia y Trastevere tranquilo', versiones: { normal: unir(T(64), { AB: T(65), CD: T(66) }) } }

anadirExtras(out, { T, hastaLugar, hastaAntesDe })
completarAlternativas(out)
// Distancias (tanda 3): el hueco entre dos paradas da para lo que se anda de verdad más el margen; si no, se corren las horas y queda apuntado.
const distancias = process.argv.includes('--sin-distancias') ? { cambios: [], fijos: [] } : corregirDistancias(out)

// ── Escritura ────────────────────────────────────────────────────────────────────────────────
const soloComprobar = process.argv.includes('--solo-comprobar')
let filas = 0
for (const [id, day] of Object.entries(out)) {
  const full = { formato: 'escrito', fuente: 'docs/dias/DIAS_ESCRITOS_ROMA.md', ...day }
  for (const group of Object.values(full.versiones)) for (const [k, rows] of Object.entries(group)) { group[k] = idRows(rows); filas += rows.length }
  if (!soloComprobar) fs.writeFileSync(root + `data/dias/roma/${id}.json`, JSON.stringify(full, null, 2) + '\n')
}
// El informe de las distancias: cada tramo que no llegaba y cómo se corrigió (o por qué no se pudo).
if (!soloComprobar && !process.argv.includes('--sin-distancias')) {
  const unicos = (lista, clave) => { const vistos = new Set(); return lista.filter((x) => { const k = clave(x); if (vistos.has(k)) return false; vistos.add(k); return true }) }
  const cambios = unicos(distancias.cambios, (x) => `${x.dia}|${x.tramo}|${x.de}|${x.a}`)
  const fijos = unicos(distancias.fijos, (x) => `${x.dia}|${x.tramo}|${x.hora}`)
  const l = ['# Distancias de los días escritos (Tanda 3)', '', 'El hueco entre una parada y la siguiente tiene que dar para lo que se tarda andando de verdad (coordenadas de roma.json y el mismo cálculo que usa la app) más el margen del documento (10 min; 15 después de una visita guiada; lo «de camino», solo lo que se anda). Lo que no llegaba se ha corrido (solo hacia delante: la fila siguiente sale más tarde). Con la regla del documento tal cual y el mismo redondeo del motor (provisional, ver PREGUNTAS_TANDA3): solo se corren las horas (no se acorta ningún colchón ni comida; la cena puede retrasarse, hasta las 22:00). Así las tablas son coherentes con lo que el motor hace cuando corre las horas por otra causa (un cierre, el pool…). Si un día acaba más tarde de lo escrito, es por la suma de estos tramos. Lo hace el convertidor (`escritosConvertir.mjs`, con `distancias.mjs`), así que se repite solo cada vez que cambie el documento.', '', `**${cambios.length} tramos corregidos** (distintos, de ${distancias.cambios.length} apariciones en las tablas) y **${fijos.length} que no se pueden corregir** corriendo solo las horas (la fila de llegada es una reserva, un turno o el Free Tour: ahí manda el documento y se dejan como están).`, '', '## Corregidos', '']
  for (const x of cambios) l.push(`- **${x.dia}** (${x.donde}): ${x.tramo}: andando ${x.andar} min; ${x.fila}: ${x.de !== x.a ? `de las ${x.de} a las ${x.a}` : ''}${x.min_de !== x.min_a ? `${x.de !== x.a ? ' y ' : ''}de ${x.min_de} a ${x.min_a} min` : ''}`)
  l.push('', '## Sin corregir (corriendo solo las horas no se puede)', '')
  for (const x of fijos) l.push(`- **${x.dia}** (${x.donde}): ${x.tramo}: andando ${x.andar} min; faltan ${x.falta} min para llegar a las ${x.hora} (${x.porque})`)
  fs.writeFileSync(root + 'docs/dias/DISTANCIAS_TANDA3.md', l.join('\n') + '\n')
  // La propuesta (Tanda 4): por cada tabla que cambia, la fila del documento → la fila nueva. El documento no se toca: lo pasa el usuario y las tablas quedan iguales.
  {
    const porTabla = new Map()
    for (const x of distancias.cambios) porTabla.set(`${x.dia}|${x.donde}`, [...(porTabla.get(`${x.dia}|${x.donde}`) ?? []), x])
    const p = ['# Distancias: propuesta para el documento (Tanda 4)', '', 'Modo nuevo: cuando el hueco entre dos paradas no da para lo que se anda más el margen, **primero se acorta el colchón de antes** (sin bajar de 30 min; si ya tiene menos, no se toca) y lo que va entre el colchón y ese tramo se adelanta lo mismo; **solo si no basta se corre lo de después**. La cena va siempre a en punto o a y media (hacia arriba). El documento no se ha tocado: cada línea es la fila como está ahora en `DIAS_ESCRITOS_ROMA.md` → la fila nueva, por tabla. Si la pasas al documento, las tablas quedan iguales a lo que saca el motor.', '', `${porTabla.size} tablas cambian.`, '']
    for (const [clave, lista] of porTabla) {
      const [dia, donde] = clave.split('|')
      p.push(`### ${dia} · ${donde}`, '', '| Documento | Nuevo |', '|---|---|')
      for (const x of lista) p.push(`| ${x.de} · ${x.texto ?? x.fila} · ${x.min_de} min | ${x.a} · ${x.texto ?? x.fila} · ${x.min_a} min |`)
      p.push('')
    }
    if (distancias.fijos.length) { p.push('## Sin arreglo (hay que decidir en el documento)', ''); for (const x of unicos(distancias.fijos, (f) => `${f.dia}|${f.tramo}|${f.hora}`)) p.push(`- **${x.dia}** (${x.donde}): ${x.tramo}: faltan ${x.falta} min para llegar a las ${x.hora} (${x.porque})`); p.push('') }
    fs.writeFileSync(root + 'docs/dias/DISTANCIAS_PROPUESTA.md', p.join(String.fromCharCode(10)) + String.fromCharCode(10))
  }
  console.log(`distancias: ${cambios.length} corregidas, ${fijos.length} sin corregir (fila fija)`)
}
console.log(`tablas ${tables.length}, días ${Object.keys(out).length}, filas copiadas ${filas}`)
if (FALLOS.size) console.log([...FALLOS].join('\n'))
