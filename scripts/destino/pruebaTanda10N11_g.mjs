// Tanda 10N11, agente G · el candado del pase siempre igual (dorado sobre un círculo azul oscuro) y «con el pase, sin frases del pase».
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N11_g.mjs
// Acaba imprimiendo «N comprobaciones, M fallos» y sale con código 1 si falla alguna. Capturas en docs/dias/capturas_jutrip/10n11_candado_*.jpg (y la de Design al lado).
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, esp, leer, modulo } from './_10n5_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10n11_candado_${n}.jpg`)
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

/* ───────────────────────── 1. El código ───────────────────────── */
console.log('1. El código')
const cand = sinComentarios(leer('src/components/pase/Candado.tsx'))
debe(/export function CandadoRedondo/.test(cand) && /export function LineaDelPase/.test(cand), 'candado', 'existen CandadoRedondo y LineaDelPase')
debe(/#1C2230/.test(cand) && /1\.5px solid #B58A2E/.test(cand) && /stroke="#F3D88F"/.test(cand), 'candado', 'CandadoRedondo: círculo #1C2230, filo 1,5 px #B58A2E y candado #F3D88F (Design)')
const lineaDelPase = cand.slice(cand.indexOf('export function LineaDelPase'))
debe(/usePasePintable\(\)/.test(lineaDelPase) && /estado !== 'sin'\) return null/.test(lineaDelPase) && /abrirPase/.test(lineaDelPase), 'frases', 'LineaDelPase solo se pinta sin pase (no mientras se desconoce) y abre el pase')
// Quién usa el candado suelto (marrón / sobre marfil): solo la caja y los botones que ya son azules o dorados.
const usos = []
const recorre = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = `${d}/${e.name}`
    if (e.isDirectory()) recorre(p)
    else if (/\.tsx?$/.test(e.name) && !/pase\/Candado\.tsx$/.test(p) && /CandadoDeDesign/.test(sinComentarios(leer(p)))) usos.push(p.replace(/\\/g, '/'))
  }
}
recorre('src')
debe(usos.every((p) => /TarjetaTuUltimoDia/.test(p)), 'candado', `el candado suelto (CandadoDeDesign) solo queda en el botón azul del último día (${usos.join(', ') || 'ninguno'})`)
for (const f of ['route/ExplorePanel.tsx', 'ui/Elegir.tsx', 'route/hoy/Escuchar.tsx', 'route/hoy/v2/HoyDuranteV2.tsx'])
  debe(/CandadoRedondo/.test(sinComentarios(leer('src/components/' + f))), 'candado', `${f} usa CandadoRedondo`)
debe(!/background: '#FBF3E2', border: '1px solid rgba\(166,124,82,\.35\)'/.test(sinComentarios(leer('src/components/route/hoy/Escuchar.tsx') + leer('src/components/route/hoy/v2/HoyDuranteV2.tsx'))), 'candado', 'Escuchar historia: ya no hay candado marrón sobre marfil')

/* ───────────────────────── 2. En la app, sin pase ───────────────────────── */
const store = modulo('/src/store/useRouteStore.ts')
const modo = async (a, m, dia = null) => {
  await a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); e.setActiveDayId(${dia === null ? 'null' : 'e.route.days[' + dia + '].id'}); e.setMode('${m}'); return true })`)
  await a.esp(2500)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(500)
  }
}
const MIDE = `(() => Array.from(document.querySelectorAll('[data-candado-redondo]')).map((c) => {
  const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); const s = c.querySelector('svg')
  return { tam: c.getAttribute('data-candado-redondo'), dato: c.getAttribute('data-candado-dato'), fondo: cs.backgroundColor, borde: cs.borderTopColor, radio: cs.borderTopLeftRadius, w: Math.round(r.width), h: Math.round(r.height), trazo: s ? getComputedStyle(s).stroke : null, visible: r.width > 0 }
}))()`
const esDeDesign = (c) => c.fondo === 'rgb(28, 34, 48)' && c.borde === 'rgb(181, 138, 46)' && c.trazo === 'rgb(243, 216, 143)' && c.w === c.h && c.visible

console.log('2. Sin pase')
const g = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
try {
  await modo(g, 'explore')
  await g.esp(2000)
  let c = await g.evaluar(MIDE)
  debe(c.length >= 2 && c.every(esDeDesign), 'candado', `EXPLORAR sin pase: Baños y Fuentes con el candado dorado sobre azul (${JSON.stringify(c).slice(0, 240)})`)
  await g.captura(foto('explorar'))
  const abierto = await g.evaluar("(() => { const t = Array.from(document.querySelectorAll('button')).find((b) => /Restaurantes/.test(b.innerText)); if (!t) return false; t.click(); return true })()")
  if (abierto) {
    await g.esp(2500)
    c = await g.evaluar(MIDE)
    const cerca = await g.evaluar("(() => { const p = document.querySelector('[data-pestana=\"nearby\"]'); return p ? p.querySelectorAll('[data-candado-redondo]').length : -1 })()")
    debe(cerca === 1 && c.every(esDeDesign), 'candado', `«Cerca de ti» sin pase: candado dorado sobre azul en la esquina (${cerca})`)
    await g.captura(foto('cerca_de_ti'))
  } else debe(false, 'candado', 'no encuentro la tarjeta de Restaurantes')
  await g.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Cerrar$/.test((x.getAttribute('aria-label') || x.textContent || '').trim())); if (b) b.click(); return true })()`)
  // Líneas del pase: en RESERVAS (las que pongan A, B y C) todas con CandadoRedondo.
  await modo(g, 'bookings')
  await g.evaluar("(() => { const b = document.querySelector('[data-blk=\"aloj\"] div'); if (b) b.click(); return true })()")
  await g.esp(1500)
  const lineas = await g.evaluar(`Array.from(document.querySelectorAll('[data-linea-pase]')).map((l) => ({ d: l.getAttribute('data-linea-pase'), candado: Boolean(l.querySelector('[data-candado-redondo]')), texto: l.innerText.replace(/\\s+/g, ' ').trim() }))`)
  debe(lineas.every((l) => l.candado && /^Con el Pase /.test(l.texto)), 'candado', `las líneas del pase en RESERVAS llevan su candado redondo (${JSON.stringify(lineas).slice(0, 240)})`)
  await g.captura(foto('reservas'))
  await modo(g, 'days', 0)
  const lineasD = await g.evaluar(`Array.from(document.querySelectorAll('[data-linea-pase]')).every((l) => Boolean(l.querySelector('[data-candado-redondo]')))`)
  debe(lineasD, 'candado', 'DÍAS: las líneas del pase llevan su candado redondo')
  await g.captura(foto('dias'))
} finally {
  g.cerrar()
}

/* ───────────────────────── 3. En la app, con pase: sin frases ───────────────────────── */
console.log('3. Con pase: sin frases del pase')
const k = await conViaje({ version: 'completa', ancho: 390, alto: 844 })
try {
  for (const [nombre, m, dia] of [['RUTA', 'route', null], ['DÍAS día 1', 'days', 0], ['DÍAS día 2', 'days', 1], ['RESERVAS', 'bookings', null], ['EXPLORAR', 'explore', null]]) {
    await modo(k, m, dia)
    if (m === 'bookings') {
      await k.evaluar("(() => { for (const s of ['aloj', 'llegada']) { const b = document.querySelector('[data-blk=\"' + s + '\"] div'); if (b) b.click() } return true })()")
      await k.esp(1500)
    }
    const r = await k.evaluar(`({ lineas: document.querySelectorAll('[data-linea-pase],[data-caja-pase],[data-candado-redondo],[data-bloqueado-pase]').length, frase: /Con el Pase [A-ZÁÉÍÓÚ][a-záéíóú]+,/.test(document.body.innerText) })`)
    debe(r.lineas === 0 && !r.frase, 'frases', `con pase, ${nombre}: ni líneas, ni candados, ni frases del pase (${JSON.stringify(r)})`)
  }
  await k.captura(foto('con_pase_explorar'))
} finally {
  k.cerrar()
}

/* ───────────────────────── 4. Design al lado ───────────────────────── */
if (!process.env.SIN_DESIGN) {
  console.log('4. Design')
  try {
    await capturarDesign('Piezas/Vuelo Reservas.dc.html', foto('design_vuelo_reservas'), { ancho: 390, alto: 844 })
    await capturarDesign('Piezas/Pase Estilo.dc.html', foto('design_pase_estilo'), { ancho: 390, alto: 844 })
  } catch (e) {
    console.log('  (sin captura de Design: ' + e.message + ')')
  }
}

console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
