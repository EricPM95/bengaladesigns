// V45 · el MAPA DEL ALOJAMIENTO (RESERVAS › Alojamiento; Design `Alojamiento Mapa`, M1, M2, M3).
//   A · sin navegador: el código (Photon y no Mapbox Search, espera ≥ 600 ms, 3 letras, cancelar la anterior, filtro de ciudad, créditos, campo nuevo opcional, HOY y «Cómo llegar» prefieren el punto).
//   B · en la app (con pase, 390 × 844, Chrome sin ventana, 1 solo): M1 el botón; M2 la búsqueda NO va a cada letra (fetch de photon.komoot.io simulado: nunca se llama al Photon real) y solo
//       enseña lo de la ciudad; «Mi alojamiento está aquí» guarda el punto; M3 muestra dirección y [Cambiar] (en la hoja y en la tarjeta de RESERVAS); el punto se usa en HOY y en «Cómo llegar»;
//       un viaje de antes (sin punto) sigue igual. Capturas en docs/dias/V45_capturas/.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV45_mapa.mjs
import fs from 'node:fs'
import path from 'node:path'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

/* ───────────────────────── A. Sin navegador ───────────────────────── */
console.log('A. El código')
{
  const lib = leer('src/lib/buscarLugarPhoton.ts')
  const mapa = leer('src/components/route/reservas/MapaDelAlojamiento.tsx')
  const hoja = leer('src/components/route/alojamiento/HojaTuAlojamiento.tsx')
  const hoy = leer('src/components/route/hoy/v2/HoyDuranteV2.tsx')
  const dir = leer('src/lib/direccionAlojamiento.ts')
  debe(/photon\.komoot\.io\/api\//.test(lib) && !/api\.mapbox\.com\/geocoding|mapbox\.places/.test(lib + mapa), 'photon', 'se busca con Photon, no con Mapbox Search (sus resultados no se pueden guardar)')
  debe(/ESPERA_PHOTON_MS = (\d+)/.test(lib) && Number(/ESPERA_PHOTON_MS = (\d+)/.exec(lib)[1]) >= 600 && /MIN_LETRAS_PHOTON = 3/.test(lib), 'debounce', 'espera de al menos 600 ms y 3 letras como mínimo')
  debe(/AbortController/.test(mapa) && /signal: senal/.test(lib), 'cancelar', 'la petición anterior se cancela (AbortController)')
  debe(/soloDeLaCiudad/.test(lib) && /RADIO_CIUDAD_KM/.test(lib), 'ciudad', 'se descarta lo que queda fuera de la ciudad del viaje')
  debe(/© OpenStreetMap contributors/.test(mapa), 'creditos', '«© OpenStreetMap contributors» en el mapa')
  debe(/Cada cuánto|cada vez que el viajero PARA de escribir/i.test(lib) && /KB/.test(lib), 'comentario', 'cada llamada de red dice cada cuánto se hace y cuánto baja')
  debe(!/supabase\.|supabase-js|\.rpc\(/.test(lib + mapa), 'supabase', 'el mapa no pregunta a Supabase: el punto viaja dentro del viaje')
  debe(/accommodationPoint\?:/.test(leer('src/lib/types.ts')) && /'accommodationPoint'/.test(leer('src/lib/datosDelViajero.ts')), 'campo', 'campo nuevo opcional del viaje, y no se pierde al rehacer la ruta')
  debe(/Pon tu alojamiento en el mapa/.test(hoja) && /BOTON_ORO/.test(hoja) && !/linear-gradient/.test(hoja + mapa), 'm1', 'M1: botón dorado (botonesOro.ts, sin degradado propio) «Pon tu alojamiento en el mapa»')
  debe(/data-alojamiento-direccion/.test(hoja), 'texto libre', 'el campo de texto de la dirección se conserva (solo se añade el mapa)')
  debe(/puntoDelAlojamiento\(route\) \?\?/.test(hoy) && /puntoDelAlojamiento/.test(dir), 'hoy', 'HOY cuenta los minutos desde el punto guardado si existe')
  debe(/Mi alojamiento está aquí/.test(mapa) && /¿Dónde te alojas\?/.test(mapa), 'm2', 'M2: «¿Dónde te alojas?» y [Mi alojamiento está aquí]')
}
if (process.env.SOLO_SECO) {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────────────────────── B. La pantalla ───────────────────────── */
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/V45_capturas')
fs.mkdirSync(SALIDA, { recursive: true })

// El fetch de photon.komoot.io se simula ANTES de que cargue la página: se cuentan las llamadas y nunca sale ninguna a internet.
const ANTES = `(() => {
  window.__photon = []
  const real = window.fetch.bind(window)
  const fea = (nombre, calle, num, cp, ciudad, lon, lat) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { name: nombre, street: calle, housenumber: num, postcode: cp, city: ciudad } })
  window.fetch = (entrada, init) => {
    const url = typeof entrada === 'string' ? entrada : entrada.url
    if (/photon\\.komoot\\.io/.test(url)) {
      window.__photon.push(url)
      const reverse = /\\/reverse/.test(url)
      const features = reverse
        ? [fea(null, 'Via del Corso', '20', '00186', 'Roma', 12.4789, 41.9031)]
        : [
            fea('Via del Corso', 'Via del Corso', null, '00186', 'Roma', 12.4800, 41.9020),
            fea('Via del Corso', 'Via del Corso', '18', '00186', 'Roma', 12.4796, 41.9010),
            fea('Via del Corso', 'Via del Corso', null, '20122', 'Milano', 9.1930, 45.4640),
            fea('Hotel Via del Corso', 'Via del Corso', '126', '00186', 'Roma', 12.4793, 41.9035),
          ]
      const cuerpo = JSON.stringify({ type: 'FeatureCollection', features })
      return Promise.resolve(new Response(cuerpo, { status: 200, headers: { 'content-type': 'application/json' } }))
    }
    return real(entrada, init)
  }
})()`

console.log('\nB. La pantalla (con pase, 390 × 844)')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=pago', ancho: 390, alto: 844, antes: ANTES })
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
  const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const D = await import('/src/lib/direccionAlojamiento.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  const clic = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
  const foto = (nombre) => a.captura(path.join(SALIDA, nombre)).catch(() => {})

  // El viaje de prueba es de Roma: sin dirección ni punto, con el hotel puesto.
  const base = await R(`const r = route(); st().setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: null }); R.useRouteStore.setState({ route: { ...route(), accommodationAddress: null, accommodationPoint: null } }); return { dia: r.days[0].id, destino: r.destination, hayCentro: Boolean(r.destinationCoordinates) }`)
  console.log(`  (viaje de prueba: ${base.destino})`)

  /* — M1: la hoja «Tu alojamiento» sin dirección — */
  await R("st().setMode('bookings'); return true")
  await a.esp(1500)
  await ev(`import('/src/store/useAlojamientoUi.ts').then((m) => m.useAlojamientoUi.getState().abrirTuAlojamiento(${JSON.stringify(base.dia)})).then(() => true)`)
  await a.esp(1500)
  const m1 = await ev(`(() => { const b = document.querySelector('[data-alojamiento-poner-en-mapa]'); return { boton: b?.textContent.trim() ?? null, fondo: b ? getComputedStyle(b).backgroundImage : '', texto: Boolean(document.querySelector('[data-alojamiento-direccion]')) } })()`)
  debe(m1.boton === 'Pon tu alojamiento en el mapa', 'M1', `la hoja trae el botón «Pon tu alojamiento en el mapa» (${m1.boton})`)
  debe(/linear-gradient/.test(m1.fondo), 'M1 dorado', 'el botón es el dorado de siempre (degradado de botonesOro.ts)')
  debe(m1.texto, 'M1 texto libre', 'el campo de texto de la dirección sigue ahí (solo se añade el mapa)')
  await ev("document.querySelector('[data-alojamiento-punto-bloque]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(500)
  await foto('v45_mapa_m1_hoja.jpg')

  /* — M2: el mapa y la búsqueda — */
  await clic('[data-alojamiento-poner-en-mapa]')
  await a.esp(2500)
  const m2a = await ev(`(() => ({ hay: Boolean(document.querySelector('[data-mapa-alojamiento]')), titulo: document.querySelector('[data-mapa-alojamiento] h2')?.textContent, creditos: document.querySelector('[data-creditos-mapa]')?.textContent ?? '', boton: document.querySelector('[data-alojamiento-aqui]')?.textContent.trim(), lienzos: document.querySelectorAll('canvas.mapboxgl-canvas').length }))()`)
  debe(m2a.hay && m2a.titulo === '¿Dónde te alojas?' && m2a.boton === 'Mi alojamiento está aquí', 'M2', `la pantalla «¿Dónde te alojas?» con [Mi alojamiento está aquí] (${m2a.titulo} · ${m2a.boton})`)
  debe(/© OpenStreetMap contributors/.test(m2a.creditos), 'M2 creditos', `créditos de OpenStreetMap a la vista (${m2a.creditos})`)
  debe(m2a.lienzos <= 1, 'un canvas', `a lo sumo un lienzo de Mapbox abierto (${m2a.lienzos})`)
  const llamadas0 = await ev('window.__photon.length')
  debe(llamadas0 === 0, 'sin llamada al abrir', `al abrir el mapa no se busca nada (${llamadas0} llamadas)`)

  const escribirCaracteres = async (texto, cadaMs) => {
    await ev("(() => { const e = document.querySelector('[data-buscar-alojamiento-mapa]'); e.focus(); return true })()")
    for (const c of texto) {
      await a.cdp('Input.insertText', { text: c })
      await a.esp(cadaMs)
    }
  }
  // 2 letras y una pausa larga: nada (mínimo 3 letras).
  await escribirCaracteres('Vi', 150)
  await a.esp(1500)
  debe((await ev('window.__photon.length')) === 0, 'minimo 3', 'con 2 letras no se busca')
  // «Via del Corso» letra a letra (150 ms entre letras: más rápido que la espera): UNA sola petición al parar.
  await escribirCaracteres('a del Corso', 150)
  await a.esp(300)
  const durante = await ev('window.__photon.length')
  debe(durante === 0, 'no a cada letra', `mientras se escribe no sale ninguna petición (${durante})`)
  await a.hasta('window.__photon.length >= 1 && document.querySelectorAll("[data-sugerencia-alojamiento]").length > 0', { segundos: 8 })
  await a.esp(1500)
  const llamadas = await ev('window.__photon.slice()')
  debe(llamadas.length === 1, 'una peticion', `«Via del Corso» (13 letras) = UNA petición a Photon al dejar de escribir (${llamadas.length})`)
  debe(llamadas.every((u) => /^https:\/\/photon\.komoot\.io\/api\/\?/.test(u) && /q=Via\+del\+Corso/.test(u)), 'url', `la petición lleva la búsqueda entera (${llamadas[0]})`)
  debe(llamadas.every((u) => /lat=41\.\d+/.test(u) && /lon=12\.\d+/.test(u)), 'sesgo', 'con el sesgo a la ciudad del viaje (lat y lon del destino)')
  const sug = await ev(`Array.from(document.querySelectorAll('[data-sugerencia-alojamiento]')).map((x) => x.innerText.replace(/\\s+/g, ' ').trim())`)
  debe(sug.length === 3 && sug.every((t) => !/Milano/.test(t)), 'solo la ciudad', `4 resultados, el de Milán se descarta: 3 de Roma (${JSON.stringify(sug)})`)
  debe(sug.some((t) => /^Via del Corso, 18 00186 Roma$/.test(t)), 'sugerencia', 'cada sugerencia dice la calle y el código postal con la ciudad')
  await foto('v45_mapa_m2_busqueda.jpg')
  // Ninguna llamada a Mapbox Search ni a Supabase.
  const salidas = a.peticiones.filter((u) => /(api\.mapbox\.com\/geocoding|search\/searchbox)[^?]*Corso/i.test(u))
  debe(salidas.length === 0, 'sin Mapbox Search', `no se ha llamado a Mapbox Search (${salidas.length}: ${salidas.map((u) => u.slice(0, 90)).join(' | ')})`)
  // Escribir otra cosa y volver a la misma: la caché evita la segunda llamada.
  // Se elige la sugerencia «Via del Corso, 18».
  await ev(`(() => { const b = Array.from(document.querySelectorAll('[data-sugerencia-alojamiento]')).find((x) => /Corso, 18(?!\\d)/.test(x.innerText)); b.click(); return true })()`)
  await a.esp(1500)
  const tras = await ev(`(() => ({ dir: document.querySelector('[data-direccion-del-punto]')?.innerText.replace(/\\s+/g, ' ').trim(), sugs: document.querySelectorAll('[data-sugerencia-alojamiento]').length, foto: window.__photon.length }))()`)
  debe(/^Via del Corso, 18 00186 Roma$/.test(tras.dir ?? '') && tras.sugs === 0, 'elegir', `al tocar una sugerencia, el mapa va allí y la tarjeta dice la dirección (${tras.dir})`)
  debe(tras.foto === 1, 'sin reverse al elegir', `elegir una sugerencia no pide otra dirección (${tras.foto} llamadas)`)
  await foto('v45_mapa_m2_elegido.jpg')

  // Guardar el punto.
  await clic('[data-alojamiento-aqui]')
  await a.esp(1200)
  const m3 = await ev(`(() => ({ mapaCerrado: !document.querySelector('[data-mapa-alojamiento]'), pequeno: Boolean(document.querySelector('[data-mapa-pequeno-alojamiento]')), dir: document.querySelector('[data-mapa-pequeno-alojamiento] [data-direccion-tarjeta]')?.innerText.replace(/\\s+/g, ' ').trim(), cambiar: document.querySelector('[data-alojamiento-cambiar-punto]')?.textContent.trim(), campoTexto: Boolean(document.querySelector('[data-alojamiento-direccion]')), boton: Boolean(document.querySelector('[data-alojamiento-poner-en-mapa]')) }))()`)
  debe(m3.mapaCerrado && m3.pequeno, 'M3', 'al guardar el punto se cierra el mapa y la hoja enseña el mapa pequeño')
  debe(/^Via del Corso, 18 00186 Roma$/.test(m3.dir ?? '') && m3.cambiar === 'Cambiar', 'M3 dirección', `con la dirección debajo y [Cambiar] (${m3.dir} · ${m3.cambiar})`)
  debe(!m3.campoTexto && !m3.boton, 'M3 una vez', 'la dirección se escribe UNA vez: ya no sale el campo ni el botón')
  await ev("document.querySelector('[data-alojamiento-punto-bloque]')?.scrollIntoView({ block: 'center' }); true")
  await a.esp(500)
  await foto('v45_mapa_m3_hoja.jpg')
  // Sin guardar aún, el viaje no tiene punto; al [Guardar el alojamiento] sí.
  debe((await R('return route().accommodationPoint ?? null')) === null, 'no antes', 'hasta [Guardar el alojamiento] el viaje no cambia')
  await clic('[data-guardar-alojamiento]')
  await a.esp(1500)
  const guardado = await R('return { p: route().accommodationPoint ?? null, d: route().accommodationAddress ?? null }')
  debe(guardado.p && Math.abs(guardado.p.lat - 41.901) < 0.001 && Math.abs(guardado.p.lng - 12.4796) < 0.001 && guardado.p.direccion === 'Via del Corso, 18, 00186 Roma', 'guarda', `el punto queda en el viaje (lat, lng y dirección) (${JSON.stringify(guardado.p)})`)
  debe(guardado.d === 'Via del Corso, 18, 00186 Roma', 'guarda direccion', `y la dirección de «Cómo llegar» es la misma (${guardado.d})`)

  /* — M3 en la tarjeta de RESERVAS — */
  await ev(`(() => { const b = document.querySelector('[data-blk="aloj"]'); if (b && !b.querySelector('[data-alojamiento-caja]')) b.querySelector('[data-cabecera-clara]')?.click(); return true })()`)
  await a.esp(1200)
  const tarj = await ev(`(() => { const b = document.querySelector('[data-blk="aloj"]'); return { mapa: Boolean(b.querySelector('[data-alojamiento-mapa-tarjeta]')), dirs: Array.from(b.querySelectorAll('[data-direccion-tarjeta]')).map((x) => x.innerText.replace(/\\s+/g, ' ').trim()), cambiar: Boolean(b.querySelector('[data-alojamiento-cambiar-punto]')), comoLlegar: b.querySelector('[data-como-llegar-alojamiento]')?.getAttribute('href') ?? null } })()`)
  debe(tarj.mapa && tarj.cambiar, 'tarjeta M3', 'la tarjeta del alojamiento de RESERVAS enseña el mapa pequeño con [Cambiar]')
  debe(tarj.dirs.length === 1 && /^Via del Corso, 18 00186 Roma$/.test(tarj.dirs[0]), 'tarjeta una vez', `la dirección sale UNA sola vez en la tarjeta (${JSON.stringify(tarj.dirs)})`)
  debe(/destination=41\.90\d*%2C12\.479\d*/.test(tarj.comoLlegar ?? ''), 'como llegar', `[Cómo llegar a tu alojamiento] va a las coordenadas del punto (${tarj.comoLlegar})`)
  await ev("document.querySelector('[data-blk=\"aloj\"]')?.scrollIntoView({ block: 'start' }); true")
  await a.esp(500)
  await foto('v45_mapa_m3_reservas.jpg')

  /* — [Cambiar] abre el mapa con el pin donde estaba, y afinar con el dedo pide la dirección UNA vez — */
  await clic('[data-alojamiento-cambiar-punto]')
  await a.esp(1500)
  debe(await ev("Boolean(document.querySelector('[data-mapa-alojamiento]'))"), 'cambiar', '[Cambiar] abre el mapa')
  await clic('[data-mapa-alojamiento-volver]')
  await a.esp(600)
  debe(await ev("!document.querySelector('[data-mapa-alojamiento]')"), 'volver', 'la flecha vuelve sin cambiar nada')

  /* — HOY y «Cómo llegar» usan el punto — */
  const hoy = await R(`const p = D.puntoDelAlojamiento(route()); const e = D.enlaceComoLlegarAlojamiento(D.direccionDelAlojamiento(route()), route().destination, p); return { p, e }`)
  debe(hoy.p && Math.abs(hoy.p.lat - 41.901) < 0.001, 'hoy', 'HOY lee el punto guardado (en lugar del centro de la zona)')
  debe(/destination=41\.90\d*%2C12\.479\d*/.test(hoy.e ?? ''), 'hoy enlace', 'el enlace de «Cómo llegar» de HOY va a las coordenadas')

  /* — Un viaje de antes (sin punto) sigue igual — */
  await R(`R.useRouteStore.setState({ route: { ...route(), accommodationZone: 'centro', accommodationAddress: 'Via Cavour 12, Roma', accommodationPoint: undefined } }); return true`)
  await a.esp(1200)
  const viejo = await ev(`(() => { const b = document.querySelector('[data-blk="aloj"]'); return { mapa: Boolean(b.querySelector('[data-alojamiento-mapa-tarjeta]')), dirs: Array.from(b.querySelectorAll('[data-direccion-tarjeta]')).map((x) => x.textContent.trim()), href: b.querySelector('[data-como-llegar-alojamiento]')?.getAttribute('href') ?? '' } })()`)
  const hoyViejo = await R(`return { p: D.puntoDelAlojamiento(route()), e: D.enlaceComoLlegarAlojamiento(D.direccionDelAlojamiento(route()), route().destination, null) }`)
  debe(!viejo.mapa && viejo.dirs.length === 1 && viejo.dirs[0] === 'Via Cavour 12, Roma', 'viejo tarjeta', `sin punto: la tarjeta de siempre, con su dirección en texto (${JSON.stringify(viejo.dirs)})`)
  debe(/destination=Via\+Cavour\+12%2C\+Roma/.test(viejo.href) && hoyViejo.p === null && /destination=Via\+Cavour/.test(hoyViejo.e ?? ''), 'viejo enlace', `sin punto: «Cómo llegar» va a la dirección en texto como antes y HOY usa la zona (${viejo.href})`)
  // La hoja de un viaje de antes: botón + campo de texto con la dirección escrita.
  await ev(`import('/src/store/useAlojamientoUi.ts').then((m) => m.useAlojamientoUi.getState().abrirTuAlojamiento(${JSON.stringify(base.dia)})).then(() => true)`)
  await a.esp(1500)
  const hojaVieja = await ev(`(() => ({ boton: Boolean(document.querySelector('[data-alojamiento-poner-en-mapa]')), texto: document.querySelector('[data-alojamiento-direccion]')?.value ?? null }))()`)
  debe(hojaVieja.boton && hojaVieja.texto === 'Via Cavour 12, Roma', 'viejo hoja', `la hoja de un viaje de antes: el botón nuevo y la dirección escrita sigue en su campo (${JSON.stringify(hojaVieja)})`)
  await ev("document.querySelector('[role=dialog] button[aria-label=Cerrar]')?.click(); true")
} finally {
  a.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
