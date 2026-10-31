// Tanda 10S8 (agente C) · apartado 3 «Llegada y vuelta» como Design (B1b-B4), la parte del cliente del 2 (candado + aviso del pase) y del 6 (papelera, cabeceras, fechas enteras) de ese bloque.
//   · sin pase: [Añadir tarjeta de embarque] / [Añadir tu billete] con el candado y su aviso del pase (tren: «tu billete», «en la estación»); lo ya guardado se ve; con pase, sin candado;
//   · cada lado con su botón y su papelera roja de 44 x 44 abajo a la derecha; los dos lápices de 44 x 44; sin tarjeta: hora grande y trayecto, sin duración, sin «Desde el PDF…» ni «Cambiar los datos»;
//   · el precio abajo del todo («Precio total · 180 €» / solo con ida «Precio · 180 €») con su lápiz y su hoja (con la nota en gris); «Datos del vuelo» y la hoja del vuelo comparten las horas;
//   · la Ida plegada con la llegada; la pregunta de la hora y el aviso de la fecha tras leer una tarjeta; «Vuelo VY 6102» en una línea a 375 px; tren igual (B3);
//   · la lista de la comprobación (REPASO_10S8.html) tiene sus apartados (solo si existe: lo escribe el agente principal).
// Capturas docs/dias/capturas_jutrip/10s8_vuelo_<version>_<n>.jpg (390 x 844).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S8_C.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
let pasadaActual = ''
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto: `(${pasadaActual}) ${texto}` })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (version, n) => path.join(SALIDA, `10s8_vuelo_${version}_${n}.jpg`)
const PNG = path.resolve('scripts/destino/_ejemplos_billete/captura_tren_ejemplo.png')

// Un código QR dibujado (SVG) para sembrar el billete sin PDF.
const DIBUJO = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="white"/><path d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM10 10h3v3h-3zM15 13h5v2h-5zM10 16h3v4h-3z" fill="black"/></svg>')

async function pasada(version) {
  const sin = version === 'gratis'
  const et = sin ? 'sin pase' : 'con pase'
  pasadaActual = et
  console.log(`\n== ${et} ==`)
  const a = await abrirApp(APP, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=${version}`, ancho: 390, alto: 844 })
  try {
    const ev = (js) => a.evaluar(js)
    for (let intento = 0; intento < 3; intento++) {
      for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
      try {
        await ev('window.__rutaPrueba().then(() => true)')
        break
      } catch (e) {
        if (intento === 2) throw e
        await ev('location.reload()').catch(() => undefined)
        await a.esp(5000)
      }
    }
    for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    for (let i = 0; i < 6; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    await a.cdp('Page.setInterceptFileChooserDialog', { enabled: true }).catch(() => undefined)
    // Las fechas del viaje, en el futuro (la Ida de un día ya pasado se pliega: se prueba aparte).
    const inicio = '2027-03-04'
    const fin = '2027-03-08'
    // El servidor que lee con Claude se sustituye por una respuesta guardada: la prueba no gasta llamadas.
    const lectura = (extra = {}) => ({ modo: 'avion', numero: 'VY 6102', compania: 'Vueling', localizador: 'ABC123', fecha: inicio, fecha_llegada: null, hora_salida: '08:30', hora_llegada: '10:25', origen: { ciudad: 'Barcelona', codigo: 'BCN', nombre: 'Barcelona-El Prat', terminal: '1', puerta: 'B34' }, destino: { ciudad: 'Roma', codigo: 'FCO', nombre: 'Roma-Fiumicino', terminal: '1', puerta: null }, asiento: '14C', coche: null, codigo_caja: null, ...extra })
    await ev(`(() => { window.__lectura = ${JSON.stringify(lectura())}; const f0 = window.fetch.bind(window); window.fetch = async (u, o) => { if (String(u).includes('/api/read-ticket')) return new Response(JSON.stringify(window.__lectura), { status: 200, headers: { 'Content-Type': 'application/json' } }); return f0(u, o) }; return true })()`)

    // La captura con el bloque «Llegada y vuelta» arriba del todo (las hojas y los avisos no se mueven).
    const cap = async (n) => {
      await ev("(() => { const b = document.querySelector('[data-blk=\"llegada\"]'); if (b && !document.querySelector('[role=dialog]')) { b.scrollIntoView({ block: 'start' }); window.scrollBy?.(0, -70) } return true })()")
      await a.esp(400)
      await a.captura(foto(version, n))
    }
    const ruta = (js) => ev(`(() => { const st = window.__ruta.getState(); ${js}; return true })()`)
    const vaAReservas = async () => {
      await ev("window.__ruta.getState().setMode('bookings'); true")
      await a.esp(1500)
    }
    const abrirLlegada = async () => {
      const abierto = await ev("document.querySelectorAll('[data-blk=\"llegada\"] [data-mitad]').length")
      if (!abierto) {
        await ev("document.querySelector('[data-blk=\"llegada\"] [data-llegada-cabecera]')?.click(); true")
        await a.esp(500)
      }
    }
    const cerrarHojas = async () => {
      for (let i = 0; i < 6 && (await ev("Boolean(document.querySelector('[role=dialog]'))")); i++) {
        await ev("(() => { const d = document.querySelector('[role=dialog]'); const b = d.querySelector('button[aria-label=Cerrar]') ?? Array.from(d.querySelectorAll('button')).find((x) => /Entendido|Vale|Cerrar|Listo/.test(x.textContent || '')); b?.click(); return true })()")
        await a.esp(500)
      }
    }
    const caja = (sel) => `(() => { const e = ${sel}; if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) } })()`
    const mitad = (k) =>
      ev(`(() => {
        const m = document.querySelector('[data-blk="llegada"] [data-mitad="${k}"]')
        if (!m) return null
        const bm = m.getBoundingClientRect()
        const q = (s) => m.querySelector(s)
        const dim = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), derecha: Math.round(bm.right - r.right), abajo: Math.round(bm.bottom - r.bottom), y: Math.round(r.top) } }
        const papelera = q('[data-papelera]')
        const boton = q('[data-anadir-doc]')
        return {
          texto: m.innerText.replace(/\\s+/g, ' '),
          fecha: q('[data-mitad-fecha]')?.textContent ?? null,
          trayecto: q('[data-billete-trayecto]')?.textContent ?? null,
          horaSola: q('[data-billete-hora-sola]')?.textContent ?? null,
          horaIzq: q('[data-billete-hora-izq]')?.textContent ?? null,
          horaDer: q('[data-billete-hora-der]')?.textContent ?? null,
          boton: boton?.textContent.trim() ?? null,
          candado: boton ? boton.getAttribute('data-con-candado') : null,
          candadoDibujado: Boolean(boton?.parentElement.querySelector('[data-candado-redondo]')),
          ayuda: q('[data-billete-ayuda]')?.textContent ?? null,
          cambiarDatos: Boolean(q('[data-billete-cambiar-datos]')),
          filas: Array.from(m.querySelectorAll('[data-billete-fila]')).map((f) => [f.getAttribute('data-billete-fila'), f.textContent.trim()]),
          filaNumero: dim(q('[data-billete-fila="numero"] span:last-child')),
          filaNumeroLineas: (() => { const e = q('[data-billete-fila="numero"] span:last-child'); if (!e) return null; const lh = parseFloat(getComputedStyle(e).lineHeight) || 18; return Math.round(e.getBoundingClientRect().height / lh) })(),
          chip: Boolean(q('[data-billete-codigo-pequeno]')),
          ampliar: /Toca para ampliar/.test(m.innerText),
          papelera: dim(papelera),
          papeleraColor: papelera ? getComputedStyle(papelera.querySelector('svg')).color : null,
          lapizArriba: dim(q('[data-cambiar-mitad]')),
          lapizDatos: dim(q('[data-lapiz="datos-billete"]')),
          plegada: m.getAttribute('data-mitad-plegada') === '1',
          alto: Math.round(bm.height),
          ancho: Math.round(bm.width),
        }
      })()`)
    const cabecera = () => ev(`(() => { const c = document.querySelector('[data-blk="llegada"] [data-llegada-cabecera]'); return Array.from(c?.querySelector('span.flex-col')?.children ?? []).map((x) => (x.textContent || '').trim()) })()`)
    const precioFila = () => ev(`(() => { const f = document.querySelector('[data-blk="llegada"] [data-precio-vuelo]'); if (!f) return null; const r = f.getBoundingClientRect(); const m = document.querySelector('[data-blk="llegada"] [data-mitad]:last-of-type'); const l = f.querySelector('[data-lapiz="precio-vuelo"]')?.getBoundingClientRect(); const ultimo = Array.from(document.querySelectorAll('[data-blk="llegada"] [data-mitad]')).pop(); const hijos = Array.from(f.parentElement.children); return { texto: f.querySelector('[data-precio-vuelo-texto]')?.textContent ?? null, ultimaFila: hijos[hijos.length - 1] === f, lapiz: l ? { w: Math.round(l.width), h: Math.round(l.height) } : null, despuesDeVuelta: ultimo ? r.top >= ultimo.getBoundingClientRect().bottom - 1 : null } })()`)
    const click = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
    const dialogo = () => ev("(() => { const d = document.querySelector('[role=dialog]'); return d ? d.innerText.replace(/\\s+/g, ' ') : null })()")
    const sembrarBillete = (kind, extra = '') =>
      ev(`(() => { const b = window.__billete.getState(); const id = window.__ruta.getState().route; b.poner(null, ${JSON.stringify(kind)}, { horaRoma: ${JSON.stringify(kind === 'arrival' ? '11:25' : '18:05')}, localizador: 'ABC123', terminal: '1', asiento: '14C', coche: null, codigo: { texto: 'x', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(DIBUJO)} }, codigoFuera: 'BCN', dueno: null${extra} }); return true })()`)

    /* ── 1. Sin tarjetas (B1b): hora grande, trayecto, botón con su candado, papelera ── */
    await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, answers: { ...r.answers, origin: 'Barcelona', originPlace: undefined, dateRange: { start: '2027-03-04', end: '2027-03-08' } }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:25', departureFlightTime: '18:05', arrivalPointId: 'fco', departurePointId: 'cia', arrivalOtroPunto: 'El Prat', departureOtroPunto: 'El Prat', arrivalOtraHora: '08:30', departureOtraHora: '20:35', arrivalCodigo: 'VY 6102', departureCodigo: 'VY 6105', arrivalCompania: 'Vueling', departureCompania: null, arrivalPrecio: { amount: 180, currency: 'EUR' }, departurePrecio: null } })`)
    await vaAReservas()
    await abrirLlegada()
    let ida = await mitad('arrival')
    let vuelta = await mitad('departure')
    debe(ida && vuelta, 'base', 'la ida y la vuelta existen')
    debe(ida.boton === 'Añadir tarjeta de embarque' && vuelta.boton === 'Añadir tarjeta de embarque', 'boton', `cada lado con su [Añadir tarjeta de embarque] (${ida.boton} · ${vuelta.boton})`)
    debe(sin ? ida.candado === '1' && vuelta.candado === '1' && ida.candadoDibujado && vuelta.candadoDibujado : ida.candado === '0' && vuelta.candado === '0' && !ida.candadoDibujado && !vuelta.candadoDibujado, 'candado', sin ? 'sin pase: el candado dorado en su círculo azul noche en los dos botones' : 'con pase: nunca candado')
    debe(ida.papelera && vuelta.papelera && ida.papelera.w === 44 && ida.papelera.h === 44 && vuelta.papelera.w === 44, 'papelera', `cada lado con su papelera de 44 x 44 (${JSON.stringify(ida.papelera)})`)
    debe(ida.papelera && ida.papelera.derecha <= 24 && ida.papelera.abajo <= 24, 'papelera', `la papelera abajo a la derecha (${JSON.stringify(ida.papelera)})`)
    debe(/^oklch\(0\.52 0\.19 25\)$/.test(ida.papeleraColor ?? ''), 'papelera', `la papelera en rojo (${ida.papeleraColor})`)
    debe(!/Eliminar vuelo|Quitar entrada|Eliminar alojamiento/.test(ida.texto + vuelta.texto), 'papelera', 'fuera «Eliminar vuelo»')
    debe(ida.lapizArriba && ida.lapizArriba.w === 44 && ida.lapizArriba.h === 44 && vuelta.lapizArriba.w === 44, 'lapices', `el lápiz de arriba, 44 x 44 (${JSON.stringify(ida.lapizArriba)})`)
    debe(ida.lapizDatos == null && vuelta.lapizDatos == null, 'lapices', 'sin tarjeta no hay bloque de datos ni su lápiz')
    debe(ida.horaSola === '11:25' || ida.horaIzq != null, 'b1', `hora grande (${ida.horaSola ?? ida.horaIzq})`)
    debe(ida.horaIzq === '08:30' && ida.horaDer === '11:25', 'b1', `con la hora de salida puesta: 08:30 → 11:25 (${ida.horaIzq} → ${ida.horaDer})`)
    debe(ida.trayecto === 'Barcelona (El Prat) → Roma (Fiumicino)', 'trayecto', `el trayecto (${ida.trayecto})`)
    debe(!ida.ayuda && !/Desde el PDF/.test(ida.texto + vuelta.texto), 'fuera', 'fuera «Desde el PDF, una foto o una captura.»')
    debe(!ida.cambiarDatos && !/Cambiar los datos/.test(ida.texto), 'fuera', 'fuera «Cambiar los datos»')
    debe(!/\d h \d+ min|\d h$/.test(ida.texto + vuelta.texto), 'fuera', `fuera la duración calculada sin tarjeta (${ida.filas.map((f) => f[0])})`)
    debe(/^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo) \d{1,2}/.test(ida.fecha ?? '') && /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo) \d{1,2}/.test(vuelta.fecha ?? ''), 'fechas', `fechas enteras: «${ida.fecha}» y «${vuelta.fecha}»`)
    const cab = await cabecera()
    debe(cab.length === 2 && cab[0] === 'Llegada y vuelta' && !/→/.test(cab.join(' ')), 'cabecera', `la cabecera sin línea bajo el título, con el estado (${JSON.stringify(cab)})`)
    let precio = await precioFila()
    debe(precio && /^Precio total · /.test(precio.texto ?? ''), 'precio', `el precio abajo del todo: «${precio?.texto}»`)
    debe(precio && precio.despuesDeVuelta && precio.ultimaFila, 'precio', 'debajo de la Vuelta y en su fila, lo último del bloque')
    debe(precio && precio.lapiz && precio.lapiz.w === 44 && precio.lapiz.h === 44, 'lapices', 'el lápiz del precio, 44 x 44')
    await cap('01_b1b')

    // El botón: sin pase abre el aviso pequeño con su texto; con pase no lo abre.
    await click('[data-blk="llegada"] [data-mitad="arrival"] [data-anadir-doc]')
    await a.esp(700)
    let d = await dialogo()
    if (sin) {
      debe(d && /Con el Pase [A-Za-zÀ-ÿ ]+, guardas tu tarjeta de embarque y la tienes a mano en el aeropuerto, aunque no haya internet\./.test(d), 'aviso', `el aviso del pase del vuelo (${d})`)
      debe(d && /Ver el Pase/.test(d), 'aviso', '[Ver el Pase Roma]')
      await cap('02_aviso_vuelo')
      await cerrarHojas()
    } else {
      debe(!d || !/Con el Pase/.test(d), 'aviso', `con pase no sale el aviso (${d})`)
      await cerrarHojas()
    }

    /* ── 2. Solo con la ida (B1d): «Precio» ── */
    await ruta("st.removeFlightLeg('departure')")
    await a.esp(600)
    precio = await precioFila()
    debe(precio && /^Precio · /.test(precio.texto ?? ''), 'precio', `solo con la ida: «Precio · …» (${precio?.texto})`)
    await cap('03_b1d_solo_ida')
    await ruta("st.guardarVueloDelAdmin({ departure: { time: '18:05', pointId: 'cia' } }); st.setLegOtroPunto('departure', 'El Prat'); st.setLegOtraHora('departure', '20:35'); st.setLegCodigo('departure', 'VY 6105'); st.setLegPrecio('arrival', { amount: 180, currency: 'EUR' })")
    await a.esp(600)
    await abrirLlegada()

    /* ── 3. El lápiz del precio: hoja pequeña con la nota en gris; guarda y va al presupuesto ── */
    await click('[data-lapiz="precio-vuelo"]')
    await a.esp(700)
    d = await dialogo()
    debe(d && /¿Cuánto ha costado en total\?/.test(d) && /Si compraste la ida y la vuelta por separado, pon la suma\./.test(d), 'precio', `la hoja del precio con la nota en gris (${d})`)
    await cap('04_hoja_precio')
    await ev("(() => { const i = document.querySelector('[role=dialog] input[inputmode=decimal]'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '215'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
    await ev("Array.from(document.querySelectorAll('[role=dialog] button')).find((b) => /^Guardar$/.test(b.textContent.trim()))?.click(); true")
    await a.esp(800)
    await cerrarHojas()
    precio = await precioFila()
    debe(precio && /^Precio total · .*215/.test(precio.texto ?? ''), 'precio', `guardado el precio: «${precio?.texto}»`)
    const guardado = await ev("(() => { const r = window.__ruta.getState().route; return [r.arrivalPrecio?.amount ?? null, r.departurePrecio?.amount ?? null] })()")
    debe(guardado[0] === 215 && guardado[1] == null, 'precio', `el precio va a «Vuelo a Roma» (una sola vez: ${JSON.stringify(guardado)})`)

    // La hoja del vuelo lleva la misma nota bajo «¿Cuánto ha costado en total?».
    await click('[data-blk="llegada"] [data-mitad="arrival"] [data-cambiar-mitad]')
    await a.esp(900)
    d = await dialogo()
    debe(d && /¿Cuánto ha costado en total\?/.test(d) && /Si compraste la ida y la vuelta por separado, pon la suma\./.test(d), 'precio', 'la hoja del vuelo también lleva «Si compraste la ida y la vuelta por separado, pon la suma.»')
    await cerrarHojas()

    /* ── 4. Con las dos tarjetas (B1c/B2): datos, código, sin duración sin tarjeta ── */
    await sembrarBillete('arrival')
    await sembrarBillete('departure')
    await a.esp(700)
    ida = await mitad('arrival')
    vuelta = await mitad('departure')
    debe(ida.chip && ida.ampliar && vuelta.chip, 'b2', 'con la tarjeta: el código con «Toca para ampliar»')
    debe(ida.candado == null && ida.boton == null, 'b2', 'con la tarjeta ya no está el botón de añadir (ni su candado, también sin pase: lo guardado se ve)')
    debe(ida.filas.some((f) => f[0] === 'numero' && f[1] === 'Vuelo VY 6102') && ida.filas.some((f) => f[0] === 'terminal') && ida.filas.some((f) => f[0] === 'asiento' && /14C/.test(f[1])) && ida.filas.some((f) => f[0] === 'localizador' && /ABC123/.test(f[1])), 'b2', `los datos en su fila (${JSON.stringify(ida.filas)})`)
    debe(ida.lapizDatos && ida.lapizDatos.w === 44 && ida.lapizDatos.h === 44, 'lapices', `el lápiz del bloque de datos, 44 x 44 (${JSON.stringify(ida.lapizDatos)})`)
    debe(ida.papelera && ida.papelera.w === 44 && ida.papelera.derecha <= 24, 'papelera', 'con tarjeta, la papelera sigue abajo a la derecha')
    debe(ida.filaNumeroLineas === 1, 'una-linea', `«Vuelo VY 6102» en UNA línea a 390 px (${ida.filaNumeroLineas})`)
    await cap('05_b2_con_tarjeta')

    // «Vuelo VY 6102» en una línea a 375 px.
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true })
    await a.esp(900)
    ida = await mitad('arrival')
    debe(ida.filaNumeroLineas === 1 && ida.filas.some((f) => f[1] === 'Vuelo VY 6102'), 'una-linea', `«Vuelo VY 6102» en una línea a 375 px (${ida.filaNumeroLineas} línea/s)`)
    const titulo375 = await ev(`(() => { const t = Array.from(document.querySelectorAll('[data-blk] span')).find((s) => s.textContent.trim() === 'Entradas y Free Tour'); if (!t) return null; const lh = parseFloat(getComputedStyle(t).lineHeight) || 27; return Math.round(t.getBoundingClientRect().height / lh) })()`)
    debe(titulo375 == null || titulo375 === 1, 'una-linea', `el título «Entradas y Free Tour» en una línea a 375 px (${titulo375})`)
    await cap('06_375')
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await a.esp(600)

    /* ── 5. «Datos del vuelo» (B2b): las horas son el mismo dato que las de la hoja del vuelo ── */
    await click('[data-blk="llegada"] [data-mitad="arrival"] [data-lapiz="datos-billete"]')
    await a.esp(800)
    d = await dialogo()
    debe(d && /^Datos del vuelo/.test(d) && /Vuelo/.test(d) && /Horario/.test(d) && /Sale a las/i.test(d) && /Llega a las/i.test(d) && /Terminal/.test(d) && /Asiento/.test(d) && /Localizador/.test(d) && /Guardar los datos/.test(d), 'b2b', `«Datos del vuelo» con vuelo, horario, terminal, asiento y localizador (${d})`)
    debe(!/Aerolínea|Ref\. vuelo/.test(d ?? ''), 'b2b', 'sin Aerolínea ni Ref. vuelo (como Design)')
    const horasDatos = await ev("Array.from(document.querySelectorAll('[role=dialog] [data-campo-de-hora-texto]')).map((e) => e.textContent)")
    debe(horasDatos[0] === '08:30' && horasDatos[1] === '11:25', 'b2b', `las horas puestas: 08:30 y 11:25 (${horasDatos})`)
    await cap('07_b2b_datos')
    // Cambiar la hora de llegada a las 11:55 desde aquí (la rueda: flechas).
    await ev("document.querySelector('[role=dialog] [data-campo-de-hora=\"datos-llega\"]')?.click(); true")
    await a.esp(600)
    await ev("document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna]')[1]?.focus(); true")
    for (let i = 0; i < 6; i++) {
      await a.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 })
      await a.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 })
      await a.esp(150)
    }
    await a.esp(400)
    await ev("(() => { const h = document.querySelector('[data-hoja-de-hora]'); const b = Array.from(h?.querySelectorAll('button') ?? []).find((x) => /Listo|Guardar|Aceptar|✓/.test(x.textContent || '') || x.getAttribute('aria-label') === 'Hecho'); b?.click(); return Boolean(b) })()")
    await a.esp(500)
    // Si la rueda no se cerró con un botón, se cierra tocando fuera (guarda).
    if (await ev("Boolean(document.querySelector('[data-hoja-de-hora]'))")) {
      await a.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
      await a.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
      await a.esp(500)
    }
    const nueva = await ev("document.querySelector('[role=dialog] [data-campo-de-hora=\"datos-llega\"] [data-campo-de-hora-texto]')?.textContent ?? null")
    await ev("document.querySelector('[data-datos-billete-guardar]')?.click(); true")
    await a.esp(900)
    await cerrarHojas()
    const horaRuta = await ev("window.__ruta.getState().route.arrivalFlightTime")
    debe(nueva && nueva !== '11:25' && horaRuta === nueva, 'b2b', `cambiar la hora en «Datos del vuelo» la cambia en el viaje (${nueva} → ${horaRuta})`)
    await click('[data-blk="llegada"] [data-mitad="arrival"] [data-cambiar-mitad]')
    await a.esp(900)
    const enHoja = await ev("document.querySelector('[role=dialog] [data-campo-de-hora=\"roma\"] [data-campo-de-hora-texto]')?.textContent ?? null")
    debe(enHoja === horaRuta, 'b2b', `y la hoja del vuelo enseña la misma hora (${enHoja})`)
    await cerrarHojas()
    ida = await mitad('arrival')
    debe(ida.chip, 'b2b', 'y la tarjeta (el código) sigue visible tras cambiar la hora (el billete sigue a la hora nueva)')
    // Vuelve a 11:25 para el resto.
    await ruta("st.guardarVueloDelAdmin({ arrival: { time: '11:25', pointId: 'fco' } })")
    await ev("(() => { const s = window.__billete.getState(); const b = s.datos.arrival; if (b) s.poner(null, 'arrival', { ...b, horaRoma: '11:25' }); return true })()")
    await a.esp(500)

    /* ── 6. La Ida plegada (B2c): el día de la ida ya pasó ── */
    const fechas = await ev("(() => { const r = window.__ruta.getState().route; return r.answers.dateRange })()")
    await ruta("const r = st.route; window.__ruta.setState({ route: { ...r, answers: { ...r.answers, dateRange: { start: '2020-03-05', end: '2020-03-09' } } } })")
    await a.esp(900)
    ida = await mitad('arrival')
    vuelta = await mitad('departure')
    debe(ida && ida.plegada, 'b2c', 'la Ida de un día que ya pasó se queda en una línea')
    debe(ida && /^Jueves 5 · 11:25 · Fiumicino$/.test(ida.texto.replace(/^IDA\s*/, '')), 'b2c', `con la llegada, siempre: «Jueves 5 · 11:25 · Fiumicino» (${ida?.texto})`)
    debe(ida && vuelta && ida.alto < 70 && vuelta.alto > ida.alto, 'b2c', `la línea es baja y la Vuelta sigue entera (${ida?.alto} · ${vuelta?.alto})`)
    debe(ida && ida.lapizArriba && ida.lapizArriba.w === 44, 'b2c', 'la línea plegada lleva su lápiz de 44 x 44')
    await cap('08_b2c_ida_plegada')
    await click('[data-blk="llegada"] [data-mitad="arrival"] [data-mitad-plegable]')
    await a.esp(500)
    ida = await mitad('arrival')
    debe(ida && !ida.plegada && ida.chip, 'b2c', 'al tocarla se abre entera')
    await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, answers: { ...r.answers, dateRange: ${JSON.stringify(fechas)} } } })`)
    await a.esp(500)

    /* ── 7. Leer una tarjeta que no cuadra: la hora y la fecha (solo con pase se puede añadir; sin pase el botón es el aviso) ── */
    if (!sin) {
      await ruta("window.__billete.getState().quitar(null, 'arrival')")
      await ruta("st.guardarVueloDelAdmin({ arrival: { time: '11:25', pointId: 'fco' } })")
      await a.esp(500)
      const subir = async (fichero) => {
        await click('[data-blk="llegada"] [data-mitad="arrival"] [data-anadir-doc]')
        await a.esp(300)
        const doc = await a.cdp('DOM.getDocument', { depth: 1 })
        const nodo = await a.cdp('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '[data-billete-archivo]' })
        await a.cdp('DOM.setFileInputFiles', { nodeId: nodo.result.nodeId, files: [fichero] })
        await a.esp(400)
      }
      // Hora distinta (la tarjeta dice 10:25, el vuelo 11:25).
      await ev(`window.__lectura = ${JSON.stringify(lectura({ hora_llegada: '10:25' }))}; true`)
      await subir(PNG)
      await a.hasta("Boolean(document.querySelector('[data-aviso-tarjeta]'))", { segundos: 60 }).catch(() => undefined)
      let av = await ev("(() => { const e = document.querySelector('[data-aviso-tarjeta]'); return e ? { tipo: e.getAttribute('data-aviso-tarjeta'), texto: e.querySelector('[data-aviso-tarjeta-texto]').textContent, si: Boolean(e.querySelector('[data-aviso-tarjeta-si]')), no: Boolean(e.querySelector('[data-aviso-tarjeta-no]')) } : null })()")
      debe(av && av.tipo === 'hora' && av.texto === 'Tu tarjeta dice que llegas a las 10:25. ¿Actualizamos la hora de tu vuelo?' && av.si && av.no, 'pregunta-hora', `la pregunta de la hora: (${JSON.stringify(av)})`)
      const sinCambio = await ev("window.__ruta.getState().route.arrivalFlightTime")
      debe(sinCambio === '11:25', 'pregunta-hora', `no cambia nada solo (${sinCambio})`)
      ida = await mitad('arrival')
      debe(ida.chip === true || ida.filas.some((f) => f[0] === 'localizador'), 'pregunta-hora', 'la tarjeta se guarda igual (el documento es suyo)')
      await cap('09_pregunta_hora')
      await ev("document.querySelector('[data-aviso-tarjeta-si]')?.click(); true")
      await a.esp(900)
      const horaNueva = await ev("window.__ruta.getState().route.arrivalFlightTime")
      debe(horaNueva === '10:25', 'pregunta-hora', `[Sí, actualizar] guarda la hora (${horaNueva})`)
      ida = await mitad('arrival')
      debe(ida.chip, 'pregunta-hora', 'y la tarjeta sigue a la vista con la hora nueva')
      // «No»: la hora se queda.
      await ruta("window.__billete.getState().quitar(null, 'arrival'); st.guardarVueloDelAdmin({ arrival: { time: '11:25', pointId: 'fco' } })")
      await a.esp(500)
      await subir(PNG)
      await a.hasta("Boolean(document.querySelector('[data-aviso-tarjeta-no]'))", { segundos: 60 }).catch(() => undefined)
      await ev("document.querySelector('[data-aviso-tarjeta-no]')?.click(); true")
      await a.esp(600)
      const sigue = await ev("window.__ruta.getState().route.arrivalFlightTime")
      debe(sigue === '11:25' && !(await ev("Boolean(document.querySelector('[data-aviso-tarjeta]'))")), 'pregunta-hora', `[No] deja la hora como estaba (${sigue})`)
      // Fecha distinta.
      await ruta("window.__billete.getState().quitar(null, 'arrival')")
      await ev(`window.__lectura = ${JSON.stringify(lectura({ fecha: '2027-01-08', hora_llegada: '11:25' }))}; true`)
      await a.esp(400)
      await subir(PNG)
      await a.hasta("Boolean(document.querySelector('[data-aviso-tarjeta=\"fecha\"]'))", { segundos: 60 }).catch(() => undefined)
      av = await ev("document.querySelector('[data-aviso-tarjeta] [data-aviso-tarjeta-texto]')?.textContent ?? null")
      debe(/^Tu tarjeta es del viernes 8 y tu vuelo está el [a-záéíóú]+ \d+\. Revisa las fechas\.$/.test(av ?? ''), 'pregunta-fecha', `el aviso de la fecha (${av})`)
      debe((await ev("window.__ruta.getState().route.arrivalFlightTime")) === '11:25', 'pregunta-fecha', 'sin cambiar nada solo')
      await cap('10_aviso_fecha')
      await ev("document.querySelector('[data-aviso-tarjeta-vale]')?.click(); true")
      await a.esp(400)
    }

    /* ── 8. Tren (B3): «Tren 03180», «Coche 003», estación, «tu billete» ── */
    await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'train' } }, arrivalPointId: 'termini', arrivalOtroPunto: 'Sants', arrivalOtraHora: '08:00', arrivalFlightTime: '11:02', arrivalCodigo: '03180', departureFlightTime: null, departureOtroPunto: null, departureOtraHora: null, departureCodigo: null } })`)
    await ev("window.__billete.getState().quitar(null, 'arrival')")
    await a.esp(700)
    ida = await mitad('arrival')
    debe(ida && ida.boton === 'Añadir tu billete', 'b3', `tren: [Añadir tu billete] (${ida?.boton})`)
    debe(ida && /Barcelona \(Sants\) → Roma \(Termini\)/.test(ida.trayecto ?? ''), 'b3', `el trayecto con la estación (${ida?.trayecto})`)
    if (sin) {
      await click('[data-blk="llegada"] [data-mitad="arrival"] [data-anadir-doc]')
      await a.esp(700)
      d = await dialogo()
      debe(d && /Con el Pase [A-Za-zÀ-ÿ ]+, guardas tu billete y lo tienes a mano en la estación, aunque no haya internet\./.test(d), 'aviso', `tren: «tu billete», «en la estación» (${d})`)
      await cap('11_aviso_tren')
      await cerrarHojas()
    }
    await ev(`(() => { const b = window.__billete.getState(); b.poner(null, 'arrival', { horaRoma: '11:02', localizador: 'XYZ789', terminal: null, asiento: '01D', coche: '003', codigo: { texto: 'x', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(DIBUJO)} }, codigoFuera: null, dueno: null }); return true })()`)
    await a.esp(700)
    ida = await mitad('arrival')
    debe(ida.filas.some((f) => f[1] === 'Tren 03180') && ida.filas.some((f) => f[1] === 'Coche 003') && ida.filas.some((f) => /Asiento 01D/.test(f[1])), 'b3', `«Tren 03180», «Coche 003», «Asiento 01D» (${JSON.stringify(ida.filas)})`)
    await cap('12_b3_tren')
  } finally {
    await a.cerrar()
  }
}

await pasada('gratis')
await pasada('completa')

// La lista de la comprobación de la tanda (la escribe el agente principal): si ya existe, tiene que traer el apartado del vuelo.
const repaso = path.resolve('docs/dias/REPASO_10S8.html')
if (fs.existsSync(repaso)) {
  const t = fs.readFileSync(repaso, 'utf8')
  debe(/Llegada y vuelta/.test(t) && /Datos del vuelo/.test(t), 'repaso', 'REPASO_10S8.html trae el apartado de Llegada y vuelta')
} else console.log('(REPASO_10S8.html aún no existe: lo escribe el agente principal)')

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`❌ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
