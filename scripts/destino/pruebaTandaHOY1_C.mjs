// La prueba de la Tanda HOY1, agente C: los avisos del tiempo en directo (H12, C14, C15), sin internet (H15) y los ajustes (C27).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY1_C.mjs
// Partes: 0 = datos, servidor del tiempo y service worker (sin navegador), 1 = lo que se lee en el código, 2 = navegador (UN Chrome por la cola: Lanzarote con previsión de mentira inyectada, Roma, sin internet y Ajustes).
//   Solo una parte: `parte=0`, `parte=1`, `parte=2` (o `solo=tiempo|sinred|ajustes|roma`). Con `capturas=0` no saca capturas.
// Formato del final: «N comprobaciones · M fallos».
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const arg = (k, d) => process.argv.find((a) => a.startsWith(k + '='))?.slice(k.length + 1) ?? d
const PARTE = arg('parte', 'todas')
const SOLO = arg('solo', '')
const CAPTURAS = arg('capturas', '1') !== '0'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log('✗', texto)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/* ───────────────────────── 0. Datos, servidor del tiempo y service worker (sin navegador) ───────────────────────── */
if (PARTE === 'todas' || PARTE === '0') {
  const d = JSON.parse(leer('data/hoy/avisos_tiempo.json'))
  const u = d.umbrales
  debe(u.lluvia.probabilidad_pct === 50 && u.lluvia.mm_por_hora === 0.5, 'umbrales: la lluvia usa las mismas cifras de siempre (50 % o 0,5 mm)')
  debe(u.nubes.nubes_bajas_pct === 80, 'umbrales: nubes bajas ≥ 80 %')
  debe(u.viento.rachas_kmh === 55, 'umbrales: rachas de viento ≥ 55 km/h')
  debe(u.ha_parado.horas_seguidas === 2 && u.ha_parado.probabilidad_pct_menos_de < u.lluvia.probabilidad_pct && u.ha_parado.mm_por_hora_menos_de < u.lluvia.mm_por_hora, 'umbrales: «ha parado» exige menos que «empieza» (histéresis) durante 2 horas')
  for (const k of ['lluvia', 'ha_parado', 'nubes', 'viento']) debe(typeof u[k]._por_que === 'string' && u[k]._por_que.length > 30, `umbrales.${k}: lleva escrito el porqué`)

  // Los sitios de los datos existen de verdad en el catálogo de Lanzarote.
  const lz = JSON.parse(leer('data/pipeline_v2/lanzarote.json'))
  const nombres = lz.places.map((p) => norm(p.name))
  const coord = (n) => lz.places.find((p) => norm(p.name).includes(n))?.coordinates
  const claves = [...d.lanzarote.miradores_de_nubes.map((m) => m.clave), ...d.lanzarote.sitios_de_viento.map((m) => m.clave), ...d.lanzarote.a_cubierto.map((m) => m.clave)]
  for (const c of claves) debe(nombres.some((n) => n.includes(c)) || c === 'famara' || c === 'casa-museo del campesino', `datos: «${c}» existe en el catálogo de Lanzarote`)
  for (const c of d.lanzarote.a_cubierto) {
    const cc = coord(c.clave === 'fundacion cesar manrique' ? 'fundacion' : c.clave === 'casa-museo del campesino' ? 'campesino' : c.clave)
    debe(cc && Math.abs(cc[0] - c.lat) < 0.01 && Math.abs(cc[1] - c.lng) < 0.01, `datos: «${c.nombre}» tiene las coordenadas del catálogo`)
  }
  debe(['cueva de los verdes', 'jameos del agua', 'fundacion cesar manrique', 'casa-museo del campesino', 'castillo de san jose'].every((c) => d.lanzarote.a_cubierto.some((x) => x.clave === c)), 'datos: los 5 sitios a cubierto que pide Eric (Cueva de los Verdes, Jameos, Fundación, el Campesino, Castillo de San José)')
  debe(['mirador del rio', 'guinate', 'bosquecillo', 'ermita de las nieves'].every((c) => d.lanzarote.miradores_de_nubes.some((x) => x.clave.includes(c))), 'datos: los 4 miradores del norte que pide Eric (Río, Guinate, Bosquecillo, Ermita de las Nieves)')
  debe(['grietas', 'hervideros', 'famara'].every((c) => d.lanzarote.sitios_de_viento.some((x) => x.clave.includes(c))), 'datos: viento en Las Grietas, Los Hervideros y los miradores de Famara')
  debe(!/Roma|Fontana|Pante[oó]n|Trastevere|Vaticano/.test(JSON.stringify(d.lanzarote.textos)), 'datos: los textos de Lanzarote no llevan nombres de Roma')

  // El servidor del tiempo: ahora también pide y devuelve nubes bajas y rachas.
  const { tiempoPorHoras } = await import('../../server/tiempo.js')
  let urlPedida = ''
  const pedir = async (url) => {
    urlPedida = url
    const time = Array.from({ length: 24 }, (_, h) => `2031-05-05T${String(h).padStart(2, '0')}:00`)
    return { ok: true, json: async () => ({ hourly: { time, precipitation_probability: time.map((_, h) => h), precipitation: time.map(() => 0), cloud_cover_low: time.map((_, h) => 100 - h), wind_gusts_10m: time.map((_, h) => h * 3) } }) }
  }
  const { value } = await tiempoPorHoras({ lat: 29.01, lng: -13.51 }, '2031-05-05', pedir)
  debe(/cloud_cover_low/.test(urlPedida) && /wind_gusts_10m/.test(urlPedida), 'servidor: le pide a Open-Meteo las nubes bajas (cloud_cover_low) y las rachas (wind_gusts_10m)')
  debe(value && value.cloud.length === 24 && value.cloud[0] === 100 && value.gust[10] === 30 && value.probability[7] === 7, 'servidor: devuelve cloud[24] y gust[24] junto a probability y precipitation, cada una en su hora')

  // El service worker: guarda la web, nunca los datos.
  const prepararSw = (hostname, search = '') => {
    const escuchas = {}
    const cajas = new Map()
    const self = { location: { hostname, origin: `https://${hostname}`, search }, addEventListener: (n, f) => (escuchas[n] = f), skipWaiting() {}, clients: { claim: async () => {} } }
    vm.runInNewContext(leer('public/sw.js'), { self, caches: { keys: async () => [], delete: async () => true, open: async () => ({ match: async () => undefined, put: async (k, v) => cajas.set(k, v) }), match: async () => undefined }, fetch: async () => ({}), Response: { error: () => ({}) }, URL, console })
    return { self, escuchas }
  }
  const { self: sw, escuchas } = prepararSw('trazo.app')
  const q = (url, mode = 'cors', method = 'GET') => sw.queHacerConUnaPeticion(new URL(url), { method, mode }, 'https://trazo.app')
  debe(q('https://trazo.app/') === null && q('https://trazo.app/', 'navigate') === 'pagina', 'sw: la página (navegación) se guarda con «red primero»')
  debe(q('https://trazo.app/assets/index-abc123.js') === 'activo', 'sw: el código con nombre único (/assets/) se guarda y no se vuelve a pedir')
  debe(q('https://trazo.app/icons/icon-192.png') === 'fuente' && q('https://trazo.app/fotos/roma/x.jpg?v=ab12cd34') === 'activo' && q('https://trazo.app/fotos/roma/x.jpg') === 'foto', 'sw: iconos, copia primero y se renuevan por detrás; fotos propias con ?v= copia primero, sin versión red primero (ARREGLO_FOTOS_VIAJE)')
  debe(q('https://fonts.googleapis.com/css2?family=Geist') === 'fuente' && q('https://fonts.gstatic.com/s/geist.woff2') === 'fuente', 'sw: las fuentes de Google se guardan')
  debe(q('https://trazo.app/api/tiempo/horas?lat=1') === null && q('https://trazo.app/api/place-detail', 'cors', 'POST') === null, 'sw: NUNCA toca /api/ (ni GET ni POST)')
  debe(q('https://abc.supabase.co/rest/v1/trips') === null && q('https://api.mapbox.com/styles/v1/x') === null, 'sw: nunca guarda la nube (Supabase) ni Mapbox')
  debe(q('https://trazo.app/assets/a.js', 'cors', 'POST') === null, 'sw: solo GET')
  debe(typeof escuchas.install === 'function' && typeof escuchas.activate === 'function' && typeof escuchas.fetch === 'function' && typeof escuchas.push === 'function' && typeof escuchas.notificationclick === 'function', 'sw: siguen los avisos al móvil (push y clic) y el instalar')
  let respondio = false
  escuchas.fetch({ request: { url: 'https://trazo.app/assets/a.js', method: 'GET', mode: 'cors' }, respondWith: () => (respondio = true) })
  debe(respondio, 'sw: en producción, un /assets/ responde desde el service worker')
  const local = prepararSw('localhost')
  let respondioLocal = false
  local.escuchas.fetch({ request: { url: 'https://localhost/assets/a.js', method: 'GET', mode: 'cors' }, respondWith: () => (respondioLocal = true) })
  debe(!respondioLocal, 'sw: en localhost no guarda nada (el servidor de desarrollo cambia a cada rato)')
}

/* ───────────────────────── 1. Lo que se lee en el código ───────────────────────── */
if (PARTE === 'todas' || PARTE === '1') {
  const lib = sinComentarios(leer('src/lib/avisosDelTiempo.ts'))
  debe(/avisos_tiempo\.json/.test(lib) && !/>=\s*\d{2}|>\s*\d{2}\b|=== \d{2}\b/.test(lib.replace(/Math\.floor\(\w+ \/ 60\)/g, '').replace(/h >= 14/g, '').replace(/h > 23/g, '')), 'avisosDelTiempo.ts: lee los umbrales del archivo de datos y no lleva cifras de umbral escondidas (solo la frontera de las 14:00 de la mañana y la tarde, la de siempre)')
  debe(/hasRealCoordinates|isNumberedStop/.test(lib) && /reservedId/.test(lib), 'avisosDelTiempo.ts: cuenta solo paradas con número y no toca las que tienen reserva')
  debe(/volverAlPlan/.test(lib) && /checkedInAt/.test(lib.slice(lib.indexOf('export function volverAlPlan'))), 'avisosDelTiempo.ts: el [Deshacer] conserva lo que ya se ha visto')
  const comp = sinComentarios(leer('src/components/route/hoy/AvisosDelTiempo.tsx'))
  debe(/applyAdjustedDay/.test(comp) && !/useEffect\([^]*applyAdjustedDay[^]*\[\s*meteo/.test(comp), 'AvisosDelTiempo: el día solo cambia al tocar [Cambiar…] (nada se mueve solo)')
  debe(/data-deshacer-tiempo/.test(comp) && /data-ver-plan/.test(comp) && /Ver alternativa/.test(comp) && /HojaPropuesta/.test(comp), 'AvisosDelTiempo: [Ver alternativa] y 32b [Ver plan] abren una propuesta (HOY2 C; antes C14/C15 con [Cambiar al plan de lluvia], [Volver al plan], [Seguir así] y [Seguir igual]), y [Deshacer]')
  const hoy = leer('src/components/route/hoy/v2/HoyDuranteV2.tsx')
  // HOY2 (C, 5-nov): antes → ahora → decisión de Eric: `<AvisosDelTiempo route day dateIso />` → lleva además `ubicacion` y `enCoche` (para la propuesta del plan de lluvia).
  debe(/<AvisosDelTiempo route=\{route\} day=\{day\} dateIso=\{dateIso\}[^>]*\/>/.test(hoy) && /<SinConexionHoy route=\{route\} day=\{day\} dateIso=\{dateIso\} \/>/.test(hoy), 'HoyDuranteV2: enganchados los avisos del tiempo y la línea sin conexión (una línea cada uno)')
  // HOY2 (5-nov): antes → ahora → decisión de Eric: los avisos iban entre «Parada X de Y» y la tarjeta (`{alertas}` iba debajo) → ahora van en la zona de avisos (`ZonaDeAvisos`), debajo de la cabecera y ENCIMA de la tarjeta principal (`{principal}`), con su X y como mucho 2 a la vista.
  debe(hoy.indexOf('<AvisosDelTiempo') < hoy.indexOf('{principal}'), 'HoyDuranteV2: los avisos del tiempo van ARRIBA, antes de la tarjeta (H12)')
  debe(/enLanzarote/.test(leer('src/components/route/today/RainAlert.tsx')), 'RainAlert: en Lanzarote no sale (para que no haya dos avisos de lluvia)')
  const trip = leer('src/components/sync/TripSync.tsx')
  debe(/abrirDesdeElMovil/.test(trip) && /navigator\.onLine === false/.test(trip) && /reconectar/.test(trip), 'TripSync: sin red abre con lo guardado en el móvil, y al volver la conexión se reconecta')
  const sin = sinComentarios(leer('src/lib/sinConexion.ts'))
  debe(/indexedDB/.test(sin) && /fetchPlaceDetail/.test(sin) && !/\/api\//.test(sin), 'sinConexion.ts: la ruta en IndexedDB y las fichas con la caché de siempre')
  const aj = leer('src/components/ajustes/AjustesScreen.tsx')
  debe(/Sonido de los momentos/.test(aj) && /Avisos en el móvil/.test(aj) && /Sugerencias del compañero/.test(aj), 'Ajustes: las tres filas de C27')
  debe(/ponerSugerenciasDelCompanero/.test(aj) && /sugerenciasDelCompanero\(\)/.test(leer('src/components/route/hoy/AvisosDeCerca.tsx')), 'Ajustes: el interruptor cambia el valor que lee AvisosDeCerca (juego y fuera de ruta)')
  const pos = (t) => aj.indexOf(`titulo="${t}"`)
  debe(pos('Sonido de los momentos') > 0 && pos('Avisos en el móvil') > pos('Sonido de los momentos') && pos('Sugerencias del compañero') > pos('Avisos en el móvil'), 'Ajustes: el orden de Design (Sonido · Avisos · Sugerencias)')
}

/* ───────────────────────── 2. Navegador ───────────────────────── */
if (PARTE === 'todas' || PARTE === '2') {
  const { abrirApp } = await import('./_enLaApp.mjs')
  const APP = process.env.APP_URL ?? 'http://localhost:5173'
  const RUTA = '/?cuentas=off&logros=off&apertura=0&version=completa&hoy2=on'
  const por = (fn) => Array.from({ length: 24 }, (_, h) => fn(h))
  const SECO = { probability: por(() => 0), precipitation: por(() => 0), cloud: por(() => 10), gust: por(() => 15) }
  const cap = async (a, nombre) => {
    if (CAPTURAS) await a.captura(path.join(SALIDA, `hoy1_${nombre}.jpg`))
  }

  const abrir = async (destino, hoy, { ruta = RUTA } = {}) => {
    const a = await abrirApp(APP, { ruta, ancho: 390, alto: 844 })
    const ev = (js) => a.evaluar(js)
    const fn = destino === 'lanzarote' ? '__rutaLanzarote' : '__rutaPrueba'
    await a.hasta(`typeof window.${fn} === 'function'`, { segundos: 240, lanzar: 'no está la ruta de prueba' })
    await ev("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:hoy')) localStorage.removeItem(k); return true })()")
    await ev(`window.__hoy1Tiempo = ${JSON.stringify(SECO)}; window.__hoy1HoraLocal = 12; true`)
    await ev(destino === 'lanzarote' ? `window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '${hoy}' }).then(() => true)` : `Promise.resolve(window.__rutaPrueba()).then(() => true)`)
    await a.esp(2500)
    await ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ dev_simulated_today_iso: '${hoy}' }); R.useRouteStore.getState().setMode('today'); return true })()`)
    await a.hasta("Boolean(document.querySelector('[data-hoy]'))", { segundos: 40, lanzar: 'no sale HOY' })
    await a.esp(1800)
    return { a, ev }
  }
  const poner = async ({ a, ev }, meteo, hora = 12) => {
    await ev(`window.__hoy1HoraLocal = ${hora}; window.__hoy1Tiempo = ${JSON.stringify({ ...SECO, ...meteo })}; window.dispatchEvent(new Event('hoy1-tiempo')); true`)
    await a.esp(700)
  }
  const hay = (ev, sel) => ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const texto = (ev, sel) => ev(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ').trim()`)
  const clic = (ev, sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
  const dia = (ev, n) =>
    ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const d = R.useRouteStore.getState().route.days.find((x) => x.dayNumber === ${n}); return { id: d.id, backup: Boolean(d.rainBackup), motivo: d.rainBackup?.motivo ?? null, stops: d.stops.map((s) => ({ id: s.id, t: s.time, n: s.name, r: Boolean(s.reservedId), v: Boolean(s.checkedInAt) })) } })()`)
  const marcarVista = (ev, n, nombre, vista = true) =>
    ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState((s) => ({ route: { ...s.route, days: s.route.days.map((d) => d.dayNumber !== ${n} ? d : { ...d, stops: d.stops.map((x) => x.name === ${JSON.stringify(nombre)} ? { ...x, checkedInAt: ${vista ? "'2026-11-09T10:00:00Z'" : 'null'} } : x) }) } })); return true })()`)
  const NOMBRES_DE_ROMA = /Roma|Fontana|Pante[oó]n|Trastevere|Vaticano|Nasoni|Coliseo/
  const lluviaTarde = { probability: por((h) => (h >= 14 && h <= 19 ? 90 : 0)), precipitation: por((h) => (h >= 14 && h <= 19 ? 1.2 : 0)) }

  if (!SOLO || SOLO === 'tiempo') {
    // ── Lanzarote, lunes 9: Jameos 10:00, Cueva 11:30, Mirador del Río 12:44, Haría 15:09, Casa-Museo Manrique 16:14, Helechos 17:30
    const e = await abrir('lanzarote', '2026-11-09')
    const { a, ev } = e
    try {
      // La lógica pura, con las cifras justo en el borde
      await ev(`(async () => { window.__av = await import('/src/lib/avisosDelTiempo.ts'); return true })()`)
      const borde = await ev(`(() => { const A = window.__av; const m = (o) => ({ probability: Array(24).fill(0), precipitation: Array(24).fill(0), cloud: Array(24).fill(0), gust: Array(24).fill(0), ...o }); const un = (k, v) => { const a = Array(24).fill(0); a[10] = v; return m({ [k]: a }) }; return { l49: A.llueveEnHora(un('probability', 49), 10), l50: A.llueveEnHora(un('probability', 50), 10), mm: A.llueveEnHora(un('precipitation', 0.5), 10), mm4: A.llueveEnHora(un('precipitation', 0.4), 10), n79: A.hayNubesEnHora(un('cloud', 79), 10), n80: A.hayNubesEnHora(un('cloud', 80), 10), v54: A.hayVientoEnHora(un('gust', 54), 10), v55: A.hayVientoEnHora(un('gust', 55), 10), p0: A.haParadoDeLlover(m({}), 10), p1: A.haParadoDeLlover(m({ probability: Object.assign(Array(24).fill(0), { 8: 90, 11: 40 }) }), 10), p2: A.haParadoDeLlover(m({ probability: Object.assign(Array(24).fill(0), { 8: 90 }) }), 10), p3: A.haParadoDeLlover(m({ probability: Object.assign(Array(24).fill(0), { 8: 90 }), precipitation: Object.assign(Array(24).fill(0), { 11: 0.2 }) }), 10), p4: A.haParadoDeLlover(m({ probability: Object.assign(Array(24).fill(0), { 5: 90 }) }), 10) } })()`)
      debe(!borde.l49 && borde.l50 && borde.mm && !borde.mm4, 'umbral lluvia: 49 % no, 50 % sí; 0,5 mm sí, 0,4 mm no')
      debe(!borde.n79 && borde.n80, 'umbral nubes: 79 % no, 80 % sí')
      debe(!borde.v54 && borde.v55, 'umbral viento: 54 km/h no, 55 km/h sí')
      debe(!borde.p0 && !borde.p1 && borde.p2 && !borde.p3 && !borde.p4, 'C15 «ha parado»: solo si llovió en las 3 horas de antes y esta hora y la siguiente quedan secas (sin lluvia antes: no; 40 % la hora siguiente: no; 0,2 mm la siguiente: no; llovió hace 5 horas: no)')

      debe(!(await hay(ev, '[data-aviso-tiempo]')), 'lanzarote: con el cielo despejado no sale ningún aviso del tiempo')

      // ── Lluvia (H12 → C14)
      const antes = await dia(ev, 2)
      await poner(e, lluviaTarde, 12)
      debe(await hay(ev, '[data-aviso-tiempo=lluvia]'), 'lanzarote: llueve esta tarde → sale el aviso de lluvia')
      const cartel = await texto(ev, '[data-aviso-tiempo=lluvia]')
      debe(/Va a llover esta tarde: .+, a cubierto\./.test(cartel) && /Ver alternativa/.test(cartel), `lanzarote: H12 «Va a llover esta tarde: …, a cubierto.» + [Ver alternativa] (sale «${cartel}»)`)
      debe(!/Jameos|Cueva de los Verdes/.test(cartel.replace('Ver alternativa', '')), 'lanzarote: no propone sitios que ya están en el día (Jameos, Cueva)')
      debe(!NOMBRES_DE_ROMA.test(cartel), 'lanzarote: el aviso de lluvia no lleva nombres de Roma')
      debe(!(await hay(ev, '[data-cambiar-hoja=propuesta]')), 'lanzarote: la alternativa no se ve hasta tocar [Ver alternativa]')
      await cap(a, 'lanzarote_h12_lluvia')
      await clic(ev, '[data-ver-alternativa]')
      await a.esp(500)
      // HOY2 (C, 5-nov): antes → ahora → decisión de Eric: la pantalla C14 con «Entra» y «Sale» → «Plan de lluvia» con el formato común (Cambia: X sale; entra Y / Se mantiene…).
      debe(await hay(ev, '[data-cambiar-hoja=propuesta][data-propuesta-tipo=lluvia]'), 'lanzarote: 32 — «Plan de lluvia» con Cambia y Se mantiene')
      const sale = await texto(ev, '[data-propuesta=cambia]')
      const entra = sale
      debe(/Haría/.test(sale) && !/Casa-Museo César Manrique/.test(sale) && !/Valle de las Mil Palmeras/.test(sale), `lanzarote: C14 «Sale» las paradas al aire libre con lluvia (Haría…), no el museo (sale «${sale}»)`)
      debe(/Fundación|Campesino|Castillo/.test(entra), `lanzarote: C14 «Entra» un sitio a cubierto cerca (sale «${entra}»)`)
      debe(/Aplicar/.test(await texto(ev, '[data-cambiar-hoja=propuesta]')) && /Ver otra opción/.test(await texto(ev, '[data-cambiar-hoja=propuesta]')) && /Volver a mi ruta original/.test(await texto(ev, '[data-cambiar-hoja=propuesta]')), 'lanzarote: 32 [Aplicar] · [Ver otra opción] (hoy toca descansar) · «Volver a mi ruta original»')
      debe(JSON.stringify((await dia(ev, 2)).stops) === JSON.stringify(antes.stops), 'lanzarote: ver la alternativa NO cambia el día (nada se mueve solo)')
      await cap(a, 'lanzarote_c14_alternativa')
      await clic(ev, '[data-propuesta-aplicar]')
      await a.esp(900)
      const despues = await dia(ev, 2)
      debe(despues.backup && despues.motivo === 'lluvia', 'lanzarote: [Cambiar al plan de lluvia] guarda la copia del día (motivo lluvia)')
      debe(!despues.stops.some((s) => /^Haría y el Valle/.test(s.n)) && despues.stops.some((s) => /Fundación|Campesino|Castillo/.test(s.n)), 'lanzarote: sale Haría y entra el sitio a cubierto')
      debe(despues.stops.length === antes.stops.length, 'lanzarote: el día no crece ni se encoge (uno por uno)')
      debe(antes.stops.filter((s) => s.r).every((s) => despues.stops.some((x) => x.id === s.id)), 'lanzarote: las paradas con reserva no se tocan')
      debe(despues.stops.filter((s) => /Jameos|Cueva|Mirador del Río|Manrique|Helechos/.test(s.n)).length === 5, 'lanzarote: el resto del día se queda como estaba')
      debe(await hay(ev, '[data-tiempo-cambiado=lluvia]'), 'lanzarote: tras el cambio sale el aviso con [Deshacer]')
      await cap(a, 'lanzarote_c14_cambiado')
      await clic(ev, '[data-deshacer-tiempo]')
      await a.esp(700)
      const vuelta = await dia(ev, 2)
      debe(JSON.stringify(vuelta.stops) === JSON.stringify(antes.stops) && !vuelta.backup, 'lanzarote: [Deshacer] deja el día EXACTAMENTE como estaba')

      // ── C15: ha parado de llover
      await poner(e, lluviaTarde, 12)
      await clic(ev, '[data-ver-alternativa]')
      await a.esp(300)
      await clic(ev, '[data-propuesta-aplicar]')
      await a.esp(700)
      await poner(e, lluviaTarde, 12)
      debe(!(await hay(ev, '[data-ha-parado-de-llover]')) && (await hay(ev, '[data-tiempo-cambiado=lluvia]')), 'lanzarote: con el plan de lluvia y SIN haber llovido todavía, C15 no sale (sigue el [Deshacer])')
      const llovioA = { probability: por((h) => (h === 13 || h === 14 ? 90 : 0)), precipitation: por(() => 0) }
      await poner(e, llovioA, 16)
      debe(await hay(ev, '[data-ha-parado-de-llover]'), 'lanzarote: usando el plan de lluvia, si llovió y deja de llover sale C15 «Ha parado de llover»')
      const c15 = await texto(ev, '[data-ha-parado-de-llover]')
      debe(/Ha parado de llover/.test(c15) && /Ver plan/.test(c15), 'lanzarote: 32b «Ha parado de llover.» + [Ver plan] (HOY2 C; antes C15 llevaba «¿Volvemos al plan de antes?» + [Volver al plan] [Seguir así])')
      await cap(a, 'lanzarote_c15_ha_parado')
      await poner(e, { probability: por((h) => (h === 13 || h === 14 ? 90 : h === 17 ? 60 : 0)), precipitation: por(() => 0) }, 16)
      debe(!(await hay(ev, '[data-ha-parado-de-llover]')) && (await hay(ev, '[data-tiempo-cambiado]')), 'lanzarote: si va a volver a llover en la hora siguiente, C15 no sale (sigue el [Deshacer])')
      await poner(e, llovioA, 16)
      await marcarVista(ev, 2, 'Jameos del Agua')
      // HOY2 (C): antes [Volver al plan] volvía de golpe → ahora [Ver plan] abre «¿Volvemos al plan?» y vuelve con [Aplicar]
      await clic(ev, '[data-ver-plan]')
      await a.esp(500)
      await clic(ev, '[data-propuesta-aplicar]')
      await a.esp(700)
      const vuelto = await dia(ev, 2)
      debe(!vuelto.backup && vuelto.stops.map((s) => s.n).join('|') === antes.stops.map((s) => s.n).join('|') && vuelto.stops.find((s) => s.n === 'Jameos del Agua').v === true, 'lanzarote: [Volver al plan] restaura el plan de antes y conserva lo ya visto')
      // «Seguir así»
      await marcarVista(ev, 2, 'Jameos del Agua', false)
      await poner(e, lluviaTarde, 12)
      await clic(ev, '[data-ver-alternativa]')
      await a.esp(300)
      await clic(ev, '[data-propuesta-aplicar]')
      await a.esp(500)
      await poner(e, llovioA, 16)
      await clic(ev, '[data-ha-parado-de-llover] [data-hoy-aviso-x]')
      await a.esp(500)
      debe(!(await hay(ev, '[data-ha-parado-de-llover]')) && (await dia(ev, 2)).backup, 'lanzarote: [Seguir así] quita C15 y se queda el plan de lluvia (con su [Deshacer])')
      await clic(ev, '[data-deshacer-tiempo]')
      await a.esp(500)

      // «Hoy toca descansar»
      await ev("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:hoy1:tiempo')) localStorage.removeItem(k); return true })()")
      await poner(e, lluviaTarde, 12)
      await clic(ev, '[data-ver-alternativa]')
      await a.esp(300)
      await clic(ev, '[data-propuesta-otra]')
      await a.esp(300)
      await clic(ev, '[data-propuesta-aplicar]')
      await a.esp(700)
      const desc = await dia(ev, 2)
      debe(desc.backup && desc.motivo === 'descansar' && desc.stops.length < antes.stops.length && !desc.stops.some((s) => /^Haría y el Valle/.test(s.n)) && desc.stops.some((s) => /Jameos/.test(s.n)), 'lanzarote: «Hoy toca descansar» quita lo que queda al aire libre con lluvia y deja lo demás')
      debe(/Hoy toca descansar/.test(await texto(ev, '[data-tiempo-cambiado]')), 'lanzarote: «Hoy toca descansar» lleva su aviso con [Deshacer]')
      await clic(ev, '[data-deshacer-tiempo]')
      await a.esp(500)
      debe(JSON.stringify((await dia(ev, 2)).stops) === JSON.stringify(antes.stops), 'lanzarote: [Deshacer] de «Hoy toca descansar» también deja todo como estaba')

      // ── Nubes en el norte sobre el Mirador del Río (12:44)
      await ev("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:hoy1:tiempo')) localStorage.removeItem(k); return true })()")
      await poner(e, { cloud: por((h) => (h >= 12 && h <= 13 ? 95 : 10)) }, 11)
      debe(await hay(ev, '[data-aviso-tiempo=nubes]'), 'lanzarote: nubes bajas ≥ 80 % a las 12-13 h sobre el Mirador del Río → aviso de nubes')
      const nubes = await texto(ev, '[data-aviso-tiempo=nubes]')
      debe(/Hay nubes en el norte: cambiamos Mirador del Río por Mirador de Guinate\./.test(nubes), `lanzarote: si solo está tapado el Río, propone Guinate (sale «${nubes}»)`)
      await cap(a, 'lanzarote_h12_nubes')
      await clic(ev, '[data-ver-alternativa]')
      await a.esp(300)
      await cap(a, 'lanzarote_h12_nubes_alternativa')
      await clic(ev, '[data-propuesta-aplicar]')
      await a.esp(700)
      const conNubes = await dia(ev, 2)
      debe(conNubes.motivo === 'nubes' && conNubes.stops.some((s) => /Guinate/.test(s.n)) && !conNubes.stops.some((s) => /Mirador del Río/.test(s.n)), 'lanzarote: nubes → el Río se cambia por Guinate (con copia para [Deshacer])')
      await clic(ev, '[data-deshacer-tiempo]')
      await a.esp(500)
      debe(JSON.stringify((await dia(ev, 2)).stops) === JSON.stringify(antes.stops), 'lanzarote: [Deshacer] de las nubes deja el día como estaba')
      // sin nubes sobre el mirador (nubes por la tarde, el mirador va a las 12:44) → no hay aviso
      await ev("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:hoy1:tiempo')) localStorage.removeItem(k); return true })()")
      await poner(e, { cloud: por((h) => (h >= 16 ? 99 : 10)) }, 11)
      debe(!(await hay(ev, '[data-aviso-tiempo=nubes]')), 'lanzarote: nubes por la tarde, cuando el mirador es a las 12:44 → no avisa')
      // Guinate ya está en el día → la alternativa no es otro mirador
      await ev(`(async () => { window.__av = await import('/src/lib/avisosDelTiempo.ts'); return true })()`)
      const sinGuinate = await ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const A = window.__av; const d = JSON.parse(JSON.stringify(R.useRouteStore.getState().route.days.find((x) => x.dayNumber === 2))); d.stops.push({ ...d.stops[0], id: 'x-guinate', name: 'Mirador de Guinate', time: '12:00', durationMinutes: 20 }); const m = { probability: Array(24).fill(0), precipitation: Array(24).fill(0), cloud: Array(24).fill(95), gust: Array(24).fill(0) }; const av = A.calcularAvisos(d, m, true).find((x) => x.tipo === 'nubes'); return av ? { texto: av.texto, entra: av.entra.map((e) => e.nombre), salen: av.salen.length } : null })()`)
      debe(sinGuinate && sinGuinate.entra.length === 1 && !/Guinate|Mirador|Ermita|Bosquecillo/.test(sinGuinate.entra[0]), `lanzarote: con Río y Guinate tapados, el cambio no es otro mirador (propone ${sinGuinate?.entra})`)
      debe((await ev(`(() => { const A = window.__av; return A.calcularAvisos({ stops: [] }, { probability: Array(24).fill(100), precipitation: Array(24).fill(5), cloud: [], gust: [] }, false).length })()`)) === 0, 'fuera de Lanzarote, `calcularAvisos` no da nada (Roma sigue con el aviso de siempre)')

      // Una parada con reserva nunca se propone para salir
      const conReserva = await ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const A = window.__av; const d = JSON.parse(JSON.stringify(R.useRouteStore.getState().route.days.find((x) => x.dayNumber === 2))); d.stops = d.stops.map((s) => (/^Haría y el Valle/.test(s.name) ? { ...s, reservedId: 'r1' } : s)); const m = { probability: Array(24).fill(90), precipitation: Array(24).fill(2), cloud: [], gust: [] }; const av = A.calcularAvisos(d, m, true).find((x) => x.tipo === 'lluvia'); return av ? av.salen.map((s) => s.nombre) : [] })()`)
      debe(!conReserva.some((n) => /^Haría y el Valle/.test(n)), `lanzarote: una parada con reserva no sale nunca (salen ${conReserva.join(', ')})`)
    } finally {
      await a.cerrar()
    }

    // ── Viento en Los Hervideros (domingo 8, 15:12)
    const v = await abrir('lanzarote', '2026-11-08')
    try {
      const antesV = await dia(v.ev, 1)
      await poner(v, { gust: por((h) => (h >= 15 ? 70 : 20)) }, 11)
      debe(await hay(v.ev, '[data-aviso-tiempo=viento]'), 'lanzarote: rachas de 70 km/h a las 15 h con Los Hervideros en el día → aviso de viento')
      const tv = await texto(v.ev, '[data-aviso-tiempo=viento]')
      debe(/Viento fuerte en Los Hervideros/.test(tv) && !NOMBRES_DE_ROMA.test(tv), `lanzarote: «Viento fuerte en Los Hervideros…» (sale «${tv}»)`)
      await cap(v.a, 'lanzarote_h12_viento')
      await clic(v.ev, '[data-ver-alternativa]')
      await v.a.esp(300)
      await clic(v.ev, '[data-propuesta-aplicar]')
      await v.a.esp(600)
      const conViento = await dia(v.ev, 1)
      debe(conViento.motivo === 'viento' && !conViento.stops.some((s) => /Hervideros/.test(s.n)) && conViento.stops.length === antesV.stops.length, 'lanzarote: viento → cambia Los Hervideros por un sitio a resguardo (con copia)')
      await clic(v.ev, '[data-deshacer-tiempo]')
      await v.a.esp(500)
      debe(JSON.stringify((await dia(v.ev, 1)).stops) === JSON.stringify(antesV.stops), 'lanzarote: [Deshacer] del viento deja el día como estaba')
      await ev0(v, '[data-aviso-tiempo]')
      // viento por la mañana, cuando no hay ninguno de esos sitios: no avisa
      await v.ev("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:hoy1:tiempo')) localStorage.removeItem(k); return true })()")
      await poner(v, { gust: por((h) => (h <= 12 ? 90 : 20)) }, 9)
      debe(!(await hay(v.ev, '[data-aviso-tiempo=viento]')), 'lanzarote: viento de mañana, cuando las paradas con viento van por la tarde → no avisa')
    } finally {
      await v.a.cerrar()
    }
  }

  if (!SOLO || SOLO === 'roma') {
    const r = await abrir('roma', '2026-10-17')
    try {
      await poner(r, { ...lluviaTarde, cloud: por(() => 99), gust: por(() => 90) }, 11)
      debe(!(await hay(r.ev, '[data-aviso-tiempo]')), 'roma: los avisos del tiempo en directo son de Lanzarote; en Roma no sale ninguno (sigue el aviso de lluvia de siempre)')
      const sinLz = await ev0(r, 'body')
      debe(!/Cueva de los Verdes|Jameos|Hervideros|Famara/.test(sinLz), 'roma: ningún nombre de Lanzarote en HOY')
    } finally {
      await r.a.cerrar()
    }
  }

  if (!SOLO || SOLO === 'sinred') {
    const e = await abrir('lanzarote', '2026-11-09')
    const { a, ev } = e
    try {
      // Con red: se guarda la ruta del día y las fichas
      await a.esp(3500)
      const bd = await ev(`new Promise((r) => { const p = indexedDB.open('trazo-hoy-offline', 1); p.onerror = () => r(null); p.onsuccess = () => { const db = p.result; if (!db.objectStoreNames.contains('viajes')) return r(null); const q = db.transaction('viajes').objectStore('viajes').getAll(); q.onsuccess = () => r(q.result.map((g) => ({ id: g.id, dias: g.payload.route.days.length, desde: g.desde, hasta: g.hasta, paradas: g.payload.route.days.flatMap((d) => d.stops).length, destino: g.payload.route.destination }))); q.onerror = () => r(null) } })`)
      debe(Array.isArray(bd) && bd.length === 1 && bd[0].dias === 6 && bd[0].desde === '2026-11-08' && bd[0].hasta === '2026-11-13', `sin internet: la ruta del viaje queda guardada en el móvil (IndexedDB) con sus fechas (${JSON.stringify(bd)})`)
      const fichas = await ev("Object.keys(localStorage).filter((k) => k.startsWith('place-detail:v2:lanzarote')).length")
      debe(fichas >= 3, `sin internet: las fichas de las paradas de hoy quedan guardadas en el móvil (${fichas})`)
      const conHistoria = await ev("Object.keys(localStorage).filter((k) => k.startsWith('place-detail:v2:lanzarote')).filter((k) => { try { return JSON.parse(localStorage.getItem(k))?.historia } catch { return false } }).length")
      debe(conHistoria >= 1, `sin internet: …y el texto de las historias va dentro de la ficha (${conHistoria} con historia)`)
      debe(!(await hay(ev, '[data-sin-conexion]')), 'sin internet: con conexión la línea no sale')

      // Sin cobertura (el Chrome de prueba, sin red)
      await a.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
      await a.hasta("Boolean(document.querySelector('[data-sin-conexion]'))", { segundos: 15, lanzar: 'no sale «Sin conexión»' })
      const linea = await texto(ev, '[data-sin-conexion]')
      debe(linea === 'Sin conexión: lo de hoy está guardado en tu móvil.', `sin internet: H15 la línea «Sin conexión: lo de hoy está guardado en tu móvil.» (sale «${linea}»)`)
      debe((await ev("document.querySelector('[data-sin-conexion]').getAttribute('data-sin-conexion')")) === 'guardado', 'sin internet: la línea dice «guardado» solo porque lo está')
      debe(await hay(ev, '[data-hoy]') && /Parada/.test(await ev("document.body.innerText")), 'sin internet: HOY se sigue viendo (la ruta del día, «Parada X de Y»)')
      await cap(a, 'lanzarote_h15_sin_internet')
      // Se abre la ficha de una parada sin red: sale (viene del móvil)
      const ficha = await ev(`(async () => { const P = await import('/src/lib/placeDetailApi.ts'); const f = await P.fetchPlaceDetail('Lanzarote', 'Jameos del Agua'); return f ? { n: f.name, h: Boolean(f.historia) } : null })()`)
      debe(ficha && ficha.h, 'sin internet: la ficha de Jameos del Agua (con su historia) sale sin red')
      // La ruta guardada abre HOY igual: se lee del móvil y se vuelve a montar
      const ida = await ev(`(async () => { const S = await import('/src/lib/sinConexion.ts'); const R = await import('/src/store/useRouteStore.ts'); const g = await S.leerLoDeHoy('2026-11-09'); if (!g) return null; R.useRouteStore.getState().hydrateTrip(g.payload); R.useRouteStore.getState().setMode('today'); const r = R.useRouteStore.getState().route; return { dias: r.days.length, destino: r.destination, paradas: r.days.flatMap((d) => d.stops).length } })()`)
      debe(ida && ida.dias === 6 && ida.paradas === bd[0].paradas && ida.destino === bd[0].destino, `sin internet: lo guardado abre el viaje entero otra vez (${JSON.stringify(ida)})`)
      await a.esp(1200)
      debe(await hay(ev, '[data-hoy]'), 'sin internet: con la ruta recuperada del móvil, HOY se pinta')
      // Fuera de las fechas del viaje, no se abre
      const fuera = await ev(`(async () => { const S = await import('/src/lib/sinConexion.ts'); return { dentro: S.hoyCaeEnElViaje('2026-11-08', '2026-11-13', '2026-11-10'), gracia: S.hoyCaeEnElViaje('2026-11-08', '2026-11-13', '2026-11-15'), pasado: S.hoyCaeEnElViaje('2026-11-08', '2026-11-13', '2026-11-16'), antes: S.hoyCaeEnElViaje('2026-11-08', '2026-11-13', '2026-11-07'), sin: S.hoyCaeEnElViaje(null, null, '2026-11-10'), nada: await S.leerLoDeHoy('2030-01-01') } })()`)
      debe(fuera.dentro && fuera.gracia && !fuera.pasado && !fuera.antes && !fuera.sin && fuera.nada === null, 'sin internet: solo se abre el viaje al que pertenece hoy (con 2 días de gracia por detrás)')
      await a.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
      await a.hasta("!document.querySelector('[data-sin-conexion]')", { segundos: 15, lanzar: 'la línea no se va al volver la conexión' })
      debe(true, 'sin internet: al volver la conexión la línea se va')
      // Sin nada guardado, no se promete
      await ev("new Promise((r) => { const p = indexedDB.deleteDatabase('trazo-hoy-offline'); p.onsuccess = () => r(true); p.onerror = () => r(false); p.onblocked = () => r(true) })")
      await ev("(async () => { const R = await import('/src/store/useRouteStore.ts'); R.useRouteStore.setState({ mode: 'route' }); R.useRouteStore.setState({ mode: 'today' }); return true })()")
      await a.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
      await a.hasta("Boolean(document.querySelector('[data-sin-conexion]'))", { segundos: 15, lanzar: 'no sale la línea' })
      const t2 = await ev("document.querySelector('[data-sin-conexion]').getAttribute('data-sin-conexion')")
      debe(t2 === 'guardado' || t2 === 'sin-guardar', 'sin internet: la línea sale con o sin copia')
      await a.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
    } finally {
      await a.cerrar()
    }
  }

  if (!SOLO || SOLO === 'ajustes') {
    const e = await abrir('roma', '2026-10-17', { ruta: '/?cuentas=off&logrosDemo=1&apertura=0&version=completa&hoy2=on' })
    const { a, ev } = e
    try {
      await ev("(() => { localStorage.removeItem('trazo:ajuste:sugerencias-companero'); return true })()")
      // (Los avisos de «hemos preparado tu viaje» del modo demo se cierran para ver Ajustes.)
      for (let i = 0; i < 8; i++) {
        const cerrada = await ev("(() => { const b = [...document.querySelectorAll('button')].find((x) => /^(Siguiente|Entendido|Vale|Saltar todo|Seguir|Continuar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!cerrada) break
        await a.esp(700)
      }
      await ev("window.__ajustes.getState().abrir('ajustes'); true")
      await a.hasta("Boolean(document.querySelector('[data-ajuste=sugerencias-companero]'))", { segundos: 30, lanzar: 'no sale la fila «Sugerencias del compañero» en Ajustes' })
      const filas = await ev("[...document.querySelectorAll('[data-ajustes-pantalla] [data-ajuste]')].map((b) => b.getAttribute('data-ajuste'))")
      const i = (x) => filas.indexOf(x)
      debe(i('sonido') >= 0 && i('avisos-movil') > i('sonido') && i('sugerencias-companero') > i('avisos-movil'), `ajustes: C27 — Sonido de los momentos · Avisos en el móvil · Sugerencias del compañero, en ese orden (${filas.join(' · ')})`)
      const tx = await texto(ev, '[data-ajuste=sugerencias-companero]')
      debe(/Sugerencias del compañero/.test(tx) && !NOMBRES_DE_ROMA.test(tx.replace(/«Estás junto a…»/g, '')), 'ajustes: la fila lleva su nombre y una línea que explica lo que apaga')
      debe((await ev("document.querySelector('[data-ajuste=sugerencias-companero]').getAttribute('aria-checked')")) === 'true', 'ajustes: «Sugerencias del compañero» viene encendido')
      await cap(a, 'ajustes_c27')
      await clic(ev, '[data-ajuste=sugerencias-companero]')
      await a.esp(400)
      debe((await ev("localStorage.getItem('trazo:ajuste:sugerencias-companero')")) === '0' && (await ev("document.querySelector('[data-ajuste=sugerencias-companero]').getAttribute('aria-checked')")) === 'false', 'ajustes: apagarlo guarda el valor en el móvil (el que lee el juego y «fuera de ruta»)')
      const lee = await ev(`(async () => { const S = await import('/src/lib/sugerenciasCompanero.ts'); return S.sugerenciasDelCompanero() })()`)
      debe(lee === false, 'ajustes: `sugerenciasDelCompanero()` ya dice que no')
      await cap(a, 'ajustes_c27_apagado')
      await clic(ev, '[data-ajuste=sugerencias-companero]')
      await a.esp(300)
      debe((await ev("localStorage.getItem('trazo:ajuste:sugerencias-companero')")) === '1', 'ajustes: volver a encenderlo')
      const sonido0 = await ev("document.querySelector('[data-ajuste=sonido]').getAttribute('aria-checked')")
      await clic(ev, '[data-ajuste=sonido]')
      await a.esp(200)
      debe((await ev("document.querySelector('[data-ajuste=sonido]').getAttribute('aria-checked')")) !== sonido0, 'ajustes: «Sonido de los momentos» cambia')
      await clic(ev, '[data-ajuste=sonido]')
    } finally {
      await a.cerrar()
    }
  }

  // (ayudante: texto de un elemento; el `ev0` de arriba solo lee)
  function ev0({ ev }, sel) {
    return ev(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '')`)
  }
}

console.log(`${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length) {
  console.log('Fallos:\n' + fallos.map((f) => ' - ' + f).join('\n'))
  process.exitCode = 1
}
