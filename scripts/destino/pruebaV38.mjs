// La prueba de la Tanda V38 (22-nov): avisos de cerrado con el día real, DÍAS (asa a la izquierda), «Crear mi propio día» (mapa en el destino, sin comida ni cena, «Añadir lugares»), iconos del filtro en el mapa,
// título de la hoja de fechas, sorpresas por reclamar y ficha de los logros de viajero del Resumen. Es un ENVOLTORIO: corre cada parte (una a una, nunca dos Chrome a la vez) y suma sus fallos.
//   node scripts/destino/pruebaV38.mjs   ·   node scripts/destino/pruebaV38.mjs parte=avisos   (avisos, dias o resumen)
// Las partes de pantalla piden el Vite en 5173 y la API en 8787 con DESTINOS_OCULTOS=ninguno (Lanzarote visible).
import { spawnSync } from 'node:child_process'

const PARTES = [
  ['avisos', 'scripts/destino/pruebaV38_avisos.mjs'],
  ['dias', 'scripts/destino/pruebaV38_dias.mjs'],
  ['resumen', 'scripts/destino/pruebaV38_resumen.mjs'],
]
const pedida = process.argv.find((a) => a.startsWith('parte='))?.slice(6)
const malas = []
for (const [nombre, archivo] of PARTES) {
  if (pedida && pedida !== nombre) continue
  console.log(`\n=== V38 · ${nombre} (${archivo})`)
  const r = spawnSync(process.execPath, [archivo], { stdio: 'inherit', env: { APP_URL: 'http://localhost:5173', ...process.env } })
  if (r.status !== 0) malas.push(nombre)
}
console.log(malas.length ? `\nPrueba V38: FALLAN ${malas.join(', ')}` : '\nPrueba V38: todas las partes en 0 fallos')
process.exit(malas.length ? 1 : 0)
