// La prueba de los datos y de la APP de la Tanda 10O (EXPLORAR): las dos pestañas, las listas de Lugares y Miradores, el Free Tour, Entradas y Excursiones, la tarjeta Hoteles, añadir un sitio sin hora y los días con su fecha.
// Hace falta `npm run server` y `npm run dev` (abre un Chrome sin ventana: scripts/destino/_enLaApp.mjs). Guarda las capturas en docs/dias/capturas_jutrip/ (las lee REPASO_10O.html).
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10O_datos.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { cargarCatalogo, listas } from './listaExplorar10O.mjs'

const API = process.env.API_URL ?? 'http://localhost:8787'
let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })

/* ───────────────────────── 1. Los datos: las listas de EXPLORAR ───────────────────────── */
const catalogo = await cargarCatalogo(API)
const { lugares, miradores, todo, ocultos, freeTour } = listas(catalogo)
const puesto = (lista, nombre) => lista.findIndex((p) => p.name === nombre)
const megusta = (lista, nombre) => lista.find((p) => p.name === nombre)?.likes_initial

debe(freeTour?.likes_initial === 978, 'free_tour', 'El Free Tour lleva 978 «me gusta» de partida, como cualquier sitio')
debe(978 > Math.max(...catalogo.places.map((p) => p.likes_initial ?? 0)), 'free_tour', 'El Free Tour tiene más «me gusta» que ningún sitio: sale el primero')
for (const nombre of ['Luces de Navidad del Tridente', 'Lungotevere', 'Mercadillo de Navidad de Piazza Navona', 'Terraza de Largo Gaetana Agnesi', 'Porta Pinciana', 'Mirador de San Pietro in Montorio', "Fontana dell'Acqua Paola", 'Jardines del Pincio']) {
  debe(ocultos.includes(nombre), 'fuera', `${nombre} no sale en la lista de EXPLORAR`)
  debe(catalogo.places.some((p) => p.name === nombre), 'fuera', `${nombre} sigue en el catálogo (solo de la lista: la ruta y la ficha lo siguen usando)`)
  debe(puesto(todo, nombre) < 0, 'fuera', `${nombre} no está en la lista ordenada`)
}
const roma = JSON.parse(leer('data/pipeline_v2/roma.json'))
debe(['Luces de Navidad del Tridente', 'Lungotevere', 'Mercadillo de Navidad de Piazza Navona', 'Fontana dell\'Acqua Paola', 'Jardines del Pincio', 'Porta Pinciana'].every((n) => roma.places.some((p) => p.name === n)), 'ruta', 'los sitios quitados de la lista siguen en `places` del motor: la ruta no cambia')
debe(JSON.stringify(roma.navidad_lineas ?? {}).includes('Tridente'), 'ruta', 'el texto de las luces del Tridente sigue en la ruta de Navidad (navidad_lineas)')

const ALFINAL = ['Plaza del Quirinal', 'Quartiere Coppedè', 'Santo Bambino de Aracoeli', 'Via dei Coronari', 'Via del Babuino', 'Via di Ripetta', 'Via Margutta', 'Via Veneto']
debe(ALFINAL.every((n, i) => puesto(lugares, n) >= lugares.length - ALFINAL.length), 'al_final', 'los ocho sitios que casi nadie conoce salen al final de la lista de Lugares')
debe(lugares.slice(-ALFINAL.length).every((p) => p.al_final_de_lista), 'al_final', 'las ocho últimas filas de Lugares son esos ocho')
debe(lugares.filter((p) => p.likes_initial === 0 && !p.al_final_de_lista).every((p) => puesto(lugares, p.name) < lugares.length - ALFINAL.length), 'al_final', 'los demás sin «me gusta» salen antes que ellos')

const SUBEN = ['Plaza Venecia', "Puente Sant'Angelo", 'Via dei Fori Imperiali', 'Via della Conciliazione', 'Via Appia Antica', 'Teatro de Marcelo', 'Via Condotti']
const likesSuben = SUBEN.map((n) => megusta(todo, n))
debe(likesSuben.every((v, i) => v > 0 && (i === 0 || v < likesSuben[i - 1])), 'suben', `los siete llevan «me gusta» y en el orden pedido (${likesSuben.join(', ')})`)
debe(likesSuben.every((v) => v < megusta(todo, 'Cúpula de San Pedro') && v > megusta(todo, 'Parque de Villa Borghese')), 'suben', 'los siete caen entre la Cúpula de San Pedro y el Parque de Villa Borghese')
debe(SUBEN.every((n) => puesto(todo, n) > puesto(todo, 'Cúpula de San Pedro') && puesto(todo, n) < puesto(todo, 'Parque de Villa Borghese')), 'suben', 'y así salen en la lista')
const positivos = todo.map((p) => p.likes_initial).filter((v) => v > 0)
debe(new Set(positivos).size === positivos.length, 'suben', 'ningún empate entre los «me gusta» de la lista')
debe(['Galería Borghese', "Castillo de Sant'Angelo", 'Trastevere', 'Cúpula de San Pedro'].every((n, i, a) => i === 0 || megusta(todo, n) < megusta(todo, a[i - 1])), 'suben', 'los de arriba que se movieron (Galería, Castillo, Trastevere, Cúpula) conservan su orden')

debe(puesto(miradores, 'Terraza del Altar de la Patria') === puesto(miradores, 'Cúpula de San Pedro') + 1, 'terraza', 'la Terraza del Altar de la Patria sale en Miradores justo detrás de la Cúpula de San Pedro')
const terraza = catalogo.places.find((p) => p.name === 'Terraza del Altar de la Patria')
debe(terraza?.schedule === '09:30-19:30', 'terraza', 'con su horario de 09:30 a 19:30')
debe(JSON.stringify(terraza?.hours_card ?? '') + JSON.stringify(terraza?.ticket_info ?? '') !== '""null', 'terraza', 'con su texto y su entrada')
debe(!roma.places.some((p) => p.name === 'Terraza del Altar de la Patria'), 'terraza', 'no está en `places`: el motor no la ve y la ruta no cambia')
debe(['Cúpula de San Pedro', 'Terraza del Altar de la Patria', 'Mirador del Janículo', 'Terraza del Pincio'].every((n, i, a) => i === 0 || megusta(miradores, n) < megusta(miradores, a[i - 1])), 'orden', 'Miradores va de más a menos «me gusta»')
debe(lugares.slice(0, 12).every((p, i, a) => i === 0 || (p.likes_initial ?? 0) <= (a[i - 1].likes_initial ?? 0)), 'orden', 'Lugares va de más a menos «me gusta»')

/* El Castillo por fuera y la foto de la Terraza (el servidor la sirve). */
const foto = async (nombre) => {
  const r = await fetch(`${API}/api/place-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nombre, city: 'Roma' }) })
  return r.json()
}
const fCastillo = await foto("Castillo de Sant'Angelo")
debe(/dia_castillo_sant_angelo_fuera/.test(JSON.stringify(fCastillo)), 'castillo', `la foto del Castillo es la de fuera (${JSON.stringify(fCastillo).slice(0, 120)})`)
debe(fs.existsSync('public/fotos/roma/dia_castillo_sant_angelo_fuera.jpg') && fs.existsSync('public/fotos/roma/dia_castillo_sant_angelo_fuera_p.jpg'), 'castillo', 'los dos ficheros de la foto del Castillo existen')
const fotos = JSON.parse(leer('data/dias/roma/_fotos.json'))
const regCastillo = fotos.fotos.find((f) => f.archivo === 'dia_castillo_sant_angelo_fuera.jpg')
debe(regCastillo?.credito?.autor && /commons\.wikimedia\.org/.test(regCastillo.credito.enlace ?? '') && regCastillo.credito.licencia, 'castillo', 'la foto del Castillo lleva su crédito (autor, licencia y enlace)')
debe(!fotos.huecos.some((h) => h.archivo === 'dia_castillo_sant_angelo_dentro.jpg' && (h.lugares ?? []).length > 0), 'castillo', 'la de dentro ya no la usa ninguna ficha')
const fTerraza = await foto('Terraza del Altar de la Patria')
debe(/dia_terraza_altar_patria/.test(JSON.stringify(fTerraza)), 'terraza', 'la Terraza lleva su foto (las vistas desde arriba)')
debe(fTerraza.photo_credit?.autor === 'Eric', 'terraza', 'y la foto de la Terraza lleva a Eric como su autor (10O2)')

/* ───────────────────────── 2. Lo que se ve en el código ───────────────────────── */
{
  const ex = sinComentarios(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx'))
  debe(!/Con el pase, ordena los sitios por lo cerca que los tienes de ti/.test(ex), 'pestanas', 'la tarjeta cerrada de «Cerca de ti» ya no está en la lista')
  debe(/data-pestanas-explorar/.test(ex) && /!trimmedQuery && \(\s*(\/\*[^]*?\*\/)?\s*<InterruptorElegir/.test(ex), 'pestanas', 'las dos pestañas salen para todos (no dependen del pase, del dueño ni del invitado)')
  debe(!/soloVer|modoInvitado/.test(ex), 'pestanas', 'la pantalla de EXPLORAR no distingue al invitado: las pestañas son iguales para el dueño y el invitado')
  debe(/abrirAvisoPase\('cerca_de_ti', \{ destino: destination \}\)/.test(ex) && /Descubre lo que tienes cerca de ti, allí donde estés\./.test(leer('src/lib/avisoPaseTextos.ts')), 'pestanas', 'el texto del aviso (10N6: aviso pequeño del pase), con el nombre del destino del dato')
  debe(/abrirPase\(\)/.test(leer('src/components/pase/AvisoPase.tsx')) && /data-aviso-pase-ver/.test(leer('src/components/pase/AvisoPase.tsx')), 'pestanas', '[Ver el Pase] del aviso abre el pase')
  const add = sinComentarios(leer('src/components/route/freeDay/AddToDaySheet.tsx'))
  debe(!/TimeField|Hora de la parada|suggestedTimeFor/.test(add), 'sin_hora', 'añadir un sitio ya no pide la hora')
  debe(/mejorHuecoEnElDia/.test(add) && /insertStopAt/.test(add), 'sin_hora', 'lo coloca donde mejor encaje (mejorHuecoEnElDia + insertStopAt)')
  const ex2 = sinComentarios(leer('src/components/route/ExplorePanel.tsx'))
  const orden = ex2.match(/\{ id: '(\w+)', label: '/g)?.map((x) => x.match(/'(\w+)'/)[1]) ?? []
  debe(orden.indexOf('hoteles') === orden.indexOf('banos') - 1 && orden.indexOf('hoteles') > orden.indexOf('excursiones'), 'hoteles', `la tarjeta Hoteles va antes de Baños y Fuentes (${orden.join(', ')})`)
  const rueda = sinComentarios(leer('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(/enLaRuta/.test(rueda) && /9 \* 60/.test(rueda) && !/: 10 \* 60/.test(rueda), 'rueda', 'la ruedita de una entrada parte de la hora a la que la ruta llega ahí, o de las 9:00 (o la apertura si abre más tarde)')
}

/* ───────────────────────── 3. mejorHuecoEnElDia (sin pantalla) ───────────────────────── */
const preparar = async (a) => {
  // (Bajo carga la pantalla de «ruta rápida» tarda en salir: si el viaje de pruebas no se crea, se recarga y se prueba de nuevo.)
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await a.evaluar('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await a.evaluar('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 80 && !(await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(500)
  await a.esp(2500)
}
const cerrarAvisos = async (a) => {
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await a.esp(600)
  }
}
const irAExplorar = async (a) => {
  await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setMode('explore'); return true })")
  await a.esp(2500)
  await cerrarAvisos(a)
  await a.esp(1500)
}
const tarjeta = (nombre) => `(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => new RegExp('^${nombre}').test((x.textContent || '').trim()) && x.className.includes('rounded-[20px]')); if (!b) return false; b.click(); return true })()`

{
  const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0' })
  await preparar(a)
  await irAExplorar(a)

  // Las tarjetas: Hoteles antes de Baños y Fuentes.
  const textos = await a.evaluar("Array.from(document.querySelectorAll('button.rounded-\\\\[20px\\\\]')).map((b) => (b.textContent || '').trim().replace(/\\s+/g, ' '))")
  const nombres = textos.map((t) => ['Atracciones', 'Miradores', 'Restaurantes', 'Entradas', 'Excursiones', 'Hoteles', 'Baños', 'Fuentes'].find((n) => t.startsWith(n)) ?? t)
  debe(nombres.indexOf('Hoteles') > 0 && nombres.indexOf('Hoteles') < nombres.indexOf('Baños') && nombres.indexOf('Baños') < nombres.indexOf('Fuentes'), 'hoteles', `las tarjetas salen en este orden: ${nombres.join(', ')}`)
  debe(/Atracciones.*81 lugares/.test(textos.join('|')) && /Miradores.*6 lugares/.test(textos.join('|')), 'listas', 'los contadores de las tarjetas no cuentan lo que está fuera de la lista (81 y 6)')
  await a.captura(path.join(SALIDA, '10o_explorar_tarjetas.jpg'))
  // Se abre el mapa de alojamientos.
  await a.evaluar(tarjeta('Hoteles'))
  await a.esp(1500)
  debe(await a.evaluar("import('/src/store/useAlojamientoUi.ts').then((m) => Boolean(m.useAlojamientoUi.getState().mapa))"), 'hoteles', 'tocar Hoteles abre la pantalla de alojamientos de Roma')
  await a.captura(path.join(SALIDA, '10o_hoteles_alojamientos.jpg'))
  await a.evaluar("import('/src/store/useAlojamientoUi.ts').then((m) => { m.useAlojamientoUi.getState().cerrarMapa(); return true })")
  await a.esp(800)

  // Las dos pestañas, sin pase.
  await a.evaluar(tarjeta('Atracciones'))
  await a.esp(2500)
  const pest = await a.evaluar("(() => { const p = document.querySelector('[data-pestanas-explorar]'); if (!p) return null; return { botones: Array.from(p.querySelectorAll('button')).map((b) => (b.textContent || '').trim()), candado: Boolean(p.querySelector('[data-candado=\"explorar-cerca-de-ti\"]')), fuera: Array.from(document.querySelectorAll('[data-candado=\"explorar-cerca-de-ti\"]')).filter((x) => !p.contains(x)).length } })()")
  debe(pest && pest.botones.join('|') === 'Recomendados|Cerca de ti', 'pestanas', `sin pase salen las dos pestañas (${pest?.botones?.join('|')})`)
  debe(pest?.candado === true && pest?.fuera === 0, 'pestanas', 'sin pase, el candado dorado pequeño va junto a «Cerca de ti» y no hay ninguna tarjeta cerrada más en la lista')
  await a.captura(path.join(SALIDA, '10o_pestanas_sin_pase.jpg'))
  await a.evaluar("document.querySelector('[data-pestana=\"nearby\"]').click(); true")
  await a.esp(1200)
  // (Tanda 10N6 §1g) Sin pase, «Cerca de ti» abre el aviso pequeño del pase (ya no la hoja suelta de la 10O).
  const hoja = await a.evaluar("(() => { const h = document.querySelector('[data-aviso-pase=\"cerca_de_ti\"]'); if (!h) return null; return { texto: h.innerText.replace(/\\s+/g, ' ').trim(), boton: h.querySelector('[data-aviso-pase-ver]')?.textContent ?? null } })()")
  debe(hoja && /^Desbloquéalo con el Pase Roma /.test(hoja.texto) && hoja.boton === 'Ver el Pase Roma', 'pestanas', `sin pase, «Cerca de ti» abre el aviso del pase (${hoja?.texto})`)
  debe(await a.evaluar("document.querySelector('[data-pestana=\"recommended\"]').getAttribute('data-elegida') === '1'"), 'pestanas', 'y la pestaña de «Recomendados» sigue elegida (no cambia de pestaña)')
  await a.captura(path.join(SALIDA, '10o_hoja_cerca_de_ti.jpg'))
  await a.evaluar("document.querySelector('[data-hoja=\"aviso-pase\"] [aria-label=\"Cerrar\"]').click(); true")
  await a.esp(600)

  // Las listas: lo que sale en pantalla coincide con la lista del servidor (el orden de «Recomendados»).
  await a.esp(1000)
  const enPantalla = await a.evaluar("Array.from(document.querySelectorAll('span.font-display')).map((x) => x.textContent).filter((t) => t && !/^(Roma|Explorar)/.test(t))")
  const esperadoAtracciones = lugares.map((p) => p.name)
  debe(enPantalla.slice(0, 12).join('|') === esperadoAtracciones.slice(0, 12).join('|'), 'listas', `Lugares sale en pantalla en el orden de la lista (${enPantalla.slice(0, 3).join(', ')}…)`)
  debe(!enPantalla.some((t) => ocultos.includes(t)), 'listas', 'ninguno de los fuera-de-la-lista sale en pantalla')

  // Miradores.
  await a.evaluar("(() => { const x = Array.from(document.querySelectorAll('button')).find((b) => (b.getAttribute('aria-label') || '') === 'Cerrar' || /Explorar/.test(b.textContent || '')); return true })()")
  await a.evaluar("Array.from(document.querySelectorAll('[data-active=\"true\"]')).forEach((b) => b.click()); true")
  await a.esp(500)
  await a.evaluar("(() => { const c = Array.from(document.querySelectorAll('button')).find((b) => /^Miradores\\s*\\d*$/.test((b.textContent || '').trim())); c?.click(); return Boolean(c) })()")
  await a.esp(1500)
  const mir = await a.evaluar("Array.from(document.querySelectorAll('span.font-display')).map((x) => x.textContent).filter((t) => t && !/^(Roma|Explorar)/.test(t))")
  debe(mir.slice(0, 3).join('|') === 'Cúpula de San Pedro|Terraza del Altar de la Patria|Mirador del Janículo', 'listas', `Miradores en pantalla: ${mir.slice(0, 4).join(', ')}`)
  await a.captura(path.join(SALIDA, '10o_miradores.jpg'))
  // La ficha de la Terraza y su [+].
  await a.evaluar("Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === 'Terraza del Altar de la Patria').closest('button').click(); true")
  await a.esp(2500)
  const ficha = await a.evaluar('document.body.innerText')
  debe(/Terraza del Altar de la Patria/.test(ficha) && /09:30/.test(ficha) && /\+ Añadir/.test(ficha), 'terraza', 'la ficha de la Terraza sale con su horario y su [+ Añadir]')
  await a.captura(path.join(SALIDA, '10o_ficha_terraza.jpg'))
  a.cerrar()
}

{
  // Con pase: las dos pestañas, sin candado, y «Cerca de ti» cambia de pestaña.
  const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  await preparar(a)
  await irAExplorar(a)
  await a.evaluar(tarjeta('Atracciones'))
  await a.esp(2500)
  const pest = await a.evaluar("(() => { const p = document.querySelector('[data-pestanas-explorar]'); return p ? { botones: Array.from(p.querySelectorAll('button')).map((b) => (b.textContent || '').trim()), candado: Boolean(p.querySelector('[data-candado]')) } : null })()")
  debe(pest && pest.botones.join('|') === 'Recomendados|Cerca de ti' && pest.candado === false, 'pestanas', `con pase salen las dos pestañas, sin candado (${pest?.botones?.join('|')})`)
  await a.evaluar("document.querySelector('[data-pestana=\"nearby\"]').click(); true")
  await a.esp(1000)
  debe((await a.evaluar("document.querySelector('[data-aviso-pase]')")) === null, 'pestanas', 'con pase, «Cerca de ti» no abre el aviso: cambia de pestaña y ordena por cercanía')
  debe(await a.evaluar("document.querySelector('[data-pestana=\"nearby\"]').getAttribute('data-elegida') === '1'"), 'pestanas', 'y el interruptor se mueve a «Cerca de ti»')
  await a.captura(path.join(SALIDA, '10o_pestanas_con_pase.jpg'))
  a.cerrar()
}

{
  // Excursiones y Entradas (la lista) + añadir sin hora + los días con fecha.
  const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0' })
  await preparar(a)
  await irAExplorar(a)
  await a.evaluar(tarjeta('Excursiones'))
  await a.esp(3500)
  const exc = await a.evaluar("Array.from(document.querySelectorAll('[data-excursion-tarjeta]')).map((c) => ({ texto: c.innerText.replace(/\\s+/g, ' ').trim(), foto: Boolean(c.querySelector('span[aria-hidden][style*=\"url(\"]')) }))")
  debe(exc.length === 7, 'excursiones', `salen las siete excursiones (${exc.length})`)
  debe(exc.every((e) => /\d+ ?h/.test(e.texto) && /desde \d+ ?€/.test(e.texto)), 'excursiones', 'cada una con su duración y su precio «desde»')
  debe(exc.every((e) => !/undefined|null|NaN|\(0\)/.test(e.texto)), 'excursiones', 'ninguna con «undefined», «null» ni huecos')
  debe(exc.slice(0, 3).every((e) => e.foto), 'excursiones', 'las que se ven, con su foto (las demás la piden al llegar a la pantalla)')
  debe(!/civitatis/i.test(await a.evaluar('document.body.innerText')), 'excursiones', 'sin el nombre del proveedor en los textos de la lista')
  await a.captura(path.join(SALIDA, '10o_excursiones.jpg'))
  // Sin ningún dato de fuera: la tarjeta sale bonita igual (la parte de código: cada dato es opcional).
  const tarjetaSrc = sinComentarios(leer('src/components/route/placeExplorer/PlaceExplorerScreen.tsx'))
  debe(/datos\.length > 0/.test(tarjetaSrc) && /\.filter\(Boolean\)/.test(tarjetaSrc), 'excursiones', 'un dato que no llega no deja hueco: la tarjeta lo omite')
  // Entradas: el Castillo por fuera.
  await a.evaluar("(() => { const x = Array.from(document.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Cerrar' || b.querySelector('svg')); return true })()")
  await a.evaluar('import(\'/src/store/useRouteStore.ts\').then((m) => { m.useRouteStore.getState().setMode(\'route\'); return true })')
  await a.esp(800)
  await irAExplorar(a)
  await a.evaluar(tarjeta('Entradas'))
  await a.esp(3500)
  await a.evaluar(`Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === "Castillo de Sant'Angelo")?.scrollIntoView({ block: 'center' }); true`)
  await a.esp(2500)
  const fotoCastillo = await a.evaluar("(() => { const t = Array.from(document.querySelectorAll('span.font-display')).find((x) => x.textContent === \"Castillo de Sant'Angelo\"); const c = t?.closest('button'); const s = c?.querySelector('span[aria-hidden][style*=\"url(\"]'); return s ? s.getAttribute('style') : null })()")
  debe(fotoCastillo && /dia_castillo_sant_angelo_fuera/.test(fotoCastillo), 'castillo', 'en Entradas, el Castillo de Sant\'Angelo sale con la foto de fuera')
  await a.captura(path.join(SALIDA, '10o_entradas_castillo.jpg'))
  a.cerrar()
}

{
  const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=gratis&apertura=0' })
  await preparar(a)
  await irAExplorar(a)
  // Los días con su fecha.
  const dias = await a.evaluar("import('/src/lib/nombreDeDia.ts').then((n) => import('/src/store/useRouteStore.ts').then((m) => { const r = m.useRouteStore.getState().route; return r.days.filter((d) => !d.isReturnLeg).map((d) => n.diaConFecha(r, d.dayNumber)) }))")
  debe(dias.length >= 3 && dias.every((d) => /^(Lun|Mar|Mié|Jue|Vie|Sáb|Dom) \d{1,2} (Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)$/.test(d)), 'dias', `los días salen como «Jue 26 Nov» (${dias.join(', ')})`)
  // Añadir un sitio: la hoja no pide la hora y los días van con su fecha y su nombre.
  await a.evaluar(tarjeta('Atracciones'))
  await a.esp(2500)
  await a.evaluar("document.querySelector('button[aria-label=\"Añadir Galería Borghese\"]')?.click(); true")
  await a.esp(1500)
  const hojaAnadir = await a.evaluar("document.querySelector('[role=dialog]')?.innerText ?? ''")
  debe(!/\bHora\b/.test(hojaAnadir) && !document_vacio(hojaAnadir), 'sin_hora', 'la hoja de añadir no pide la hora')
  debe(!/Minutos|Cuánto tiempo quieres visitarlo/.test(hojaAnadir) && (await a.evaluar("document.querySelectorAll('[role=dialog] input[type=number]').length")) === 0, 'sin_minutos', 'ni la casilla de minutos «¿Cuánto tiempo quieres visitarlo?» (10O2)')
  await a.captura(path.join(SALIDA, '10o2_hoja_anadir.jpg'))
  const etiquetas = hojaAnadir.split('\n').filter((l) => /·/.test(l) && /^(Lun|Mar|Mié|Jue|Vie|Sáb|Dom) /.test(l))
  debe(etiquetas.length >= 3 && etiquetas.every((l) => /^(Lun|Mar|Mié|Jue|Vie|Sáb|Dom) \d{1,2} (Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic) · \S/.test(l)), 'dias', `cada día de la hoja va como «Jue 26 Nov · Roma antigua…» (${etiquetas[0]})`)
  // Un día en que cierra: el lunes (la Galería Borghese cierra los lunes).
  await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('[role=dialog] button')).find((x) => /^Lun /.test((x.textContent || '').trim())); b?.click(); return Boolean(b) })()")
  await a.esp(900)
  const aviso = await a.evaluar("document.querySelector('[data-aviso-cierra]')?.innerText.replace(/\\s+/g, ' ').trim() ?? null")
  // Tanda 10N4: solo un aviso en rojo, SIN botones («El lunes 12 cierra la Galería Borghese.»), debajo de la lista; la lista no lleva marcas en el día que cierra.
  debe(aviso && /^El lunes \d+ cierra la Galería Borghese\.$/.test(aviso), 'cierra', `el aviso de cierre, corto y con su artículo (${aviso})`)
  const sinBotones = await a.evaluar("(() => { const p = document.querySelector('[data-aviso-cierra]'); const hoja = document.querySelector('[role=dialog]'); return { botonesDentro: p ? p.querySelectorAll('button').length : -1, ponerOtro: document.querySelectorAll('[data-poner-otro-dia], [data-dejarlo-igual]').length, rojo: p ? getComputedStyle(p).color : null, debajoDeLaLista: p ? p.getBoundingClientRect().top >= Array.from(hoja.querySelectorAll('button')).filter((b) => /^Lun /.test((b.textContent || '').trim()))[0].getBoundingClientRect().bottom : false, lunes: Array.from(hoja.querySelectorAll('button')).find((b) => /^Lun /.test((b.textContent || '').trim()))?.innerText.replace(/\\s+/g, ' ') } })()")
  debe(sinBotones.botonesDentro === 0 && sinBotones.ponerOtro === 0, 'cierra', 'el aviso de cierre no lleva botones (ni [Ponerlo el …] ni [Dejarlo … igual])')
  debe(/^rgb\(/.test(sinBotones.rojo ?? '') && sinBotones.debajoDeLaLista, 'cierra', `en rojo (${sinBotones.rojo}) y debajo de la lista de días`)
  debe(sinBotones.lunes && !/cierra|cerrad/i.test(sinBotones.lunes), 'cierra', `y el día que cierra sale en la lista sin etiqueta ni marca (${sinBotones.lunes})`)
  await a.captura(path.join(SALIDA, '10o_anadir_cierra.jpg'))
  await a.captura(path.join(SALIDA, '10n4_cierra_aviso.jpg'))
  // Nunca se niega nada: [Añadir …] sigue activo con ese día y lo añade a ese día.
  const antes = await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route.days.map((d) => d.stops.map((s) => s.name)))")
  const anadir = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('[role=dialog] button')).find((x) => /^Añadir /.test((x.textContent || '').trim())); return b ? { activo: !b.disabled } : null })()")
  debe(anadir && anadir.activo, 'cierra', 'con el día que cierra elegido, [Añadir …] sigue activo (nunca se niega nada)')
  await a.evaluar("Array.from(document.querySelectorAll('[role=dialog] button')).find((x) => /^Añadir /.test((x.textContent || '').trim())).click(); true")
  await a.esp(900)
  const despues = await a.evaluar("import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().route.days.map((d) => ({ n: d.dayNumber, stops: d.stops.map((s) => s.name + (s.addedByUser ? '*' : '')) })))")
  const dondeEsta = despues.find((d) => d.stops.includes('Galería Borghese*'))
  debe(dondeEsta && dondeEsta.n === 3, 'cierra', `y lo añade a ESE día aunque cierre (día ${dondeEsta?.n})`)
  void antes
  // Un sitio que abre ese día: se añade sin avisos, en su mejor hueco (el de menos camino de más entre los abiertos).
  const huecoOk = await a.evaluar(`import('/src/lib/mejorHueco.ts').then((h) => import('/src/store/useRouteStore.ts').then((m) => {
    const r = m.useRouteStore.getState().route
    const dia = r.days[0]
    const q = (i) => dia.stops[i].coordinates
    // Un sitio puesto casi encima de la parada 3: tiene que entrar justo después (o antes) de ella, nunca al final.
    const sitio = { kind: 'place', name: 'Prueba', coordinates: { lat: q(3).lat + 0.0003, lng: q(3).lng + 0.0003 }, schedule: null, hours_data: {} }
    const draft = { id: 'x', name: 'Prueba', coordinates: sitio.coordinates, durationMinutes: 30, time: '09:00' }
    const c = h.mejorHuecoEnElDia(dia, draft, sitio, null, 30)
    return { indice: c.hueco.indice, cierra: c.cierra, paradas: dia.stops.length }
  }))`)
  debe(huecoOk && !huecoOk.cierra && (huecoOk.indice === 3 || huecoOk.indice === 4) && huecoOk.indice < huecoOk.paradas, 'hueco', `un sitio pegado a la parada 3 entra a su lado (hueco ${huecoOk?.indice} de ${huecoOk?.paradas})`)
  const cierraTodo = await a.evaluar(`import('/src/lib/mejorHueco.ts').then((h) => import('/src/store/useRouteStore.ts').then((m) => {
    const r = m.useRouteStore.getState().route
    const dia = r.days[0]
    const sitio = { kind: 'place', name: 'Cerrado', coordinates: dia.stops[1].coordinates, schedule: '09:00-10:00', hours_data: {} }
    const draft = { id: 'y', name: 'Cerrado', coordinates: sitio.coordinates, durationMinutes: 60, time: '09:00' }
    return h.mejorHuecoEnElDia(dia, draft, sitio, null, 60).cierra
  }))`)
  debe(cierraTodo === true, 'hueco', 'si no hay hueco en que esté abierto, lo dice (cierra)')
  a.cerrar()
}
function document_vacio(t) {
  return t.trim() === ''
}

/* ───────────────────────── Resultado ───────────────────────── */
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
console.log(`\nPrueba de los datos y la app de la Tanda 10O: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
