// La prueba de la Tanda 10S8: junta las partes y suma sus resultados.
//   · A: leer documentos solo con sesión, con el pase y con límites (servidor). · B: imprescindibles grandes y orden al adaptar un día corto (motor nuevo de la 10S7c). · C: «Llegada y vuelta» como Design y los componentes compartidos. · D: «Entradas y Free Tour» y «Alojamiento» como Design.
// Además comprueba que REPASO_10S8.html lleva los apartados de ESTA tanda (la lista de comprobación).
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+comprobaciones\s*[·,]\s*(\d+)\s+fallos/
const partes = ['pruebaTanda10S8_A.mjs', 'pruebaTanda10S8_B.mjs', 'pruebaTanda10S8_C.mjs', 'pruebaTanda10S8_D.mjs']
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
// La lista de comprobación tiene que ser la de ESTA tanda (Eric, 31-oct): REPASO_10S8.html lleva todos los apartados de su lista de puntos y ninguno de otra tanda.
{
  const puntos = JSON.parse(fs.readFileSync('docs/dias/_10s8_puntos.json', 'utf8'))
  const html = fs.existsSync('docs/dias/REPASO_10S8.html') ? fs.readFileSync('docs/dias/REPASO_10S8.html', 'utf8') : ''
  const apartados = [...new Set(puntos.map((p) => p.apartado))]
  comprobaciones++
  const faltan = apartados.filter((a) => !html.includes(a.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')))
  if (!html || faltan.length) {
    fallos++
    console.log(`✗ REPASO_10S8.html no lleva sus apartados (faltan: ${faltan.join(' | ') || 'el archivo'})`)
  } else console.log(`✓ REPASO_10S8.html lleva sus ${apartados.length} apartados`)
  comprobaciones++
  const deOtraTanda = ['Repaso de la Tanda 10S4', 'Repaso de la Tanda 10S7c'].filter((t) => html.includes(t))
  if (deOtraTanda.length) {
    fallos++
    console.log(`✗ REPASO_10S8.html lleva títulos de otra tanda (${deOtraTanda.join(', ')})`)
  } else console.log('✓ y ningún título de otra tanda')
}
console.log(`\nPrueba de la Tanda 10S8: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
