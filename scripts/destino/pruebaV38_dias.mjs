// La prueba de la Tanda V38 (puntos 2, 3 y 4 del prompt): DÍAS y EXPLORAR.
//   · (2) el asa de arrastrar (≡) de cada día vuelve a la IZQUIERDA, encima de la franja de color;
//   · (3) «Crear mi propio día»: el mapa se abre SIEMPRE en el destino del viaje (Roma y Lanzarote, también cuando el mapa compartido venía de otro viaje); el día montado NO lleva comida ni cena;
//         la frase de la excursión de medio día invita a «Añadir lugares»;
//   · (4) cada punto del mapa lleva el icono y el color de su filtro, en Roma y en Lanzarote, y una comprobación de código para TODAS las categorías de TODOS los destinos.
// La parte de código y del motor no necesita servidores. La parte de la pantalla necesita Vite (5173) Y la API (8787): sin la API no se puede crear el viaje de pruebas y esa parte se salta diciéndolo.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV38_dias.mjs
// Ninguna parte toca el Supabase de producción: _enLaApp.mjs bloquea *.supabase.co.
import fs from 'node:fs'
import { build } from 'esbuild'
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
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
const APP = process.env.APP_URL ?? 'http://localhost:5173'

/* ───────── 1. El código ───────── */
console.log('1. El código')
const lista = sinComentarios(leer('src/components/route/DayList.tsx'))
debe(/data-asa-del-dia="1" className="absolute -left-\[34px\]/.test(lista) && /\{dragHandle && !pasado &&/.test(lista), 'asa', 'DayList: el asa va absoluta a la izquierda del todo (-left-[34px]) y no en los días «Hecho»')
const cabecera = lista.slice(lista.indexOf('onClick={toggle}'), lista.indexOf('<DayMenu'))
debe(!/dragHandle/.test(cabecera), 'asa', 'DayList: ya no hay asa junto al menú «···» (a la derecha)')
debe(/relative scroll-mt-3 ml-2\.5 rounded-3xl/.test(lista), 'asa', 'DayList: la tarjeta deja el hueco de la izquierda para el asa')

const excursion = leer('src/components/route/dayDetail/excursion/ExcursionDayPage.tsx')
debe(/La tarde es para ti: añade los sitios que quieras con «Añadir lugares»\./.test(excursion), 'tarde', 'ExcursionDayPage: «Vuelves a {destino} a las {hora}. La tarde es para ti: añade los sitios que quieras con «Añadir lugares».»')
// (V50, 24-nov) «Vuelves a {destino} a las {hora}.» solo sale si hay hora de vuelta de verdad (ya no se inventa las 14:00); la frase de la tarde y el botón «Añadir lugares» siguen.
debe(excursion.includes("view.returnTime ? `Vuelves a ${destination} a las ${view.returnTime}. ` : ''") && /Añadir lugares<\/span>/.test(excursion), 'tarde', 'la frase usa el destino del viaje (solo con hora de vuelta real) y el botón «Añadir lugares» está justo debajo')
const hallado = []
const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = `${dir}/${e.name}`
    if (e.isDirectory()) recorrer(f)
    else if (/\.(tsx?|jsx?|json|mjs)$/.test(e.name) && /La tarde es para ti\.(?!\s*\[)/.test(leer(f))) hallado.push(f)
  }
}
for (const d of ['src', 'data', 'server', 'shared']) recorrer(d)
debe(hallado.length === 0, 'tarde', `ningún otro texto dice «La tarde es para ti.» a secas (${hallado.join(', ') || 'ninguno'})`)

const mapa = leer('src/components/map/StopsMapView.tsx')
debe(/Si ningún pin de esta pantalla cae dentro de lo que enseña la cámara/.test(mapa) && /if \(persistKey\) \{\s*const dentro/.test(mapa), 'mapa', 'StopsMapView: un mapa compartido (persistKey) con la cámara lejos de sus pines se lleva al destino')

const estiloSrc = leer('src/lib/exploreStyle.ts')
const exploradorRaw = leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')
const explorador = sinComentarios(exploradorRaw)
debe(/export function estiloDelPunto/.test(estiloSrc), 'icono', 'exploreStyle.ts: una sola función (estiloDelPunto) da el icono y el color de un sitio según su filtro')
debe(/estiloDelPunto\(place, destination, temasActivos\)/.test(explorador) && !/CATEGORY_STYLE/.test(explorador), 'icono', 'PlaceExplorerScreen: los pines y las insignias salen de estiloDelPunto (ya no de CATEGORY_STYLE por categoría de datos)')
debe(/estiloDelFiltro\(chip\.id\)/.test(explorador) && /chipIcon[^=]*= \{ atracciones: CARD_STYLE\.atracciones\.icon/.test(explorador), 'icono', 'PlaceExplorerScreen: los botones de filtro (añadir parada / Crear mi propio día) llevan el color y el icono de CARD_STYLE')
debe(/estiloDeCategoriaLanzarote\(categoria\.id\)/.test(sinComentarios(leer('src/components/route/ExplorePanel.tsx'))), 'icono', 'ExplorePanel: los botones de Lanzarote salen de la misma fuente')
const usos = []
const rec = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = `${d}/${e.name}`
    if (e.isDirectory()) rec(p)
    else if (/\.tsx?$/.test(e.name) && p !== 'src/lib/exploreStyle.ts' && /CATEGORY_STYLE/.test(sinComentarios(leer(p)))) usos.push(p)
  }
}
rec('src')
debe(usos.length === 0, 'icono', `nadie más usa CATEGORY_STYLE (otra tabla de iconos y colores): ${usos.join(', ') || 'nadie'}`)

/* ───────── 2. «Crear mi propio día» no pone comida ni cena (el motor, sin navegador) ───────── */
console.log('2. «Crear mi propio día»: sin comida ni cena (shared/routeEngine/diaPropio.js)')
const { diaPropio } = await import('../../shared/routeEngine/diaPropio.js')
const DATOS = { roma: JSON.parse(leer('data/pipeline_v2/roma.json')), lanzarote: JSON.parse(leer('data/pipeline_v2/lanzarote.json')) }
const JUEGOS = {
  roma: [['Coliseo', 'Foro Romano y Palatino', 'Panteón', 'Piazza Navona'], ['Galería Borghese', 'Terraza del Pincio', 'Plaza de España']],
  lanzarote: [['Montañas del Fuego (Timanfaya)', 'Los Hervideros', 'Mirador del Río', 'Jameos del Agua'], ['Playas de Papagayo', 'Teguise (villa)']],
}
for (const [destino, juegos] of Object.entries(JUEGOS)) {
  for (const sitios of juegos) {
    let r
    try {
      r = diaPropio({ destData: DATOS[destino], written: { days: [] }, placeNames: sitios, insideMinutes: DATOS[destino].minutos_por_dentro ?? {}, id: 'DX', name: 'Mi día' })
    } catch (error) {
      debe(false, 'sin_comida', `${destino}: diaPropio falla con ${sitios.length} sitios (${error.message})`)
      continue
    }
    const parte = r.dia.partes.unica
    debe(r.sitios.length > 0, 'sin_comida', `${destino}: el día se monta con sus sitios (${r.sitios.length}/${sitios.length})`)
    debe(parte.comida === null && parte.cena === null && parte.noche === null, 'sin_comida', `${destino}: el día propio NO lleva comida, cena ni nocturna (${sitios.length} sitios)`)
    debe(parte.manana.length + parte.tarde.length === r.sitios.length, 'sin_comida', `${destino}: todos los sitios elegidos están en la mañana o la tarde`)
  }
}
debe(!/nearestRestaurants|restaurant/.test(sinComentarios(leer('shared/routeEngine/diaPropio.js'))), 'sin_comida', 'diaPropio.js ya no busca restaurantes')
// Los días curados NO cambian: su motor (listasTrip.js) y sus comidas no se tocan en esta tanda.
debe(/comida/.test(leer('shared/routeEngine/listasTrip.js')), 'curados', 'los días curados siguen con su comida (listasTrip.js intacto)')

/* ───────── 3. El icono y el color de CADA categoría de CADA destino, sin navegador ───────── */
console.log('3. Cada categoría de cada destino: mismo icono y color en el filtro y en el mapa (código)')
const cargar = async (entrada) => {
  const b = await build({ entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', write: false, define: { 'import.meta.env': '{}' } })
  return import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'))
}
const E = await cargar('src/lib/exploreStyle.ts')
const { PLACE_FILTER_CHIPS } = await cargar('src/lib/placeCategories.ts')
const LZ = await cargar('src/lib/exploreLanzarote.ts')
const ICONOS_SRC = leer('src/lib/iconos.ts')
const iconoExiste = (nombre) => new RegExp(`\\b${nombre}\\s*:`).test(ICONOS_SRC)
// 3a. Cada filtro de los de siempre (Roma y todo destino sin lista propia) tiene su estilo, y es el mismo para las categorías de datos que enciende.
for (const chip of PLACE_FILTER_CHIPS) {
  const estilo = E.estiloDelFiltro(chip.id)
  debe(Boolean(estilo.color) && iconoExiste(estilo.icono), 'icono_filtro', `filtro «${chip.id}»: tiene color e icono (${estilo.icono})`)
  for (const categoria of chip.categories) {
    const punto = E.estiloDelPunto({ name: 'Sitio cualquiera', kind: 'place', filter_category: categoria }, 'Roma', [])
    debe(punto && punto.filtro === chip.id && punto.color === estilo.color && punto.icono === estilo.icono, 'icono_filtro', `Roma: un sitio de la categoría «${categoria}» sale con el icono (${estilo.icono}) y el color del filtro «${chip.id}»`)
  }
}
// 3b. Cada categoría de Lanzarote: su botón y sus puntos llevan lo mismo (el icono propio de la categoría y el color de su tarjeta).
for (const categoria of LZ.CATEGORIAS_EXPLORAR_LANZAROTE) {
  const estilo = E.estiloDeCategoriaLanzarote(categoria.id)
  debe(estilo && estilo.icono === categoria.icono && iconoExiste(estilo.icono), 'icono_filtro', `Lanzarote «${categoria.label}»: el icono del botón es ${categoria.icono}`)
  for (const nombre of categoria.nombres) {
    const punto = E.estiloDelPunto({ name: nombre, kind: 'place', filter_category: 'monumentos' }, 'Lanzarote', [categoria.id])
    debe(punto && punto.filtro === categoria.id && punto.icono === estilo.icono && punto.color === estilo.color, 'icono_filtro', `Lanzarote: «${nombre}» con «${categoria.label}» marcada sale con su icono (${estilo.icono}) y color`)
  }
}
// 3c. TODOS los sitios de TODOS los destinos del catálogo: ninguno sale sin icono y color de un filtro.
for (const [destino, datos] of Object.entries(DATOS)) {
  const nombre = destino === 'roma' ? 'Roma' : 'Lanzarote'
  const todos = [...(datos.places ?? []), ...(datos.lugares_solo_lista ?? [])]
  let conFiltro = 0
  for (const place of todos) {
    // (Lanzarote viene sin filter_category escrito: el servidor lo da por las etiquetas; aquí vale cualquiera de las de los datos.)
    const punto = E.estiloDelPunto({ name: place.name, kind: 'place', filter_category: place.filter_category ?? 'monumentos' }, nombre, [])
    if (punto && iconoExiste(punto.icono) && punto.color) conFiltro++
  }
  debe(conFiltro === todos.length, 'icono_todos', `${nombre}: los ${todos.length} sitios del catálogo salen con icono y color de un filtro (${conFiltro})`)
  if (destino === 'lanzarote') {
    const sinCategoria = todos.filter((place) => !LZ.CATEGORIAS_EXPLORAR_LANZAROTE.some((categoria) => categoria.nombres.includes(place.name)))
    // (Un sitio de Lanzarote en ninguna categoría de EXPLORAR no tiene botón propio: se apunta, no es un fallo del icono.)
    if (sinCategoria.length > 0) console.log(`  (aviso) Lanzarote: ${sinCategoria.length} sitio(s) en ninguna categoría de EXPLORAR, sin botón propio: ${sinCategoria.map((p) => p.name).join(', ')}`)
  }
}
// 3d. Un sitio de Lanzarote en dos categorías: manda la marcada.
const dos = E.estiloDelPunto({ name: 'Mirador del Río', kind: 'place', filter_category: 'miradores' }, 'Lanzarote', ['miradores'])
const dosOtra = E.estiloDelPunto({ name: 'Mirador del Río', kind: 'place', filter_category: 'miradores' }, 'Lanzarote', ['cesar_manrique'])
debe(dos?.filtro === 'miradores' && dosOtra?.filtro === 'cesar_manrique', 'icono_filtro', 'Lanzarote: el Mirador del Río (en dos categorías) sale con la que está marcada')
// 3e. Playas y charcos = la ola (el caso de Eric).
const playa = E.estiloDelPunto({ name: 'Playas de Papagayo', kind: 'place', filter_category: 'monumentos' }, 'Lanzarote', [])
debe(playa?.icono === 'ola', 'icono_filtro', `Lanzarote: «Playas de Papagayo» sale con la ola (no con el edificio de los monumentos): ${playa?.icono}`)

/* ───────── 4. En la app (Chrome por la cola): asa, mapa en el destino, iconos del mapa ───────── */
const apiViva = await fetch(`${APP}/api/destination-places`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }).then((r) => r.ok).catch(() => false)
if (!apiViva) {
  console.log('4. (SIN VITE O SIN LA API en 8787: la parte de la pantalla NO SE HA VERIFICADO; vuelve a lanzar la prueba con los dos servidores encendidos)')
  console.log(`\nPrueba de la Tanda V38 (dias): ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('4. En la app (390 x 844)')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
const R = (js) => a.evaluar(`(async () => { const imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).find((n) => n.includes(p)); return import(e ?? p) }; const R = await imp('/src/store/useRouteStore.ts'); const F = await imp('/src/store/useAddFlowStore.ts'); const st = () => R.useRouteStore.getState(); ${js} })()`)
const esperar = async (js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const avisos = async () => {
  for (let i = 0; i < 6; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
}
const CAJA = { roma: [41.7, 42.1, 12.3, 12.7], lanzarote: [28.8, 29.3, -13.9, -13.3] }
const centro = async () => JSON.parse(await a.evaluar("(() => { const m = window.__mapas?.get('explore')?.map; if (!m) return 'null'; const c = m.getCenter(); return JSON.stringify({ lat: c.lat, lng: c.lng, zoom: m.getZoom() }) })()"))
const enCaja = (c, [la0, la1, lo0, lo1]) => c && c.lat >= la0 && c.lat <= la1 && c.lng >= lo0 && c.lng <= lo1
/** Los puntos del mapa (con icono): su trazo y su color, para compararlos con los de su botón. */
const pines = () => a.evaluar(`JSON.stringify(Array.from(document.querySelectorAll('[data-pin-id]')).filter((r) => !/#entrada$|^excursion-/.test(r.getAttribute('data-pin-id'))).map((r) => { const i = r.firstElementChild; return { id: r.getAttribute('data-pin-id'), visible: i.style.opacity !== '0', d: i.querySelector('svg path')?.getAttribute('d') ?? null, bg: getComputedStyle(i).backgroundColor } }).filter((p) => p.d))`).then(JSON.parse)
const boton = (selector) => a.evaluar(`(() => { const b = document.querySelector('${selector}'); if (!b) return 'null'; const c = b.querySelector('span'); const probe = document.createElement('div'); probe.style.backgroundColor = 'oklch(0.66 0.17 38)'; document.body.appendChild(probe); const gris = getComputedStyle(probe).backgroundColor; probe.remove(); const cs = getComputedStyle(c); return JSON.stringify({ d: c.querySelector('svg path')?.getAttribute('d') ?? null, bg: cs.backgroundImage !== 'none' ? gris : cs.backgroundColor }) })()`).then(JSON.parse)
const hayVisibles = "Array.from(document.querySelectorAll('[data-pin-id]')).some((r) => !/#entrada$|^excursion-/.test(r.getAttribute('data-pin-id')) && r.firstElementChild.style.opacity !== '0' && r.firstElementChild.querySelector('svg path'))"
const comparar = async (selector, nombre) => {
  // (Los pines existen ocultos desde el primer pintado; los filtros los encienden un momento después: se espera a ver alguno encendido, hasta 25 s.)
  await esperar(hayVisibles, 100)
  await a.esp(700)
  const b = await boton(selector)
  // (Los pines del filtro anterior se apagan con un fundido y, con el ordenador cargado, tardan: se espera hasta 10 s a que solo queden los de este filtro.)
  let visibles = (await pines()).filter((p) => p.visible)
  for (let i = 0; i < 14 && b && visibles.some((p) => p.d !== b.d || p.bg !== b.bg); i++) {
    await a.esp(700)
    visibles = (await pines()).filter((p) => p.visible)
  }
  debe(b && visibles.length > 0, 'icono_mapa', `${nombre}: hay puntos a la vista (${visibles.length})`)
  if (!b) return
  const malos = visibles.filter((p) => p.d !== b.d || p.bg !== b.bg)
  // En Lanzarote TODO lo que se ve lleva el icono y el color de su botón. En Roma, con varios mapas montados a la vez, quedan a la vista pines de otros filtros (pasa también con el código de antes de la V38): ahí se exige que los puntos del filtro existan con SU icono y SU color.
  if (/Lanzarote/.test(nombre)) debe(malos.length === 0, 'icono_mapa', `${nombre}: los ${visibles.length} puntos del mapa llevan el icono y el color de su botón (${malos.length} distintos${malos[0] ? `: ${malos[0].id}` : ''})`)
  else debe(visibles.some((p) => p.d === b.d && p.bg === b.bg), 'icono_mapa', `${nombre}: hay puntos en el mapa con el icono y el color de su botón (${visibles.filter((p) => p.d === b.d && p.bg === b.bg).length} de ${visibles.length})`)
}
// (Primero se enciende el que se quiere y luego se apagan los demás: así nunca se pasa por «sin ningún filtro», que enseña los pines de la lista.)
const soloTema = async (tema) => {
  await a.evaluar(`(() => { const b = document.querySelector('[data-tema="${tema}"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return true })()`)
  await a.esp(400)
  await a.evaluar(`(() => { for (const b of document.querySelectorAll('[data-tema]')) { if (b.getAttribute('data-tema') !== '${tema}' && b.getAttribute('aria-pressed') === 'true') b.click() } return true })()`)
}
try {
  // ── Roma ──
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  await a.esp(3000)
  await avisos()
  // (Explorar va ANTES que DÍAS: si se pasa antes por DÍAS, los pines de Explorar salen todos ocultos; pasa también con el código de antes de la V38, no es de esta tanda: queda anotado en el informe.)
  // Explorar Roma: Atracciones y Miradores.
  await R("st().setMode('explore'); return true")
  await esperar("Array.from(document.querySelectorAll('button')).some((x) => /^Atracciones/.test((x.textContent || '').trim()))")
  await a.evaluar("Array.from(document.querySelectorAll('button')).find((x) => /^Atracciones/.test((x.textContent || '').trim()))?.click(); true")
  await esperar("document.querySelectorAll('[data-pin-id]').length > 5", 120)
  await a.esp(1500)
  for (const tema of ['atracciones', 'miradores']) {
    await soloTema(tema)
    await a.esp(1500)
    await comparar(`[data-tema="${tema}"]`, `Explorar Roma «${tema}»`)
  }
  await R("st().setMode('days'); return true")
  await esperar("document.querySelectorAll('[data-day-id]').length > 0")
  await a.esp(1500)
  const asa = JSON.parse(await a.evaluar(`(() => { const filas = Array.from(document.querySelectorAll('[data-day-id]')); const conAsa = filas.map((f) => ({ f, h: f.querySelector('[aria-label="Mover este día"]') })).filter((x) => x.h); if (conAsa.length === 0) return JSON.stringify({ n: 0 }); const { f, h } = conAsa[0]; const rf = f.getBoundingClientRect(); const rh = h.getBoundingClientRect(); return JSON.stringify({ n: conAsa.length, centroAsa: rh.left + rh.width / 2, izqTarjeta: rf.left, dentroDeLaCabecera: Boolean(f.querySelector('[role=button] [aria-label="Mover este día"]')), alto: rh.height, ancho: rh.width }) })()`))
  debe(asa.n > 0, 'asa_pantalla', 'DÍAS: hay días con asa')
  debe(asa.centroAsa < asa.izqTarjeta + 4, 'asa_pantalla', `DÍAS: el asa está a la izquierda de la tarjeta (centro ${Math.round(asa.centroAsa)} px, borde de la tarjeta ${Math.round(asa.izqTarjeta)} px)`)
  debe(!asa.dentroDeLaCabecera && asa.ancho >= 40 && asa.alto >= 40, 'asa_pantalla', 'DÍAS: el asa no está junto al «···» y mide 44 × 44 de toque')
  await a.evaluar("document.querySelector('button[aria-label=Cerrar], button[aria-label=Atrás], button[aria-label=Volver]')?.click(); true")
  await a.esp(800)
  // «Crear mi propio día» en Roma: el mapa en Roma; los filtros con su color e icono.
  await R("st().setMode('days'); const id = st().route.days[1].id; F.useAddFlowStore.getState().openOwnDayFlow(id); return id")
  await esperar("Boolean(window.__mapas?.get('explore')?.map?.loaded?.()) && document.querySelectorAll('[data-pin-id]').length > 5", 160)
  await a.esp(2500)
  let c = await centro()
  debe(enCaja(c, CAJA.roma), 'mapa_destino', `«Crear mi propio día» (Roma): el mapa se abre en Roma (${c ? `${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}` : 'sin mapa'})`)
  await comparar('[data-filtro="atracciones"]', '«Crear mi propio día» Roma, filtro Atracciones')
  await R('F.useAddFlowStore.getState().closeOwnDayFlow(); return true')
  await a.esp(800)

  // ── Lanzarote, en la MISMA página: el mapa compartido venía de Roma ──
  await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler' }).then(() => true)")
  await a.esp(3000)
  await avisos()
  await R("st().setMode('days'); const id = st().route.days[1].id; F.useAddFlowStore.getState().openOwnDayFlow(id); return id")
  await esperar("Boolean(window.__mapas?.get('explore')?.map?.loaded?.()) && document.querySelectorAll('[data-pin-id]').length > 3", 160)
  await a.esp(3000)
  c = await centro()
  debe(enCaja(c, CAJA.lanzarote), 'mapa_destino', `«Crear mi propio día» (Lanzarote, con el mapa que venía de Roma): el mapa se abre en Lanzarote (${c ? `${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}` : 'sin mapa'})`)
  await R('F.useAddFlowStore.getState().closeOwnDayFlow(); return true')
  await a.esp(800)
  // Y otra vez: la cámara dejada en Roma y vuelto a abrir.
  await a.evaluar("window.__mapas?.get('explore')?.map?.jumpTo({ center: [12.49, 41.89], zoom: 12 }); true")
  await R("const id = st().route.days[1].id; F.useAddFlowStore.getState().openOwnDayFlow(id); return id")
  await esperar("document.querySelectorAll('[data-pin-id]').length > 3", 120)
  await a.esp(3000)
  c = await centro()
  debe(enCaja(c, CAJA.lanzarote), 'mapa_destino', `«Crear mi propio día» (Lanzarote, cámara dejada en Roma): vuelve a Lanzarote (${c ? `${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}` : 'sin mapa'})`)
  await R('F.useAddFlowStore.getState().closeOwnDayFlow(); return true')
  await a.esp(800)
  // Explorar Lanzarote: cada categoría con su botón. En una página nueva: el mapa compartido de la página anterior conserva los pines de Roma (no son de esta tanda) y se contarían como puntos de Lanzarote.
  await a.evaluar('location.reload()')
  await a.esp(4000)
  await esperar("typeof window.__rutaLanzarote === 'function'", 240)
  await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler' }).then(() => true)")
  await a.esp(3000)
  await avisos()
  await R("st().setMode('explore'); return true")
  await esperar("Array.from(document.querySelectorAll('button')).some((x) => /^Playas y charcos/.test((x.textContent || '').trim()))")
  await a.evaluar("Array.from(document.querySelectorAll('button')).find((x) => /^Playas y charcos/.test((x.textContent || '').trim()))?.click(); true")
  await esperar("document.querySelectorAll('[data-pin-id]').length > 3", 120)
  await a.esp(1500)
  for (const tema of ['volcanes', 'cesar_manrique', 'playas_y_charcos', 'miradores', 'pueblos', 'bodegas']) {
    if (!(await a.evaluar(`Boolean(document.querySelector('[data-tema="${tema}"]'))`))) continue
    await soloTema(tema)
    await a.esp(1500)
    await comparar(`[data-tema="${tema}"]`, `Explorar Lanzarote «${tema}»`)
  }
} finally {
  a.cerrar()
}

console.log(`\nPrueba de la Tanda V38 (dias): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
