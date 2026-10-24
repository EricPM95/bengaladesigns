// Graba la película del pase ENTERA (sin pase, de principio a fin, a tamaño de móvil 390 x 844) en docs/dias/capturas_jutrip/pelicula_del_pase.webm y mide cuánto dura.
// Sin programas de vídeo: se hacen capturas WebP a todo lo que da el navegador y se meten, tal cual, en un contenedor WebM (VP8, todos los fotogramas son clave). Se reproduce en el móvil y en el escritorio.
// Además guarda una captura de cada escena (pelicula_escena_N.jpg). Hace falta `npm run server` y `npm run dev`.
//   node scripts/destino/grabarPelicula.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const ANCHO = 390
const ALTO = 844

/* ───────── un WebM mínimo ───────── */
const vint = (n) => {
  let largo = 1
  while (n >= 2 ** (7 * largo) - 1) largo++
  const b = Buffer.alloc(largo)
  let v = BigInt(n)
  for (let i = largo - 1; i >= 0; i--) {
    b[i] = Number(v & 0xffn)
    v >>= 8n
  }
  b[0] |= 0x80 >> (largo - 1)
  return b
}
const id = (hex) => Buffer.from(hex, 'hex')
const elem = (idHex, ...partes) => {
  const cuerpo = Buffer.concat(partes)
  return Buffer.concat([id(idHex), vint(cuerpo.length), cuerpo])
}
const uint = (n, bytes = 4) => {
  const b = Buffer.alloc(bytes)
  b.writeUIntBE(n, 0, bytes)
  return b
}
const flotante = (x) => {
  const b = Buffer.alloc(8)
  b.writeDoubleBE(x)
  return b
}
/** El fotograma VP8 de dentro de un WebP con pérdida. */
function vp8DeWebp(webp) {
  let p = 12
  while (p + 8 <= webp.length) {
    const tipo = webp.toString('ascii', p, p + 4)
    const largo = webp.readUInt32LE(p + 4)
    if (tipo === 'VP8 ') return webp.subarray(p + 8, p + 8 + largo)
    p += 8 + largo + (largo & 1)
  }
  throw new Error('El WebP no lleva un fotograma VP8')
}
function webm(frames) {
  // frames: [{ t (ms desde el principio), datos }]
  const duracion = frames.length ? frames[frames.length - 1].t + 200 : 0
  const cabecera = elem('1A45DFA3', elem('4286', uint(1, 1)), elem('42F7', uint(1, 1)), elem('42F2', uint(4, 1)), elem('42F3', uint(8, 1)), elem('4282', Buffer.from('webm')), elem('4287', uint(2, 1)), elem('4285', uint(2, 1)))
  const info = elem('1549A966', elem('2AD7B1', uint(1_000_000, 4)), elem('4D80', Buffer.from('trazo')), elem('5741', Buffer.from('trazo')), elem('4489', flotante(duracion)))
  const pista = elem('1654AE6B', elem('AE', elem('D7', uint(1, 1)), elem('73C5', uint(1, 1)), elem('83', uint(1, 1)), elem('86', Buffer.from('V_VP8')), elem('E0', elem('B0', uint(ANCHO, 2)), elem('BA', uint(ALTO, 2)))))
  const clusters = []
  let i = 0
  while (i < frames.length) {
    const t0 = frames[i].t
    const bloques = []
    while (i < frames.length && frames[i].t - t0 < 10_000) {
      const rel = Buffer.alloc(2)
      rel.writeInt16BE(frames[i].t - t0)
      bloques.push(elem('A3', Buffer.from([0x81]), rel, Buffer.from([0x80]), frames[i].datos))
      i++
    }
    clusters.push(elem('1F43B675', elem('E7', uint(t0, 4)), ...bloques))
  }
  return Buffer.concat([cabecera, elem('18538067', info, pista, ...clusters)])
}

/* ───────── la película ───────── */
const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0' })
for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
await a.evaluar('window.__rutaPrueba().then(() => true)')
for (let i = 0; i < 60 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
await a.esp(3500)
for (let i = 0; i < 4; i++) {
  const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
  if (!hecho) break
  await a.esp(600)
}
await a.evaluar("try { localStorage.removeItem('trazo:pelicula-pase-vista') } catch (e) {}; window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
const antes = a.peticiones.length
const t0 = Date.now()
const frames = []
let escenas = 0
const hechasEscena = new Set()
const MARCAS = [6, 25, 70, 100, 135, 170] // segundos desde el principio de la película, una captura por escena
let llegoAlFinal = false
let tFinal = null
while (Date.now() - t0 < 230_000) {
  const t = Date.now() - t0
  const r = await a.cdp('Page.captureScreenshot', { format: 'webp', quality: 55 })
  const datos = Buffer.from(r.result.data, 'base64')
  frames.push({ t, datos: vp8DeWebp(datos) })
  for (const [k, s] of MARCAS.entries()) {
    if (!hechasEscena.has(k) && t >= s * 1000) {
      hechasEscena.add(k)
      await a.captura(path.join(SALIDA, `pelicula_escena_${k + 1}.jpg`))
      escenas++
    }
  }
  if (!llegoAlFinal && t > 5000 && (await a.evaluar("/Elegir mi pase/.test(document.querySelector('[data-pelicula]')?.innerText ?? '')"))) {
    llegoAlFinal = true
    tFinal = t
    // Se queda 4 s en el final y se acaba.
    const hasta = Date.now() + 4000
    while (Date.now() < hasta) {
      const rr = await a.cdp('Page.captureScreenshot', { format: 'webp', quality: 55 })
      frames.push({ t: Date.now() - t0, datos: vp8DeWebp(Buffer.from(rr.result.data, 'base64')) })
    }
    break
  }
}
const vista = await a.evaluar("localStorage.getItem('trazo:pelicula-pase-vista')")
const deFuera = a.peticiones.slice(antes).filter((u) => !/^(http:\/\/localhost:(5173|8787)|http:\/\/127\.0\.0\.1:(5173|8787)|data:|blob:)/.test(u) && !/supabase\.co\/auth\//.test(u))
const rotas = await a.evaluar("performance.getEntriesByType('resource').filter((e) => e.responseStatus >= 400).map((e) => e.name)")
if (deFuera.length) throw new Error('La película ha pedido cosas de fuera: ' + deFuera.slice(0, 3).join(' '))
if (rotas.length) throw new Error('Algo se ha pedido y no está: ' + rotas.slice(0, 3).join(' '))
a.cerrar()
if (!llegoAlFinal) throw new Error('La película no ha llegado al final')
const salida = path.join(SALIDA, 'pelicula_del_pase.webm')
fs.writeFileSync(salida, webm(frames))
const mb = (fs.statSync(salida).size / 1048576).toFixed(1)
console.log(`Película grabada: ${frames.length} fotogramas, ${(frames.length / (frames[frames.length - 1].t / 1000)).toFixed(1)} por segundo, ${mb} MB`)
console.log(`Llega al final a los ${(tFinal / 1000).toFixed(1)} s (contando desde que se abre); marcada como vista: ${vista === '1'}`)
fs.writeFileSync(path.join(SALIDA, 'pelicula_del_pase.json'), JSON.stringify({ duracion_s: Math.round(tFinal / 100) / 10, fotogramas: frames.length, mb: Number(mb) }))
