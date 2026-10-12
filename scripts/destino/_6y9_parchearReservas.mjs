// Tanda 6y9: horas reales de reserva (reserva_paso / reserva_nota / turnos_reserva del Free Tour) y la comprobación del 2026-10-12 en `hours_audit`. Texto línea a línea (git diff mínimo). Repetible.
//   node scripts/destino/_6y9_parchearReservas.mjs
import fs from 'node:fs'

const FILE = 'data/pipeline_v2/roma.json'
let text = fs.readFileSync(FILE, 'utf8')
const HOY = '2026-10-12'

// 1. Entradas con franja libre: la rueda va de la apertura a la última entrada oficial de ese día, cada 15 min.
const FRANJA = {
  Coliseo: 'Entrada con franja horaria: se elige la hora al comprarla. La rueda va de la apertura a la última entrada oficial de ese día (quien compró la entrada oficial sin guía puede entrar hasta entonces; las visitas guiadas acaban antes).',
  'Museos Vaticanos y Capilla Sixtina': 'Entrada con franja horaria: se elige la hora al comprarla, de la apertura a la última entrada oficial de ese día.',
  Panteón: 'SIN VERIFICAR: la web del Ministerio dice que se entra por orden de llegada y una guía de viajes dice que la entrada se compra con hora. Se deja la franja libre, de la apertura a la última entrada.',
}
// 2. Comprobaciones del 2026-10-12 (la web oficial no se podía abrir desde aquí: solo el buscador, que devuelve sus páginas).
const COMPROBADO = {
  Coliseo: 'Buscador (páginas de colosseo.it), 2026-10-12: 29 mar–30 sep 08:30-19:15 (última entrada 18:15); 1–24 oct 08:30-18:30 (17:30); 25 oct 2026–28 feb 2027 08:30-16:30 (15:30). Cierra 25 dic y 1 ene. Febrero y marzo de 2027, sin publicar: se usa el patrón de otros años.',
  'Foro Romano y Palatino': 'Buscador (páginas de colosseo.it), 2026-10-12: mismo calendario que el Coliseo, abriendo a las 09:00. 1–24 oct 09:00-18:30 (17:30); 25 oct–28 feb 09:00-16:30 (15:30).',
  Panteón: 'Buscador (cultura.gov.it), 2026-10-12: todos los días 09:00-19:00, última entrada 18:30, taquillas hasta las 18:00 (se deja la última entrada de 18:30). Sin publicar el horario de las misas.',
  'Museos Vaticanos y Capilla Sixtina': 'Buscador, 2026-10-12: el último domingo del mes 09:00-14:00 (última entrada 12:30) confirmado. El horario de lunes a sábado no se pudo volver a ver en la web oficial: se deja el del 2026-09-25.',
}
const SIN_VOLVER = 'La web oficial no se pudo abrir el 2026-10-12: vale la comprobación del 2026-09-25 y el cambio de hora se calcula (último domingo de marzo/octubre). Sin verificar de nuevo.'
const DST = ['Termas de Caracalla', 'Bioparque de Roma', 'Cúpula de San Pedro']

const lines = text.split('\n')
const out = []
let current = null
let inAudit = false
let hecho = new Set()
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const name = /^      "name": "(.+)",$/.exec(line)
  if (name) current = name[1]
  out.push(line)
  if (name && FRANJA[name[1]] && !hecho.has(`f:${name[1]}`)) {
    out.push(`      "reserva_paso": 15,`, `      "reserva_nota": ${JSON.stringify(FRANJA[name[1]])},`)
    hecho.add(`f:${name[1]}`)
  }
  if (line === '      "hours_audit": {') inAudit = true
  if (inAudit && /^        "fecha": /.test(line)) {
    // (Se inserta ANTES de la línea `fecha`: se saca la ya añadida y se vuelve a poner después.)
    out.pop()
    const nota = COMPROBADO[current] ?? (DST.includes(current) ? SIN_VOLVER : null)
    if (nota && !hecho.has(`a:${current}`)) { out.push(`        "comprobado_web": ${JSON.stringify(nota)},`); hecho.add(`a:${current}`) }
    out.push(line)
  }
  if (inAudit && line === '      },') inAudit = false
}
text = out.join('\n')

// 3. La Galería Borghese: lo que se pudo ver en la web oficial el 2026-10-12.
const borghese = '      "name": "Galería Borghese",'
if (!text.includes('"reserva_nota": "Entrada con hora fija')) {
  const nota = 'Entrada con hora fija (reserva obligatoria). Horario oficial 09:00-19:00, última entrada 17:45 (cultura.gov.it, 2026-10-12). SIN VERIFICAR: las horas de los turnos (cada hora y la de las 17:45) salen de la auditoría anterior; una guía de viajes habla de 5 turnos de 2 horas (9, 11, 13, 15 y 17).'
  text = text.replace(borghese, `${borghese}\n      "reserva_nota": ${JSON.stringify(nota)},`)
}

// 4. El Free Tour: sus seis horas (Eric, 6y9).
if (!text.includes('"turnos_reserva": [\n      "10:00",\n      "12:00"')) {
  text = text.replace('    "default_time": "10:00",', '    "default_time": "10:00",\n    "turnos_reserva": ["10:00", "12:00", "15:00", "17:00", "19:00", "21:00"],')
}
JSON.parse(text)
fs.writeFileSync(FILE, text)
console.log([...hecho])
