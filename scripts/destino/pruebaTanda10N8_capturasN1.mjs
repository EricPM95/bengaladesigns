// Tanda 10N8 (N5): capturas de lo de N1 (paradas) junto a Design: la hoja de elegir día (Piezas/Hoja Dia 01, 02, 03), «Quitar con entrada», «Cambiar parada» y la ficha tras mover una parada.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N8_capturasN1.mjs
// SOLO=design | SOLO=app para hacer una parte. Imprime «N comprobaciones, M fallos».
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { conViaje, modulo, esp, cuando, preparar } from './_10n6_k3_comun.mjs'

const { debe, fin } = preparar()
const SAL = path.resolve('docs/dias/capturas_jutrip')
const foto = (n) => path.join(SAL, `10n8_${n}.jpg`)
const SOLO = process.env.SOLO

/* ───── Design: Piezas/Hoja Dia (01 mover el Free Tour, 02 añadir el Free Tour, 03 añadir cualquier sitio) ───── */
if (SOLO !== 'app') {
  const RAIZ = path.resolve('docs/diseno/proyecto')
  const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' }
  const servidor = http.createServer((req, res) => {
    const ruta = path.join(RAIZ, decodeURIComponent((req.url ?? '/').split('?')[0]))
    if (!ruta.startsWith(RAIZ) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] ?? 'application/octet-stream' })
    fs.createReadStream(ruta).pipe(res)
  })
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
  const d = await abrirApp(`http://127.0.0.1:${servidor.address().port}`, { ancho: 1000, alto: 900, ruta: '/Piezas/' + encodeURIComponent('Hoja Dia.dc.html'), sinEsperarRoot: true, baseFija: true, esperaFija: 10 })
  try {
    await d.esp(5000)
    for (const [clave, texto] of [
      ['01_mover_freetour', '01 · Mover el Free Tour'],
      ['02_anadir_freetour', '02 · Añadir el Free Tour'],
      ['03_anadir_sitio', '03 · Añadir cualquier sitio'],
    ]) {
      const r = await d.evaluar(`(() => { const s = Array.from(document.querySelectorAll('span')).find((x) => x.textContent === ${JSON.stringify(texto)}); if (!s) return null; const c = s.parentElement; c.scrollIntoView({block:'start'}); const b = c.getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height } })()`)
      debe(Boolean(r), 'hoja-dia', `Design: encuentro «${texto}»`)
      if (!r) continue
      const x = await d.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } })
      fs.writeFileSync(foto(`design_hoja_dia_${clave}`), Buffer.from(x.result.data, 'base64'))
    }
  } finally {
    d.cerrar()
    servidor.close()
  }
}

/* ───── La app ───── */
if (SOLO !== 'design') {
  const a = await conViaje({ version: 'gratis', ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    const st = (js) => ev(modulo('/src/store/useRouteStore.ts') + `.then((m) => { const s = m.useRouteStore.getState(); const r = s.route; ${js} })`)
    const hoja = () => ev("(() => { const h = document.querySelector('[data-hoja-dia]'); return h ? { datos: h.dataset.hojaDia, titulo: h.querySelector('[data-hoja-dia-titulo]')?.textContent, boton: h.querySelector('[data-hoja-dia-boton]')?.textContent, filas: h.querySelectorAll('[data-dia-id]').length, bloqueadas: h.querySelectorAll('[data-bloqueado]').length } : null })()")
    const cerrarHoja = async () => {
      await ev("document.querySelector('[data-hoja-dia] button[aria-label=\"Cerrar\"]')?.click(); true")
      await esp(600)
    }
    const clic = (texto) => ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().includes(${JSON.stringify(texto)}) && x.offsetParent !== null); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()`)
    for (let i = 0; i < 40 && !(await st('return r.days.some((d)=>d.stops.length>5)')); i++) await esp(500)

    // 02 · Añadir el Free Tour (EXPLORAR · Entradas · «+» del Free Tour)
    await st("s.setMode('explore'); return true")
    await esp(1500)
    await clic('Entradas')
    await esp(2500)
    const sumar = await ev("(() => { const tit = Array.from(document.querySelectorAll('span, p, h3, div')).find((x) => /^Free Tour/.test((x.textContent || '').trim()) && x.children.length === 0); const t = tit?.closest('div.relative.flex'); const b = t && Array.from(t.querySelectorAll('button')).find((x) => /Añadir|\\+/.test(x.textContent || '')); if (!b) return false; b.click(); return true })()")
    await esp(1200)
    let h = await hoja()
    debe(sumar && h && h.titulo === '¿A qué día lo añadimos?' && h.bloqueadas === 0, 'hoja-dia-02', `la hoja de añadir el Free Tour, sin días en gris (${JSON.stringify(h)})`)
    if (h) await a.captura(foto('n1_hoja_dia_02_anadir_freetour'))
    await cerrarHoja()

    // 03 · Añadir un sitio cualquiera (EXPLORAR · el «+» de una tarjeta de sitio)
    await clic('Atracciones')
    await esp(2500)
    const mas = await ev("(() => { const b = Array.from(document.querySelectorAll('button[aria-label^=\"Añadir \"]')).find((x) => x.offsetParent !== null); if (!b) return false; b.scrollIntoView({block:'center'}); b.click(); return true })()")
    await esp(1500)
    h = await hoja()
    debe(mas && h && h.bloqueadas === 0, 'hoja-dia-03', `la hoja de añadir un sitio, sin días bloqueados por entradas (${JSON.stringify(h)})`)
    if (h) await a.captura(foto('n1_hoja_dia_03_anadir_sitio'))
    await cerrarHoja()

    // Mover una parada a otro día y abrir su ficha de nuevo
    await st("s.setMode('days'); s.setActiveDayId(r.days[0].id); return true")
    await esp(2000)
    const nombre = await st('return r.days[0].stops.filter((x) => !x.isBreak && !x.isFreeTour)[1].name')
    const idParada = await st('return r.days[0].stops.filter((x) => !x.isBreak && !x.isFreeTour)[1].id')
    const dia2 = await st('return r.days[1].id')
    const dia1 = await st('return r.days[0].id')
    await ev(modulo('/src/lib/cambiarParada.ts') + `.then((m) => m.moverParadaAOtroDia(${JSON.stringify(idParada)}, ${JSON.stringify(dia1)}, ${JSON.stringify(dia2)}, { conPase: false }))`)
    await esp(1500)
    await st('s.setActiveDayId(r.days[1].id); return true')
    await esp(2500)
    const abierta = await ev(`(() => { const tit = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === ${JSON.stringify(nombre)} || x.textContent.startsWith(${JSON.stringify(nombre + ',')})); tit?.scrollIntoView({ block: 'center' }); tit?.click(); return Boolean(tit) })()`)
    const ok = await cuando(a, "Boolean(document.querySelector('[data-ficha-panel] [data-ficha-cabecera]'))", 60)
    debe(abierta && ok, 'ficha-mover', `la ficha de ${nombre} se vuelve a abrir tras moverla al día 2`)
    await esp(1500)
    const quedaEn = await st(`return r.days.findIndex((d) => d.stops.some((x) => x.id === ${JSON.stringify(idParada)})) + 1`)
    debe(quedaEn === 2, 'ficha-mover', `la parada está ahora en el día 2 (${quedaEn})`)
    await a.captura(foto('n1_ficha_tras_mover'))
    await ev("document.querySelector('[aria-label=\"Volver\"]')?.click(); true")
    await esp(900)

    // «Cambiar parada»: título «Cambiar X», sin franja, ⇄ en todos
    const abrirMenu = (n) => ev(`(() => { const b = Array.from(document.querySelectorAll('[data-menu-hoja="parada"]')).find((x) => { let e = x; for (let i = 0; i < 6 && e.parentElement; i++) e = e.parentElement; return e.textContent.includes(${JSON.stringify(n)}) }); if (!b) return false; b.scrollIntoView({block:'center'}); b.click(); return true })()`)
    const otra = await st('return r.days[1].stops.filter((x) => !x.isBreak && !x.isFreeTour && !x.reservationId)[3].name')
    debe(await abrirMenu(otra), 'cambiar', `el «···» de ${otra}`)
    await esp(900)
    await ev("Array.from(document.querySelectorAll('[data-opcion-hoja]')).find((t) => t.textContent.includes('Cambiar parada'))?.click(); true")
    await cuando(a, "document.querySelectorAll('[data-cambiar-por]').length > 2", 80)
    await esp(2500)
    const c = await ev("(() => ({ titulo: document.querySelector('[data-titulo-explorador]')?.innerText?.trim() ?? null, franja: Boolean(document.querySelector('[data-pregunta-cambiar-parada]')), swaps: document.querySelectorAll('[data-cambiar-por]').length, enRuta: Array.from(document.querySelectorAll('[data-cambiar-por]')).filter((b) => /En ruta/.test(b.closest('div.relative.flex')?.textContent ?? '')).length }))()")
    debe(c.titulo && c.titulo.startsWith('Cambiar ') && !c.franja && c.swaps >= 3, 'cambiar', `título «Cambiar X», sin franja, con ⇄ (${JSON.stringify(c)})`)
    debe(c.enRuta >= 1, 'cambiar', `el ⇄ también en los sitios «En ruta» (${c.enRuta})`)
    await a.captura(foto('n1_cambiar_parada'))
  } finally {
    a.cerrar()
  }
}
fin('pruebaTanda10N8_capturasN1')
