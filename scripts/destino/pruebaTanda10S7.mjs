// La prueba de la Tanda 10S7 (retoques de la 10N11): junta las partes y suma sus resultados.
//   · _a: el aviso pequeño en lo bloqueado y «Pase Roma» siempre. · _b: la lista del pase sin precios con el botón fijo y HOY sin pase completo. · _c: el botón de la cama en HOY.
// No toca el motor de rutas.
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+comprobaciones\s*[·,]\s*(\d+)\s+fallos/
const partes = ['pruebaTanda10S7_Q.mjs', 'pruebaTanda10S7_R.mjs', 'pruebaTanda10S7_S.mjs', 'pruebaTanda10S7_T.mjs']
let comprobaciones = 0
let fallos = 0
for (const f of partes) {
  const r = spawnSync(process.execPath, [`scripts/destino/${f}`], { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 })
  const salida = `${r.stdout}\n${r.stderr}`
  const m = patron.exec(salida)
  if (!m) {
    fallos++
    console.log(`✗ ${f}: no ha dado resultado\n${salida.split('\n').slice(-8).join('\n')}`)
    continue
  }
  comprobaciones += Number(m[1])
  fallos += Number(m[2])
  console.log(`${Number(m[2]) === 0 ? '✓' : '✗'} ${f}: ${m[1]} comprobaciones, ${m[2]} fallos`)
  if (Number(m[2]) > 0) console.log(salida.split('\n').filter((l) => /✗|FALLO/.test(l)).slice(0, 12).join('\n'))
}
console.log(`\nPrueba de la Tanda 10S7: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
