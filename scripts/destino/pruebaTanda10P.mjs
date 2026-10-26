// La prueba de la Tanda 10P (el pase, la moneda, el sorteo y el perfil): junta las partes y suma sus resultados.
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10P.mjs
//   · pruebaTanda10P_pase.mjs:    la película a todo el ancho, el final con scroll, [Ver], el final ya montado, la lista del pase y el precio en la moneda del viajero.
//   · pruebaTanda10P_hoy.mjs:     la historia de prueba (0/1, a los 3 s, una por destino) y HOY con el atardecer y lo de mañana.
//   · pruebaTanda10P_sorteo.mjs:  +200 EXP por invitar, el sorteo de punta a punta y el perfil y el pasaporte.
// No toca el motor de rutas: no hace falta la muestra de 60 viajes.
import { spawnSync } from 'node:child_process'

const partes = [
  ['pruebaTanda10P_pase.mjs', /(\d+)\s+comprobaciones\s*·\s*(\d+)\s+fallos/],
  ['pruebaTanda10P_hoy.mjs', /(\d+)\s+comprobaciones\s*·\s*(\d+)\s+fallos/],
  ['pruebaTanda10P_sorteo.mjs', /(\d+)\s+comprobaciones\s*·\s*(\d+)\s+fallos/],
]
let comprobaciones = 0
let fallos = 0
for (const [f, patron] of partes) {
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
console.log(`\nPrueba de la Tanda 10P: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
