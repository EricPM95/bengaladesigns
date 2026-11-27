// V75 §5b (agente B) · «Subir todas a la vez»: un PDF de más de 4,5 MB y de varias páginas se lee ENTERO (cada página por separado), en UNA sola lectura del cupo.
//   node scripts/destino/pruebaV75_lectura.mjs        (Claude y Supabase de MENTIRA: no gasta ni una llamada real; el navegador es el de la app de desarrollo en APP_URL, por defecto http://localhost:5173)
// Parte 1: el servidor (`/api/read-ticket`, `files`): N imágenes → una llamada a Claude con N bloques de imagen y UNA lectura apuntada.
// Parte 2: el móvil (`leerEntradasVarias`): un PDF real de 6 páginas y ~8 MB (hecho aquí con jspdf y sharp) sale como `files` con 6 jpeg reducidos, en UNA petición.
import { randomBytes } from 'node:crypto'
import express from 'express'
import sharp from 'sharp'
import { jsPDF } from 'jspdf'
import { registrarLeerBillete, MAX_LECTURAS_AL_DIA } from '../../server/billete/lectura.js'
import { abrirApp } from './_enLaApp.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 150))
  if (!cond) fallos.push({ regla, texto })
}

/* ═══ 1. El servidor ═══ */
console.log('1. El servidor')
const llamadasClaude = []
const anthropic = { messages: { create: async (p) => (llamadasClaude.push(p), { content: [{ type: 'text', text: '{"entradas":[{"nombre":"Ana Pérez","localizador":"AB12","codigo_caja":{"pagina":5,"x0":0.1,"y0":0.1,"x1":0.4,"y1":0.4}}]}' }], usage: { input_tokens: 10, output_tokens: 10 } }) } }
const lecturas = new Map()
const app = express()
registrarLeerBillete(app, {
  anthropic, MODEL: 'x', express, ahora: () => new Date('2026-11-27T10:00:00Z'), lecturas,
  admin: { rpc: async (n, a) => (n === 'pases_de' ? { data: [{ id: 'p', estado: 'activo', es_mio: true, viaje: null }], error: null } : { data: null, error: { message: 'x' } }) },
  quienEs: async () => ({ id: 'u1', is_anonymous: false }), tokenDe: () => 'tok',
  logCallCost: () => {}, extractJsonText: (t) => t, logAnthropicError: () => {},
})
const servidor = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)) })
const base = `http://127.0.0.1:${servidor.address().port}`
const jpeg = (kb) => ({ media_type: 'image/jpeg', data: Buffer.alloc(kb * 1024, 9).toString('base64') })
const post = async (cuerpo) => {
  const r = await fetch(`${base}/api/read-ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' }, body: JSON.stringify(cuerpo) })
  return { estado: r.status, cuerpo: await r.json().catch(() => null) }
}
let r = await post({ files: [jpeg(300), jpeg(300), jpeg(300), jpeg(300), jpeg(300), jpeg(300)], tipo: 'entradas_varias', year_hint: 2026 })
const c = llamadasClaude[0]?.messages?.[0]?.content ?? []
debe(r.estado === 200 && llamadasClaude.length === 1, '1a', `6 páginas → una sola llamada a Claude (${r.estado}, llamadas ${llamadasClaude.length})`)
debe(c.filter((b) => b.type === 'image').length === 6 && c.filter((b) => b.type === 'text' && /^Página \d de 6:/.test(b.text)).length === 6, '1b', 'con sus 6 imágenes, cada una con su «Página N de 6:»')
debe(r.cuerpo?.entradas?.[0]?.codigo_caja?.pagina === 5, '1c', 'una entrada de la página 5 (que antes no se leía) vuelve con su página')
debe((lecturas.get('u1|2026-11-27') ?? 0) === 1, '1d', `cuenta como UNA lectura del cupo (${lecturas.get('u1|2026-11-27')} de ${MAX_LECTURAS_AL_DIA})`)
r = await post({ files: [jpeg(100)], tipo: 'entrada' })
debe(r.estado === 400, '1e', `\`files\` solo vale para varias entradas (otro tipo → ${r.estado})`)
r = await post({ files: [{ media_type: 'application/pdf', data: 'AAAA' }], tipo: 'entradas_varias' })
debe(r.estado === 400, '1e', `y solo con imágenes (un PDF dentro de \`files\` → ${r.estado})`)
r = await post({ files: Array.from({ length: 4 }, () => jpeg(3000)), tipo: 'entradas_varias' })
debe(r.estado === 413, '1f', `si todas juntas pasan de 10 MB → 413 (${r.estado})`)
r = await post({ file: { media_type: 'application/pdf', data: Buffer.from('%PDF-1.4').toString('base64') }, tipo: 'entradas_varias' })
debe(r.estado === 200 && llamadasClaude.at(-1).messages[0].content[0].type === 'document', '1g', 'un solo `file` sigue yendo como siempre (documento)')
servidor.close()

/* ═══ 2. El móvil: un PDF real de 6 páginas y más de 4,5 MB ═══ */
console.log('2. El móvil (leerEntradasVarias con un PDF de 6 páginas)')
const doc = new jsPDF({ unit: 'px', format: [800, 1100] })
for (let p = 0; p < 6; p++) {
  if (p > 0) doc.addPage([800, 1100])
  const ruido = await sharp(randomBytes(1400 * 1400 * 3), { raw: { width: 1400, height: 1400, channels: 3 } }).jpeg({ quality: 92 }).toBuffer()
  doc.addImage(ruido.toString('base64'), 'JPEG', 0, 0, 800, 800)
  doc.text(`Entrada ${p + 1}`, 40, 1000)
}
const pdf = Buffer.from(doc.output('arraybuffer'))
debe(pdf.length > 4_500_000, '2a', `el PDF de prueba pesa ${(pdf.length / 1e6).toFixed(1)} MB (más de 4,5 MB) y tiene 6 páginas`)
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0' })
try {
  const resultado = await a.evaluar(`(async () => {
    const peticiones = []
    const original = window.fetch
    window.fetch = async (url, init) => {
      if (String(url).includes('/api/read-ticket')) {
        const cuerpo = JSON.parse(init.body)
        peticiones.push({ tipo: cuerpo.tipo, tieneFile: Boolean(cuerpo.file), nFiles: (cuerpo.files ?? []).length, tipos: [...new Set((cuerpo.files ?? []).map((f) => f.media_type))], bytes: (cuerpo.files ?? []).reduce((t, f) => t + f.data.length, 0) })
        return new Response(JSON.stringify({ entradas: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return original(url, init)
    }
    const bin = Uint8Array.from(atob(${JSON.stringify(pdf.toString('base64'))}), (c) => c.charCodeAt(0))
    const archivo = new File([bin], 'entradas-vaticano.pdf', { type: 'application/pdf' })
    const m = await import('/src/lib/billeteLeer.ts')
    const salida = await m.leerEntradasVarias(archivo, { esperaServidorMs: 120000 })
    window.fetch = original
    return JSON.stringify({ peticiones, aviso: salida.aviso, tamano: archivo.size })
  })()`)
  const x = JSON.parse(resultado)
  console.log('  petición:', JSON.stringify(x.peticiones))
  debe(x.peticiones.length === 1, '2b', `UNA sola petición al servidor (${x.peticiones.length})`)
  debe(x.peticiones[0]?.tieneFile === false && x.peticiones[0]?.nFiles === 6, '2c', `con las 6 páginas, cada una por separado (${x.peticiones[0]?.nFiles})`)
  debe(x.peticiones[0]?.tipos?.length === 1 && x.peticiones[0].tipos[0] === 'image/jpeg', '2d', 'todas como jpeg reducido')
  debe((x.peticiones[0]?.bytes ?? 1e9) <= 9_000_000, '2e', `y caben en el límite del servidor (${((x.peticiones[0]?.bytes ?? 0) / 1e6).toFixed(1)} MB en base64)`)
} finally {
  a.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
