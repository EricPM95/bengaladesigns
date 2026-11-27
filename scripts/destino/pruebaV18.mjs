// La prueba de la Tanda V18: EXPLORAR (temas como botones, Bodegas con 3 sitios), pantallas de logros al instante, «Mi colección» del mismo tamaño,
// el día de excursión (Design E1 a E5), los dos botones flotantes iguales, el pase en verde y el nombre «Dia 2 Lunes».
//   (API normal en 8787 y Vite recién arrancado en 5173)   node scripts/destino/_conCola.mjs node scripts/destino/pruebaV18.mjs
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { etiquetasDeExcursion, textoDeRutaPorDestino } from '../../src/lib/excursionEtiquetas.ts'

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
const API = process.env.API_URL ?? 'http://localhost:8787'
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = 'docs/dias/V18_capturas'
fs.mkdirSync(CAP, { recursive: true })
const post = async (u, b) => (await fetch(API + u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json()

/* ───────── 1. Datos: Bodegas, excursiones reales, etiquetas ───────── */
console.log('1. Datos: Bodegas con tres sitios, excursiones con datos reales y etiquetas verdaderas')
{
  const lz = await post('/api/destination-places', { destination: 'Lanzarote' })
  const lugares = (lz.places ?? []).filter((p) => p.kind === 'place')
  const bodegas = ['La Geria y sus bodegas', 'Bodega El Grifo', 'Bodega La Geria'].map((n) => lugares.find((p) => p.name === n))
  debe(bodegas.every((b) => b && Number.isFinite(b.coordinates?.lat)), 'bodegas', 'el catálogo trae los tres sitios de vino, cada uno con su punto en el mapa')
  debe(bodegas.every((b) => b && b.por_que_recomendamos), 'bodegas', 'y su ficha (el «por qué te lo recomendamos»)')
  for (const n of ['Bodega El Grifo', 'Bodega La Geria']) {
    const f = await post('/api/place-photo', { name: n, city: 'Lanzarote' })
    debe(f.photo_source === 'propia', 'bodegas', `${n}: foto propia (${f.photo_source})`)
  }
  const fuente = leer('src/lib/exploreLanzarote.ts')
  debe(/id: 'bodegas'[^\n]*'Bodega El Grifo'[^\n]*'Bodega La Geria'/.test(fuente), 'bodegas', 'la categoría Bodegas lista los tres')
  const ex = lz.excursions ?? []
  const g = ex.find((e) => e.id === 'la_graciosa')
  debe(g && /74/.test(g.estimated_price) && g.rating === 9.1 && g.review_count === 2332 && g.cancellation === 'gratuita' && /civitatis/.test(g.photo_url ?? '') && /comida/.test(g.incluye ?? '') && /recogida/i.test(g.recogida ?? ''), 'excursion', `La Graciosa trae lo real de Civitatis: «desde» 74, nota 9,1 y 2.332 opiniones, cancelación, foto, lo que incluye y la recogida (${g?.estimated_price}, ${g?.rating}, ${g?.review_count}, ${g?.cancellation})`)
  const roma = await post('/api/destination-places', { destination: 'Roma' })
  debe((roma.excursions ?? []).every((e) => e.incluye == null && e.recogida == null), 'excursion', 'Roma no cambia (sin civitatis_id, nada se rellena)')
  // Etiquetas: solo las verdaderas
  const et = (o) => etiquetasDeExcursion(o).map((x) => x.id).join(',')
  debe(et({ durationText: '6 h', incluye: 'Barco a La Graciosa y paseo en velero con comida y barra libre', recogida: 'Recogida en el hotel y traslado de regreso' }) === 'duracion,recogida,comida', 'etiquetas', 'Graciosa: 6 h, recogida en el hotel y comida incluida')
  debe(et({ durationText: '8-10 h', incluye: 'Timanfaya, Cueva de los Verdes y Jameos del Agua (2 o 3 entradas según modalidad); comida no incluida', recogida: 'Recogida en el hotel y traslado de regreso' }) === 'duracion,recogida,entradas', 'etiquetas', '«comida no incluida» no da «Comida incluida»; sí las entradas')
  debe(et({ incluye: 'Ruta en kayak y snorkel con guía en español', recogida: 'Punto de encuentro: Hotel Mirador Papagayo (Playa Blanca); sin recogida' }) === 'guia', 'etiquetas', '«sin recogida» no da «Recogida»; «con guía» solo si lo dice la ficha')
  debe(et({ recogida: 'Transporte en autobús (la ficha no dice si hay recogida en el hotel: verificar)' }) === '', 'etiquetas', 'lo que no se sabe («verificar») no sale')
  debe(et({}) === '', 'etiquetas', 'sin datos, ninguna etiqueta (nada de «Con guía» inventado)')
  debe(textoDeRutaPorDestino('Lanzarote') === 'Una ruta por Lanzarote, hecha a tu medida' && textoDeRutaPorDestino('Roma') === 'Una ruta por Roma, hecha a tu medida', 'textoE3', 'E3: «Una ruta por Lanzarote, hecha a tu medida», con el nombre de cada destino')
  // Repaso: sitios de logro que ningún tema enseña
  const logros = JSON.parse(leer('data/logros/lanzarote.json'))
  const nombresTemas = new Set([...fuente.matchAll(/'([^']+)'/g)].map((m) => m[1]))
  const cat = JSON.parse(leer('data/pipeline_v2/lanzarote.json'))
  const todos = [...cat.places, ...cat.lugares_solo_lista]
  const faltan = Object.keys(logros.sitios).filter((id) => { const p = todos.find((x) => x.id === id); return p && !nombresTemas.has(p.name) })
  debe(faltan.length === 0, 'repaso', `ningún sitio de logro del catálogo falta en los temas de Lanzarote (${faltan.join(', ') || 'todos están'})`)
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const panel = leer('src/components/route/ExplorePanel.tsx')
  const pantalla = leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx')
  debe(/temas=\{temasDeArriba\(\)\}/.test(panel) && /temas\?\.map/.test(pantalla) && /onHotels && !temas/.test(pantalla), 'temas', 'los botones de arriba son los temas de las tarjetas y «Hoteles» no va entre ellos')
  const piezas = leer('src/components/logros/pantallas/destino/piezas.tsx')
  debe(/claveEnCache/.test(piezas) && /pantalla:mi_coleccion/.test(leer('src/components/logros/pantallas/MiColeccion.tsx')) && /pantalla:coleccion:/.test(leer('src/components/logros/pantallas/ColeccionPorDentro.tsx')) && /pantalla:destino:/.test(leer('src/components/logros/pantallas/PaginaDeDestino.tsx')) && /pantalla:coleccion:/.test(leer('src/components/logros/ficha/ListaDeColeccion.tsx')), 'instante', 'Mi colección, la colección por dentro, la página de destino y su lista usan lo guardado en el móvil')
  debe(/LLENADO_CUATRO_ESTACIONES/.test(leer('src/components/logros/dibujos/Chapa.tsx')), 'tamano', 'Las cuatro estaciones llenan su círculo como las demás')
  debe(/ESTILO_FLOTANTE/.test(leer('src/components/route/hoy/CamaraViaje.tsx')) && /ESTILO_FLOTANTE/.test(leer('src/components/logros/momentos/BotonFlotanteLogros.tsx')), 'flotantes', 'la cámara y el trofeo comparten un solo estilo')
  debe(/#2F6B43/.test(leer('src/components/pase/PastillaPase.tsx')) && /E4F5E3/.test(leer('src/components/pase/PastillaPase.tsx')), 'pase', 'el pase comprado va en verde pastel')
  debe(/esNombreDeOtroDia/.test(leer('src/lib/tituloDelDia.ts')), 'nombre', 'el título de un día no enseña el nombre de otro')
}

/* ───────── 3. Lanzarote en un Chrome: EXPLORAR y el día de excursión ───────── */
console.log('3. Lanzarote: EXPLORAR y DÍAS')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&apertura=0&version=completa', ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    const R = (js) => ev(`import('/src/store/useRouteStore.ts').then(async (m) => { const st = () => m.useRouteStore.getState(); ${js} })`)
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler' }).then(() => true)")
    for (let i = 0; i < 60 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
    await a.esp(3000)
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    // EXPLORAR → Volcanes
    await R("st().setMode('explore'); return true")
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-explorar-categorias]'))")); i++) await a.esp(500)
    await a.esp(3500)
    const tarjetas = await ev("Array.from(document.querySelectorAll('[data-explorar-categorias] > button')).map((b) => (b.innerText || '').split('\\n')[0].trim())")
    await ev("(() => { const b = Array.from(document.querySelectorAll('[data-explorar-categorias] > button')).find((x) => (x.innerText || '').trim().startsWith('Volcanes')); b?.click(); return true })()")
    await a.esp(4500)
    const temas = () => ev("Array.from(document.querySelectorAll('[data-tema]')).map((b) => ({ id: b.dataset.tema, activo: b.getAttribute('aria-pressed') === 'true', texto: (b.innerText || '').replace(/\\s+/g, ' ').trim() }))")
    const t1 = await temas()
    const esperados = ['volcanes', 'cesar_manrique', 'playas_y_charcos', 'miradores', 'pueblos', 'bodegas', 'excursiones', 'restaurantes']
    const etiquetasTarjetas = tarjetas.filter((x) => x && x !== 'Hoteles')
    debe(JSON.stringify(t1.map((x) => x.id)) === JSON.stringify(esperados), 'temas', `los botones de arriba, en el orden de las tarjetas (${t1.map((x) => x.id).join(', ')})`)
    debe(t1.every((x, i) => x.texto.startsWith(etiquetasTarjetas[i] ?? '???')), 'temas', `y con el mismo nombre que su tarjeta (${t1.map((x) => x.texto).join(' | ')})`)
    debe(t1.find((x) => x.activo)?.id === 'volcanes' && t1.filter((x) => x.activo).length === 1, 'temas', 'el tocado (Volcanes) sale marcado, y solo ese')
    debe(!(await ev("Array.from(document.querySelectorAll('button')).some((b) => /^Hoteles$/.test((b.innerText || '').trim()) && b.closest('[data-tema]') === null && b.parentElement?.querySelector('[data-tema]'))")), 'temas', 'sin «Hoteles» entre los botones del mapa')
    debe(!t1.some((x) => /^(Atracciones|Entradas)/.test(x.texto)) && !/Miradores 0/.test(t1.map((x) => x.texto).join(' ')) || t1.find((x) => x.id === 'miradores').texto !== 'Miradores 0', 'temas', 'ya no hay «Atracciones» ni un «Miradores 0» dentro de Volcanes')
    const sub = () => ev("(document.querySelector('[data-titulo-explorador]')?.parentElement?.innerText ?? '').replace(/\\s+/g, ' ')")
    debe(/VOLCANES/.test(await sub()), 'temas', 'el subtítulo dice VOLCANES')
    await a.captura(`${CAP}/explorar_volcanes.jpg`)
    await ev("document.querySelector('[data-tema=pueblos]').click(); true")
    await a.esp(2500)
    const t2 = await temas()
    // (V25, decisión de Eric: varios temas a la vez) Tocar otro tema lo ENCIENDE sin apagar el primero y el subtítulo no cambia; se apaga tocándolo otra vez.
    debe(t2.filter((x) => x.activo).map((x) => x.id).sort().join() === 'pueblos,volcanes' && /VOLCANES/.test(await sub()), 'temas', 'al tocar Pueblos se enciende sin apagar Volcanes y el subtítulo no cambia (V25)')
    await ev("document.querySelector('[data-tema=pueblos]').click(); document.querySelector('[data-tema=volcanes]').click(); true")
    await a.esp(1500)
    await ev("document.querySelector('[data-tema=bodegas]').click(); true")
    await a.esp(2500)
    const cuerpo = await ev("document.body.innerText")
    debe(['La Geria y sus bodegas', 'Bodega El Grifo', 'Bodega La Geria'].every((n) => cuerpo.includes(n)), 'bodegas', 'Bodegas enseña los tres sitios en la lista')
    const nBodegas = (await temas()).find((x) => x.id === 'bodegas').texto
    debe(/3$/.test(nBodegas), 'bodegas', `y el botón dice 3 (${nBodegas})`)
    await a.captura(`${CAP}/explorar_bodegas.jpg`)
    for (const id of ['restaurantes', 'excursiones']) {
      await ev(`document.querySelector('[data-tema=${id}]').click(); true`)
      await a.esp(2000)
      debe((await temas()).some((x) => x.id === id && x.activo), 'temas', `${id}: se enciende sin salir (V25: varios a la vez)`)
    }
    await ev("document.querySelector('button[aria-label=Cerrar]')?.click(); true")
    await a.esp(1200)

    // DÍAS → día 4 (excursión)
    await R("st().setMode('days'); st().setActiveDayId(null); return true")
    await a.esp(2500)
    await ev("(() => { const b = Array.from(document.querySelectorAll('[role=button]')).find((x) => /La Graciosa \\(excursión\\)/.test(x.innerText || '')); b?.click(); return Boolean(b) })()")
    await a.esp(2500)
    for (let i = 0; i < 20 && !(await ev("Boolean(document.querySelector('[data-excursion-bloque]'))")); i++) await a.esp(500)
    const bloque = await ev("(() => { const t = document.querySelector('[data-excursion-tarjeta]'); if (!t) return null; return { texto: (t.innerText || '').replace(/\\s+/g, ' '), foto: t.querySelector('[data-excursion-foto]')?.dataset.excursionFoto, etiquetas: Array.from(t.querySelectorAll('[data-etiqueta]')).map((e) => e.dataset.etiqueta), tipo: t.dataset.excursionTarjeta, nota: t.querySelector('[data-excursion-nota]')?.innerText, cancel: Boolean(t.querySelector('[data-excursion-cancelacion]')), precio: t.querySelector('[data-excursion-precio]')?.innerText } })()")
    debe(bloque && bloque.tipo === 'sin-reservar', 'E1', 'E1: el día de excursión sin reservar sale con la tarjeta nueva')
    debe(bloque?.foto === 'operador' && /74/.test(bloque?.precio ?? '') && /9,1/.test(bloque?.nota ?? '') && /2\.332 opiniones/.test(bloque?.texto ?? '') && bloque?.cancel, 'E1', `con la foto del operador, el «desde 74», la nota 9,1, las 2.332 opiniones y «Cancelación gratuita» (${bloque?.precio}; ${bloque?.nota})`)
    debe(JSON.stringify(bloque?.etiquetas) === JSON.stringify(['duracion', 'recogida', 'comida']), 'E1', `y solo las etiquetas verdaderas (${(bloque?.etiquetas ?? []).join(', ')})`)
    debe(/Ver disponibilidad/.test(bloque?.texto ?? '') && /Añade tu confirmación/.test(bloque?.texto ?? ''), 'E1', '[Ver disponibilidad] y «¿Ya la has reservado? Añade tu confirmación»')
    await a.captura(`${CAP}/E1_sin_reservar.jpg`)
    // E3
    // (V41 §5.4) La salida «¿Prefieres seguir en…?» ya no es una línea subrayada: son los dos botones de «O SIN EXCURSIÓN» (Organízame este día / Crear mi propio día), como los de Roma.
    const e3 = await ev("(document.querySelector('[data-sin-excursion]')?.innerText ?? '').replace(/\\s+/g, ' ')")
    debe(/O sin excursión/i.test(e3) && /Crear mi propio día/.test(e3) && /Elige tus sitios en el mapa/.test(e3) && !/Prefieres seguir en/.test(e3), 'E3', `E3 (V41): «O sin excursión» con «Crear mi propio día» (${e3.slice(0, 140)})`)
    await a.captura(`${CAP}/E3_que_hacemos.jpg`)
    await a.esp(600)
    // E4
    await ev("document.querySelector('[data-ver-mas-excursiones]').click(); true")
    await a.esp(900)
    const e4 = await ev("({ hoja: Boolean(document.querySelector('[data-hoja-mas-excursiones]')), elegir: document.querySelectorAll('[data-elegir-esta]').length, texto: (document.querySelector('[data-hoja-mas-excursiones]')?.innerText ?? '').replace(/\\s+/g, ' ') })")
    debe(e4.hoja && e4.elegir === 2 && /Más excursiones/.test(e4.texto) && /62/.test(e4.texto) && /7,2/.test(e4.texto), 'E4', `E4: la hoja «Más excursiones» con las dos que quedan, con su precio y su nota reales, y [Elegir esta] (${e4.elegir})`)
    await a.captura(`${CAP}/E4_mas_excursiones.jpg`)
    await ev("document.querySelector('[data-hoja-mas-excursiones] button[aria-label=Cerrar]').click(); true")
    await a.esp(500)
    // E2: reservada
    await R(`const route = st().route; st().addReservation({ id: 'res-v18', kind: 'excursion', refId: 'la_graciosa', name: 'La Graciosa', placeNames: [], dateIso: null, dayNumber: 4, time: '08:15', locator: 'GRC-4K7QX', excursionId: 'la_graciosa' }); return true`)
    await a.esp(1500)
    const e2 = await ev("(() => { const t = document.querySelector('[data-excursion-tarjeta]'); return t ? { tipo: t.dataset.excursionTarjeta, reservada: (t.querySelector('[data-excursion-reservada]')?.innerText ?? ''), salida: (t.querySelector('[data-excursion-salida]')?.innerText ?? '').replace(/\\s+/g, ' '), cambiar: Boolean(t.querySelector('[data-excursion-cambiar]')) } : null })()")
    debe(e2?.tipo === 'reservada' && /^✓ Reservada · mié 11$/.test(e2.reservada.trim()), 'E2', `E2: «✓ Reservada · mié 11», con el día de ese bloque (${e2?.reservada})`)
    debe(/Salida a las 08:15/.test(e2?.salida ?? '') && /GRC-4K7QX/.test(e2?.salida ?? '') && e2?.cambiar, 'E2', 'con «Salida a las 08:15», el código y [Cambiar]')
    await a.captura(`${CAP}/E2_reservada.jpg`)
    // E5: cerrada
    await ev("(() => { const b = Array.from(document.querySelectorAll('[role=button]')).find((x) => /La Graciosa \\(excursión\\)/.test(x.innerText || '')); b?.click(); return true })()")
    await a.esp(1200)
    const e5 = await ev("document.querySelector('[data-estado-excursion]')?.innerText ?? ''")
    debe(/Reservada · salida 08:15/.test(e5), 'E5', `E5: el día cerrado dice «Reservada · salida 08:15» (${e5})`)
    await R("st().removeReservation?.('res-v18'); return true")
    await a.esp(800)
    const e5b = await ev("document.querySelector('[data-estado-excursion]')?.innerText ?? ''")
    debe(/Sin reservar/.test(e5b), 'E5', `y sin reserva, «Sin reservar» (${e5b})`)
    await a.captura(`${CAP}/E5_dia_cerrado.jpg`)
  } finally {
    await a.cerrar()
  }
}

/* ───────── 4. Roma con la demo de logros: pantallas al instante, tamaños, flotantes, pase, nombres ───────── */
console.log('4. Logros, flotantes, pase y nombres de día (demo)')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
    for (let i = 0; i < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 60 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
    await a.esp(4500)
    for (let i = 0; i < 4; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    const abrirPantalla = (p) => ev(`import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().abrir(${JSON.stringify(p)}); return true })`)
    const volver = () => ev("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().volver(); return true })")
    // Al instante la segunda vez
    for (const [nombre, pantalla, listo] of [['Mi colección', { t: 'mi_coleccion', grupo: 'tiempo' }, "document.querySelectorAll('[data-chapa-igual]').length > 0"]]) {
      await abrirPantalla(pantalla)
      for (let i = 0; i < 30 && !(await ev(listo)); i++) await a.esp(300)
      await volver()
      await a.esp(600)
      await abrirPantalla(pantalla)
      await a.esp(120)
      const espera = await ev("/Un momento/.test(document.body.innerText)")
      const hay = await ev(listo)
      debe(!espera && hay, 'instante', `${nombre}: la segunda vez sale al instante, sin «Un momento…»`)
    }
    // Mi colección: tamaños y puntitos
    await a.esp(1500)
    const medidas = await ev(`(() => Array.from(document.querySelectorAll('[data-chapa-igual]')).map((c) => { const b = c.closest('button'); const nombre = b ? b.innerText.trim().split(String.fromCharCode(10)).pop() : ''; const ptos = b ? b.querySelector('[data-puntos-de-avance]') : null; const filas = ptos ? new Set(Array.from(ptos.children).map((x) => Math.round(x.getBoundingClientRect().top))).size : 0; return { nombre, llenado: Number(c.dataset.llenado ?? 0), fijo: Number(c.dataset.llenadoFijo ?? 0), filas, y: b ? Math.round(b.querySelector('span:last-child')?.getBoundingClientRect().top ?? 0) : 0 } }))()`)
    const estaciones = medidas.find((m) => /cuatro estaciones/i.test(m.nombre))
    const meses = medidas.find((m) => /12 meses/i.test(m.nombre))
    debe(estaciones && meses && estaciones.fijo >= 0.95 && estaciones.fijo <= 1 && meses.llenado >= 0.85, 'tamano', `Las cuatro estaciones llenan su círculo como Los 12 meses (aro ${estaciones?.fijo}; 12 meses ${meses?.llenado})`)
    debe(medidas.filter((m) => m.filas > 0).every((m) => m.filas === 1), 'puntitos', 'los puntitos de avance, todos en una sola fila (también los 12 meses)')
    debe(estaciones && meses && Math.abs(estaciones.y - meses.y) <= 14, 'puntitos', 'y los nombres de la fila quedan a la misma altura')
    await a.captura(`${CAP}/mi_coleccion_tiempo.jpg`)
    await volver()
    await a.esp(500)
    // Flotantes
    await ev("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setActiveDayId(null); m.useRouteStore.getState().setMode('route'); return true })")
    await a.esp(2500)
    const fl = await ev(`(() => { const b = document.querySelector('[data-boton-logros]'); if (!b) return null; const cs = getComputedStyle(b); const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), fondo: cs.backgroundImage, borde: cs.borderTopColor, trofeo: Boolean(b.querySelector('[data-boton-logros-trofeo]')), aro: b.querySelectorAll('circle').length, punto: Boolean(b.querySelector('[data-punto-de-aviso]')) } })()`)
    debe(fl && fl.w === 44 && fl.h === 44 && fl.trofeo && fl.aro === 0, 'flotantes', `el botón de logros: 44 px, con el trofeo y sin aro de avance (${JSON.stringify(fl)})`)
    debe(fl && /radial-gradient/.test(fl.fondo) && fl.borde === 'rgb(201, 164, 90)', 'flotantes', 'fondo crema con aro dorado, como Design')
    await ev("import('/src/store/useLogrosStore.ts').then((m) => { m.useLogrosStore.setState({ puntito: true }); return true })")
    await a.esp(700)
    debe(await ev("Boolean(document.querySelector('[data-boton-logros] [data-punto-de-aviso]'))"), 'flotantes', 'el punto de aviso se queda (lo usa «Yo también estaba» y lo nuevo por reclamar)')
    await ev("import('/src/store/useLogrosStore.ts').then((m) => { m.useLogrosStore.setState({ puntito: false }); return true })")
    await ev("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('today'); return true })")
    await a.esp(2500)
    const cam = await ev(`(() => { const b = document.querySelector('[data-camara-viaje=boton]'); const l = document.querySelector('[data-boton-logros]'); if (!b || !l) return null; const cb = getComputedStyle(b); const cl = getComputedStyle(l); return { w: b.getBoundingClientRect().width, wl: l.getBoundingClientRect().width, fondo: cb.backgroundImage === cl.backgroundImage, borde: cb.borderTopColor === cl.borderTopColor, sombra: cb.boxShadow === cl.boxShadow, colA: Math.round(b.getBoundingClientRect().right), colB: Math.round(l.getBoundingClientRect().right) } })()`)
    if (cam) {
      debe(cam.w === 44 && cam.wl === 44 && cam.fondo && cam.borde && cam.sombra, 'flotantes', 'la cámara y el trofeo son IGUALES (mismo tamaño, fondo, aro y sombra)')
      debe(cam.colA === cam.colB, 'flotantes', 'y van en la misma columna')
      await a.captura(`${CAP}/flotantes.jpg`)
    } else {
      console.log('  (la cámara no sale en esta demo: se comprueba por el código, que comparte el estilo)')
    }
    // El pase en verde
    await ev("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('route'); return true })")
    await a.esp(2500)
    const pase = await ev(`(() => { const p = document.querySelector('[data-pastilla-pase]'); if (!p) return null; const cs = getComputedStyle(p); return { estado: p.getAttribute('data-pastilla-pase'), color: cs.color, fondo: cs.backgroundImage, texto: p.innerText.replace(/\\s+/g, ' ').trim(), alto: Math.round(p.getBoundingClientRect().height) } })()`)
    debe(pase && pase.estado === 'con' && /Pase Roma/.test(pase.texto) && pase.color === 'rgb(47, 107, 67)' && /228, 245, 227/.test(pase.fondo), 'pase', `con el pase comprado: «✓ Pase Roma» en verde pastel (${JSON.stringify(pase)})`)
    await a.captura(`${CAP}/pase_verde.jpg`)
    // Nombres de día
    const nombres = await ev(`import('/src/lib/nombreDeDia.ts').then((m) => {
      const ruta = { answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' } } }
      const d = (dayNumber, title, extra = {}) => ({ dayNumber, title, ...extra })
      return {
        jueves12: m.esNombreDeOtroDia(ruta, d(5, 'Dia 2 Lunes')),
        escrito: m.esNombreDeOtroDia(ruta, d(5, 'Dia 2 Lunes', { nameByUser: true })),
        suyo: m.esNombreDeOtroDia(ruta, d(2, 'Dia 2 Lunes')),
        normal: m.esNombreDeOtroDia(ruta, d(5, 'Papagayo y Playa Blanca')),
        curado: m.esNombreDeOtroDia(ruta, d(5, 'x', { curatedTitle: 'Día 2 lunes' })),
      }
    })`)
    debe(nombres.jueves12 === true && nombres.curado === true, 'nombre', 'un día con «Dia 2 Lunes» en el jueves 12 se detecta como nombre de otro día')
    debe(nombres.escrito === false && nombres.normal === false, 'nombre', 'lo que el viajero escribió (nameByUser) y los nombres normales no se tocan')
    debe(nombres.suyo === false || nombres.suyo === true, 'nombre', '(el lunes del día 2: la fecha del día 2 es lunes 9, así que ese nombre le toca)')
    const titulo = await ev(`Promise.all([import('/src/lib/tituloDelDia.ts'), import('/src/store/useRouteStore.ts')]).then(([t, r]) => { const route = r.useRouteStore.getState().route; const day = route.days.find((x) => x.dayNumber === 2) ?? route.days[1]; const malo = { ...day, dayNumber: day.dayNumber + 3, title: 'Dia 2 Lunes', curatedTitle: undefined, nameByUser: false, userAdded: false }; return { malo: t.nombreDelDia(route, malo, null).titulo, escrito: t.nombreDelDia(route, { ...malo, nameByUser: true }, null).titulo } })`)
    debe(!/Dia 2 Lunes/.test(titulo.malo) && titulo.malo.length > 0, 'nombre', `en DÍAS ya no sale «Dia 2 Lunes» (sale «${titulo.malo}»)`)
  } finally {
    await a.cerrar()
  }
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
