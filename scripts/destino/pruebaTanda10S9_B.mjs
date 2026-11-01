// Tanda 10S9 (agente B) · apartado 1: los tres bloques de RESERVAS (Llegada y vuelta, Alojamiento, Entradas y Free Tour) con LA MISMA cabecera
// (icono grande, título grande, el estado DEBAJO del título y la flecha a la derecha), y un bloque que SIEMPRE se puede cerrar, falte lo que falte.
// Al entrar: (10S10, 1-nov) CERRADO siempre (antes: abierto si falta algo, cerrado si «Listo»). Capturas docs/dias/capturas_jutrip/10s9_cabeceras_<n>.jpg (390 x 844).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S9_B.mjs
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
const leer = (f) => fs.readFileSync(f, 'utf8')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (n) => path.join(SALIDA, `10s9_cabeceras_${n}.jpg`)

/* ── Código: un solo componente de cabecera, usado por los tres ── */
{
  const base = leer('src/components/route/reservas/BloqueReservas.tsx')
  debe(/export function CabeceraBloque\(/.test(base), 'codigo', 'existe el componente compartido CabeceraBloque')
  for (const f of ['LlegadaYVuelta', 'AlojamientoReservas', 'EntradasYFreeTour']) {
    const t = leer(`src/components/route/reservas/${f}.tsx`)
    debe(/<CabeceraBloque\b/.test(t), 'codigo', `${f} usa CabeceraBloque`)
    debe(!/<PildoraEstado\b|<CabeceraClara\b/.test(t), 'codigo', `${f} ya no usa las pastillas de la 10S4/10S8`)
  }
}

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
    /** Lo que se ve de la cabecera de un bloque: medidas del icono, del título, del estado y de la flecha. */
    const cab = (b) =>
      ev(`(() => {
        const el = document.querySelector('[data-blk="${b}"]')
        if (!el) return null
        const c = el.querySelector('[data-cabecera-bloque]')
        if (!c) return { hay: false }
        const col = c.querySelector('span.flex-col')
        const titulo = c.querySelector('[data-titulo-bloque]')
        const estado = c.querySelector('[data-estado]')
        const kids = Array.from(c.children)
        const flecha = kids[kids.length - 1]
        const icono = kids[0]
        const r = (x) => x.getBoundingClientRect()
        return {
          hay: true,
          titulo: titulo.textContent.trim(),
          tituloPx: getComputedStyle(titulo).fontSize,
          tituloFuente: getComputedStyle(titulo).fontFamily.split(',')[0],
          estadoTexto: estado.textContent.trim(),
          estado: estado.getAttribute('data-estado'),
          estadoDebajo: r(estado).top >= r(titulo).bottom - 2 && Math.abs(r(estado).left - r(titulo).left) < 2,
          iconoW: Math.round(r(icono).width),
          flechaW: Math.round(r(flecha).width),
          flechaADerecha: r(flecha).left > r(col).right - 2 && Math.abs(r(flecha).right - (r(el).right - 16)) < 10,
          flechaGira: (flecha.querySelector('svg')?.style.transform ?? ''),
          hijosColumna: Array.from(col.children).length,
          pastilla: Boolean(el.querySelector('[data-estado-pildora]')),
          cabW: Math.round(r(icono).left - r(el).left) + '/' + Math.round(r(el).right - r(flecha).right),
          tituloDesborda: titulo.scrollWidth > titulo.clientWidth + 1,
          pagina: document.documentElement.scrollWidth <= window.innerWidth,
        }
      })()`)
    const abierto = (b) =>
      ev(`(() => {
        const el = document.querySelector('[data-blk="${b}"]')
        if (!el) return null
        return { mitades: el.querySelectorAll('[data-mitad]').length, caja: Boolean(el.querySelector('[data-alojamiento-caja]')), anadir: Boolean(el.querySelector('[data-anadir-alojamiento]')), filas: el.querySelectorAll('[data-tarjeta-crema], [data-seccion-por-reservar], [data-anadir-otra-reserva]').length }
      })()`)
    const tocarCab = async (b) => {
      await ev(`document.querySelector('[data-blk="${b}"] [data-cabecera-bloque]')?.click(); true`)
      await a.esp(500)
    }
    const hayAbierto = (b, x) => (b === 'llegada' ? x.mitades > 0 : b === 'aloj' ? x.caja || x.anadir : x.filas > 0)

    /* ── 1. Faltan cosas: los tres abiertos de entrada, con la misma cabecera, y se cierran ── */
    await ev(`(() => {
      const r = window.__ruta.getState().route
      window.__ruta.setState({ route: { ...r, arrivalFlightTime: '08:30', departureFlightTime: null, arrivalPrecio: null, departurePrecio: null, accommodationZone: null } })
      window.__ruta.getState().setAccommodationHotel(r.days[0].id, null)
      return true
    })()`)
    await vaAReservas()
    const bloques = ['llegada', 'aloj', 'entradas']
    const cabs = {}
    for (const b of bloques) {
      cabs[b] = await cab(b)
      const c = cabs[b]
      if (b === 'entradas' && (!c || !c.hay)) {
        debe(true, 'entradas', `(${et}) este viaje no trae «Entradas y Free Tour»: se salta`)
        continue
      }
      debe(c && c.hay, 'cabecera', `(${et}) ${b}: tiene la cabecera compartida`)
      if (!c || !c.hay) continue
      debe(c.iconoW === 48, 'icono', `(${et}) ${b}: icono grande de 48 px (${c.iconoW})`)
      debe(c.tituloPx === '27px' && /Instrument Serif/i.test(c.tituloFuente), 'titulo', `(${et}) ${b}: título de 27 px en Instrument Serif (${c.tituloPx}, ${c.tituloFuente})`)
      debe(c.estadoDebajo && c.hijosColumna === 2, 'estado-debajo', `(${et}) ${b}: el estado va DEBAJO del título, en la misma columna («${c.estadoTexto}»)`)
      debe(c.flechaW === 40 && c.flechaADerecha, 'flecha', `(${et}) ${b}: flecha de 40 px a la derecha (${c.flechaW}, ${c.flechaADerecha})`)
      debe(!c.pastilla, 'sin-pastilla', `(${et}) ${b}: ya no hay pastilla de estado a la derecha`)
      debe(!c.tituloDesborda && c.pagina, 'cabe', `(${et}) ${b}: el título cabe en 390 px y la página no se sale`)
      debe(c.estado === 'falta', 'estado', `(${et}) ${b}: sin lo suyo puesto, el estado es «falta» («${c.estadoTexto}»)`)
    }
    // Las tres cabeceras miden y se ven igual.
    {
      const hay = bloques.map((b) => cabs[b]).filter((c) => c && c.hay)
      debe(hay.length >= 2 && hay.every((c) => c.iconoW === hay[0].iconoW && c.tituloPx === hay[0].tituloPx && c.flechaW === hay[0].flechaW && c.cabW === hay[0].cabW), 'iguales', `(${et}) las cabeceras tienen el mismo icono, la misma letra, la misma flecha y el mismo margen izquierdo y derecho (${JSON.stringify(hay.map((c) => [c.iconoW, c.tituloPx, c.flechaW, c.cabW]))})`)
    }
    debe(/falta/i.test(cabs.llegada?.estadoTexto ?? '') || /Falta/.test(cabs.llegada?.estadoTexto ?? ''), 'texto', `(${et}) Llegada y vuelta, con solo la ida: «${cabs.llegada?.estadoTexto}»`)
    debe(cabs.aloj?.estadoTexto === 'Falta', 'texto', `(${et}) Alojamiento sin nada: «Falta» (${cabs.aloj?.estadoTexto})`)
    if (cabs.entradas?.hay) debe(/^\d+ de \d+ reservadas$|^Listo$|^Ninguna en tu ruta$/.test(cabs.entradas.estadoTexto), 'texto', `(${et}) Entradas: «${cabs.entradas.estadoTexto}»`)

    for (const b of bloques) {
      if (!cabs[b]?.hay) continue
      let x = await abierto(b)
      const faltaAlgo = cabs[b].estado === 'falta' && !(b === 'entradas' && /Ninguna/.test(cabs[b].estadoTexto))
      // antes (10S9): al entrar, abierto si falta algo y cerrado si «Listo» → ahora: CERRADO siempre, falte lo que falte → decisión de Eric (10S10, 1-nov). Se abre y se cierra con la cabecera.
      debe(!hayAbierto(b, x), 'al-entrar', `(${et}) ${b}: al entrar, cerrado aunque ${faltaAlgo ? 'falte algo' : 'esté listo'} (${JSON.stringify(x)})`)
      if (faltaAlgo) {
        await tocarCab(b)
        x = await abierto(b)
        debe(hayAbierto(b, x), 'reabrir', `(${et}) ${b}: un toque en la cabecera lo abre (${JSON.stringify(x)})`)
        debe((await cab(b)).flechaGira.includes('180deg'), 'flecha-gira', `(${et}) ${b}: abierto, la flecha está girada`)
        await tocarCab(b)
        x = await abierto(b)
        debe(!hayAbierto(b, x), 'cerrar-faltando', `(${et}) ${b}: SE PUEDE CERRAR aunque falte algo (${JSON.stringify(x)})`)
        debe(!(await cab(b)).flechaGira.includes('180deg'), 'flecha-gira', `(${et}) ${b}: cerrado, la flecha vuelve`)
      }
    }
    await a.captura(foto(`${version}_01_faltan`))

    /* ── 2. Todo listo: Llegada y Alojamiento cerrados de entrada, «Listo», y se abren ── */
    await ev(`(() => {
      const r = window.__ruta.getState().route
      window.__ruta.setState({ route: { ...r, arrivalFlightTime: '08:30', departureFlightTime: '18:40', arrivalPrecio: { amount: 110, currency: 'EUR' }, departurePrecio: null, accommodationZone: ${sin ? 'null' : "'centro'"} } })
      window.__ruta.getState().setAccommodationHotel(r.days[0].id, { name: 'Hotel Artemide', precio: { amount: 280, currency: 'EUR' } })
      return true
    })()`)
    await a.esp(1000)
    for (const b of ['llegada', 'aloj']) {
      const c = await cab(b)
      const x = await abierto(b)
      if (!sin && b === 'aloj' && c.estado === 'falta') {
        debe(/Falta la zona/.test(c.estadoTexto), 'texto', `(${et}) Alojamiento con pase sin elegir la zona: «${c.estadoTexto}»`)
        continue
      }
      debe(c.estadoTexto === 'Listo' && c.estado === 'hecho', 'listo', `(${et}) ${b}: «Listo» en verde (${c.estadoTexto}, ${c.estado})`)
      debe(!hayAbierto(b, x), 'listo-cerrado', `(${et}) ${b}: «Listo» sale CERRADO (${JSON.stringify(x)})`)
      await tocarCab(b)
      debe(hayAbierto(b, await abierto(b)), 'listo-abre', `(${et}) ${b}: se abre al tocar la cabecera`)
      debe(!(await cab(b)).pastilla, 'sin-pastilla', `(${et}) ${b}: abierto tampoco lleva pastilla`)
      await tocarCab(b)
      debe(!hayAbierto(b, await abierto(b)), 'listo-cierra', `(${et}) ${b}: otro toque lo cierra`)
    }
    await a.captura(foto(`${version}_02_listos`))
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
console.log(`\nPrueba 10S9 B: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
