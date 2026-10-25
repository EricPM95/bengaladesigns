// La prueba de la Tanda 10M (los avisos de la ruta): junta las dos mitades y suma sus resultados.
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10M.mjs
//   · pruebaTanda10M_motor.mjs: lo que sale del motor (tarjetas especiales, un aviso por fecha, la excepción, cierres de la semana, último domingo, campos de la campana). Sin navegador.
//   · pruebaTanda10M_app.mjs: lo que se ve en la app (las tres tarjetas, la ventana de avisos, DÍAS sin pastillas ni «el sol se pone», la campana). En Chrome sin ventana.
//   · muestraRutas60.mjs: las rutas (paradas, días, horas) salen exactamente iguales que antes (la tanda no cambia el reparto).
import { spawnSync } from 'node:child_process'

const partes = [
  ['pruebaTanda10M_motor.mjs', /(\d+)\s+comprobaciones\s*·\s*(\d+)\s+fallos/],
  ['pruebaTanda10M_app.mjs', /(\d+)\s+comprobaciones\D{1,6}(\d+)\s+fallos/],
  ['muestraRutas60.mjs', null],
]
let comprobaciones = 0
let fallos = 0
for (const [f, patron] of partes) {
  const r = spawnSync(process.execPath, [`scripts/destino/${f}`], { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 })
  const salida = `${r.stdout}\n${r.stderr}`
  const m = patron ? patron.exec(salida) : null
  if (patron) {
    if (!m) {
      fallos++
      console.log(`✗ ${f}: no ha dado resultado\n${salida.split('\n').slice(-8).join('\n')}`)
      continue
    }
    comprobaciones += Number(m[1])
    fallos += Number(m[2])
    console.log(`${Number(m[2]) === 0 ? '✓' : '✗'} ${f}: ${m[1]} comprobaciones, ${m[2]} fallos`)
    if (Number(m[2]) > 0) console.log(salida.split('\n').filter((l) => /✗|FALLO/.test(l)).slice(0, 12).join('\n'))
  } else {
    comprobaciones++
    const ok = r.status === 0
    if (!ok) fallos++
    console.log(`${ok ? '✓' : '✗'} ${f}: ${salida.split('\n').filter((l) => /Muestra de/.test(l)).join(' ')}`)
  }
}
console.log(`\nPrueba de la Tanda 10M: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
