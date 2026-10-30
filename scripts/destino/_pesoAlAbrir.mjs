// Mide lo que se baja al abrir (los archivos que enlaza index.html) en un dist, y lo que pesan los chunks de interés.
// Uso: node scripts/destino/_pesoAlAbrir.mjs [carpetaDist]
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

export function pesoAlAbrir(dir) {
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
  const urls = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))]
  const filas = urls.map((u) => {
    const b = fs.readFileSync(path.join(dir, u))
    return { u, raw: b.length, gz: zlib.gzipSync(b).length }
  })
  return { filas, gz: filas.reduce((s, f) => s + f.gz, 0), raw: filas.reduce((s, f) => s + f.raw, 0) }
}

if (process.argv[1] && /_pesoAlAbrir.mjs$/.test(process.argv[1])) {
  const dir = process.argv[2] ?? 'dist'
  const r = pesoAlAbrir(dir)
  for (const f of r.filas) console.log(`${(f.gz / 1024).toFixed(1).padStart(7)} KB gz  ${(f.raw / 1024).toFixed(1).padStart(8)} KB  ${f.u}`)
  console.log(`TOTAL al abrir: ${(r.gz / 1024).toFixed(1)} KB gz`)
  for (const n of fs.readdirSync(path.join(dir, 'assets')).filter((n) => /^(ListaDelPase|Presupuesto|HojaLogros|ReservasScreen)/.test(n) && n.endsWith('.js'))) {
    const b = fs.readFileSync(path.join(dir, 'assets', n))
    console.log(`  chunk ${n}: ${(zlib.gzipSync(b).length / 1024).toFixed(1)} KB gz`)
  }
}
