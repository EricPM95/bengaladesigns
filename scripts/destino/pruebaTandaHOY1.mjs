// La prueba de la Tanda HOY1 (el nuevo HOY, parte 1): junta las tres partes y suma sus resultados.
//   A: la siguiente parada y sus estados, «Tu día», el atardecer y mañana, «Hoy vuelves a casa».
//   B: la cámara de viaje, fuera de ruta, «Cerca de ti» y el juego.
//   C: los avisos del tiempo en directo, sin internet y los ajustes.
// Además comprueba de forma transversal que el REPASO y las reglas de esta tanda existen y que ningún archivo nuevo de HOY lleva textos de Roma pensados para Lanzarote.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY1.mjs
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const patron = /(\d+)\s+(?:comprobaciones(?: bien)?|bien)\s*[·,.]\s*(\d+)\s+fallos/
const partes = ['pruebaTandaHOY1_A.mjs', 'pruebaTandaHOY1_B.mjs', 'pruebaTandaHOY1_C.mjs']
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
debe(/## HOY1/.test(reglas), 'REGLAS_DE_LA_APP.md no lleva la sección «HOY1»')
debe(fs.existsSync('docs/dias/REPASO_HOY1.html'), 'falta docs/dias/REPASO_HOY1.html')
// Ningún texto de Roma en los archivos nuevos de HOY pensados para los dos destinos.
for (const f of ['src/components/route/hoy/CamaraViaje.tsx', 'src/components/route/hoy/FueraDeRuta.tsx', 'src/components/route/hoy/JuegoCerca.tsx', 'src/components/route/hoy/AvisosDelTiempo.tsx', 'src/components/route/hoy/SinConexionHoy.tsx', 'src/components/route/hoy/v2/ParadaHoy.tsx', 'src/components/route/hoy/v2/VueltaH14.tsx']) {
  const s = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  debe(!/['"`][^'"`\n]*(Coliseo|Panteón|Fiumicino|Ciampino|Trastevere|Vaticano)[^'"`\n]*['"`]/.test(s), `${f} lleva un texto de Roma escrito a mano`)
}
console.log(`Prueba de la Tanda HOY1: ${comprobaciones} comprobaciones · ${fallos} fallos`)
process.exit(fallos ? 1 : 0)
