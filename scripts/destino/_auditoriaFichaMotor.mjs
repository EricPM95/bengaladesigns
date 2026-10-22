// Tanda 11, punto 12: dónde NO coinciden los datos de la ficha (pipeline_v2/detalle/roma/*.json) con los que usa el motor (pipeline_v2/roma.json → places).
// Compara los días de cierre (lunes…) y las horas de apertura/cierre de cada lugar. Solo lee; imprime las diferencias.
import fs from 'node:fs'
import path from 'node:path'

const roma = JSON.parse(fs.readFileSync('data/pipeline_v2/roma.json', 'utf8'))
const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const motor = new Map(roma.places.map((p) => [norm(p.name), p]))
const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const dir = 'data/pipeline_v2/detalle/roma'
const horas = (texto) => [...String(texto ?? '').matchAll(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/g)].map((m) => `${m[1].padStart(2, '0')}:${m[2]}-${m[3].padStart(2, '0')}:${m[4]}`)
let diferencias = 0
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  const lugares = Array.isArray(data) ? data : data.places ?? data.lugares ?? Object.values(data).find(Array.isArray) ?? []
  for (const ficha of lugares) {
    const m = motor.get(norm(ficha.name))
    if (!m || !ficha.schedule) continue
    const cerradosFicha = (ficha.schedule.closed ?? []).map(norm).filter((c) => DIAS.some((d) => c.startsWith(d)) && !/reducido/.test(c)).map((c) => DIAS.find((d) => c.startsWith(d)))
    const cerradosMotor = (m.closed_on ?? []).map(norm).map((c) => DIAS.find((d) => c.startsWith(d))).filter(Boolean)
    const a = [...new Set(cerradosFicha)].sort().join(',')
    const b = [...new Set(cerradosMotor)].sort().join(',')
    if (a !== b) { diferencias++; console.log(`CIERRE  ${file} · ${ficha.name}: ficha=[${a}] motor=[${b}]`) }
    const hFicha = (ficha.schedule.periods ?? []).flatMap((p) => horas(p.hours)).sort().join(' ')
    const hMotor = [...horas(m.schedule), ...((m.windows ?? []).flatMap(horas))].sort()
    const hMotorTxt = [...new Set(hMotor)].join(' ')
    if (hFicha && hMotorTxt && hFicha !== hMotorTxt) { diferencias++; console.log(`HORAS   ${file} · ${ficha.name}: ficha=[${hFicha}] motor=[${hMotorTxt}]`) }
  }
}
console.log(`\n${diferencias} diferencias`)
