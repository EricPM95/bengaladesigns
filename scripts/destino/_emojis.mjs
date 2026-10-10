// Lista los emojis que quedan en src (salvo ✓ ✕ ✔ ✗ y flechas, que son signos de texto).
import fs from 'node:fs'
import path from 'node:path'

const RE = /\p{Extended_Pictographic}️?/gu
const SIGNOS = new Set(['✓', '✔', '✕', '✗', '✖', '★', '☆', '♥', '❤', '→', '←', '↑', '↓', '·', '●', '○', '▲', '▼', '✦', '✳', '※', '☰'])
const cuenta = new Map()
const porArchivo = new Map()
function recorre(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) recorre(p)
    else if (/\.(tsx?|css)$/.test(e.name)) {
      const lineas = fs.readFileSync(p, 'utf8').split(/\r?\n/)
      lineas.forEach((l, i) => {
        for (const m of l.matchAll(RE)) {
          const ch = m[0].replace('️', '')
          if (SIGNOS.has(ch)) continue
          const k = p.replace(/\\/g, '/')
          if (!porArchivo.has(k)) porArchivo.set(k, [])
          porArchivo.get(k).push(`${i + 1}:${ch}`)
          cuenta.set(ch, (cuenta.get(ch) ?? 0) + 1)
        }
      })
    }
  }
}
recorre('src')
if (process.argv.includes('--resumen')) {
  console.log([...porArchivo].map(([k, v]) => `${v.length}\t${k}\t${[...new Set(v.map((x) => x.split(':')[1]))].join('')}`).sort((a, b) => Number(b.split('\t')[0]) - Number(a.split('\t')[0])).join('\n'))
  console.log('TOTAL', [...cuenta.values()].reduce((a, b) => a + b, 0), 'en', porArchivo.size, 'archivos')
} else {
  for (const [k, v] of porArchivo) console.log(k, v.join(' '))
}
