// Tanda 10S9b, apartado 5 (agente C): las dos pruebas rotas de la 10S9 vuelven a 0 fallos.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S9b_C.mjs
// Mira directo lo suyo (código) y llama a las dos pruebas:
//   1. FichaPiezas (pestañas Resumen/Entradas/Tips) y EntradaCard («Añádela») llevan `zona-toque` (zona de toque de 44 × 44 sin cambiar lo que se ve).
//   2. pruebaCorr6z6_reservas: 0 fallos (fechas enteras «Miércoles 10»; «Sixt» solo como palabra entera, no «Capilla Sixtina»).
//   3. pruebaTanda10S4_I: 0 fallos.
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const fallos = []
let comprobaciones = 0
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) fallos.push(texto)
}
const leer = (f) => fs.readFileSync(f, 'utf8')

const piezas = leer('src/components/route/dayDetail/FichaPiezas.tsx')
debe(/className=\{`zona-toque relative rounded-full text-\[15px\]/.test(piezas), 'las pestañas de la ficha no llevan zona-toque')
const tarjeta = leer('src/components/route/reservas/EntradaCard.tsx')
debe(/className="zona-toque font-semibold text-text underline underline-offset-2"/.test(tarjeta), '«Añádela» no lleva zona-toque')
const corr = leer('scripts/destino/pruebaCorr6z6_reservas.mjs')
debe(/Sixt\\b/.test(corr), 'la prueba de RESERVAS no mira «Sixt» como palabra entera')
debe(/Miércoles\) 10/.test(corr), 'la prueba de RESERVAS no acepta «Miércoles 10»')

for (const p of ['pruebaCorr6z6_reservas', 'pruebaTanda10S4_I']) {
  const r = spawnSync(process.execPath, [`scripts/destino/${p}.mjs`], { encoding: 'utf8', env: process.env, maxBuffer: 64 * 1024 * 1024 })
  const salida = (r.stdout ?? '') + (r.stderr ?? '')
  console.log(`${p}: salida ${r.status} · ${salida.trim().split('\n').slice(-1)[0]}`)
  debe(r.status === 0, `${p} no acaba en 0 fallos`)
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ ${f}`)
process.exit(fallos.length ? 1 : 0)
