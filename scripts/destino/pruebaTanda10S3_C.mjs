// Tanda 10S3, agente C (apartado 4) · La hoja del vuelo (y del tren, el autobús y el barco) con sus dos lados, y el billete de DÍAS y HOY.
// (10S6, 31-oct) antes → ahora → decisión de Eric: la rueda de la hora dentro de la hoja con «Quitar la hora» → hoja de la hora desde abajo (✓ guarda, papelera quita); «Llegas a»/«Sales de» de Roma → «Aeropuerto de llegada/salida»; fuera la casilla de referencia; la hora vacía sale como ejemplo en gris, no «—» (se lee con data-vacia).
//   Design: `Piezas/Vuelo Reservas` 02, 02b, 02c, 03 y 04; `Piezas/Alojamiento Dias` 03 y 03b.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S3_C.mjs
// Capturas docs/dias/capturas_jutrip/10s3_vuelo_*.jpg y 10s3_billete_dias_*.jpg (con su _design al lado; SIN_DESIGN=1 las salta).
// Acaba imprimiendo «N comprobaciones, M fallos».
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, esp, leer, modulo } from './_10n5_comun.mjs'
import { capturarDesign } from './capturaDesign.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10s3_${n}.jpg`)
const store = modulo('/src/store/useRouteStore.ts')
const poner = (a, js) => a.evaluar(`${store}.then((s) => { const e = s.useRouteStore.getState(); ${js}; return true })`)

/* ───────── 1. El código ───────── */
console.log('1. El código')
{
  const hoja = leer('src/components/route/reservas/HojaDelVuelo.tsx')
  const legs = leer('src/components/route/reservas/LlegadaYVuelta.tsx')
  const tarjeta = leer('src/components/route/dayDetail/TarjetaLlegadaDias.tsx')
  debe(!/dashed/.test(hoja) && !/¿De dónde sales\? · opcional/.test(hoja + legs) && !/marcaOtraHora|etiquetaOtro/.test(hoja + legs), '1 caja', 'la caja amarilla de puntos «¿De dónde sales? · opcional / Sales a las» ya no está en el código')
  debe(/data-mi-vuelo-otro-punto/.test(hoja) && /data-mi-vuelo-otra-hora/.test(hoja) && /data-mi-vuelo-medio/.test(hoja), '1 lados', 'la hoja trae el otro lado (texto y hora) y el medio en medio')
  // (10S6, 31-oct) antes → ahora → decisión de Eric: casilla sin ningún ayuda → con varios aeropuertos, el ejemplo en gris (otroPuntoEjemplo, calculado); nunca un texto fijo.
  debe(!/placeholder="[^"]/.test((hoja.match(/data-mi-vuelo-otro-punto[\s\S]{0,200}/) ?? [''])[0]) && /placeholder=\{l\.extras\?\.otroPuntoEjemplo/.test(hoja), '1 en blanco', 'la casilla de «Sales de» no lleva texto fijo: solo el ejemplo calculado')
  debe(/data-llegada-roma/.test(tarjeta) && /ResizeObserver/.test(tarjeta) && /codigoRoma/.test(tarjeta), '1 tarjeta', 'la tarjeta de DÍAS pinta «CÓDIGO hora» y mide si cabe')
  debe(/codigoDelOtroLado/.test(leer('src/lib/billete.ts')), '1 código de fuera', 'el código del lado de fuera sale de una sola función')
}

/* ───────── 2. La hoja del vuelo, en el móvil ───────── */
console.log('2. La hoja del vuelo')
const escribe = (a, sel, valor) =>
  a.evaluar(`(() => { const i = document.querySelector('[role=dialog] ${sel}'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ${JSON.stringify(valor)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
const clic = (a, sel) => a.evaluar(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
const rueda = (a, columna, texto) => a.evaluar(`(() => { const o = Array.from(document.querySelectorAll('[role="dialog"] [data-rueda-columna="${columna}"] [role="option"]')).find((x) => x.textContent.trim() === ${JSON.stringify(texto)}); if (!o) return false; o.click(); return true })()`)
/** Lo que se ve de la hoja abierta: textos, posiciones de arriba abajo y si algo se sale. */
const vista = (a) =>
  a.evaluar(`(() => {
    const d = document.querySelector('[role="dialog"]')
    if (!d) return null
    const top = (re) => { const e = Array.from(d.querySelectorAll('span,div,button,label')).filter((x) => x.children.length === 0 || x.tagName === 'BUTTON').find((x) => re.test((x.textContent || '').trim())); return e ? Math.round(e.getBoundingClientRect().top) : null }
    const el = (s) => d.querySelector(s)
    const r = (s) => { const e = el(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), h: Math.round(b.height) } }
    const punto = Array.from(d.querySelectorAll('[data-mi-vuelo-punto-opcion]')).map((x) => ({ t: x.textContent.trim(), top: Math.round(x.getBoundingClientRect().top), activo: x.getAttribute('aria-pressed') === 'true' }))
    const otro = el('[data-mi-vuelo-otro-punto]')
    return {
      texto: d.innerText.replace(/\\s+/g, ' '),
      raya: Array.from(d.querySelectorAll('*')).some((x) => /dashed/.test(getComputedStyle(x).borderTopStyle || '')),
      otroValor: otro ? otro.value : null,
      otroPlaceholder: otro ? (otro.getAttribute('placeholder') ?? '') : null,
      otraHora: el('[data-campo-de-hora="otra"]')?.getAttribute('data-vacia') === '1' ? '—' : (el('[data-campo-de-hora="otra"] [data-campo-de-hora-texto]')?.textContent.trim() ?? null),
      hora: el('[data-campo-de-hora="roma"] [data-campo-de-hora-texto]')?.textContent.trim() ?? null,
      punto,
      medio: r('[data-mi-vuelo-medio]'),
      campoOtro: r('[data-mi-vuelo-otro-punto]'),
      campoHoraOtra: r('[data-mi-vuelo-otra-hora]'),
      campoHora: r('[data-mi-vuelo-campo-hora]'),
      lista: r('[data-mi-vuelo-punto-lista]'),
      pase: r('[data-linea-pase="vuelo-hoja"]'),
      codigo: null,
      guardar: el('[data-mi-vuelo-guardar]')?.textContent.trim() ?? null,
      etiquetas: { llegasA: top(/^Llegas a$/), salesDe: top(/^Sales de$/) },
      sinSalirse: Array.from(d.querySelectorAll('[data-mi-vuelo-lados] *')).every((x) => { const b = x.getBoundingClientRect(); return b.width === 0 || (b.left >= -1 && b.right <= innerWidth + 1) }),
      titulo: d.querySelector('h2')?.textContent.trim() ?? null,
    }
  })()`)
const rutaDe = (a) =>
  a.evaluar(`${store}.then((s) => { const r = s.useRouteStore.getState().route; return { ida: r.arrivalFlightTime ?? null, vuelta: r.departureFlightTime ?? null, pIda: r.arrivalPointId ?? null, pVuelta: r.departurePointId ?? null, oIda: r.arrivalOtroPunto ?? null, hIda: r.arrivalOtraHora ?? null, oVuelta: r.departureOtroPunto ?? null, hVuelta: r.departureOtraHora ?? null } })`)

async function abrirHoja(a) {
  await poner(a, `e.setMode('bookings')`)
  await esp(2200)
  const abre = await clic(a, '[data-blk="llegada"] [class*="cursor-pointer"]')
  await esp(1500)
  return abre
}

for (const version of ['gratis', 'pago']) {
  console.log(`   (${version === 'gratis' ? 'sin pase' : 'con pase'})`)
  const a = await conViaje({ version, ancho: 390, alto: 844 })
  try {
    await poner(a, `s.useRouteStore.setState((st) => ({ route: { ...st.route, origin: 'Barcelona', originPlace: undefined, arrivalFlightTime: null, departureFlightTime: null, arrivalPointId: null, departurePointId: null, arrivalOtroPunto: null, arrivalOtraHora: null, departureOtroPunto: null, departureOtraHora: null } }))`)
    debe(await abrirHoja(a), `2 ${version} abre`, 'el bloque «Llegada y vuelta» no abre la hoja del vuelo')
    // — La ida.
    let v = await vista(a)
    debe(v && v.titulo === 'Tu vuelo' && v.guardar === 'Guardar el vuelo', `2 ${version} título`, `título y botón: ${v && v.titulo} / ${v && v.guardar}`)
    debe(v && !/¿De dónde sales/.test(v.texto) && !/Sales a las/.test(v.texto) && !v.raya, `2 ${version} sin caja`, `sigue la caja amarilla de puntos: ${v && v.texto.slice(0, 300)}`)
    debe(v && /Día de llegada/.test(v.texto) && /Sales de/.test(v.texto) && /opcional/.test(v.texto) && /Sale a las · opcional/i.test(v.texto) && /Aeropuerto de llegada/.test(v.texto) && /Llega a las/i.test(v.texto), `2 ${version} ida textos`, `faltan textos de la ida: ${v && v.texto.slice(0, 400)}`)
    // antes: «Sales de» en blanco, la app no propone nada → ahora: relleno de partida con la ciudad de la primera pantalla (un solo aeropuerto: «Barcelona (El Prat)») → decisión de Eric (10S5, 30-oct). Sin ayuda escrita dentro (placeholder).
    debe(v && v.otroValor === 'Barcelona (El Prat)' && v.otroPlaceholder === '', `2 ${version} ida relleno`, `«Sales de» va relleno de partida con «Barcelona (El Prat)» (valor «${v && v.otroValor}», ayuda «${v && v.otroPlaceholder}»)`)
    debe(v && v.punto.length >= 2 && v.punto.every((p) => p.top === v.punto[0].top) && v.punto.some((p) => /Fiumicino/.test(p.t)) && v.punto.some((p) => /Ciampino/.test(p.t)), `2 ${version} ida cuadrados`, `Fiumicino y Ciampino en cuadrados, uno al lado del otro: ${JSON.stringify(v && v.punto)}`)
    debe(v && v.campoOtro && v.campoHoraOtra && v.medio && v.lista && v.campoHora && v.campoOtro.top < v.campoHoraOtra.top && v.campoHoraOtra.top < v.medio.top && v.medio.top < v.lista.top && v.lista.top < v.campoHora.top, `2 ${version} ida orden`, `orden de la ida: Sales de, Sale a las, medio, Llegas a, Llega a las: ${JSON.stringify(v && { o: v.campoOtro, ho: v.campoHoraOtra, m: v.medio, l: v.lista, h: v.campoHora })}`)
    debe(v && v.campoHora && v.campoHora.h >= 52 && v.campoHoraOtra.h >= 52 && v.campoOtro.h >= 52, `2 ${version} ida tamaños`, 'las casillas miden unos 54 px como en Design')
    debe(v && (version === 'gratis' ? v.pase && v.pase.top >= v.campoHora.bottom : v.pase === null), `2 ${version} ida pase`, `la línea del pase ${version === 'gratis' ? 'sale debajo de «Llega a las»' : 'no sale con pase'}: ${JSON.stringify(v && v.pase)}`)
    debe(v && v.sinSalirse, `2 ${version} ida sin salirse`, 'algo de la ida se sale de la pantalla')
    // El botón no se enciende sin la hora y el aeropuerto de Roma.
    debe(await a.evaluar("document.querySelector('[data-mi-vuelo-guardar]')?.disabled === true"), `2 ${version} ida botón`, 'sin tocar nada el botón está apagado')
    await a.captura(foto(`vuelo_ida_${version}`))
    // Rellena: sale de (escrito), su hora (rueda), aeropuerto y hora de llegada a Roma.
    await escribe(a, '[data-mi-vuelo-otro-punto]', 'Barcelona-El Prat (BCN)')
    await clic(a, '[data-campo-de-hora="otra"]')
    await esp(500)
    debe(await a.evaluar("document.querySelectorAll('[role=\"dialog\"] [data-rueda-columna]').length === 2"), `2 ${version} ida rueda`, 'la rueda de «Sale a las» es de dos columnas (hora : minutos)')
    await rueda(a, 'Horas', '08')
    await esp(300)
    await rueda(a, 'Minutos', '30')
    await esp(700)
    await clic(a, '[data-hoja-de-hora-guardar]')
    await esp(400)
    v = await vista(a)
    debe(v && v.otraHora === '08:30', `2 ${version} ida otra hora`, `la hora de salida sigue a la rueda (${v && v.otraHora})`)
    await clic(a, '[data-mi-vuelo-punto-opcion="Fiumicino"]')
    await clic(a, '[data-campo-de-hora="roma"]')
    await esp(500)
    await rueda(a, 'Horas', '11')
    await esp(300)
    await rueda(a, 'Minutos', '15')
    await esp(700)
    await clic(a, '[data-hoja-de-hora-guardar]')
    await esp(400)
    v = await vista(a)
    debe(v && v.hora === '11:15' && v.otraHora === '08:30', `2 ${version} ida horas`, `las dos horas se ven (${v && v.hora} / ${v && v.otraHora})`)
    await a.evaluar("document.querySelector('[role=dialog] [data-mi-vuelo-campo-hora]')?.scrollIntoView({ block: 'center' }); true")
    await a.captura(foto(`vuelo_ida_rellena_${version}`))
    // — La vuelta.
    await clic(a, '[data-mi-vuelo-lado="vuelta"]')
    await esp(600)
    v = await vista(a)
    debe(v && /Día de vuelta/.test(v.texto) && /Aeropuerto de salida/.test(v.texto) && /Sale a las/i.test(v.texto) && /Aeropuerto de llegada/.test(v.texto) && /Llega a las · opcional/i.test(v.texto), `2 ${version} vuelta textos`, `faltan textos de la vuelta: ${v && v.texto.slice(0, 400)}`)
    // antes: en blanco → ahora: relleno de partida (10S5, decisión de Eric, 30-oct).
    debe(v && v.otroValor === 'Barcelona (El Prat)' && v.otroPlaceholder === '', `2 ${version} vuelta relleno`, `«Llegas a» va relleno de partida (${v && v.otroValor})`)
    debe(v && v.lista && v.campoHora && v.medio && v.campoOtro && v.campoHoraOtra && v.lista.top < v.campoHora.top && v.campoHora.top < v.medio.top && v.medio.top < v.campoOtro.top && v.campoOtro.top < v.campoHoraOtra.top, `2 ${version} vuelta orden`, `orden de la vuelta: Sales de, Sale a las, medio, Llegas a, Llega a las: ${JSON.stringify(v && { l: v.lista, h: v.campoHora, m: v.medio, o: v.campoOtro, ho: v.campoHoraOtra })}`)
    debe(v && (version === 'gratis' ? v.pase && v.campoHora && v.pase.top >= v.campoHora.bottom && v.medio && v.pase.bottom <= v.medio.top : v.pase === null), `2 ${version} vuelta pase`, `la línea del pase ${version === 'gratis' ? 'sale debajo de «Sale a las» (antes del medio)' : 'no sale con pase'}: ${JSON.stringify(v && v.pase)}`)
    debe(v && v.sinSalirse, `2 ${version} vuelta sin salirse`, 'algo de la vuelta se sale de la pantalla')
    await escribe(a, '[data-mi-vuelo-otro-punto]', 'Barcelona-El Prat')
    await clic(a, '[data-mi-vuelo-punto-opcion="Ciampino"]')
    await clic(a, '[data-campo-de-hora="roma"]')
    await esp(400)
    await rueda(a, 'Horas', '18')
    await esp(300)
    await rueda(a, 'Minutos', '05')
    await esp(700)
    await clic(a, '[data-hoja-de-hora-guardar]')
    await esp(400)
    await clic(a, '[data-campo-de-hora="otra"]')
    await esp(400)
    await rueda(a, 'Horas', '20')
    await esp(300)
    await rueda(a, 'Minutos', '35')
    await esp(700)
    await clic(a, '[data-hoja-de-hora-guardar]')
    await esp(400)
    await a.captura(foto(`vuelo_vuelta_${version}`))
    // Quitar la otra hora la deja vacía.
    await clic(a, '[data-campo-de-hora="otra"]')
    await esp(400)
    await clic(a, '[data-hoja-de-hora-quitar]')
    await esp(400)
    v = await vista(a)
    debe(v && v.otraHora === '—', `2 ${version} quitar hora`, `«Quitar la hora» deja la casilla vacía (${v && v.otraHora})`)
    await clic(a, '[data-campo-de-hora="otra"]')
    await esp(400)
    await rueda(a, 'Horas', '20')
    await esp(300)
    await rueda(a, 'Minutos', '35')
    await esp(500)
    await clic(a, '[data-hoja-de-hora-guardar]')
    await esp(300)
    // Guardar: todo a la ruta.
    debe(await a.evaluar("document.querySelector('[data-mi-vuelo-guardar]')?.disabled === false"), `2 ${version} botón`, 'con los dos aeropuertos y las horas el botón se enciende')
    await clic(a, '[data-mi-vuelo-guardar]')
    await esp(1500)
    const r = await rutaDe(a)
    debe(r.ida === '11:15' && r.vuelta === '18:05' && r.pIda && r.pVuelta, `2 ${version} guarda`, `se guardan las horas y los aeropuertos de Roma: ${JSON.stringify(r)}`)
    debe(r.oIda === 'Barcelona-El Prat (BCN)' && r.hIda === '08:30' && r.oVuelta === 'Barcelona-El Prat' && r.hVuelta === '20:35', `2 ${version} guarda lo de fuera`, `se guarda el otro lado de cada trayecto: ${JSON.stringify(r)}`)
    // La tarjeta guardada vuelve a abrir la hoja con lo escrito.
    await esp(1500)
    // (Con pase, al guardar sale «Hemos ajustado tu ruta»: se cierra con «De acuerdo».)
    await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('[role=dialog] button')).find((x) => /^De acuerdo$/.test((x.textContent || '').trim())); if (b) b.click(); return true })()")
    await esp(1000)
    // 10S4: antes → ahora → decisión de Eric (10S4, 30-oct): antes la tarjeta del vuelo salía siempre abierta; ahora, con ida y vuelta listas, sale plegada y se abre con un toque en su cabecera. Misma comprobación después de abrirla.
    if (!(await a.evaluar("Boolean(document.querySelector('[data-mitad=\"arrival\"] button'))"))) {
      await clic(a, '[data-llegada-cabecera]')
      await esp(800)
    }
    await clic(a, '[data-mitad="arrival"] button')
    await esp(2000)
    v = await vista(a)
    if (!v) console.log('   (sin hoja al reabrir; en pantalla:', (await a.evaluar('document.body.innerText.slice(0, 300)')).split(String.fromCharCode(10)).join(' | '), ')')
    debe(v && v.otraHora === '08:30' && v.hora === '11:15', `2 ${version} reabre`, `al reabrir la ida están las dos horas (${v && v.hora} / ${v && v.otraHora}; en pantalla: ${v && v.texto.slice(0, 200)})`)
    debe(v && (await a.evaluar("document.querySelector('[role=dialog] [data-mi-vuelo-otro-punto]')?.value")) === 'Barcelona-El Prat (BCN)', `2 ${version} reabre texto`, 'al reabrir la ida está lo escrito en «Sales de»')
  } catch (e) {
    debe(false, `2 ${version} error`, String(e && e.stack ? e.stack : e).slice(0, 500))
  } finally {
    a.cerrar()
  }
}

/* ───────── 3. El billete en DÍAS (375 px) y el código de fuera ───────── */
console.log('3. El billete en DÍAS')
{
  const a = await conViaje({ version: 'gratis', ancho: 375, alto: 667 })
  try {
    const medir = () =>
      a.evaluar(`(() => {
        const c = document.querySelector('[data-llegada-dias]')
        if (!c) return null
        c.scrollIntoView({ block: 'center' })
        const roma = c.querySelector('[data-llegada-roma]')
        const fuera = c.querySelector('[data-llegada-fuera]')
        const cb = c.getBoundingClientRect(), rb = roma ? roma.getBoundingClientRect() : null
        const col = roma?.parentElement?.getBoundingClientRect()
        const ver = Array.from(c.querySelectorAll('span')).find((x) => (x.textContent || '').trim() === 'Ver')?.getBoundingClientRect()
        return {
          texto: c.innerText.split(String.fromCharCode(10)).join(' | '),
          roma: roma ? roma.textContent.trim() : null,
          fuera: fuera ? fuera.textContent.trim() : null,
          cortado: roma ? roma.scrollWidth > roma.clientWidth + 1 : null,
          cabe: rb && col ? rb.right <= col.right + 1 && rb.left >= col.left - 1 : null,
          dentro: rb ? rb.right <= cb.right && (!ver || rb.right <= ver.left) : null,
          ancho: Math.round(cb.width),
        }
      })()`)
    const caso = async (nombre, js, espera = 1500) => {
      await poner(a, js)
      await poner(a, `e.setActiveDayId(e.route.days[0].id); e.setMode('days')`)
      await esp(espera + 1000)
      return { nombre, m: await medir() }
    }
    const base = `s.useRouteStore.setState((st) => ({ route: { ...st.route, origin: 'Barcelona', originPlace: undefined, arrivalPointId: 'fco', arrivalFlightTime: '11:15', arrivalOtroPunto: null, arrivalOtraHora: null } }))`
    // 03: los dos lados, el código entre paréntesis.
    let c = await caso('dos lados', `${base}; e.setLegOtroPunto('arrival', 'Barcelona-El Prat (BCN)'); e.setLegOtraHora('arrival', '08:30')`)
    debe(c.m && /LLEGADA · BARCELONA → ROMA/.test(c.m.texto) && /BCN 08:30/.test(c.m.texto) && /FCO 11:15/.test(c.m.texto) && /Fiumicino · Cómo llegar desde el aeropuerto/.test(c.m.texto), '3 dos lados', `«BCN 08:30 → FCO 11:15»: ${c.m && c.m.texto}`)
    debe(c.m && !c.m.cortado && c.m.cabe && c.m.dentro, '3 dos lados sin cortar', `la hora de llegada a Roma no se corta a 375 px: ${JSON.stringify(c.m)}`)
    await a.captura(foto('billete_dias_03'))
    // El texto largo nunca: sin código entre paréntesis, el de la ciudad de salida.
    c = await caso('texto largo', `${base}; e.setLegOtroPunto('arrival', 'BARCELONA-EL PRAT'); e.setLegOtraHora('arrival', '08:30')`)
    debe(c.m && /BCN 08:30/.test(c.m.texto) && !/EL PRAT/i.test(c.m.texto.replace(/Fiumicino.*/, '')), '3 código de la ciudad', `sin paréntesis sale el código de la ciudad de salida, nunca el texto largo: ${c.m && c.m.texto}`)
    c = await caso('Madrid', `s.useRouteStore.setState((st) => ({ route: { ...st.route, origin: 'Madrid', originPlace: undefined, arrivalPointId: 'fco', arrivalFlightTime: '11:15', arrivalOtroPunto: 'Madrid-Barajas Adolfo Suárez', arrivalOtraHora: '07:10' } }))`)
    debe(c.m && /MAD 07:10/.test(c.m.texto) && /LLEGADA · MADRID → ROMA/.test(c.m.texto) && !/BARAJAS/i.test(c.m.texto), '3 Madrid', `«MAD 07:10 → FCO 11:15»: ${c.m && c.m.texto}`)
    // Solo la hora de fuera, sin texto: también el código de la ciudad.
    c = await caso('solo hora', `${base}; e.setLegOtraHora('arrival', '08:30')`)
    debe(c.m && /BCN 08:30/.test(c.m.texto), '3 solo hora', `con solo la hora de salida sale «BCN 08:30»: ${c.m && c.m.texto}`)
    // 03b: sin el de fuera, solo el de Roma.
    c = await caso('solo Roma', base)
    debe(c.m && c.m.roma === 'FCO 11:15' && /LLEGADA · ROMA/.test(c.m.texto) && !/→/.test(c.m.texto.split('|')[1] ?? '') && !/BCN/.test(c.m.texto), '3 solo Roma', `sin el lado de fuera: «FCO 11:15» y «LLEGADA · ROMA»: ${c.m && c.m.texto}`)
    debe(c.m && !c.m.cortado && c.m.cabe && c.m.dentro, '3 solo Roma sin cortar', `FCO 11:15 entero: ${JSON.stringify(c.m)}`)
    await a.captura(foto('billete_dias_03b'))
    // Si no cabe en una línea: el lado de fuera arriba, pequeño, y «FCO 11:15» grande debajo, entero.
    c = await caso('estrecha', `${base}; e.setLegOtroPunto('arrival', 'Barcelona-El Prat (BCN)'); e.setLegOtraHora('arrival', '08:30')`)
    await a.evaluar("(() => { const c = document.querySelector('[data-llegada-dias]'); c.style.width = '270px'; c.style.maxWidth = '270px'; return true })()")
    await esp(800)
    const apilado = await medir()
    debe(apilado && apilado.fuera && /BCN 08:30/.test(apilado.fuera) && apilado.roma === 'FCO 11:15' && !apilado.cortado && apilado.cabe, '3 apilado', `en una tarjeta estrecha: «BCN 08:30 →» arriba y «FCO 11:15» debajo, entero: ${JSON.stringify(apilado)}`)
    await a.captura(foto('billete_dias_03_estrecha'))
    // En una tarjeta ancha, todo en una línea: «BCN 08:30 → FCO 11:15».
    await a.evaluar("(() => { const c = document.querySelector('[data-llegada-dias]'); c.style.width = '372px'; c.style.maxWidth = '372px'; return true })()")
    await esp(800)
    const ancha = await medir()
    debe(ancha && !ancha.fuera && /BCN 08:30 → FCO 11:15/.test(ancha.texto) && !ancha.cortado && ancha.cabe, '3 una línea', `en una tarjeta ancha, «BCN 08:30 → FCO 11:15» en una línea y entero: ${ancha && ancha.texto}`)
    await a.captura(foto('billete_dias_03_ancha'))
    await a.evaluar("(() => { const c = document.querySelector('[data-llegada-dias]'); c.style.width = ''; c.style.maxWidth = ''; return true })()")
    await esp(800)
    const vuelve = await medir()
    debe(vuelve && vuelve.roma === 'FCO 11:15' && !vuelve.cortado && vuelve.cabe, '3 vuelve', `al volver al ancho de siempre (${vuelve && vuelve.ancho} px), la hora de Roma sigue entera: ${JSON.stringify(vuelve)}`)
    // El mismo código en cada sitio donde hay billete (DÍAS vuelta y HOY usan billeteDe).
    const cod = await a.evaluar(`import('/src/lib/billete.ts').then((m) => {
      const ruta = (o) => ({ arrivalFlightTime: '11:15', departureFlightTime: '18:05', origin: 'Madrid', ...o })
      const ida = (o) => m.billeteDe({ route: ruta(o), kind: 'llegada', mode: 'avion', point: null })
      const vuelta = (o) => m.billeteDe({ route: ruta(o), kind: 'vuelta', mode: 'avion', point: null })
      return {
        parentesis: ida({ arrivalOtroPunto: 'Madrid-Barajas (MAD)' })?.codigoOtro,
        largo: ida({ arrivalOtroPunto: 'MADRID-BARAJAS ADOLFO SUAREZ' })?.codigoOtro,
        soloHora: ida({ arrivalOtraHora: '07:10' })?.codigoOtro,
        nada: ida({})?.codigoOtro,
        vuelta: vuelta({ departureOtroPunto: 'Madrid-Barajas', departureOtraHora: '20:30' })?.codigoOtro,
        compostela: m.billeteDe({ route: ruta({ origin: 'Santiago de Compostela', arrivalOtraHora: '07:10' }), kind: 'llegada', mode: 'avion', point: null })?.codigoOtro,
      }
    })`)
    debe(cod && cod.parentesis === 'MAD' && cod.largo === 'MAD' && cod.soloHora === 'MAD' && cod.nada === null && cod.vuelta === 'MAD' && cod.compostela === 'SCQ', '3 código de fuera', `el código de fuera (billete de DÍAS, de la vuelta y de HOY): ${JSON.stringify(cod)}`)
  } catch (e) {
    debe(false, '3 error', String(e && e.stack ? e.stack : e).slice(0, 500))
  } finally {
    a.cerrar()
  }
}

/* ───────── 4. Las capturas de Design, al lado ───────── */
if (process.env.SIN_DESIGN !== '1') {
  const ir = (re) => `(() => { const e = Array.from(document.querySelectorAll('span')).find((s) => ${re}.test(s.textContent || '')); e?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); return true })()`
  for (const [pieza, n, salida] of [
    ['Piezas/Vuelo Reservas.dc.html', '02b', 'vuelo_ida_design'],
    ['Piezas/Vuelo Reservas.dc.html', '03', 'vuelo_vuelta_design'],
    ['Piezas/Alojamiento Dias.dc.html', '03', 'billete_dias_03_design'],
    ['Piezas/Alojamiento Dias.dc.html', '03b', 'billete_dias_03b_design'],
  ]) {
    await capturarDesign(pieza, foto(salida), { despues: ir(`/^${n} ·/`) }).catch((e) => console.log('  (sin captura de Design)', n, e.message))
  }
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  FALLO [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
