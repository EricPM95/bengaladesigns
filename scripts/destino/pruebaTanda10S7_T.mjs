// Tanda 10S7 (agente T) · apartados 5, 6 y 7:
//   5 · el alojamiento con su reserva (A1 [Añadir tu reserva] y A2 con los datos; sin código; se puede cambiar a mano; con otra dirección, pregunta antes de cambiarla);
//   6 · los dos puntos nuevos de la lista del pase (Pase Lista + data/pase/incluye.json), con lo que dicen de verdad;
//   7 · «Empezar de cero» no devuelve las pruebas gastadas (la migración 0072 y COMPROBAR_0072; el comportamiento en la base de datos lo prueba pruebaTanda10J, que también se pasa).
// Capturas docs/dias/capturas_jutrip/10s7_alojamiento_<version>_<n>.jpg (390 x 844).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S7_T.mjs
// (Con SOLO_SECO=1 se pasa solo la parte sin navegador: servidor, funciones, migración y lista.)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const fallos = []
let comprobaciones = 0
let pasadaActual = ''
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ regla, texto: `${pasadaActual ? `(${pasadaActual}) ` : ''}${texto}` })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/^\s*--.*$/gm, '').replace(/\s--.*$/gm, '')

/* ───────────────────────── A. Lo que no necesita navegador ───────────────────────── */
console.log('A. El servidor que lee la reserva')
const { limpiarLecturaAlojamiento, LEER_ALOJAMIENTO_SISTEMA } = await import(pathToFileURL(path.resolve('server/billete/lecturaAlojamiento.js')).href)
{
  const buena = limpiarLecturaAlojamiento({ nombre: ' Hotel  Palatino ', direccion: 'Via Cavour 12, Roma', entrada: '2026-11-26', salida: '2026-11-29', noches: 3, hora_entrada: '15:00', hora_salida: '11:00', telefono: '+39 06 1234 5678', localizador: 'HX48K2' })
  debe(buena.nombre === 'Hotel Palatino' && buena.direccion === 'Via Cavour 12, Roma' && buena.entrada === '2026-11-26' && buena.salida === '2026-11-29' && buena.noches === 3, 'servidor', 'lee nombre, dirección, fechas y noches')
  debe(buena.hora_entrada === '15:00' && buena.hora_salida === '11:00' && buena.telefono === '+39 06 1234 5678' && buena.localizador === 'HX48K2', 'servidor', 'y las horas, el teléfono y el localizador')
  const rara = limpiarLecturaAlojamiento({ nombre: 12, entrada: '26/11/2026', salida: '2026-13-45', noches: 'tres', hora_entrada: '25:99', telefono: '12', localizador: '', huesped: 'Ana Pérez', pago: '4111 1111 1111 1111' })
  debe(Object.values(rara).every((v) => v === null), 'servidor', 'lo que no tiene la forma buena es null (fechas mal escritas, hora 25:99, teléfono de 2 cifras): la app no inventa')
  debe(!('huesped' in rara) && !('pago' in rara), 'servidor', 'el nombre del huésped y los datos de pago no se devuelven aunque la IA los trajera')
  debe(limpiarLecturaAlojamiento({ entrada: '2026-11-29', salida: '2026-11-26' }).salida === null, 'servidor', 'una salida anterior a la entrada se descarta')
  debe(JSON.stringify(limpiarLecturaAlojamiento(null)) === JSON.stringify(limpiarLecturaAlojamiento({})), 'servidor', 'sin nada, todo null y sin fallar')
  debe(/NUNCA inventes/.test(LEER_ALOJAMIENTO_SISTEMA) && /No devuelvas el nombre de ning/.test(LEER_ALOJAMIENTO_SISTEMA) && !/codigo_caja/.test(LEER_ALOJAMIENTO_SISTEMA), 'servidor', 'la petición a la IA no deja inventar, no pide al huésped y no pide ningún código (los hoteles no lo usan)')
}
{
  // La ruta de verdad con una IA de mentira: tipo «alojamiento» usa SU petición y su limpieza; sin tipo, el billete de siempre; con tipo «entrada», la entrada.
  const { registrarLeerBillete } = await import(pathToFileURL(path.resolve('server/billete/lectura.js')).href)
  let manejador = null
  const llamadas = []
  const respuestaIA = { content: [{ type: 'text', text: '{"nombre":"Hotel Palatino","entrada":"2026-11-26","salida":"2026-11-29","noches":3,"localizador":"HX48K2","huesped":"Ana"}' }] }
  const costes = []
  registrarLeerBillete({ post: (ruta, ...fs) => { if (ruta === '/api/read-ticket') manejador = fs.at(-1) } }, { // (10S8: antes → un manejador → ahora puerta + cuerpo + manejador; se llama al último con la sesión ya comprobada. Decisión de Eric, 10S8, 31-oct)
    anthropic: { messages: { create: async (p) => { llamadas.push(p); return respuestaIA } } },
    MODEL: 'modelo-de-prueba',
    logCallCost: (nombre) => costes.push(nombre),
    extractJsonText: (t) => t,
    logAnthropicError: () => {},
  })
  const pedir = async (cuerpo) => {
    let salida = { estado: 200, json: null }
    await manejador({ body: cuerpo, usuarioLectura: { id: 'prueba' } }, { status(c) { salida.estado = c; return this }, json(j) { salida.json = j } })
    return salida
  }
  const archivo = { media_type: 'image/png', data: 'AAAA' }
  const r1 = await pedir({ file: archivo, tipo: 'alojamiento', year_hint: 2026 })
  debe(r1.estado === 200 && r1.json.nombre === 'Hotel Palatino' && r1.json.localizador === 'HX48K2' && r1.json.entrada === '2026-11-26' && !('huesped' in r1.json), 'servidor', 'POST /api/read-ticket con tipo «alojamiento» devuelve la reserva limpia (sin el huésped)')
  debe(llamadas[0].system === LEER_ALOJAMIENTO_SISTEMA && costes[0] === 'read-lodging-booking', 'servidor', 'usa la petición del alojamiento y apunta su coste aparte')
  const r2 = await pedir({ file: archivo })
  debe(r2.json && 'hora_salida' in r2.json && 'origen' in r2.json && llamadas[1].system !== LEER_ALOJAMIENTO_SISTEMA && costes[1] === 'read-ticket', 'servidor', 'sin tipo, el billete de siempre no cambia')
  const r3 = await pedir({ file: archivo, tipo: 'entrada' })
  debe(r3.json && 'personas' in r3.json && costes[2] === 'read-entry-ticket', 'servidor', 'con tipo «entrada», la entrada de siempre no cambia')
  const r4 = await pedir({ tipo: 'alojamiento' })
  debe(r4.estado === 400, 'servidor', 'sin archivo, 400 y no se llama a la IA')
}

console.log('A. Las funciones de la reserva')
{
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-10s7t-'))
  const salida = path.join(carpeta, 'reserva.mjs')
  await build({ entryPoints: ['src/lib/reservaAlojamiento.ts'], outfile: salida, bundle: true, platform: 'node', format: 'esm', logLevel: 'error' })
  const M = await import(pathToFileURL(salida).href)
  debe(M.nochesEntre('2026-11-26', '2026-11-29') === 3 && M.nochesEntre('2026-11-26', '2026-11-26') === null && M.nochesEntre(null, '2026-11-29') === null && M.nochesEntre('2026-11-29', '2026-11-26') === null, 'funciones', 'las noches salen de las dos fechas (3), y sin fechas o con la salida antes, null')
  debe(M.nochesEntre('2026-10-30', '2026-11-02') === 3, 'funciones', 'también cruzando de mes')
  debe(M.textoFechasReserva({ entrada: '2026-11-26', salida: '2026-11-29', noches: 3 }) === 'Jueves 26 → Domingo 29 · 3 noches', 'funciones', 'las fechas se escriben como en Design: «Jueves 26 → Domingo 29 · 3 noches»')
  debe(M.textoFechasReserva({ entrada: '2026-10-30', salida: '2026-11-02', noches: null }) === 'Viernes 30 octubre → Lunes 2 noviembre · 3 noches', 'funciones', 'con meses distintos, con el mes (y las noches calculadas)')
  debe(M.textoFechasReserva({ entrada: null, salida: null, noches: 2 }) === '2 noches' && M.textoFechasReserva({ entrada: null, salida: null, noches: null }) === null, 'funciones', 'solo noches: «2 noches»; nada: null')
  debe(M.textoHorasReserva({ horaEntrada: '15:00', horaSalida: '11:00' }) === 'Entrada desde las 15:00 · Salida hasta las 11:00' && M.textoHorasReserva({ horaEntrada: '15:00', horaSalida: null }) === 'Entrada desde las 15:00' && M.textoHorasReserva({ horaEntrada: null, horaSalida: null }) === null, 'funciones', 'las horas, como en Design, y solo las que haya')
  debe(M.direccionesDistintas('Via Cavour 12, Roma', 'Via Marsala 5, Roma') === true && M.direccionesDistintas('Via Cavour, 12', 'via cavour 12') === false && M.direccionesDistintas('Via Cavour 12, Roma', 'Via Cavour 12') === false && M.direccionesDistintas('Via Cavour 12', null) === false && M.direccionesDistintas('Calle Mayor 1', 'Via Cavour 12') === true, 'funciones', 'direcciones distintas: otra calle sí; la misma escrita de otra forma, no; si no había ninguna, no hay nada que preguntar')
  const r = M.reservaDeCampos({ direccion: ' Via Cavour 12 ', entrada: '2026-11-26', salida: '2026-11-29', noches: '9', horaEntrada: '15:00', horaSalida: '', telefono: '', localizador: ' hx48k2 ' })
  debe(r.noches === 3 && r.localizador === 'HX48K2' && r.horaSalida === null && r.direccion === 'Via Cavour 12', 'funciones', 'al guardar: las noches salen de las fechas (no de lo escrito), el localizador en mayúsculas y lo vacío, null')
  debe(M.reservaConDatos(M.reservaVacia()) === false && M.reservaConDatos(r) === true, 'funciones', 'una reserva sin ni un dato es como no tenerla')
  fs.rmSync(carpeta, { recursive: true, force: true })
}

console.log('A. La migración 0072 (empezar de cero no devuelve las pruebas)')
{
  const m71 = sinComentarios(leer('supabase/migrations/0071_empezar_de_cero_billetes.sql'))
  const m72 = sinComentarios(leer('supabase/migrations/0072_empezar_de_cero_no_devuelve_pruebas.sql'))
  const lineas = (t) => t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const l71 = lineas(m71)
  const l72 = lineas(m72)
  const quitadas = l71.filter((l) => !l72.includes(l))
  const nuevas = l72.filter((l) => !l71.includes(l))
  debe(JSON.stringify(quitadas.sort()) === JSON.stringify(["('historia_de_prueba', 'user_id'),", "('hoy_prueba', 'user_id'),"]), 'migracion', `el diff con la 0071 (la última versión de la función) quita SOLO hoy_prueba e historia_de_prueba (quita: ${quitadas.join(' | ')})`)
  debe(nuevas.length === 0, 'migracion', `y no añade nada (añade: ${nuevas.join(' | ') || 'nada'})`)
  debe(!/hoy_prueba|historia_de_prueba/.test(m72), 'migracion', 'el código de la 0072 no nombra las pruebas: nunca se borran')
  debe(!fs.readdirSync('supabase/migrations').some((f) => /^0072_/.test(f) && f !== '0072_empezar_de_cero_no_devuelve_pruebas.sql'), 'migracion', 'una sola migración 0072')
  debe(/create or replace function public\.empezar_de_cero/.test(m72) && /revoke all on function public\.empezar_de_cero\(uuid\) from public, anon, authenticated/.test(m72) && /grant execute on function public\.empezar_de_cero\(uuid\) to service_role/.test(m72), 'migracion', 'vuelve a crear la función con create or replace y solo el servidor puede llamarla')
  const c = leer('docs/dias/COMPROBAR_0072.sql')
  debe(/'Aplicada'/.test(c) && /'FALTA'/.test(c) && /not like '%hoy_prueba%'/.test(c) && /not like '%historia_de_prueba%'/.test(c) && /like '%billetes_personales%'/.test(c), 'migracion', 'COMPROBAR_0072.sql devuelve «Aplicada» o «FALTA» según nombre o no las dos pruebas (y que siga borrando lo demás)')
  const j = leer('scripts/destino/pruebaTanda10J.mjs')
  debe(/COMPROBAR_0072/.test(j) && /0072_empezar_de_cero_no_devuelve_pruebas/.test(j) && /las pruebas gastadas SE QUEDAN/.test(j), 'migracion', 'pruebaTanda10J está al día con la 0072 (falla con la 0072 mala: se comprobó cambiándola por la 0071)')
  const regla = leer('CLAUDE.md')
  debe(/0072/.test(regla), 'migracion', 'la regla de CLAUDE.md dice cuál es ahora la última versión de la función')
}

console.log('A. La lista del pase')
{
  const gen = leer('src/components/pase/lista/disenoLista.ts')
  const diseno = leer('docs/diseno/proyecto/Piezas/Pase Lista.dc.html')
  const filas = [...gen.matchAll(/"titulo": "([^"]*)",\s*"linea": "([^"]*)"/g)].map((m) => ({ titulo: m[1], linea: m[2] }))
  const idx = (t) => filas.findIndex((f) => f.titulo === t)
  const i1 = idx('Tu día, reorganizado en un toque')
  debe(i1 >= 0 && filas[i1].linea === 'Optimizamos tu ruta para que no pierdas tiempo.', 'lista', 'sale «Tu día, reorganizado en un toque» · «Optimizamos tu ruta para que no pierdas tiempo.»')
  debe(i1 >= 1 && filas[i1 - 1].titulo === 'Tu ruta se adapta a tu vuelo', 'lista', '…justo después de «Tu ruta se adapta a tu vuelo», como Design')
  const i2 = idx('Adaptamos tu viaje al mejor orden')
  debe(i2 === i1 + 1, 'lista', '«Adaptamos tu viaje al mejor orden» va a continuación (en el sitio de «Los días, en el mejor orden»)')
  debe(idx('Los días, en el mejor orden') === -1, 'lista', 'ya no está «Los días, en el mejor orden»')
  debe(i2 >= 0 && filas[i2].linea === 'Ordenamos tus días según tu llegada, tu vuelta y los cierres de los monumentos.', 'lista', 'la frase del segundo dice solo lo que hace el motor: llegada, vuelta y cierres')
  debe(!/tus prioridades/.test(gen) && /tus prioridades/.test(diseno), 'lista', 'Design decía «según tus prioridades» (no es verdad: el viajero no elige prioridades para ordenar los días): el prompt manda y la frase lo dice como es')
  debe(diseno.includes('Adaptamos tu viaje al mejor orden') && diseno.includes('Tu día, reorganizado en un toque'), 'lista', 'los dos títulos son los de Design')
  const inc = JSON.parse(leer('data/pase/incluye.json')).ventajas
  const doc = leer('docs/dias/GRATIS_Y_PASE.md')
  const norm = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const nueva = inc.find((v) => v.id === 'reorganizar_dia')
  debe(Boolean(nueva) && nueva.grupo === 'Antes del viaje' && norm(doc).includes(norm(nueva.origen)), 'lista', 'data/pase/incluye.json tiene «reorganizar_dia» y sale de una línea de GRATIS_Y_PASE.md')
  debe(inc.find((v) => v.id === 'orden_dias')?.texto === 'El orden de los días según tu llegada, tu vuelta y los cierres', 'lista', 'y «orden_dias» dice lo mismo que la frase de la lista')
  // «Solo si es verdad»: el botón del apartado 2 existe de verdad (lo hace el agente R) y el motor ordena por llegada, vuelta y cierres.
  debe(fs.existsSync('src/components/reorganizar/ReorganizarHost.tsx') && /Reorganizar este d/.test(leer('src/components/route/dayDetail/DayMenu.tsx') + leer('src/components/ui/HojaOpciones.tsx')), 'lista', 'el botón «Reorganizar» y «Reorganizar este día» existen en la app (el primer punto es verdad)')
  const orden = leer('shared/routeEngine/listasOrden.js')
  debe(/fechas_malas/.test(orden) && /closedThatDay|specialHoursToAvoid/.test(orden) && /D1-corto/.test(orden), 'lista', 'el motor ordena los días por la llegada (D1-corto), los cierres y las fechas malas (el segundo punto es verdad, sin decir que es solo del pase)')
}

if (process.env.SOLO_SECO) {
  console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos (solo la parte sin navegador)`)
  for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────────────────────── B. La pantalla (navegador) ───────────────────────── */
const { abrirApp } = await import('./_enLaApp.mjs')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const foto = (version, n) => path.join(SALIDA, `10s7_alojamiento_${version}_${n}.jpg`)
const PNG = path.resolve('scripts/destino/_ejemplos_billete/captura_tren_ejemplo.png')
const LECTURA = { nombre: 'Hotel Palatino', direccion: 'Via Cavour 12, Roma', entrada: '2026-11-26', salida: '2026-11-29', noches: 3, hora_entrada: '15:00', hora_salida: '11:00', telefono: '+39 06 1234 5678', localizador: 'HX48K2' }

async function pasada(version) {
  const sin = version === 'gratis'
  pasadaActual = sin ? 'sin pase' : 'con pase'
  console.log(`\nB. La pantalla ${pasadaActual}`)
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
    await a.cdp('Page.setInterceptFileChooserDialog', { enabled: true }).catch(() => undefined)
    // La IA que lee, de mentira: la respuesta guardada (o un error) y lo que le llega se apunta.
    await ev(`(() => { window.__lectura = ${JSON.stringify(LECTURA)}; window.__falla = false; window.__peticiones = []; const f0 = window.fetch.bind(window); window.fetch = async (u, o) => { if (String(u).includes('/api/read-ticket')) { try { window.__peticiones.push(JSON.parse(o.body)) } catch {} return window.__falla ? new Response('{}', { status: 502 }) : new Response(JSON.stringify(window.__lectura), { status: 200, headers: { 'Content-Type': 'application/json' } }) } return f0(u, o) }; return true })()`)

    const ruta = (js) => ev(`(() => { const st = window.__ruta.getState(); ${js}; return true })()`)
    const estado = (js) => ev(`(() => { const st = window.__ruta.getState(); return ${js} })()`)
    const vaAReservas = async () => {
      await ev("window.__ruta.getState().setMode('bookings'); true")
      await a.esp(1500)
    }
    const abrirBloque = async () => {
      if (!(await ev("Boolean(document.querySelector('[data-blk=\"aloj\"] [data-alojamiento-caja]'))"))) {
        await ev("document.querySelector('[data-blk=\"aloj\"] [data-cabecera-clara]')?.click(); true")
        await a.esp(700)
      }
    }
    const cerrarHojas = async () => {
      for (let i = 0; i < 6 && (await ev("Boolean(document.querySelector('[role=dialog]'))")); i++) {
        await ev("(() => { const d = document.querySelector('[role=dialog]'); const b = d.querySelector('button[aria-label=Cerrar]'); if (b) b.click(); return true })()")
        await a.esp(500)
      }
    }
    // Para las capturas: la caja del alojamiento entera a la vista (con el bloque pegado abajo para que se vea todo hasta «Eliminar alojamiento»).
    const verLaCaja = async () => {
      await ev(`(() => { const e = document.querySelector('[data-blk="aloj"] [data-alojamiento-caja]'); if (e) e.scrollIntoView({ block: 'end' }); return true })()`)
      await a.esp(500)
    }
    const textoBloque = () => ev("(document.querySelector('[data-blk=\"aloj\"]')?.innerText || '').replace(/\\s+/g, ' ')")
    const ponCampo = (clave, valor) =>
      ev(`(() => { const e = document.querySelector('[role=dialog] [data-reserva-aloj-campo="${clave}"]'); if (!e) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
    const campo = (clave) => ev(`document.querySelector('[role=dialog] [data-reserva-aloj-campo="${clave}"]')?.value ?? null`)
    const subirArchivo = async () => {
      await ev("document.querySelector('[data-blk=\"aloj\"] [data-reserva-aloj-anadir]')?.click(); true")
      await a.esp(300)
      const doc = await a.cdp('DOM.getDocument', { depth: 1 })
      const nodo = await a.cdp('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '[data-reserva-aloj-archivo]' })
      await a.cdp('DOM.setFileInputFiles', { nodeId: nodo.result.nodeId, files: [PNG] })
      return a.hasta("Boolean(document.querySelector('[role=dialog] [data-reserva-aloj-campos]'))", { segundos: 60 })
    }
    const hotelDelStore = () => estado("(() => { const r = st.route; const id = r.days[0].id; return st.accommodationSelections[id] ?? null })()")

    // Un hotel puesto (sin reserva), la zona (con pase) y, con pase, una dirección que ya había.
    await ruta(`
      const r = st.route
      window.__ruta.setState({ route: { ...r, accommodationZone: ${sin ? 'null' : "'centro'"}, accommodationAddress: ${sin ? 'null' : "'Via Marsala 5, Roma'"} } })
      window.__ruta.getState().setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' } })`)
    await vaAReservas()
    await abrirBloque()

    // antes → ahora → decisión de Eric (10S8, 31-oct): A1 con «Desde el PDF…», cabecera con 2 líneas y «Eliminar alojamiento» → A1 de Design (sin ayuda, cabecera sin línea de texto, papelera roja, el precio como «280 €»); sin pase el botón lleva candado y abre el aviso.
    /* ── 1. A1: sin reserva ── */
    const a1 = await ev(`(() => {
      const b = document.querySelector('[data-blk="aloj"]')
      const cab = b.querySelector('[data-cabecera-clara]')
      return {
        boton: b.querySelector('[data-anadir-doc]')?.textContent.trim() ?? null,
        candado: b.querySelector('[data-anadir-doc]')?.getAttribute('data-con-candado') ?? null,
        ayuda: b.querySelector('[data-reserva-aloj-ayuda]')?.textContent.trim() ?? null,
        filas: b.querySelectorAll('[data-reserva-aloj-fila], [data-fila-design="horas"], [data-fila-design="telefono"]').length,
        cabecera: Array.from(cab?.children ?? []).map((x) => x.textContent.trim()).filter(Boolean),
        codigo: Boolean(b.querySelector('[data-billete-codigo-pequeno], [data-billete-ampliar], canvas, img[src^="data:image/svg"]')),
        precio: b.querySelector('[data-alojamiento-precio]')?.textContent ?? null,
        eliminar: b.querySelector('[data-papelera="alojamiento"]') ? 'papelera' : null,
      }
    })()`)
    debe(a1.boton === 'Añadir tu reserva' && a1.ayuda === null && a1.candado === (sin ? '1' : '0'), 'a1', `A1: [Añadir tu reserva] sin línea de ayuda, con candado solo sin pase (${a1.boton} · ${a1.candado})`)
    debe(a1.filas === 0 && a1.codigo === false, 'a1', 'A1: sin filas de reserva y SIN código')
    debe(a1.cabecera.length === 2 && a1.cabecera[0] === 'Alojamiento' && !/noches/.test(a1.cabecera.join(' ')), 'cabecera', `la cabecera sin línea debajo del título (solo el estado): ${JSON.stringify(a1.cabecera)}`)
    debe(a1.precio?.includes('280') && a1.eliminar === 'papelera', 'diez_s4', `sigue lo de la 10S4: el precio y la papelera abajo a la derecha (${a1.precio} · ${a1.eliminar})`)
    await verLaCaja()
    await a.captura(foto(version, '01_a1_sin_reserva'))

    // antes → ahora → decisión de Eric (10S8, 31-oct): sin pase se leía el archivo → ahora leer es del pase: el botón abre el aviso del pase y la reserva se siembra como guardada de antes (lo guardado se ve sin pase).
    if (sin) {
      await ev("document.querySelector('[data-blk=\"aloj\"] [data-anadir-doc]')?.click(); true")
      await a.esp(900)
      const aviso = await ev("(document.querySelector('[data-aviso-pase]')?.innerText ?? '').replace(/\\s+/g, ' ')")
      debe(/guardas tu reserva y tienes la dirección, las horas y el teléfono a mano, aunque no haya internet/.test(aviso), 'leer', 'sin pase, [Añadir tu reserva] abre el aviso del pase y no el selector de archivos')
      debe((await ev('window.__peticiones')).length === 0, 'leer', 'y no se lee nada (no se llama a la IA)')
      await ev("document.querySelector('[data-aviso-pase]')?.closest('[role=dialog]')?.querySelector('button[aria-label=Cerrar]')?.click(); true")
      await a.esp(500)
      await ruta("const id = st.route.days[0].id; const h = st.accommodationSelections[id]; window.__ruta.getState().setAccommodationHotel(id, { ...h, reserva: { direccion: 'Via Cavour 12, Roma', entrada: '2026-11-26', salida: '2026-11-29', noches: 3, horaEntrada: '15:00', horaSalida: '11:00', telefono: '+39 06 1234 5678', localizador: null } }); import('/src/store/useBilleteStore.ts').then((m) => m.useBilleteStore.getState().ponerAlojamiento(m.useBilleteStore.getState().tripId, id, 'HX48K2'))")
      await a.esp(1200)
      await abrirBloque()
    } else {
    /* ── 2. Leer el archivo: la hoja sale rellena ── */
    const leyo = await subirArchivo()
    debe(leyo, 'leer', 'al elegir el archivo sale la hoja «Tu reserva» con lo leído')
    const pet = await ev('window.__peticiones')
    debe(pet.length === 1 && pet[0].tipo === 'alojamiento', 'leer', `la petición lleva tipo «alojamiento» (${JSON.stringify(pet.map((p) => p.tipo))})`)
    const campos = {}
    for (const k of ['nombre', 'direccion', 'entrada', 'salida', 'noches', 'horaEntrada', 'horaSalida', 'telefono', 'localizador']) campos[k] = await campo(k)
    debe(campos.nombre === 'Hotel Palatino' && campos.direccion === 'Via Cavour 12, Roma' && campos.entrada === '2026-11-26' && campos.salida === '2026-11-29' && campos.noches === '3', 'leer', `rellena nombre, dirección, fechas y noches (${JSON.stringify(campos)})`)
    debe(campos.horaEntrada === '15:00' && campos.horaSalida === '11:00' && campos.telefono === '+39 06 1234 5678' && campos.localizador === 'HX48K2', 'leer', 'y hora de entrada y de salida, teléfono y localizador')
    debe((await ev("document.querySelector('[role=dialog] [data-reserva-aloj-aviso]')?.textContent")).startsWith('Esto es lo que hemos leído'), 'leer', 'la hoja dice que es lo leído y que se puede cambiar')

    // Con pase y otra dirección: pregunta antes de cambiarla.
    const pregunta = await ev("Boolean(document.querySelector('[role=dialog] [data-reserva-aloj-pregunta]'))")
    if (sin) {
      debe(pregunta === false, 'direccion', 'sin pase no hay pregunta (la dirección de «Cómo llegar» es del pase y no se toca)')
    } else {
      debe(pregunta === true, 'direccion', 'con pase y una dirección distinta de la que había: la hoja PREGUNTA cuál se queda')
      const bloqueada = await ev("document.querySelector('[role=dialog] [data-reserva-aloj-guardar]')?.disabled === true")
      debe(bloqueada, 'direccion', 'y no deja guardar hasta que se elige')
      await a.captura(foto(version, '02_pregunta_direccion'))
      await ev("document.querySelector('[role=dialog] [data-reserva-aloj-direccion=\"antes\"]')?.click(); true")
      await a.esp(300)
    }
    await ev("document.querySelector('[role=dialog] [data-reserva-aloj-guardar]')?.click(); true")
    await a.esp(1200)
    await cerrarHojas()
    const tras = await hotelDelStore()
    // antes: el localizador iba dentro de la reserva compartida (reserva.localizador === 'HX48K2' / 'ZZ99') → ahora: la reserva compartida NO lo lleva (null) y se ve en la tarjeta porque es privado de quien lo añadió (la tarjeta lo sigue enseñando, comprobado abajo) → decisión de Eric (10S7b, 31-oct).
    debe(tras?.name === 'Hotel Palatino' && tras.reserva?.localizador === null && tras.reserva.noches === 3 && tras.reserva.horaEntrada === '15:00' && tras.reserva.direccion === 'Via Cavour 12, Roma', 'guardar', `la reserva queda dentro del alojamiento (${JSON.stringify(tras?.reserva)})`)
    debe(tras?.precio?.amount === 280, 'guardar', 'y el precio del hotel se conserva')
    const dirViaje = await estado('st.route.accommodationAddress ?? null')
    debe(dirViaje === (sin ? null : 'Via Marsala 5, Roma'), 'direccion', `elegir «La de antes»: la dirección de «Cómo llegar» NO cambia (${dirViaje})`)
    await abrirBloque()

    }

    /* ── 3. A2: con reserva ── */
    // antes → ahora → decisión de Eric (10S8, 31-oct): A2 con cinco filas, «Cambiar los datos» y «Eliminar alojamiento» → A2 de Design (las fechas van en sus cajas, el lápiz del bloque, la papelera).
    const a2 = await ev(`(() => {
      const b = document.querySelector('[data-blk="aloj"]')
      const f = (k) => b.querySelector('[data-fila-design="' + k + '"]')?.textContent.replace(/\\s+/g, ' ').trim() ?? null
      return { boton: Boolean(b.querySelector('[data-anadir-doc]')), direccion: b.querySelector('[data-direccion-tarjeta]')?.textContent ?? null, fechas: (b.querySelector('[data-alojamiento-fechas]')?.innerText ?? '').replace(/\s+/g, ' ') + ' · ' + (b.querySelector('[data-alojamiento-noches]')?.innerText ?? '').replace(/\s+/g, ' '), horas: f('horas'), telefono: f('telefono'), localizador: f('localizador'), lapiz: Boolean(b.querySelector('[data-lapiz="aloj-datos"]')), eliminar: b.querySelector('[data-papelera="alojamiento"]') ? 'papelera' : null, dosDirecciones: b.querySelectorAll('[data-direccion-tarjeta]').length, codigo: Boolean(b.querySelector('[data-billete-codigo-pequeno], canvas, img[src^="data:image/svg"]')) }
    })()`)
    debe(a2.boton === false, 'a2', 'A2: ya no sale [Añadir tu reserva]')
    debe(/Via Cavour 12, Roma$/.test(a2.direccion ?? '') && /Jueves 26 → Domingo 29/i.test(a2.fechas) && /3\s*NOCHES/i.test(a2.fechas) && a2.horas === 'Entrada desde las 15:00 · Salida hasta las 11:00' && a2.telefono === '+39 06 1234 5678' && a2.localizador === 'Localizador HX48K2', 'a2', `A2: dirección, fechas y noches en sus cajas, horas, teléfono y localizador (${JSON.stringify(a2)})`)
    debe(a2.dosDirecciones === 1 && a2.codigo === false, 'a2', 'A2: la dirección sale una sola vez y SIN código')
    debe(a2.lapiz && a2.eliminar === 'papelera', 'a2', 'A2: el lápiz del bloque de datos y la papelera abajo a la derecha')
    if (!sin) {
      const comoLlegar = await ev("Boolean(document.querySelector('[data-blk=\"aloj\"] a[href*=\"Marsala\"], [data-blk=\"aloj\"] a[href*=\"google\"], [data-blk=\"aloj\"] [data-como-llegar-alojamiento]'))")
      debe(comoLlegar, 'a2', 'con pase sigue [Cómo llegar a tu alojamiento]')
      debe(/Zona Centro/.test(await textoBloque()), 'a2', 'con pase sigue la zona (antes «Tu zona»; ahora «Zona Centro · dirección» en una fila)')
    }
    await verLaCaja()
    await a.captura(foto(version, '03_a2_con_reserva'))

    // antes → ahora → decisión de Eric (10S8, 31-oct): la hoja de «Cambiar los datos» con noches y salida → «Datos de la reserva» (A3): dirección, horas, teléfono y localizador; las fechas no se tocan ahí (van con el alojamiento).
    /* ── 4. A mano ── */
    await ev("document.querySelector('[data-blk=\"aloj\"] [data-lapiz=\"aloj-datos\"]')?.click(); true")
    await a.hasta("Boolean(document.querySelector('[role=dialog] [data-reserva-aloj-campos]'))", { segundos: 10 })
    debe((await ev("document.querySelector('[data-hoja-titulo]')?.textContent")) === 'Datos de la reserva' && (await campo('localizador')) === 'HX48K2', 'mano', '«Datos de la reserva» abre la hoja con lo guardado')
    debe((await ev("Boolean(document.querySelector('[role=dialog] [data-reserva-aloj-pregunta]'))")) === false, 'mano', 'al cambiar otro dato a mano, la dirección que ya estaba guardada en la reserva no se vuelve a preguntar')
    await ponCampo('localizador', 'zz99')
    await ponCampo('telefono', '')
    await ev("document.querySelector('[role=dialog] [data-reserva-aloj-guardar]')?.click(); true")
    await a.esp(1000)
    await cerrarHojas()
    const mano = await hotelDelStore()
    debe(mano?.reserva?.localizador === null && mano.reserva.noches === 3 && mano.reserva.telefono === null && mano.reserva.entrada === '2026-11-26', 'mano', `a mano: localizador privado en mayúsculas, sin teléfono y las fechas intactas (${JSON.stringify(mano?.reserva)})`)
    await abrirBloque()
    const filasMano = await textoBloque()
    debe(/Localizador ZZ99/.test(filasMano) && !/\+39/.test(filasMano), 'mano', 'y la tarjeta lo enseña')

    /* ── 5. «Tu alojamiento» no pierde la reserva ── */
    await ev("document.querySelector('[data-blk=\"aloj\"] [data-lapiz=\"aloj-arriba\"]')?.click(); true")
    const hojaAloj = await a.hasta("Boolean(document.querySelector('[role=dialog] [data-guardar-alojamiento]'))", { segundos: 10 })
    if (hojaAloj) {
      await ev("document.querySelector('[role=dialog] [data-guardar-alojamiento]')?.click(); true")
      await a.esp(1200)
      await cerrarHojas()
      const trasAloj = await hotelDelStore()
      debe(trasAloj?.reserva?.noches === 3 && trasAloj.reserva.localizador === null, 'conserva', 'guardar «Tu alojamiento» conserva la reserva (solo cambian el nombre y el precio)')
    } else debe(false, 'conserva', 'no se abre la hoja «Tu alojamiento» desde [Cambiar]')

    /* ── 6. Eliminar alojamiento se lleva la reserva ── */
    await abrirBloque()
    await ev("document.querySelector('[data-blk=\"aloj\"] [data-papelera=\"alojamiento\"]')?.click(); true")
    await a.esp(900)
    debe((await hotelDelStore()) === null, 'eliminar', '«Eliminar alojamiento» quita el hotel y su reserva (con su Deshacer)')

    // antes → ahora → decisión de Eric (10S8, 31-oct): leer es del pase: lo del fallo de lectura solo se prueba con pase.
    if (!sin) {
    /* ── 7. Si no se puede leer ── */
    await ruta("window.__ruta.getState().setAccommodationHotel(st.route.days[0].id, { name: 'Hotel Palatino', precio: null })")
    await a.esp(700)
    await abrirBloque()
    await ev('window.__falla = true; true')
    const sale = await subirArchivo()
    debe(sale, 'fallo', 'si no se puede leer, la hoja sale igual para escribirla a mano')
    debe((await ev("document.querySelector('[role=dialog] [data-reserva-aloj-aviso]')?.textContent")).startsWith('No hemos podido leer la reserva'), 'fallo', 'y lo dice: «No hemos podido leer la reserva. Puedes escribir los datos a mano.»')
    debe((await campo('nombre')) === 'Hotel Palatino' && (await campo('localizador')) === '', 'fallo', 'con el nombre del hotel que ya había y lo demás vacío')
    await a.captura(foto(version, '04_sin_leer'))
    await cerrarHojas()
    debe((await hotelDelStore())?.reserva == null, 'fallo', 'cerrar sin guardar no deja ninguna reserva')
    }
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
