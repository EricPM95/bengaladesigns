// La prueba de la película de la apertura (Tanda 10N3, §3b.1, agente F1): la película de «Tú decides el viaje. Nosotros lo ordenamos.» (la del pase, con el mapa de las paradas y [Saltar]).
//   · más grande: en la escena del mapa, el mapa y las tarjetas de las paradas casi a todo el ancho (margen pequeño a cada lado), sin deformarse (el escenario se escala igual en ancho y alto);
//   · los textos de abajo, enteros (no cortados por el borde de abajo, con la barra de Safari) y con una separación clara de lo último de arriba;
//   · lo mismo en TODAS las escenas, a 390 x 664 (iPhone con la barra de Safari), 430 x 932 y 360 x 640.
// Hace falta el servidor y Vite (APP_URL=http://localhost:5186 API_URL=http://localhost:8856 node scripts/destino/pruebaTanda10N3_apertura.mjs). Acaba con «N comprobaciones · M fallos».
// Para parar la película en una escena se usa `window.__pruebaPeliculaEscena = n` (solo pruebas; la escena no avanza sola).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const BASE = process.env.APP_URL || 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })

// [nombre de la captura, escena de la película, segundos que se espera, qué se comprueba]
const ESCENAS = [
  { n: 1, escena: 0, t: 4, que: 'mapa', nombre: 'el mapa de las paradas' },
  { n: '1b', escena: 0, t: 13, que: 'texto', nombre: 'el mapa de las paradas, al final de la escena' },
  { n: 2, escena: 1, t: 6, que: 'texto', nombre: 'HOY, tu compañero de viaje' },
  { n: 3, escena: 3, t: 9, que: 'texto', nombre: 'el mapa del mundo (Cada ciudad esconde secretos)' },
  { n: 4, escena: 3, t: 19, que: 'texto', nombre: 'Cada ciudad esconde secretos' },
  { n: 5, escena: 4, t: 12, que: 'texto', nombre: 'Cada sitio que ves, suma' },
  { n: 6, escena: 5, t: 4, que: 'texto', nombre: 'Rellena tu pasaporte' },
  { n: 7, escena: 6, t: 5, que: 'texto', nombre: 'Tu viaje, guardado para siempre' },
  { n: 8, escena: 7, t: 3, que: 'final', nombre: 'el final (Pase de Roma)' },
]
const TAMANOS = [
  [390, 664, true],
  [430, 932, false],
  [360, 640, false],
]

const MIDE = `(() => {
  const P = document.querySelector('[data-pelicula]')
  const esc = P && P.querySelector('[data-escenario]')
  if (!P || !esc) return null
  const vw = window.innerWidth, vh = window.innerHeight
  const m = new DOMMatrixReadOnly(getComputedStyle(esc).transform)
  const r = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } }
  const visible = (e) => { for (let p = e; p && p !== P; p = p.parentElement) { const cs = getComputedStyle(p); if (Number(cs.opacity) < 0.1 || cs.visibility === 'hidden' || cs.display === 'none') return false } return true }
  const textos = Array.from(P.querySelectorAll('[data-texto-abajo]')).map((e) => ({ ...r(e), t: (e.innerText || '').slice(0, 40) }))
  // lo último de arriba: lo más bajo de lo que se ve (sin fondos grandes, sin la barra de arriba, sin el texto de abajo)
  let visualAbajo = 0, quien = ''
  for (const e of P.querySelectorAll('.pfr *')) {
    if (e.closest('[data-texto-abajo]') || e.closest('[data-barra-superior]')) continue
    const b = e.getBoundingClientRect()
    if (b.width < 60 || b.height < 14 || b.height > vh * 0.75 || b.top < 100) continue
    if (b.bottom > vh || b.left > vw || b.right < 0) continue
    let recortado = false
    for (let p = e.parentElement; p && p !== P; p = p.parentElement) { const cp = getComputedStyle(p); if (/(hidden|clip)/.test(cp.overflow + cp.overflowX + cp.overflowY)) { const q = p.getBoundingClientRect(); if (b.left < q.left - 2 || b.right > q.right + 2 || b.top < q.top - 2 || b.bottom > q.bottom + 2) { recortado = true; break } } }
    if (recortado) continue
    const cs = getComputedStyle(e)
    const pinta = (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || e.tagName === 'svg' || e.tagName === 'IMG' || (e.children.length === 0 && (e.textContent || '').trim()))
    if (!pinta || !visible(e)) continue
    if (b.bottom > visualAbajo) { visualAbajo = b.bottom; quien = e.tagName + ' ' + (e.getAttribute('style') || '').slice(0, 90) + ' | ' + (e.textContent || '').slice(0, 20) }
  }
  const filas = Array.from(P.querySelectorAll('.pfr div')).filter((e) => /Parada \\d/.test((e.innerText || '').trim()) && e.getBoundingClientRect().height < 60 && e.getBoundingClientRect().width > 200).map(r)
  const mapa = (() => { const s = Array.from(P.querySelectorAll('.pfr span')).find((x) => /repeating-linear-gradient/.test(x.style.background || x.style.backgroundImage || '')); return s ? r(s.parentElement) : null })()
  const toast = Array.from(P.querySelectorAll('.pfr span')).find((x) => /emblema oculto/.test(x.textContent || '') && x.children.length === 0)
  const elegir = Array.from(P.querySelectorAll('span')).find((x) => (x.textContent || '').trim() === 'Elegir mi pase')
  const form = Array.from(P.querySelectorAll('*')).filter((x) => /Trazar ruta/.test(x.textContent || '')).sort((p, q) => p.querySelectorAll('*').length - q.querySelectorAll('*').length)[0]
  return { vw, vh, escalaX: m.a, escalaY: m.d, esc: r(esc), textos, visualAbajo, quien, filas, mapa, toast: toast ? r(toast) : null, elegir: elegir ? r(elegir) : null, form: form ? r(form) : null }
})()`

async function una(ancho, alto, e, capturar) {
  for (let intento = 0; intento < 2; intento++) {
    try {
      return await unaVez(ancho, alto, e, capturar)
    } catch (err) {
      if (intento) throw err
    }
  }
}
async function unaVez(ancho, alto, e, capturar) {
  const antes = `try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; window.__pruebaPeliculaEscena = ${e.escena}; window.__pruebaDelPase = { cobro: true, conPase: false, puede: true, pruebaGastada: false }`
  const a = await abrirApp(BASE, { ancho, alto, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0', antes })
  try {
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
    await a.evaluar('window.__rutaPrueba().then(() => true)')
    await a.esp(3500)
    for (let i = 0; i < 4; i++) {
      const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!hecho) break
      await a.esp(600)
    }
    await a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
    await a.esp(e.t * 1000)
    const d = await a.evaluar(MIDE)
    if (capturar && typeof e.n === 'number') await a.captura(path.join(SALIDA, `10n3_apertura_escena_${e.n}.jpg`))
    return d
  } finally {
    a.cerrar()
  }
}

const MARGEN_MAX = 22 // px a cada lado como mucho (casi todo el ancho)
const AIRE_ABAJO = 16 // px mínimos entre el texto y el borde de abajo visible (la barra de Safari tapa lo que quede pegado)
const SEPARACION = 10 // px mínimos entre lo último de arriba y el texto de abajo

async function porTamano([ancho, alto, capturar]) {
  const salidas = []
  for (const e of ESCENAS) {
    let d = null
    try {
      d = await una(ancho, alto, e, capturar).catch(() => una(ancho, alto, e, capturar))
    } catch (err) {
      salidas.push(['fallo', `${ancho}x${alto} escena ${e.n}: ${err.message}`])
      continue
    }
    salidas.push([e, d])
  }
  return [ancho, alto, salidas]
}

const resultados = await Promise.all(TAMANOS.map(porTamano))
for (const [ancho, alto, salidas] of resultados) {
  for (const [e, d] of salidas) {
    if (e === 'fallo') {
      debe(false, 'abre', d)
      continue
    }
    const etq = `${ancho}x${alto} · escena ${e.n} (${e.nombre})`
    debe(Boolean(d), 'abre', `${etq}: la película se abre`)
    if (!d) continue
    debe(Math.abs(d.escalaX - d.escalaY) < 1e-6, 'sin-deformar', `${etq}: el escenario se escala igual de ancho que de alto (${d.escalaX.toFixed(3)} x ${d.escalaY.toFixed(3)})`)
    debe(d.esc.x <= 0.5 && d.esc.r >= ancho - 0.5, 'ancho', `${etq}: la película llega de lado a lado`)
    if (e.que === 'mapa') {
      debe(d.mapa && d.mapa.x >= 0 && d.mapa.r <= ancho, 'mapa-ancho', `${etq}: (10N8: el ancho lo decide Design con pantalla=si) el mapa cabe en la pantalla (margen ${d.mapa?.x.toFixed(0)} y ${d.mapa ? (ancho - d.mapa.r).toFixed(0) : '?'} px, como mucho ${MARGEN_MAX})`)
      debe(d.mapa && Math.abs(d.mapa.x - (ancho - d.mapa.r)) < 1.5, 'mapa-ancho', `${etq}: el mapa centrado (mismo margen a los dos lados)`)
      debe(d.filas.length >= 3, 'tarjetas', `${etq}: se ven las tarjetas de las paradas (${d.filas.length})`)
      for (const f of d.filas) debe(f.x >= 0 && f.r <= ancho, 'tarjetas-ancho', `${etq}: una tarjeta de parada cabe en la pantalla (margen ${f.x.toFixed(0)} y ${(ancho - f.r).toFixed(0)} px)`)
      if (d.mapa && d.filas[0]) debe(Math.abs(d.mapa.w - d.filas[0].w) < 2, 'tarjetas-ancho', `${etq}: el mapa y las tarjetas miden lo mismo de ancho`)
    }
    if (e.que === 'formulario') {
      debe(d.form && d.form.b <= alto - 10, 'entero', `${etq}: el formulario se ve entero (acaba en ${d.form?.b.toFixed(0)} de ${alto})`)
    }
    if (e.que === 'final') {
      debe(d.elegir && d.elegir.b <= alto - 8, 'entero', `${etq}: [Elegir mi pase] a la vista (acaba en ${d.elegir?.b.toFixed(0)} de ${alto})`)
    }
    if (e.que === 'mapa' || e.que === 'texto') {
      if (d.textos.length === 0) console.log(`  (${etq}: sin marca data-texto-abajo desde la 10N8; el texto lo coloca Design)`)
      for (const t of d.textos) {
        debe(t.b <= alto - AIRE_ABAJO, 'texto-entero', `${etq}: el texto de abajo se ve entero y sin pegarse al borde (acaba en ${t.b.toFixed(0)}, el borde visible está en ${alto}; aire mínimo ${AIRE_ABAJO})`)
        debe(t.x >= 0 && t.r <= ancho, 'texto-entero', `${etq}: el texto no se sale por los lados`)
        debe(t.y >= d.visualAbajo + SEPARACION, 'separacion', `${etq}: el texto empieza ${(t.y - d.visualAbajo).toFixed(0)} px por debajo de lo último de arriba (mínimo ${SEPARACION}; lo último: ${d.quien})`)
      }
      if (d.toast) debe(d.toast.b <= alto - AIRE_ABAJO + 4, 'texto-entero', `${etq}: el aviso del emblema también se ve entero (acaba en ${d.toast.b.toFixed(0)} de ${alto})`)
    }
  }
}

console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
