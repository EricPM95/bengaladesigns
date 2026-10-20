// Cuánto pesa la app al abrirla (lo que baja el móvil antes de pintar): los archivos que nombra index.html (el script, los precargados y las hojas de estilo), comprimidos (gzip), en KB.
//   node scripts/destino/pesoAlAbrir.mjs <carpeta del build> [...]      (por ejemplo, la que saca `npx vite build --outDir <carpeta>`)
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

for (const dir of process.argv.slice(2)) {
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
  const rutas = new Set()
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)) rutas.add(m[1])
  let total = 0
  const filas = []
  for (const r of rutas) {
    const gz = zlib.gzipSync(fs.readFileSync(path.join(dir, r))).length
    total += gz
    filas.push(`${(gz / 1024).toFixed(1).padStart(7)} KB  ${r}`)
  }
  console.log(`${dir}\n${filas.join('\n')}\n  → al abrir: ${(total / 1024).toFixed(1)} KB (${rutas.size} archivos)\n`)
}
