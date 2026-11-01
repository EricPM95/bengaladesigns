// Tanda 10S10 (agente D) · apartados 5, 6, 7 y 8.
//   5. RESERVAS: todos los bloques CERRADOS al entrar, siempre; la etiqueta del precio del mismo tamaño y en negrita que «Sales de» (vuelo «¿Cuánto ha costado en total?»; alojamiento, entradas y excursiones «Precio»);
//      con el vuelo escrito a mano sin tarjeta SÍ sale el bloque de datos con su lápiz; el «Cambiar» de las entradas reservadas, un lápiz de 44 x 44.
//   6. DÍAS, día de llegada: [Añadir] del alojamiento → RESERVAS › Alojamiento; fuera la franja «Tu día de llegada»; [Ver] del vuelo → RESERVAS › Llegada y vuelta (sin abrir la hoja).
//   7. La pestaña «Entradas» de la ficha de un sitio con su número en un círculo dorado.
//   8. Sin destello al refrescar: mientras no se sabe si hay viaje, la pantalla de carga (el logo), nunca la de crear viaje (con la lectura de Supabase retrasada 3 s).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S10_D.mjs
//   SOLO_SECO=1: solo lo que se ve en el código (sin Chrome). Capturas en docs/dias/capturas_jutrip/10s10_<tema>_<n>.jpg (390 x 844).
import fs from 'node:fs'
import path from 'node:path'

const fallos = []
let comprobaciones = 0
let pasadaActual = 'código'
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto: `(${pasadaActual}) ${texto}` })
    console.log(`  ✗ [${regla}] (${pasadaActual}) ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

/* ───────────────────────── A. El código ───────────────────────── */
console.log('A. El código')
{
  const llegada = leer('src/components/route/reservas/LlegadaYVuelta.tsx')
  const entradas = leer('src/components/route/reservas/EntradasYFreeTour.tsx')
  const aloj = leer('src/components/route/reservas/AlojamientoReservas.tsx')
  debe(/desplegadoUsuario \?\? false/.test(llegada), 'apartado 5', 'Llegada y vuelta: cerrada al entrar, falte lo que falte')
  debe(/desplegadoUsuario \?\? abierto/.test(entradas) && !/faltaAlguna \|\|/.test(entradas), 'apartado 5', 'Entradas y Free Tour: cerrado al entrar (solo se abre si el panel lo pide)')
  debe(/desplegadoUsuario \?\? abierto/.test(aloj) && !/faltaAlgo \|\|/.test(aloj), 'apartado 5', 'Alojamiento: cerrado al entrar (solo se abre si el panel lo pide)')
  const campo = leer('src/components/ui/CampoPrecio.tsx')
  debe(/700 14\.5px/.test(campo), 'apartado 5', 'la etiqueta del precio en negrita de 14,5 px, como «Sales de»')
  const dinero = leer('src/components/route/presupuesto/BloqueDinero.tsx')
  debe(/tipo === 'alojamiento' \|\| tipo === 'entradas' \|\| tipo === 'freetour' \|\| tipo === 'excursion' \? 'Precio' : '¿Cuánto ha costado en total\?'/.test(dinero), 'apartado 5', 'alojamiento, entradas y excursiones: «Precio»; el vuelo, «¿Cuánto ha costado en total?»')
  debe(/Boolean\(leg\.codigo\)/.test(leer('src/components/route/reservas/TarjetaBillete.tsx')), 'apartado 5', 'con el vuelo escrito a mano (sin tarjeta) sale el bloque de datos con su lápiz')
  debe(/LapizDeReserva[^\n]*entrada-cambiar/.test(leer('src/components/route/reservas/EntradaCard.tsx')), 'apartado 5', 'el «Cambiar» de la entrada reservada es un lápiz')
  const dia = leer('src/components/route/dayDetail/DayDetailPanel.tsx')
  debe(!/titulo="Tu día de llegada"/.test(dia), 'apartado 6', 'fuera la franja «Tu día de llegada»')
  debe(/pedirReservas\('aloj'\)/.test(dia) && /pedirReservas\('llegada', undefined, true\)/.test(dia), 'apartado 6', '[Añadir] → RESERVAS › Alojamiento; [Ver] → RESERVAS › Llegada y vuelta')
  debe(/numero: item\.id === 'tickets'/.test(leer('src/components/route/dayDetail/StopDetailSheet.tsx')) && /data-ficha-pestana-numero/.test(leer('src/components/route/dayDetail/FichaPiezas.tsx')), 'apartado 7', 'la pestaña Entradas lleva su número')
  const app = leer('src/App.tsx')
  debe(/!cargaHecha && <CargandoApp/.test(app) && /cargaHecha && <TrazoFlow/.test(app), 'apartado 8', 'App: mientras no se sabe si hay viaje, CargandoApp; solo después, el formulario de crear viaje')
  const sync = leer('src/components/sync/TripSync.tsx')
  debe((sync.match(/setCargaInicialHecha\(true\)/g) ?? []).length >= 3, 'apartado 8', 'TripSync da por hecha la carga al decidir dónde abrir, sin guardado y si falla la lectura')
}
if (process.env.SOLO_SECO) {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────────────────────── B. La pantalla ───────────────────────── */
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (tema, n) => path.join(SALIDA, `10s10_${tema}_${n}.jpg`)

async function pasada(version) {
  const sin = version === 'gratis'
  pasadaActual = sin ? 'sin pase' : 'con pase'
  console.log(`\n== ${pasadaActual} ==`)
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
    const ruta = (js) => ev(`(() => { const st = window.__ruta.getState(); ${js}; return true })()`)
    const click = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
    const flechas = () =>
      ev(`(() => { const o = {}; for (const b of ['llegada', 'aloj', 'entradas', 'excursiones']) { const e = document.querySelector('[data-blk="' + b + '"] [data-flecha-bloque]'); o[b] = e ? e.getAttribute('data-flecha-bloque') : null } return JSON.stringify(o) })()`).then((t) => JSON.parse(t))
    const cerrarHojas = async () => {
      for (let i = 0; i < 6 && (await ev("Boolean(document.querySelector('[role=dialog]'))")); i++) {
        await ev("(() => { const d = document.querySelector('[role=dialog]'); const b = d.querySelector('button[aria-label=Cerrar]') ?? Array.from(d.querySelectorAll('button')).find((x) => /Entendido|Vale|Cerrar|Listo/.test(x.textContent || '')); b?.click(); return true })()")
        await a.esp(500)
      }
    }

    // Un viaje con vuelo escrito a mano (número VY 6102, sin tarjeta) y sin alojamiento.
    await ruta(`const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, answers: { ...r.answers, origin: 'Barcelona', originPlace: undefined, dateRange: { start: '2027-03-04', end: '2027-03-08' } }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:25', departureFlightTime: '18:05', arrivalPointId: 'fco', departurePointId: 'cia', arrivalCodigo: 'VY 6102', departureCodigo: 'VY 6105', arrivalCompania: 'Vueling' } })`)

    /* ── 5. RESERVAS: todo cerrado al entrar (con cosas por hacer) ── */
    await ev("window.__ruta.getState().setMode('bookings'); true")
    await a.esp(2000)
    let f = await flechas()
    debe(f.llegada === 'cerrada', 'apartado 5', `Llegada y vuelta cerrada al entrar aunque falte la vuelta o el alojamiento (${f.llegada})`)
    debe(f.aloj === 'cerrada', 'apartado 5', `Alojamiento cerrado al entrar con «Falta» (${f.aloj})`)
    debe(f.entradas === null || f.entradas === 'cerrada', 'apartado 5', `Entradas y Free Tour cerrado al entrar con entradas por reservar (${f.entradas})`)
    debe(f.excursiones === null || f.excursiones === 'cerrada', 'apartado 5', `Excursiones, si hay, cerrado al entrar (${f.excursiones})`)
    debe(!(await ev("Boolean(document.querySelector('[data-blk=\"llegada\"] [data-mitad]'))")), 'apartado 5', 'cerrada de verdad: sin ida ni vuelta a la vista')
    await a.captura(foto(`reservas_cerrado_${version}`, '01'))

    /* ── 5. Se abre al tocar la cabecera: con el vuelo a mano sale el bloque de datos con su lápiz de 44 x 44 ── */
    await click('[data-blk="llegada"] [data-llegada-cabecera]')
    await a.esp(700)
    const datos = await ev(`(() => { const l = document.querySelector('[data-blk="llegada"] [data-mitad="arrival"] [data-lapiz="datos-billete"]'); const r = l?.getBoundingClientRect(); const fila = document.querySelector('[data-blk="llegada"] [data-mitad="arrival"] [data-billete-fila="numero"]'); return JSON.stringify({ w: r ? Math.round(r.width) : null, h: r ? Math.round(r.height) : null, fila: fila?.textContent.trim() ?? null }) })()`).then((t) => JSON.parse(t))
    debe(datos.w === 44 && datos.h === 44 && /VY 6102/.test(datos.fila ?? ''), 'apartado 5', `con el vuelo escrito a mano y sin tarjeta, el bloque de datos con su lápiz de 44 x 44 (${JSON.stringify(datos)})`)
    await a.captura(foto(`reservas_vuelo_a_mano_${version}`, '02'))
    // La etiqueta del precio de la hoja del vuelo: negrita 14,5 px como «Sales de».
    await click('[data-blk="llegada"] [data-precio-vuelo] [data-lapiz="precio-vuelo"]')
    await a.esp(700)
    const etPrecio = await ev(`(() => { const d = document.querySelector('[role=dialog]'); if (!d) return null; const e = Array.from(d.querySelectorAll('span')).find((x) => /¿Cuánto ha costado en total\\?/.test(x.textContent || '') && x.children.length === 0); if (!e) return null; const c = getComputedStyle(e); return JSON.stringify({ t: e.textContent, w: c.fontWeight, s: c.fontSize }) })()`).then((t) => (t ? JSON.parse(t) : null))
    debe(etPrecio && Number(etPrecio.w) >= 700 && etPrecio.s === '14.5px', 'apartado 5', `«¿Cuánto ha costado en total?» en negrita de 14,5 px (${JSON.stringify(etPrecio)})`)
    await a.captura(foto(`reservas_etiqueta_precio_${version}`, '03'))
    await cerrarHojas()

    /* ── 6. DÍAS, día de llegada ── */
    await ev("window.__ruta.getState().setMode('days'); window.__ruta.getState().setActiveDayId(window.__ruta.getState().route.days[0].id); true")
    await a.esp(2500)
    const dia = await ev(`(() => { const t = document.body.innerText; return JSON.stringify({ franja: /Tu día de llegada/.test(t), anadir: Boolean(document.querySelector('[data-alojamiento-dia="anadir"]')), ver: Boolean(document.querySelector('[data-llegada-dias-ver]')), llegada: Boolean(document.querySelector('[data-llegada-dias]')) }) })()`).then((t) => JSON.parse(t))
    debe(!dia.franja, 'apartado 6', 'fuera la franja «Tu día de llegada · Con el Pase Roma…»')
    await a.captura(foto(`dia_llegada_${version}`, '04'))
    if (dia.anadir) {
      await click('[data-alojamiento-dia="anadir"]')
      await a.esp(2000)
      const modo = await ev('window.__ruta.getState().mode')
      f = await flechas()
      debe(modo === 'bookings' && f.aloj === 'abierta', 'apartado 6', `[Añadir] del alojamiento lleva a RESERVAS › Alojamiento, abierto (${modo}, ${f.aloj})`)
      await a.captura(foto(`dia_llegada_anadir_${version}`, '05'))
    } else debe(false, 'apartado 6', 'el día 1 sin alojamiento enseña su [Añadir]')
    await ev("window.__ruta.getState().setMode('days'); true")
    await a.esp(1500)
    // El bloque del vuelo con billete (para tener [Ver]): el de DÍAS sale con billete si hay vuelo guardado; si no, se salta con aviso.
    if (dia.ver) {
      await click('[data-llegada-dias-ver]')
      await a.esp(2000)
      const modo = await ev('window.__ruta.getState().mode')
      f = await flechas()
      const hoja = await ev("Boolean(document.querySelector('[role=dialog]'))")
      debe(modo === 'bookings' && f.llegada === 'abierta' && !hoja, 'apartado 6', `[Ver] lleva a RESERVAS › Llegada y vuelta, abierta y sin hoja encima (${modo}, ${f.llegada}, hoja ${hoja})`)
      await a.captura(foto(`dia_llegada_ver_${version}`, '06'))
    } else console.log('  (aviso) el bloque del vuelo de DÍAS no trae billete en este viaje de prueba: [Ver] se comprueba en el código')

    /* ── 7. Ficha de un sitio: la pestaña «Entradas» con su número ── */
    const numeros = []
    const dias = await ev('window.__ruta.getState().route.days.length')
    for (let d = 0; d < Math.min(dias, 3) && !numeros.some((x) => x.num); d++) {
      await ev('window.__ruta.getState().setMode("days"); window.__ruta.getState().setActiveDayId(window.__ruta.getState().route.days[' + d + '].id); true')
      await a.esp(2000)
      for (let i = 0; i < 6 && !numeros.some((x) => x.num); i++) {
        const abierta = await ev('(() => { const filas = Array.from(document.querySelectorAll("[data-stop-id] button, [data-stop-id] [role=button]")); const e = filas[' + i + ']; if (!e) return false; e.click(); return true })()')
        if (!abierta) break
        await a.esp(1500)
        const t = await ev('JSON.stringify({ hay: Boolean(document.querySelector("[data-ficha-pestanas]")), tabs: Array.from(document.querySelectorAll("[data-ficha-pestanas] button")).map((b) => b.textContent.trim()), num: document.querySelector("[data-ficha-pestana-numero]")?.textContent.trim() ?? null })').then((x) => JSON.parse(x))
        if (t.hay && t.tabs.some((x) => /^Entradas/.test(x))) {
          numeros.push(t)
          if (t.num) {
            // el círculo es pequeño y dorado, al lado de la palabra
            const c = await ev('(() => { const e = document.querySelector("[data-ficha-pestana-numero]"); const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return JSON.stringify({ w: Math.round(r.width), h: Math.round(r.height), radio: cs.borderRadius, fondo: cs.backgroundImage.slice(0, 40) }) })()').then((x) => JSON.parse(x))
            debe(c.h >= 17 && c.h <= 24 && c.w >= 17 && c.w <= 30 && /gradient/.test(c.fondo), 'apartado 7', 'el círculo del número, pequeño y dorado (' + JSON.stringify(c) + ')')
            await a.captura(foto('ficha_entradas_numero_' + version, '07'))
          }
        }
        await cerrarHojas()
        await ev('document.querySelector("[aria-label=Volver], [aria-label=Cerrar]")?.click(); true')
        await a.esp(600)
      }
    }
    // Una pestaña Entradas puede salir sin número solo si no tiene nada que contar («No necesitas entrada», Free Tour): al menos una ficha del viaje lo enseña.
    debe(numeros.some((x) => x.num && /^Entradas[0-9]+$/.test(x.tabs.find((y) => /^Entradas/.test(y)) ?? '')), 'apartado 7', 'la pestaña Entradas lleva su número en un círculo (' + JSON.stringify(numeros) + ')')
  } finally {
    await a.cerrar()
  }
}

/* ── 8. Sin destello al refrescar ── */
async function sinDestello() {
  pasadaActual = 'refrescar'
  console.log('\n== Refrescar con la lectura de Supabase lenta ==')
  // Antes de que cargue nada: cualquier petición a supabase.co tarda 3 s, y un muestreo cada 25 ms de lo que hay en pantalla.
  const antes = `(() => {
    window.__muestras = []
    const f0 = window.fetch.bind(window)
    window.fetch = (u, o) => (String(u).includes('supabase.co') ? new Promise((r) => setTimeout(r, 3000)).then(() => f0(u, o)) : f0(u, o))
    setInterval(() => {
      const raiz = document.getElementById('root')
      if (!raiz || raiz.children.length === 0) return
      window.__muestras.push({ t: Math.round(performance.now()), cargando: Boolean(document.querySelector('[data-cargando-app]')), formulario: Boolean(document.querySelector('input, textarea')), texto: (raiz.innerText || '').slice(0, 80) })
    }, 25)
  })()`
  const a = await abrirApp(APP, { ruta: '/?apertura=0', ancho: 390, alto: 844, antes, sinEsperarRuta: true })
  try {
    await a.esp(9000)
    const m = await a.evaluar('JSON.stringify(window.__muestras)').then((t) => JSON.parse(t))
    const primera = m[0]
    const conCargando = m.filter((x) => x.cargando).length
    const destelloAntes = m.findIndex((x) => x.formulario && !x.cargando)
    const ultimaCargando = m.map((x) => x.cargando).lastIndexOf(true)
    debe(m.length > 0, 'apartado 8', `hay muestras de la pantalla (${m.length})`)
    debe(primera?.cargando === true, 'apartado 8', `lo primero que se ve es la pantalla de carga, no el formulario (${JSON.stringify(primera)})`)
    debe(conCargando * 25 >= 1500, 'apartado 8', `la pantalla de carga aguanta mientras la lectura tarda (${conCargando * 25} ms)`)
    debe(destelloAntes === -1 || destelloAntes > ultimaCargando, 'apartado 8', 'el formulario de crear viaje nunca sale antes de acabar la carga (sin destello)')
    await a.captura(foto('sin_destello', '08'))
  } finally {
    await a.cerrar()
  }
}

try {
  await pasada('pase')
  await pasada('gratis')
  await sinDestello()
} catch (e) {
  fallos.push({ regla: 'prueba', texto: `la prueba se ha caído: ${e?.message ?? e}` })
  console.log(e)
}
console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const x of fallos) console.log(`  ✗ [${x.regla}] ${x.texto}`)
process.exit(fallos.length ? 1 : 0)
