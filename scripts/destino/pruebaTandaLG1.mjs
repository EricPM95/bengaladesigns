// La prueba de la Tanda LG1 (la pestaña «Logros» en la ficha y el sello «Por conseguir»): junta las dos partes y suma sus resultados.
//   A: la pestaña «Logros» de la ficha de cada lugar (Roma y Lanzarote).
//   B: el sello gris y el botón antes del viaje, los radios por sitio, el atardecer y la siguiente parada.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaLG1.mjs
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+(?:comprobaciones(?: bien)?|bien)\s*[·,.]\s*(\d+)\s+fallos/
const partes = ['pruebaTandaLG1_A.mjs', 'pruebaTandaLG1_B.mjs']
let comprobaciones = 0
let fallos = 0
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos++
    console.log(`✗ ${texto}`)
  }
}
for (const f of partes) {
  const r = spawnSync(process.execPath, [`scripts/destino/${f}`], { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024, timeout: 25 * 60 * 1000 })
  const salida = `${r.stdout ?? ''}\n${r.stderr ?? ''}`
  const m = patron.exec(salida.split('\n').reverse().find((l) => patron.test(l)) ?? '')
  if (!m) {
    fallos++
    console.log(`✗ ${f}: no ha dado resultado`)
    continue
  }
  comprobaciones += Number(m[1])
  fallos += Number(m[2])
  console.log(`${Number(m[2]) === 0 ? '✓' : '✗'} ${f}: ${m[1]} comprobaciones, ${m[2]} fallos`)
  if (Number(m[2]) > 0) console.log(salida.split('\n').filter((l) => /^\s*(✗|FALLO)/.test(l)).slice(0, 12).join('\n'))
}
const reglas = fs.readFileSync('docs/REGLAS_DE_LA_APP.md', 'utf8')
debe(/## LG1/.test(reglas) || /LG1 \(4-nov\)/.test(reglas), 'REGLAS_DE_LA_APP.md no lleva la sección «LG1»')
debe(fs.existsSync('docs/dias/REPASO_LG1.html'), 'falta docs/dias/REPASO_LG1.html')
debe(fs.existsSync('src/components/logros/ficha/PestanaLogros.tsx'), 'falta la pestaña «Logros» de la ficha')
console.log(`Prueba de la Tanda LG1: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
