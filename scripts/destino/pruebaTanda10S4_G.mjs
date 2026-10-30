// Tanda 10S4 (agente G) · apartado 2: RESERVAS con «Llegada y vuelta» y «Alojamiento» que se pliegan, el precio dentro, el alojamiento con el estilo del vuelo,
// la línea del pase fuera con el bloque cerrado y dentro con el bloque abierto, y «Eliminar vuelo» alineado a la derecha.
// Capturas docs/dias/capturas_jutrip/10s4_reservas_<n>.jpg (390 x 844).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S4_G.mjs
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
const foto = (n) => path.join(SALIDA, `10s4_reservas_${n}.jpg`)

async function pasada(version) {
  const sin = version === 'gratis'
  const et = sin ? 'sin pase' : 'con pase'
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
    const vaAReservas = async () => {
      await ev("window.__ruta.getState().setMode('bookings'); true")
      await a.esp(1800)
    }
    const bloque = (b) =>
      ev(`(() => {
        const el = document.querySelector('[data-blk="${b}"]')
        if (!el) return null
        const cab = el.querySelector('[data-llegada-cabecera], [data-aloj-cabecera], [data-llegada-vacia]') ?? el.firstElementChild
        const lineaPase = el.querySelector('[data-linea-pase]')
        const hijos = Array.from(cab?.querySelector('span.flex-col')?.children ?? []).map((x) => (x.textContent || '').trim())
        return {
          texto: el.innerText.replace(/\\s+/g, ' '),
          cabecera: hijos,
          estado: el.querySelector('[data-estado]')?.getAttribute('data-estado') ?? null,
          estadoTexto: el.querySelector('[data-estado]')?.textContent ?? null,
          iconoVerde: Boolean(cab?.querySelector('span[style*="oklch(0.55 0.11 150"]')),
          mitades: el.querySelectorAll('[data-mitad]').length,
          caja: Boolean(el.querySelector('[data-alojamiento-caja]')),
          precioVuelo: el.querySelector('[data-precio-vuelo-texto]')?.textContent ?? null,
          precioAloj: el.querySelector('[data-alojamiento-precio]')?.textContent ?? null,
          lineaPase: lineaPase ? { dentroDeCaja: false, y: Math.round(lineaPase.getBoundingClientRect().top), cabY: Math.round(cab.getBoundingClientRect().bottom), cajaY: el.querySelector('[data-alojamiento-caja]') ? Math.round(el.querySelector('[data-alojamiento-caja]').getBoundingClientRect().bottom) : null } : null,
          eliminar: Array.from(el.querySelectorAll('[data-eliminar]')).map((b) => { const r = b.getBoundingClientRect(); const c = el.getBoundingClientRect(); return { texto: b.textContent.trim(), derecha: Math.round(c.right - r.right), izq: Math.round(r.left - c.left), y: Math.round(r.top) } }),
          cambiar: Array.from(el.querySelectorAll('button')).filter((b) => /^Cambiar$/.test(b.textContent.trim())).length,
          cabY: cab ? Math.round(cab.getBoundingClientRect().top) : 0,
          bloqueW: Math.round(el.getBoundingClientRect().width),
        }
      })()`)
    const clicCab = (b) => ev(`(() => { const el = document.querySelector('[data-blk="${b}"]'); const c = el?.querySelector('[data-llegada-cabecera], [data-aloj-cabecera]'); if (!c) return false; c.click(); return true })()`)
    const cerrarHojas = async () => {
      for (let i = 0; i < 6 && (await ev("Boolean(document.querySelector('[role=dialog]'))")); i++) {
        await ev("(() => { const d = document.querySelector('[role=dialog]'); const b = d.querySelector('button[aria-label=Cerrar]') ?? Array.from(d.querySelectorAll('button')).find((x) => /Entendido|Vale|Cerrar|Listo/.test(x.textContent || '')); b?.click(); return true })()")
        await a.esp(500)
      }
    }

    /* ── 1. Todo listo: los dos bloques salen plegados ── */
    await ev(`(() => {
      const st = window.__ruta.getState()
      const r = st.route
      const rango = r.answers.dateRange
      window.__ruta.setState({ route: { ...r, arrivalFlightTime: '08:30', departureFlightTime: '18:40', arrivalPrecio: { amount: 110, currency: 'EUR' }, departurePrecio: null, accommodationZone: ${sin ? 'null' : "'centro'"} } })
      const dia = r.days[0].id
      window.__ruta.getState().setAccommodationHotel(dia, { name: 'Hotel Artemide', precio: { amount: 280, currency: 'EUR' } })
      return !!rango
    })()`)
    await vaAReservas()
    if (!sin) {
      // Con pase la zona también es parte de «Listo»: se elige la primera de las del destino por si «centro» no existe.
      const z = await ev("(() => { const el = document.querySelector('[data-blk=\"aloj\"]'); return el?.innerText.replace(/\\s+/g, ' ') ?? '' })()")
      debe(typeof z === 'string', 'pase', 'el bloque de alojamiento existe')
    }
    let ll = await bloque('llegada')
    let al = await bloque('aloj')
    debe(ll && al, 'base', `los dos bloques existen (${et})`)
    debe(ll.mitades === 0, 'plegado', `Llegada y vuelta: con vuelo y vuelta listos sale PLEGADO, sin las mitades (${ll.mitades})`)
    debe(ll.cabecera.length === 2 && /^Llegada y vuelta$/.test(ll.cabecera[0]) && ll.cabecera[1] === 'Listo', 'cabecera', `Llegada y vuelta cerrado: título y «Listo», SIN línea de texto debajo (${JSON.stringify(ll.cabecera)})`)
    debe(!/Barcelona|→|110/.test(ll.cabecera.join(' ')) && !/→/.test(ll.texto), 'sin-linea', `y sin «origen → destino · precio» (${ll.texto.slice(0, 80)})`)
    debe(ll.iconoVerde && ll.estado === 'hecho', 'verde', 'icono verde y estado «hecho»')
    if (sin) {
      debe(al.caja === false, 'plegado', `Alojamiento (sin pase): listo con el hotel → plegado, sin caja (${al.caja})`)
      debe(al.cabecera.length === 2 && al.cabecera[1] === 'Listo', 'cabecera', `Alojamiento cerrado: título y «Listo», sin nombre del hotel ni ciudad debajo (${JSON.stringify(al.cabecera)})`)
      debe(!/Artemide/.test(al.texto), 'sin-linea', 'el nombre del hotel no sale con el bloque cerrado')
      debe(al.lineaPase && al.lineaPase.y >= al.lineaPase.cabY - 2, 'pase-fuera', `la línea del pase sale FUERA y debajo de la cabecera con el bloque cerrado (${JSON.stringify(al.lineaPase)})`)
    }
    await a.captura(foto(`${version}_01_cerrados`))

    /* ── 2. Abrir y cerrar ── */
    await clicCab('llegada')
    await a.esp(500)
    ll = await bloque('llegada')
    debe(ll.mitades === 2, 'abrir', `tocar la cabecera abre Llegada y vuelta: ida y vuelta (${ll.mitades})`)
    debe(/Precio · 110/.test(ll.precioVuelo ?? ''), 'precio', `el precio está dentro: «${ll.precioVuelo}»`)
    debe(ll.cambiar >= 3, 'cambiar', `«Cambiar» en la ida, en la vuelta y en el precio (${ll.cambiar})`)
    debe(!/Barcelona/.test(ll.cabecera.join(' ')), 'sin-linea', 'abierto, la cabecera sigue sin la línea de debajo del título')
    const elim = ll.eliminar.filter((e) => /^Eliminar/.test(e.texto))
    debe(elim.length >= 1 && elim.every((e) => e.derecha < 40 && e.izq > ll.bloqueW / 2), 'eliminar-derecha', `«Eliminar vuelo» al final del bloque pero a la derecha (${JSON.stringify(elim)})`)
    await a.captura(foto(`${version}_02_vuelo_abierto`))
    await clicCab('llegada')
    await a.esp(500)
    ll = await bloque('llegada')
    debe(ll.mitades === 0, 'cerrar', `otro toque lo cierra (${ll.mitades})`)

    await clicCab('aloj')
    await a.esp(500)
    al = await bloque('aloj')
    debe(al.caja, 'abrir', 'tocar la cabecera abre el alojamiento: caja crema')
    debe(/Artemide/.test(al.texto) && /noches?/.test(al.texto), 'estilo', `la caja trae el hotel y las noches (${al.texto.slice(0, 160)})`)
    debe(/Precio · 280/.test(al.precioAloj ?? ''), 'precio', `el precio del alojamiento está dentro: «${al.precioAloj}»`)
    debe(al.cambiar >= 1, 'cambiar', '«Cambiar» arriba a la derecha')
    const ea = al.eliminar.find((e) => /Eliminar alojamiento/.test(e.texto))
    debe(ea && ea.derecha < 40 && ea.izq > al.bloqueW / 2, 'eliminar-derecha', `«Eliminar alojamiento» abajo a la derecha (${JSON.stringify(ea)})`)
    if (sin) debe(al.lineaPase && al.lineaPase.cajaY != null && al.lineaPase.y >= al.lineaPase.cajaY - 2, 'pase-dentro', `abierto, la línea del pase va dentro y debajo de la caja (${JSON.stringify(al.lineaPase)})`)
    await a.captura(foto(`${version}_03_aloj_abierto`))
    await clicCab('aloj')
    await a.esp(500)
    al = await bloque('aloj')
    debe(!al.caja, 'cerrar', 'otro toque lo cierra')

    /* ── 3. Mientras falta algo, abiertos ── */
    await ev(`(() => { const r = window.__ruta.getState().route; window.__ruta.setState({ route: { ...r, departureFlightTime: null } }); window.__ruta.getState().setAccommodationHotel(r.days[0].id, null); window.__ruta.setState((s) => ({ route: { ...s.route, accommodationZone: null } })); return true })()`)
    await a.esp(800)
    ll = await bloque('llegada')
    debe(ll.mitades === 2 && ll.estado === 'falta', 'abierto-falta', `Llegada y vuelta con la vuelta sin poner: abierto y en «falta» (${ll.mitades}, ${ll.estado}, «${ll.estadoTexto}»)`)
    al = await bloque('aloj')
    debe(/Falta/.test(al.estadoTexto ?? '') && /Añadir mi alojamiento/.test(al.texto) === false, 'abierto-falta', `Alojamiento vacío: «Falta» y plegado hasta que se toque (${al.estadoTexto})`)
    await a.captura(foto(`${version}_04_falta`))
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
