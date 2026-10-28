// Tanda 10N4 (G1): el lápiz de la propuesta y el botón de los logros en TODAS las pantallas (y debajo de una hoja abierta), la pastilla del pase sin parpadeo y una sola letra.
// Hace falta el servidor y Vite (los de la batería los arrancan solos; a mano: `npm run server` y `npm run dev`). Abre un Chrome sin ventana (scripts/destino/_enLaApp.mjs).
//   APP_URL=http://localhost:5181 API_URL=http://localhost:8851 node scripts/destino/pruebaTanda10N4_flotantes.mjs
// Capturas a tamaño de móvil en docs/dias/capturas_jutrip/10n4_flotantes_*.jpg
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const jpg = (n) => path.join(SALIDA, `10n4_flotantes_${n}.jpg`)
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0'
const leer = (f) => fs.readFileSync(f, 'utf8')

// Muestreo cada 30 ms de la pastilla del pase y de HOY (antes de que arranque la página).
const MUESTREO = `
window.__muestras = []
window.__retrasoDemo = new Proxy({}, { get: (t, k) => (typeof k === 'string' && k.indexOf('/api/pase/estado') === 0 ? (window.__retrasoPase ?? 0) : undefined) })
setInterval(() => {
  const p = document.querySelector('[data-pastilla-pase]')
  const h = document.querySelector('[data-hoy]')
  window.__muestras.push({ t: Date.now(), p: p ? p.getAttribute('data-pastilla-pase') : null, h: h ? h.getAttribute('data-hoy') : null })
}, 30)
`

async function abrir({ invitado, permiso = 'recomendar', simulada = '2026-10-10' } = {}) {
  const antes = (invitado ? `sessionStorage.setItem('trazo:invitado','1');sessionStorage.setItem('trazo:permiso','${permiso}');` : '') + MUESTREO
  const app = await abrirApp(APP, { ruta: RUTA, antes })
  for (let i = 0; i < 300 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 240 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  for (let intento = 0; intento < 8; intento++) {
    const ok = await app.evaluar('window.__rutaPrueba().then(() => true, (e) => String(e && e.message))').catch((e) => String(e))
    if (ok === true) break
    await app.esp(1500)
  }
  for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(2500)
  for (let i = 0; i < 6; i++) {
    const h = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()").catch(() => false)
    if (!h) break
    await app.esp(600)
  }
  const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const S = await import('/src/store/useSyncStore.ts'); const P = await import('/src/store/usePropuestaStore.ts'); const V = await import('/src/store/useViajeCompartido.ts'); const U = await import('/src/store/usePresupuestoUi.ts'); const M = await import('/src/components/logros/momentos/useMomentosUI.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); ${js} })()`)
  await ev(`R.useRouteStore.getState().setDevSimulatedTodayIso(${JSON.stringify(simulada)})
    S.useSyncStore.setState({ activeTripId: 'demo-viaje' })
    V.useViajeCompartido.getState().poner({ tripId: 'demo-viaje', gente: [{ id: 'eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' }, { id: 'ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: '${permiso}' }], yo: 'ana' })
    R.useRouteStore.getState().setMode('days')
    return true`).catch(() => null)
  await app.esp(1500)
  return { app, ev }
}

/** ¿Se ve de verdad el botón (lo que hay en su centro es él)? */
const vistos = (app) => app.evaluar(`(() => {
  const mira = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); const a = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { encima: Boolean(a && a.closest(sel)), z: getComputedStyle(e).zIndex, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) } }
  return { lapiz: mira('[data-boton-propuesta]'), logros: mira('[data-boton-logros]') }
})()`)

/** El último elemento de la lista que se desplaza (la que tiene más contenido que alto), con la lista al final del todo: ¿lo pisa algún botón flotante? */
const ultimoLibre = (app, sel) => app.evaluar(`(() => {
  const cand = ${sel ? `[document.querySelector(${JSON.stringify(sel)})]` : `Array.from(document.querySelectorAll('*')).filter((e) => { const c = getComputedStyle(e); return (c.overflowY === 'auto' || c.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 40 && e.getBoundingClientRect().height > 250 })`}.filter(Boolean)
  const sc = cand.sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]
  if (!sc) return { sinLista: true }
  sc.scrollTop = sc.scrollHeight
  const sr = sc.getBoundingClientRect()
  let ultimo = 0
  let caja = null
  for (const e of sc.querySelectorAll('*')) { const r = e.getBoundingClientRect(); if (e.children.length === 0 && r.width > 0 && r.height > 0 && r.bottom <= sr.bottom + 1 && r.bottom >= ultimo) { ultimo = r.bottom; caja = r } }
  const cajas = ['[data-boton-propuesta]', '[data-boton-logros]'].map((s) => document.querySelector(s)).filter(Boolean).map((e) => e.getBoundingClientRect())
  const pisa = caja ? cajas.filter((b) => b.top < caja.bottom && b.bottom > caja.top && b.left < caja.right && b.right > caja.left) : []
  return { ultimo: Math.round(ultimo), listaBottom: Math.round(sr.bottom), pisan: pisa.length }
})()`)

const letras = (app) => app.evaluar(`(() => {
  const ok = /^(Geist|Geist Mono|Instrument Serif|Italiana)$/
  const raras = {}
  for (const e of document.querySelectorAll('body *')) {
    if (!e.childNodes.length || !Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) continue
    const f = getComputedStyle(e).fontFamily.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
    if (!ok.test(f)) { const k = f + ' <' + e.tagName + '.' + String(e.className || '').slice(0, 50) + '>'; raras[k] = (raras[k] ?? 0) + 1 }
  }
  return raras
})()`)

console.log('1. El lápiz y los logros, en todas las pantallas')
const inv = await abrir({ invitado: true })
{
  const { app, ev } = inv
  // Un cambio en la propuesta (para que salga el lápiz).
  await ev(`const d = route().days.find((x) => x.id === 'day-3'); st().removeStop('day-3', d.stops[d.stops.length - 1].id); return 1`)
  await app.esp(800)
  const pantallas = [
    ['route', 'RUTA', async () => ev(`R.useRouteStore.getState().setMode('route'); return 1`)],
    ['days', 'DÍAS', async () => ev(`R.useRouteStore.getState().setMode('days'); return 1`)],
    ['bookings', 'RESERVAS', async () => ev(`R.useRouteStore.getState().setMode('bookings'); return 1`)],
    ['today', 'HOY', async () => ev(`R.useRouteStore.getState().setMode('today'); return 1`)],
    ['explore', 'EXPLORAR (tarjetas)', async () => ev(`R.useRouteStore.getState().setMode('explore'); return 1`)],
  ]
  for (const [id, nombre, ir] of pantallas) {
    await ir()
    await app.esp(1300)
    const v = await vistos(app)
    debe(v.lapiz?.encima === true, 'lápiz', `${nombre}: se ve el lápiz (${JSON.stringify(v.lapiz)})`)
    debe(v.logros?.encima === true, 'logros', `${nombre}: se ve el botón de los logros (${JSON.stringify(v.logros)})`)
    if (v.lapiz && v.logros) debe(v.lapiz.bottom <= v.logros.top, 'solape', `${nombre}: el lápiz va encima del botón de los logros, sin pisarlo`)
    await app.captura(jpg(id))
  }

  // EXPLORAR a pantalla completa (lista y mapa): una tarjeta del panel.
  await ev(`R.useRouteStore.getState().setMode('explore'); return 1`)
  await app.esp(1000)
  const abierta = await app.evaluar(`(() => { const t = Array.from(document.querySelectorAll('button')).find((b) => /\\b(lugares|con entrada|sitios)\\b/.test(b.textContent || '')); if (!t) return false; t.click(); return true })()`)
  debe(abierta === true, 'explorar', 'una tarjeta de EXPLORAR abre la pantalla completa')
  await app.esp(2500)
  {
    const pantalla = await app.evaluar(`Boolean(document.querySelector('.map-cover-overlay.fixed.z-\\\\[90\\\\]'))`)
    debe(pantalla === true, 'explorar', 'la pantalla completa de EXPLORAR está abierta')
    const v = await vistos(app)
    debe(v.lapiz?.encima === true, 'lápiz', `EXPLORAR a pantalla completa: se ve el lápiz (${JSON.stringify(v.lapiz)})`)
    debe(v.logros?.encima === true, 'logros', `EXPLORAR a pantalla completa: se ve el botón de los logros (${JSON.stringify(v.logros)})`)
    await app.captura(jpg('explorar_completo'))
    const u = await ultimoLibre(app, null)
    debe(u.sinLista || u.pisan === 0, 'hueco', `EXPLORAR: al final de la lista, nada pisa el último sitio (${JSON.stringify(u)})`)

    // Añadir un sitio como invitado desde aquí: la hoja de «¿A qué día lo añadimos?» deja los botones debajo y, al cerrarla, vuelven.
    const antesN = await ev(`return document.querySelector('[data-propuesta-n]')?.getAttribute('data-propuesta-n') ?? '0'`)
    const anadir = await app.evaluar(`(() => { const b = document.querySelector('button[aria-label^="Añadir "]'); if (!b) return false; b.click(); return true })()`)
    await app.esp(1500)
    if (anadir) {
      const dentro = await vistos(app)
      debe(dentro.lapiz?.encima === false && dentro.logros?.encima === false, 'hoja', `con la hoja «A qué día lo añadimos» abierta, el lápiz y los logros quedan debajo (${JSON.stringify(dentro)})`)
      await app.captura(jpg('explorar_hoja'))
      const cerrado = await app.evaluar(`(() => { const d = document.querySelector('[role="dialog"][aria-labelledby="add-to-day-heading"], [data-hoja-dia="add-to-day"]'); const b = d && Array.from(d.querySelectorAll('button')).find((x) => /Cerrar|Cancelar|Ahora no/i.test((x.textContent || '') + (x.getAttribute('aria-label') || ''))); if (b) { b.click(); return true } document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); return false })()`)
      await app.esp(1200)
      const fuera = await vistos(app)
      debe(fuera.lapiz?.encima === true && fuera.logros?.encima === true, 'hoja', `al cerrar la hoja vuelven a verse (${JSON.stringify(fuera)}; cierra con botón: ${cerrado})`)
    } else {
      debe(false, 'explorar', 'no se encontró el botón «+ Añadir» en EXPLORAR')
    }

    // La ficha de un sitio (desde EXPLORAR).
    const ficha = await app.evaluar(`(() => { for (const e of document.querySelectorAll('*')) if (e.scrollTop > 0) e.scrollTop = 0; const b = document.querySelector('button[aria-label^="Añadir "]'); if (!b) return false; const nombre = b.getAttribute('aria-label').slice(7); const c = Array.from(document.querySelectorAll('h3, p, span, div')).find((e) => e.children.length === 0 && (e.textContent || '').trim() === nombre); if (!c) return false; c.scrollIntoView({ block: 'center' }); c.click(); return true })()`)
    await app.esp(2200)
    const vf = await vistos(app)
    debe(vf.lapiz?.encima === true && vf.logros?.encima === true, 'ficha', `la ficha de un sitio: se ven el lápiz y los logros (${JSON.stringify(vf)}; abierta: ${ficha})`)
    await app.captura(jpg('ficha'))
    const uf = await ultimoLibre(app, null)
    debe(uf.sinLista || uf.pisan === 0, 'hueco', `la ficha: al final, nada pisa el último elemento (${JSON.stringify(uf)})`)
    void antesN
  }

  // El presupuesto.
  await ev(`R.useRouteStore.getState().setMode('route'); U.usePresupuestoUi.getState().abrir(); return 1`)
  await app.esp(1500)
  {
    const v = await vistos(app)
    debe(v.lapiz?.encima === true && v.logros?.encima === true, 'presupuesto', `el presupuesto: se ven el lápiz y los logros (${JSON.stringify(v)})`)
    await app.captura(jpg('presupuesto'))
    const u = await ultimoLibre(app, null)
    debe(u.sinLista || u.pisan === 0, 'hueco', `el presupuesto: al final, nada pisa el último elemento (${JSON.stringify(u)})`)
    await ev(`U.usePresupuestoUi.getState().cerrar(); return 1`)
  }

  // Debajo de una hoja: la hoja de la propuesta (el lápiz) y la de los logros.
  await ev(`R.useRouteStore.getState().setMode('days'); return 1`)
  await app.esp(1000)
  await app.evaluar(`document.querySelector('[data-boton-propuesta]')?.click()`)
  await app.esp(1300)
  {
    const v = await vistos(app)
    debe(v.logros?.encima === false && v.lapiz?.encima === false, 'hoja', `con la hoja de la propuesta abierta, los dos botones quedan debajo (${JSON.stringify(v)})`)
    await app.captura(jpg('hoja_propuesta'))
    await ev(`P.usePropuestaStore.getState().abrirHoja(null); return 1`)
    await app.esp(1000)
    const d = await vistos(app)
    debe(d.logros?.encima === true && d.lapiz?.encima === true, 'hoja', `al cerrar la hoja de la propuesta vuelven (${JSON.stringify(d)})`)
  }
  await app.evaluar(`document.querySelector('[data-boton-logros]')?.click()`)
  await app.esp(1500)
  {
    const v = await vistos(app)
    debe(v.lapiz?.encima === false, 'hoja', `con la hoja de los logros abierta, el lápiz queda debajo (${JSON.stringify(v)})`)
    await ev(`M.useMomentosUI.getState().cerrarHojaLogros(); return 1`)
    await app.esp(1200)
    const d = await vistos(app)
    debe(d.logros?.encima === true && d.lapiz?.encima === true, 'hoja', `al cerrar la hoja de los logros vuelven (${JSON.stringify(d)})`)
  }

  // Los botones de abajo no los tapan: [Visto] de HOY (lo esquivaba antes) y el pie de la ficha ya van marcados.
  const fuentes = leer('src/components/flotantes/flotantes.ts')
  debe(/data-evitar-flotantes/.test(fuentes) && /data-hoy-siguiente/.test(fuentes), 'botones', 'los botones de abajo de cada pantalla se esquivan (selector común en flotantes.ts)')
  debe(/data-evitar-flotantes/.test(leer('src/components/route/dayDetail/StopDetailSheet.tsx')) && /data-evitar-flotantes/.test(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')), 'botones', 'el pie de la ficha y la barra de elegir varios llevan data-evitar-flotantes')
  inv.app.cerrar()
}

console.log('2. La pastilla del pase no parpadea «comprado»')
for (const estado of ['sin', 'con']) {
  const adm = await abrir({})
  const { app, ev } = adm
  await app.evaluar(`window.__demo.estadoPase(${JSON.stringify(estado)})`)
  await ev(`R.useRouteStore.getState().setMode('days'); return 1`)
  await app.esp(800)
  await app.evaluar(`window.__retrasoPase = 2500; window.__muestras.length = 0; 0`)
  await ev(`R.useRouteStore.getState().setMode('route'); return 1`)
  await app.esp(5200)
  const m = await app.evaluar(`window.__muestras.map((x) => x.p).filter((p) => p !== null)`)
  const vistas = [...new Set(m)]
  const primerReal = m.findIndex((p) => p === 'con' || p === 'sin')
  debe(m.length > 20 && m.includes('cargando'), 'pase', `(${estado}) mientras llega /api/pase/estado la pastilla va sin estado (muestras: ${vistas.join(' → ')})`)
  debe(primerReal === -1 || m[primerReal] === estado, 'pase', `(${estado}) nunca sale el estado equivocado antes de saberlo: primero ${m[primerReal]} (esperado ${estado})`)
  debe(!(estado === 'sin' && m.includes('con')), 'pase', '(sin) la pastilla nunca sale «comprada» por adelantado')
  debe(vistas.join('>') === `cargando>${estado}`, 'pase', `(${estado}) solo pasa de cargando a ${estado} (${vistas.join('>')})`)
  if (estado === 'sin') await app.captura(jpg('pase_sin'))

  // HOY: mientras no se sabe, ni «con pase» ni «sin pase».
  await ev(`R.useRouteStore.getState().setMode('days'); return 1`)
  await app.esp(600)
  await app.evaluar(`window.__muestras.length = 0; 0`)
  await ev(`R.useRouteStore.getState().setMode('today'); return 1`)
  await app.esp(5200)
  const h = await app.evaluar(`window.__muestras.map((x) => x.h).filter((p) => p !== null)`)
  const hv = [...new Set(h)]
  debe(hv[0] === 'cargando', 'pase', `(${estado}) HOY arranca sin pintar ni «con» ni «sin pase» (${hv.join(' → ')})`)
  debe(!(estado === 'sin') || !hv.some((x) => x !== 'cargando' && x !== 'sin-pase'), 'pase', `(${estado}) HOY sin pase nunca enseña lo de con pase por adelantado (${hv.join(' → ')})`)
  if (estado === 'sin') await app.captura(jpg('hoy_sin_pase'))
  adm.app.cerrar()
}

console.log('3. Una sola letra en toda la app')
{
  const css = leer('src/index.css')
  const tw = leer('tailwind.config.ts')
  const html = leer('index.html')
  debe(!/Plus Jakarta|Playfair|DM Sans|DM\+Sans/i.test(css), 'letras', 'index.css ya no carga ni usa Plus Jakarta Sans, Playfair Display ni DM Sans')
  debe(!/playfair|dmsans|Playfair|DM Sans|Jakarta/.test(tw), 'letras', 'tailwind.config.ts ya no define Playfair ni DM Sans')
  debe(!/Plus\+Jakarta|Playfair|DM\+Sans/i.test(html), 'letras', 'index.html no carga las letras viejas')
  const usos = []
  const recorre = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) recorre(p); else if (/\.(tsx?|css)$/.test(f.name) && /font-dmsans|font-playfair|DM Sans|Playfair Display|Plus Jakarta/.test(leer(p))) usos.push(p) } }
  recorre('src')
  debe(usos.length === 0, 'letras', `ningún fichero de src usa las letras viejas (${usos.join(', ') || 'ninguno'})`)
  const app = await abrirApp(APP, { ruta: RUTA })
  await app.esp(2500)
  const fam = await app.evaluar(`(() => { const d = document.createElement('div'); d.className = 'rdp-root'; document.body.appendChild(d); const f = getComputedStyle(d).fontFamily; d.remove(); return f })()`)
  debe(/^["']?Geist/.test(fam), 'letras', `el calendario de las fechas (.rdp-root) usa Geist como el resto (${fam})`)
  const dm = await app.evaluar(`(() => { const d = document.createElement('p'); d.className = 'font-sans'; document.body.appendChild(d); const f = getComputedStyle(d).fontFamily; d.remove(); return f })()`)
  debe(/Geist/.test(dm), 'letras', `las pantallas que usaban font-dmsans (calendario de duración, compañía, experiencias, pool) ahora usan font-sans = Geist (${dm})`)
  app.cerrar()
  const insp = await abrir({})
  const raras = {}
  for (const [modo, nombre] of [['route', 'RUTA'], ['days', 'DÍAS'], ['bookings', 'RESERVAS'], ['today', 'HOY'], ['explore', 'EXPLORAR']]) {
    await insp.ev(`R.useRouteStore.getState().setMode(${JSON.stringify(modo)}); return 1`)
    await insp.app.esp(1500)
    const r = await letras(insp.app)
    for (const [k, v] of Object.entries(r)) raras[`${nombre}: ${k}`] = v
  }
  debe(Object.keys(raras).length === 0, 'letras', `ninguna pantalla del viaje usa otra letra que Geist / Geist Mono / Instrument Serif / Italiana (${JSON.stringify(raras)})`)
  insp.app.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` - [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
