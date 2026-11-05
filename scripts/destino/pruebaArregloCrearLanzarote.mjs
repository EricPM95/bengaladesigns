// La prueba del ARREGLO «no se puede crear un viaje a Lanzarote» (5-nov). Necesita la API con DESTINOS_OCULTOS='-' (Lanzarote visible, como para un administrador) y el Vite en 5173.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaArregloCrearLanzarote.mjs
import fs from 'node:fs'
import path from 'node:path'
const { abrirApp } = await import('./_enLaApp.mjs')
const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const API = process.env.API_URL ?? 'http://localhost:8787'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => { comprobaciones++; if (!cond) { fallos.push(texto); console.log(`✗ ${texto}`) } }
const leer = (f) => fs.readFileSync(f, 'utf8')
const ARQUETIPOS = new Set(['roadtrip_exclusivo', 'base_y_excursiones', 'urbano_clasico', 'multidestino_tren_o_vuelo', 'multidestino_mixto_o_circuito', 'expedicion_o_crucero'])

// ── 1. Todos los destinos curados llevan su clasificación (nunca Claude) ──
{
  const archivos = fs.readdirSync('data/pipeline_v2').filter((f) => f.endsWith('.json') && fs.existsSync(`data/dias/${f.replace('.json', '')}`))
  debe(archivos.includes('roma.json') && archivos.includes('lanzarote.json'), 'los destinos curados son al menos Roma y Lanzarote')
  for (const f of archivos) {
    const c = JSON.parse(leer(`data/pipeline_v2/${f}`)).destination_config?.classification
    debe(c && ARQUETIPOS.has(c.archetype) && typeof c.is_region === 'boolean', `${f}: lleva destination_config.classification con su arquetipo`)
  }
  const lz = JSON.parse(leer('data/pipeline_v2/lanzarote.json')).destination_config.classification
  debe(lz.archetype === 'base_y_excursiones' && lz.vehiculo_altamente_recomendado === true && lz.requiere_coche === false && lz.pase_dominante === null && lz.is_region === true, `Lanzarote: base_y_excursiones, coche muy recomendado (${JSON.stringify(lz)})`)
  const s = leer('server/index.js')
  debe(/curado\.destination_config\?\.medio === 'coche'/.test(s) && /AVISO: el destino curado/.test(s), 'el servidor tiene el valor por defecto de un destino curado sin clasificación, con su aviso en el log')
}

// ── 2. El servidor, de verdad: Lanzarote y Roma se clasifican SIN Claude ──
for (const [d, arq, veh] of [['Lanzarote', 'base_y_excursiones', true], ['Roma', 'urbano_clasico', false]]) {
  const r = await fetch(`${API}/api/classify-destination`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: d }) })
  const j = await r.json().catch(() => ({}))
  debe(r.status === 200 && j.archetype === arq && j.curated === true && j.ambiguous === false && j.vehiculo_altamente_recomendado === veh, `${d}: /api/classify-destination da ${arq} sin Claude (curated) y sin ambigüedad (${r.status} ${JSON.stringify(j)})`)
}

// ── 3. En el navegador ──
const a = await abrirApp(BASE, { ruta: '/?cuentas=off&logros=off&version=completa&apertura=0', ancho: 390, alto: 844, sinEsperarRuta: true })
try {
  const ev = (js) => a.evaluar(js)
  for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)

  // 3a. La cuenta viaja en cada llamada a /api (y solo ahí)
  const cab = await ev(`(async () => {
    const m = await import('/src/lib/fetchConCuenta.ts')
    const vistos = []
    const falso = async (entrada, init) => { vistos.push({ url: typeof entrada === 'string' ? entrada : entrada.url, auth: new Headers(init?.headers).get('Authorization') }); return new Response('{}') }
    const conToken = m.crearFetchConCuenta(falso, async () => 'TOKEN-DE-PRUEBA')
    const sinToken = m.crearFetchConCuenta(falso, async () => null)
    await conToken('/api/classify-destination', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    await conToken('/api/otra', { headers: { Authorization: 'Bearer PROPIO' } })
    await conToken('https://api.mapbox.com/algo')
    await conToken('/fotos/roma.jpg')
    await sinToken('/api/classify-destination', { method: 'POST' })
    return JSON.stringify(vistos)
  })()`)
  const v = JSON.parse(cab)
  debe(v[0].auth === 'Bearer TOKEN-DE-PRUEBA', 'una llamada a /api con sesión lleva «Authorization: Bearer …»')
  debe(v[1].auth === 'Bearer PROPIO', 'si la llamada ya trae su Authorization, no se pisa')
  debe(v[2].auth === null && v[3].auth === null, 'ni Mapbox ni las fotos propias llevan la sesión (solo /api/)')
  debe(v[4].auth === null, 'sin sesión, la llamada sale como antes')
  debe(/instalarFetchConCuenta\(\)/.test(leer('src/main.tsx')), 'main.tsx instala la cuenta en las llamadas')

  // 3b. El formulario de transporte: Lanzarote resuelve solo el coche
  const flujo = await ev(`(async () => {
    const m = await import('/src/components/trazo/vehicleFlow.ts')
    const base = { archetype: 'base_y_excursiones', optionId: 'flight', destinationName: 'Lanzarote', requiereCoche: false, paseDominante: null, camperOk: false, vehicle_type: null, vehicle_ownership: null, vehicle_resolved: false, travel_mode: null, travel_pass_confirmed: null }
    const lz = m.followUp(base)
    const hecho = m.followUp({ ...base, vehicle_type: 'car', vehicle_ownership: 'rental', vehicle_resolved: true, travel_mode: 'base_fija' })
    const otro = m.followUp({ ...base, destinationName: 'Tenerife' })
    return JSON.stringify({ lz: { pregunta: lz.question, auto: lz.auto }, hecho: { pregunta: hecho.question, tarjetas: hecho.cards.map((c) => c.value) }, tenerife: { pregunta: otro.question?.title ?? null } })
  })()`)
  const f = JSON.parse(flujo)
  debe(f.lz.pregunta === null && f.lz.auto && f.lz.auto.vehicle_ownership === 'rental' && f.lz.auto.vehicle_type === 'car' && f.lz.auto.vehicle_resolved === true && f.lz.auto.travel_mode === 'base_fija', `Lanzarote en avión: coche de alquiler, base fija, sin preguntar nada (${JSON.stringify(f.lz)})`)
  debe(f.hecho.pregunta === null && f.hecho.tarjetas.includes('Coche de alquiler'), 'resuelto, sale la tarjeta «Coche de alquiler» y ninguna pregunta')
  debe(/alquilar un vehículo/i.test(f.tenerife.pregunta ?? ''), 'otro destino base_y_excursiones (Tenerife) sigue preguntando «¿Te gustaría alquilar un vehículo?»')

  // 3c. El formulario de verdad, hasta el paso del transporte, desde Barcelona y desde Madrid
  for (const origen of ['Barcelona', 'Madrid']) {
    await ev('location.href = "/?cuentas=off&logros=off&version=completa&apertura=0"; true').catch(() => {})
    await a.esp(2500)
    for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-campo-destino]'))").catch(() => false)); i++) await a.esp(500)
    await ev("document.querySelector('[data-campo-destino]').focus()")
    await a.esp(1500)
    const hay = await ev("Boolean(document.querySelector('[data-destino-card=\"Lanzarote\"]'))")
    debe(hay, `${origen}: Lanzarote sale entre los destinos (administrador)`)
    if (!hay) continue
    await ev("(() => { document.querySelector('[data-destino-card=\"Lanzarote\"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); return true })()")
    await a.esp(1200)
    await a.escribir('[data-campo-origen]', origen)
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-origen-opcion]'))")); i++) await a.esp(300)
    await ev("(() => { const e = document.querySelector('[data-origen-opcion]'); e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); return true })()")
    await a.esp(1500)
    await ev("document.querySelector('[data-trazar-ruta]').dispatchEvent(new MouseEvent('click', { bubbles: true }))")
    for (let i = 0; i < 90 && !(await ev("/Cómo quieres llegar a Lanzarote/.test((document.querySelector('[data-titulo-paso]')?.innerText ?? '').replace(/\\s+/g, ' '))")); i++) await a.esp(500)
    const t = (await ev("document.querySelector('[data-titulo-paso]')?.innerText ?? ''")).replace(/\s+/g, ' ')
    debe(/Cómo quieres llegar a Lanzarote/.test(t), `${origen}: el paso del transporte llega a «¿Cómo quieres llegar a Lanzarote?» (${t})`)
    const cuerpo = await ev('document.body.innerText')
    debe(!/No hemos podido saber qué tipo de destino es|Reintentar/.test(cuerpo), `${origen}: no sale «No hemos podido saber qué tipo de destino es… Reintentar»`)
    debe(!/Ruta panorámica en coche o explorar desde una base/.test(cuerpo), `${origen}: no sale «¿Ruta panorámica en coche o explorar desde una base?»`)
    for (let i = 0; i < 30 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().transport_option))").catch(() => false)); i++) await a.esp(500)
    const est = JSON.parse(await ev("import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); return JSON.stringify({ arq: s.archetype, fallo: s.archetype_classification_failed, ambiguo: s.archetype_ambiguous, opcion: s.transport_option?.id ?? null, tipo: s.vehicle_type, dueno: s.vehicle_ownership, resuelto: s.vehicle_resolved, modo: s.travel_mode, veh: s.vehiculo_altamente_recomendado }) })"))
    debe(est.arq === 'base_y_excursiones' && est.fallo === false && !est.ambiguo, `${origen}: el arquetipo es base_y_excursiones, sin fallo ni ambigüedad (${JSON.stringify(est)})`)
    debe(est.opcion === 'flight', `${origen}: desde la Península, avión (${est.opcion})`)
    for (let i = 0; i < 20 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore.getState().vehicle_resolved)")); i++) await a.esp(400)
    const est2 = JSON.parse(await ev("import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); return JSON.stringify({ tipo: s.vehicle_type, dueno: s.vehicle_ownership, resuelto: s.vehicle_resolved, modo: s.travel_mode }) })"))
    debe(est2.tipo === 'car' && est2.dueno === 'rental' && est2.resuelto === true && est2.modo === 'base_fija', `${origen}: coche de alquiler dado por hecho, sin pregunta (${JSON.stringify(est2)})`)
    debe(!/¿Te gustaría alquilar un vehículo|Base fija|Ruta itinerante/.test(await ev('document.body.innerText')), `${origen}: el formulario no pregunta por el coche ni por «Base fija / Ruta itinerante»`)
    await a.captura(path.join(SALIDA, `arreglo_lz_transporte_${origen.toLowerCase()}_1.jpg`))
  }

  // 3d. La ruta de verdad: el viaje de Eric (ACE, dom 8-nov 08:25 → vie 13-nov 19:40, Costa Teguise, coche de alquiler, con pase)
  await ev('location.href = "/?cuentas=off&logros=off&version=completa&apertura=0"; true').catch(() => {})
  await a.esp(3000)
  for (let i = 0; i < 360 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  const ruta = await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', vuelos: { llegada: '08:25', vuelta: '19:40' }, hoy: '2026-11-08' }).then((r) => JSON.stringify({ dias: r.days.length, destino: r.destination, primera: r.days[0].dia_id ?? r.days[0].id, vuelta: r.days.at(-1).isReturnLeg === true }))")
  const r = JSON.parse(ruta)
  debe(r.dias === 6 && r.destino === 'Lanzarote', `la ruta del viaje de Eric se crea (6 días, Lanzarote): ${ruta}`)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(500)
  }
  await ev("import('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); s.setMode('days'); s.setActiveDayId(s.route.days[0].id); return true })")
  await a.esp(2500)
  await a.captura(path.join(SALIDA, 'arreglo_lz_ruta_creada_1.jpg'))
} finally {
  a.cerrar()
}

console.log(`\nPrueba del arreglo de crear Lanzarote: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
