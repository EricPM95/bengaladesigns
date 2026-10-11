// Reparte la prueba de listas (las 365 fechas desde `desde`) en procesos paralelos. node scripts/destino/_correr365.mjs desde=2026-10-11 procesos=16 salida=ruta/carpeta [dias=1,2,3]
import { spawn } from 'node:child_process'
import fs from 'node:fs'
const args = Object.fromEntries(process.argv.slice(2).map((x) => x.split(/=(.*)/s).slice(0, 2)))
const desde = args.desde ?? '2026-10-11'
const procesos = Number(args.procesos ?? 16)
const salida = args.salida
fs.mkdirSync(salida, { recursive: true })
const add = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const trozo = Math.ceil(365 / procesos)
const t0 = Date.now()
let hechos = 0
const resultados = []
for (let i = 0; i < procesos; i++) {
  const inicio = i * trozo
  const n = Math.min(trozo, 365 - inicio)
  if (n <= 0) continue
  const extra = args.dias ? [`dias=${args.dias}`] : []
  const hijo = spawn('node', ['scripts/destino/pruebaListas.mjs', `desde=${add(desde, inicio)}`, `n=${n}`, `out=${salida}/trozo${i}.md`, `fallos=${salida}/trozo${i}.txt`, `json=${salida}/trozo${i}.json`, ...extra], { stdio: ['ignore', 'pipe', 'inherit'] })
  let texto = ''
  hijo.stdout.on('data', (d) => { texto += d })
  hijo.on('close', () => { hechos++; resultados.push({ i, desde: add(desde, inicio), n, texto: texto.trim().split('\n').at(-1) }); console.log(`trozo ${i} (${add(desde, inicio)} +${n}) listo: ${texto.trim().split('\n').at(-1)}`) })
}
process.on('exit', () => console.log(`fin en ${Math.round((Date.now() - t0) / 1000)} s`))
