// (V30) Lee el ÍNDICE de las partes del GDC Game Audio Bundle de Sonniss SIN bajarlas (el directorio central del zip, por rangos) y baja SOLO los archivos que se piden (cada uno, por rango).
// Licencia (sonniss.com/gdc-bundle-license, v2.0): uso comercial en proyectos propios, sin citar al autor; prohibido repartir los sonidos como sonidos sueltos y entrenar IA.
//   node scripts/destino/sonidos/sonniss.mjs indice            → guarda el índice en la carpeta temporal
//   node scripts/destino/sonidos/sonniss.mjs buscar palabra…   → lista los archivos cuyo nombre lleva todas las palabras
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'

const UA = { 'user-agent': 'JutripSonidos/1.0 (busco sonidos con licencia comercial para una app)' }
export const PARTES = [1, 2, 3, 4, 5].map((n) => `https://downloads.sonniss.com/Sonniss.com-GDC2026-GameAudioBundle${n}of5.zip`)
const INDICE = path.join(os.tmpdir(), 'sonniss_indice.json')

import { execFileSync } from 'node:child_process'
// (curl: el fetch de Node recibe un 400 de este servidor con los rangos grandes; curl no)
const rango = async (url, a, b) => execFileSync('curl', ['-s', '-L', '-A', UA['user-agent'], '-r', `${a}-${b}`, url], { maxBuffer: 1024 * 1024 * 1024 })
const tamano = async (url) => {
  const cab = execFileSync('curl', ['-s', '-I', '-L', '-A', UA['user-agent'], url], { encoding: 'utf8' })
  return Number((cab.split(String.fromCharCode(10)).find((l) => l.toLowerCase().startsWith('content-length')) ?? '').split(':')[1])
}

export async function indiceDeUnaParte(url) {
  const total = await tamano(url)
  const cola = await rango(url, total - 70000, total - 1)
  let i = cola.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  let cdTam = cola.readUInt32LE(i + 12)
  let cdPos = cola.readUInt32LE(i + 16)
  let n = cola.readUInt16LE(i + 10)
  if (cdPos === 0xffffffff || n === 0xffff) {
    const j = cola.lastIndexOf(Buffer.from([0x50, 0x4b, 0x06, 0x07]))
    const off64 = Number(cola.readBigUInt64LE(j + 8))
    const e = await rango(url, off64, off64 + 55)
    n = Number(e.readBigUInt64LE(32))
    cdTam = Number(e.readBigUInt64LE(40))
    cdPos = Number(e.readBigUInt64LE(48))
  }
  const cd = await rango(url, cdPos, cdPos + cdTam - 1)
  const out = []
  let p = 0
  while (p < cd.length && cd.readUInt32LE(p) === 0x02014b50) {
    const metodo = cd.readUInt16LE(p + 10)
    let comp = cd.readUInt32LE(p + 20)
    let desc = cd.readUInt32LE(p + 24)
    const nl = cd.readUInt16LE(p + 28)
    const el = cd.readUInt16LE(p + 30)
    const cl = cd.readUInt16LE(p + 32)
    let off = cd.readUInt32LE(p + 42)
    const nombre = cd.toString('utf8', p + 46, p + 46 + nl)
    if (comp === 0xffffffff || desc === 0xffffffff || off === 0xffffffff) {
      let q = p + 46 + nl
      const fin = q + el
      while (q < fin) {
        const id = cd.readUInt16LE(q)
        const l = cd.readUInt16LE(q + 2)
        if (id === 1) {
          let k = q + 4
          if (desc === 0xffffffff) { desc = Number(cd.readBigUInt64LE(k)); k += 8 }
          if (comp === 0xffffffff) { comp = Number(cd.readBigUInt64LE(k)); k += 8 }
          if (off === 0xffffffff) { off = Number(cd.readBigUInt64LE(k)); k += 8 }
        }
        q += 4 + l
      }
    }
    out.push({ nombre, metodo, comp, desc, off })
    p += 46 + nl + el + cl
  }
  return out
}

export async function indiceCompleto() {
  if (fs.existsSync(INDICE)) return JSON.parse(fs.readFileSync(INDICE, 'utf8'))
  const todo = []
  for (let k = 0; k < PARTES.length; k++) {
    const e = await indiceDeUnaParte(PARTES[k])
    for (const x of e) todo.push({ parte: k, ...x })
    console.log(`parte ${k + 1}: ${e.length} archivos`)
  }
  fs.writeFileSync(INDICE, JSON.stringify(todo))
  return todo
}

/** Baja UN archivo del zip (solo sus bytes) y lo descomprime. */
export async function bajarArchivo(e, destino) {
  const url = PARTES[e.parte]
  const cab = await rango(url, e.off, e.off + 29 + 400)
  const nl = cab.readUInt16LE(26)
  const el = cab.readUInt16LE(28)
  const ini = e.off + 30 + nl + el
  const datos = await rango(url, ini, ini + e.comp - 1)
  const buf = e.metodo === 0 ? datos : zlib.inflateRawSync(datos)
  fs.mkdirSync(path.dirname(destino), { recursive: true })
  fs.writeFileSync(destino, buf)
  return buf.length
}

if (process.argv[1]?.endsWith('sonniss.mjs')) {
  const [cmd, ...pal] = process.argv.slice(2)
  const ind = await indiceCompleto()
  if (cmd === 'buscar') {
    const ps = pal.map((x) => x.toLowerCase())
    for (const e of ind.filter((x) => /\.(wav|flac|ogg|mp3)$/i.test(x.nombre) && ps.every((p) => x.nombre.toLowerCase().includes(p)))) console.log(`${e.parte + 1}\t${(e.desc / 1024).toFixed(0)}KB\t${e.nombre}`)
  } else console.log(`índice: ${ind.length} archivos`)
}
