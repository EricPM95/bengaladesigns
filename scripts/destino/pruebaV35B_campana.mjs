// Tanda V35B · la campana con las respuestas de Eric y los sonidos de la app.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV35B_campana.mjs      (con Vite en 5173; sin Vite solo la parte seca)
//   6 · LA CAMPANA: una respuesta lleva el icono del triángulo de «Cuéntanos», «Te hemos respondido» y el principio de lo que se dice; al tocarla se abre entera con «Tu reporte: …»; igual el «ya está arreglado».
//   7 · LOS SONIDOS: la apertura no suena en la app (solo en el estudio), «Tu primer día» tiene partitura y suena, el resumen del día, el del viaje y el vuelo de lo ganado suenan en la app; el resumen del viaje del
//       estudio sale con datos de ejemplo.
// Ninguna parte toca el Supabase de producción (el servidor se prueba con una base de mentira).
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
const APP = process.env.APP_URL ?? 'http://localhost:5173'

/* ───────── 1. Los textos (puros) ───────── */
console.log('1. Los textos de la respuesta')
const T = await import('../../shared/avisos/textos.js')
{
  const largo = 'Tienes razón: el Coliseo cierra a las 18:00 en invierno y ya lo hemos corregido en la app. Gracias por avisarnos, de verdad.'
  const resp = { tipo: 'gracias_viajero', payload: { texto: largo, es_respuesta: true } }
  debe(T.textoDelAviso(resp) === 'Te hemos respondido', 'titulo', 'el aviso de una respuesta dice «Te hemos respondido»')
  const det = T.detalleDelAviso(resp)
  debe(typeof det === 'string' && det.endsWith('…') && det.length <= 72 && largo.startsWith(det.slice(0, -1)), 'principio', `debajo, el principio de la respuesta con puntos suspensivos (${det})`)
  debe(T.principioDeRespuesta('Vale, gracias') === 'Vale, gracias', 'principio', 'una respuesta corta sale entera, sin puntos suspensivos')
  const hecho = { tipo: 'gracias_viajero', payload: { texto: 'Gracias a ti, ya está arreglado: Coliseo.' } }
  debe(T.textoDelAviso(hecho) === 'Gracias a ti, ya está arreglado: Coliseo.' && T.detalleDelAviso(hecho) === null, 'arreglado', 'el «ya está arreglado» sigue diciendo lo suyo')
  const f = T.franjaDelAviso(resp)
  debe(f.titulo === 'Te hemos respondido' && f.detalle === det, 'franja', 'la franja de arriba también dice «Te hemos respondido» y el principio')
}

/* ───────── 2. El servidor trae el reporte original ───────── */
console.log('2. El servidor: el aviso lleva lo que había mandado el viajero')
{
  const { crearServicioAvisos } = await import('../../server/avisos.js')
  const avisos = [
    { id: 'av-resp', tipo: 'gracias_viajero', creado_en: new Date().toISOString(), leido: false, payload: { texto: 'Tienes razón, ya lo hemos corregido.', tipo: 'dato_mal', aviso_id: 'rep-1' } },
    { id: 'av-hecho', tipo: 'gracias_viajero', creado_en: new Date().toISOString(), leido: false, payload: { texto: 'Gracias a ti, ya está arreglado: Coliseo.', tipo: 'dato_mal', aviso_id: 'rep-1' } },
    { id: 'av-otro', tipo: 'permiso', creado_en: new Date().toISOString(), leido: true, payload: {} },
  ]
  const claves = [{ id: 'av-resp', clave: 'respuesta:rep-1:abc' }, { id: 'av-hecho', clave: 'viajero:rep-1' }]
  const reportes = [{ id: 'rep-1', tipo: 'dato_mal', datos: { sitio: 'Coliseo', falla: 'horario', mas: 'Ahora cierra a las 18:00' } }]
  const llamadas = []
  const admin = {
    rpc: async (n) => ({ data: n === 'avisos_de' ? avisos : [] }),
    from: (tabla) => ({
      select: () => ({
        in: async (_c, ids) => {
          llamadas.push([tabla, ids])
          return { data: tabla === 'avisos' ? claves.filter((x) => ids.includes(x.id)) : reportes.filter((x) => ids.includes(x.id)) }
        },
      }),
    }),
  }
  const servicio = crearServicioAvisos({ admin, log: { warn() {} } })
  const r = await servicio.listar('uid-1')
  const resp = r.avisos.find((a) => a.id === 'av-resp')
  const hecho = r.avisos.find((a) => a.id === 'av-hecho')
  debe(resp?.texto === 'Te hemos respondido' && resp.payload.es_respuesta === true, 'respuesta', 'la respuesta sale como «Te hemos respondido» (su clave empieza por «respuesta:»)')
  debe(resp?.payload.reporte?.titulo === 'Coliseo · Horario' && resp.payload.reporte.texto === 'Ahora cierra a las 18:00', 'reporte', `lleva el reporte original («Coliseo · Horario» y su texto): ${JSON.stringify(resp?.payload.reporte)}`)
  debe(resp?.detalle === 'Tienes razón, ya lo hemos corregido.', 'principio', 'y el principio de la respuesta como segunda línea')
  debe(hecho?.texto === 'Gracias a ti, ya está arreglado: Coliseo.' && hecho.payload.es_respuesta === undefined && hecho.payload.reporte?.titulo === 'Coliseo · Horario', 'arreglado', 'el «ya está arreglado» lleva su reporte y no es una respuesta')
  debe(JSON.stringify(r.avisos.find((a) => a.id === 'av-otro')?.payload) === '{}', 'otros', 'los demás avisos no se tocan')
  debe(llamadas.length === 2, 'consultas', `una sola lectura de claves y una de reportes (${llamadas.length})`)
  // Sin acceso a la tabla (un cliente sin `from`): la campana sale igual, sin reporte
  const sin = await crearServicioAvisos({ admin: { rpc: admin.rpc }, log: { warn() {} } }).listar('uid-1')
  debe(sin.ok && sin.avisos.length === 3 && !sin.avisos[0].payload.reporte, 'sin_tabla', 'sin poder leer el reporte, la campana sale igual')
}

/* ───────── 3. El código ───────── */
console.log('3. El código')
{
  const lista = sinComentarios(leer('src/components/avisos/ListaDeAvisos.tsx'))
  debe(/gracias_viajero/.test(lista) && /ICONO_CUENTANOS/.test(lista), 'icono', 'la lista pinta los avisos de «Cuéntanos» con su icono propio (no el puntito)')
  const boton = leer('src/components/cuentanos/BotonCuentanos.tsx')
  const trazo = boton.match(/const AVISO = '([^']+)'/)?.[1]
  debe(Boolean(trazo) && leer('src/components/avisos/ListaDeAvisos.tsx').includes(trazo), 'icono', 'el trazo es EL MISMO que el del botón «Cuéntanos» (el triángulo)')
  const hoja = sinComentarios(leer('src/components/layout/NoticesSheet.tsx'))
  debe(/RespuestaAbierta/.test(hoja) && /tocarDeLaCuenta/.test(hoja), 'abrir', 'tocar una respuesta la abre entera')
  const demo = leer('src/lib/logrosDemo_avisosCampana.ts')
  debe(/es_respuesta: true/.test(demo) && /Coliseo · Horario/.test(demo) && /avisosDemo/.test(demo), 'demo', 'la demo de desarrollo tiene una respuesta y un «ya está arreglado» de ejemplo (?avisosDemo=respuesta)')
  // Sonidos
  const sonidos = sinComentarios(leer('src/lib/sonidos.ts'))
  debe(/momento === 'apertura'[^\n]*__estudioVisor/.test(sonidos), 'apertura', 'sonar(\'apertura\') no hace nada fuera del visor del estudio')
  let llamadas = ''
  const recorrer = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`
      if (p === 'src/components/logros/AdminSonidos.tsx' || p === 'src/components/logros/sonidos') continue // el estudio sí puede oírla
      if (e.isDirectory()) recorrer(p)
      else if (/\.(tsx?|html)$/.test(e.name)) llamadas += '\n' + p + '\n' + sinComentarios(leer(p))
    }
  }
  recorrer('src')
  debe(!/sonar\(\s*['"`]apertura/.test(llamadas), 'apertura', "ninguna llamada a sonar('apertura') desde la app (solo el estudio)")
  debe(!/sonar\(\s*['"`]apertura/.test(leer('index.html')), 'apertura', 'ni en index.html')
  debe(/case 'primer_dia'/.test(leer('src/lib/sonidos/partituras.ts')) && /'primer_dia'/.test(leer('src/lib/sonidos/partituras.ts').match(/IDS_DE_PARTITURA[^\n]*/)[0]), 'primer_dia', '«Tu primer día» tiene partitura (y está en la lista de partituras)')
  const est = leer('src/lib/sonidos/estudio.ts')
  debe(/id: 'primer_dia'/.test(est) && /visor: 'primer_dia'/.test(est), 'estudio', '«Tu primer día» está en el estudio de sonidos')
  debe(!/todavía NO hace sonar|tampoco lo hace sonar todavía/.test(est), 'notas', 'el estudio ya no dice «La app todavía NO hace sonar…»')
  debe(/sonar\('primer_dia'\)/.test(leer('src/components/logros/momentos/PrimerDia.tsx')), 'primer_dia', 'PrimerDia hace sonar su partitura al abrirse')
  // (V38C) Los resúmenes suenan por la puerta única (cifrasQueSuben.ts), solo la primera vez y con cifras que suben.
  debe(/sonarResumenUnaVez/.test(leer('src/components/logros/momentos/ResumenDia.tsx')) && /sonarResumenUnaVez/.test(leer('src/components/logros/momentos/ResumenViaje.tsx')) && /sonar\('dia_completo'(, \{ animacion \})?\)/.test(leer('src/components/logros/momentos/cifrasQueSuben.ts')), 'resumenes', 'el resumen del día y el del viaje hacen sonar su partitura (por la puerta única, solo la primera vez)')
  debe(/sonar\('vuelo'\)/.test(leer('src/components/logros/momentos/Reproductor.tsx')), 'vuelo', 'el vuelo de lo ganado hace sonar su partitura')
  const visor = leer('src/components/logros/sonidos/VisorDeAnimacion.tsx')
  debe(/ejemploDelResumenDelViaje\(\)/.test(visor) && /ejemplo=\{/.test(visor), 'ejemplo', 'el visor monta el resumen del viaje con datos de ejemplo')
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la app se salta)')
  console.log(`\nPrueba V35B campana: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────── 4. La campana en la app ───────── */
console.log('4. La campana en la app (demo con ?avisosDemo=respuesta)')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&avisosDemo=respuesta&version=pago&apertura=0&sinCompanero=1' })
const ev = (js) => a.evaluar(js)
const J = async (js) => JSON.parse(await ev(`JSON.stringify(${js})`))
try {
  for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await ev("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await a.esp(1000)
  await a.esp(2500)
  // (Si Vite recarga la página por un cambio de archivos de otro, el viaje de prueba se vuelve a crear.)
  for (let i = 0; i < 4 && !(await ev("Boolean(document.querySelector('button[aria-label^=\"Avisos\"]'))")); i++) {
    for (let j = 0; j < 60 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); j++) await a.esp(500)
    await ev('window.__rutaPrueba().then(() => true)').catch(() => undefined)
    await a.esp(6000)
  }
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim()) && !x.closest('[data-campana]')); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(700)
  }
  // El servidor de mentira de la demo contesta a /api/avisos con la respuesta y el «ya está arreglado» de ejemplo; se pide otra vez y, si aun así no están, se ponen a mano en el almacén.
  await ev("Promise.resolve(window.__avisos.getState().cargar?.()).then(() => true)").catch(() => undefined) // (el almacén de la app, no otra copia importada)
  await a.esp(1500)
  if ((await ev("window.__avisos.getState().avisos.filter((x) => x.tipo === 'gracias_viajero').length")) < 2) await ev(`import('/src/lib/logrosDemo_avisosCampana.ts').then((m) => m.responder('/api/avisos')).then((r) => { window.__avisos.getState().poner(r.avisos); return true })`)
  await a.esp(1500)
  debe(await ev("Boolean(document.querySelector('button[aria-label^=\"Avisos\"]'))"), 'campana', 'el botón de la campana existe')
  await ev("window.__errs = []; const oe = console.error; console.error = (...x) => { window.__errs.push(x.map((y) => String(y?.stack ?? y)).join(' ').slice(0, 400)); oe(...x) }; true")
  for (let i = 0; i < 6 && !(await ev("Boolean(document.querySelector('[data-campana]'))")); i++) {
    await ev("document.querySelector('button[aria-label^=\"Avisos\"]').click(); true")
    await a.esp(900)
  }
  const filas = await J("Array.from(document.querySelectorAll('[data-campana] [data-aviso-tipo=\"gracias_viajero\"]')).map((f) => ({ id: f.getAttribute('data-aviso'), texto: f.innerText.replace(/\\s+/g, ' '), icono: Boolean(f.querySelector('[data-aviso-icono=\"cuentanos\"] svg path')), d: f.querySelector('[data-aviso-icono=\"cuentanos\"] svg path')?.getAttribute('d'), puntoDeLista: (f.querySelector('span[aria-hidden]')?.textContent || '').trim() })).sort((x, y) => x.id.localeCompare(y.id))")
  if (filas.length < 2) console.log('  (diagnóstico)', await ev("JSON.stringify({ n: window.__avisos.getState().avisos.map((x) => x.id), errs: window.__errs, filas: Array.from(document.querySelectorAll('[data-fila-aviso]')).map((x) => x.getAttribute('data-fila-aviso')) })"))
  const trazo = leer('src/components/cuentanos/BotonCuentanos.tsx').match(/const AVISO = '([^']+)'/)[1]
  debe(filas.length === 2, 'filas', `salen los dos avisos de ejemplo (${filas.length})`)
  const arreglado = filas.find((f) => f.id === 'demo-arreglado')
  const respuesta = filas.find((f) => f.id === 'demo-respuesta')
  debe(respuesta?.icono && respuesta.d === trazo && arreglado?.icono && arreglado.d === trazo, 'icono', 'los dos llevan el icono del triángulo de «Cuéntanos» (el mismo trazo que el botón)')
  debe(/Te hemos respondido/.test(respuesta?.texto ?? '') && /Tienes razón: el Coliseo cierra a las 18:00/.test(respuesta?.texto ?? '') && /…/.test(respuesta?.texto ?? ''), 'titulo', `«Te hemos respondido» y debajo el principio de la respuesta, cortado con puntos suspensivos (${respuesta?.texto})`)
  debe(/Gracias a ti, ya está arreglado: Coliseo\./.test(arreglado?.texto ?? ''), 'arreglado', `el «ya está arreglado» sale con su texto (${arreglado?.texto})`)
  await a.captura('docs/dias/V35B_capturas/campana_respuestas.jpg')

  // Tocar la respuesta: se abre entera
  await ev("document.querySelector('[data-campana] [data-aviso=\"demo-respuesta\"]').click(); true")
  await a.esp(600)
  let ab = await J("(() => { const r = document.querySelector('[data-respuesta-abierta]'); return r ? { tipo: r.getAttribute('data-respuesta-abierta'), titulo: r.querySelector('[data-respuesta-titulo]')?.textContent, texto: r.querySelector('[data-respuesta-texto]')?.textContent, reporte: (r.querySelector('[data-respuesta-reporte]')?.innerText || '').replace(/\\s+/g, ' '), icono: Boolean(r.querySelector('svg path')) } : null })()")
  debe(ab?.tipo === 'respuesta' && ab.titulo === 'Te hemos respondido', 'abrir', `tocarla la abre: «${ab?.titulo}»`)
  debe(/ya lo hemos corregido\. Gracias por avisarnos\.$/.test(ab?.texto ?? ''), 'abrir', 'con la respuesta ENTERA (sin cortar)')
  debe(/^Tu reporte: Coliseo · Horario/.test(ab?.reporte ?? '') && /Ahora cierra a las 18:00/.test(ab?.reporte ?? ''), 'reporte', `y debajo «Tu reporte: Coliseo · Horario» con lo que había mandado (${ab?.reporte})`)
  const leido = await ev("window.__avisos.getState().avisos.find((x) => x.id === 'demo-respuesta')?.leido")
  debe(leido === true, 'leido', 'al abrirla queda leída')
  await a.captura('docs/dias/V35B_capturas/campana_respuesta_abierta.jpg')
  await ev("document.querySelector('[data-respuesta-cerrar]').click(); true")
  await a.esp(400)
  debe(!(await ev("Boolean(document.querySelector('[data-respuesta-abierta]'))")), 'cerrar', 'se cierra y vuelve a la lista')

  // Lo mismo con el «ya está arreglado»
  await ev("document.querySelector('[data-campana] [data-aviso=\"demo-arreglado\"]').click(); true")
  await a.esp(600)
  ab = await J("(() => { const r = document.querySelector('[data-respuesta-abierta]'); return r ? { tipo: r.getAttribute('data-respuesta-abierta'), titulo: r.querySelector('[data-respuesta-titulo]')?.textContent, texto: r.querySelector('[data-respuesta-texto]')?.textContent ?? null, reporte: (r.querySelector('[data-respuesta-reporte]')?.innerText || '').replace(/\\s+/g, ' ') } : null })()")
  debe(ab?.tipo === 'hecho' && /Gracias a ti, ya está arreglado: Coliseo\./.test(ab.titulo ?? ''), 'arreglado', `el «ya está arreglado» también se abre entero («${ab?.titulo}»)`)
  debe(/^Tu reporte: Coliseo · Horario/.test(ab?.reporte ?? '') && /Ahora cierra a las 18:00/.test(ab?.reporte ?? ''), 'arreglado', 'y lleva «Tu reporte: Coliseo · Horario» y su texto')
  await a.captura('docs/dias/V35B_capturas/campana_arreglado_abierto.jpg')
  await ev("document.querySelector('[data-respuesta-cerrar]').click(); true")
  await a.esp(300)
  // Los demás avisos siguen abriéndose como siempre (no hay hoja de respuesta para ellos)
  await ev("window.__avisos.getState().poner([{ id: 'c-perm', tipo: 'permiso', texto: 'Eric te ha dado permiso para editar el viaje a Roma.', quien: 'Eric', creado_en: new Date().toISOString(), leido: false, payload: {}, etiqueta: null }]); true")
  await a.esp(400)
  await ev("document.querySelector('[data-campana] [data-aviso=\"c-perm\"]').click(); true")
  await a.esp(400)
  debe(!(await ev("Boolean(document.querySelector('[data-respuesta-abierta]'))")), 'otros', 'un aviso cualquiera no abre la hoja de respuesta')
} finally {
  a.cerrar()
}

/* ───────── 5. Los sonidos en la app ───────── */
console.log('5. Los sonidos en la app: la apertura en silencio y lo demás sonando')
{
  const b = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=1&sinCompanero=1' })
  const ev2 = (js) => b.evaluar(js)
  const J2 = async (js) => JSON.parse(await ev2(`JSON.stringify(${js})`))
  try {
    await b.esp(4500)
    debe(!(await J2("(window.__sonidosPedidos ?? []).includes('apertura')")), 'apertura', 'con la apertura puesta (?apertura=1), la app no pide su sonido')
    for (let i = 0; i < 120 && !(await ev2("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await b.esp(500)
    for (let i = 0; i < 60 && !(await ev2("typeof window.__momentos === 'object' || typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await b.esp(500)
    // Aunque alguien lo pida, fuera del estudio no se apunta ni suena
    await ev2("import('/src/lib/sonidos.ts').then((m) => m.sonar('apertura')).then(() => true)")
    debe(!(await J2("(window.__sonidosPedidos ?? []).includes('apertura')")), 'apertura', 'sonar(\'apertura\') fuera del estudio no apunta nada (no suena)')
    await ev2("import('/src/components/logros/momentos/demoMomentos.ts').then(() => true)")
    await b.esp(800)

    const limpiar = () => ev2('window.__sonidosPedidos = []; true')
    const pedidos = () => J2('window.__sonidosPedidos ?? []')
    // Tu primer día
    await limpiar()
    await ev2("window.localStorage.removeItem('trazo:logros:primerdia'); window.__momentos.primerDia(); true")
    for (let i = 0; i < 20 && !(await ev2("Boolean(document.querySelector('[aria-label=\"Hoy empiezas a ganar logros\"]'))")); i++) await b.esp(400)
    await b.esp(600)
    debe((await pedidos()).includes('primer_dia'), 'primer_dia', `«Tu primer día» suena al abrirse (${(await pedidos()).join(', ')})`)
    await b.captura('docs/dias/V35B_capturas/app_primer_dia.jpg')
    await ev2("window.__momentos.cerrar(); true")
    await b.esp(400)
    // Resumen del día
    await limpiar()
    await ev2("window.__momentos.resumenDia(); true")
    for (let i = 0; i < 20 && !(await ev2("Boolean(document.querySelector('[aria-label=\"Resumen del día\"]'))")); i++) await b.esp(400)
    await b.esp(600)
    debe((await pedidos()).includes('dia_completo'), 'resumen_dia', `el resumen del día suena al abrirse (${(await pedidos()).join(', ')})`)
    await ev2("window.__momentos.cerrar(); true")
    await b.esp(400)
    // Resumen del viaje
    // (V38C) Con un viaje abierto y sin la marca de «ya se vio»: suena la primera vez (las cifras suben) y no la segunda.
    // («Tu primer día» ya vista: con un viaje activo saldría antes y el resumen esperaría su turno.)
    await ev2("window.localStorage.setItem('trazo:logros:primerdia', 'si'); true")
    await ev2("import('/src/store/useSyncStore.ts').then((m) => { m.useSyncStore.setState({ activeTripId: 'prueba-v38c' }); return true })")
    await ev2("(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trazo:logros:resumenviaje:')) localStorage.removeItem(k); return true })()")
    await limpiar()
    await ev2("window.__momentos.resumenViaje('wow'); true")
    for (let i = 0; i < 60 && !(await ev2("Boolean(document.querySelector('[data-cifras-del-viaje]'))")); i++) await b.esp(400)
    await b.esp(2500)
    debe((await pedidos()).includes('dia_completo'), 'resumen_viaje', `el resumen del viaje suena la primera vez que se abre (${(await pedidos()).join(', ')})`)
    await ev2("window.__momentos.cerrar(); true")
    await b.esp(400)
    await limpiar()
    await ev2("window.__momentos.resumenViaje('wow'); true")
    for (let i = 0; i < 60 && !(await ev2("Boolean(document.querySelector('[data-cifras-del-viaje]'))")); i++) await b.esp(400)
    await b.esp(2500)
    debe(!(await pedidos()).includes('dia_completo'), 'resumen_viaje', `abierto otra vez, el resumen del viaje no suena (${(await pedidos()).join(', ') || 'nada'})`)
    await ev2("window.__momentos.cerrar(); true")
    await ev2("import('/src/store/useSyncStore.ts').then((m) => { m.useSyncStore.setState({ activeTripId: null }); return true })")
    await b.esp(400)
    // El vuelo de lo ganado: se pasa de pantalla con un botón de destino a la vista
    await limpiar()
    await ev2("(() => { const bt = document.createElement('button'); bt.setAttribute('data-boton-logros', '1'); bt.style.cssText = 'position:fixed;right:20px;bottom:20px;width:48px;height:48px;z-index:1;'; document.body.appendChild(bt); return true })()")
    await ev2("window.__momentos.lanzar('emblema:panteon'); true")
    let pasado = false
    for (let i = 0; i < 60 && !pasado; i++) {
      await b.esp(500)
      pasado = await ev2("(() => { const c = document.querySelector('[data-vuelo]'); if (!c) return false; const bs = Array.from(document.querySelectorAll('button')).filter((x) => x.getAttribute('data-boton-logros') == null && /Visto|Seguir|Siguiente|Continuar|Genial|Entendido|Cerrar|Ver/i.test((x.textContent || '').trim()) && !/Saltar/i.test(x.textContent || '')); const bt = bs[bs.length - 1]; if (!bt) return false; bt.click(); return true })()")
    }
    await b.esp(600)
    debe(pasado, 'vuelo', 'se pudo pasar de pantalla en la ronda de ejemplo')
    debe((await pedidos()).includes('vuelo'), 'vuelo', `lo ganado que vuela al botón suena (${(await pedidos()).join(', ')})`)
    await ev2("window.__momentos.cerrar(); true")
  } finally {
    b.cerrar()
  }
}

console.log(`\nPrueba V35B campana: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
if (fallos.length) {
  console.log(JSON.stringify(fallos, null, 1))
  process.exit(1)
}
process.exit(0)
