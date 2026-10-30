// Tanda 10S5 (agente M): leer el billete y los datos. Sin tocar el motor de rutas.
//   A) Sin navegador: el código BCBP, la duración con la hora de cada país, los aeropuertos de cada ciudad («Barcelona (El Prat)», «Londres»), el limpiador de la lectura del servidor
//      (sin nombre del pasajero), el endpoint con una IA de mentira (no guarda ni registra el contenido) y que la lista de aeropuertos y las bibliotecas NO van en la descarga de la app.
//   B) Con un Chrome sin ventana (la cola): `leerBillete` de verdad en el navegador con el PDF de ejemplo de avión y la captura de ejemplo de tren (scripts/destino/_ejemplos_billete/),
//      el código decodificado, redibujado (y que el redibujo se lee otra vez igual) y recortado. El servidor se sustituye por una respuesta guardada, salvo con BILLETE_CON_CLAUDE=1 (una llamada real a Claude por billete).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S5_M.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'
import sharp from 'sharp'
import { readBarcodes } from 'zxing-wasm/reader'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto })
  else if (process.env.VERBOSO) console.log('  ✓', regla)
}
const iguales = (a, b, regla) => debe(JSON.stringify(a) === JSON.stringify(b), regla, `${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`)
const EJEMPLOS = path.resolve('scripts/destino/_ejemplos_billete')

// ═══════════════════════════ A) Sin navegador ═══════════════════════════
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba10s5m-'))
const salida = path.join(tmp, 'libs.mjs')
fs.writeFileSync(path.join(tmp, 'entrada.ts'), `
export * from '${path.resolve('src/lib/billeteLeer.ts').replace(/\\/g, '/')}'
export * from '${path.resolve('src/lib/duracionViaje.ts').replace(/\\/g, '/')}'
export * from '${path.resolve('src/lib/aeropuertosCiudad.ts').replace(/\\/g, '/')}'
`)
await build({ entryPoints: [path.join(tmp, 'entrada.ts')], bundle: true, format: 'esm', platform: 'node', outfile: salida, external: ['zxing-wasm/*', 'pdfjs-dist*'], logLevel: 'silent', loader: { '.json': 'json' } })
const L = await import(`file://${salida.replace(/\\/g, '/')}`)

console.log('\n== El código BCBP ==')
const BCBP = 'M1PRUEBA/ANA          EABC123 BCNFCOVY 6102 339Y014C0045 100' // el mismo que escribe _ejemplos_billete/generar.mjs
const b = L.leerBCBP(BCBP)
debe(b && b.origen === 'BCN' && b.destino === 'FCO', 'bcbp-aeropuertos', JSON.stringify(b))
debe(b?.companiaCodigo === 'VY' && b?.vuelo === '6102', 'bcbp-vuelo', JSON.stringify(b))
debe(b?.asiento === '14C' && b?.localizador === 'ABC123' && b?.diaJuliano === 339, 'bcbp-asiento-localizador', JSON.stringify(b))
debe(!JSON.stringify(b).includes('PRUEBA'), 'bcbp-sin-nombre-del-pasajero', 'el nombre no sale')
debe(L.leerBCBP('https://www.renfe.com/billete/123') === null && L.leerBCBP('') === null && L.leerBCBP(null) === null, 'bcbp-no-es-bcbp', 'una URL o vacío no es un BCBP')
debe(L.fechaDeDiaJuliano(339, 2026) === '2026-12-05', 'juliano-fecha', L.fechaDeDiaJuliano(339, 2026))
debe(L.fechaDeDiaJuliano(60, 2028) === '2028-02-29', 'juliano-bisiesto', L.fechaDeDiaJuliano(60, 2028))

console.log('== La duración (hora de cada país) ==')
const base = { fecha: '2026-12-05' }
iguales(L.duracionDelTrayecto({ ...base, horaSalida: '08:30', horaLlegada: '10:25', zonaSalida: 'Europe/Madrid', zonaLlegada: 'Europe/Rome' }), 115, 'dur-bcn-fco')
iguales(L.textoDeTrayecto(115), '1 h 55 min', 'dur-texto-1h55')
iguales(L.duracionDelTrayecto({ ...base, horaSalida: '08:30', horaLlegada: '09:50', zonaSalida: 'Europe/Madrid', zonaLlegada: 'Europe/London' }), 140, 'dur-bcn-lhr-con-huso')
iguales(L.duracionDelTrayecto({ ...base, horaSalida: '11:00', horaLlegada: '13:30', zonaSalida: 'Europe/Madrid', zonaLlegada: 'America/New_York' }), 510, 'dur-bcn-jfk-huso-de-6-h') // 11:00 CET = 05:00 EST; llega 13:30 EST → 8 h 30
iguales(L.duracionDelTrayecto({ fecha: '2026-12-05', horaSalida: '23:00', horaLlegada: '01:10', zonaSalida: 'Europe/Madrid', zonaLlegada: 'Europe/Rome' }), 130, 'dur-pasa-medianoche')
iguales(L.duracionDelTrayecto({ fecha: '2026-12-05', fechaLlegada: '2026-12-06', horaSalida: '23:00', horaLlegada: '01:10', zonaSalida: 'Europe/Madrid', zonaLlegada: 'Europe/Rome' }), 130, 'dur-con-fecha-llegada')
iguales(L.duracionDelTrayecto({ fecha: '2026-03-28', horaSalida: '22:00', horaLlegada: '00:30', zonaSalida: 'Europe/Madrid', zonaLlegada: 'Europe/Madrid' }), 150, 'dur-misma-zona')
iguales(L.duracionDelTrayecto({ horaSalida: '08:10', horaLlegada: '11:12', mismaZonaSiFalta: true }), 182, 'dur-tren-sin-zonas')
iguales(L.textoDeTrayecto(182), '3 h 2 min', 'dur-texto-3h2')
iguales(L.duracionDelTrayecto({ ...base, horaSalida: '08:30', horaLlegada: '10:25' }), null, 'dur-avion-sin-zonas-no-hay-duracion')
iguales(L.duracionDelTrayecto({ ...base, horaSalida: '08:30', horaLlegada: '10:25', zonaSalida: 'Europe/Madrid' }), null, 'dur-avion-falta-una-zona')
iguales(L.duracionDelTrayecto({ ...base, horaSalida: '08:30', horaLlegada: null, zonaSalida: 'Europe/Madrid', zonaLlegada: 'Europe/Rome' }), null, 'dur-falta-una-hora')
iguales(L.duracionDelTrayecto({ ...base, horaSalida: 'x', horaLlegada: '10:00', mismaZonaSiFalta: true }), null, 'dur-hora-mala')
iguales([L.textoDeTrayecto(0), L.textoDeTrayecto(null), L.textoDeTrayecto(120), L.textoDeTrayecto(45)], ['', '', '2 h', '45 min'], 'dur-textos')
// Las funciones viejas del archivo siguen igual.
iguales([L.textoDeDuracion(5), L.textoDeDuracion(1)], ['5 días · 4 noches', '1 día'], 'dur-textos-de-dias-intactos')

console.log('== Aeropuertos de cada ciudad ==')
iguales(L.etiquetaDeCiudadConPunto('Barcelona'), 'Barcelona (El Prat)', 'aer-barcelona-un-solo-aeropuerto')
iguales(L.etiquetaDeCiudadConPunto('  barcelona '), 'Barcelona (El Prat)', 'aer-barcelona-minusculas')
iguales(L.etiquetaDeCiudadConPunto('Barcelona, España'), 'Barcelona (El Prat)', 'aer-con-pais')
iguales(L.etiquetaDeCiudadConPunto('Madrid'), 'Madrid (Barajas)', 'aer-madrid')
for (const [ciudad, esperado] of [['Londres', 'Londres'], ['London', 'Londres'], ['Milán', 'Milán'], ['Milan', 'Milán'], ['París', 'París'], ['Paris', 'París'], ['Nueva York', 'Nueva York'], ['Roma', 'Roma'], ['Estambul', 'Estambul'], ['Tokio', 'Tokio']]) {
  iguales(L.etiquetaDeCiudadConPunto(ciudad), esperado, `aer-varios-solo-la-ciudad-${ciudad}`)
}
iguales(L.etiquetaDeCiudadConPunto('Villanueva de Abajo'), 'Villanueva de Abajo', 'aer-desconocida-tal-cual')
iguales(L.etiquetaDeCiudadConPunto(''), '', 'aer-vacia')
iguales(L.etiquetaDeCiudadConPunto(null), '', 'aer-nula')
iguales(L.etiquetaDeCiudadConEstacion('Sevilla'), 'Sevilla (Santa Justa)', 'est-sevilla-una-estacion-sin-duda')
iguales(L.etiquetaDeCiudadConEstacion('Madrid'), 'Madrid', 'est-madrid-varias-solo-la-ciudad')
iguales(L.iatasDeCiudad('Londres'), ['LHR', 'LGW', 'STN', 'LTN', 'LCY', 'SEN'], 'aer-iatas-londres')
const fco = await L.aeropuertoPorIata('FCO'), cia = await L.aeropuertoPorIata('CIA'), bcn = await L.aeropuertoPorIata('bcn')
debe(fco?.corto === 'Fiumicino' && fco?.ciudad === 'Roma' && fco?.zona === 'Europe/Rome', 'aer-fco', JSON.stringify(fco))
debe(cia?.corto === 'Ciampino' && cia?.ciudad === 'Roma', 'aer-cia', JSON.stringify(cia))
debe(bcn?.corto === 'El Prat' && bcn?.ciudad === 'Barcelona' && bcn?.zona === 'Europe/Madrid', 'aer-bcn', JSON.stringify(bcn))
debe((await L.aeropuertoPorIata('LPA'))?.zona === 'Atlantic/Canary', 'aer-canarias-hora-de-canarias', 'LPA')
debe((await L.aeropuertoPorIata('LAX'))?.zona === 'America/Los_Angeles' && (await L.aeropuertoPorIata('JFK'))?.zona === 'America/New_York', 'aer-estados-unidos-por-estado', 'LAX/JFK')
debe((await L.aeropuertoPorIata('XXX')) === null && (await L.aeropuertoPorIata('')) === null && (await L.aeropuertoPorIata('ROMA')) === null, 'aer-codigo-malo', 'null')
iguales((await L.aeropuertosDeCiudad('Roma')).map((a) => a.iata), ['FCO', 'CIA'], 'aer-roma-dos')
iguales(await L.etiquetaDeCiudadCompleta('Barcelona'), 'Barcelona (El Prat)', 'aer-completa-tabla')
const ciudadNoTabla = await L.aeropuertosDeCiudad('Salzburg')
debe(ciudadNoTabla.length === 1 && (await L.etiquetaDeCiudadCompleta('Salzburg')) === 'Salzburg' && (await L.etiquetaDeCiudadCompleta('Bergen')) === 'Bergen (Flesland)', 'aer-ciudad-fuera-de-la-tabla-por-el-json', JSON.stringify(ciudadNoTabla.map((a) => a.iata)))
const datos = JSON.parse(fs.readFileSync('src/data/aeropuertos.json', 'utf8'))
debe(datos.a.length > 3500 && /dominio p/i.test(datos.licencia) && /OurAirports/.test(datos.fuente), 'aer-fuente-y-licencia-en-el-archivo', `${datos.a.length} ${datos.licencia}`)
debe(fs.statSync('src/data/aeropuertos.json').size < 400_000, 'aer-tamano-razonable', String(fs.statSync('src/data/aeropuertos.json').size))
// Zona horaria: ningún aeropuerto de países grandes cae en un huso absurdo.
const sinZona = datos.a.filter((x) => x[4] < 0).length
debe(sinZona < 300, 'aer-pocos-sin-zona', `${sinZona} sin zona`)

console.log('== El servidor: lo que devuelve la IA se limpia ==')
const { limpiarLecturaBillete, registrarLeerBillete, LEER_BILLETE_SISTEMA } = await import('../../server/billete/lectura.js')
const sucio = limpiarLecturaBillete({
  modo: 'zeppelin', numero: ' VY  6102 ', compania: 'Vueling', localizador: 'ABC123', fecha: '2026-12-05', fecha_llegada: '05/12/2026', hora_salida: '8:30', hora_llegada: '25:99',
  origen: { ciudad: 'Barcelona', codigo: 'bcn', nombre: 'Barcelona-El Prat', terminal: 'Terminal 1', puerta: null }, destino: { ciudad: 'Roma', codigo: 'ROMA', nombre: 'Fiumicino', terminal: 'T3' },
  asiento: '14c', coche: null, pasajero: 'PRUEBA/ANA', codigo_caja: { pagina: 1, x0: 0.6, y0: 0.2, x1: 0.2, y1: 0.4 },
})
debe(sucio.modo === null, 'srv-modo-raro-es-null', String(sucio.modo))
debe(sucio.numero === 'VY 6102', 'srv-numero-sin-dobles-espacios', String(sucio.numero))
debe(sucio.hora_salida === '08:30' && sucio.hora_llegada === null, 'srv-horas-solo-buenas', `${sucio.hora_salida} ${sucio.hora_llegada}`)
debe(sucio.fecha_llegada === null && sucio.fecha === '2026-12-05', 'srv-fechas-solo-iso', `${sucio.fecha} ${sucio.fecha_llegada}`)
debe(sucio.origen.codigo === 'BCN' && sucio.destino.codigo === null, 'srv-iata-3-letras', `${sucio.origen.codigo} ${sucio.destino.codigo}`)
debe(sucio.origen.terminal === '1' && sucio.destino.terminal === '3', 'srv-terminal-solo-el-numero', JSON.stringify([sucio.origen.terminal, sucio.destino.terminal]))
 debe(sucio.asiento === '14C', 'srv-asiento-mayusculas', String(sucio.asiento))
debe(sucio.codigo_caja === null, 'srv-caja-al-reves-es-null', JSON.stringify(sucio.codigo_caja))
debe(!JSON.stringify(sucio).includes('PRUEBA'), 'srv-nunca-nombre-del-pasajero', 'sin nombre')
debe(!/nombre del pasajero/i.test(LEER_BILLETE_SISTEMA.replace(/No devuelvas el nombre del pasajero\./, '')), 'srv-el-prompt-no-pide-el-nombre', 'prompt')
debe(JSON.stringify(limpiarLecturaBillete(null)).includes('"numero":null') && limpiarLecturaBillete('basura').origen.codigo === null, 'srv-basura-entra-null-sale', 'limpiar(null)')
const bien = limpiarLecturaBillete({ codigo_caja: { pagina: 2, x0: 0.1, y0: 0.1, x1: 0.5, y1: 0.4 } })
debe(bien.codigo_caja?.pagina === 2, 'srv-caja-buena-se-queda', JSON.stringify(bien.codigo_caja))

// El endpoint con una IA de mentira: 400 sin archivo, 200 con él, y nada del contenido en la consola.
{
  const rutas = new Map()
  const app = { post: (ruta, fn) => rutas.set(ruta, fn) }
  const registros = []
  const consola = { log: console.log, error: console.error, warn: console.warn }
  let llamadas = 0
  const anthropic = { messages: { create: async (args) => { llamadas++; debe(JSON.stringify(args).includes('application/pdf') || JSON.stringify(args).includes('image/jpeg'), 'srv-manda-el-archivo-a-la-ia', 'archivo'); return { content: [{ type: 'text', text: '```json\n{"modo":"avion","numero":"VY 6102","hora_salida":"08:30","hora_llegada":"10:25","pasajero":"PRUEBA/ANA","origen":{"codigo":"BCN"},"destino":{"codigo":"FCO"}}\n```' }], usage: { input_tokens: 10, output_tokens: 10 } } } } }
  registrarLeerBillete(app, { anthropic, MODEL: 'prueba', logCallCost: (n) => registros.push(`cost:${n}`), extractJsonText: (t) => t.replace(/```json|```/g, '').trim(), logAnthropicError: (c) => registros.push(`err:${c}`) })
  const manejar = rutas.get('/api/read-ticket')
  debe(typeof manejar === 'function', 'srv-endpoint-registrado', 'POST /api/read-ticket')
  const responder = async (body) => { let estado = 200, cuerpo = null; await manejar({ body }, { status: (c) => ({ json: (j) => { estado = c; cuerpo = j } }), json: (j) => { cuerpo = j } }); return { estado, cuerpo } }
  const r400 = await responder({})
  debe(r400.estado === 400 && llamadas === 0, 'srv-sin-archivo-400', JSON.stringify(r400))
  const r400b = await responder({ file: { media_type: 'text/html', data: 'eA==' } })
  debe(r400b.estado === 400 && llamadas === 0, 'srv-tipo-raro-400', JSON.stringify(r400b))
  const r200 = await responder({ file: { media_type: 'application/pdf', data: 'JVBERi0=' }, mode: 'avion', year_hint: 2026 })
  debe(r200.estado === 200 && r200.cuerpo.numero === 'VY 6102' && r200.cuerpo.origen.codigo === 'BCN' && r200.cuerpo.hora_llegada === '10:25', 'srv-lectura-buena', JSON.stringify(r200))
  debe(!JSON.stringify(r200.cuerpo).includes('PRUEBA'), 'srv-respuesta-sin-pasajero', 'sin nombre')
  debe(registros.length === 1 && registros[0] === 'cost:read-ticket', 'srv-solo-registra-el-coste', JSON.stringify(registros))
  const rotas = { messages: { create: async () => { throw new Error('boom') } } }
  const rutas2 = new Map()
  registrarLeerBillete({ post: (r, f) => rutas2.set(r, f) }, { anthropic: rotas, MODEL: 'x', logCallCost() {}, extractJsonText: (t) => t, logAnthropicError: () => registros.push('err') })
  let est = 0
  await rutas2.get('/api/read-ticket')({ body: { file: { media_type: 'image/png', data: 'AA==' } } }, { status: (c) => ({ json: () => { est = c } }) })
  debe(est === 502, 'srv-ia-caida-502-y-la-app-sigue-a-mano', String(est))
  void consola
}
const fuenteServidor = fs.readFileSync('server/billete/lectura.js', 'utf8')
debe(!/console\.(log|info|debug)/.test(fuenteServidor) && !/writeFile|insert\(|upsert\(|\.from\('/.test(fuenteServidor), 'srv-no-guarda-ni-registra', 'sin console.log ni escritura')
debe(/registrarLeerBillete\(app/.test(fs.readFileSync('server/index.js', 'utf8')), 'srv-registrado-en-index', 'index.js')

console.log('== Peso: nada de esto va en la descarga de la app ==')
{
  const revisa = (f) => fs.readFileSync(f, 'utf8')
  const fuente = revisa('src/lib/billeteLeer.ts') + revisa('src/lib/aeropuertosCiudad.ts')
  const estaticos = [...fuente.matchAll(/^import\s+(?!type)[^'"]*from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1])
  debe(!estaticos.some((i) => /zxing|pdfjs|aeropuertos\.json/.test(i)), 'peso-sin-imports-estaticos-pesados', estaticos.join(', '))
  debe(/import\('\.\.\/data\/aeropuertos\.json'\)/.test(fuente) && /import\('pdfjs-dist'\)/.test(fuente) && /import\('zxing-wasm\/reader'\)/.test(fuente) && /import\('zxing-wasm\/writer'\)/.test(fuente), 'peso-todo-bajo-demanda', 'imports dinámicos')
}

fs.rmSync(tmp, { recursive: true, force: true })

// ═══════════════════════════ B) En el navegador ═══════════════════════════
if (process.env.SIN_NAVEGADOR === '1') {
  console.log('\n(sin navegador: solo la parte A)')
  console.log(`\nPrueba de la Tanda 10S5 (M): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  for (const f of fallos) console.log(`  ✗ ${f.regla}: ${f.texto}`)
  process.exit(fallos.length ? 1 : 0)
}
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const REAL = process.env.BILLETE_CON_CLAUDE === '1'
const b64 = (f) => fs.readFileSync(path.join(EJEMPLOS, f)).toString('base64')

const LECTURA_AVION = { modo: 'avion', numero: 'VY 6102', compania: 'Vueling', localizador: 'ABC123', fecha: '2026-12-05', fecha_llegada: null, hora_salida: '08:30', hora_llegada: '10:25', origen: { ciudad: 'Barcelona', codigo: 'BCN', nombre: 'Barcelona-El Prat', terminal: '1', puerta: 'B34' }, destino: { ciudad: 'Roma', codigo: 'FCO', nombre: 'Roma-Fiumicino', terminal: '1', puerta: null }, asiento: '14C', coche: null, codigo_caja: null }
const LECTURA_TREN = { modo: 'tren', numero: '03180', compania: 'Renfe', localizador: 'XYZ789', fecha: '2026-12-12', fecha_llegada: null, hora_salida: '08:10', hora_llegada: '11:12', origen: { ciudad: 'Barcelona', codigo: null, nombre: 'Barcelona-Sants', terminal: null, puerta: null }, destino: { ciudad: 'Madrid', codigo: null, nombre: 'Madrid-Puerta de Atocha', terminal: null, puerta: null }, asiento: '01D', coche: '003', codigo_caja: { pagina: 1, x0: 0.24, y0: 0.62, x1: 0.76, y1: 0.89 } }

const a = await abrirApp(APP, { ruta: '/?cuentas=off', ancho: 390, alto: 844, sinEsperarRuta: true })
try {
  const ev = (js) => a.evaluar(js)
  await a.esp(1500)
  const leer = async (nombre, tipo, lectura, extra = '') => {
    const js = `(async () => {
      ${REAL ? '' : `window.__llamadas = []; const f0 = window.fetch.bind(window); window.fetch = async (u, o) => {
        if (String(u).includes('/api/read-ticket')) { window.__llamadas.push(JSON.parse(o.body)); ${lectura ? `return new Response(JSON.stringify(${JSON.stringify(lectura)}), { status: 200, headers: { 'Content-Type': 'application/json' } })` : "return new Response('{}', { status: 500 })"} }
        return f0(u, o) }`}
      const bytes = Uint8Array.from(atob('${b64(nombre)}'), (c) => c.charCodeAt(0))
      const archivo = new File([bytes], '${nombre}', { type: '${tipo}' })
      const m = await import('/src/lib/billeteLeer.ts')
      const t0 = performance.now()
      const r = await m.leerBillete(archivo, { anioPorDefecto: 2026 })
      r.__ms = Math.round(performance.now() - t0)
      r.__enviado = (window.__llamadas ?? []).map((x) => ({ tipo: x.file.media_type, kb: Math.round(x.file.data.length / 1365) }))
      ${extra}
      return JSON.stringify(r)
    })()`
    return JSON.parse(await ev(js))
  }

  console.log('\n== B) Tarjeta de embarque en PDF (avión) ==')
  const av = await leer('tarjeta_avion_ejemplo.pdf', 'application/pdf', LECTURA_AVION)
  console.log(`   ${av.__ms} ms · fuentes ${av.fuentes} · enviado ${JSON.stringify(av.__enviado)} · código ${av.codigo?.formato}`)
  debe(av.modo === 'avion' && av.numero === 'VY 6102' && av.compania === 'Vueling', 'pdf-avion-vuelo-y-compania', JSON.stringify([av.modo, av.numero, av.compania]))
  debe(av.localizador === 'ABC123' && av.asiento === '14C', 'pdf-avion-localizador-y-asiento', JSON.stringify([av.localizador, av.asiento]))
  debe(av.horaSalida === '08:30' && av.horaLlegada === '10:25' && av.fecha === '2026-12-05', 'pdf-avion-horas-y-fecha', JSON.stringify([av.horaSalida, av.horaLlegada, av.fecha]))
  debe(av.origen.codigo === 'BCN' && av.destino.codigo === 'FCO' && av.origen.ciudad === 'Barcelona' && av.destino.ciudad === 'Roma', 'pdf-avion-aeropuertos-y-ciudades', JSON.stringify([av.origen, av.destino]))
  debe(av.origen.terminal === '1' && av.origen.puerta === 'B34', 'pdf-avion-terminal-y-puerta', JSON.stringify(av.origen))
  debe(av.duracionMin === 115, 'pdf-avion-duracion-1h55', String(av.duracionMin))
  debe(av.fuentes.includes('codigo') && av.fuentes.includes('servidor'), 'pdf-avion-las-dos-fuentes', JSON.stringify(av.fuentes))
  debe(av.codigo?.formato === 'aztec' && av.codigo.texto?.startsWith('M1') && av.codigo.texto.includes('BCNFCO'), 'pdf-avion-codigo-aztec-decodificado', JSON.stringify([av.codigo?.formato, av.codigo?.texto?.slice(0, 12)]))
  debe(av.codigo?.dibujo?.startsWith('data:image/svg+xml;base64,') && av.codigo?.imagen?.startsWith('data:image/png;base64,'), 'pdf-avion-codigo-redibujado-y-recortado', 'dibujo+imagen')
  debe(av.codigo?.imagen && av.codigo.imagen.length < 130_000, 'pdf-avion-recorte-pequeno', String(av.codigo?.imagen?.length))
  debe(REAL || av.__enviado.length === 1 && av.__enviado[0].tipo === 'application/pdf', 'pdf-avion-manda-el-pdf-al-servidor', JSON.stringify(av.__enviado))
  debe(!JSON.stringify({ ...av, codigo: null }).includes('PRUEBA'), 'pdf-avion-el-nombre-no-sale-en-los-datos', 'sin nombre fuera del código')
  // El redibujo se lee otra vez igual (se rasteriza el SVG en node y se decodifica).
  if (av.codigo?.dibujo) {
    const svg = Buffer.from(av.codigo.dibujo.split(',')[1], 'base64')
    const pngSalida = await sharp(svg, { density: 300 }).flatten({ background: '#fff' }).resize({ width: 600, kernel: 'nearest' }).png().toBuffer()
    const lectura = await readBarcodes(pngSalida, { formats: ['Aztec'], tryHarder: true })
    debe(lectura[0]?.text === av.codigo.texto, 'pdf-avion-el-redibujo-se-lee-igual', JSON.stringify(lectura[0]?.text))
  }

  console.log('== B) Captura de tren (PNG) ==')
  const tr = await leer('captura_tren_ejemplo.png', 'image/png', LECTURA_TREN)
  console.log(`   ${tr.__ms} ms · fuentes ${tr.fuentes} · enviado ${JSON.stringify(tr.__enviado)} · código ${tr.codigo?.formato}`)
  debe(tr.modo === 'tren' && tr.numero === '03180' && tr.compania === 'Renfe', 'png-tren-numero-y-compania', JSON.stringify([tr.modo, tr.numero, tr.compania]))
  debe(tr.coche === '003' && tr.asiento === '01D' && tr.localizador === 'XYZ789', 'png-tren-coche-asiento-localizador', JSON.stringify([tr.coche, tr.asiento, tr.localizador]))
  debe(tr.origen.nombre === 'Barcelona-Sants' && tr.destino.nombre === 'Madrid-Puerta de Atocha', 'png-tren-estaciones', JSON.stringify([tr.origen.nombre, tr.destino.nombre]))
  debe(tr.duracionMin === 182, 'png-tren-duracion-3h2', String(tr.duracionMin))
  debe(tr.fuentes.length === 1 && tr.fuentes[0] === 'servidor', 'png-tren-solo-servidor-no-es-bcbp', JSON.stringify(tr.fuentes))
  debe(tr.codigo?.formato === 'qr' && tr.codigo.texto?.startsWith('RENFE|03180'), 'png-tren-qr-decodificado', JSON.stringify([tr.codigo?.formato, tr.codigo?.texto]))
  debe(tr.codigo?.dibujo?.startsWith('data:image/svg+xml;base64,') && tr.codigo?.imagen?.startsWith('data:image/png;base64,'), 'png-tren-qr-redibujado-y-recortado', 'dibujo+imagen')
  debe(REAL || tr.__enviado.length === 1 && tr.__enviado[0].tipo === 'image/jpeg' && tr.__enviado[0].kb < 1500, 'png-tren-manda-jpeg-reducido', JSON.stringify(tr.__enviado))
  if (tr.codigo?.dibujo) {
    const svg = Buffer.from(tr.codigo.dibujo.split(',')[1], 'base64')
    const pngSalida = await sharp(svg, { density: 300 }).flatten({ background: '#fff' }).resize({ width: 600, kernel: 'nearest' }).png().toBuffer()
    const lectura = await readBarcodes(pngSalida, { formats: ['QRCode'], tryHarder: true })
    debe(lectura[0]?.text === tr.codigo.texto, 'png-tren-el-redibujo-se-lee-igual', JSON.stringify(lectura[0]?.text))
  }

  if (!REAL) {
    console.log('== B) Sin servidor (cae o no hay red): se queda con lo del código ==')
    const sin = await leer('tarjeta_avion_ejemplo.pdf', 'application/pdf', null)
    debe(sin.fuentes.length === 1 && sin.fuentes[0] === 'codigo', 'sin-servidor-solo-el-codigo', JSON.stringify(sin.fuentes))
    debe(sin.numero === 'VY 6102' && sin.asiento === '14C' && sin.localizador === 'ABC123' && sin.origen.ciudad === 'Barcelona' && sin.destino.ciudad === 'Roma', 'sin-servidor-datos-del-bcbp', JSON.stringify([sin.numero, sin.asiento, sin.localizador, sin.origen.ciudad, sin.destino.ciudad]))
    debe(sin.horaSalida === null && sin.duracionMin === null, 'sin-servidor-sin-horas-sin-duracion', JSON.stringify([sin.horaSalida, sin.duracionMin]))
    debe(/^\d{4}-\d{2}-\d{2}$/.test(sin.fecha ?? '') && sin.fecha === '2026-12-05', 'sin-servidor-fecha-del-dia-del-ano', String(sin.fecha))
    debe(sin.codigo?.dibujo != null, 'sin-servidor-el-codigo-se-dibuja-igual', 'dibujo')
    console.log('== B) Un archivo que no es un billete: no revienta ==')
    const basura = JSON.parse(await ev(`(async () => {
      const m = await import('/src/lib/billeteLeer.ts')
      window.fetch = async (u) => String(u).includes('/api/read-ticket') ? new Response('{}', { status: 500 }) : new Response('', { status: 404 })
      const r = await m.leerBillete(new File([new Uint8Array([1, 2, 3, 4])], 'nada.pdf', { type: 'application/pdf' }))
      const r2 = await m.leerBillete(new File(['hola'], 'nada.png', { type: 'image/png' }))
      return JSON.stringify([r, r2])
    })()`))
    debe(basura.every((x) => x.numero === null && x.codigo === null && x.fuentes.length === 0), 'basura-devuelve-vacio-sin-lanzar', JSON.stringify(basura).slice(0, 200))
  }
} finally {
  await a.cerrar()
}

console.log(`\nPrueba de la Tanda 10S5 (M): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ ${f.regla}: ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
