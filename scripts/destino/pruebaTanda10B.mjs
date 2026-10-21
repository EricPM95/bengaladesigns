// La prueba de la Tanda 10B: la pestaña RUTA (iconos, compartir, mapa solo con los destinos), el título y la tarjeta del día de vuelta, la lista de lo que incluye el pase y «Verme como viajero sin pase».
// («Verme como viajero sin pase» en el servidor se prueba entero en pruebaLogros1.mjs, sección 4; el modo noche, en pruebaJutrip.mjs.)
//   API_URL=http://localhost:8787 node scripts/destino/pruebaTanda10B.mjs      (con la app en http://localhost:5173 y el servidor encendidos)
import fs from 'node:fs'
import { prepararSSR } from './_ssr.mjs'
import { abrirApp } from './_enLaApp.mjs'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

const { M } = await prepararSSR('scripts/destino/_10b_entrada.tsx')

/* ── 1. La lista de lo que incluye el pase, y el número ── */
console.log('1. Lo que incluye el pase')
{
  const lista = JSON.parse(leer('data/pase/incluye.json'))
  const vent = lista.ventajas
  const ids = vent.map((v) => v.id)
  debe(new Set(ids).size === ids.length && vent.every((v) => v.id && v.texto && v.grupo && v.origen), 'pase', 'cada ventaja tiene id, grupo, texto y origen, y ningún id se repite')
  debe(M.totalVentajasDelPase() === vent.length && vent.length >= 21, 'pase', `la app cuenta la lista: hoy son ${vent.length} ventajas, una cosa por línea`)
  // Cada ✅ del apartado «EN EL PASE» de GRATIS_Y_PASE.md sale en la lista y cada línea de la lista sale de una de ellas.
  const doc = leer('docs/dias/GRATIS_Y_PASE.md')
  const apartado = doc.slice(doc.indexOf('## EN EL PASE'), doc.indexOf('## MÁS ADELANTE'))
  const hechos = apartado.split('\n').filter((l) => /^\s*- /.test(l) && l.includes('✅')).map((l) => l.replace(/^\s*- /, '').replace(/\*\*/g, ''))
  debe(hechos.length >= 20, 'pase', `se leen ${hechos.length} líneas hechas (✅) en «EN EL PASE»`)
  const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  for (const linea of hechos) debe(vent.some((v) => norm(linea).startsWith(norm(v.origen))), 'pase', `«${linea.slice(0, 60)}» está en la lista`)
  for (const v of vent) debe(hechos.some((l) => norm(l).startsWith(norm(v.origen))), 'pase', `«${v.texto}» sale de una línea del documento (${v.origen})`)
  // Los logros y los resúmenes, cada cosa por separado (no «los logros» como una sola).
  const textos = vent.map((v) => v.texto).join(' | ')
  debe(/sellos/i.test(textos) && /colecciones/i.test(textos) && /emblemas/i.test(textos) && /logros de viajero/i.test(textos) && /resumen de cada d/i.test(textos) && /resumen del viaje/i.test(textos), 'pase', 'los sellos, las colecciones, los emblemas, los logros de viajero y los dos resúmenes van cada uno en su línea')
  // El número del texto.
  debe(M.textoDeVentajas(21) === 'más de 20 ventajas' && M.textoDeVentajas(30) === 'más de 20 ventajas' && M.textoDeVentajas(32) === 'más de 20 ventajas' && M.textoDeVentajas(99) === 'más de 20 ventajas', 'numero', '21 o más: siempre «más de 20 ventajas» (también con 30 o más)')
  debe(M.textoDeVentajas(20) === '20 ventajas' && M.textoDeVentajas(12) === '12 ventajas' && M.textoDeVentajas(1) === '1 ventaja', 'numero', 'con menos de 21, el número exacto')
  const codigo = sinComentarios(leer('src/lib/ultimoDia.ts'))
  debe(!/\b(31|32)\b/.test(codigo), 'numero', 'el número de ventajas de hoy no está escrito en el código (sale de la lista)')
}

/* ── 2. Los textos del día de vuelta ── */
console.log('2. La tarjeta del día de vuelta')
{
  const sin = (modo) => M.textosDelUltimoDia({ modo, destino: 'Roma', conPase: false })
  const con = (modo) => M.textosDelUltimoDia({ modo, destino: 'Roma', conPase: true })
  const plano = (t) => t.partes.map((p) => p.texto).join('')
  debe(sin('avion').titulo === 'El último día, a la medida de tu vuelo' && con('avion').titulo === 'Tu último día, a la medida de tu vuelo', 'tarjeta', 'los dos títulos, tal cual')
  debe(plano(con('avion')) === 'Pon la hora de tu vuelo y te montamos la mañana con lo que te da tiempo a ver.', 'tarjeta', 'el texto con el pase, tal cual')
  debe(plano(sin('avion')) === 'Entre dejar el alojamiento, la maleta y llegar con tiempo al aeropuerto, el día de vuelta es el más difícil de organizar. Con el Pase de Roma, pones la hora de tu vuelo y te montamos la mañana para que la aproveches al máximo, sin prisas ni sustos. ¡Y no es todo: tienes más de 20 ventajas y tu viaje en directo con HOY!', 'tarjeta', 'el texto sin el pase, tal cual (con «más de 20 ventajas»)')
  debe(sin('avion').partes.filter((p) => p.oro).map((p) => p.texto).join('|') === 'Pase de Roma|más de 20 ventajas', 'tarjeta', '«Pase de Roma» y «más de 20 ventajas» van resaltados en oro')
  debe(sin('avion').botonPrincipal === 'Ver el Pase de Roma' && sin('avion').botonLugares === '+ Añadir mis lugares', 'tarjeta', 'sin pase: [Ver el Pase de Roma] y [+ Añadir mis lugares]')
  debe(con('avion').botonPrincipal === '+ Vuelo' && con('tren').botonPrincipal === '+ Tren' && con('bus').botonPrincipal === '+ Autobús' && con('ferry').botonPrincipal === '+ Ferry' && con('coche').botonPrincipal === '+ Hora de salida' && con(null).botonPrincipal === '+ Vuelo', 'tarjeta', 'con pase: [+ Vuelo], [+ Tren], [+ Autobús], [+ Ferry]… según cómo vuelve')
  const tu = { avion: 'tu vuelo', tren: 'tu tren', bus: 'tu autobús', ferry: 'tu ferry', coche: 'tu hora de salida', nulo: 'tu vuelo o tu tren' }
  for (const [modo, frase] of Object.entries(tu)) {
    const m = modo === 'nulo' ? null : modo
    debe(sin(m).titulo === `El último día, a la medida de ${frase}` && con(m).titulo === `Tu último día, a la medida de ${frase}`, 'tarjeta', `${modo}: «${frase}» en los dos títulos`)
    debe(plano(sin(m)).includes(frase) && plano(con(m)).includes(frase), 'tarjeta', `${modo}: «${frase}» en los dos textos`)
  }
  debe(plano(sin('avion')).includes('al aeropuerto') && plano(sin('tren')).includes('a la estación') && plano(sin('bus')).includes('a la estación') && plano(sin('ferry')).includes('al puerto') && plano(sin('coche')).includes('salir con tiempo') && plano(sin(null)).includes('al aeropuerto o a la estación'), 'tarjeta', '«llegar con tiempo al aeropuerto» cambia a «a la estación» o «al puerto» según el medio')
  debe(M.textosDelUltimoDia({ modo: 'avion', destino: 'Florencia', conPase: false }).botonPrincipal === 'Ver el Pase de Florencia', 'tarjeta', 'con otro destino, «Pase de Florencia»')
  debe(M.textosDelUltimoDia({ modo: 'avion', destino: 'Roma', conPase: false, ventajas: 18 }).partes.some((p) => p.texto === '18 ventajas'), 'tarjeta', 'con menos de 21, el texto dice el número exacto')
  // Letra legible: nada de gris claro ni letra pequeña en la tarjeta.
  const fuente = leer('src/components/route/dayDetail/TarjetaTuUltimoDia.tsx')
  debe(!/text-text\/\d+/.test(fuente) && !/italic text-\[1[0-3]px\]/.test(fuente) && /text-\[14\.5px\]/.test(fuente), 'tarjeta', 'letra de tinta y de 14,5 px (nada de gris claro ni letra pequeña)')
  // El título del día de vuelta.
  debe(M.DIA_DE_VUELTA === 'Hoy vuelves a casa' && M.lineaDeViaje(M.DIA_DE_VUELTA, 'Roma → Barcelona') === 'Roma → Barcelona · Día de viaje', 'titulo', 'el día de vuelta se llama «Hoy vuelves a casa» y debajo «Roma → Barcelona · Día de viaje»')
  debe(M.lineaDeViaje(M.DIA_DE_VIAJE, 'Barcelona → Roma') === 'Barcelona → Roma', 'titulo', 'el de llegada sin paradas sigue como estaba («Día de viaje», solo el trayecto)')
  const panel = sinComentarios(leer('src/components/route/dayDetail/DayDetailPanel.tsx'))
  debe(/isLastDay && route && !tarjetaUltimoDia/.test(panel), 'tarjeta', 'con la tarjeta, la barra de «+ AÑADIR VUELO» y «Fin del viaje» no salen debajo')
}

/* ── 3. El mapa de RUTA: los puntos de cada medio ── */
console.log('3. El mapa de RUTA')
{
  const llegada = JSON.parse(leer('data/dias/roma/_llegada.json'))
  const info = { ciudad: 'Roma', despedida: '', medios: llegada.medios }
  const centro = { lat: 41.9, lng: 12.5 }
  const mapa = (modo, extra = {}) => M.construirMapaDeDestinos({ ciudad: 'Roma', centro, modo, info, ...extra })
  const nombres = (m) => m.markers.filter((x) => x.id !== 'destino').map((x) => x.name).join(' | ')
  debe(mapa('avion').markers.length === 3 && /Fiumicino/.test(nombres(mapa('avion'))) && /Ciampino/.test(nombres(mapa('avion'))), 'mapa', 'avión: la ciudad, Fiumicino y Ciampino')
  debe(mapa('tren').markers.length === 3 && /Termini/.test(nombres(mapa('tren'))) && /Tiburtina/.test(nombres(mapa('tren'))), 'mapa', 'tren: la ciudad, Roma Termini y Roma Tiburtina')
  debe(mapa('bus').markers.length === 2 && /autobuses de Tiburtina/.test(nombres(mapa('bus'))), 'mapa', 'autobús: la ciudad y la estación de autobuses de Tiburtina (sin completar con las del tren)')
  debe(mapa('ferry').markers.length === 2 && /Civitavecchia/.test(nombres(mapa('ferry'))), 'mapa', 'ferry: la ciudad y el puerto de Civitavecchia')
  debe(mapa('coche').markers.length === 1 && mapa('coche').markers[0].id === 'destino', 'mapa', 'coche: sin punto, solo la ciudad')
  debe(mapa('avion', { info: null }).markers.length === 1, 'mapa', 'sin datos de llegada del destino, solo la ciudad')
  const ico = (modo) => mapa(modo).markers.filter((x) => x.id !== 'destino').map((x) => x.icon)
  debe(ico('avion').every((i) => i === 'avion') && ico('tren').every((i) => i === 'tren') && ico('bus').every((i) => i === 'bus') && ico('ferry').every((i) => i === 'barco'), 'mapa', 'cada punto lleva el icono de su medio (avión, tren, autobús, barco)')
  debe(mapa('avion').markers.every((x) => x.iconPath && x.iconPath.length > 20), 'mapa', 'iconos de trazo fino (el dibujo de la familia de iconos de la app)')
  debe(mapa('avion').resaltados.length === 0, 'mapa', 'sin vuelo puesto, ninguno resaltado')
  const elegido = mapa('tren', { puntoLlegadaId: 'tiburtina' })
  debe(elegido.resaltados.join() === 'llegada:tiburtina' && elegido.markers.find((x) => x.id === 'llegada:tiburtina').bg === '#8B6620', 'mapa', 'con el tren puesto, el punto que va a usar va resaltado (relleno de oro y anillo)')
  debe(mapa('avion', { puntoSalidaId: 'cia', modoVuelta: 'tren' }).resaltados.length === 0 && mapa('avion', { puntoSalidaId: 'cia', modoVuelta: 'avion' }).resaltados.join() === 'llegada:cia', 'mapa', 'el punto de la vuelta solo se resalta si es del mismo medio')
  const vista = leer('src/components/route/RouteView.tsx')
  debe(/<MapaDeRuta route=\{route\} centro=\{cityCenter\} \/>/.test(vista), 'mapa', 'la pestaña RUTA, con un solo destino, pinta el mapa nuevo')
  const bloqueRuta = vista.slice(vista.indexOf('showRouteStyleMap ? ('), vista.indexOf("mode === 'explore' && exploreMarkers === null"))
  debe(bloqueRuta.length > 100 && !/buildCombinedDaysMarkers/.test(bloqueRuta) && /buildCombinedDaysMarkers\(route\.days, activeDayId\)/.test(vista), 'mapa', 'RUTA ya no usa los marcadores de las paradas; DÍAS sigue con los suyos (no se toca)')
}

/* ── 4. La pestaña RUTA y el día de vuelta, en la app ── */
console.log('4. RUTA y DÍAS en la app')
{
  const app = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=on&logros=on&logrosDemo=1' })
  for (let i = 0; i < 120 && !(await app.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await app.esp(500)
  for (let i = 0; i < 60 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await app.esp(500)
  await app.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 60 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(6000)
  for (let i = 0; i < 4; i++) {
    const cerrado = await app.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!cerrado) break
    await app.esp(600)
  }
  const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState())"
  const poner = (codigo) => app.evaluar("import('/src/store/useRouteStore.ts').then((m) => { const set = m.useRouteStore.setState; const get = m.useRouteStore.getState; " + codigo + "; return true })")
  const medio = (id, punto) => poner('set({ route: { ...get().route, arrivalPointId: ' + JSON.stringify(punto) + ", transportContext: { ...get().route.transportContext, transport_option: { ...get().route.transportContext.transport_option, id: '" + id + "' } } } })")
  const ruta = () => app.evaluar(`${store}.then((s) => { s.setActiveDayId(null); s.setMode('route'); return true })`)
  const pines = () => app.evaluar("(() => { const m = Array.from(document.querySelectorAll('.mapboxgl-marker')); return { total: m.length, numerados: m.filter((e) => /^[0-9]+$/.test((e.textContent || '').trim())).length, oro: m.filter((e) => e.firstElementChild && getComputedStyle(e.firstElementChild).backgroundColor === 'rgb(139, 102, 32)').length } })()")
  await ruta()
  for (const [id, punto, esperados, oro, nombre] of [['flight', null, 3, 1, 'avión'], ['train', 'tiburtina', 3, 2, 'tren (con Tiburtina puesta)'], ['bus', null, 2, 1, 'autobús'], ['ferry', null, 2, 1, 'ferry'], ['car', null, 1, 1, 'coche']]) {
    await medio(id, punto)
    await ruta()
    await app.esp(4500)
    const p = await pines()
    debe(p.total === esperados && p.numerados === 0 && p.oro === oro, 'ruta', `${nombre}: ${esperados} pines (la ciudad y los puntos de llegada), ninguna parada numerada, ${oro} de oro (${JSON.stringify(p)})`)
  }
  // Los iconos de la tarjeta, más pequeños.
  await medio('flight', null)
  await ruta()
  await app.esp(1500)
  const iconos = await app.evaluar("(() => { const b = document.querySelector('[aria-label^=\"Tips de\"]'); const c = b && b.firstElementChild; const r = c && c.getBoundingClientRect(); return r ? Math.round(r.width) : null })()")
  debe(iconos !== null && iconos <= 33, 'iconos', `los iconos de la tarjeta del destino miden ${iconos} px (antes 38)`)
  // Compartir el viaje: un icono más (con cuenta y viaje guardado); abre lo de invitar.
  await app.evaluar("import('/src/store/useSyncStore.ts').then((m) => { m.useSyncStore.setState({ activeTripId: 'prueba-viaje' }); return true })")
  await app.esp(1500)
  const comp = await app.evaluar("(() => { const b = document.querySelector('[data-compartir-viaje]'); const c = b && b.firstElementChild; const r = c && c.getBoundingClientRect(); return b ? { ancho: Math.round(r.width), etiqueta: b.getAttribute('aria-label'), dentroDeLaTarjeta: Boolean(b.closest('.rounded-3xl')) } : null })()")
  debe(comp !== null && comp.ancho <= 33 && comp.etiqueta === 'Compartir viaje' && comp.dentroDeLaTarjeta === true, 'compartir', `el icono de compartir está en la tarjeta del destino, del mismo tamaño que los demás (${JSON.stringify(comp)})`)
  const pildora = await app.evaluar("Array.from(document.querySelectorAll('button')).some((b) => (b.textContent || '').trim() === 'Compartir viaje')")
  debe(pildora === false, 'compartir', 'ya no hay botón oscuro «Compartir viaje» encima de la tarjeta')
  await app.evaluar("(() => { const b = document.querySelector('[data-compartir-viaje]'); if (b) b.click(); return true })()")
  let abierto = null
  for (let i = 0; i < 20 && !abierto; i++) {
    await app.esp(500)
    abierto = await app.evaluar("import('/src/store/usePagoStore.ts').then((m) => { const s = m.usePagoStore.getState(); return s.hoja && s.hoja.tipo === 'invitar' ? s.hoja.tipo : null })").catch(() => null)
  }
  debe(abierto === 'invitar', 'compartir', 'tocarlo abre la hoja de invitar que ya existía (Cuentas, parte 3)')

  // El día de vuelta, en DÍAS.
  await app.evaluar("import('/src/store/usePagoStore.ts').then((m) => { const s = m.usePagoStore.getState(); if (s.cerrar) s.cerrar(); return true })").catch(() => {})
  await poner("const r = get().route; if (!r.days.some((d) => d.isReturnLeg)) set({ route: { ...r, days: [...r.days, { id: 'dret', dayNumber: r.days.length + 1, city: r.days[0].city, countryCode: r.days[0].countryCode, title: '', curatedTitle: '', stops: [], meals: [], excursions: [], isReturnLeg: true, colorIndex: 2 }] } })")
  const abrirVuelta = async () => {
    await app.evaluar(`${store}.then((s) => { s.setMode('days'); s.setActiveDayId(null); return true })`)
    await app.esp(3000)
    await app.evaluar("(() => { const t = Array.from(document.querySelectorAll('h2,h3,span,p,div')).find((e) => e.children.length === 0 && (e.textContent || '').trim() === 'Hoy vuelves a casa'); const b = t && (t.closest('button') || t.closest('[role=button]') || t); if (b) b.click(); return Boolean(b) })()")
    await app.esp(3500)
    return app.evaluar("(() => { const t = document.querySelector('[data-tarjeta-ultimo-dia]'); const q = (s) => (t && t.querySelector(s) ? t.querySelector(s).textContent : null); return { titulo: Array.from(document.querySelectorAll('h2,h3,span,p')).some((e) => e.children.length === 0 && (e.textContent || '').trim() === 'Hoy vuelves a casa'), tarjeta: t ? t.getAttribute('data-tarjeta-ultimo-dia') : null, h: q('[data-ultimo-dia-titulo]'), boton: q('[data-ultimo-dia=principal]'), lugares: q('[data-ultimo-dia=lugares]'), fin: document.body.innerText.includes('Fin del viaje'), color: t ? getComputedStyle(t.querySelector('[data-ultimo-dia-texto]')).color : null, tam: t ? getComputedStyle(t.querySelector('[data-ultimo-dia-texto]')).fontSize : null } })()")
  }
  await medio('flight', null)
  const conPase = await abrirVuelta()
  debe(conPase.titulo === true && conPase.tarjeta === 'con-pase' && conPase.h === 'Tu último día, a la medida de tu vuelo' && conPase.boton === '+ Vuelo' && conPase.lugares === '+ Añadir mis lugares', 'vuelta', `con el pase: título «Hoy vuelves a casa», la tarjeta, [+ Vuelo] y [+ Añadir mis lugares] (${JSON.stringify(conPase)})`)
  debe(conPase.fin === false, 'vuelta', 'y sin «Fin del viaje» debajo')
  debe(conPase.color === 'rgb(28, 34, 48)' && conPase.tam === '14.5px', 'vuelta', `letra de tinta y de 14,5 px (${conPase.color} · ${conPase.tam})`)
  await app.evaluar("import('/src/store/useSinPasePrueba.ts').then((m) => { m.useSinPasePrueba.getState().poner(true); return true })")
  await app.esp(2000)
  const sinPase = await app.evaluar("(() => { const t = document.querySelector('[data-tarjeta-ultimo-dia]'); return t ? { tarjeta: t.getAttribute('data-tarjeta-ultimo-dia'), h: t.querySelector('[data-ultimo-dia-titulo]').textContent, texto: t.querySelector('[data-ultimo-dia-texto]').textContent, boton: t.querySelector('[data-ultimo-dia=principal]').textContent, oros: Array.from(t.querySelectorAll('[data-pase-resaltado]')).map((e) => e.textContent) } : null })()")
  debe(Boolean(sinPase) && sinPase.tarjeta === 'sin-pase' && sinPase.h === 'El último día, a la medida de tu vuelo' && sinPase.boton === 'Ver el Pase de Roma' && sinPase.oros.join('|') === 'Pase de Roma|más de 20 ventajas' && /llegar con tiempo al aeropuerto/.test(sinPase.texto), 'vuelta', `«Verme sin pase» encendido: la tarjeta sin pase, con el Pase y las ventajas en oro (${JSON.stringify(sinPase && sinPase.oros)})`)
  const etiqueta = await app.evaluar("(document.querySelector('[data-sin-pase-prueba]') || {}).textContent || null")
  debe(etiqueta === 'Sin pase (prueba)', 'sin_pase', 'se ve la etiqueta pequeña «Sin pase (prueba)»')
  debe((await app.evaluar("import('/src/lib/pago.ts').then((m) => m.pagoActivo())")) === false, 'sin_pase', 'encendido, lo de pago queda cerrado en la app (pagoActivo es falso)')
  await app.evaluar("import('/src/store/useSinPasePrueba.ts').then((m) => { m.useSinPasePrueba.getState().poner(false); return true })")
  await app.esp(1500)
  debe((await app.evaluar("import('/src/lib/pago.ts').then((m) => m.pagoActivo())")) === true && (await app.evaluar("document.querySelector('[data-sin-pase-prueba]') === null")) === true, 'sin_pase', 'apagado, vuelve el pase y desaparece la etiqueta')
  for (const [id, h] of [['train', 'Tu último día, a la medida de tu tren'], ['bus', 'Tu último día, a la medida de tu autobús'], ['ferry', 'Tu último día, a la medida de tu ferry'], ['car', 'Tu último día, a la medida de tu hora de salida']]) {
    await medio(id, null)
    const r = await abrirVuelta()
    debe(r.h === h, 'vuelta', `${id}: «${h}»`)
  }
  app.cerrar()
}

/* ── 5. «Verme como viajero sin pase»: solo el servidor ── */
console.log('5. «Verme como viajero sin pase»')
{
  const rutas = sinComentarios(leer('server/logros/rutas.js'))
  debe(/app\.post\('\/api\/admin\/logros\/sin-pase', conAdmin/.test(rutas) && /app\.get\('\/api\/pase\/sin-pase', conUsuario/.test(rutas), 'sin_pase', 'se enciende solo por la ruta de administrador; el móvil solo lee')
  const admin = leer('src/components/logros/AdminLogros.tsx')
  debe(/Verme como viajero sin pase/.test(admin) && /\/api\/admin\/logros\/sin-pase/.test(admin), 'sin_pase', 'el interruptor está en /?admin=logros → Mis pruebas')
  const cliente = sinComentarios(leer('src/store/useSinPasePrueba.ts') + leer('src/components/pase/SinPasePrueba.tsx'))
  debe(!/localStorage|sessionStorage|location\.search|URLSearchParams/.test(cliente), 'sin_pase', 'nada del móvil puede encenderlo: ni dirección, ni almacenamiento (solo lo que contesta el servidor)')
  const migracion = leer('supabase/migrations/0030_admin_sin_pase.sql')
  debe(/enable row level security/.test(migracion) && !/create policy/.test(migracion.replace(/--[^\n]*/g, '')), 'sin_pase', 'la tabla (migración 0030) está cerrada al móvil: sin políticas')
  debe(/LOGROS_ADMIN_EMAILS/.test(leer('server/logros/rutas.js')) && !/@[a-z0-9-]+\.(com|es|org)/i.test(rutas), 'sin_pase', 'los emails de administrador salen de LOGROS_ADMIN_EMAILS (ninguno en el código)')
}

console.log(`\nLa prueba de la Tanda 10B: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
