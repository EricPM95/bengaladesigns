// La prueba de la Tanda 10N10 (el repaso de Eric de la 10N7 y la 10N8): junta las partes y suma sus resultados.
//   · _avisos:   cada cambio es un aviso nuevo, el vuelo del invitado avisa al administrador, el sonido y la línea «Han cambiado el viaje» (migración 0065).
//   · _explorar: botón de logros en EXPLORAR, el + en restaurantes, sin el botón «Free Tour», la pastilla del pase al momento, añadir entre dos, solo sitios para visitar, la entrada con hora que no mueve la parada.
//   · _cuentas:  el presupuesto con el interruptor «Mi cuenta | Cuenta conjunta / del grupo», las hojas de dinero y el ejemplo del vuelo de 180 € (migración 0067).
//   · _reservas: RESERVAS, el vuelo, el alojamiento y las entradas como Design, y «Ir a comprar» con su pregunta al volver.
// (La prueba de dos cuentas reales, `pruebaTanda10N10_avisos_real.mjs`, va aparte: usa el Supabase real.) No toca el motor de rutas.
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+comprobaciones\s*[·,]\s*(\d+)\s+fallos/
const partes = ['pruebaTanda10N10_avisos.mjs', 'pruebaTanda10N10_explorar.mjs', 'pruebaTanda10N10_cuentas.mjs', 'pruebaTanda10N10_reservas.mjs']
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
console.log(`\nPrueba de la Tanda 10N10: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
