// Ayuda para editar archivos con trozos de varias líneas (CRLF o LF): node scripts/destino/_rep.mjs <archivo> <archivoConParesJSON>
import fs from 'node:fs'
const [, , archivo, pares] = process.argv
let s = fs.readFileSync(archivo, 'utf8')
const crlf = s.includes('\r\n')
s = s.replace(/\r\n/g, '\n')
for (const [a, b] of JSON.parse(fs.readFileSync(pares, 'utf8'))) {
  if (!s.includes(a)) { console.error('NO ENCONTRADO:', a.slice(0, 80)); process.exit(1) }
  s = s.replace(a, () => b)
}
fs.writeFileSync(archivo, crlf ? s.replace(/\n/g, '\r\n') : s)
console.log('ok', archivo)
