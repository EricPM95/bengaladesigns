// Tanda 10S6 (agente N) · apartado 1: la hoja del vuelo más limpia (administrador; la del invitado y tren/autobús/barco por el mismo componente).
//   «Sales de» con ejemplo en gris si hay varios aeropuertos, hora de ejemplo en gris sin raya, «Aeropuerto de llegada/salida», la línea del pase con 10 px más arriba y abajo,
//   fuera las cinco casillas y las dos líneas, lo ya guardado sin perderse, y los datos que se cambian en la tarjeta del billete («Cambiar los datos»).
// Capturas docs/dias/capturas_jutrip/10s6_vuelo_<n>.jpg (390 x 844).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S6_N.mjs
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10s6_vuelo_${n}.jpg`)

const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=gratis', ancho: 390, alto: 844 })
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
  const clicHoja = async (kind) => {
    await ev(`document.querySelector('[data-blk="llegada"] [data-mitad="${kind}"] [data-cambiar-mitad]')?.click(); true`)
    await a.esp(800)
  }
  const cerrarHojas = async () => {
    for (let i = 0; i < 6 && (await ev("Boolean(document.querySelector('[role=dialog]'))")); i++) {
      await ev("(() => { const d = document.querySelector('[role=dialog]'); const b = d.querySelector('button[aria-label=Cerrar]') ?? Array.from(d.querySelectorAll('button')).find((x) => /Entendido|Vale|Cerrar|Listo/.test(x.textContent || '')); b?.click(); return true })()")
      await a.esp(500)
    }
  }
  const hoja = () =>
    ev(`(() => {
      const d = Array.from(document.querySelectorAll('[role=dialog]')).find((x) => x.querySelector('[data-mi-vuelo-guardar]'))
      if (!d) return null
      const campo = (c) => d.querySelector('[data-campo-de-hora="' + c + '"]')
      const otro = d.querySelector('[data-mi-vuelo-otro-punto]')
      const pase = d.querySelector('[data-vuelo-linea-pase]')
      const cs = pase ? getComputedStyle(pase) : null
      const tit = (s) => d.querySelector(s + ' span')?.textContent ?? null
      return {
        texto: d.innerText.replace(/\\s+/g, ' '),
        otroTitulo: tit('[data-mi-vuelo-otro-lado]'),
        otroValor: otro?.value ?? null,
        otroEjemplo: otro?.getAttribute('placeholder') ?? null,
        romaTitulo: tit('[data-mi-vuelo-punto-lista]'),
        otraVacia: campo('otra')?.getAttribute('data-vacia') ?? null,
        otraTexto: campo('otra')?.querySelector('[data-campo-de-hora-texto]')?.textContent ?? null,
        otraReloj: Boolean(campo('otra')?.querySelector('svg')),
        otraColor: campo('otra') ? getComputedStyle(campo('otra').querySelector('[data-campo-de-hora-texto]')).color : null,
        romaTexto: campo('roma')?.querySelector('[data-campo-de-hora-texto]')?.textContent ?? null,
        casillas: ['codigo', 'compania'].filter((k) => d.querySelector('[data-mi-vuelo-' + k + ']')).concat(d.querySelectorAll('[data-mi-vuelo-privado]').length ? ['privados'] : []),
        paseArriba: cs ? parseFloat(cs.paddingTop) : null,
        paseAbajo: cs ? parseFloat(cs.paddingBottom) : null,
        // Lo que viene justo después del bloque de los dos lados: el dinero.
        siguiente: (() => { const l = d.querySelector('[data-mi-vuelo-lados]'); const s = l?.nextElementSibling; return s ? (s.getAttribute('data-mi-vuelo-extra') !== null ? 'extra' : s.tagName) : null })(),
        ultimoDeLados: (() => { const l = d.querySelector('[data-mi-vuelo-lados]'); const u = l?.lastElementChild; return u ? (u.hasAttribute('data-vuelo-linea-pase') ? 'linea-pase' : u.hasAttribute('data-mi-vuelo-otra-hora') ? 'otra-hora' : u.tagName) : null })(),
        precio: Boolean(d.querySelector('[data-mi-vuelo-extra]')) && /cuánto ha costado/i.test(d.innerText),
      }
    })()`)
  const toque = async (x, y) => {
    await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
    await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
    await a.esp(500)
  }
  const flecha = async (n) => {
    await ev("document.querySelector('[data-hoja-de-hora] [data-rueda-columna]:last-of-type')?.focus(); document.querySelectorAll('[data-hoja-de-hora] [data-rueda-columna]')[1]?.focus(); true")
    for (let i = 0; i < n; i++) {
      await a.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 })
      await a.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 })
      await a.esp(120)
    }
    await a.esp(400)
  }
  const MALAS = /Ref\. vuelo|Aerolínea|Localizador|Terminal|Asiento|Solo lo ves tú|Cambia las fechas|¿Llegas o te vas otro día/

  /* ── 1. Avión desde Londres (varios aeropuertos): ejemplo en gris ── */
  await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Londres', originPlace: undefined, answers: { ...r.answers, origin: 'Londres', originPlace: undefined }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:25', departureFlightTime: '18:05', arrivalPointId: 'fco', departurePointId: 'cia', arrivalOtroPunto: null, departureOtroPunto: null, arrivalOtraHora: null, departureOtraHora: null, arrivalCodigo: 'VY 6102', departureCodigo: null, arrivalCompania: 'Vueling', departureCompania: null } })`)
  await vaAReservas()
  await abrirLlegada()
  await clicHoja('arrival')
  let h = await hoja()
  debe(h != null, 'base', 'se abre la hoja del vuelo')
  debe(h && h.otroTitulo === 'Sales de', 'sales-de', `ida: «Sales de» (${h?.otroTitulo})`)
  debe(h && h.otroValor === '' && h.otroEjemplo === 'Londres (Heathrow)', 'sales-de', `Londres (varios aeropuertos): casilla vacía con el ejemplo en gris «Londres (Heathrow)» (valor «${h?.otroValor}», ejemplo «${h?.otroEjemplo}»)`)
  debe(h && h.otraVacia === '1' && h.otraTexto === '08:30' && h.otraReloj, 'hora-ejemplo', `«Sale a las · opcional» sin hora: ejemplo «08:30» y el reloj (${h?.otraTexto})`)
  debe(h && h.otraTexto !== '—' && !/—/.test(h.texto), 'hora-ejemplo', 'sin la raya «—»')
  debe(h && /rgba?\(28, 34, 48, 0\.\d+\)/.test(h.otraColor ?? ''), 'hora-ejemplo', `el ejemplo en gris (${h?.otraColor})`)
  debe(h && h.romaTitulo === 'Aeropuerto de llegada', 'etiquetas', `ida: «Aeropuerto de llegada» y no «Llegas a» (${h?.romaTitulo})`)
  debe(h && !/Llegas a(?! las)/.test(h.texto), 'etiquetas', 'no queda ningún «Llegas a»')
  debe(h && h.casillas.length === 0, 'casillas', `fuera Ref. vuelo, Aerolínea, Localizador, Terminal y Asiento (${JSON.stringify(h?.casillas)})`)
  debe(h && !MALAS.test(h.texto), 'casillas', `ningún texto de lo quitado en la hoja (${(h?.texto.match(MALAS) ?? [])[0] ?? ''})`)
  debe(h && h.paseArriba === 10 && h.paseAbajo === 10, 'pase', `la línea del pase con 10 px más arriba y 10 más abajo (${h?.paseArriba} / ${h?.paseAbajo})`)
  debe(h && h.ultimoDeLados === 'linea-pase' && h.siguiente === 'extra', 'pase', `tras la línea del pase, directamente el dinero (${h?.ultimoDeLados} → ${h?.siguiente})`)
  debe(h && h.precio, 'pase', 'y ahí «¿Cuánto ha costado en total?»')
  await a.captura(foto('01_ida'))

  /* La vuelta */
  await ev("Array.from(document.querySelectorAll('[role=dialog] [data-mi-vuelo-lado]')).find((b) => b.getAttribute('data-mi-vuelo-lado') === 'vuelta')?.click(); true")
  await a.esp(500)
  h = await hoja()
  debe(h && h.romaTitulo === 'Aeropuerto de salida', 'etiquetas', `vuelta: «Aeropuerto de salida» (${h?.romaTitulo})`)
  debe(h && h.otroTitulo === 'Aeropuerto de llegada', 'etiquetas', `vuelta, lado de fuera: «Aeropuerto de llegada» (${h?.otroTitulo})`)
  debe(h && h.otroEjemplo === 'Londres (Heathrow)' && h.otraTexto === '20:35' && h.otraVacia === '1', 'hora-ejemplo', `vuelta: ejemplo «Londres (Heathrow)» y hora de ejemplo «20:35» (${h?.otroEjemplo} · ${h?.otraTexto})`)
  debe(h && !MALAS.test(h.texto), 'casillas', 'la vuelta tampoco tiene lo quitado')
  await a.captura(foto('02_vuelta'))

  /* ── 2. La hora de la hoja: desde abajo, ✓ y papelera, tocar fuera guarda ── */
  await ev("Array.from(document.querySelectorAll('[role=dialog] [data-mi-vuelo-lado]')).find((b) => b.getAttribute('data-mi-vuelo-lado') === 'ida')?.click(); true")
  await a.esp(400)
  await ev("document.querySelector('[data-campo-de-hora=\"otra\"]')?.click(); true")
  await a.esp(700)
  const rueda = await ev(`(() => {
    const d = document.querySelector('[data-hoja-de-hora]')
    if (!d) return null
    const p = d.querySelector('[data-hoja-de-hora-rueda]')?.parentElement?.getBoundingClientRect()
    return { abajo: p ? Math.round(window.innerHeight - p.bottom) : null, ancho: p ? Math.round(p.width) : null, guardar: Boolean(d.querySelector('[data-hoja-de-hora-guardar]')), quitar: Boolean(d.querySelector('[data-hoja-de-hora-quitar]')), dentro: Boolean(document.querySelector('[data-mi-vuelo-rueda]')), nota: /Toca fuera para cerrar/.test(d.innerText) }
  })()`)
  debe(rueda != null, 'rueda', 'al tocar la hora se abre la hoja de la hora')
  debe(rueda && rueda.abajo <= 4 && rueda.ancho >= 380, 'rueda', `desde abajo, en su propia hoja (${JSON.stringify(rueda)})`)
  debe(rueda && rueda.guardar && rueda.quitar, 'rueda', '✓ para guardar y papelera para quitar')
  debe(rueda && !rueda.dentro && !rueda.nota, 'rueda', 'ya no hay rueda dentro de la hoja del vuelo ni «Toca fuera para cerrar…»')
  await a.captura(foto('03_rueda'))
  await flecha(3)
  await toque(195, 40) // tocar fuera (arriba del todo)
  h = await hoja()
  debe(h && h.otraVacia === '0' && h.otraTexto !== '08:30' && /^\d\d:\d\d$/.test(h.otraTexto ?? ''), 'rueda', `tocar fuera guarda la hora elegida (${h?.otraTexto})`)
  debe(await ev("!document.querySelector('[data-hoja-de-hora]')"), 'rueda', 'y la hoja de la hora se cierra')
  // Otra vez: ✓
  await ev("document.querySelector('[data-campo-de-hora=\"otra\"]')?.click(); true")
  await a.esp(600)
  await flecha(2)
  await ev("document.querySelector('[data-hoja-de-hora-guardar]')?.click(); true")
  await a.esp(500)
  const trasCheck = await hoja()
  debe(trasCheck && trasCheck.otraTexto !== h.otraTexto, 'rueda', `✓ guarda la hora (${h?.otraTexto} → ${trasCheck?.otraTexto})`)
  // Papelera: vuelve a vacía con el ejemplo en gris, sin raya
  await ev("document.querySelector('[data-campo-de-hora=\"otra\"]')?.click(); true")
  await a.esp(600)
  await ev("document.querySelector('[data-hoja-de-hora-quitar]')?.click(); true")
  await a.esp(500)
  h = await hoja()
  debe(h && h.otraVacia === '1' && h.otraTexto === '08:30' && h.otraReloj, 'rueda', `papelera: casilla vacía con el ejemplo en gris y el reloj (${h?.otraTexto})`)
  // Y tocar fuera sin mover la rueda en una casilla vacía NO inventa hora
  await ev("document.querySelector('[data-campo-de-hora=\"otra\"]')?.click(); true")
  await a.esp(500)
  await toque(195, 30)
  h = await hoja()
  debe(h && h.otraVacia === '1', 'rueda', 'vacía y sin tocar la rueda, tocar fuera la deja vacía')

  /* ── 3. Guardar sin tocar nada: lo ya guardado (referencia y aerolínea) no se pierde ── */
  await ev("document.querySelector('[data-mi-vuelo-guardar]')?.click(); true")
  await a.esp(1200)
  await cerrarHojas()
  const guardado = await ev("(() => { const r = window.__ruta.getState().route; return { codigo: r.arrivalCodigo, compania: r.arrivalCompania } })()")
  debe(guardado.codigo === 'VY 6102' && guardado.compania === 'Vueling', 'no-se-pierde', `lo ya guardado (VY 6102, Vueling) sigue tras guardar la hoja (${JSON.stringify(guardado)})`)

  /* ── 4. Los datos se cambian en la tarjeta del billete de RESERVAS ── */
  await abrirLlegada()
  const hayEnlace = await ev("Boolean(document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"] [data-billete-cambiar-datos]'))")
  debe(hayEnlace, 'datos', 'la tarjeta de la ida tiene «Cambiar los datos»')
  await ev("document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"] [data-billete-cambiar-datos]')?.click(); true")
  await a.esp(700)
  const form = await ev(`(() => {
    const d = document.querySelector('[data-datos-billete-campos]')
    if (!d) return null
    const v = (k) => d.querySelector('[data-datos-billete="' + k + '"]')?.value ?? null
    return { codigo: v('codigo'), compania: v('compania'), localizador: v('localizador'), terminal: v('terminal'), asiento: v('asiento'), etiquetas: d.innerText.replace(/\\s+/g, ' ') }
  })()`)
  debe(form && form.codigo === 'VY 6102' && form.compania === 'Vueling', 'datos', `lo ya guardado sale puesto (${form?.codigo} · ${form?.compania})`)
  debe(form && /ref\. vuelo/i.test(form.etiquetas) && /aerolínea/i.test(form.etiquetas) && /localizador/i.test(form.etiquetas) && /terminal/i.test(form.etiquetas) && /asiento/i.test(form.etiquetas), 'datos', 'están Ref. vuelo, Aerolínea, Localizador, Terminal y Asiento')
  await a.captura(foto('04_datos'))
  await a.escribir('[data-datos-billete="codigo"]', 'IB 3251').catch(() => undefined)
  await a.escribir('[data-datos-billete="asiento"]', '21A').catch(() => undefined)
  await a.escribir('[data-datos-billete="localizador"]', 'QWE456').catch(() => undefined)
  await ev("document.querySelector('[data-datos-billete-guardar]')?.click(); true")
  await a.esp(900)
  const tras = await ev("(() => { const r = window.__ruta.getState().route; const m = document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"]'); return { codigo: r.arrivalCodigo, texto: m?.innerText.replace(/\\s+/g, ' ') ?? '' } })()")
  debe(/IB ?3251/i.test(tras.codigo ?? ''), 'datos', `el número cambiado se guarda (${tras.codigo})`)
  debe(/21A/.test(tras.texto) && /QWE456/.test(tras.texto), 'datos', `y la tarjeta enseña el asiento y el localizador nuevos (${tras.texto.slice(0, 160)})`)
  // Se abre la hoja del vuelo otra vez: tampoco los pide y sigue sin perder nada.
  await clicHoja('arrival')
  h = await hoja()
  debe(h && h.casillas.length === 0, 'casillas', 'la hoja del vuelo sigue sin pedirlos')
  await ev("document.querySelector('[data-mi-vuelo-guardar]')?.click(); true")
  await a.esp(1200)
  await cerrarHojas()
  const tras2 = await ev("(() => { const r = window.__ruta.getState().route; const m = document.querySelector('[data-blk=\"llegada\"] [data-mitad=\"arrival\"]'); return { codigo: r.arrivalCodigo, texto: m?.innerText.replace(/\\s+/g, ' ') ?? '' } })()")
  debe(/IB ?3251/i.test(tras2.codigo ?? '') && /21A/.test(tras2.texto) && /QWE456/.test(tras2.texto), 'no-se-pierde', 'guardar la hoja del vuelo no borra lo que se cambió en la tarjeta')
  await a.captura(foto('05_tarjeta'))

  /* ── 5. Un solo aeropuerto: relleno como siempre ── */
  await ruta("window.__ruta.setState({ route: { ...st.route, origin: 'Barcelona', answers: { ...st.route.answers, origin: 'Barcelona' }, arrivalOtroPunto: null, arrivalOtraHora: null } })")
  await clicHoja('arrival')
  h = await hoja()
  debe(h && h.otroValor === 'Barcelona (El Prat)', 'sales-de', `Barcelona (un solo aeropuerto): relleno «Barcelona (El Prat)» (${h?.otroValor})`)
  await a.captura(foto('06_un_aeropuerto'))
  await cerrarHojas()

  /* ── 6. Tren: estaciones y «Estación de llegada» ── */
  await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Madrid', answers: { ...r.answers, origin: 'Madrid' }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'train' } }, arrivalFlightTime: '11:10', arrivalPointId: 'termini', arrivalOtroPunto: null, arrivalOtraHora: null, departureFlightTime: '19:00', departureOtroPunto: null, departureOtraHora: null } })`)
  await a.esp(500)
  await abrirLlegada()
  await clicHoja('arrival')
  h = await hoja()
  debe(h && h.romaTitulo === 'Estación de llegada', 'tren', `tren: «Estación de llegada» (${h?.romaTitulo})`)
  debe(h && h.otroValor === '' && h.otroEjemplo === 'Madrid (Atocha)', 'tren', `tren desde Madrid (varias estaciones): ejemplo en gris «Madrid (Atocha)» (${h?.otroEjemplo})`)
  debe(h && !MALAS.test(h.texto) && !/Ref\. del billete|Compañía/.test(h.texto), 'tren', 'sin las casillas en el tren')
  await a.captura(foto('07_tren'))
  await ev("Array.from(document.querySelectorAll('[role=dialog] [data-mi-vuelo-lado]')).find((b) => b.getAttribute('data-mi-vuelo-lado') === 'vuelta')?.click(); true")
  await a.esp(400)
  h = await hoja()
  debe(h && h.romaTitulo === 'Estación de salida' && h.otroTitulo === 'Estación de llegada', 'tren', `tren, vuelta: «Estación de salida» y «Estación de llegada» (${h?.romaTitulo} · ${h?.otroTitulo})`)
  await cerrarHojas()

  /* ── 7. Barco: «Puerto de llegada» ── */
  await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'ferry' } } } })`)
  await a.esp(500)
  await abrirLlegada()
  await clicHoja('arrival')
  h = await hoja()
  debe(h && h.romaTitulo === 'Puerto de llegada', 'barco', `barco: «Puerto de llegada» (${h?.romaTitulo})`)
  await cerrarHojas()
} finally {
  await a.cerrar()
}
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
