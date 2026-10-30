// La medida REAL de la zona de toque (Tanda 10S): lo que se ve y lo que se puede tocar, con elementFromPoint (el ::after invisible de `.zona-toque` cuenta como el botón).
//   import { medirZonaToque, auditoriaToque } from './_zonaToque.mjs'
//   const m = await a.evaluar(medirZonaToque('[data-ajustes]'))   → { w, h, esquinas: [4 booleanos], centro, fuera: [4 booleanos], zona44 }
//   const lista = await a.evaluar(auditoriaToque())                   → los botones visibles de la pantalla cuya zona de toque mide menos de 44 px
// zona44 = las 4 esquinas (metidas 1 px) y el centro del cuadrado de 44 × 44 devuelven el botón; `fuera` = 1 px fuera de cada lado NO lo devuelve (la zona no se pasa de 44).
export const medirZonaToque = (selector) => `(() => {
  const b = document.querySelector(${JSON.stringify(selector)})
  if (!b) return null
  const r = b.getBoundingClientRect()
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2
  const es = (x, y) => { const e = document.elementFromPoint(x, y); return Boolean(e && (e === b || b.contains(e))) }
  const m = 22 - 1
  const esquinas = [es(cx - m, cy - m), es(cx + m, cy - m), es(cx - m, cy + m), es(cx + m, cy + m)]
  const centro = es(cx, cy)
  const ec = document.elementFromPoint(cx, cy)
  const quien = ec ? ec.tagName + ' ' + String(ec.className && ec.className.toString ? ec.className.toString() : '').slice(0, 60) + ' ' + (ec.getAttribute('aria-label') || '') : null
  const f = 22 + 1
  const fuera = [!es(cx - f, cy), !es(cx + f, cy), !es(cx, cy - f), !es(cx, cy + f)]
  return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, esquinas, centro, fuera, zona44: esquinas.every(Boolean) && centro, quien, x: Math.round(r.left), y: Math.round(r.top) }
})()`

export const auditoriaToque = () => `(() => {
  const res = []
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth }
  for (const e of document.querySelectorAll('button, [role="button"], a[href], [onclick], input[type=checkbox], input[type=radio], summary')) {
    if (!vis(e) || e.disabled) continue
    if (e.closest('[aria-hidden="true"]') && !e.matches('[role="button"],button')) continue
    const r = e.getBoundingClientRect()
    // Su zona de toque: lo que se ve, más el ::after si lo tiene (mide su caja de verdad)
    const a = getComputedStyle(e, '::after')
    let w = r.width, h = r.height
    if (a && a.content !== 'none' && a.position === 'absolute') { w = Math.max(w, parseFloat(a.width) || 0); h = Math.max(h, parseFloat(a.height) || 0) }
    if (w < 43.5 || h < 43.5) {
      const t = (e.getAttribute('aria-label') || e.innerText || e.getAttribute('title') || '').replace(/\\s+/g, ' ').trim().slice(0, 30)
      const d = Array.from(e.attributes).filter((x) => x.name.startsWith('data-')).map((x) => x.name).slice(0, 2).join(',')
      res.push({ tag: e.tagName.toLowerCase(), t, d, w: Math.round(w), h: Math.round(h), vw: Math.round(r.width), vh: Math.round(r.height), cls: (e.className && e.className.toString().slice(0, 60)) || '' })
    }
  }
  return res
})()`
