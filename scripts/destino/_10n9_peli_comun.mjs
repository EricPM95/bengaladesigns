// Ayudante de la Tanda 10N9 (película del pase igual que Design): abre la página `Pase Pelicula Movil.dc.html` de Design y la app, pone cada escena en su estado final y mide las cajas de todo lo que se ve.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { conViaje, abrirPase, esp, cuando, clicEn } from './_10n5_comun.mjs'

/** Cuánto se deja correr cada escena (en segundos reales) antes de medirla: lo que dura su línea de tiempo, con holgura. Igual en Design y en la app. */
export const SEGUNDOS = [3, 3, 26, 32, 28, 16, 4]
export const ESCENAS = [0, 1, 3, 4, 5, 6, 7]
export const TAMANOS = [[390, 844], [390, 664], [375, 667]]
export const NOMBRES = ['e0', 'e1', 'e3', 'e4', 'e5', 'e6', 'e7']

/** Pone todas las animaciones de la escena en su instante final; las que no acaban nunca (brillos, latidos) se paran en el instante 1,5 s, el mismo en Design y en la app, para que se midan en la misma fase. */
export const FF = (sel) => `(() => { const r = ${sel}; r.getAnimations({subtree:true}).forEach(an => { try { const e = an.effect.getComputedTiming().endTime; if (isFinite(e)) an.currentTime = e; else { an.pause(); an.currentTime = 1500 } } catch(x){} }); return true })()`

/**
 * Mide el recuadro de la película (`raiz`: el elemento .pfr) y todo lo que se ve dentro, con coordenadas relativas a su esquina. Se mide igual en Design y en la app.
 * Devuelve { raiz:[w,h], palco:[x,y,w,h] (el 390x844 escalado), items:[{k,x,y,w,h,t}] } con k = clave estable (texto + nº de aparición, o raya/svg/img + nº).
 */
export const MIDE = (raizJs) => `(() => {
  const raiz = ${raizJs}; const R = raiz.getBoundingClientRect()
  const visible = (e) => { let o = 1; for (let p = e; p && p !== raiz.parentElement; p = p.parentElement) { const cs = getComputedStyle(p); o *= Number(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') return 0 } return o }
  const palcoEl = [...raiz.querySelectorAll('div')].find((x) => /scale\\(/.test(x.style.transform || ''))
  const P = palcoEl ? palcoEl.getBoundingClientRect() : null
  const items = []; const cuenta = {}
  const n = (k) => (cuenta[k] = (cuenta[k] || 0) + 1)
  for (const e of raiz.querySelectorAll('*')) {
    if (['STYLE', 'SCRIPT', 'PATH', 'CIRCLE', 'RECT', 'LINE', 'G', 'DEFS', 'LINEARGRADIENT', 'STOP', 'ELLIPSE', 'POLYLINE', 'POLYGON', 'TEXT', 'TSPAN', 'CLIPPATH', 'FILTER', 'MASK', 'RADIALGRADIENT'].includes(e.tagName.toUpperCase())) continue
    if (visible(e) < 0.5) continue
    if (e.closest('[data-pelicula-musica],[data-pelicula-cerrar],[data-linea-legal]')) continue
    const b = e.getBoundingClientRect(); if (b.width < 1 || b.height < 1) continue
    const propio = Array.from(e.childNodes).filter((x) => x.nodeType === 3).map((x) => x.textContent).join('').trim().replace(/\\s+/g, ' ')
    let k = null
    if (propio) k = 'T:' + propio.slice(0, 40)
    else if (e.tagName.toLowerCase() === 'svg' && !(e.parentElement && e.parentElement.closest('svg'))) k = 'svg'
    else if (e.tagName === 'IMG') k = 'img'
    else if (b.height <= 4 && b.width > 8 && b.top - R.top < 80) k = 'raya'
    if (!k) continue
    k += '#' + n(k)
    let lista = false; for (let p = e.parentElement; p && p !== raiz; p = p.parentElement) { const oy = getComputedStyle(p).overflowY; if (oy === 'auto' || oy === 'scroll') { lista = true; break } }
    items.push({ k, lista, x: +(b.left - R.left).toFixed(1), y: +(b.top - R.top).toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), app: Boolean(e.closest('[data-pelicula]')) })
  }
  return { raiz: [+R.width.toFixed(1), +R.height.toFixed(1)], palco: P ? [+(P.left - R.left).toFixed(1), +(P.top - R.top).toFixed(1), +P.width.toFixed(1), +P.height.toFixed(1)] : null, items }
})()`

/** Abre Design (la página de la película en el móvil) con un servidor estático propio. Devuelve { d, cerrar, poner(escenaIdx, w, h) }. */
export async function abrirDesign() {
  const RAIZ = path.resolve('docs/diseno/proyecto')
  const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.css': 'text/css', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
  const servidor = http.createServer((req, res) => {
    const ruta = path.join(RAIZ, decodeURIComponent((req.url ?? '/').split('?')[0]))
    if (!ruta.startsWith(RAIZ) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] ?? 'application/octet-stream' })
    fs.createReadStream(ruta).pipe(res)
  })
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
  const puerto = servidor.address().port
  const d = await abrirApp(`http://127.0.0.1:${puerto}`, { ancho: 1000, alto: 900, ruta: '/' + encodeURIComponent('Pase Pelicula Movil.dc.html'), sinEsperarRoot: true, baseFija: true, esperaFija: 10 })
  await d.esp(2000)
  const cerrar = () => { d.cerrar(); servidor.close() }
  /**
   * Deja la escena `idx` (0..6) a w x h: en Design las pantallas son los `.pfr` de la página (2 por escena: 390 y 375). Se usa la de 375 y se le cambia el tamaño al recuadro (390x664 o el que sea); la pieza se mide sola
   * (ResizeObserver). Devuelve el selector JS del .pfr.
   */
  const poner = async (idx, w, h) => {
    const sel = `document.querySelectorAll('.pfr')[${idx * 2 + 1}]`
    await d.evaluar(`(() => { const el = ${sel}; const di = el.closest('.sc-host'); const marco = di.parentElement; marco.style.width = '${w}px'; marco.style.height = '${h}px'; di.style.width = '${w}px'; di.style.height = '${h}px'; el.scrollIntoView({block:'center'}); return true })()`)
    // espera a que la pieza haya medido el recuadro nuevo (la escala del palco = min(ancho/390, alto/844))
    const esperada = Math.min(w / 390, h / 844)
    for (let i = 0; i < 20; i++) {
      await d.esp(400)
      const s = await d.evaluar(`(() => { const raiz = ${sel}; const p = [...raiz.querySelectorAll('div')].find((x) => /scale\\(/.test(x.style.transform || '')); const m = p && /scale\\(([\\d.]+)\\)/.exec(p.style.transform); return m ? Number(m[1]) : null })()`)
      if (s != null && Math.abs(s - esperada) < 0.002) break
    }
    await d.esp(500)
    await d.evaluar(FF(sel))
    await d.esp(700)
    return sel
  }
  /** Pone la escena a la vista y la deja correr lo que dura (las pantallas de Design solo avanzan mientras se ven). */
  const ver = async (idx) => {
    await d.evaluar(`document.querySelectorAll('.pfr')[${idx * 2 + 1}].scrollIntoView({block:'center'})`)
    await d.esp(SEGUNDOS[idx] * 1000)
  }
  return { d, cerrar, poner, ver }
}

/** Abre la película en la app a w x h. Devuelve { a, ir(idx) } (ir toca la rayita y pone la escena en su estado final). */
export async function abrirPelicula(w, h) {
  const a = await conViaje({ ancho: w, alto: h, vista: false, extraAntes: 'window.__pruebaPeliculaEscena = 0;' })
  await abrirPase(a)
  await cuando(a, "Boolean(document.querySelector('[data-pelicula] .pfr'))", 60)
  await esp(2500)
    const ir = async (idx) => {
    const c = await a.evaluar(`(() => { const r = document.querySelectorAll('[data-pelicula] [data-raya]')[${idx}]; if (!r) return null; const b = r.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] })()`)
    if (!c) return false
    await clicEn(a, c[0], c[1])
    await esp(SEGUNDOS[idx] * 1000)
    await a.evaluar(FF("document.querySelector('[data-pelicula] .pfr')"))
    await esp(900)
    return true
  }
  return { a, ir }
}

/**
 * Compara las capturas de Design y de la app (mismo tamaño) píxel a píxel con un canvas de un Chrome en blanco. `lote`: [{ id, a, b, w, h, esc }]. Devuelve { id: % de píxeles distintos } (distinto = algún canal
 * a más de 48 de diferencia). Se saltan las cuatro esquinas (Design las dibuja con el recuadro redondeado de su página) y, en la escena 5 el globo (gira sin parar) y en el final (escena 7) la zona de la lista (las filas son las de la app) y la barra de [Ver]/[Saltar]/✕.
 */
export async function compararCapturas(lote) {
  const a = await abrirApp('about:blank', { ancho: 800, alto: 600, ruta: '', sinEsperarRoot: true, baseFija: true, esperaFija: 0 })
  const res = {}
  try {
    for (const it of lote) {
      const b64 = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64')
      const S = Math.min(it.w / 390, it.h / 844)
      const TP = Math.max(0, (it.h - 844 * S) / 2)
      const mascaras = [[0, 0, 36, 36], [it.w - 36, 0, 36, 36], [0, it.h - 36, 36, 36], [it.w - 36, it.h - 36, 36, 36]]
      if (it.esc === 5) mascaras.push([0, TP + 230 * S, it.w, 400 * S]) // el globo gira sin parar: cada captura lo pilla en otro giro
      if (it.esc === 7) mascaras.push([0, TP + 40 * S, it.w, 110 * S], [0, TP + 190 * S, it.w, 480 * S])
      const js = `(async () => {
        const cargar = (u) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = u })
        const [x, y] = await Promise.all([cargar(${JSON.stringify(b64(it.a))}), cargar(${JSON.stringify(b64(it.b))})])
        const w = ${it.w}, h = ${it.h}
        const dat = (i) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(i, 0, 0, w, h); return g.getImageData(0, 0, w, h).data }
        const p = dat(x), q = dat(y); const M = ${JSON.stringify(mascaras)}
        let n = 0, d = 0
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          if (M.some((m) => i >= m[0] && i < m[0] + m[2] && j >= m[1] && j < m[1] + m[3])) continue
          const k = (j * w + i) * 4; n++
          if (Math.max(Math.abs(p[k] - q[k]), Math.abs(p[k + 1] - q[k + 1]), Math.abs(p[k + 2] - q[k + 2])) > 48) d++
        }
        return d / n * 100
      })()`
      res[it.id] = await a.evaluar(js)
    }
  } finally {
    a.cerrar()
  }
  return res
}
