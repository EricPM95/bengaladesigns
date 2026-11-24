// La prueba de la Tanda V42 (arreglos que vio Eric en el móvil, 23-nov): filtros de EXPLORAR, «Excursiones y actividades» en RESERVAS, fotos nítidas, Perfil y globo, DÍAS (a mano, «Crear mi propio día», alojamiento) y botones flotantes.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV42.mjs [--capturas]
// Hace falta Vite (5173) y la API (8787). Ninguna parte toca el Supabase de producción (_enLaApp.mjs lo bloquea). Un solo Chrome.
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
const CAP = 'docs/dias/V42_capturas'
const conCapturas = process.argv.includes('--capturas')
if (conCapturas) fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. El código ───────── */
console.log('1. El código')
const mapa = leer('src/components/map/StopsMapView.tsx')
debe(mapa.includes('agrupar?: boolean') && mapa.includes('data-cluster') && mapa.includes('const reagrupar'), 'filtros', 'StopsMapView: agrupa en burbujas con número los pines que se montan unos sobre otros')
debe(/<StopsMapView[\s\S]{0,200}agrupar/.test(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')), 'filtros', 'EXPLORAR monta el mapa con `agrupar`')
const flot = leer('src/components/flotantes/flotantes.ts')
debe(flot.includes('useColumnaIzquierda') && flot.includes('ORDEN_IZQUIERDA') && flot.includes('bottomDeLaFila'), 'flotantes', 'flotantes.ts: la columna de la izquierda (useColumnaIzquierda, ORDEN_IZQUIERDA, bottomDeLaFila)')
for (const f of ['src/components/reorganizar/ReorganizarHost.tsx', 'src/components/propuesta/BotonDePropuesta.tsx']) {
  const t = leer(f)
  debe(t.includes('useColumnaIzquierda') && t.includes('data-flotante-izq') && t.includes('DERECHA_DE_LA_COLUMNA_IZQUIERDA'), 'flotantes', `${f}: va en la columna de la izquierda`)
  debe(!/width: 56/.test(t) && !/right: 15,/.test(t), 'flotantes', `${f}: del mismo tamaño (44), sin el sitio de antes`)
}
debe(!/hayOtroFlotante/.test(leer('src/components/route/hoy/CamaraViaje.tsx')), 'flotantes', 'la cámara ya no sube por Reorganizar ni por el lápiz')
debe(leer('CLAUDE.md').includes('la derecha es fija, los demás van a su izquierda'), 'flotantes', 'la regla está apuntada en CLAUDE.md')
const fotos = await import('../../src/lib/fotoCivitatis.ts').catch(() => null)
// (El .ts no se importa desde Node: se prueba la regla con la misma expresión.)
const grande = (u) => u.replace(/-(m|list|grid)(\.jpe?g)(\?.*)?$/i, '-grid$2$3')
debe(grande('https://f.civitatis.com/espana/arrecife/excursion-isla-graciosa-m.jpg') === 'https://f.civitatis.com/espana/arrecife/excursion-isla-graciosa-grid.jpg', 'fotos', 'la foto grande de «-m.jpg» es la «-grid» (640 px)')
debe(grande('https://cdn2.civitatis.com/italia/roma/excursion-pompeya-sorrento-list.jpg') === 'https://cdn2.civitatis.com/italia/roma/excursion-pompeya-sorrento-grid.jpg', 'fotos', 'la foto grande de «-list.jpg» es la «-grid» (640 px)')
void fotos
for (const f of ['src/components/route/excursions/ExcursionsPage.tsx', 'src/components/route/dayDetail/ExcursionBloque.tsx', 'src/components/route/dayDetail/excursion/ExcursionDayPage.tsx']) debe(leer(f).includes('fotoGrande'), 'fotos', `${f} pide la foto grande`)
debe(/loading="lazy"[^>]*data-foto-grande|data-foto-grande[^>]*loading="lazy"/.test(leer('src/components/route/excursions/ExcursionsPage.tsx')), 'fotos', 'la foto grande de la página de excursiones es perezosa')
const { ordenarActividades } = await import('../../server/paginaDestino.js')
const lista = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
debe(ordenarActividades(lista, ['c', 'a']).map((x) => x.id).join() === 'c,a,b', 'reservas', 'el destino puede poner su orden (orden_actividades): las de la lista primero y en ese orden')
debe(ordenarActividades(lista, undefined) === lista, 'reservas', 'sin orden propio no cambia nada (Roma y Lanzarote)')
const mapaDest = leer('src/components/primeraVez/MapaDeDestinos.tsx')
debe(!/function Lista\b|<Lista /.test(mapaDest) && !/data-destino-lista/.test(mapaDest), 'perfil', '«¿A dónde te apetece ir?»: fuera la lista de destinos del bloque')
const globoSrc = leer('src/components/primeraVez/GloboDeDestinos.tsx')
debe(globoSrc.includes('setPointerCapture') && globoSrc.includes('setArrastre') && globoSrc.includes('data-globo-titulo') && /onTouchStart=\{\(e\) => e\.stopPropagation\(\)\}/.test(globoSrc), 'globo', 'el tirador de la hoja sigue al dedo, coge el puntero y no deja pasar el toque al globo')
const tit = leer('src/lib/tituloDelDia.ts')
debe(tit.includes("DIA_POR_ORGANIZAR = 'Día por organizar'") && tit.includes("AÑADE_TUS_SITIOS = 'Añade tus sitios'"), 'dias', 'tituloDelDia: «Día por organizar» y «Añade tus sitios»')
debe(leer('src/store/useRouteStore.ts').includes('porOrganizar: true'), 'dias', 'pasar un día de excursión a «Crear mi propio día» lo marca «por organizar»')
debe(/ManualDayOptions\(\{ onSearchPlaces, onSearchExcursions, destination \}/.test(leer('src/components/route/dayDetail/ExcursionBlocks.tsx')) && leer('src/components/route/dayDetail/ExcursionBlocks.tsx').includes('`Desde ${destination}`'), 'dias', '«explora {destino}» y «Desde {destino}» (Lanzarote no es una ciudad)')
const aloj = leer('src/components/route/dayDetail/AccommodationBlock.tsx')
debe(aloj.includes('data-alojamiento-visto') && aloj.includes('data-alojamiento-direccion') && aloj.includes('zonaCorta') && !/>\s*Ir\s*</.test(aloj.slice(aloj.indexOf('// A2'))), 'alojamiento', 'tarjeta del alojamiento: verde, ✓, dirección con pin y botón redondo sin la palabra «Ir»')

/* ───────── 2. En la app ───────── */
const apiViva = await fetch(`${APP}/api/destino-pagina`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }).then((r) => r.ok).catch(() => false)
if (!apiViva) {
  console.log('2. (SIN VITE O SIN LA API en 8787: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la Tanda V42: ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('2. En la app (390 x 844)')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', ancho: 390, alto: 844 })
const R = (js) => a.evaluar(`(async () => { const imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; const R = await imp('/src/store/useRouteStore.ts'); const M = await imp('/src/lib/manualRoute.ts'); const X = await imp('/src/store/useExcursionsStore.ts'); const Z = await imp('/src/store/useReorganizarStore.ts'); const st = () => R.useRouteStore.getState(); ${js} })()`)
const esperar = async (js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const avisos = async () => {
  for (let i = 0; i < 6; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()").catch(() => false)
    if (!h) break
    await a.esp(600)
  }
}
const cap = async (nombre) => {
  if (conCapturas) await a.captura(`${CAP}/${nombre}.jpg`)
}
const J = async (js) => JSON.parse(await a.evaluar(`JSON.stringify(${js})`))
const manual = (inicio, fin) => `const ruta = M.buildManualRoute({ destination: 'Roma', answers: { dateRange: { start: '${inicio}', end: '${fin}' }, origin: 'Madrid', companion: 'couple' }, transportContext: {} }); st().setRoute(ruta)`
try {
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  await a.esp(3000)
  await avisos()
  await avisos()

  // ── 1 · EXPLORAR: todos los filtros, todos los puntos ──
  await R("st().setMode('explore'); return true")
  await esperar("document.querySelectorAll('[data-explorar-categorias] button').length > 0")
  await a.evaluar("document.querySelector('[data-explorar-categorias] button')?.click(); true")
  await esperar("document.querySelectorAll('[data-filtro], [data-tema]').length >= 3", 120)
  await a.esp(2500)
  const filtros = await J("Array.from(document.querySelectorAll('[data-filtro], [data-tema]')).map((b) => b.getAttribute('data-filtro') || b.getAttribute('data-tema'))")
  debe(filtros.length >= 5, 'filtros', `EXPLORAR de Roma tiene todos los filtros (${filtros.join(', ')})`)
  const total = () => J("(() => { let singles = 0, bur = 0; for (const r of document.querySelectorAll('[data-pin-id]')) { const i = r.firstElementChild; if (i.style.opacity !== '0' && r.style.pointerEvents !== 'none') singles++ } for (const c of document.querySelectorAll('[data-cluster]')) bur += Number(c.getAttribute('data-cluster')); return { singles, bur, total: singles + bur } })()")
  const apagado = (f) => a.evaluar(`document.querySelector('[data-filtro="${f}"], [data-tema="${f}"]')?.getAttribute('aria-pressed') !== 'true'`)
  // Todos apagados menos uno al empezar: se enciende uno a uno y el total de puntos a la vista nunca baja.
  let antes = (await total()).total
  let nunca_baja = true
  let detalle = ''
  for (const f of filtros) {
    if (await apagado(f)) await a.evaluar(`document.querySelector('[data-filtro="${f}"], [data-tema="${f}"]')?.click(); true`)
    await a.esp(1600)
    const t = await total()
    detalle += `${f}:${t.total} `
    if (t.total < antes) nunca_baja = false
    antes = t.total
  }
  debe(nunca_baja, 'filtros', `al encender los filtros uno a uno el total de puntos a la vista nunca baja (${detalle.trim()})`)
  const fin = await total()
  const marcados = await J("Array.from(document.querySelectorAll('[data-filtro], [data-tema]')).filter((b) => b.getAttribute('aria-pressed') === 'true').length")
  debe(marcados === filtros.length, 'filtros', `con todos los filtros marcados (${marcados} de ${filtros.length}) siguen todos a la vista: ${fin.singles} sueltos + ${fin.bur} en burbujas = ${fin.total}`)
  debe(fin.total >= 150, 'filtros', `ningún filtro deja el mapa sin sus puntos (${fin.total} en total)`)
  debe(fin.bur === 0 || (await J("document.querySelectorAll('[data-cluster]').length")) > 0, 'filtros', 'lo que no cabe se agrupa en burbujas con su número')
  await cap('1_filtros_todos')
  // Tocar una burbuja acerca el mapa (no hace desaparecer nada).
  const hayBurbuja = await a.evaluar("Boolean(document.querySelector('[data-cluster]'))")
  if (hayBurbuja) {
    const z0 = await a.evaluar("window.__mapas?.get('explore')?.map?.getZoom?.() ?? 0")
    await a.evaluar("document.querySelector('[data-cluster]').click(); true")
    await a.esp(1500)
    const z1 = await a.evaluar("window.__mapas?.get('explore')?.map?.getZoom?.() ?? 0")
    const t = await total()
    debe(z1 > z0 && t.total >= 1, 'filtros', `tocar una burbuja acerca el mapa (zoom ${Number(z0).toFixed(1)} → ${Number(z1).toFixed(1)}) y los puntos siguen a la vista (${t.total})`)
  }
  await R("st().setMode('days'); return true")
  await a.esp(800)

  // ── 2 · RESERVAS: «Excursiones y actividades», siempre ──
  await R(`${manual('2026-11-26', '2026-11-27')}; st().setMode('bookings'); return 1`)
  await esperar("Boolean(document.querySelector('[data-cabecera-excursiones]'))", 80)
  await a.esp(1500)
  const bloque = await J("(() => { const c = document.querySelector('[data-cabecera-excursiones]'); return { hay: Boolean(c), txt: (c?.innerText || '').split(String.fromCharCode(10)).join(' | '), contador: Array.from(document.querySelectorAll('*')).filter((e) => e.children.length === 0 && /^[0-9]+ de [0-9]+/.test((e.textContent || '').trim())).map((e) => e.textContent.trim())[0] || null } })()")
  debe(bloque.hay && /Excursiones y actividades/.test(bloque.txt), 'reservas', `en un viaje de 2 días RESERVAS enseña «Excursiones y actividades» (${bloque.txt})`)
  debe(/Ninguna en tu ruta/.test(bloque.txt), 'reservas', 'sin excursión ni actividad en la ruta dice «Ninguna en tu ruta»')
  debe(/^0 de 3\b/.test(bloque.contador ?? ''), 'reservas', `el «0 de X» no cuenta las excursiones ni las actividades que no están en la ruta (${bloque.contador}: llegada y vuelta, alojamiento y seguro)`)
  await a.evaluar("document.querySelector('[data-cabecera-clara=excursiones]')?.click(); true")
  await esperar("Boolean(document.querySelector('[data-carrusel-actividades-reservas]'))", 60)
  await a.esp(1200)
  const delBloque = await J("Array.from(document.querySelectorAll('[data-carrusel-actividades-reservas] [data-actividad]')).map((e) => e.getAttribute('data-actividad'))")
  const delServidor = await a.evaluar("fetch('/api/destino-pagina', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }).then((r) => r.json()).then((j) => JSON.stringify(j.actividades.map((x) => x.id)))").then((t) => JSON.parse(t))
  debe(delBloque.length > 0 && delBloque.join() === delServidor.join(), 'reservas', `enseña las mismas actividades y en el mismo orden que el carrusel de la página del destino (${delBloque.length}: ${delBloque.join(', ')})`)
  debe((await a.evaluar("document.querySelectorAll('[data-ya-tengo-excursion]').length")) === 1, 'reservas', '«¿Ya tienes una? Añádela» sale una sola vez')
  debe((await a.evaluar("document.querySelectorAll('[data-ver-todas-excursiones]').length")) === 1, 'reservas', '[Ver todas] sale una vez')
  await cap('2_reservas_excursiones_y_actividades')
  await a.evaluar("document.querySelector('[data-ver-todas-excursiones]')?.click(); true")
  await a.esp(900)
  debe((await a.evaluar("Boolean(document.querySelector('[data-todas-actividades]'))")) === true, 'reservas', '[Ver todas] abre la página de todas las actividades (V45; ya no EXPLORAR)')
  await a.evaluar("document.querySelector('[data-cerrar-todas]')?.click(); true")
  await a.esp(400)
  await R("st().setMode('days'); return true")

  // ── 3 · Las fotos de las excursiones, más nítidas ──
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  await a.esp(3000)
  await avisos()
  await R('X.useExcursionsStore.getState().openPage(false); return true')
  await esperar("document.querySelectorAll('[data-foto-grande]').length > 0", 80)
  await a.esp(1000)
  // Perezosas: se acercan una a una para que bajen.
  const n = await a.evaluar("document.querySelectorAll('[data-foto-grande]').length")
  for (let i = 0; i < Math.min(n, 12); i++) {
    await a.evaluar(`document.querySelectorAll('[data-foto-grande]')[${i}]?.scrollIntoView({ block: 'center' }); true`)
    await a.esp(700)
  }
  await a.esp(2500)
  const fot = await J("Array.from(document.querySelectorAll('[data-foto-grande]')).map((i) => ({ src: i.currentSrc || i.src, nat: i.naturalWidth, ancho: i.clientWidth, completa: i.complete }))")
  const cargadas = fot.filter((f) => f.completa && f.nat > 0)
  debe(fot.length > 0 && cargadas.length > 0, 'fotos', `la página de excursiones pone sus fotos grandes (${fot.length}, ${cargadas.length} ya bajadas)`)
  debe(cargadas.every((f) => f.nat >= 1.7 * f.ancho), 'fotos', `cada foto grande (640 px, la mayor «ligera» de Civitatis) mide al menos 1,7 veces su ancho en pantalla (${cargadas.map((f) => `${f.nat}/${f.ancho}`).join(', ')})`)
  debe(fot.every((f) => !/-(m|list|grid)\.jpe?g/i.test(f.src)), 'fotos', 'ninguna es la pequeña de Civitatis (-m / -list)')
  debe((await a.evaluar("Array.from(document.querySelectorAll('[data-foto-grande]')).every((i) => i.getAttribute('loading') === 'lazy')")), 'fotos', 'todas son perezosas')
  await cap('3_fotos_excursiones')
  await a.evaluar("document.querySelector('button[aria-label=Cerrar]')?.click(); true")
  await R('X.useExcursionsStore.getState().closePage(); st().setMode("days"); return true')
  await a.esp(500)

  // ── 5.1 · Viaje a mano ──
  await R(`${manual('2026-11-26', '2026-11-29')}; st().setMode('days'); return 1`)
  await esperar("document.querySelectorAll('[data-day-id]').length === 4", 80)
  await a.esp(1200)
  const titulos = await J("Array.from(document.querySelectorAll('[data-day-id]')).map((d) => (d.querySelector('[data-titulo-del-dia]')?.textContent || '').trim())")
  debe(titulos.join('|') === 'Día de viaje|Día por organizar|Día por organizar|Día de viaje', 'dias', `viaje a mano de 4 días: ${titulos.join(' | ')}`)
  debe((await a.evaluar("document.querySelectorAll('[data-anade-tus-sitios]').length")) === 2, 'dias', 'los días por organizar dicen «Añade tus sitios» debajo')
  debe(!titulos.includes('Centro histórico') && !titulos.includes('Día libre'), 'dias', 'ningún día de un viaje a mano sale con un nombre que no puso el viajero («Centro histórico», «Día libre»)')
  await cap('5_1_dias_a_mano')

  // ── 5.2 · «Crear mi propio día» ──
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  await a.esp(3000)
  await avisos()
  await R("const id = st().route.days[1].id; st().convertDayType(id, 'excursion'); st().convertDayType(id, 'manual'); st().setMode('days'); st().setActiveDayId(id); return id")
  await a.esp(2500)
  const propio = await J("(() => { const d = document.querySelectorAll('[data-day-id]')[1]; const botones = Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim()); return { titulo: (d?.querySelector('[data-titulo-del-dia]')?.textContent || '').trim(), texto: document.body.innerText, anadir: botones.filter((t) => /^\\+?\\s*Añadir lugares$/.test(t)).length, buscar: botones.some((t) => /^Buscar lugares/.test(t)), excursiones: botones.some((t) => /^Buscar excursiones/.test(t)) } })()")
  debe(propio.titulo === 'Día por organizar', 'dias', `el día de excursión pasado a «Crear mi propio día» se llama «${propio.titulo}»`)
  debe(propio.buscar && propio.excursiones, 'dias', 'la pantalla del día en blanco tiene [Buscar lugares] y [Buscar excursiones]')
  debe(propio.anadir === 0, 'dias', `sin [+ Añadir lugares] debajo (${propio.anadir})`)
  debe(/explora Roma o haz una excursión/.test(propio.texto) && /Desde Roma/.test(propio.texto), 'dias', 'los textos llevan el destino: «explora Roma…» y «Desde Roma»')
  await cap('5_2_crear_mi_propio_dia')

  // ── 5.4 · La tarjeta del alojamiento con él puesto ──
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  await a.esp(3000)
  await avisos()
  await R("const r = st().route; const primero = r.days[0].id; st().setRoute({ ...r, accommodationZone: 'centro', accommodationAddress: 'Via del Corso 18, 00186 Roma' }); st().setAccommodationSelection ? st().setAccommodationSelection(primero, { name: 'Hotel Prueba Roma' }) : R.useRouteStore.setState({ accommodationSelections: { [primero]: { name: 'Hotel Prueba Roma' } } }); st().setMode('days'); return 1")
  await esperar("Boolean(document.querySelector('[data-alojamiento-dia-bloque]'))", 60)
  await a.esp(1500)
  const tarj = await J(`(() => {
    const t = document.querySelector('[data-alojamiento-dia-bloque]'); if (!t) return null
    const r = (s) => { const e = t.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height, txt: (e.textContent || '').trim() } }
    const cs = getComputedStyle(t)
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d'); cx.fillStyle = cs.borderTopColor; cx.fillRect(0, 0, 1, 1); const rgb = Array.from(cx.getImageData(0, 0, 1, 1).data)
    return { borde: rgb, etiqueta: r('[data-alojamiento-etiqueta]'), nombre: r('[data-alojamiento-nombre]'), direccion: r('[data-alojamiento-direccion]'), visto: r('[data-alojamiento-visto]'), boton: r('[data-alojamiento-dia^="ir"]'), cama: r('[data-alojamiento-cama]'), tarjeta: r('[data-alojamiento-dia-bloque]') }
  })()`)
  debe(tarj && tarj.etiqueta && /^ALOJAMIENTO · CENTRO$/.test(tarj.etiqueta.txt), 'alojamiento', `la etiqueta dice «ALOJAMIENTO · {ZONA CORTA}» (${tarj?.etiqueta?.txt})`)
  debe(tarj && tarj.borde[1] > tarj.borde[0] && tarj.borde[1] >= tarj.borde[2] - 40, 'alojamiento', `el borde de la tarjeta es verde (${tarj?.borde?.slice(0, 3).map((x) => Math.round(x)).join(',')})`)
  debe(tarj?.visto && tarj.visto.r > tarj.cama.r - 12 && tarj.visto.t < tarj.cama.t + 10, 'alojamiento', 'el ✓ verde está en la esquina del icono de la cama')
  debe(tarj?.nombre?.txt === 'Hotel Prueba Roma', 'alojamiento', 'debajo de la etiqueta, el nombre del alojamiento')
  debe(tarj?.direccion && /Via del Corso 18/.test(tarj.direccion.txt), 'alojamiento', `la dirección va debajo, tal como la puso el viajero (${tarj?.direccion?.txt})`)
  debe(tarj?.boton && Math.abs(tarj.boton.w - tarj.boton.h) < 2 && !/Ir/.test(tarj.boton.txt), 'alojamiento', `el botón es redondo y sin la palabra «Ir» (${tarj?.boton?.w}x${tarj?.boton?.h})`)
  debe(tarj?.boton && tarj.etiqueta.r <= tarj.boton.l + 1 && tarj.nombre.r <= tarj.boton.l + 1 && tarj.direccion.r <= tarj.boton.l + 1, 'alojamiento', 'nada se mete debajo del botón (etiqueta, nombre y dirección acaban antes que él)')
  await a.evaluar("document.querySelector('[data-alojamiento-dia-bloque]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(700)
  await cap('5_4_alojamiento')
  // Una zona con nombre largo no empuja el botón.
  await R("const r = st().route; st().setRoute({ ...r, accommodationZone: 'centro' }); return 1")
  const largo = await J("(() => { const e = document.querySelector('[data-alojamiento-etiqueta]'); const b = document.querySelector('[data-alojamiento-dia^=\"ir\"]'); return e && b ? { etiquetaFin: e.getBoundingClientRect().right, botonIni: b.getBoundingClientRect().left } : null })()")
  debe(!largo || largo.etiquetaFin <= largo.botonIni + 1, 'alojamiento', 'la etiqueta no se mete debajo del botón')
  // Sin dirección, sin botón.
  await R("const r = st().route; st().setRoute({ ...r, accommodationAddress: '' }); return 1")
  await a.esp(900)
  debe((await a.evaluar("document.querySelectorAll('[data-alojamiento-dia-bloque] [data-alojamiento-dia^=\"ir\"]').length")) === 0, 'alojamiento', 'sin dirección, el botón de la flecha no sale')

  // ── 6 · Botones flotantes: ninguno encima de otro ──
  await avisos()
  await R("st().setMode('days'); Z.useReorganizarStore.setState({ dias: [{ dayId: st().route.days[0].id }] }); return 1")
  await a.esp(2500)
  const flo = await J(`(() => {
    const cajas = []
    for (const e of document.querySelectorAll('[data-flotante], [data-boton-cuentanos], [data-boton-logros], [data-camara-viaje="boton"]')) {
      const b = e.getBoundingClientRect(); if (b.width === 0 || b.height === 0) continue
      cajas.push({ k: e.getAttribute('data-boton-reorganizar') ? 'reorganizar' : e.getAttribute('data-boton-propuesta') ? 'lapiz' : e.getAttribute('data-boton-logros') ? 'logros' : e.getAttribute('data-boton-cuentanos') ? 'avisos' : 'camara', l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height, izq: e.hasAttribute('data-flotante-izq') })
    }
    const unicas = cajas.filter((c, i) => cajas.findIndex((o) => o.k === c.k && Math.abs(o.l - c.l) < 1 && Math.abs(o.t - c.t) < 1) === i)
    const pisa = []
    for (let i = 0; i < unicas.length; i++) for (let j = i + 1; j < unicas.length; j++) { const x = unicas[i], y = unicas[j]; const dx = Math.min(x.r, y.r) - Math.max(x.l, y.l), dy = Math.min(x.b, y.b) - Math.max(x.t, y.t); if (dx > 1 && dy > 1) pisa.push(x.k + ' / ' + y.k) }
    return { cajas: unicas, pisa }
  })()`)
  const porNombre = Object.fromEntries(flo.cajas.map((c) => [c.k, c]))
  debe(Boolean(porNombre.reorganizar) && Boolean(porNombre.logros), 'flotantes', `se ven Reorganizar y Logros (${flo.cajas.map((c) => c.k).join(', ')})`)
  debe(flo.pisa.length === 0, 'flotantes', `ningún botón flotante encima de otro (${flo.pisa.join('; ') || 'ninguno'})`)
  debe(flo.cajas.every((c) => Math.abs(c.w - 44) < 1.5 && Math.abs(c.h - 44) < 1.5), 'flotantes', `todos miden 44 (${flo.cajas.map((c) => `${c.k} ${Math.round(c.w)}x${Math.round(c.h)}`).join(', ')})`)
  if (porNombre.reorganizar && porNombre.logros) {
    debe(porNombre.reorganizar.r <= porNombre.logros.l + 0.5 && Math.abs(porNombre.reorganizar.b - porNombre.logros.b) < 1.5, 'flotantes', 'Reorganizar va a la izquierda de Logros, a su misma altura')
    const der = flo.cajas.filter((c) => !c.izq && c.k !== 'reorganizar')
    debe(der.every((c) => Math.abs(c.r - porNombre.logros.r) < 1.5), 'flotantes', 'la columna de la derecha (Logros, Cámara, Avisos) es una sola columna')
  }
  const colorReorg = await a.evaluar("(() => { const b = document.querySelector('[data-boton-reorganizar]'); return b ? getComputedStyle(b).backgroundColor : null })()")
  debe(colorReorg === 'rgb(28, 34, 48)', 'flotantes', `el color no cambia: azul oscuro (${colorReorg})`)
  await cap('6_flotantes')

  // ── 6b · La columna fija (Avisos, Cámara, Logros): misma altura en las cinco pestañas y quieta al cambiar ──
  const posiciones = () => J("(() => { const o = {}; for (const [k, s] of [['logros', '[data-boton-logros]'], ['camara', '[data-camara-viaje=\"boton\"], button[aria-label=\"Tu cámara de viaje\"]'], ['avisos', '[data-boton-cuentanos]']]) { const e = document.querySelector(s); if (e) { const b = e.getBoundingClientRect(); o[k] = [Math.round(b.left), Math.round(b.top)] } } return o })()")
  const refPos = {}
  let quietas = true
  let detalleCol = ''
  for (const modo of ['route', 'days', 'explore', 'bookings', 'today', 'route', 'today', 'days']) {
    await R(`st().setMode('${modo}'); return 1`)
    for (let i = 0; i < 12; i++) {
      await a.esp(120)
      const p = await posiciones()
      for (const k of ['logros', 'camara', 'avisos']) {
        if (!p[k]) continue
        if (!refPos[k]) refPos[k] = p[k]
        else if (Math.abs(p[k][0] - refPos[k][0]) > 1 || Math.abs(p[k][1] - refPos[k][1]) > 1) { quietas = false; detalleCol += `${modo}/${k}:${p[k]} (ref ${refPos[k]}) ` }
      }
    }
  }
  debe(Boolean(refPos.logros) && Boolean(refPos.camara) && Boolean(refPos.avisos), 'flotantes', `los tres botones de la columna fija se ven (${Object.keys(refPos).join(', ')})`)
  debe(quietas, 'flotantes', `Avisos, Cámara y Logros están exactamente en el mismo sitio en RUTA, DÍAS, EXPLORAR, RESERVAS y HOY y no se mueven al cambiar de pestaña (${detalleCol || 'quietos'})`)
  debe(refPos.avisos && refPos.camara && refPos.logros && refPos.camara[1] - refPos.avisos[1] === refPos.logros[1] - refPos.camara[1] && refPos.logros[1] - refPos.camara[1] === 56, 'flotantes', `la columna va a 56 px de paso (${JSON.stringify(refPos)})`)
} finally {
  await a.cerrar?.()
}
console.log(`\nPrueba de la Tanda V42: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
