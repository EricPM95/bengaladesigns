// La prueba de la Tanda 10N11 (alojamiento gratis y con pase, «Cómo llegar a tu alojamiento», candados del pase, lista del pase por puntos y HOY sin pase): junta las partes y suma sus resultados.
//   · _a: alojamiento (hoja y tarjeta), línea del vuelo, «Tú» con inicial. · _b: el día 1 de DÍAS, HOY y la tarjeta del vuelo. · _c: la lista del pase y HOY sin pase. · _g: el candado dorado sobre azul.
// No toca el motor de rutas.
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+comprobaciones\s*[·,]\s*(\d+)\s+fallos/
const partes = ['pruebaTanda10N11_a.mjs', 'pruebaTanda10N11_b.mjs', 'pruebaTanda10N11_c.mjs', 'pruebaTanda10N11_g.mjs']
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
console.log(`\nPrueba de la Tanda 10N11: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
