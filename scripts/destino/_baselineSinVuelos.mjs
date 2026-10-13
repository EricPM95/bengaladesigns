// «Sin vuelos, los días salen igual que antes de esta tanda» (Tanda 7, motor de la llegada).
//   node scripts/destino/_baselineSinVuelos.mjs --escribir   → guarda la huella de cada escenario (con el motor de ANTES de tocar nada) en _baseline_sinvuelos.json
//   node scripts/destino/_baselineSinVuelos.mjs              → compara el motor de ahora con esa huella (0 diferencias = igual que antes)
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { escenariosSinVuelos, huellaDePlan, planEscenario } from './llegadaLib.mjs'

const archivo = join(dirname(fileURLToPath(import.meta.url)), '_baseline_sinvuelos.json')
const escribir = process.argv.includes('--escribir')
const escenarios = escenariosSinVuelos()
const ahora = {}
for (const esc of escenarios) {
  let plan = null
  try { plan = planEscenario(esc) } catch (error) { ahora[esc.clave] = `ERROR ${String(error.message).slice(0, 80)}`; continue }
  ahora[esc.clave] = plan ? huellaDePlan(plan) : 'sin_plan'
}
if (escribir) {
  writeFileSync(archivo, `${JSON.stringify({ _nota: 'Huella de cada escenario «sin vuelos» con el motor de antes de la Tanda 7 (agente F). La compara _baselineSinVuelos.mjs.', escenarios: ahora }, null, 1)}\n`)
  console.log(`Escrito ${Object.keys(ahora).length} escenarios en ${archivo}`)
} else {
  if (!existsSync(archivo)) { console.log('Falta _baseline_sinvuelos.json'); process.exitCode = 1 } else {
    const antes = JSON.parse(readFileSync(archivo, 'utf8')).escenarios
    const distintos = Object.keys(ahora).filter((k) => antes[k] !== ahora[k])
    const sobran = Object.keys(antes).filter((k) => !(k in ahora))
    console.log(`${Object.keys(ahora).length} escenarios comparados, ${distintos.length} distintos${sobran.length ? `, ${sobran.length} que ya no están` : ''}`)
    for (const k of distintos.slice(0, 25)) console.log(`  DISTINTO ${k}`)
    if (distintos.length > 0 || sobran.length > 0) process.exitCode = 1
  }
}
