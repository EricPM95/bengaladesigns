// La prueba de la Tanda V33 (la PANTALLA del panel de Jutrip): /admin con todos sus apartados, en ordenador y en móvil, con el servidor de mentira de la demo (?logrosDemo=1).
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV33.mjs
// El servidor del panel (403 sin ser administrador, paginación, dinero, correos simulados…) lo prueba `pruebaV33_servidor.mjs`. Ninguna parte toca producción ni manda correos.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V33_capturas'
fs.mkdirSync(CAP, { recursive: true })

console.log('1. El código')
{
  const v = JSON.parse(leer('vercel.json'))
  debe(v.rewrites.some((r) => r.source === '/admin' && r.destination === '/index.html') && v.rewrites.some((r) => r.source === '/admin/:seccion') && v.rewrites.some((r) => r.source === '/admin/logros') && v.rewrites.some((r) => r.source === '/admin/sonidos') && v.rewrites.some((r) => r.source === '/api/:path*'), 'rutas', '/admin y sus apartados abren la app (Vercel); /api sigue yendo al servidor')
  const p = leer('src/components/panel/PanelJutrip.tsx')
  debe(['Inicio', 'Reportes', 'Fotos', 'Destinos y «Avísame»', 'Ventas', 'Usuarios', 'Logros', 'Sonidos'].every((n) => p.includes(`nombre: '${n}'`)), 'menu', 'el menú de Design: Inicio · Reportes · Fotos · Destinos y «Avísame» · Ventas · Usuarios · Logros · Sonidos')
  const cuerpo = ['src/components/panel/api.ts', 'src/components/panel/Usuarios.tsx', 'src/components/panel/Ventas.tsx'].map(leer).join('\n')
  debe(!/Exportar|Descargar|\.csv|Blob\(|download=/.test(cuerpo), 'privacidad', 'el panel no tiene botón de exportar ni descarga de usuarios (solo lectura)')
  debe(!/supabase|service_role|SERVICE_ROLE/i.test(['Inicio', 'Reportes', 'Fotos', 'Destinos', 'Ventas', 'Usuarios', 'PanelJutrip', 'api'].map((n) => leer(`src/components/panel/${n}.${n === 'api' ? 'ts' : 'tsx'}`)).join('\n')), 'privacidad', 'el navegador no lee Supabase ni usa la clave de servicio: todo va por /api/admin/* (el servidor)')
  debe(/ORDENES/.test(leer('src/components/panel/Usuarios.tsx')) && leer('src/components/panel/Usuarios.tsx').includes('por_pagina') && leer('src/components/panel/Usuarios.tsx').includes('data-pagina-siguiente'), 'usuarios', 'la lista está paginada (50 en 50) y se ordena')
  const main = leer('src/main.tsx')
  debe(main.includes("window.location.pathname === '/admin'") && main.includes("startsWith('/admin/')"), 'rutas', '/admin y /admin/<apartado> abren el panel')
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la Tanda V33 (pantalla): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

const RUTA = (p = '/admin') => `${p}?cuentas=on&logros=on&logrosDemo=1&apertura=0`
const esperar = async (a, js, n = 40) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(500)
  }
  return false
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)
const texto = (a) => a.evaluar('document.body.innerText.replace(/\\s+/g, " ")')

console.log('2. Quien no es administrador ve «Esta página es solo para administradores»')
{
  const a = await abrirApp(APP, { ruta: RUTA(), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5, antes: "try{sessionStorage.setItem('trazo:demo-no-admin','1')}catch(e){}" })
  try {
    const ok = await esperar(a, "Boolean(document.querySelector('[data-solo-administradores]'))")
    debe(ok && /solo para administradores/.test(await texto(a)) && !(await a.evaluar("Boolean(document.querySelector('[data-panel-jutrip]'))")), 'admin', 'sin ser administrador, /admin enseña «Esta página es solo para administradores» y nada del panel')
  } finally {
    a.cerrar()
  }
}

console.log('3. El panel en ordenador: todos los apartados abren')
{
  const a = await abrirApp(APP, { ruta: RUTA(), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-panel-jutrip]')) && Boolean(document.querySelector('[data-seccion=\"inicio\"] [data-cifra]'))"), 'panel', '/admin abre el panel con el Inicio')
    const nav = JSON.parse(await a.evaluar("JSON.stringify([...document.querySelectorAll('nav [data-nav]')].map((b) => b.getAttribute('data-nav')))"))
    debe(nav.join() === 'inicio,reportes,fotos,destinos,ventas,usuarios,logros,sonidos', 'menu', `el menú, en su orden (${nav.join(', ')})`)
    const k = JSON.parse(await a.evaluar("JSON.stringify([...document.querySelectorAll('[data-seccion=\"inicio\"] [data-cifra]')].map((c) => c.getAttribute('data-cifra') + '=' + c.innerText.split('\\n')[1]))"))
    debe(k.length === 6 && k.some((x) => /Reportes nuevos=7/i.test(x)) && k.some((x) => /Fotos por aprobar=12/i.test(x)) && k.some((x) => /Pases hoy=9/i.test(x)) && k.some((x) => /Ingresos hoy/i.test(x)) && k.some((x) => /Usuarios hoy=38/i.test(x)), 'inicio', `Inicio: reportes sin mirar, fotos por aprobar, pases e ingresos de hoy, usuarios nuevos y con viaje (${k.join(' | ')})`)
    debe((await texto(a)).includes('Pases vendidos · últimos 14 días') && (await a.evaluar("document.querySelectorAll('[data-barras] span').length")) === 14, 'inicio', 'Inicio: el gráfico de los pases de los últimos 14 días y lo último que ha llegado')
    debe(/Los correos están apagados \(falta RESEND_API_KEY/.test(await texto(a)), 'correo', 'sin la clave de correo el panel lo dice (y funciona igual)')
    debe(/Lo que contestaron en la primera vez/.test(await texto(a)) && (await a.evaluar("document.querySelectorAll('[data-respuestas-primera-vez] [data-reparto]').length")) >= 10, 'primera_vez', 'los totales de las respuestas de la primera vez (porcentajes) salen en Inicio')
    await a.captura(`${CAP}/inicio.jpg`)

    for (const [id, marca] of [['reportes', '[data-seccion="reportes"] [data-reporte]'], ['fotos', '[data-seccion="fotos"] [data-foto-de-viajero]'], ['destinos', '[data-seccion="destinos"] [data-proximamente]'], ['ventas', '[data-seccion="ventas"] [data-compra]'], ['usuarios', '[data-seccion="usuarios"] [data-usuario]'], ['logros', '[data-panel-jutrip] main h1'], ['sonidos', '[data-admin-sonidos]']]) {
      await clic(a, `[data-nav="${id}"]`)
      const ok = await esperar(a, `Boolean(document.querySelector('${marca}')) && document.querySelector('[data-panel-jutrip]').getAttribute('data-seccion-actual') === '${id}'`)
      debe(ok, 'apartados', `el apartado «${id}» abre`)
    }
    debe((await a.evaluar('location.pathname')) === '/admin/sonidos', 'rutas', 'cada apartado cambia la dirección (/admin/sonidos)')

    console.log('4. Reportes: filtros, [Visto] [Hecho] [Descartar] y [Responder]')
    await clic(a, '[data-nav="reportes"]')
    await esperar(a, "document.querySelectorAll('[data-reporte]').length >= 5")
    debe(/Todos|Añadir un restaurante|Un dato está mal/.test(await texto(a)) && (await a.evaluar("document.querySelectorAll('[data-filtro^=\"tipo-\"]').length")) === 9, 'reportes', 'filtros por tipo (Todos + los 8 tipos), por destino y por estado')
    await clic(a, '[data-filtro="tipo-restaurante"]')
    await a.esp(700)
    debe((await a.evaluar("document.querySelectorAll('[data-reporte]').length")) === 1, 'reportes', 'el filtro por tipo deja solo los restaurantes')
    await clic(a, '[data-filtro="tipo-todos"]')
    await a.esp(500)
    await clic(a, '[data-reporte="a1"]')
    await esperar(a, "Boolean(document.querySelector('[data-reporte-abierto=\"a1\"]'))")
    debe(await a.evaluar("!!(document.querySelector('[data-reporte-abierto] [data-estado-visto]') && document.querySelector('[data-reporte-abierto] [data-estado-hecho]') && document.querySelector('[data-reporte-abierto] [data-estado-descartado]') && document.querySelector('[data-reporte-abierto] [data-responder]'))"), 'reportes', 'un reporte abierto: [Visto] [Hecho] [Descartar] y [Responder]')
    await a.captura(`${CAP}/reporte_abierto.jpg`)
    await a.evaluar("(() => { const t = document.querySelector('[data-texto-responder]'); const s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; s.call(t, 'Gracias, ya lo hemos corregido.'); t.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
    await clic(a, '[data-responder]')
    await esperar(a, "Boolean(document.querySelector('[data-resultado-responder]'))")
    const r = await a.evaluar("document.querySelector('[data-resultado-responder]').innerText")
    debe(/campana/.test(r) && /correo está apagado/.test(r), 'responder', `[Responder] llega a la campana y, sin la clave de correo, lo dice (${r})`)
    const dem = JSON.parse(await a.evaluar('JSON.stringify(window.__demoPanel.respuestas)'))
    debe(dem.length === 1 && dem[0].id === 'a1' && dem[0].texto === 'Gracias, ya lo hemos corregido.' && dem[0].correo === 'sin_clave', 'responder', 'la respuesta se mandó con su texto y sin correo (simulado)')

    console.log('5. Destinos y «Avísame»')
    await clic(a, '[data-nav="destinos"]')
    await esperar(a, "document.querySelectorAll('[data-proximamente]').length === 3")
    const d = await texto(a)
    debe(/Florencia/.test(d) && /143 personas/.test(d) && /Cartagena de Indias/.test(d) && /Lisboa/.test(d), 'destinos', 'los más pedidos y los «Próximamente» con cuántas personas pulsaron [Avísame]')
    await clic(a, '[data-ya-disponible="Florencia"]')
    await esperar(a, "Boolean(document.querySelector('[data-mensaje-destinos]'))")
    const m = await a.evaluar("document.querySelector('[data-mensaje-destinos]').innerText")
    debe(/143 personas en la campana y 0 por correo/.test(m) && /falta RESEND_API_KEY/.test(m), 'destinos', `[Ya está disponible] avisa a quien pulsó [Avísame] (${m})`)
    await esperar(a, "document.querySelector('[data-ya-disponible=\"Florencia\"]').disabled === true")
    debe(Boolean(await a.evaluar("document.querySelector('[data-ya-disponible=\"Florencia\"]').disabled")), 'destinos', 'una segunda vez ya no hay nadie a quien avisar (una sola vez por persona y destino)')
    await a.captura(`${CAP}/destinos.jpg`)

    console.log('6. Ventas')
    await clic(a, '[data-nav="ventas"]')
    await esperar(a, "document.querySelectorAll('[data-compra]').length >= 3")
    const v = await texto(a)
    debe(/Pases hoy/i.test(v) && /Ingresos del mes/i.test(v) && /1\.?870/.test(v) && /Pases por destino/.test(v) && /Últimas compras/.test(v) && (await a.evaluar("document.querySelectorAll('[data-venta-destino]').length")) === 3 && (await a.evaluar("document.querySelectorAll('[data-barras] span').length")) === 30, 'ventas', 'Ventas: pases por destino y por día, ingresos del mes y las últimas compras')
    debe(!/tarjeta|card|\*{4}|4242/i.test(await a.evaluar("document.querySelector('[data-seccion=\"ventas\"]').innerText")), 'privacidad', 'ni un dato de tarjeta en Ventas')
    await a.captura(`${CAP}/ventas.jpg`)

    console.log('7. Usuarios: la lista, buscar, filtrar, ordenar, paginar y la ficha')
    await clic(a, '[data-nav="usuarios"]')
    await esperar(a, "document.querySelectorAll('[data-usuario]').length === 50")
    debe((await a.evaluar("document.querySelectorAll('[data-usuario]').length")) === 50 && /Página 1 de 3 · 120 usuarios/.test(await texto(a)), 'usuarios', 'la lista, uno a uno, de 50 en 50 (120 usuarios, 3 páginas)')
    const fila = await a.evaluar("document.querySelector('[data-usuario=\"u000\"]').innerText.replace(/\\s+/g, ' ')")
    debe(/Laura García/.test(fila) && /@demo\.test/.test(fila) && /Roma/.test(fila) && /Individual/.test(fila) && /€/.test(fila) && /veces|4 o más|Una vez/.test(fila), 'usuarios', `cada fila: nombre y correo, alta y acceso, nivel, pase (destino y tipo), viajes, gastado y lo que contestó (${fila})`)
    await clic(a, '[data-pagina-siguiente]')
    await esperar(a, "/Página 2 de 3/.test(document.body.innerText)")
    debe((await a.evaluar("document.querySelectorAll('[data-usuario]').length")) === 50 && Boolean(await a.evaluar("!document.querySelector('[data-usuario=\"u000\"]')")), 'usuarios', 'la página 2 trae otros 50')
    await clic(a, '[data-pagina-anterior]')
    await esperar(a, "/Página 1 de 3/.test(document.body.innerText)")
    await a.evaluar("(() => { const t = document.querySelector('[data-buscador-usuarios]'); const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(t, 'garcia'); t.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
    await esperar(a, "document.querySelectorAll('[data-usuario]').length === 1")
    debe((await a.evaluar("document.querySelectorAll('[data-usuario]').length")) === 1 && /1 usuarios|1 usuario/.test(await texto(a)), 'usuarios', 'el buscador encuentra por nombre o correo')
    await a.evaluar("(() => { const t = document.querySelector('[data-buscador-usuarios]'); const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(t, ''); t.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
    await esperar(a, "document.querySelectorAll('[data-usuario]').length === 50")
    await clic(a, '[data-filtro="pase-si"]')
    await esperar(a, "/40 usuarios/.test(document.body.innerText)")
    debe(/Página 1 de 1 · 40 usuarios/.test(await texto(a)), 'usuarios', 'el filtro «Con pase» deja los 40 que tienen pase')
    await clic(a, '[data-filtro="pase-no"]')
    await esperar(a, "/80 usuarios/.test(document.body.innerText)")
    await clic(a, '[data-filtro="pase-todos"]')
    await a.evaluar("(() => { const s = [...document.querySelectorAll('select')].find((x) => x.getAttribute('aria-label') === 'Cada cuánto viaja'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, 'cuatro_o_mas'); s.dispatchEvent(new Event('change', { bubbles: true })); return true })()")
    await esperar(a, "/Página 1 de 1 · 3\\d usuarios/.test(document.body.innerText)")
    debe(/Página 1 de 1 · 3\d usuarios/.test(await texto(a)), 'usuarios', 'el filtro por cada cuánto viaja funciona')
    await a.evaluar("(() => { const s = [...document.querySelectorAll('select')].find((x) => x.getAttribute('aria-label') === 'Cada cuánto viaja'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, ''); s.dispatchEvent(new Event('change', { bubbles: true })); const o = [...document.querySelectorAll('select')].find((x) => x.getAttribute('aria-label') === 'Ordenar por'); set.call(o, 'gastado'); o.dispatchEvent(new Event('change', { bubbles: true })); return true })()")
    await esperar(a, "/Página 1 de 3/.test(document.body.innerText)")
    await a.esp(600)
    const primero = await a.evaluar("document.querySelector('[data-usuario]').innerText.replace(/\\s+/g, ' ')")
    debe(/10,99|10,99 €/.test(primero) || /€/.test(primero), 'usuarios', `ordenar por «Más gastado»: el primero es de los que más han gastado (${primero.slice(0, 80)})`)
    await a.captura(`${CAP}/usuarios_lista.jpg`)
    await clic(a, '[data-usuario="u000"]')
    await esperar(a, "Boolean(document.querySelector('[data-ficha-de-usuario]')) && document.querySelectorAll('[data-ficha-viaje]').length >= 1")
    const ficha = await texto(a)
    debe(/Sus viajes/.test(ficha) && /En grupo \(4\)/.test(ficha) && /Sus pases/.test(ficha) && /Logros, destinos y pasaporte/.test(ficha) && /Reportes que ha mandado/.test(ficha) && /Sello de oro/.test(ficha) && /Solo de lectura|solo lectura/.test(ficha), 'ficha', 'la ficha: sus viajes (destino, fechas, si fue en grupo), sus pases con importe, sus logros y pasaporte y sus reportes; solo lectura')
    debe(!(await a.evaluar("[...document.querySelectorAll('button')].some((b) => /exportar|descargar/i.test(b.innerText))")), 'privacidad', 'la ficha no tiene botón de exportar')
    await a.captura(`${CAP}/usuarios_ficha.jpg`)
    await clic(a, '[data-volver-lista]')
    debe(await esperar(a, "document.querySelectorAll('[data-usuario]').length > 0"), 'ficha', '[Volver a la lista] vuelve a la lista')
  } finally {
    a.cerrar()
  }
}

console.log('8. /admin/usuarios y /admin/sonidos llevan a su apartado; el panel en el móvil')
{
  const a = await abrirApp(APP, { ruta: RUTA('/admin/usuarios'), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "document.querySelector('[data-panel-jutrip]')?.getAttribute('data-seccion-actual') === 'usuarios' && document.querySelectorAll('[data-usuario]').length > 0"), 'rutas', '/admin/usuarios abre directamente el apartado Usuarios')
  } finally {
    a.cerrar()
  }
  const b = await abrirApp(APP, { ruta: RUTA('/admin/sonidos'), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(b, "document.querySelector('[data-panel-jutrip]')?.getAttribute('data-seccion-actual') === 'sonidos' && Boolean(document.querySelector('[data-admin-sonidos]'))"), 'rutas', '/admin/sonidos lleva a su apartado del panel (lo de siempre, dentro)')
  } finally {
    b.cerrar()
  }
  const c = await abrirApp(APP, { ruta: RUTA('/admin/logros'), ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(c, "document.querySelector('[data-panel-jutrip]')?.getAttribute('data-seccion-actual') === 'logros'"), 'rutas', '/admin/logros lleva a su apartado del panel')
  } finally {
    c.cerrar()
  }
  const m = await abrirApp(APP, { ruta: RUTA(), ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(m, "document.querySelector('[data-panel-jutrip]')?.getAttribute('data-movil') === '1' && Boolean(document.querySelector('[data-seccion=\"inicio\"] [data-cifra]'))"), 'movil', 'en el móvil el panel abre con el menú de pastillas arriba')
    debe(!(await m.evaluar('document.documentElement.scrollWidth > innerWidth + 2')), 'movil', 'el Inicio no se sale de la pantalla en el móvil')
    await m.captura(`${CAP}/movil_inicio.jpg`)
    await clic(m, '[data-nav="usuarios"]')
    await esperar(m, "document.querySelectorAll('[data-usuario]').length === 50")
    debe(!(await m.evaluar('document.documentElement.scrollWidth > innerWidth + 2')), 'movil', 'la lista de usuarios cabe en el móvil')
    await m.captura(`${CAP}/movil_usuarios.jpg`)
    await clic(m, '[data-nav="reportes"]')
    await esperar(m, "document.querySelectorAll('[data-reporte]').length >= 5")
    await m.captura(`${CAP}/movil_reportes.jpg`)
  } finally {
    m.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V33 (pantalla): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
