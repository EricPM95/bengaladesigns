// La prueba del tamaño de la pantalla del pase (Tanda 10N3, §3b.1, agente F1; Tanda 10N10, 8b: la película se quitó y queda SOLO la lista del pase con [Elegir mi pase]).
// Antes recorría las 8 escenas de la película; ahora comprueba la lista, a tres tamaños de móvil (390 x 664 = iPhone con la barra de Safari, 430 x 932 y 360 x 640):
//   · se abre directa (abrirPase) y llega de lado a lado, sin deformarse (el escenario se escala igual en ancho y alto);
//   · [Elegir mi pase] a la vista, entero, sin pegarse al borde de abajo;
//   · la lista se mueve con el dedo (tiene scroll) y su última fila se puede subir por encima de la parte fija de abajo;
//   · «¿Cuántos sois?» (cuando se abre) cabe entera en la pantalla.
// Hace falta el servidor y Vite (APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10N3_apertura.mjs). Acaba con «N comprobaciones · M fallos».
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

const TAMANOS = [
  [390, 664, true],
  [430, 932, false],
  [360, 640, false],
]

const MIDE = `(() => {
  const P = document.querySelector('[data-lista-del-pase]')
  const esc = P && P.querySelector('[data-lista-pase]') // (10N11: la lista ya no es un escenario escalado: llena la pantalla)
  if (!P || !esc) return null
  const vw = window.innerWidth, vh = window.innerHeight
  const m = new DOMMatrixReadOnly(getComputedStyle(esc).transform)
  const r = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } }
  { const l0 = P.querySelector('[data-lista-pase]'); if (l0) l0.scrollTop = l0.scrollHeight } // (10N11: [Elegir mi pase] es la última fila de la lista de Design: se mide con la lista al final)
  const elegir = Array.from(P.querySelectorAll('span')).find((x) => (x.textContent || '').trim() === 'Elegir mi pase')
  const lista = P.querySelector('[data-lista-pase]')
  const pfr = P.querySelector('.pfr')
  return { vw, vh, escalaX: m.a, escalaY: m.d, esc: r(esc), pfr: pfr ? r(pfr) : null, elegir: elegir ? r(elegir) : null, lista: lista ? { ...r(lista), sh: lista.scrollHeight, ch: lista.clientHeight, oy: getComputedStyle(lista).overflowY } : null }
})()`

async function una(ancho, alto, capturar) {
  for (let intento = 0; intento < 2; intento++) {
    try {
      return await unaVez(ancho, alto, capturar)
    } catch (err) {
      if (intento) throw err
    }
  }
}
async function unaVez(ancho, alto, capturar) {
  const antes = `try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; window.__pruebaDelPase = { cobro: true, conPase: false, puede: true, pruebaGastada: false }`
  const a = await abrirApp(BASE, { ancho, alto, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0', antes })
  try {
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
    await a.evaluar('window.__rutaPrueba().then(() => true)')
    await a.esp(3500)
    for (let i = 0; i < 4; i++) {
      const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente|Genial|Ya lo sé)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!hecho) break
      await a.esp(600)
    }
    await a.evaluar("window.dispatchEvent(new CustomEvent('trazo:pagar')); true")
    for (let i = 0; i < 30 && !(await a.evaluar("/Elegir mi pase/.test(document.querySelector('[data-lista-del-pase]')?.innerText ?? '')")); i++) await a.esp(500)
    await a.esp(1500)
    const d = await a.evaluar(MIDE)
    if (d && capturar) await a.captura(path.join(SALIDA, `10n3_apertura_lista_${ancho}x${alto}.jpg`))
    // El final de la lista: se sube del todo y la última fila queda por encima de la parte fija de abajo (donde está [Elegir mi pase]).
    const fin = await a.evaluar(`(() => {
      const l = document.querySelector('[data-lista-del-pase] [data-lista-pase]')
      if (!l) return null
      l.scrollTop = l.scrollHeight
      const ultima = null
      const elegir = Array.from(document.querySelectorAll('[data-lista-del-pase] span')).find((x) => (x.textContent || '').trim() === 'Elegir mi pase')
      return { top: l.scrollTop, ultimaB: elegir ? elegir.getBoundingClientRect().bottom : null, elegirT: window.innerHeight } // (10N11: [Elegir mi pase] es la última fila: con la lista al final queda entero a la vista)
    })()`)
    // ¿Cuántos sois? abierta.
    await a.evaluar("(() => { const e = Array.from(document.querySelectorAll('[data-lista-del-pase] span')).find((x) => x.children.length === 0 && x.textContent.trim() === 'Elegir mi pase'); if (e) e.click(); return true })()")
    await a.esp(1500)
    const hoja = await a.evaluar(`(() => {
      const t = Array.from(document.querySelectorAll('[data-lista-del-pase] span')).find((x) => x.children.length === 0 && x.textContent.trim() === '¿Cuántos sois?')
      const c = Array.from(document.querySelectorAll('[data-lista-del-pase] span')).find((x) => x.children.length === 0 && /^Comprar · /.test(x.textContent.trim()))
      const rr = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom } }
      return { titulo: t ? rr(t) : null, comprar: c ? rr(c) : null }
    })()`)
    if (capturar) await a.captura(path.join(SALIDA, `10n3_apertura_cuantos_${ancho}x${alto}.jpg`))
    return { d, fin, hoja }
  } finally {
    a.cerrar()
  }
}

const AIRE_ABAJO = 8 // px mínimos entre [Elegir mi pase] y el borde de abajo visible

const resultados = []
for (const t of TAMANOS) {
  // (de uno en uno: un solo Chrome de prueba a la vez)
  let r = null
  try {
    r = await una(t[0], t[1], t[2])
  } catch (err) {
    resultados.push([t, null, err.message])
    continue
  }
  resultados.push([t, r, null])
}

for (const [[ancho, alto], r, err] of resultados) {
  const etq = `${ancho}x${alto}`
  if (err || !r) {
    debe(false, 'abre', `${etq}: ${err ?? 'sin datos'}`)
    continue
  }
  const { d, fin, hoja } = r
  debe(Boolean(d), 'abre', `${etq}: la lista del pase se abre`)
  if (!d) continue
  debe(Math.abs(d.escalaX - d.escalaY) < 1e-6, 'sin-deformar', `${etq}: el escenario se escala igual de ancho que de alto (${d.escalaX.toFixed(3)} x ${d.escalaY.toFixed(3)})`)
  debe(d.esc.x <= 0.5 && d.esc.r >= ancho - 0.5, 'ancho', `${etq}: la lista llega de lado a lado`)
  debe(d.elegir && d.elegir.b <= alto - AIRE_ABAJO && d.elegir.y >= 0, 'entero', `${etq}: [Elegir mi pase] a la vista (acaba en ${d.elegir?.b.toFixed(0)} de ${alto})`)
  debe(d.lista && /(auto|scroll)/.test(d.lista.oy) && d.lista.sh > d.lista.ch, 'scroll', `${etq}: la lista se mueve con el dedo (alto del contenido ${d.lista?.sh}, visible ${d.lista?.ch})`)
  debe(fin && fin.top > 0 && fin.elegirT !== null && fin.ultimaB !== null && fin.ultimaB <= fin.elegirT + 2, 'ultima-fila', `${etq}: al subir del todo, la última fila queda por encima de [Elegir mi pase] (acaba en ${fin?.ultimaB?.toFixed(0)}, el botón empieza en ${fin?.elegirT?.toFixed(0)})`)
  debe(hoja && hoja.titulo && hoja.comprar && hoja.titulo.y >= 0 && hoja.comprar.b <= alto - 4 && hoja.comprar.x >= 0 && hoja.comprar.r <= ancho, 'cuantos', `${etq}: «¿Cuántos sois?» abierta cabe entera, con [Comprar] a la vista (acaba en ${hoja?.comprar?.b.toFixed(0)} de ${alto})`)
}

console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
