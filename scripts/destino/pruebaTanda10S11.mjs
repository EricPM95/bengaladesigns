// La prueba de la Tanda 10S11: junta las partes y suma sus resultados.
//   · A: la noche del día 5 (motor). · C: el día de vuelta. (La B, los fallos de pruebaFase6y5_pantallas, y pruebaTanda6g las pasa el principal aparte.)
// Además comprueba que REPASO_10S11.html lleva los apartados de ESTA tanda (la lista de comprobación).
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+comprobaciones\s*[·,]\s*(\d+)\s+fallos/
const partes = ['pruebaTanda10S11_A.mjs', 'pruebaTanda10S11_C.mjs']
let comprobaciones = 0
let fallos = 0
for (const f of partes) {
  const r = spawnSync(process.execPath, [`scripts/destino/${f}`], { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 })
  const salida = `${r.stdout}\n${r.stderr}`
  const m = patron.exec(salida) ?? (/"comprobaciones":(\d+),"fallos":(\d+)/.exec(salida) ?? null) /* (la parte A da su resultado en JSON) */
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
// (10S11, apartado 3) La Cúpula de San Pedro está en «solo por dentro» en la tabla de horarios.
{
  const tabla = JSON.parse(fs.readFileSync('docs/dias/_10s10_tabla_horarios.json', 'utf8'))
  comprobaciones += 2
  if (tabla.solo_dentro.some((x) => x.id === 'cupula_de_san_pedro')) console.log('✓ La Cúpula de San Pedro está en «solo por dentro»')
  else { fallos++; console.log('✗ La Cúpula de San Pedro no está en «solo por dentro»') }
  if (!tabla.dentro_y_fuera.some((x) => x.id === 'cupula_de_san_pedro')) console.log('✓ y ya no está en «por dentro y por fuera»')
  else { fallos++; console.log('✗ la Cúpula sigue en «por dentro y por fuera»') }
}
// La lista de comprobación tiene que ser la de ESTA tanda (Eric, 31-oct): REPASO_10S11.html lleva todos los apartados de su lista de puntos y ninguno de otra tanda.
{
  const puntos = JSON.parse(fs.readFileSync('docs/dias/_10s11_puntos.json', 'utf8'))
  const html = fs.existsSync('docs/dias/REPASO_10S11.html') ? fs.readFileSync('docs/dias/REPASO_10S11.html', 'utf8') : ''
  const apartados = [...new Set(puntos.map((p) => p.apartado))]
  comprobaciones++
  const faltan = apartados.filter((a) => !html.includes(a.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')))
  if (!html || faltan.length) {
    fallos++
    console.log(`✗ REPASO_10S11.html no lleva sus apartados (faltan: ${faltan.join(' | ') || 'el archivo'})`)
  } else console.log(`✓ REPASO_10S11.html lleva sus ${apartados.length} apartados`)
  comprobaciones++
  const deOtraTanda = ['Repaso de la Tanda 10S4', 'Repaso de la Tanda 10S10</h1>'].filter((t) => html.includes(t))
  if (deOtraTanda.length) {
    fallos++
    console.log(`✗ REPASO_10S11.html lleva títulos de otra tanda (${deOtraTanda.join(', ')})`)
  } else console.log('✓ y ningún título de otra tanda')
}
console.log(`\nPrueba de la Tanda 10S11: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
