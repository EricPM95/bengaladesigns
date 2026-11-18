// Pone <CruzDeHoja/> justo después de la línea de apertura de la hoja (V12): node scripts/destino/_ponerX.mjs <archivo> <textoQueIdentificaLaLinea> <onCerrar> [importRelativo]
import fs from 'node:fs'
const [, , archivo, marca, onCerrar, imp = '../ui/CruzDeHoja', extra = ''] = process.argv
let s = fs.readFileSync(archivo, 'utf8')
const crlf = s.includes('\r\n')
let lineas = s.replace(/\r\n/g, '\n').split('\n')
const i = lineas.findIndex((l) => l.includes(marca))
if (i < 0) { console.error('NO ENCONTRADA la línea', marca); process.exit(1) }
const sangria = lineas[i].match(/^\s*/)[0] + '  '
lineas.splice(i + 1, 0, `${sangria}<CruzDeHoja onCerrar={${onCerrar}}${extra ? ' ' + extra : ''} />`)
// el import, tras el último import
let ult = -1
lineas.forEach((l, k) => { if (/^import /.test(l)) ult = k })
if (!lineas.some((l) => l.includes('CruzDeHoja }') || l.includes('{ CruzDeHoja'))) lineas.splice(ult + 1, 0, `import { CruzDeHoja } from '${imp}'`)
let out = lineas.join('\n')
fs.writeFileSync(archivo, crlf ? out.replace(/\n/g, '\r\n') : out)
console.log('ok', archivo)
