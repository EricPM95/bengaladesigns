// Tanda 10S5 (agente J): apartado 1.
//   1 · el «Me gusta» de 30 px lleva su zona de toque de 44 × 44 (sin cambiar lo que se ve).
//   2 · «Añadir parada» (AddStopScreen) y AttractionsFinder buscan primero en NUESTROS sitios (con foto, horario, entrada e historia) y debajo, con el título «Otros sitios», lo del mapa.
//   3 · un sitio con entrada dos veces en la ruta se deja añadir y su entrada sale reservada en las dos paradas (y en las dos filas de RESERVAS).
//   4 · los botones flotantes (logros fijo abajo, encima el lápiz) sin pisarse nunca y sin tapar contenido, en presupuesto, RESERVAS, DÍAS y EXPLORAR, a 375 × 667 y 390 × 844.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S5_J.mjs
// Imprime «N comprobaciones, M fallos» y sale con 1 si falla. Capturas en docs/dias/capturas_jutrip/10s5_*.jpg
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const jpg = (n) => path.join(SALIDA, `10s5_${n}.jpg`)

console.log('1. El código')
{
  const gusta = sinComentarios(leer('src/components/ui/MeGusta.tsx'))
  debe(/zona-toque/.test(gusta), 'gusta', '«Me gusta» ficha con zona de toque')
  const explorador = sinComentarios(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx'))
  debe(/zona-toque h-\[30px\] min-w-\[30px\]/.test(explorador), 'gusta', 'el «Me gusta» de 30 px lleva zona-toque')
  const add = sinComentarios(leer('src/components/route/addStop/AddStopScreen.tsx'))
  debe(/useSitiosNuestros/.test(add) && /FilaSitioNuestro/.test(add) && /TituloOtrosSitios/.test(add), 'buscar', 'AddStopScreen busca primero en nuestros sitios y pone «Otros sitios»')
  const fin = sinComentarios(leer('src/components/route/attractionsFinder/AttractionsFinder.tsx'))
  debe(/useSitiosNuestros/.test(fin) && /FilaSitioNuestro/.test(fin) && /TituloOtrosSitios/.test(fin), 'buscar', 'AttractionsFinder busca primero en nuestros sitios y pone «Otros sitios»')
  const trazo = sinComentarios(leer('src/components/trazo/PrimeraPantalla.tsx'))
  debe(!/useSitiosNuestros/.test(trazo), 'buscar', 'la ciudad de salida sigue solo con el mapa')
  const reglas = leer('docs/REGLAS_DE_LA_APP.md')
  debe(/botones flotantes/i.test(reglas) && /10S5/.test(reglas), 'regla', 'la regla de los botones flotantes está en REGLAS_DE_LA_APP.md')
}

const STUB = `
(() => {
  const f0 = window.fetch.bind(window)
  window.fetch = (u, o) => {
    const s = String(typeof u === 'string' ? u : (u && u.url) || u)
    if (s.indexOf('api.mapbox.com/search/searchbox/v1/forward') >= 0) {
      const f = (name, id, lat, lng) => ({ properties: { name, mapbox_id: id, full_address: 'Via Prueba, Roma', poi_category: ['restaurant'], coordinates: { latitude: lat, longitude: lng } } })
      return Promise.resolve(new Response(JSON.stringify({ features: [f('Coliseo Pizza', 'stub-1', 41.8999, 12.5101), f('Colosseo', 'stub-2', 41.8902, 12.4922)] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }
    return f0(u, o)
  }
})()
`

const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0'

async function abrir({ ancho = 390, alto = 844, invitado = false, antes = '' } = {}) {
  const previo = (invitado ? "sessionStorage.setItem('trazo:invitado','1');sessionStorage.setItem('trazo:permiso','recomendar');" : '') + antes
  const app = await abrirApp(APP, { ruta: RUTA, ancho, alto, antes: previo })
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
  const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const S = await import('/src/store/useSyncStore.ts'); const V = await import('/src/store/useViajeCompartido.ts'); const U = await import('/src/store/usePresupuestoUi.ts'); const B = await import('/src/lib/bookings.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); ${js} })()`)
  if (invitado) {
    await ev(`R.useRouteStore.getState().setDevSimulatedTodayIso('2026-10-10')
      S.useSyncStore.setState({ activeTripId: 'demo-viaje' })
      V.useViajeCompartido.getState().poner({ tripId: 'demo-viaje', gente: [{ id: 'eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' }, { id: 'ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'recomendar' }], yo: 'ana' })
      return true`).catch(() => null)
  }
  await ev(`R.useRouteStore.getState().setMode('days'); return true`)
  await app.esp(1200)
  return { app, ev }
}

/** Los círculos flotantes (position: fixed, pequeños, en la parte de abajo) y si alguno pisa a otro. */
const circulos = (app) =>
  app.evaluar(`(() => {
    const vh = window.innerHeight
    const lista = []
    for (const e of document.querySelectorAll('body *')) {
      const c = getComputedStyle(e)
      if (c.position !== 'fixed') continue
      const r = e.getBoundingClientRect()
      if (r.width < 30 || r.width > 100 || r.height < 30 || r.height > 100 || r.bottom < vh - 330 || r.top > vh || c.visibility === 'hidden' || c.display === 'none' || Number(c.opacity) < 0.05) continue
      if (e.closest('[aria-hidden="true"]')) continue
      if (!/BUTTON|A/.test(e.tagName) && !e.querySelector('button')) continue
      lista.push({ q: e.getAttribute('data-boton-propuesta') ? 'lapiz' : e.getAttribute('data-boton-logros') !== null ? 'logros' : (e.getAttribute('aria-label') || e.tagName).slice(0, 30), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) })
    }
    const pisan = []
    for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i], b = lista[j]
      if (a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left) pisan.push(a.q + ' x ' + b.q)
    }
    return { lista, pisan }
  })()`)

/**
 * Todo lo que se desplaza, llevado al final: ¿queda algún texto, borde, imagen o botón de la pantalla (lo que NO es fijo) debajo de un botón flotante? Si la pantalla no se desplaza, también se mira.
 * Devuelve cuántos elementos quedan tapados y el primero.
 */
const ultimoLibre = (app) =>
  app.evaluar(`(() => {
    for (const e of document.querySelectorAll('*')) {
      const c = getComputedStyle(e)
      if ((c.overflowY === 'auto' || c.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 4) e.scrollTop = e.scrollHeight
    }
    const cajas = Array.from(document.querySelectorAll('[data-boton-propuesta], [data-boton-logros]')).map((e) => e.getBoundingClientRect())
    const tapados = []
    const fijoArriba = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) if (getComputedStyle(x).position === 'fixed' && x.getBoundingClientRect().height < 120 && x.getBoundingClientRect().width < 120) return true; return false }
    for (const e of document.querySelectorAll('body *')) {
      if (e.closest('[aria-hidden="true"]') || e.hasAttribute('data-espacio-lapiz') || e.closest('[data-boton-propuesta], [data-boton-logros]')) continue
      const r = e.getBoundingClientRect()
      if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= window.innerHeight) continue
      const c = getComputedStyle(e)
      if (c.visibility === 'hidden' || Number(c.opacity) < 0.05) continue
      const tieneTexto = Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())
      const tieneBorde = (parseFloat(c.borderBottomWidth) > 0 && c.borderBottomStyle !== 'none') || (parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== 'none')
      if (!(tieneTexto || tieneBorde || /^(IMG|INPUT|BUTTON)$/i.test(e.tagName))) continue
      if (fijoArriba(e)) continue
      // Lo que está dentro de un fijo grande (la barra de pestañas, la pantalla entera) se mira igual: solo cuenta si cae bajo un botón.
      // Solo cuenta lo que se ve de verdad: si encima hay una pantalla entera (el presupuesto sobre EXPLORAR), lo de debajo no se ve.
      const bajo = cajas.find((b) => b.top < r.bottom - 1 && b.bottom > r.top + 1 && b.left < r.right - 1 && b.right > r.left + 1)
      const seVe = bajo ? (() => {
        const x = Math.max(bajo.left, r.left) + (Math.min(bajo.right, r.right) - Math.max(bajo.left, r.left)) / 2
        const y = Math.max(bajo.top, r.top) + (Math.min(bajo.bottom, r.bottom) - Math.max(bajo.top, r.top)) / 2
        const pila = document.elementsFromPoint(x, y)
        const siguiente = pila.find((q) => !q.closest('[data-boton-propuesta], [data-boton-logros]'))
        return Boolean(siguiente && (e.contains(siguiente) || siguiente.contains(e)))
      })() : false
      if (seVe) tapados.push((e.tagName + ' ' + (tieneTexto ? e.textContent.trim().slice(0, 30) : (e.className || '').toString().slice(0, 40))).trim())
    }
    return { pisan: tapados.length, primero: tapados[0] ?? null }
  })()`)

async function pasadaFlotantes(ancho, alto, conLapiz) {
  console.log(`4. Los botones flotantes a ${ancho} × ${alto} ${conLapiz ? 'con el lápiz y los logros' : 'solo con los logros'}`)
  const { app, ev } = await abrir({ ancho, alto, invitado: conLapiz })
  try {
    // El móvil de 844 de alto lleva la barra de abajo del iPhone (34 px); el de 667 no.
    await app.cdp('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, bottom: alto >= 800 ? 34 : 0, left: 0, right: 0 } }).catch(() => {})
    // Unos cuantos gastos en «Extras» para que el presupuesto se desplace.
    await ev(`for (let i = 1; i <= 7; i++) st().addGastoExtra({ id: 'x' + i, nombre: 'Gasto de prueba ' + i, precio: { amount: 10 * i, currency: 'EUR' } }); return 1`)
    // Un cambio en la propuesta (para que salga el lápiz encima del botón de los logros).
    if (conLapiz) await ev(`const d = route().days.find((x) => x.stops.length >= 2); st().removeStop(d.id, d.stops[d.stops.length - 1].id); return 1`)
    await app.esp(900)
    const pantallas = [
      ['days', 'DÍAS', () => ev(`U.usePresupuestoUi.setState({ abierto: false }); R.useRouteStore.getState().setMode('days'); return 1`)],
      ['bookings', 'RESERVAS', () => ev(`U.usePresupuestoUi.setState({ abierto: false }); R.useRouteStore.getState().setMode('bookings'); return 1`)],
      ['explore', 'EXPLORAR', () => ev(`U.usePresupuestoUi.setState({ abierto: false }); R.useRouteStore.getState().setMode('explore'); return 1`)],
      ['presupuesto', 'presupuesto', () => ev(`U.usePresupuestoUi.setState({ abierto: true }); return 1`)],
    ]
    for (const [id, nombre, ir] of pantallas) {
      await ir()
      await app.esp(1500)
      const c = await circulos(app)
      const quienes = c.lista.map((x) => x.q)
      debe(quienes.includes('logros'), 'logros', `${ancho}×${alto} ${nombre}: se ve el botón de los logros (${JSON.stringify(c.lista)})`)
      debe(quienes.includes('lapiz') === conLapiz, 'lápiz', `${ancho}×${alto} ${nombre}: se ve el lápiz (${JSON.stringify(c.lista)})`)
      debe(c.pisan.length === 0, 'solape', `${ancho}×${alto} ${nombre}: ningún botón flotante pisa a otro (${c.pisan.join(', ')})`)
      const l = c.lista.find((x) => x.q === 'lapiz')
      const g = c.lista.find((x) => x.q === 'logros')
      if (l && g) {
        debe(l.bottom <= g.top - 4, 'columna', `${ancho}×${alto} ${nombre}: el lápiz va en columna ENCIMA del de logros, con su espacio (${g.top - l.bottom} px)`)
        debe(Math.abs(l.right - g.right) <= 6, 'columna', `${ancho}×${alto} ${nombre}: los dos van alineados a la derecha`)
        debe(g.bottom <= alto, 'dentro', `${ancho}×${alto} ${nombre}: el de logros está dentro de la pantalla`)
      }
      const u = await ultimoLibre(app)
      debe(u.pisan === 0, 'hueco', `${ancho}×${alto} ${nombre}: al final de la pantalla, nada queda debajo de los botones (${JSON.stringify(u)})`)
      await app.esp(300)
      if (alto === 844) await app.captura(jpg(`flotantes_${id}${conLapiz ? '' : '_solo_logros'}`)).catch(() => {})
    }
  } finally {
    app.cerrar()
  }
}

for (const [ancho, alto] of [[375, 667], [390, 844]]) for (const conLapiz of [true, false]) await pasadaFlotantes(ancho, alto, conLapiz)

console.log('3. En la app: «Añadir parada», «Otros sitios» y la entrada dos veces')
{
  const { app, ev } = await abrir({ antes: STUB })
  try {
    // — El «Me gusta» de 30 px: zona de toque de 44 × 44 —
    await ev(`R.useRouteStore.getState().setMode('explore'); return 1`)
    await app.esp(900)
    const abierta = await app.evaluar(`(() => { const t = Array.from(document.querySelectorAll('button')).find((b) => /\\b(lugares|con entrada|sitios)\\b/.test(b.textContent || '')); if (!t) return false; t.click(); return true })()`)
    await app.esp(2500)
    if (abierta) {
      const zonas = await app.evaluar(`Array.from(document.querySelectorAll('[data-megusta]')).slice(0, 40).map((e) => { const r = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after'); return { v: e.getAttribute('data-megusta'), w: Math.round(r.width), h: Math.round(r.height), zw: parseFloat(a.width) || 0, zh: parseFloat(a.height) || 0 } })`)
      const chicos = zonas.filter((z) => z.w < 44 || z.h < 44)
      debe(zonas.length > 0, 'gusta', 'hay «Me gusta» en la pantalla de EXPLORAR')
      debe(chicos.every((z) => z.zw >= 44 && z.zh >= 44), 'gusta', `todos los «Me gusta» de menos de 44 px llevan zona de toque de 44 × 44 (${JSON.stringify(chicos.slice(0, 3))})`)
      await app.captura(jpg('megusta')).catch(() => {})
    } else debe(false, 'gusta', 'no se pudo abrir EXPLORAR a pantalla completa')
    await ev(`R.useRouteStore.getState().setMode('days'); return 1`)
    await app.esp(1000)
    await app.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button[aria-label=Cerrar]')).pop(); b?.click(); return true })()`)
    await app.esp(600)

    // — «Añadir parada» con «coliseo» (un día cuya ciudad no tiene catálogo propio: sale la pantalla del mapa) —
    const diaId = await ev(`const d = route().days.filter((x) => !x.isReturnLeg && x.stops.length >= 3).sort((a, b) => b.stops.length - a.stops.length)[0]; return d ? d.id : null`)
    debe(Boolean(diaId), 'buscar', 'hay un día con tres paradas o más')
    await ev(`const id = ${JSON.stringify(diaId)}; R.useRouteStore.setState((s) => ({ route: { ...s.route, days: s.route.days.map((d) => (d.id === id ? { ...d, city: 'Ostia' } : d)) } })); return 1`)
    await app.esp(800)
    await app.evaluar(`(() => { const e = document.querySelector('[data-day-id="' + ${JSON.stringify(diaId)} + '"] > div[role="button"]'); e?.scrollIntoView({ block: 'center' }); e?.click(); return Boolean(e) })()`)
    await app.esp(2000)
    const abrirMas = await app.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Añadir parada/.test(x.textContent || '')); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()`)
    debe(abrirMas === true, 'buscar', 'hay un «Añadir parada» en DÍAS')
    await app.esp(2500)
    await app.escribir('input[placeholder^="Buscar lugares"]', 'coliseo')
    const sale = await app.hasta(`document.querySelectorAll('[data-sitio-nuestro]').length > 0 && Boolean(document.querySelector('[data-otros-sitios]'))`, { segundos: 25 })
    const info = await app.evaluar(`(() => {
      const nuestros = Array.from(document.querySelectorAll('[data-sitio-nuestro]'))
      const otros = document.querySelector('[data-otros-sitios]')
      const filasMapa = otros ? Array.from(otros.parentElement.children).filter((x) => x !== otros && !x.hasAttribute('data-sitio-nuestro') && x.tagName === 'BUTTON') : []
      const pos = (a, b) => a && b ? Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) : false
      return {
        nuestros: nuestros.map((n) => n.getAttribute('data-sitio-nuestro')),
        primeroLinea: nuestros[0]?.querySelector('[data-sitio-nuestro-linea]')?.textContent ?? null,
        primeroHistoria: nuestros[0]?.querySelector('[data-sitio-nuestro-historia]')?.textContent ?? null,
        primeroFoto: Boolean(nuestros[0]?.querySelector('img')),
        titulo: otros?.textContent ?? null,
        nuestroAntesDeOtros: pos(nuestros[nuestros.length - 1], otros),
        mapa: filasMapa.map((f) => (f.innerText || '').replace(/\\s+/g, ' ').slice(0, 60)),
      }
    })()`)
    debe(sale, 'buscar', `«coliseo» saca el nuestro y debajo «Otros sitios» (${JSON.stringify(info)})`)
    debe(info.nuestros[0] === 'Coliseo', 'buscar', `el primero es el Coliseo nuestro (${info.nuestros})`)
    debe(info.titulo === 'Otros sitios', 'buscar', `el título de lo del mapa es «Otros sitios» (${info.titulo})`)
    debe(info.nuestroAntesDeOtros === true, 'buscar', 'nuestros sitios, ENCIMA de «Otros sitios»')
    debe(/\d{1,2}:\d{2}/.test(info.primeroLinea ?? '') && /entrada|libre/i.test(info.primeroLinea ?? ''), 'buscar', `el nuestro trae su horario y si lleva entrada (${info.primeroLinea})`)
    debe(Boolean(info.primeroHistoria && info.primeroHistoria.length > 20), 'buscar', `el nuestro trae su historia (${info.primeroHistoria?.slice(0, 50)})`)
    debe(info.mapa.some((t) => /Coliseo Pizza/.test(t)), 'buscar', `lo del mapa sale debajo (${info.mapa.join(' | ')})`)
    debe(!info.mapa.some((t) => /^Colosseo\b/.test(t)), 'buscar', 'el «Colosseo» del mapa, que es el mismo sitio, no se repite')
    await app.captura(jpg('anadir_parada_coliseo')).catch(() => {})
    // Se puede añadir el nuestro: tocarlo y [Añadir].
    const antesN = await ev(`return route().days.find((d) => d.id === ${JSON.stringify(diaId)}).stops.length`)
    await app.evaluar(`document.querySelector('[data-sitio-nuestro="Coliseo"] button')?.click()`)
    await app.esp(700)
    const anadido = await app.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Añadir .*→$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
    await app.esp(1800)
    const despues = await ev(`const d = route().days.find((d) => d.id === ${JSON.stringify(diaId)}); return { n: d.stops.length, coliseo: d.stops.filter((s) => s.name === 'Coliseo').map((s) => ({ hours: s.hours ?? null, ticket: (s.ticketInfo ?? []).length })) }`)
    debe(anadido === true && despues.n === antesN + 1, 'buscar', `el Coliseo nuestro se añade al día (${antesN} → ${despues.n})`)
    debe(despues.coliseo.length >= 1 && Boolean(despues.coliseo[despues.coliseo.length - 1].hours), 'buscar', `y entra con su horario (${JSON.stringify(despues.coliseo)})`)
    await ev(`const id = ${JSON.stringify(diaId)}; R.useRouteStore.setState((s) => ({ route: { ...s.route, days: s.route.days.map((d) => (d.id === id ? { ...d, city: 'Roma' } : d)) } })); return 1`)

    // — Una entrada, dos paradas —
    console.log('   Una entrada, dos paradas')
    const r = await ev(`
      const P = await import('/src/lib/destinationPlacesApi.ts'); const X = await import('/src/components/route/placeExplorer/PlaceExplorerScreen.tsx')
      const cat = await P.fetchDestinationPlaces(route().destination)
      const lugar = cat.places.find((p) => p.name === 'Museos Capitolinos')
      const dias = route().days.filter((x) => !x.isReturnLeg && B.dateOfDay(route(), x))
      const d1 = dias[0], d2 = dias[1]
      const s1 = X.stopFromPlace(lugar, '')
      st().addStop(d1.id, s1)
      st().addReservation({ id: 'res-dup-10s5', kind: 'entrada', refId: 'Museos Capitolinos', name: 'Museos Capitolinos', placeNames: ['Museos Capitolinos'], dateIso: B.dateOfDay(route(), d1), dayNumber: null, time: '15:00' }, null, null)
      const antes = route().days.flatMap((d) => d.stops).filter((s) => s.name === 'Museos Capitolinos').map((s) => ({ marcado: Boolean(s.reservedId) }))
      const s2 = X.stopFromPlace(lugar, '')
      st().addStop(d2.id, s2)
      return { d1: d1.id, d2: d2.id, s1: s1.id, s2: s2.id, antes }`)
    await app.esp(1500)
    const dup = await ev(`
      const todas = route().days.flatMap((d) => d.stops.map((s) => ({ d: d.id, id: s.id, name: s.name, reservedId: s.reservedId ?? null, time: s.time }))).filter((s) => s.name === 'Museos Capitolinos')
      const filas = B.buildEntradasBloque(route(), { arriba: [], mas: [] }, [], st().reservations, ['Museos Capitolinos']).enRuta.filter((f) => f.name === 'Museos Capitolinos')
      return { todas, filas: filas.map((f) => ({ clave: f.clave, dia: f.day?.id ?? null, reservada: Boolean(f.reservation) })) }`)
    debe(dup.todas.length === 2, 'dos', `el sitio con entrada está dos veces en la ruta, se deja añadir (${dup.todas.length})`)
    debe(dup.todas.every((s) => s.reservedId === 'res-dup-10s5'), 'dos', `la entrada sale reservada en las DOS paradas (${JSON.stringify(dup.todas)})`)
    debe(dup.filas.length === 2 && dup.filas.every((f) => f.reservada), 'dos', `y en las dos filas de RESERVAS (${JSON.stringify(dup.filas)})`)
    // En la pantalla de RESERVAS salen las dos.
    await ev(`R.useRouteStore.getState().setMode('bookings'); return 1`)
    await app.esp(1800)
    await app.evaluar(`(() => { const b = document.querySelector('[data-blk="entradas"]'); if (b && b.children.length < 2) b.firstElementChild?.click(); return true })()`)
    await app.esp(1200)
    const txt = await app.evaluar(`(document.querySelector('[data-blk="entradas"]')?.innerText ?? '').replace(/\\s+/g, ' ')`)
    debe((txt.match(/Museos Capitolinos/g) ?? []).length >= 2, 'dos', `RESERVAS enseña el sitio dos veces (${txt.slice(0, 160)})`)
    await app.captura(jpg('entrada_dos_veces')).catch(() => {})
    // Quitar solo una «de la ruta»: la otra se queda reservada y la entrada no se va fuera de la ruta.
    await app.evaluar(`(async () => { const Q = await import('/src/lib/quitarConEntrada.ts'); const R = await import('/src/store/useRouteStore.ts'); const st = R.useRouteStore.getState(); const d = st.route.days.find((x) => x.id === ${JSON.stringify(r.d2)}); const p = d.stops.find((x) => x.name === 'Museos Capitolinos'); await Q.quitarParadaConEntrada(d.id, p, st.reservations[0] && st.reservations.find((x) => x.id === 'res-dup-10s5'), 'solo'); return true })()`)
    await app.esp(1500)
    const tras = await ev(`
      const todas = route().days.flatMap((d) => d.stops).filter((s) => s.name === 'Museos Capitolinos')
      const res = st().reservations.find((x) => x.id === 'res-dup-10s5')
      return { n: todas.length, marcada: todas.every((s) => s.reservedId === 'res-dup-10s5'), fuera: Boolean(res?.fueraDeRuta) }`)
    debe(tras.n === 1 && tras.marcada && tras.fuera === false, 'dos', `quitada una, la otra sigue reservada y la entrada no queda «fuera de la ruta» (${JSON.stringify(tras)})`)

    // — AttractionsFinder (EXPLORAR de un destino sin catálogo propio): también primero lo nuestro y debajo «Otros sitios» —
    console.log('   AttractionsFinder')
    await ev(`R.useRouteStore.setState((s) => ({ route: { ...s.route, days: s.route.days.map((d) => ({ ...d, city: 'Ostia' })) } })); R.useRouteStore.getState().setMode('explore'); return 1`)
    await app.esp(2500)
    const tarjeta = await app.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /atracciones/i.test(x.textContent || '')); if (!b) return false; b.click(); return true })()`)
    await app.esp(1500)
    if (tarjeta) {
      await app.escribir('input[placeholder="Busca un lugar..."]', 'coliseo')
      const ok = await app.hasta(`document.querySelectorAll('[data-sitio-nuestro]').length > 0 && Boolean(document.querySelector('[data-otros-sitios]'))`, { segundos: 25 })
      const primero = await app.evaluar(`document.querySelector('[data-sitio-nuestro]')?.getAttribute('data-sitio-nuestro') ?? null`)
      debe(ok && primero === 'Coliseo', 'finder', `AttractionsFinder: «coliseo» saca el nuestro y debajo «Otros sitios» (${primero})`)
      await app.captura(jpg('buscador_lugares_coliseo')).catch(() => {})
    } else debe(false, 'finder', 'EXPLORAR sin catálogo: no sale la tarjeta de Atracciones (no se ha podido probar AttractionsFinder)')
  } finally {
    app.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
if (fallos.length) {
  for (const f of fallos) console.log(` - [${f.regla}] ${f.texto}`)
  process.exit(1)
}
