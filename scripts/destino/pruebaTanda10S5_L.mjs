// Tanda 10S5 (agente L) · apartados 4 y 5: el billete en RESERVAS (B1-B4), privado por persona, sin internet, HOY con pase solo el día del viaje, y el trayecto con paréntesis + «Sales de» relleno.
// Capturas docs/dias/capturas_jutrip/10s5_billete_<version>_<n>.jpg (390 x 844).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S5_L.mjs
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
const foto = (version, n) => path.join(SALIDA, `10s5_billete_${version}_${n}.jpg`)
const PDF = path.resolve('scripts/destino/_ejemplos_billete/tarjeta_avion_ejemplo.pdf')
const PNG = path.resolve('scripts/destino/_ejemplos_billete/captura_tren_ejemplo.png')

// (El servidor que lee con Claude se sustituye por la respuesta guardada del avión y del tren: la prueba no gasta llamadas a Claude. Las mismas lecturas que la prueba de M.)
const LECTURAS = {
  avion: { modo: 'avion', numero: 'VY 6102', compania: 'Vueling', localizador: 'ABC123', fecha: '2026-12-05', fecha_llegada: null, hora_salida: '08:30', hora_llegada: '10:25', origen: { ciudad: 'Barcelona', codigo: 'BCN', nombre: 'Barcelona-El Prat', terminal: '1', puerta: 'B34' }, destino: { ciudad: 'Roma', codigo: 'FCO', nombre: 'Roma-Fiumicino', terminal: '1', puerta: null }, asiento: '14C', coche: null, codigo_caja: null },
  tren: { modo: 'tren', numero: '03180', compania: 'Renfe', localizador: 'XYZ789', fecha: '2026-12-12', fecha_llegada: null, hora_salida: '08:10', hora_llegada: '11:12', origen: { ciudad: 'Barcelona', codigo: null, nombre: 'Barcelona-Sants', terminal: null, puerta: null }, destino: { ciudad: 'Madrid', codigo: null, nombre: 'Madrid-Puerta de Atocha', terminal: null, puerta: null }, asiento: '01D', coche: '003', codigo_caja: { pagina: 1, x0: 0.24, y0: 0.62, x1: 0.76, y1: 0.89 } },
}

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
    await ev(`(() => { window.__lecturas = ${JSON.stringify(LECTURAS)}; window.__cual = 'avion'; const f0 = window.fetch.bind(window); window.fetch = async (u, o) => { if (String(u).includes('/api/read-ticket')) return new Response(JSON.stringify(window.__lecturas[window.__cual]), { status: 200, headers: { 'Content-Type': 'application/json' } }); return f0(u, o) }; return true })()`)

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
    const mitad = (k) =>
      ev(`(() => {
        const m = document.querySelector('[data-blk="llegada"] [data-mitad="${k}"]')
        if (!m) return null
        const b = m.getBoundingClientRect()
        const q = (s) => m.querySelector(s)
        const y = (s) => { const e = q(s); return e ? Math.round(e.getBoundingClientRect().top) : null }
        const eli = q('[data-eliminar]')
        const rc = eli ? eli.getBoundingClientRect() : null
        const img = q('[data-billete-codigo-pequeno] img')
        return {
          texto: m.innerText.replace(/\\s+/g, ' '),
          fecha: q('[data-mitad-fecha]')?.textContent ?? null,
          trayecto: q('[data-billete-trayecto]')?.textContent ?? null,
          horaSola: q('[data-billete-hora-sola]')?.textContent ?? null,
          horaIzq: q('[data-billete-hora-izq]')?.textContent ?? null,
          horaDer: q('[data-billete-hora-der]')?.textContent ?? null,
          boton: q('[data-billete-anadir]')?.textContent.trim() ?? null,
          ayuda: q('[data-billete-ayuda]')?.textContent.trim() ?? null,
          filas: Array.from(m.querySelectorAll('[data-billete-fila]')).map((f) => [f.getAttribute('data-billete-fila'), f.textContent.trim()]),
          chip: Boolean(q('[data-billete-codigo-pequeno]')),
          chipImg: img ? { w: Math.round(img.getBoundingClientRect().width), src: (img.getAttribute('src') || '').slice(0, 20) } : null,
          ampliar: /Toca para ampliar/.test(m.innerText),
          yBoton: y('[data-billete-anadir]'), yEliminar: y('[data-eliminar]'), yChip: y('[data-billete-codigo-pequeno]'),
          eliminar: rc ? { texto: eli.textContent.trim(), derecha: Math.round(b.right - rc.right), izq: Math.round(rc.left - b.left) } : null,
          ancho: Math.round(b.width),
        }
      })()`)
    const cabecera = () => ev(`(() => { const c = document.querySelector('[data-blk="llegada"] [data-llegada-cabecera]'); return Array.from(c?.querySelector('span.flex-col')?.children ?? []).map((x) => (x.textContent || '').trim()) })()`)
    const hoja = () =>
      ev(`(() => {
        const d = document.querySelector('[role=dialog]')
        if (!d) return null
        const v = (s) => d.querySelector(s)?.value ?? d.querySelector(s)?.textContent ?? null
        return {
          titulo: d.querySelector('h2')?.textContent ?? null,
          aviso: d.querySelector('[data-billete-leido]')?.textContent ?? null,
          leido: d.querySelector('[data-billete-leido]')?.getAttribute('data-billete-leido') ?? null,
          otroPunto: d.querySelector('[data-mi-vuelo-otro-punto]')?.value ?? null,
          otroTitulo: d.querySelector('[data-mi-vuelo-otro-lado] span')?.textContent ?? null,
          otraHora: d.querySelector('[data-mi-vuelo-otra-hora-valor]')?.textContent ?? null,
          hora: d.querySelector('[data-mi-vuelo-hora]')?.textContent ?? null,
          codigo: d.querySelector('[data-mi-vuelo-codigo]')?.value ?? null,
          compania: d.querySelector('[data-mi-vuelo-compania]')?.value ?? null,
          localizador: d.querySelector('[data-mi-vuelo-privado="localizador"]')?.value ?? null,
          terminal: d.querySelector('[data-mi-vuelo-privado="terminal"]')?.value ?? null,
          coche: d.querySelector('[data-mi-vuelo-privado="coche"]')?.value ?? null,
          asiento: d.querySelector('[data-mi-vuelo-privado="asiento"]')?.value ?? null,
          nota: d.querySelector('[data-mi-vuelo-privados-nota]')?.textContent ?? null,
          punto: d.querySelector('[data-mi-vuelo-punto-opcion][aria-pressed="true"]')?.getAttribute('data-mi-vuelo-punto-opcion') ?? null,
          tituloPuntoRoma: d.querySelector('[data-mi-vuelo-punto-lista] span')?.textContent ?? null,
        }
      })()`)
    const cerrarHojas = async () => {
      for (let i = 0; i < 6 && (await ev("Boolean(document.querySelector('[role=dialog]'))")); i++) {
        await ev("(() => { const d = document.querySelector('[role=dialog]'); const b = d.querySelector('button[aria-label=Cerrar]') ?? Array.from(d.querySelectorAll('button')).find((x) => /Entendido|Vale|Cerrar|Listo/.test(x.textContent || '')); b?.click(); return true })()")
        await a.esp(500)
      }
    }
    const clicHoja = async (kind) => {
      await ev(`document.querySelector('[data-blk="llegada"] [data-mitad="${kind}"] [data-cambiar-mitad]')?.click(); true`)
      await a.esp(700)
    }
    const subirArchivo = async (kind, fichero, cual = 'avion') => {
      await ev(`window.__cual = ${JSON.stringify(cual)}; true`)
      await ev(`document.querySelector('[data-blk="llegada"] [data-mitad="${kind}"] [data-billete-anadir]')?.click(); true`)
      await a.esp(300)
      const doc = await a.cdp('DOM.getDocument', { depth: 1 })
      const nodo = await a.cdp('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '[data-billete-archivo]' })
      await a.cdp('DOM.setFileInputFiles', { nodeId: nodo.result.nodeId, files: [fichero] })
      return a.hasta("Boolean(document.querySelector('[role=dialog] [data-billete-leido]'))", { segundos: 90 })
    }
    const guardarHoja = async () => {
      await ev("document.querySelector('[role=dialog] [data-mi-vuelo-guardar]')?.click(); true")
      await a.esp(1200)
      await cerrarHojas()
    }

    /* ── 1. El trayecto con paréntesis y la B1 (avión, sin billete) ── */
    const fecha0 = await ev("window.__ruta.getState().route.answers.dateRange?.start ?? null")
    await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, answers: { ...r.answers, origin: 'Barcelona', originPlace: undefined }, arrivalFlightTime: '11:25', departureFlightTime: '18:05', arrivalPointId: 'fco', departurePointId: 'cia', arrivalOtroPunto: null, departureOtroPunto: null, arrivalOtraHora: null, departureOtraHora: null, arrivalCodigo: null, departureCodigo: null } })`)
    await vaAReservas()
    await abrirLlegada()
    let ida = await mitad('arrival')
    let vuelta = await mitad('departure')
    debe(ida && vuelta, 'base', `la ida y la vuelta existen (${et})`)
    debe(ida.trayecto === 'Barcelona → Roma (Fiumicino)', 'trayecto', `Ida: «Barcelona → Roma (Fiumicino)» (${ida.trayecto})`)
    debe(vuelta.trayecto === 'Roma (Ciampino) → Barcelona', 'trayecto', `Vuelta: «Roma (Ciampino) → Barcelona» (${vuelta.trayecto})`)
    debe(!/Fiumicino · Roma/.test(ida.texto), 'trayecto', 'fuera «Fiumicino · Roma»')
    debe(ida.horaSola === '11:25' && /Llegas a las/.test(ida.texto) && ida.horaIzq === null, 'b1', `B1 (sin hora de salida): «Llegas a las» 11:25 como la B1, no las dos horas (${ida.horaSola})`)
    debe(vuelta.horaSola === '18:05' && /Sales a las/.test(vuelta.texto), 'b1', `Vuelta sin hora de fuera: «Sales a las» 18:05 (${vuelta.horaSola})`)
    debe(ida.boton === 'Añadir tarjeta de embarque', 'b1', `Avión: [Añadir tarjeta de embarque] (${ida.boton})`)
    debe(ida.ayuda === 'Desde el PDF, una foto o una captura.', 'b1', `y debajo, en gris: «Desde el PDF, una foto o una captura.» (${ida.ayuda})`)
    debe(ida.yBoton != null && ida.yEliminar != null && ida.yBoton < ida.yEliminar, 'b1-orden', `primero el botón y «Eliminar vuelo» al final (${ida.yBoton} < ${ida.yEliminar})`)
    debe(ida.eliminar && /^Eliminar vuelo$/.test(ida.eliminar.texto) && ida.eliminar.derecha < 40 && ida.eliminar.izq > ida.ancho / 2, 'b1-orden', `«Eliminar vuelo» abajo a la derecha (${JSON.stringify(ida.eliminar)})`)
    debe(/^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo) \d{1,2}/.test(ida.fecha ?? '') && /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo) \d{1,2}/.test(vuelta.fecha ?? ''), 'fechas', `las fechas, enteras: «${ida.fecha}» y «${vuelta.fecha}»`)
    const cab = await cabecera()
    debe(cab.length === 2 && /^Llegada y vuelta$/.test(cab[0]) && !/→/.test(cab.join(' ')), 'cabecera', `la cabecera sin la línea de debajo del título (${JSON.stringify(cab)})`)
    const precio = await ev("document.querySelector('[data-precio-vuelo-texto]')?.textContent ?? null")
    debe(/^Precio · /.test(precio ?? ''), 'precio', `el precio dentro: «${precio}»`)
    await a.captura(foto(version, '01_b1'))

    /* El aeropuerto de fuera entre paréntesis si lo puso; en blanco, sin él */
    await ruta("st.setLegOtroPunto('arrival', 'El Prat'); st.setLegOtroPunto('departure', 'Barcelona-El Prat (BCN)')")
    await a.esp(500)
    ida = await mitad('arrival')
    vuelta = await mitad('departure')
    debe(ida.trayecto === 'Barcelona (El Prat) → Roma (Fiumicino)', 'trayecto', `con su aeropuerto: «Barcelona (El Prat) → Roma (Fiumicino)» (${ida.trayecto})`)
    debe(vuelta.trayecto === 'Roma (Ciampino) → Barcelona (El Prat)' || vuelta.trayecto === 'Roma (Ciampino) → Barcelona (BCN)' || /^Roma \(Ciampino\) → Barcelona/.test(vuelta.trayecto ?? ''), 'trayecto', `y en la vuelta, el de fuera detrás: «${vuelta.trayecto}»`)
    await ruta("st.setLegOtroPunto('arrival', ''); st.setLegOtroPunto('departure', '')")

    /* ── 2. «Sales de» y «Llegas a» rellenos de partida ── */
    await clicHoja('arrival')
    let h = await hoja()
    debe(h && h.otroPunto === 'Barcelona (El Prat)' && h.otroTitulo === 'Sales de', 'sales-de', `«Sales de» relleno con «Barcelona (El Prat)» desde Barcelona (${h?.otroTitulo} · ${h?.otroPunto})`)
    await ev("Array.from(document.querySelectorAll('[role=dialog] [data-mi-vuelo-lado]')).find((b) => b.getAttribute('data-mi-vuelo-lado') === 'vuelta')?.click(); true")
    await a.esp(400)
    h = await hoja()
    debe(h && h.otroPunto === 'Barcelona (El Prat)' && h.otroTitulo === 'Llegas a', 'sales-de', `«Llegas a» (vuelta) también relleno (${h?.otroTitulo} · ${h?.otroPunto})`)
    await a.captura(foto(version, '02_sales_de'))
    await cerrarHojas()
    await ruta("window.__ruta.setState({ route: { ...st.route, origin: 'Londres', answers: { ...st.route.answers, origin: 'Londres' } } })")
    await clicHoja('arrival')
    h = await hoja()
    debe(h && h.otroPunto === 'Londres', 'sales-de', `desde Londres (varios aeropuertos), solo «Londres» (${h?.otroPunto})`)
    await cerrarHojas()
    await ruta("window.__ruta.setState({ route: { ...st.route, origin: 'Barcelona', answers: { ...st.route.answers, origin: 'Barcelona' } } })")
    // Guardar sin tocar nada: el trayecto lleva el aeropuerto que se vio en el campo.
    await clicHoja('arrival')
    await guardarHoja()
    await a.esp(400)
    ida = await mitad('arrival')
    debe(ida?.trayecto === 'Barcelona (El Prat) → Roma (Fiumicino)', 'sales-de', `al guardar con lo de partida, el trayecto lo lleva (${ida?.trayecto})`)
    // Vuelve a «sin aeropuerto» para la B1 del PDF.
    await ruta("st.setLegOtroPunto('arrival', '')")

    /* ── 3. Añadir la tarjeta de embarque (PDF de ejemplo, avión) ── */
    const leyo = await subirArchivo('arrival', PDF)
    debe(leyo, 'pdf', 'se lee el PDF y se abre la hoja del vuelo con los datos')
    await a.esp(1200)
    h = await hoja()
    debe(h && h.leido === 'si' && /Hemos leído tu billete/.test(h.aviso ?? ''), 'pdf', `la hoja avisa «Hemos leído tu billete» (${h?.aviso})`)
    debe(h && h.codigo === 'VY 6102', 'pdf', `nº de vuelo rellenado: VY 6102 (${h?.codigo})`)
    debe(h && /Vueling/i.test(h.compania ?? ''), 'pdf', `compañía: Vueling (${h?.compania})`)
    debe(h && h.localizador === 'ABC123', 'pdf', `localizador ABC123 (${h?.localizador})`)
    debe(h && /^(T)?1$/.test((h.terminal ?? '').replace(/^Terminal\s*/i, '')), 'pdf', `terminal 1 (${h?.terminal})`)
    debe(h && h.asiento === '14C', 'pdf', `asiento 14C (${h?.asiento})`)
    debe(h && h.hora === '10:25' && h.otraHora === '08:30', 'pdf', `las dos horas: salida 08:30 y llegada 10:25 (${h?.otraHora} → ${h?.hora})`)
    debe(h && /El Prat/.test(h.otroPunto ?? ''), 'pdf', `aeropuerto de fuera: El Prat (${h?.otroPunto})`)
    debe(h && h.punto === 'Fiumicino', 'pdf', `aeropuerto de Roma: Fiumicino (${h?.punto})`)
    debe(/Solo lo ves tú/.test(h?.nota ?? ''), 'privado', `la hoja dice que lo privado solo lo ve él (${h?.nota})`)
    await a.captura(foto(version, '03_hoja_leida'))
    await guardarHoja()
    await a.esp(800)
    ida = await mitad('arrival')
    debe(ida.horaIzq === '08:30' && ida.horaDer === '10:25', 'b2', `B2: las dos horas grandes (${ida.horaIzq} / ${ida.horaDer})`)
    debe(ida.trayecto === 'Barcelona (El Prat) → Roma (Fiumicino)', 'b2', `B2: trayecto «Barcelona (El Prat) → Roma (Fiumicino)» (${ida.trayecto})`)
    const fila = (m, k) => m.filas.find((f) => f[0] === k)?.[1] ?? null
    debe(fila(ida, 'numero') === 'Vuelo VY 6102', 'b2', `fila «Vuelo VY 6102» (${fila(ida, 'numero')})`)
    debe(fila(ida, 'duracion') === '1 h 55 min', 'b2', `fila «1 h 55 min», calculada con las dos horas (${fila(ida, 'duracion')})`)
    debe(/^Terminal 1$/.test(fila(ida, 'terminal') ?? ''), 'b2', `fila «Terminal 1» (${fila(ida, 'terminal')})`)
    debe(fila(ida, 'asiento') === 'Asiento 14C', 'b2', `fila «Asiento 14C» (${fila(ida, 'asiento')})`)
    debe(fila(ida, 'localizador') === 'Localizador ABC123', 'b2', `«Localizador ABC123» (${fila(ida, 'localizador')})`)
    debe(ida.chip && ida.chipImg && ida.chipImg.w <= 80 && /^data:/.test(ida.chipImg.src), 'b2', `el código en pequeño (${JSON.stringify(ida.chipImg)})`)
    debe(ida.ampliar, 'b2', '«Toca para ampliar»')
    debe(ida.boton === null && ida.yEliminar != null && ida.yChip < ida.yEliminar, 'b2', `ya sin [Añadir tarjeta de embarque]; «Eliminar» al final (${ida.boton})`)
    debe(!/Coche/.test(ida.texto), 'solo-los-que-haya', 'en avión no sale «Coche»')
    await a.captura(foto(version, '04_b2'))

    /* Los datos privados no van a la ruta compartida */
    const ruta2 = await ev("JSON.stringify(window.__ruta.getState().route)")
    debe(!/ABC123|14C/.test(ruta2), 'privado', 'el localizador y el asiento NO están en la ruta (que se comparte con el grupo)')
    const guardado = await ev("Object.keys(localStorage).filter((k) => k.startsWith('trazo:billete:v1')).length")
    debe(guardado >= 1, 'movil', `el billete se guarda en el móvil (${guardado} clave)`)

    /* ── 4. B4: el código a pantalla completa ── */
    await ev("document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"] [data-billete-codigo-pequeno]')?.click(); true")
    await a.esp(600)
    const grande = await ev(`(() => {
      const d = document.querySelector('[data-billete-pantalla-completa]')
      if (!d) return null
      const img = d.querySelector('img')
      const r = img?.getBoundingClientRect()
      return { fondo: getComputedStyle(d).backgroundColor, w: r ? Math.round(r.width) : 0, titulo: d.querySelector('[data-billete-grande-titulo]')?.textContent, cuando: d.querySelector('[data-billete-grande-cuando]')?.textContent, pie: d.querySelector('[data-billete-grande-pie]')?.textContent, cerrar: Boolean(d.querySelector('[data-billete-cerrar]')), cubre: d.getBoundingClientRect().width >= window.innerWidth - 1 && d.getBoundingClientRect().height >= window.innerHeight - 1 }
    })()`)
    debe(grande && grande.fondo === 'rgb(255, 255, 255)' && grande.cubre, 'b4', `B4: pantalla completa y fondo blanco (${JSON.stringify(grande)})`)
    debe(grande && grande.w >= 250, 'b4', `el código grande (${grande?.w} px)`)
    debe(grande && grande.titulo === 'Barcelona → Roma', 'b4', `trayecto arriba (${grande?.titulo})`)
    debe(grande && /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo) \d{1,2} · 08:30$/.test(grande.cuando ?? ''), 'b4', `día entero y hora arriba (${grande?.cuando})`)
    debe(grande && grande.pie === 'Asiento 14C · Vuelo VY 6102', 'b4', `abajo «Asiento 14C · Vuelo VY 6102» (${grande?.pie})`)
    debe(grande && grande.cerrar, 'b4', 'la ✕')
    await a.captura(foto(version, '05_b4'))

    /* Sin conexión: se sigue viendo (está guardado en el móvil, no se pide nada) */
    await a.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
    await ev("document.querySelector('[data-billete-cerrar]')?.click(); true")
    await a.esp(300)
    await ev("window.__ruta.getState().setMode('days'); true")
    await a.esp(600)
    await vaAReservas()
    await abrirLlegada()
    ida = await mitad('arrival')
    debe(ida && ida.chip && ida.ampliar && fila(ida, 'asiento') === 'Asiento 14C', 'offline', 'SIN CONEXIÓN: el billete (datos y código) sigue en su sitio')
    const antes = a.peticiones.length
    await ev("document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"] [data-billete-codigo-pequeno]')?.click(); true")
    await a.esp(500)
    const grandeSin = await ev("(() => { const i = document.querySelector('[data-billete-pantalla-completa] img'); return i ? { ok: i.complete && i.naturalWidth > 0, w: Math.round(i.getBoundingClientRect().width) } : null })()")
    debe(grandeSin && grandeSin.ok && grandeSin.w >= 250, 'offline', `SIN CONEXIÓN: el código a pantalla completa se pinta (${JSON.stringify(grandeSin)})`)
    const nuevas = a.peticiones.slice(antes).filter((u) => !/^data:|^blob:/.test(u) && !/localhost|127\.0\.0\.1/.test(u) && !/mapbox\.com/.test(u))
    debe(nuevas.length === 0, 'offline', `ni una petición a internet al verlo (${nuevas.slice(0, 3).join(' | ')})`)
    await ev("document.querySelector('[data-billete-cerrar]')?.click(); true")
    await a.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
    await a.esp(300)

    /* ── 5. Viaje compartido: cada uno ve solo el suyo ── */
    const viaje = "import('/src/store/useViajeCompartido.ts')"
    const ponerGente = (yo) => ev(`${viaje}.then((m) => { m.useViajeCompartido.getState().poner({ gente: [{ id: 'persona-a', nombre: 'Ana', foto: null, esAdmin: true, esYo: ${yo === 'a'} }, { id: 'persona-b', nombre: 'Beto', foto: null, esAdmin: false, esYo: ${yo === 'b'} }] }); return true })`)
    await ev("import('/src/store/useBilleteStore.ts').then((m) => { const s = m.useBilleteStore.getState(); const t = s.tripId; const b = s.datos.arrival; s.poner(t, 'arrival', { ...b, dueno: 'persona-a' }); return true })")
    await ponerGente('a')
    await a.esp(500)
    ida = await mitad('arrival')
    debe(ida && ida.chip && fila(ida, 'asiento') === 'Asiento 14C', 'compartido', 'la persona dueña ve su billete')
    await ponerGente('b')
    await a.esp(500)
    ida = await mitad('arrival')
    debe(ida && !ida.chip && !ida.ampliar && ida.boton === 'Añadir tarjeta de embarque' && fila(ida, 'asiento') === null && fila(ida, 'localizador') === null, 'compartido', `la otra persona NO ve ni el código, ni el asiento, ni el localizador del primero (chip ${ida?.chip}, filas ${JSON.stringify(ida?.filas)})`)
    await ponerGente('a')
    await a.esp(300)

    /* ── 6. Tren: la captura de ejemplo ── */
    await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', answers: { ...r.answers, origin: 'Barcelona' }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'train' } }, arrivalFlightTime: '11:10', arrivalPointId: 'termini', arrivalOtroPunto: null, arrivalOtraHora: null, arrivalCodigo: null } })`)
    await ev("import('/src/store/useBilleteStore.ts').then((m) => { const s = m.useBilleteStore.getState(); s.quitar(s.tripId, 'arrival'); return true })")
    await a.esp(800)
    let tren = await mitad('arrival')
    debe(tren && tren.boton === 'Añadir tu billete', 'tren', `tren: [Añadir tu billete] (${tren?.boton})`)
    const leyoT = await subirArchivo('arrival', PNG, 'tren')
    debe(leyoT, 'tren', 'se lee la captura del tren y se abre la hoja')
    await a.esp(1200)
    h = await hoja()
    debe(h && /03180/.test(h.codigo ?? ''), 'tren', `nº de tren rellenado (${h?.codigo})`)
    debe(h && h.localizador === 'XYZ789', 'tren', `localizador XYZ789 (${h?.localizador})`)
    debe(h && /003/.test(h.coche ?? '') && h.asiento === '01D', 'tren', `coche 003 y asiento 01D (${h?.coche} · ${h?.asiento})`)
    debe(h && h.coche !== null && h.terminal === null, 'tren', 'en tren la casilla es «Coche», no «Terminal»')
    await a.captura(foto(version, '06_hoja_tren'))
    await guardarHoja()
    await a.esp(800)
    tren = await mitad('arrival')
    debe(tren.horaIzq != null && tren.horaDer != null, 'b3', `B3: las dos horas (${tren.horaIzq} / ${tren.horaDer})`)
    debe(/Tren .*03180/.test(fila(tren, 'numero') ?? ''), 'b3', `«Tren 03180» (${fila(tren, 'numero')})`)
    debe(fila(tren, 'duracion') === '3 h 2 min', 'b3', `«3 h 2 min» (${fila(tren, 'duracion')})`)
    debe(/^Coche 003$/.test(fila(tren, 'coche') ?? ''), 'b3', `«Coche 003» (${fila(tren, 'coche')})`)
    debe(fila(tren, 'asiento') === 'Asiento 01D', 'b3', `«Asiento 01D» (${fila(tren, 'asiento')})`)
    debe(fila(tren, 'terminal') === null, 'b3', 'sin terminal en tren (solo los datos que haya)')
    debe(tren.chip && tren.ampliar, 'b3', 'código en pequeño con «Toca para ampliar»')
    await a.captura(foto(version, '07_b3'))

    /* ── 7. HOY: solo con pase y solo el día del viaje ── */
    await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '10:25', arrivalPointId: 'fco', arrivalOtraHora: '08:30' } })`)
    // La tarjeta de embarque de la ida (avión) vuelve a ponerse con el PDF para esta parte.
    await vaAReservas()
    await abrirLlegada()
    const leyoH = await subirArchivo('arrival', PDF)
    debe(leyoH, 'hoy', 'se vuelve a leer el PDF para la prueba de HOY')
    await a.esp(1000)
    await guardarHoja()
    await a.esp(600)
    const dia1 = fecha0
    await ev(`(() => { const s = window.__ruta.getState(); s.setDevSimulatedTodayIso(${JSON.stringify(dia1)}); s.setMode('today'); return true })()`)
    await a.esp(2500)
    const hoy1 = await ev(`(() => { const c = document.querySelector('[data-hoy-billete-codigo="llegada"]'); return c ? { texto: c.innerText.replace(/\\s+/g, ' '), img: Boolean(c.querySelector('img')) } : null })()`)
    if (sin) {
      debe(hoy1 === null, 'hoy', 'sin pase: HOY no enseña el billete (es de pago; guardarlo en RESERVAS sí es gratis)')
    } else {
      debe(hoy1 && /Tu tarjeta de embarque/.test(hoy1.texto) && /Toca para ampliar/.test(hoy1.texto) && hoy1.img, 'hoy', `con pase, en HOY el día del viaje: el código en la tarjeta del billete (${JSON.stringify(hoy1)})`)
      if (hoy1) {
        await ev("document.querySelector('[data-hoy-billete-codigo=\"llegada\"]')?.click(); true")
        await a.esp(500)
        const g2 = await ev("Boolean(document.querySelector('[data-billete-pantalla-completa] img'))")
        debe(g2, 'hoy', 'y se abre a pantalla completa desde HOY')
        await a.captura(foto(version, '08_hoy_ampliado'))
        await ev("document.querySelector('[data-billete-cerrar]')?.click(); true")
        await a.esp(300)
      }
      await a.captura(foto(version, '09_hoy'))
      // Otro día del viaje: no sale.
      const dia2 = await ev("(() => { const s = window.__ruta.getState(); const d = new Date(s.route.answers.dateRange.start + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10) })()")
      await ev(`window.__ruta.getState().setDevSimulatedTodayIso(${JSON.stringify(dia2)}); true`)
      await a.esp(1800)
      const hoy2 = await ev("Boolean(document.querySelector('[data-hoy-billete-codigo]'))")
      debe(hoy2 === false, 'hoy', 'otro día del viaje: no sale el billete en HOY')
    }
  } finally {
    await a.cerrar()
  }
}

try {
  await pasada('gratis')
  await pasada('pago')
} catch (e) {
  fallos.push({ regla: 'error', texto: String(e && e.stack ? e.stack : e) })
}
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
