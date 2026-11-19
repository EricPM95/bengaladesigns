// La prueba de la Tanda V25: LA HOJA DE LOGROS ANTES DEL VIAJE, EL SORTEO ESCONDIDO Y LOS FILTROS DE EXPLORAR.
//   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV25.mjs     (Vite en 5173 y la API en 8787, modo normal)
//  1. El código, el servidor y el interruptor del sorteo   2. En pantalla (demo de logros, ninguna llamada a producción): sin pase y con pase   3. EXPLORAR: varios temas a la vez y filas quietas en vertical
//  Capturas en docs/dias/V25_capturas/.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { sorteoVisible } from '../../server/logros/sorteoVisible.js'

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
const CAP = 'docs/dias/V25_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. El código, el servidor y el interruptor ───────── */
console.log('1. El código, el servidor y el sorteo escondido')
{
  debe(sorteoVisible({}) === false && sorteoVisible({ SORTEO_VISIBLE: 'false' }) === false && sorteoVisible({ SORTEO_VISIBLE: 'true' }) === true, 'interruptor', 'SORTEO_VISIBLE: apagado salvo «true» (servidor)')
  const cliente = leer('src/lib/sorteo.ts')
  debe(/VITE_SORTEO_VISIBLE/.test(cliente) && /=== 'true'/.test(cliente), 'interruptor', 'VITE_SORTEO_VISIBLE: apagado salvo «true» (móvil)')
  const servicio = leer('server/logros/servicio.js')
  debe(/async function sorteoDeCuenta[\s\S]{0,400}if \(!sorteoVisible\(\)\) return null/.test(servicio), 'servidor', 'el servidor no da billete ni crea el aviso «¡Ya estás en el sorteo!» con el sorteo escondido')
  debe(/sorteoVisible\(\) \? res\.json/.test(leer('server/logros/rutas.js')), 'servidor', '/api/logros/sorteo no responde con el sorteo escondido')
  debe(/sorteoVisible\(\) \|\| a\.tipo !== 'sorteo'/.test(leer('server/avisos.js')), 'servidor', 'la campana no enseña avisos del sorteo con el sorteo escondido')
  debe(/SORTEO_VISIBLE && perfil\.sorteo/.test(leer('src/components/logros/pantallas/perfil/CuerpoConLogros.tsx')), 'perfil', 'el billete dorado del Perfil solo sale con el sorteo visible')
  debe(/SORTEO_VISIBLE \? r\.datos\.avisos : r\.datos\.avisos\.filter\(\(a\) => a\.tipo !== 'sorteo'\)/.test(leer('src/lib/avisos.ts')), 'campana', 'el móvil tampoco enseña avisos del sorteo con el sorteo escondido')
  const { sinSorteo } = await import('../../src/lib/sorteo.ts')
  debe(sinSorteo('Experiencia, niveles y sorteo anual') === 'Experiencia y niveles' && !/sorteo/i.test(sinSorteo('Sube de nivel y entra en el sorteo de cada año.')), 'texto', '«Experiencia, niveles y sorteo anual» → «Experiencia y niveles», y sin «sorteo» en la línea del pase')
  const lista = leer('src/lib/listaAjustada.ts')
  debe(/sinSorteo\(TEXTOS_DE_LINEA/.test(lista), 'texto', 'la lista del pase (película, «Todo lo que incluye» y HOY) pasa por el interruptor')
  const hoja = leer('src/components/logros/momentos/HojaLogros.tsx') + leer('src/components/logros/momentos/hoja/AntesDelViaje.tsx')
  debe(!/te espera en el Coliseo|Un país entero te espera|Tres trozos|primer pedazo/i.test(hoja), 'frases', 'ninguna frase de «tu primer pedazo te espera en…» en la hoja')
  debe(!/Todo listo|Toca para ver/.test(hoja), 'frases', 'sin «Todo listo» ni «Toca para ver tus colecciones»')
  debe(!/role="status"/.test(leer('src/components/logros/momentos/HojaLogros.tsx')), 'etiqueta', 'fuera la etiqueta negra con el nombre de un sitio de la tarjeta de cada colección')
}

/* ───────── 2. En pantalla ───────── */
console.log('2. La hoja, sin pase y con pase')
async function abrirHoja(version, archivo = 'hoja_antes') {
  const app = await abrirApp(APP, { ancho: 390, alto: 844, ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=${version}&apertura=0` })
  const ev = (js) => app.evaluar(js)
  for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  await ev("window.__imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; true")
  await ev('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await ev("__imp('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Empezar mi día)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await app.esp(700)
  }
  const estado = JSON.parse(leer(`src/dev/escaparates/datos/${archivo}.json`))
  await ev("window.__demoHoy = '2026-10-10'; window.__pase = 0; window.addEventListener('trazo:pagar', () => { window.__pase++ }); true")
  await ev(`Promise.all([__imp('/src/components/logros/momentos/api.ts'), __imp('/src/components/logros/momentos/useMomentosUI.ts')]).then(([api, ui]) => { api.datosDePrueba.estado = ${JSON.stringify(estado)}; ui.useMomentosUI.getState().cerrarHojaLogros(); setTimeout(() => ui.useMomentosUI.getState().abrirHojaLogros(), 80); return true })`)
  for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-hoja-logros]'))")); i++) await app.esp(250)
  await app.esp(2200)
  return { app, ev, estado }
}
const texto = (ev) => ev("(document.querySelector('[data-cuerpo-de-logros]')?.innerText ?? '').split(String.fromCharCode(10)).join(' | ')")
const alto = (ev, y) => ev(`document.querySelector('[data-cuerpo-de-logros]').scrollTop = ${y}; true`)

for (const version of ['gratis', 'completa']) {
  const sin = version === 'gratis'
  const { app, ev, estado } = await abrirHoja(version)
  try {
    const t = await texto(ev)
    console.log(`   (${sin ? 'sin pase' : 'con pase'}: ${t.length} letras)`)
    const sellos = await ev(`Array.from(document.querySelectorAll('[data-sello]')).map((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { id: e.dataset.sello, w: Math.round(r.width), h: Math.round(r.height), fondo: s.backgroundImage.slice(0, 60), oscuro: s.backgroundImage.includes('rgb(28, 34, 48)') || s.backgroundImage.includes('rgb(35, 40, 64)'), texto: e.innerText.split(String.fromCharCode(10)).join('|') } })`)
    debe(sellos.length === estado.sellos.length && sellos.length >= 2, 'sellos', `salen los sellos de Roma y del Vaticano (${sellos.map((s) => s.id).join(', ')})`)
    debe(sellos.every((s) => s.w === sellos[0].w && Math.abs(s.h - sellos[0].h) <= 8 && s.fondo === sellos[0].fondo && s.oscuro), 'sellos', `Roma y el Vaticano, con la MISMA tarjeta oscura y del mismo tamaño (${sellos.map((s) => `${s.id} ${s.w}×${s.h}`).join(' · ')})`)
    debe(sellos.every((s) => /POR CONSEGUIR · 0 DE \d+/i.test(s.texto) && /Empieza en \w+/.test(s.texto) && (s.texto.match(/Por conseguir/gi) ?? []).length === 1), 'sellos', `«Por conseguir» una sola vez por tarjeta, y «Empieza en bronce / plata» (${sellos[0]?.texto})`)
    debe(!/te espera|primer pedazo|Un país entero/i.test(t), 'frases', 'ninguna frase de «tu primer pedazo te espera en…» ni «un país entero te espera»')
    debe(!/Todo listo|Toca para ver/.test(t), 'frases', 'sin el recuadro «Todo listo» ni «Toca para ver tus colecciones»')
    debe(!/sorteo/i.test(t) && !/billete dorado/i.test(t), 'sorteo', 'ni «sorteo» ni el billete dorado en la hoja')
    debe(/LO QUE TE PUEDES LLEVAR DE ROMA/i.test(t) && /medallas, de bronce a diamante/.test(t) && /insignias por completar/.test(t) && /sello en tu pasaporte/.test(t), 'llevar', '«Lo que te puedes llevar de Roma»: medallas, insignias por completar y el sello')
    // los secretos: siluetas con «?», en una fila que se desliza solo de lado
    const sec = await ev(`(() => { const f = document.querySelector('[data-rejilla-de-emblemas]'); const s = getComputedStyle(f); const huecos = Array.from(f.querySelectorAll('[data-hueco-emblema]')); return { titulo: document.querySelector('[data-titulo-secretos]')?.innerText, hay: Boolean(f), flex: s.display === 'flex', ox: s.overflowX, oy: s.overflowY, ta: s.touchAction, huecos: huecos.length, signos: huecos.every((h) => (h.innerText || '').trim() === '?'), oscuros: huecos.every((h) => getComputedStyle(h).backgroundImage.includes('linear-gradient')), anchoFila: Math.round(f.getBoundingClientRect().width), anchoTotal: f.scrollWidth } })()`)
    debe(/^0 DE \d+ SECRETOS ENCONTRADOS$/.test(sec.titulo ?? ''), 'secretos', `«0 de N secretos encontrados» (${sec.titulo})`)
    debe(sec.hay && sec.flex && sec.huecos >= 8 && sec.signos && sec.oscuros, 'secretos', `cada emblema oculto es una silueta oscura con «?» (${sec.huecos})`)
    debe(sec.ox === 'auto' && sec.oy === 'hidden' && sec.anchoTotal > sec.anchoFila, 'secretos', `la fila se desliza de lado y se queda quieta en vertical (x ${sec.ox}, y ${sec.oy}, ${sec.anchoTotal} > ${sec.anchoFila})`)
    // la franja
    const f1 = await ev(`(() => { const b = document.querySelector('[data-franja-colecciones]'); const ins = Array.from(b.querySelectorAll('[data-franja-insignias] > span')); const g = b.querySelector('[data-franja-insignias]'); const cols = getComputedStyle(g).gridTemplateColumns.split(' ').length; return { hay: Boolean(b), texto: b.innerText.split(String.fromCharCode(10)).join(' '), n: ins.length, cols, abierta: document.querySelector('[data-colecciones-antes]').dataset.coleccionesAntes, filas: document.querySelectorAll('[data-colecciones-una-a-una]').length } })()`)
    debe(f1.hay && /Con tu ruta puedes completar \d+ de las \d+ colecciones/.test(f1.texto) && f1.cols === 2 && f1.n === 4, 'franja', `la franja dorada, con 4 insignias en dos filas de dos (${f1.texto})`)
    debe(!/Toca para/.test(f1.texto) && f1.abierta === 'cerrada' && f1.filas === 0, 'franja', 'sin «Toca para ver tus colecciones»; cerrada, no enseña las colecciones')
    await alto(ev, 0)
    await app.captura(`${CAP}/${version}_01_arriba.jpg`)
    await ev("document.querySelector('[data-franja-colecciones]').scrollIntoView({ block: 'center' }); true")
    await app.esp(400)
    await app.captura(`${CAP}/${version}_02_franja.jpg`)
    await ev("document.querySelector('[data-franja-colecciones]').click(); true")
    await app.esp(600)
    const aparecen = await ev(`Array.from(document.querySelectorAll('[data-colecciones-una-a-una] > [data-coleccion]')).map((e) => parseFloat(getComputedStyle(e).animationDelay))`)
    await app.esp(3500)
    const filas = await ev(`(() => { const r = Array.from(document.querySelectorAll('[data-colecciones-una-a-una] > [data-coleccion]')); return { n: r.length, abiertas: r.filter((e) => e.dataset.coleccionAbierta === '1').length, listas: document.querySelectorAll('[data-lista-abierta]').length, ids: r.map((e) => e.dataset.coleccion), enRuta: r.map((e) => /Se completa con tu ruta/.test(e.innerText)), candados: r.filter((e) => e.querySelector('[data-candado-pequeno]')).length, nombres: r.map((e) => e.querySelector('[data-nombre-de-coleccion]')?.innerText ?? ''), cortos: r.every((e) => { const n = e.querySelector('[data-nombre-de-coleccion]'); return n && n.getBoundingClientRect().width >= 120 && n.scrollWidth <= n.clientWidth + 1 }), insignia: r.map((e) => Math.round(e.querySelector('button > span').getBoundingClientRect().width)) } })()`)
    debe(filas.n === estado.colecciones.length && filas.abiertas === 0 && filas.listas === 0, 'colecciones', `al tocar la franja salen las ${filas.n} colecciones, todas CERRADAS`)
    debe(aparecen.length === filas.n && aparecen.every((d, i) => i === 0 || d > aparecen[i - 1]), 'colecciones', `salen una a una (retrasos ${aparecen.slice(0, 4).map((d) => d.toFixed(2)).join(', ')}…)`)
    const primeraFuera = filas.enRuta.indexOf(false)
    debe(filas.enRuta.slice(0, primeraFuera < 0 ? filas.n : primeraFuera).every(Boolean) && (primeraFuera < 0 || filas.enRuta.slice(primeraFuera).every((x) => !x)), 'colecciones', 'primero las que se completan con la ruta («Se completa con tu ruta») y luego las demás')
    debe(filas.cortos && filas.insignia.every((w) => w <= 60), 'colecciones', `el nombre se lee entero (sin cortarse) y la insignia es pequeña (${filas.insignia[0]} px)`)
    debe(sin ? filas.candados === filas.n : filas.candados === 0, 'candado', sin ? 'sin pase: cada colección lleva su candado pequeño' : 'con pase: ningún candado')
    await ev("document.querySelector('[data-colecciones-una-a-una]').scrollIntoView({ block: 'start' }); true")
    await app.esp(500)
    await app.captura(`${CAP}/${version}_03_colecciones_cerradas.jpg`)
    // tocar una colección: sus lugares, con foto
    const id0 = filas.ids[0]
    await ev(`document.querySelector('[data-coleccion="${id0}"] button').click(); true`)
    for (let i = 0; i < 30 && !(await ev(`Boolean(document.querySelector('[data-lista-abierta="${id0}"] [data-sitio-de-lista]'))`)); i++) await app.esp(300)
    await app.esp(1500)
    const li = await ev(`(() => { const l = document.querySelector('[data-lista-abierta="${id0}"]'); const f = Array.from(l.querySelectorAll('[data-sitio-de-lista]')); return { n: f.length, fotos: f.every((x) => x.querySelector('[data-foto-de-sitio-lista]')), mapa: f.some((x) => x.querySelector('[data-foto-de-sitio-lista] svg[viewBox]') && !x.querySelector('[data-foto-de-sitio-lista]').style.background), notas: f.map((x) => x.innerText.split(String.fromCharCode(10)).join('|')), enlace: l.querySelector('[data-ver-la-coleccion]')?.innerText.trim(), negra: Boolean(document.querySelector('[data-coleccion="${id0}"] [role=status]')) } })()`)
    debe(li.n === estado.colecciones.find((c) => c.id === id0).sitios.length && li.fotos, 'lugares', `al tocar una colección salen sus lugares, cada uno con su foto (${li.n})`)
    debe(li.notas.every((x) => /(En tu ruta( · [a-zé]+ \d+)?|Fuera de tu ruta)/.test(x)), 'lugares', `y «En tu ruta · jueves 26» o «Fuera de tu ruta» (${li.notas.slice(0, 2).join(' // ')})`)
    debe(li.enlace === 'Ver la colección', 'lugares', 'y al final «Ver la colección ›»')
    debe(!li.negra, 'etiqueta', 'ninguna etiqueta negra en la colección')
    await app.captura(`${CAP}/${version}_04_coleccion_abierta.jpg`)
    // el bloque del pase
    await alto(ev, 99999)
    await app.esp(500)
    const pase = await ev(`(() => { const b = document.querySelector('[data-bloque-del-pase]'); return { hay: Boolean(b), texto: b ? b.innerText.split(String.fromCharCode(10)).join(' | ') : '', boton: b?.querySelector('[data-conseguir-el-pase]')?.innerText.trim() ?? null, precioSucio: /€/.test(document.body.innerText) } })()`)
    if (sin) {
      debe(pase.hay && /Los logros vienen con el Pase Roma/.test(pase.texto) && /Experiencia y niveles/.test(pase.texto) && !/sorteo/i.test(pase.texto), 'pase', `sin pase: «Los logros vienen con el Pase Roma» y lo que incluye, sin «sorteo» (${pase.texto.slice(0, 140)})`)
      const config = await fetch('http://localhost:8787/api/pase/config').then((r) => r.json()).catch(() => null)
      const uno = config?.precios?.planes?.find((p) => p.id === 'uno')?.precio_total
      const esperado = uno != null ? `Conseguir el pase · ${String(uno.toFixed(2)).replace('.', ',')} €` : null
      debe(pase.boton && /^Conseguir el pase · \d+,\d\d €$/.test(pase.boton) && (!esperado || pase.boton === esperado), 'pase', `el botón lleva el precio del servidor (${pase.boton}; el servidor dice ${esperado})`)
      await ev("document.querySelector('[data-conseguir-el-pase]').click(); true")
      await app.esp(500)
      debe((await ev('window.__pase')) === 1, 'pase', '[Conseguir el pase] abre la hoja de compra de siempre')
      await app.captura(`${CAP}/${version}_05_vende_el_pase.jpg`)
    } else {
      debe(!pase.hay && !/Conseguir el pase|Los logros vienen con el/.test(await texto(ev)), 'pase', 'con pase (o sin cobro): la misma hoja, sin el bloque del pase, ni precio ni candado')
    }
  } finally {
    app.cerrar()
    await new Promise((r) => setTimeout(r, 600))
  }
}


/* ───────── 2b. Las tres fases: antes, durante y después ───────── */
console.log('2b. La hoja en sus tres momentos (el momento sale de las fechas del viaje)')
for (const [archivo, fase] of [['hoja_antes', 'antes'], ['hoja_dia1', 'durante'], ['hoja_despues', 'despues']]) {
  const { app, ev, estado } = await abrirHoja('completa', archivo)
  try {
    const t = await texto(ev)
    const v = estado.viaje
    const fasePorFechas = v.hoy < v.inicio ? 'antes' : v.hoy > v.fin ? 'despues' : 'durante'
    debe(fasePorFechas === fase, 'fase', `${fase}: el momento sale de las fechas del viaje (hoy ${v.hoy}, del ${v.inicio} al ${v.fin})`)
    const marca = await ev("document.querySelector('[data-hoja-logros]').dataset.hojaLogros")
    debe(marca === fase, 'fase', `${fase}: la hoja se pinta como «${marca}»`)
    const etiqueta = await ev("document.querySelector('[data-etiqueta-de-fase]')?.innerText ?? ''")
    if (fase === 'antes') {
      debe(/^ANTES DEL VIAJE/i.test(etiqueta), 'etiqueta', `antes: «${etiqueta}»`)
      debe(!/Reclamar con tus fotos|Puedes reclamar|Yo también estaba|consiguió d+ sitios/i.test(t), 'antes', 'antes: sin «Reclamar con tus fotos», sin «Puedes reclamar hasta…» y sin «Yo también estaba»')
      debe(/LO QUE TE PUEDES LLEVAR/i.test(t) && /SECRETOS ENCONTRADOS/i.test(t) && /Con tu ruta puedes completar/.test(t), 'antes', 'antes: «Lo que te puedes llevar», los secretos y la franja de colecciones')
    } else {
      debe(fase === 'durante' ? /^EN CURSO/i.test(etiqueta) : /^VIAJE TERMINADO/i.test(etiqueta), 'etiqueta', `${fase}: la etiqueta dice «${etiqueta}»`)
      debe(/Reclamar con tus fotos/.test(t) && /Puedes reclamar hasta/.test(t), fase, `${fase}: [Reclamar con tus fotos] y «Puedes reclamar hasta…»`)
      debe(!/LO QUE TE PUEDES LLEVAR/i.test(t), fase, `${fase}: NO lleva «Lo que te puedes llevar»`)
      debe(/SECRETOS ENCONTRADOS/i.test(t) && (await ev("Boolean(document.querySelector('[data-hueco-emblema]'))")), fase, `${fase}: los secretos, con sus siluetas`)
      const sellos = await ev(`Array.from(document.querySelectorAll('[data-sello]')).map((e) => Math.round(e.getBoundingClientRect().width))`)
      debe(sellos.length >= 2 && sellos.every((w) => w === sellos[0]), fase, `${fase}: Roma y el Vaticano, la misma tarjeta (${sellos.join(', ')})`)
      debe(!(await ev("Boolean(document.querySelector('[role=status]'))")), fase, `${fase}: sin la etiqueta negra en las colecciones`)
    }
    await alto(ev, 0)
    await app.esp(400)
    await app.captura(`${CAP}/fase_${fase}_arriba.jpg`)
    await alto(ev, 640)
    await app.esp(400)
    await app.captura(`${CAP}/fase_${fase}_medio.jpg`)
  } finally {
    app.cerrar()
    await new Promise((r) => setTimeout(r, 600))
  }
}

/* ───────── 3. EXPLORAR ───────── */
console.log('3. EXPLORAR: varios temas a la vez, filas quietas en vertical')
{
  const app = await abrirApp(APP, { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=off&apertura=0&version=completa' })
  const ev = (js) => app.evaluar(js)
  try {
    for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
    await app.esp(3000)
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Empezar mi día)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await app.esp(700)
    }
    await ev("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('explore'); return true })")
    for (let i = 0; i < 60 && !(await ev("Boolean(document.querySelector('[data-explorar-categorias] button'))")); i++) await app.esp(500)
    await app.esp(3500)
    const tarjetas = await ev("Array.from(document.querySelectorAll('[data-explorar-categorias] button')).map((b) => (b.innerText || '').split(String.fromCharCode(10))[0].trim())")
    await ev("document.querySelector('[data-explorar-categorias] button').click(); true")
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-tema]'))")); i++) await app.esp(500)
    await app.esp(3500)
    const temas = () => ev("Array.from(document.querySelectorAll('[data-tema]')).map((b) => ({ id: b.dataset.tema, activo: b.getAttribute('aria-pressed') === 'true' }))")
    const nombres = () => ev("Array.from(document.querySelectorAll('button[aria-label^=\"Añadir \"]')).map((b) => b.getAttribute('aria-label').slice(7))")
    const sub = () => ev("(document.querySelector('[data-titulo-explorador]')?.parentElement?.innerText ?? '').split(String.fromCharCode(10)).join(' ')")
    const t0 = await temas()
    debe(t0.filter((x) => x.activo).length === 1, 'temas', `al entrar desde una tarjeta, solo ese tema marcado (${t0.filter((x) => x.activo).map((x) => x.id)})`)
    const primero = t0.find((x) => x.activo).id
    const subtitulo0 = await sub()
    const nombresA = await nombres()
    // el segundo: el primero que no sea el marcado y tenga sitios
    const otros = t0.filter((x) => !x.activo && !['hoteles', 'excursiones', 'restaurantes'].includes(x.id)).map((x) => x.id)
    const segundo = otros[0]
    await ev(`document.querySelector('[data-tema=${segundo}]').click(); true`)
    await app.esp(2500)
    const t1 = await temas()
    const nombresAB = await nombres()
    debe(t1.find((x) => x.id === primero).activo && t1.find((x) => x.id === segundo).activo && t1.filter((x) => x.activo).length === 2, 'temas', `tocar otro tema lo ENCIENDE sin apagar el primero (${primero} + ${segundo})`)
    debe((await sub()) === subtitulo0, 'temas', 'el subtítulo de arriba no cambia con los temas marcados')
    await ev(`document.querySelector('[data-tema=${primero}]').click(); true`)
    await app.esp(2500)
    const nombresB = await nombres()
    await ev(`document.querySelector('[data-tema=${primero}]').click(); true`)
    await app.esp(2500)
    const nombresAB2 = await nombres()
    debe(nombresA.length > 0 && nombresB.length > 0, 'union', `cada tema tiene sitios (${primero}: ${nombresA.length}, ${segundo}: ${nombresB.length})`)
    debe(nombresA.every((n) => nombresAB2.includes(n)) && nombresB.every((n) => nombresAB2.includes(n)), 'union', 'con los dos marcados salen los sitios de los dos')
    debe(new Set(nombresAB2).size === nombresAB2.length, 'union', 'sin repetir un sitio que esté en los dos temas')
    await app.captura(`${CAP}/explorar_dos_temas.jpg`)
    // apagar todos → todo el destino
    for (const t of (await temas()).filter((x) => x.activo)) {
      await ev(`document.querySelector('[data-tema=${t.id}]').click(); true`)
      await app.esp(1200)
    }
    await app.esp(1500)
    const todos = await nombres()
    debe((await temas()).every((x) => !x.activo) && todos.length >= Math.max(nombresAB2.length, nombresA.length), 'todos', `apagados todos los temas se ve todo el destino (${todos.length} sitios)`)
    // las filas se deslizan solo de lado
    const fila = await ev(`(() => { const f = document.querySelector('[data-fila-de-temas]'); const s = getComputedStyle(f); return { ox: s.overflowX, oy: s.overflowY, ancho: f.scrollWidth > f.clientWidth } })()`)
    debe(fila.ox === 'auto' && fila.oy === 'hidden' && fila.ancho, 'fila', `la fila de temas desliza de lado y está quieta en vertical (x ${fila.ox}, y ${fila.oy})`)
    // todas las filas que deslizan de lado de la app: ninguna con overflow-y automático
    const css = leer('src/index.css')
    debe(/\.overflow-x-auto:not\(\.overflow-y-auto\)[\s\S]{0,120}overflow-y: hidden/.test(css), 'filas', 'todas las filas con overflow-x-auto de la app se quedan quietas en vertical (regla global)')
    const sueltas = []
    const recorre = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = `${d}/${e.name}`
        if (e.isDirectory()) recorre(p)
        else if (/\.tsx$/.test(e.name)) for (const m of leer(p).matchAll(/overflowX: '(auto|scroll)'(?![^}]*overflowY)/g)) sueltas.push(`${p}:${m.index}`)
      }
    }
    recorre('src')
    debe(sueltas.length === 0, 'filas', `ninguna fila en línea con overflowX sin overflowY (${sueltas.slice(0, 3).join(', ')})`)
    void tarjetas
  } finally {
    app.cerrar()
    await new Promise((r) => setTimeout(r, 600))
  }
}

console.log(`\nPrueba de la Tanda V25: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
