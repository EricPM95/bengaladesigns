// La prueba de la Tanda 10N5, apartado 4: EL PERFIL CON OTRO ORDEN (`Piezas/Perfil Orden` y `Piezas/Mis Viajes Tarjeta` de Design) y que se abra al momento.
//   APP_URL=http://localhost:5182 API_URL=http://localhost:8852 node scripts/destino/pruebaTanda10N5_perfil.mjs
// 1. El código (el orden, el [+], la precarga, lo guardado del Perfil, sin la palabra «PERFIL»).
// 2. La pantalla (móvil de 390 px) con los logros encendidos (modo de pruebas): la cabecera con la EXP en pequeño, «Mis viajes» de lado con «Ver todos», la vitrina y el pasaporte igual, el sorteo abajo del todo,
//    el [+] flotante con sus tres tarjetas, «Ver todos» por grupos, y que se abre AL MOMENTO (lo último que se vio, guardado; sin esqueleto ni parpadeo cuando llegan los datos nuevos).
// 3. Con los logros apagados: el mismo perfil sin EXP, vitrina ni sorteo.
// Capturas en docs/dias/capturas_jutrip/10n5_perfil_*.jpg, cada una con la de Design al lado (10n5_perfil_*_design.jpg).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarPantallaDeDesign } from './_10n5_capturasDesign.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const CAPTURAS = 'docs/dias/capturas_jutrip'
const conDesign = process.env.SIN_DESIGN !== '1'

/* ─────────────────────────── 1. El código ─────────────────────────── */
console.log('1. El código')
{
  const sheet = sinComentarios(leer('src/components/layout/PerfilSheet.tsx'))
  debe(!/>\s*Perfil\s*<\/h1>/.test(sheet) && !/<h1/.test(sheet), 'PERFIL', 'fuera la palabra «PERFIL» de arriba a la izquierda')
  debe(/data-ajustes/.test(sheet) && /Cerrar el Perfil/.test(sheet), 'arriba', 'arriba quedan los ajustes y la ✕')
  debe(/data-anadir-viaje/.test(sheet) && /width: 64, height: 64/.test(sheet) && !/Nuevo viaje\s*<\/button>/.test(sheet), '[+]', 'el [+] flotante de 64 px sustituye al botón «Nuevo viaje»')
  debe(/¿Qué quieres hacer\?/.test(sheet) && /Crear un viaje nuevo/.test(sheet) && /Elige destino y fechas/.test(sheet) && /Unirme con un código/.test(sheet) && /Añade un viaje que ya hiciste/.test(sheet) && /Añade tu destino y rellena tu mapa y tu pasaporte/.test(sheet), '[+]', 'la hoja del [+] lleva las tres tarjetas con sus líneas')
  debe(/HojaOpciones/.test(sheet) && /OpcionTarjeta/.test(sheet), '[+]', 'la hoja es la de tarjetas de la app (HojaOpciones)')
  debe(/requestIdleCallback/.test(sheet) && /precargarPerfil/.test(sheet) && /precalentarPerfil/.test(sheet), 'rápido', 'el código del Perfil se baja en reposo (requestIdleCallback) y se piden sus datos')
  debe(/onPointerDown=\{precargarPerfil\}/.test(sinComentarios(leer('src/components/layout/Header.tsx'))), 'rápido', 'al empezar a tocar el círculo del Perfil se empuja la bajada')
  const cuerpo = sinComentarios(leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx'))
  const iCab = cuerpo.indexOf('data-cabecera-con-marco')
  const iViajes = cuerpo.indexOf('{misViajes}', iCab)
  const iVitrina = cuerpo.indexOf('data-vitrina-del-perfil')
  const iPasaporte = cuerpo.indexOf('<TarjetaPasaporte pasaporte={perfil.pasaporte}')
  const iBillete = cuerpo.indexOf('<BilleteDelSorteo')
  debe(iCab > 0 && iCab < iViajes && iViajes < iVitrina && iVitrina < iPasaporte && iPasaporte < iBillete, 'orden', 'el orden en el código: cabecera, Mis viajes, vitrina, pasaporte y sorteo')
  debe(/leerPerfilGuardado/.test(cuerpo) && /guardarPerfil/.test(cuerpo) && /mismoPerfil/.test(cuerpo), 'rápido', 'lo último que se vio se guarda y se enseña al instante; lo nuevo solo cambia si cambia')
  debe(/Ver todos \(\{viajes\.length\}\)/.test(cuerpo) && /scrollSnapType: 'x mandatory'/.test(cuerpo), 'viajes', '«Ver todos (N)» y la fila con deslizar de lado')
  const tarjeta = sinComentarios(leer('src/components/logros/pantallas/perfil/TarjetaDeViaje.tsx'))
  debe(/width: ancho/.test(tarjeta) && /height: 142/.test(tarjeta) && /borderRadius: 26/.test(tarjeta) && /Abrir este viaje/.test(tarjeta), 'tarjeta', 'la tarjeta: ancho por modo (10N8: 100 % o 60 %), portada de 142, radio 26 y «Abrir este viaje»')
  debe(!/Sin fotos|textoDeFotos|Cambiar portada\s*<\/button>|Cambiar portada\n/.test(tarjeta.replace(/aria-label=\{`Cambiar la portada[^`]*`\}/, '')), 'tarjeta', 'sin pastilla de fotos y sin el texto «Cambiar portada» (solo el icono de la cámara)')
  debe(!/marginTop: 52|\+ 52/.test(cuerpo), 'orden', 'los 70 px de aire de la 10N3 ya no están')
  const lista = sinComentarios(leer('src/components/logros/pantallas/perfil/ListaDeViajes.tsx'))
  debe(/EN CURSO/.test(lista) && /PRÓXIMOS/.test(lista) && /YA HECHOS/.test(lista) && /ANTES DE LA APP/.test(lista), 'ver todos', '«Ver todos» tiene los 4 grupos de Design')
  const cache = sinComentarios(leer('src/lib/perfilEnCache.ts'))
  debe(/localStorage/.test(cache) && /uidDeLaSesion/.test(cache), 'rápido', 'lo guardado va por cuenta (uid) y se confirma al abrir')
  debe(/perfil:ultimo/.test(sinComentarios(leer('src/lib/cuentas.ts'))), 'rápido', 'al cerrar sesión se borra lo guardado del Perfil')
}

/* ─────────────────────────── 2. La pantalla, con logros ─────────────────────────── */
console.log('2. La pantalla con los logros')
const preparar = async (ruta) => {
  const app = await abrirApp('http://localhost:5173', { ancho: 390, alto: 844, ruta })
  const ev = (js) => app.evaluar(js)
  const esperar = async (js, intentos = 40, ms = 400) => {
    for (let i = 0; i < intentos; i++) {
      if (await ev(js).catch(() => false)) return true
      await app.esp(ms)
    }
    return false
  }
  for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  // (El servidor de desarrollo sirve los módulos cambiados con «?t=…»: se pide la dirección con la que los cargó la app.)
  await ev("window.__imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; true")
  await ev('window.__rutaPrueba().then(() => true)')
  await esperar("__imp('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))", 90, 1000)
  await app.esp(3000)
  for (let i = 0; i < 6; i++) {
    const hecho = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await app.esp(700)
  }
  await ev("window.__miPerfil.getState().poner({ nombre: 'VIAJES' }); true")
  return { app, ev, esperar }
}
const abrirPerfil = async ({ ev, esperar, app }, ancla = '[data-fila-de-viajes]') => {
  await ev("__imp('/src/store/usePerfilUi.ts').then((m) => { m.usePerfilUi.getState().abrir(); return true })")
  await esperar(`Boolean(document.querySelector('${ancla}'))`, 60, 300)
  await app.esp(900)
}
const T = (ev, sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); return e ? e.innerText.split(String.fromCharCode(10)).join(' | ') : null })()`)

{
  const { app, ev, esperar } = await preparar('/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0')
  try {
    // Varios viajes (uno en curso, uno próximo, uno ya hecho), con el motor de siempre: copias del viaje de pruebas con otras fechas.
    await ev(`Promise.all([__imp('/src/store/useRouteStore.ts'), __imp('/src/store/useSyncStore.ts'), __imp('/src/components/sync/TripSync.tsx')]).then(([r, s, t]) => {
      const base = t.buildTripPayload()
      const hoy = new Date()
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      const mas = (n) => new Date(hoy.getTime() + n * 86400000)
      const crear = (id, destino, ini, fin) => ({ ...base, id, route: { ...base.route, id, destination: destino, answers: { ...base.route.answers, dateRange: { start: iso(mas(ini)), end: iso(mas(fin)) } } }, generationState: null })
      s.useSyncStore.getState().setSavedTrips([crear('t-curso', 'Florencia', -1, 2), crear('t-prox', 'París', 40, 43), crear('t-hecho', 'Roma', -60, -57)])
      return true
    })`)
    await abrirPerfil({ app, ev, esperar }, '[data-nivel-y-rango]')

    // 2a. El orden de arriba abajo.
    const o = await ev(`(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
      const y = (sel) => { const e = d.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().top) : null }
      const texto = d.innerText
      const ajustes = d.querySelector('[data-ajustes]').getBoundingClientRect()
      const cerrar = d.querySelector('[aria-label="Cerrar el Perfil"]').getBoundingClientRect()
      return {
        texto: texto.split(String.fromCharCode(10)).join(' | '),
        cabecera: y('[data-cabecera-con-marco]'), exp: y('[data-exp-pequena]'), viajes: y('[data-mis-viajes]'), vitrina: y('[data-vitrina-del-perfil]'), pasaporte: y('[data-abrir-pasaporte]'), billete: y('[data-billete-sorteo]'),
        palabraPerfil: /^PERFIL$/im.test(texto),
        ajustes: { x: Math.round(ajustes.right), y: Math.round(ajustes.top), w: Math.round(ajustes.width) }, cerrar: { x: Math.round(cerrar.right), y: Math.round(cerrar.top), w: Math.round(cerrar.width) },
        hola: d.querySelector('[data-cabecera-con-marco] h2')?.innerText,
        nivel: d.querySelector('[data-nivel-y-rango]')?.innerText,
        expLinea: d.querySelector('[data-exp-linea]')?.innerText,
        ver: d.querySelector('[data-numero-de-viajes]')?.innerText,
        tarjetas: Array.from(d.querySelectorAll('[data-tarjeta-de-viaje]')).map((c) => ({ id: c.dataset.tarjetaDeViaje, etiqueta: c.querySelector('[data-etiqueta-texto]').innerText, destino: c.querySelector('[data-fechas-del-viaje]').previousElementSibling.innerText, fechas: c.querySelector('[data-fechas-del-viaje]').innerText, ancho: Math.round(c.getBoundingClientRect().width), x: Math.round(c.getBoundingClientRect().left), camara: c.querySelector('[data-cambiar-portada]')?.innerText, boton: c.querySelector('[data-abrir-este-viaje]')?.innerText })),
        fila: (() => { const f = d.querySelector('[data-fila-de-viajes]'); return { desborda: f.scrollWidth > f.clientWidth, overflow: getComputedStyle(f).overflowX } })(),
        antes: d.querySelector('[data-viajes-de-antes]')?.innerText.split(String.fromCharCode(10)).join(' | '),
        mas: (() => { const b = d.querySelector('[data-anadir-viaje]').getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), cx: Math.round(b.left + b.width / 2), bajo: Math.round(window.innerHeight - b.bottom) } })(),
        horizontal: d.scrollWidth <= d.clientWidth + 1,
      }
    })()`)
    debe(!o.palabraPerfil, 'PERFIL', 'no sale la palabra «PERFIL»')
    debe(o.ajustes.w === 40 && o.cerrar.w === 40 && o.ajustes.x > 300 && o.cerrar.x > 360 && o.ajustes.y < 40 && o.cerrar.y < 40, 'arriba', `solo los ajustes y la ✕ arriba a la derecha (ajustes ${JSON.stringify(o.ajustes)}, ✕ ${JSON.stringify(o.cerrar)})`)
    debe(o.hola === 'Hola, Viajes', 'nombre', `«Hola, Viajes» con la primera en mayúscula (sale «${o.hola}»)`)
    debe(/^Nivel \d+ · \S+/.test(o.nivel ?? ''), 'cabecera', `«${o.nivel}» (nivel y rango de verdad)`)
    debe(/^[\d.]+ \/ [\d.]+ · Te faltan [\d.]+ para el nivel \d+$/.test(o.expLinea ?? ''), 'EXP', `la EXP en pequeño: «${o.expLinea}»`)
    debe(o.cabecera < o.exp && o.exp < o.viajes && o.viajes < o.vitrina && o.vitrina < o.pasaporte && o.pasaporte < o.billete, 'orden', `orden de arriba abajo: cabecera ${o.cabecera} < EXP ${o.exp} < Mis viajes ${o.viajes} < vitrina ${o.vitrina} < pasaporte ${o.pasaporte} < sorteo ${o.billete}`)
    debe(o.mas.w === 64 && o.mas.h === 64 && Math.abs(o.mas.cx - 195) <= 1 && o.mas.bajo >= 26 && o.mas.bajo <= 30, '[+]', `el [+] mide 64, va en medio y a 28 del borde de abajo (${JSON.stringify(o.mas)})`)
    debe(o.fila.desborda && o.fila.overflow === 'auto', 'viajes', '«Mis viajes» se desliza de lado')
    debe(o.tarjetas.length === 4 && o.tarjetas.every((t) => t.ancho === 210), 'viajes', `4 tarjetas de 210 de ancho (10N8: con varios viajes, el 60 %) (las 3 de la prueba y el viaje abierto; salen ${o.tarjetas.length})`)
    debe(o.tarjetas[0]?.etiqueta === 'En curso' && o.tarjetas[1]?.etiqueta === 'Próximo' && o.tarjetas[2]?.etiqueta === 'Ya hecho', 'viajes', `el en curso primero, luego el próximo y luego el ya hecho (${o.tarjetas.map((t) => t.etiqueta).join(', ')})`)
    debe(o.tarjetas[0]?.x === 20 && o.tarjetas[1]?.x < 390 && o.tarjetas[1]?.x > 210, 'viajes', 'la siguiente tarjeta asoma por la derecha')
    debe(o.tarjetas.every((t) => /\d+ – \d+ \w+ \d{4} · \d+ días?|\w+ · \d+ días?/.test(t.fechas) && t.boton === 'Abrir este viaje' && t.camara === ''), 'viajes', `cada tarjeta: fechas y días («${o.tarjetas[0]?.fechas}»), «Abrir este viaje» y la cámara sin texto`)
    debe(o.ver === 'Ver todos (4)', 'viajes', `«${o.ver}»`)
    debe(/^Antes de la app \| \d+ países?$/.test(o.antes ?? ''), 'viajes', `«Antes de la app» como una tarjeta más, al final (${o.antes})`)
    debe(!/Sin fotos/.test(o.texto), 'viajes', 'fuera la pastilla «Sin fotos»')
    debe(o.horizontal, 'viajes', 'la pantalla no se desborda a los lados')
    debe(o.vitrina !== null && o.pasaporte !== null && /Mi vitrina/.test(o.texto) && /Mi pasaporte/.test(o.texto), 'vitrina', '«Mi vitrina» y «Mi pasaporte» siguen')
    if (conDesign) await capturarPantallaDeDesign('Piezas/Perfil Orden.dc.html', 0, path.join(CAPTURAS, '10n5_perfil_01_abrir_design.jpg'))
    await app.captura(path.join(CAPTURAS, '10n5_perfil_01_abrir.jpg'), 82)

    // 2b. Entero, hasta abajo (390 x 1330): el sorteo es lo último y el [+] no tapa nada.
    await app.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 1330, deviceScaleFactor: 1, mobile: true })
    await app.esp(900)
    const fin = await ev(`(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
      const r = (s) => d.querySelector(s)?.getBoundingClientRect()
      const billete = r('[data-billete-sorteo]'), mas = r('[data-anadir-viaje]')
      const creditos = Array.from(d.querySelectorAll('button')).find((b) => /^Créditos$/.test(b.innerText.trim()))?.getBoundingClientRect()
      return { billeteFin: Math.round(billete.bottom), masTop: Math.round(mas.top), creditos: creditos ? Math.round(creditos.bottom) : null }
    })()`)
    debe(fin.billeteFin < fin.masTop || fin.creditos < fin.masTop, '[+]', `el [+] no tapa lo último (sorteo acaba en ${fin.billeteFin}, «Créditos» en ${fin.creditos}, el [+] empieza en ${fin.masTop})`)
    if (conDesign) await capturarPantallaDeDesign('Piezas/Perfil Orden.dc.html', 1, path.join(CAPTURAS, '10n5_perfil_02_entero_design.jpg'), { alto: 1330 })
    await app.captura(path.join(CAPTURAS, '10n5_perfil_02_entero.jpg'), 82)
    await app.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await app.esp(500)

    // 2c. El [+] y sus tres tarjetas.
    await ev("document.querySelector('[data-anadir-viaje]').click(); true")
    await esperar("Boolean(document.querySelector('[data-hoja=\"anadir-viaje\"]'))", 20, 250)
    await app.esp(700)
    const hoja = await ev(`(() => {
      const h = document.querySelector('[data-hoja="anadir-viaje"]')
      return { titulo: h.querySelector('[data-hoja-opciones-titulo]').innerText, etiqueta: h.querySelector('[data-hoja-opciones-etiqueta]').innerText, tarjetas: Array.from(h.querySelectorAll('[data-opcion-hoja]')).map((b) => b.querySelector('[data-opcion-titulo]').innerText + ' · ' + b.querySelector('[data-opcion-linea]').innerText) }
    })()`)
    debe(hoja.titulo === '¿Qué quieres hacer?' && /AÑADIR/i.test(hoja.etiqueta), '[+]', `la hoja: «${hoja.etiqueta}» / «${hoja.titulo}»`)
    debe(hoja.tarjetas.join(' || ') === 'Crear un viaje nuevo · Elige destino y fechas || Unirme con un código · El que te ha pasado quien organiza el viaje || Añade un viaje que ya hiciste · ¿Viajaste antes de tener JUTRIP? Añade tu destino y rellena tu mapa y tu pasaporte.', '[+]', `las tres tarjetas, en orden (${hoja.tarjetas.join(' || ')})`)
    if (conDesign) await capturarPantallaDeDesign('Piezas/Perfil Orden.dc.html', 2, path.join(CAPTURAS, '10n5_perfil_03_hoja_mas_design.jpg'))
    await app.captura(path.join(CAPTURAS, '10n5_perfil_03_hoja_mas.jpg'), 82)
    await ev("document.querySelector('[data-hoja=\"anadir-viaje\"] [data-hoja-cerrar]').click(); true")
    await app.esp(500)

    // 2d. «Ver todos».
    await ev("document.querySelector('[data-ver-todos]').click(); true")
    await esperar("Boolean(document.querySelector('[data-lista-de-viajes]'))", 20, 250)
    await app.esp(600)
    const todos = await ev(`(() => {
      const l = document.querySelector('[data-lista-de-viajes]')
      return { titulo: l.querySelector('h2').innerText, grupos: Array.from(l.querySelectorAll('[data-grupo-de-lista]')).map((g) => g.dataset.grupoDeLista + ':' + g.querySelectorAll('button').length), texto: l.innerText.split(String.fromCharCode(10)).join(' | ') }
    })()`)
    debe(todos.titulo === 'Mis viajes' && todos.grupos.join(',') === 'en_curso:1,proximo:1,hecho:2,antes:1', 'ver todos', `la lista por grupos: ${todos.grupos.join(', ')}`)
    debe(/EN CURSO/.test(todos.texto) && /PRÓXIMOS/.test(todos.texto) && /YA HECHOS/.test(todos.texto) && /ANTES DE LA APP/.test(todos.texto), 'ver todos', 'con los títulos de grupo de Design')
    if (conDesign) await capturarPantallaDeDesign('Piezas/Perfil Orden.dc.html', 4, path.join(CAPTURAS, '10n5_perfil_05_ver_todos_design.jpg'))
    await app.captura(path.join(CAPTURAS, '10n5_perfil_05_ver_todos.jpg'), 82)
    await ev("document.querySelector('[data-volver-lista]').click(); true")
    await app.esp(400)
    debe(!(await ev("Boolean(document.querySelector('[data-lista-de-viajes]'))")), 'ver todos', '[‹] vuelve al perfil')

    // 2e. Abrir un viaje desde su tarjeta: el Perfil se cierra y se abre ese viaje.
    await ev("document.querySelector('[data-tarjeta-de-viaje=\"t-prox\"] [data-abrir-este-viaje]').click(); true")
    const abierto = await esperar("__imp('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route?.id === 't-prox')", 20, 300)
    debe(abierto, 'abrir', '«Abrir este viaje» de la tarjeta abre ese viaje y cierra el Perfil')

    // 2f. Que se abra al momento: ya hay lo último guardado; los datos nuevos tardan 4 s y no cambian nada.
    const guardado = await ev("Boolean(window.localStorage.getItem('trazo:perfil:ultimo:v1'))")
    debe(guardado, 'rápido', 'lo último que se vio del Perfil queda guardado en el móvil')
    await ev("window.__retrasoDemo = { '/api/logros/perfil': 4000 }; window.__marcas = { esqueleto: false, t: null }; true")
    await ev(`(() => {
      const t0 = performance.now(); window.__t0 = t0
      new MutationObserver(() => {
        const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
        if (!d) return
        if (d.querySelector('[data-perfil-cargando]')) window.__marcas.esqueleto = true
        if (window.__marcas.t === null && d.querySelector('[data-nivel-y-rango]')) { window.__marcas.t = performance.now() - t0; const h = d.querySelector('[data-cabecera-con-marco] h2'); h.dataset.marca = 'x' }
      }).observe(document.body, { childList: true, subtree: true })
      __imp('/src/store/usePerfilUi.ts').then((m) => m.usePerfilUi.getState().abrir())
      return true
    })()`)
    await esp5(app, 1500)
    const m1 = await ev('window.__marcas')
    debe(m1.t !== null && m1.t < 800, 'rápido', `con el servidor tardando 4 s, el Perfil sale entero en ${m1.t === null ? 'nunca' : Math.round(m1.t) + ' ms'} (lo guardado)`)
    debe(m1.esqueleto === false, 'rápido', 'nunca sale el perfil vacío (el esqueleto) si ya se vio uno')
    await app.esp(4200)
    const marcaSigue = await ev("document.querySelector('[role=\"dialog\"][aria-label=\"Perfil\"] [data-cabecera-con-marco] h2')?.dataset.marca === 'x'")
    debe(marcaSigue, 'rápido', 'al llegar los datos nuevos (iguales) no se repinta nada: sin parpadeo')
    await ev("window.__retrasoDemo = {}; true")
  } finally {
    app.cerrar()
  }
}

/* ─────────────────────────── 3. Con los logros apagados ─────────────────────────── */
console.log('3. Sin logros')
{
  const { app, ev, esperar } = await preparar('/?cuentas=off&logros=off&version=pago&apertura=0')
  try {
    await abrirPerfil({ app, ev, esperar }, '[data-cabecera-sin-logros]')
    const sin = await ev(`(() => {
      const d = document.querySelector('[role="dialog"][aria-label="Perfil"]')
      const y = (sel) => { const e = d.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().top) : null }
      return { texto: d.innerText.split(String.fromCharCode(10)).join(' | '), viajes: y('[data-mis-viajes]'), pasaporte: y('[data-abrir-pasaporte]'), vitrina: Boolean(d.querySelector('[data-vitrina-del-perfil]')), exp: Boolean(d.querySelector('[data-exp-pequena]')), billete: Boolean(d.querySelector('[data-billete-sorteo]')), mas: Boolean(d.querySelector('[data-anadir-viaje]')), tarjetas: d.querySelectorAll('[data-tarjeta-de-viaje]').length, ajustes: Boolean(d.querySelector('[data-ajustes]')) }
    })()`)
    debe(!sin.vitrina && !sin.exp && !sin.billete && !/\bEXP\b|Nivel \d|vitrina|sorteo/i.test(sin.texto), 'sin logros', 'sin EXP, vitrina ni sorteo')
    debe(/Hola, Viajes/.test(sin.texto) && sin.tarjetas >= 1 && sin.mas && sin.ajustes && sin.viajes < sin.pasaporte, 'sin logros', 'con su «Hola», sus viajes (antes que el pasaporte), los ajustes y el [+]')
    await ev("document.querySelector('[data-anadir-viaje]').click(); true")
    await esperar("Boolean(document.querySelector('[data-hoja=\"anadir-viaje\"]'))", 20, 250)
    const tarj = await ev("Array.from(document.querySelectorAll('[data-hoja=\"anadir-viaje\"] [data-opcion-hoja]')).map((b) => b.querySelector('[data-opcion-titulo]').innerText)")
    debe(tarj.join(',') === 'Crear un viaje nuevo,Unirme con un código', 'sin logros', `sin logros, el [+] ofrece crear y unirse (${tarj.join(', ')}); «un viaje que ya hiciste» es del pasaporte de los logros`)
    await app.captura(path.join(CAPTURAS, '10n5_perfil_sin_logros_hoja.jpg'), 82)
    await ev("document.querySelector('[data-hoja=\"anadir-viaje\"] [data-hoja-cerrar]').click(); true")
    await app.esp(400)
    await app.captura(path.join(CAPTURAS, '10n5_perfil_sin_logros.jpg'), 82)
  } finally {
    app.cerrar()
  }
}

async function esp5(app, ms) {
  await app.esp(ms)
}

console.log(`\nLa prueba del perfil con otro orden (10N5): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length === 0 ? 0 : 1)
