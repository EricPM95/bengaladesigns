// Tanda 6y9: (1) fuente y fecha para la Iglesia del Gesù y Santa Maria in Trastevere, que tenían tramos sin fuente anotada; (2) los tramos que acababan el 28 de febrero pasan al 29 (si no, el 29 de febrero de un año bisiesto
// se quedaba sin horario). Repetible.
import fs from 'node:fs'
const FILE = 'data/pipeline_v2/roma.json'
let text = fs.readFileSync(FILE, 'utf8')
const AUDITORIAS = {
  'Iglesia del Gesù': {
    confianza: 'media',
    fuente: 'https://www.turismoroma.it/it/luoghi/chiesa-del-ges%C3%B9 (Roma Capitale)',
    nota: 'Invierno y verano como los da Roma Capitale (verano: cierra a las 12:00 y reabre a las 17:00). No se pudo abrir la web de la iglesia: sin verificar en la oficial.',
    fecha: '2026-10-12',
  },
  'Iglesia de Santa Maria in Trastevere': {
    confianza: 'media',
    fuente: 'https://turismoroma.it/it/luoghi/basilica-di-santa-maria-trastevere (Roma Capitale)',
    nota: 'Todos los días 07:30-21:00 confirmado por el listado de Roma Capitale. La pausa de agosto (08:00-12:00 y 16:00-21:00) NO se pudo confirmar en ninguna web: se deja la anterior.',
    fecha: '2026-10-12',
  },
}
for (const [name, audit] of Object.entries(AUDITORIAS)) {
  const marca = `      "name": "${name}",`
  if (!text.includes(marca)) throw new Error(`no encuentro ${name}`)
  const lugar = text.indexOf(marca)
  const hasta = text.indexOf('\n      "name": ', lugar + 10)
  const bloque = text.slice(lugar, hasta === -1 ? undefined : hasta)
  if (bloque.includes('"hours_audit"')) continue
  const json = JSON.stringify(audit, null, 2).split('\n').map((l, i) => (i === 0 ? l : '      ' + l)).join('\n')
  text = text.replace(marca, `${marca}\n      "hours_audit": ${json},`)
}
// 28 → 29 de febrero en los tramos de Roma (solo dentro de by_period).
const lines = text.split('\n')
let inPeriod = false
let n = 0
for (let i = 0; i < lines.length; i++) {
  if (lines[i] === '      "by_period": [') inPeriod = true
  else if (inPeriod && lines[i].startsWith('      ]')) inPeriod = false
  if (inPeriod && /^\s+"to": "02-28"(,?)$/.test(lines[i])) { lines[i] = lines[i].replace('02-28', '02-29'); n++ }
}
text = lines.join('\n')
JSON.parse(text)
fs.writeFileSync(FILE, text)
console.log({ febrero: n })
