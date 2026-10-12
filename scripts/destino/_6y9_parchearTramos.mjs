// Tanda 6y9: pasa los horarios de Roma a TRAMOS DE FECHAS que valen para cualquier año (el último domingo de marzo/octubre, el cambio de hora) y quita las estaciones antiguas (`by_season`
// y la última entrada por estación). Toca el texto del JSON línea a línea (git diff mínimo). Se puede repetir sin daño.
//   node scripts/destino/_6y9_parchearTramos.mjs
import fs from 'node:fs'

const FILE = 'data/pipeline_v2/roma.json'
const lines = fs.readFileSync(FILE, 'utf8').split('\n')
const out = []
const MAP_FROM = { '03-29': 'ultimo_domingo:3', '10-25': 'ultimo_domingo:10', '10-26': 'ultimo_domingo:10+1' }
const MAP_TO = { '03-28': 'ultimo_domingo:3-1', '10-24': 'ultimo_domingo:10-1', '10-25': 'ultimo_domingo:10' }
let inPeriod = false
let cambios = { from: 0, to: 0, bySeason: 0, lastEntry: 0 }
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  if (line === '      "by_period": [') inPeriod = true
  else if (inPeriod && line.startsWith('      ]')) inPeriod = false
  if (inPeriod) {
    let m = /^(\s+)"from": "(\d\d-\d\d)"(,?)$/.exec(line)
    if (m && MAP_FROM[m[2]]) { out.push(`${m[1]}"from": "${MAP_FROM[m[2]]}"${m[3]}`); cambios.from++; continue }
    m = /^(\s+)"to": "(\d\d-\d\d)"(,?)$/.exec(line)
    if (m && MAP_TO[m[2]]) { out.push(`${m[1]}"to": "${MAP_TO[m[2]]}"${m[3]}`); cambios.to++; continue }
  }
  // Fuera la estación antigua y la última entrada por estación (objeto con invierno/primavera/verano/otono).
  if (line === '      "by_season": {' || (line === '      "last_entry": {' && /"invierno"/.test(lines[i + 1] ?? ''))) {
    let j = i
    while (!/^      \},?$/.test(lines[j])) j++
    if (line.includes('by_season')) cambios.bySeason++
    else cambios.lastEntry++
    i = j
    continue
  }
  out.push(line)
}
let text = out.join('\n')
// (Si lo quitado era la última propiedad de un objeto, sobra una coma.)
text = text.replace(/,(\n\s*\})/g, '$1')
JSON.parse(text)
fs.writeFileSync(FILE, text)
console.log(cambios)
