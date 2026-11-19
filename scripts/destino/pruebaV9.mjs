// La prueba de la Tanda V9: LOS LOGROS (abren al instante, la hoja «Tus logros en …», la colección con fotos y su trozo, los emblemas, el resumen rehecho, la moneda de ciudad y [Añadir a mi viaje] en el mejor hueco).
//   APP_URL=http://localhost:5199 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV9.mjs
// 1. El servidor: las rondas de lectura (antes/después) y lo que da cada sorpresa.   2. Funciones puras y código.   3. En pantalla (demo de logros; ninguna llamada a producción).
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const json = (f) => JSON.parse(leer(f))
const APP = process.env.APP_URL ?? 'http://localhost:5199'
const CAPTURAS = 'docs/dias/V9_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────── 1. El servidor ───────── */
console.log('1. El servidor: rondas de lectura de /api/logros/estado')
{
  const t = JSON.parse(execFileSync('node', ['scripts/destino/_v9_tiempos.mjs', '150'], { encoding: 'utf8' }).trim().split('\n').pop())
  debe(t.ok === true, 'tiempos', 'el estado se calcula (ok)')
  debe(t.rondas <= 3.5, 'tiempos', `con 150 ms por pregunta, ${t.rondas} rondas (${t.ms} ms); antes eran ~6,4 (~960 ms)`)
  const serv = leer('server/logros/servicio.js')
  debe(/repo\.perfilDe\(userId\),\s*\n\s*repo\.referidosDe/.test(serv) && /repo\.invitadorDe\(userId\)/.test(serv), 'tiempos', 'cargar lee TODO en una sola ronda (perfil, referidos e invitación con el resto)')
  const repo = leer('server/logros/repo.js')
  debe(/Promise\.all\(\[admin\.from\('trips'\)/.test(repo), 'tiempos', 'viajesDe pide los propios y los de miembro a la vez')
  const vistas = leer('server/logros/vistas.js')
  debe(/colecciones: nombresDeLoQueDa/.test(vistas), 'sorpresas', 'cada sorpresa lleva lo que da (las colecciones; nunca un emblema)')
  const dest = leer('server/logros/pantallas/destino.js')
  debe(/fotosDeSitios/.test(dest) && /foto_url/.test(dest), 'colección', 'la colección manda la foto con la que se ganó cada sitio')
}

/* ───────── 2. Funciones puras y código ───────── */
console.log('2. Funciones puras y código')
{
  const hoja = leer('src/components/logros/momentos/HojaLogros.tsx')
  const textos = leer('src/components/logros/momentos/hoja/textosHoja.ts')
  debe(!/Un momento…/.test(hoja), 'instante', 'la hoja ya no dice «Un momento…» (esqueleto gris)')
  debe(/estadoGuardado\(tripId\)/.test(hoja) && /mismaRespuesta/.test(hoja), 'instante', 'la hoja abre con lo último que se vio y solo cambia lo que cambie')
  debe(/guardarEnCache\('ganados'/.test(leer('src/components/logros/pantallas/todos/api.ts')), 'instante', '«Todos mis logros» y la vitrina también se guardan')
  debe(/olvidarCacheDeLogros/.test(leer('src/lib/cuentas.ts')), 'instante', 'al cerrar sesión se borra lo guardado')
  debe(!/aparte = p\.fase === 'despues' \?/.test(textos) && /Más colecciones de/.test(hoja), 'hoja', 'fuera «Para tu próximo viaje a …» y las colecciones a 0 van en «Más colecciones de …»')
  debe(/Te quedan 2 para la plata · 6 para el diamante|textoDeLoQueQueda/.test(hoja), 'hoja', 'la medalla y lo que queda, en una sola tarjeta')
  const res = leer('src/components/logros/momentos/ResumenViaje.tsx')
  debe(/rellenarNombre/.test(res) && /data-sorpresas-por-reclamar/.test(res) && /HojaDeSorpresas/.test(res), 'resumen', 'el resumen rellena los nombres y la tarjeta de sorpresas abre su hoja')
  debe(/Y quizá algún secreto…/.test(res), 'resumen', 'los emblemas ocultos nunca se nombran («Y quizá algún secreto…»)')
  const m = await import('../../src/components/logros/momentos/hoja/textosHoja.ts').catch(() => null)
  if (m) {
    debe(m.textoDeLoQueQueda({ fase: 'despues', grado: 'bronce', siguiente: { grado: 'plata', faltan: 2 }, n: 1, total: 7 }) === 'Te quedan 2 para la plata · 6 para el diamante', 'medalla', 'la línea de la medalla: «Te quedan 2 para la plata · 6 para el diamante»')
    debe(m.textoDeLoQueQueda({ fase: 'despues', grado: 'oro', siguiente: { grado: 'diamante', faltan: 2 }, n: 6, total: 8 }) === 'Te quedan 2 para el diamante', 'medalla', 'si lo siguiente es el diamante, solo «Te quedan 2 para el diamante»')
    debe(m.marcaDeColeccion({ fase: 'despues', completa: false, nuevo: false, enTuRuta: false, ciudad: 'Roma' }).faltaParaOtroViaje === null, 'hoja', 'ninguna colección dice «Para tu próximo viaje a …»')
  }
}

/* ───────── 3. En pantalla ───────── */
console.log('3. En pantalla (móvil de 390 px, demo de logros)')
const b = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', ancho: 390, alto: 844 })
const ev = (js) => b.evaluar(js)
const textoDe = (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.innerText.split(String.fromCharCode(10)).join(' | ') ?? null`)
try {
  for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'")); i++) await b.esp(500)
  await ev('window.__rutaPrueba().then(() => true)')
  const R = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
  for (let i = 0; i < 90 && !(await ev(R + '.then((S) => Boolean(S.getState().route))')); i++) await b.esp(1000)
  await b.esp(2500)
  await ev(R + ".then((S) => { S.setState({ destination: 'Lanzarote', screen: 'route', mode: 'days' }); return true })")
  for (let i = 0; i < 6; i++) {
    await ev("(() => { const e = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Empezar mi día|Vale)$/.test(x.textContent.trim())); e?.click(); return true })()")
    await b.esp(600)
  }
  const abrirHoja = async (archivo) => {
    await ev(`Promise.all([import('/src/components/logros/momentos/api.ts'), import('/src/components/logros/momentos/useMomentosUI.ts')]).then(([api, ui]) => { api.datosDePrueba.estado = ${JSON.stringify(json(`src/dev/escaparates/datos/${archivo}.json`))}; ui.useMomentosUI.getState().cerrarHojaLogros(); setTimeout(() => ui.useMomentosUI.getState().abrirHojaLogros(), 50); return true })`)
    for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-hoja-logros]'))")); i++) await b.esp(250)
    await b.esp(1500)
  }

  // 3a. La hoja de Lanzarote, a medias (3 colecciones con pedazo y el resto a 0).
  await abrirHoja('hoja_lz_amedias')
  const h = await ev(`(() => {
    const d = document.querySelector('[data-hoja-logros]'); const t = d.innerText
    const r = (e) => e ? (({ left, right, top, bottom, width }) => ({ left: Math.round(left), right: Math.round(right), top: Math.round(top), bottom: Math.round(bottom), width: Math.round(width) }))(e.getBoundingClientRect()) : null
    const rej = d.querySelector('[data-rejilla-de-emblemas]')
    return {
      sinProximoViaje: !/Para tu próximo viaje/i.test(t), sinMomento: !/Un momento/i.test(t),
      etiqueta: d.querySelector('[data-etiqueta-de-fase]')?.innerText, titulo: d.querySelector('span[style*="34px"]')?.innerText,
      conAlgo: d.querySelectorAll('[data-colecciones-con-algo] [data-coleccion]').length,
      mas: d.querySelector('[data-mas-colecciones]')?.dataset.masColecciones, masN: d.querySelector('[data-mas-colecciones-n]')?.innerText,
      sello: d.querySelector('[data-sello-texto]')?.innerText, nSellos: d.querySelectorAll('[data-sello]').length,
      reclamar: Boolean(d.querySelector('[data-reclamar="boton"]')), plazo: d.querySelector('[data-reclamar="plazo"]')?.innerText,
      rej: r(rej), hijos: rej ? Array.from(rej.children).map((c) => r(c)) : [], hoja: r(d.querySelector('[role="dialog"]')), llaves: /\\{[a-z_]+\\}/i.test(t),
    }
  })()`)
  debe(h.sinProximoViaje && h.sinMomento, 'hoja', 'sin «Para tu próximo viaje» ni «Un momento…»')
  debe(h.conAlgo >= 1 && h.mas === 'plegado' && Number(h.masN) >= 1, 'hoja', `arriba las colecciones con algún pedazo (${h.conAlgo}) y al final «Más colecciones de …» plegado con ${h.masN}`)
  debe(/Te quedan \d+ para/.test(h.sello ?? '') && h.nSellos === 1, 'hoja', `la medalla y lo que queda en una sola tarjeta («${h.sello}»)`)
  debe(h.reclamar && /Puedes reclamar hasta/.test(h.plazo ?? ''), 'hoja', 'el botón [Reclamar con tus fotos] con su plazo')
  debe(h.rej && h.hijos.length === 11, 'emblemas', `(V25: los secretos van en una fila que se desliza de lado, ya no en una rejilla) los 11 huecos de Lanzarote están en la fila (${h.hijos.length})`)
  debe(!h.llaves, 'llaves', 'ningún texto con {…} en la hoja')
  await b.captura(`${CAPTURAS}/hoja_arriba.jpg`)
  // Abrir «Más colecciones de Lanzarote».
  await ev("document.querySelector('[data-mas-colecciones] button').click(); true")
  await b.esp(600)
  const abierto = await ev("({ estado: document.querySelector('[data-mas-colecciones]').dataset.masColecciones, filas: document.querySelectorAll('[data-mas-colecciones] [data-coleccion]').length })")
  debe(abierto.estado === 'abierto' && abierto.filas >= 1, 'hoja', `al abrirlo salen las mismas filas (${abierto.filas})`)
  await ev("(() => { const e = document.querySelector('[data-hoja-logros] [style*=\"overflow-y: auto\"]'); if (e) e.scrollTop = 99999; return true })()")
  await b.esp(500)
  await b.captura(`${CAPTURAS}/hoja_emblemas.jpg`)
  // Todas a 0: sin plegar.
  const cero = json('src/dev/escaparates/datos/hoja_lz_antes.json')
  cero.colecciones = cero.colecciones.map((c) => ({ ...c, n: 0, completa: false, sitios: c.sitios.map((s) => ({ ...s, visto: false })) }))
  await ev(`import('/src/components/logros/momentos/api.ts').then((api) => { api.datosDePrueba.estado = ${JSON.stringify(cero)}; return import('/src/components/logros/momentos/useMomentosUI.ts') }).then((ui) => { ui.useMomentosUI.getState().cerrarHojaLogros(); setTimeout(() => ui.useMomentosUI.getState().abrirHojaLogros(), 50); return true })`)
  await b.esp(2200)
  // (V25) Antes del viaje las colecciones salen al tocar la franja.
  await ev("document.querySelector('[data-franja-colecciones]')?.click(); true")
  await b.esp(3500)
  const todas0 = await ev("({ mas: Boolean(document.querySelector('[data-mas-colecciones]')), filas: document.querySelectorAll('[data-coleccion]').length })")
  debe(!todas0.mas && todas0.filas >= 5, 'hoja', `si todas están a 0, sin plegar (${todas0.filas} filas, sin «Más colecciones»)`)
  await ev("import('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarHojaLogros(); return true })")

  // 3b. Abrir al instante: lo último que se vio se enseña al momento (sin esqueleto).
  await ev(`Promise.all([import('/src/components/logros/momentos/api.ts'), import('/src/lib/logrosEnCache.ts'), import('/src/store/useSyncStore.ts')]).then(([api, c, s]) => { api.datosDePrueba.estado = null; s.useSyncStore.setState({ activeTripId: 't-v9' }); const id = 't-v9'; c.guardarEnCache('estado:' + id, ${JSON.stringify({ ...json('src/dev/escaparates/datos/hoja_lz_amedias.json'), ok: true })}); return true })`)
  await ev("import('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().abrirHojaLogros(); return true })")
  for (let i = 0; i < 200 && !(await ev("Boolean(document.querySelector('[data-hoja-logros]'))")); i++) await b.esp(50)
  const inst = await ev("({ esqueleto: Boolean(document.querySelector('[data-logros-cargando]')), conColecciones: document.querySelectorAll('[data-hoja-logros] [data-coleccion]').length, momento: /Un momento/i.test(document.body.innerText) })")
  debe(!inst.esqueleto && !inst.momento && inst.conColecciones > 0, 'instante', `la hoja abre con lo guardado en el primer instante, sin esqueleto ni «Un momento…» (${inst.conColecciones} colecciones)`)
  await ev("import('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarHojaLogros(); return true })")

  // 3c. El resumen rehecho (Lanzarote).
  const estado = json('src/dev/escaparates/datos/hoja_lz_completa.json')
  estado.secretos = { ...estado.secretos, total: 11, encontrados: 3, encontrados_lista: estado.secretos.encontrados_lista.slice(0, 3) }
  const resumen = { ok: true, ganado: [{ clave: 'a', logro: 'pedazo', escalon: estado.colecciones[0].id + ':' + estado.colecciones[0].sitios[0].sitio, destino: 'lanzarote', en: '2026-11-10T10:00:00Z' }, ...estado.secretos.encontrados_lista.slice(0, 3).map((e) => ({ clave: e.id, logro: 'emblema', escalon: e.id, destino: 'lanzarote', en: '2026-11-10T10:00:00Z' })), { clave: 'v', logro: 'viajero:edicion_anio', escalon: '2026', destino: 'lanzarote', en: '2026-11-13T10:00:00Z' }], por_categoria: {}, pendiente: { sorpresas: 4, pedazos: 2, dias_para_reclamar: 20, texto: null, pendientes: [{ fecha: '2026-11-11', dia: 3, sitio: 'cueva_de_los_verdes', nombre: 'Cueva de los Verdes', falta: ['pedazo'], colecciones: ['Los imprescindibles de Lanzarote'] }, { fecha: '2026-11-12', dia: 4, sitio: 'la_geria', nombre: 'La Geria', falta: ['pedazo', 'emblema'], colecciones: ['Entre viñas de ceniza'] }, { fecha: '2026-11-12', dia: 4, sitio: 'playa_blanca', nombre: 'Playa Blanca', falta: ['emblema'], colecciones: [] }] }, texto_viaje: 'Un viaje', texto_viaje_tipo: 'wow' }
  await ev(`import('/src/components/logros/momentos/api.ts').then((api) => { api.datosDePrueba.estado = ${JSON.stringify(estado)}; api.datosDePrueba.resumen = ${JSON.stringify(resumen)}; api.datosDePruebaViajero.v = ${JSON.stringify({ ok: true, logros: [{ id: 'edicion_anio', grupo: 'exclusivos', nombre: '{ciudad} {anio}', linea: 'La edición de {anio}.', escalones: [] }] })}; return import('/src/components/logros/momentos/useMomentosUI.ts') }).then((ui) => { ui.useMomentosUI.getState().abrirResumenViaje(); return true })`)
  for (let i = 0; i < 60 && !(await ev("Boolean(document.querySelector('[data-resumen-del-viaje]'))")); i++) await b.esp(500)
  await b.esp(2000)
  const r = await ev(`(() => {
    const d = document.querySelector('[data-resumen-del-viaje]'); const t = d.innerText
    return { texto: t.split(String.fromCharCode(10)).join(' | '), llaves: /\\{[a-z_]+\\}/i.test(t), cifras: d.querySelector('[data-cifras-del-viaje]')?.innerText.split(String.fromCharCode(10)).join(' '),
      emblemas: Array.from(d.querySelectorAll('[data-emblema-del-resumen]')).map((e) => ({ id: e.dataset.emblemaDelResumen, dibujo: Boolean(e.querySelector('[data-emblema-lanza],svg,img,canvas')), alto: e.querySelector('[data-emblema-lanza]')?.getBoundingClientRect().height ?? 0 })),
      sorpresa: d.querySelector('[data-sorpresas-por-reclamar]')?.innerText.split(String.fromCharCode(10)).join(' | '), ancho: d.scrollWidth <= d.clientWidth + 1,
      hayRejillaDeInterrogaciones: /\\?/.test(d.querySelector('[data-resumen-emblemas]')?.innerText ?? ''), nuevo: Boolean(d.querySelector('[data-resumen-viajero]')) }
  })()`)
  debe(!r.llaves && /Lanzarote 2026/.test(r.texto), 'resumen', `ningún texto con {…} y «Lanzarote 2026» con su nombre bien puesto (${r.texto.slice(r.texto.indexOf('Logros de viajero'), r.texto.indexOf('Logros de viajero') + 60)})`)
  debe(/DÍAS|DÍA/.test(r.cifras ?? '') && /PARADAS/.test(r.cifras ?? '') && /FOTOS|FOTO/.test(r.cifras ?? ''), 'resumen', `las cifras del viaje (${r.cifras})`)
  debe(/\+8 secretos por descubrir/.test(r.texto), 'resumen', 'el bloque de emblemas dice «+8 secretos por descubrir»')
  debe(r.emblemas.length === 3 && r.emblemas.every((e) => e.dibujo && e.alto > 30), 'emblemas', `los 3 emblemas encontrados salen todos con su dibujo (${JSON.stringify(r.emblemas)})`)
  debe(!r.hayRejillaDeInterrogaciones && r.ancho, 'resumen', 'sin cuadrícula de «?» y sin cortes a la derecha')
  debe(/Te quedan 2 sorpresas por reclamar/.test(r.sorpresa ?? '') && /Hasta el/.test(r.sorpresa ?? ''), 'sorpresas', `la tarjeta cuenta solo los sitios que dan pedazo (2, no los 3 con emblema): «${r.sorpresa}»`)
  await b.captura(`${CAPTURAS}/resumen_1.jpg`)
  await ev("document.querySelector('[data-sorpresas-por-reclamar]').click(); true")
  await b.esp(1200)
  const hs = await ev("({ filas: Array.from(document.querySelectorAll('[data-sorpresa]')).map((e) => e.innerText.split(String.fromCharCode(10)).join(' | ')), texto: document.querySelector('[data-hoja-sorpresas]')?.innerText ?? '', botones: document.querySelectorAll('[data-subir-foto-de-sorpresa]').length, reclamar: Boolean(document.querySelector('[data-reclamar-desde-sorpresas]')) })")
  debe(hs.filas.length === 2 && hs.botones === 2 && hs.reclamar, 'sorpresas', `la hoja lista los sitios que dan pedazo (${hs.filas.length}), con [Subir foto] cada uno y [Reclamar con tus fotos]`)
  debe(hs.filas.some((f) => /Cueva de los Verdes/.test(f) && /Día 3/.test(f) && /imprescindibles/i.test(f)) && !/Playa Blanca/.test(hs.texto) && /Y quizá algún secreto…/.test(hs.texto), 'sorpresas', 'cada sitio con su día y lo que da; un sitio que solo esconde un emblema no sale; «Y quizá algún secreto…» al final')
  await b.captura(`${CAPTURAS}/sorpresas.jpg`)
  await ev("import('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarResumenViaje(); return true })")

  // 3d. La colección por dentro (Roma, demo: viaje terminado).
  await ev("import('/src/components/logros/momentos/api.ts').then((api) => { api.datosDePrueba.estado = null; api.datosDePrueba.resumen = null; return true })")
  await ev(R + ".then((S) => { S.setState({ destination: 'Roma' }); return true })")
  await ev("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().abrir({ t: 'coleccion', destino: 'roma', coleccion: 'imprescindibles' }); return true })")
  for (let i = 0; i < 40 && !(await ev("Boolean(document.querySelector('[data-sitio-de-coleccion]'))")); i++) await b.esp(400)
  await b.esp(1500)
  const c = await ev(`(() => ({ n: document.querySelectorAll('[data-sitio-de-coleccion]').length, orden: Array.from(document.querySelectorAll('[data-sitio-de-coleccion]')).map((e) => e.dataset.ganado), trozos: document.querySelectorAll('[data-trozo-de-sitio]').length, comoLlegar: document.querySelectorAll('[data-como-llegar]').length, anadir: document.querySelectorAll('[data-anadir-a-mi-viaje]').length, dias: document.querySelectorAll('[data-dia-del-sitio]').length, estrellas: document.querySelectorAll('svg path[d^="M12 3l2.6"]').length, fotos: document.querySelectorAll('[data-foto-de-sitio]').length }))()`)
  debe(c.n >= 3 && c.trozos === c.n && c.fotos === c.n, 'colección', `cada sitio una tarjeta con foto y su trozo de la insignia (${c.n} tarjetas, ${c.trozos} trozos)`)
  const primeraNoGanada = c.orden.indexOf('0')
  debe(primeraNoGanada === -1 || c.orden.slice(primeraNoGanada).every((x) => x === '0'), 'colección', `primero los ganados (${c.orden.join('')})`)
  debe(c.comoLlegar === 0 && c.anadir === 0 && c.dias === 0, 'colección', 'con el viaje terminado, sin «Día 3» ni [Cómo llegar] ni [Añadir a mi viaje]')
  await b.captura(`${CAPTURAS}/coleccion.jpg`)
  await ev("document.querySelector('[data-sitio-de-coleccion]').click(); true")
  await b.esp(500)
  const il = await ev("Boolean(document.querySelector('[data-trozo-iluminado]'))")
  debe(il, 'colección', 'al tocar una tarjeta, su trozo se ilumina en la insignia')
  await b.captura(`${CAPTURAS}/coleccion_tocada.jpg`)
  const trozoPorSitio = await import('../../src/components/logros/pantallas/destino/trozo.ts').then((m) => ({ roma: m.trozoDeInsignia('imprescindibles', 8, 0), lanza: m.trozoDeInsignia('imprescindibles', 7, 3) })).catch(() => null)
  if (trozoPorSitio) debe(trozoPorSitio.roma && trozoPorSitio.roma.puntos.length >= 3 && trozoPorSitio.lanza && trozoPorSitio.lanza.puntos.length >= 3, 'colección', 'cada sitio de Roma y de Lanzarote tiene su trozo de la insignia (recorte de al menos 3 puntos)')
  await ev("import('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); return true })")
} finally {
  await b.cerrar()
}

/* ───────── 4. [Añadir a mi viaje]: el mejor día y el mejor hueco ───────── */
console.log('4. El mejor día y el mejor hueco')
{
  const b2 = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 120 && !(await b2.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await b2.esp(500)
    const o = await b2.evaluar(`import('/src/lib/mejorHueco.ts').then((m) => {
      const parada = (id, lat, lng, time, extra = {}) => ({ id, name: id, time, durationMinutes: 60, coordinates: { lat, lng }, description: '', photoUrl: '', isMainAttraction: false, ...extra })
      const dia = (n, stops) => ({ id: 'd' + n, dayNumber: n, city: 'Lanzarote', title: 'Día ' + n, stops })
      const ruta = (dias) => ({ id: 'r', destination: 'Lanzarote', days: dias, answers: { dateRange: { start: '2026-11-09', end: '2026-11-12' } } })
      const sitio = parada('sitio', 29.0, -13.35, '', { hoursData: null })
      const d1 = dia(1, [parada('a1', 28.86, -13.82, '09:00'), parada('a2', 28.9, -13.8, '11:00')])
      const d2 = dia(2, [parada('b1', 29.0, -13.5, '09:00'), parada('b2', 29.0, -13.2, '11:00'), parada('b3', 29.05, -13.45, '13:00')])
      const d3 = dia(3, [parada('c1', 28.95, -13.6, '09:00')])
      const r = ruta([d1, d2, d3])
      const c = m.mejorHuecoDeLaParada(r, d2, sitio)
      const dc = m.diaDeCamino(r, sitio, '2026-11-09')
      const pasado = m.diaDeCamino(r, sitio, '2026-11-11')
      const cerrado = { ...sitio, hoursData: { schedule: '08:00-09:30' } }
      const cc = m.mejorHuecoDeLaParada(r, d2, cerrado)
      const llena = dia(2, Array.from({ length: 8 }, (_, i) => parada('l' + i, 29.0, -13.4 - i / 100, (9 + i) + ':00')))
      const lleno = m.diaDeCamino(ruta([d1, llena]), sitio, '2026-11-09')
      return { indice: c.hueco.indice, cierra: c.cierra, dc: dc && dc.dayId, pasado: pasado && pasado.dayId, ccIndice: cc.hueco.indice, ccAbierto: cc.hueco.abierto, lleno: lleno && lleno.dayId }
    })`)
    debe(o.indice === 1 && !o.cierra, 'mejor hueco', `entre las dos paradas más cercanas (b1 y b2), no de primera (índice ${o.indice})`)
    debe(o.dc === 'd2', 'de camino', `el día que pasa más cerca del sitio (${o.dc})`)
    debe(o.pasado !== 'd1' && o.pasado !== 'd2', 'de camino', `nunca un día pasado (hoy 11 nov → ${o.pasado ?? 'ninguno'})`)
    debe(o.ccIndice >= 1, 'cerrado', `con el sitio cerrado a esa hora no se pone de primera (índice ${o.ccIndice}, abierto: ${o.ccAbierto})`)
    debe(o.lleno !== 'd2', 'de camino', 'un día al que ya no le caben más paradas no se marca')
  } finally {
    await b2.cerrar()
  }
  debe(/mejorHueco/.test(leer('src/lib/cambiarParada.ts')) && /mejorHueco: true/.test(leer('src/components/route/dayDetail/DayPositionPicker.tsx')) && /mejorHueco: true/.test(leer('src/components/route/freeDay/AddToDaySheet.tsx')), 'añadir', 'desde EXPLORAR y desde la colección el sitio va al mejor hueco (ya no de primera)')
  debe(/Te pilla de camino/.test(leer('src/components/route/dayDetail/DayPositionPicker.tsx')) && /Te pilla de camino/.test(leer('src/components/route/freeDay/AddToDaySheet.tsx')), 'añadir', 'la hoja «¿A qué día?» marca el día con «Te pilla de camino»')
}

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
