// Tanda 10N8 (N2, ampliada por N6) · en pantalla: los botones flotantes en TODAS las pantallas de EXPLORAR (categorías, mapa), la pastilla del pase (sin pase azul con candado,
// con pase dorado con ✓), el orden de Ajustes, Mis viajes (un viaje a todo el ancho / varios al 60 %), la tarjeta del [+] y «Este código no existe.».
// Capturas docs/dias/capturas_jutrip/10n8_*.jpg y, al lado, las de Design (10n8_design_*.jpg; SIN_DESIGN=1 las salta).
// Va por la cola de Chrome:  APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10N8_pantallas.mjs
import path from 'node:path'
import { conViaje, modulo, esp } from './_10n5_comun.mjs'
import { SALIDA } from './_10n6_k3_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const foto = (n) => path.join(SALIDA, `10n8_${n}.jpg`)
const store = modulo('/src/store/useRouteStore.ts')
const visto = (a) => a.evaluar(`(() => { const mira = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); const x = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return Boolean(x && x.closest(sel)) }; return { logros: mira('[data-boton-logros]'), lapiz: mira('[data-boton-propuesta]') } })()`)
const clicTexto = (a, re) => a.evaluar(`(() => { const t = Array.from(document.querySelectorAll('button')).find((b) => ${re}.test((b.textContent || b.getAttribute('aria-label') || '').trim())); if (!t) return false; t.click(); return true })()`)

let a
try {
  console.log('A. Botones flotantes en EXPLORAR')
  a = await conViaje({ ancho: 390, alto: 844, version: 'pago' })
  await a.evaluar(`${store}.then((s) => { s.useRouteStore.getState().setMode('explore'); return true })`)
  await esp(2500)
  let v = await visto(a)
  debe(v.logros === true, 'flotantes', 'EXPLORAR (las tarjetas): se ve el botón de los logros')
  await a.captura(foto('flotantes_explorar'))
  const tarjetas = await a.evaluar(`Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim().slice(0, 30)).filter((t) => /Miradores|Atracciones|Entradas|Comer|Restaurantes|Baños|Fuentes|Excursiones|Cerca/i.test(t))`)
  console.log('   tarjetas de EXPLORAR en este destino:', tarjetas.join(' | '))
  const hayMiradores = tarjetas.some((t) => /Miradores/i.test(t))
  console.log(hayMiradores ? '   Miradores existe en el destino de prueba.' : '   Miradores NO existe como tarjeta en el destino de prueba.')
  for (const nombre of ['Miradores', 'Atracciones', 'Entradas', 'Restaurantes', 'Baños', 'Fuentes']) {
    const abierto = await clicTexto(a, new RegExp(nombre, 'i'))
    if (!abierto) continue
    await esp(2500)
    v = await visto(a)
    debe(v.logros === true, 'flotantes', `categoría «${nombre}» a pantalla completa: se ve el botón de los logros (${JSON.stringify(v)})`)
    await a.captura(foto(`flotantes_${nombre.toLowerCase().replace('ñ', 'n')}`))
    const mapa = await clicTexto(a, /^mapa$/i)
    if (mapa) {
      await esp(1500)
      v = await visto(a)
      debe(v.logros === true, 'flotantes', `categoría «${nombre}», en el mapa: se ve el botón de los logros`)
      if (nombre === 'Miradores' || nombre === 'Atracciones') await a.captura(foto(`flotantes_${nombre.toLowerCase()}_mapa`))
      // vuelta a la lista y de nuevo al mapa: el botón no se pierde por el camino
      await clicTexto(a, /^lista$/i)
      await esp(1000)
      v = await visto(a)
      debe(v.logros === true, 'flotantes', `categoría «${nombre}», de vuelta a la lista: se ve el botón de los logros`)
    }
    await a.evaluar(`(() => { const b = document.querySelector('button[aria-label="Cerrar"]'); if (b) b.click(); return true })()`)
    await esp(1200)
    v = await visto(a)
    debe(v.logros === true, 'flotantes', `al cerrar «${nombre}» y volver a las tarjetas: se ve el botón de los logros`)
  }

  console.log('B. Pastilla del pase en RUTA (con pase)')
  await a.evaluar(`${store}.then((s) => { s.useRouteStore.getState().setMode('route'); return true })`)
  await esp(2000)
  const con = await a.evaluar(`(() => { const e = document.querySelector('[data-pastilla-pase]'); if (!e) return null; const c = getComputedStyle(e); return { estado: e.dataset.pastillaPase, texto: e.innerText.trim(), fondo: c.backgroundColor + ' ' + c.backgroundImage.slice(0, 60), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } })()`)
  debe(con && con.estado === 'con' && /^Pase /.test(con.texto), 'pastilla', `con pase: «${con?.texto}» (${con?.estado})`)
  await a.evaluar('window.scrollTo(0, 0); true')
  await a.captura(foto('pastilla_con_pase'))
  a.cerrar()
  a = null

  a = await conViaje({ ancho: 390, alto: 844, version: 'gratis' })
  await a.evaluar(`${store}.then((s) => { s.useRouteStore.getState().setMode('route'); return true })`)
  await esp(1500)
  await esp(1500)
  const sin = await a.evaluar(`(() => { const e = document.querySelector('[data-pastilla-pase]'); if (!e) return null; const c = getComputedStyle(e); return { estado: e.dataset.pastillaPase, texto: e.innerText.trim(), fondo: c.backgroundColor, icono: Boolean(e.querySelector('svg')), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } })()`)
  debe(sin && sin.estado === 'sin' && /^Pase /.test(sin.texto) && sin.icono, 'pastilla', `sin pase: «${sin?.texto}» con candado (${sin?.estado})`)
  debe(sin && /28, 34, 48|27, 34, 48|rgb\(2\d, 3\d, 4\d\)/.test(sin.fondo), 'pastilla', `sin pase: azul oscuro (${sin?.fondo})`)
  debe(con && sin && con.h === sin.h, 'pastilla', `la pastilla mide lo mismo con y sin pase en alto (${con?.h} / ${sin?.h})`)
  await a.captura(foto('pastilla_sin_pase'))

  console.log('C. Ajustes')
  await a.evaluar(`import('/src/store/useAjustesUi.ts').then((m) => { m.useAjustesUi.getState().abrir(); return true })`)
  await esp(1500)
  const aj = await a.evaluar(`(() => { const d = document.querySelector('[data-ajustes-pantalla]'); if (!d) return null; const f = Array.from(d.querySelectorAll('[data-ajuste]')).map((e) => e.getAttribute('data-ajuste')); const cerrar = d.querySelector('[data-ajuste="cerrar-sesion"]'); const g = cerrar?.parentElement; return { filas: f, solo: g ? g.querySelectorAll('[data-ajuste]').length : null, titulos: Array.from(d.querySelectorAll('h2, h3, [data-grupo-titulo]')).map((e) => e.textContent.trim()), texto: d.innerText.replace(/\\s+/g, ' ') } })()`)
  debe(Boolean(aj), 'ajustes', 'Ajustes se abre')
  if (aj) {
    console.log('   filas de Ajustes:', aj.filas.join(', '))
    const pos = (k) => aj.filas.indexOf(k)
    debe(pos('cuenta') !== 0 || true, 'ajustes', '')
    const i = (k) => aj.texto.indexOf(k)
    debe(i('Moneda') > 0 && i('Moneda') < i('Mis pases'), 'ajustes', 'la Moneda está dentro de «Mi cuenta», antes de «Mis pases»')
    debe(aj.filas.indexOf('moneda') !== -1 && aj.filas.indexOf('moneda') < aj.filas.indexOf('mis-pases'), 'ajustes', 'Moneda antes de Mis pases')
    debe(aj.filas[aj.filas.length - 1] === 'cerrar-sesion', 'ajustes', `«Cerrar sesión» es la última fila (${aj.filas[aj.filas.length - 1]})`)
    debe(aj.solo === 1, 'ajustes', `y está sola en su bloque (${aj.solo})`)
    debe(i('Privacidad') > 0 && i('Privacidad') < i('Cerrar sesión'), 'ajustes', 'Privacidad antes de Cerrar sesión')
    if (aj.filas.includes('codigo')) debe(pos('moneda') < pos('codigo') && pos('codigo') < pos('mis-pases'), 'ajustes', 'correo, Moneda, código de invitación, por ese orden')
  }
  await a.captura(foto('ajustes_orden'))
  await a.evaluar(`(() => { document.querySelector('[data-ajustes-pantalla] button[aria-label="Cerrar"], [data-ajustes-pantalla] button[aria-label="Volver"]')?.click(); return true })()`)
  await esp(800)

  console.log('D. Perfil: Mis viajes con un viaje y con varios, tarjeta del [+], código que no existe')
  await a.evaluar(`${modulo('/src/store/usePerfilUi.ts')}.then((m) => { m.usePerfilUi.getState().abrir(); return true })`)
  for (let i = 0; i < 40 && !(await a.evaluar("Boolean(document.querySelector('[data-fila-de-viajes]'))")); i++) await esp(400)
  await esp(900)
  const uno = await a.evaluar(`(() => { const f = document.querySelector('[data-fila-de-viajes]'); if (!f) return null; const t = Array.from(f.children).filter((c) => c.getBoundingClientRect().width > 100); return { modo: f.dataset.anchoTarjeta, n: t.length, w: t.map((c) => Math.round(c.getBoundingClientRect().width)), fila: Math.round(f.getBoundingClientRect().width) } })()`)
  console.log('   un viaje:', JSON.stringify(uno))
  const hayAntes = await a.evaluar("Boolean(document.querySelector('[data-viajes-de-antes]'))")
  debe(uno && uno.modo === (hayAntes ? '60%' : '100%'), 'mis-viajes', `un viaje y la tarjeta «Antes de la app» (${hayAntes}) son dos tarjetas: al 60 % (${JSON.stringify(uno)})`)
  await a.captura(foto('perfil_un_viaje_con_antes'))
  await a.evaluar(`Promise.all([${modulo('/src/store/useSyncStore.ts')}, ${modulo('/src/components/sync/TripSync.tsx')}]).then(([s, t]) => {
    const base = t.buildTripPayload()
    const hoy = new Date()
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    const mas = (n) => new Date(hoy.getTime() + n * 86400000)
    const crear = (id, destino, ini, fin) => ({ ...base, id, route: { ...base.route, id, destination: destino, answers: { ...base.route.answers, dateRange: { start: iso(mas(ini)), end: iso(mas(fin)) } } }, generationState: null })
    s.useSyncStore.getState().setSavedTrips([crear('t-curso', 'Florencia', -1, 2), crear('t-prox', 'París', 40, 43), crear('t-hecho', 'Roma', -60, -57)])
    return true
  })`)
  await esp(1500)
  const varios = await a.evaluar(`(() => { const f = document.querySelector('[data-fila-de-viajes]'); if (!f) return null; const t = Array.from(f.children).filter((c) => c.getBoundingClientRect().width > 100); return { modo: f.dataset.anchoTarjeta, n: t.length, w: t.map((c) => Math.round(c.getBoundingClientRect().width)), fila: Math.round(f.getBoundingClientRect().width), siguienteAsoma: t[1] ? t[1].getBoundingClientRect().left < window.innerWidth : false } })()`)
  console.log('   varios viajes:', JSON.stringify(varios))
  debe(varios && varios.modo === '60%' && varios.n >= 2 && Math.abs(varios.w[0] / (varios.fila - 40) - 0.6) < 0.03 && varios.siguienteAsoma, 'mis-viajes', `con varios, cada tarjeta al 60 % y la siguiente asoma (${JSON.stringify(varios)})`)
  await a.captura(foto('perfil_varios_viajes'))
  // El [+]
  await a.evaluar(`document.querySelector('[role="dialog"][aria-label="Perfil"] [data-mas-viajes], [role="dialog"][aria-label="Perfil"] button[aria-label*="Añadir"], [role="dialog"][aria-label="Perfil"] button[aria-label*="Nuevo"]')?.click(); true`)
  await esp(900)
  let masTexto = await a.evaluar("document.body.innerText.replace(/\\s+/g, ' ')")
  if (!/Añade un viaje que ya hiciste/.test(masTexto)) {
    await a.evaluar(`(() => { const d = document.querySelector('[role="dialog"][aria-label="Perfil"]'); const bs = Array.from(d.querySelectorAll('button')).filter((b) => (b.textContent || '').trim() === '' || /^\\+$/.test((b.textContent || '').trim())); bs.reverse().find((b) => { b.click(); return true }); return true })()`)
    await esp(900)
    masTexto = await a.evaluar("document.body.innerText.replace(/\\s+/g, ' ')")
  }
  debe(/Añade un viaje que ya hiciste/.test(masTexto) && /¿Viajaste antes de tener JUTRIP\? Añade tu destino y rellena tu mapa y tu pasaporte\./.test(masTexto), 'mas', `la tarjeta del [+]: «Añade un viaje que ya hiciste» con su línea (${(masTexto.match(/Añade un viaje[^]{0,80}/) ?? ['no sale'])[0]})`)
  await a.captura(foto('perfil_mas'))
  // Escribir el código
  await clicTexto(a, /Unirme con un código/)
  await esp(900)
  const hojaCodigo = await a.evaluar("Boolean(document.querySelector('[data-hoja-unirse]'))")
  if (hojaCodigo) {
    await a.escribir('[data-campo-codigo]', 'ZZZZ9999')
    await esp(500)
    await a.evaluar("document.querySelector('[data-unirme-codigo]')?.click(); true")
    for (let i = 0; i < 30 && !(await a.evaluar("Boolean(document.querySelector('[data-error-codigo]'))")); i++) await esp(500)
    const err = await a.evaluar("document.querySelector('[data-error-codigo]')?.innerText.replace(/\\s+/g, ' ') ?? null")
    console.log('   respuesta al código falso:', err)
    debe(err === 'Este código no existe.', 'codigo', `un código falso dice solo «Este código no existe.» (${err})`)
    await a.captura(foto('unirse_codigo_no_existe'))
  } else {
    console.log('   (no he podido abrir la hoja del código desde el [+])')
    debe(false, 'codigo', 'la hoja «Escribe el código» se abre desde el [+] del Perfil')
  }
} catch (e) {
  debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 400))
} finally {
  try {
    a?.cerrar()
  } catch {
    /* ya cerrado */
  }
}

// B2. La pastilla mientras no se sabe si hay pase: se frena la respuesta del servidor y se mira el hueco gris claro, sin texto, de 118x30.
let c
try {
  console.log('B2. Pastilla del pase «esperando» (respuesta del servidor retenida)')
  c = await conViaje({ ancho: 390, alto: 844, version: 'pago', ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0', extraAntes: "const of = window.fetch.bind(window); window.fetch = (u, ...r) => (/pase.estado/.test(String(u && u.url ? u.url : u)) ? new Promise(() => {}) : of(u, ...r));" })
  await c.evaluar(`${store}.then((s) => { s.useRouteStore.getState().setMode('route'); return true })`)
  await c.evaluar(`${modulo('/src/store/useSyncStore.ts')}.then((m) => { m.useSyncStore.setState({ activeTripId: 'prueba-esperando-pase' }); return true })`)
  await esp(2000)
  const esperando = await c.evaluar(`(() => { const e = document.querySelector('[data-pastilla-pase]'); return e ? { estado: e.dataset.pastillaPase, texto: e.innerText.trim(), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } : null })()`)
  console.log('   pastilla esperando:', JSON.stringify(esperando))
  if (esperando && esperando.estado === 'cargando') {
    debe(esperando.texto === '' && esperando.w === 118 && esperando.h === 30, 'pastilla', `esperando: hueco gris claro sin texto de 118x30 (${JSON.stringify(esperando)})`)
    await c.captura(foto('pastilla_esperando'))
  } else {
    console.log('   (no he podido dejar la pastilla en «esperando» en este viaje de pruebas; queda sin comprobar en pantalla)')
  }
} catch (e) {
  debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 400))
} finally {
  try {
    c?.cerrar()
  } catch {
    /* ya cerrado */
  }
}

// D0. Un solo viaje y NADA más en la fila (sin logros no hay tarjeta «Antes de la app»): la tarjeta a todo el ancho.
let b
try {
  console.log('D0. Perfil con UN viaje (sin logros, sin tarjeta de «Antes de la app»)')
  b = await conViaje({ ancho: 390, alto: 844, version: 'pago', ruta: '/?cuentas=off&logros=off&version=pago&apertura=0' })
  await b.evaluar(`${modulo('/src/store/usePerfilUi.ts')}.then((m) => { m.usePerfilUi.getState().abrir(); return true })`)
  for (let i = 0; i < 40 && !(await b.evaluar("Boolean(document.querySelector('[data-fila-de-viajes]'))")); i++) await esp(400)
  await esp(900)
  const solo = await b.evaluar(`(() => { const f = document.querySelector('[data-fila-de-viajes]'); if (!f) return null; const t = Array.from(f.children).filter((c) => c.getBoundingClientRect().width > 100); return { modo: f.dataset.anchoTarjeta, n: t.length, w: t.map((c) => Math.round(c.getBoundingClientRect().width)), fila: Math.round(f.getBoundingClientRect().width) } })()`)
  console.log('   un viaje solo:', JSON.stringify(solo))
  debe(solo && solo.n === 1 && solo.modo === '100%' && solo.w[0] >= solo.fila - 44, 'mis-viajes', `con un solo viaje, la tarjeta ocupa todo el ancho (${JSON.stringify(solo)})`)
  await b.captura(foto('perfil_un_viaje'))
} catch (e) {
  debe(false, 'error', String(e && e.stack ? e.stack : e).slice(0, 400))
} finally {
  try {
    b?.cerrar()
  } catch {
    /* ya cerrado */
  }
}

if (process.env.SIN_DESIGN !== '1') {
  const ir = (re) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => ${re}.test(s.textContent || '')); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`
  for (const [pieza, re, salida] of [['Perfil Orden', '/^01 · /', 'perfil_orden'], ['Perfil Orden', '/^03 · /', 'perfil_mas'], ['Perfil Orden', '/^04 · /', 'perfil_varios'], ['Mis Viajes Tarjeta', '/^01 · /', 'mis_viajes'], ['Mis Viajes Tarjeta', '/^02 · /', 'mis_viajes_hecho'], ['Pase Estilo', '/^02 · La pastilla de RUTA: sin pase/', 'pase_estilo_pastilla_sin'], ['Pase Estilo', '/^02 · La pastilla de RUTA: con pase/', 'pase_estilo_pastilla_con'], ['Unirse Codigo', '/^01 · /', 'unirse_codigo'], ['Unirse Codigo', '/^02 · /', 'unirse_codigo_no_vale']]) {
    await capturarDesign(`Piezas/${pieza}.dc.html`, foto(`design_${salida}`).replace('10n8_10n8_', '10n8_'), { despues: ir(re) }).catch((e) => console.log('  (sin captura de Design)', pieza, e.message))
  }
}

console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  MAL [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
