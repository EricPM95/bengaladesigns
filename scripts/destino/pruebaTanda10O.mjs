// La prueba de la Tanda 10O (EXPLORAR): junta las partes y suma sus resultados.
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10O.mjs
//   · pruebaTanda10O_datos.mjs: las dos pestañas, las listas de Lugares y Miradores (orden, fuera de la lista, al final, los siete que suben, la Terraza), el Free Tour, Entradas (el Castillo por fuera), Excursiones,
//     la tarjeta Hoteles, añadir un sitio sin hora (mejor hueco, el aviso de cierre con sus dos botones), la ruedita y los días con fecha. En Chrome sin ventana; guarda las capturas.
//   · pruebaTanda10O_api.mjs: la API de excursiones y entradas solo para los emails de admin, la caché en 4 h como mucho, las descripciones y valoraciones tal como vienen. Sin navegador y sin red.
//   · muestraRutas60.mjs: las rutas (paradas, días, horas) salen exactamente iguales que antes (la tanda no toca el motor: la ruta de Navidad con el Tridente, el mercadillo y el Lungotevere no cambia).
import { spawnSync } from 'node:child_process'

const partes = [
  ['pruebaTanda10O_datos.mjs', /(\d+)\s+comprobaciones\s*·\s*(\d+)\s+fallos/],
  ['pruebaTanda10O_api.mjs', /(\d+)\s+comprobaciones\s*·\s*(\d+)\s+fallos/],
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
console.log(`\nPrueba de la Tanda 10O: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
