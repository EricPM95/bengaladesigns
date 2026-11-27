// La prueba de la V35A, parte «Logros y sonidos» del panel (/admin/logros).
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV35A_logros.mjs      (con Vite en 5173 y la API en 8787)
// Ninguna parte toca el Supabase de producción: la pantalla usa el servidor de mentira de la demo (?logrosDemo=1, src/lib/logrosDemo_a_logrosPanel.ts, que lee los MISMOS archivos de datos).
// Las capturas (ordenador 1280 y móvil 390) van a docs/dias/V35A_capturas/logros_<id>.jpg con los mismos ids que Design (P7, P7d, P7e, P7b, P7c, M7, M7b, M7c).
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { cargarFuentes } from '../../server/panel/logrosPanel.js'
import { filasDeDestinos, paginaDeDestino, resumenDeLogros, sorteoDeDatos, rangoDePeriodo } from '../../server/panel/logrosPanelDatos.js'
import { cargarDatos } from '../../server/logros/datos.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const leerJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const leer = (f) => fs.readFileSync(f, 'utf8')
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const esperar = async (a, js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const CARPETA = 'docs/dias/V35A_capturas'
const RUTA = '/admin/logros?cuentas=off&logros=on&logrosDemo=1&apertura=0'
const TABLA = ['Roma', 'París', 'Londres', 'Madrid', 'Barcelona', 'Lisboa', 'Ámsterdam', 'Praga', 'Lanzarote', 'Nueva York', 'Cancún', 'Florencia', 'Berlín', 'Cartagena de Indias']
const ESTADO_ESPERADO = { Roma: 'publicado', Lanzarote: 'publicado' /* V77: Lanzarote visible para todos */, Florencia: 'proximamente', Berlín: 'proximamente', 'Cartagena de Indias': 'proximamente' }

/** Una captura de TODA la página (se estira la ventana al alto del contenido, como las de Design). */
const capturaEntera = async (a, id, ancho) => {
  const alto = Math.min(6000, Math.max(700, await a.evaluar("Math.ceil(Math.max(document.documentElement.scrollHeight, document.getElementById('root')?.scrollHeight ?? 0))")))
  await a.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: ancho < 500 })
  await a.esp(500)
  await a.captura(`${CARPETA}/logros_${id}.jpg`, 78)
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)
const pestana = async (a, id) => {
  await clic(a, `[data-pestana="${id}"]`)
  await a.esp(900)
}
const sinScrollLateral = (a) => a.evaluar('document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1')

/* ───────── 1. Los datos: la tabla de los 14 destinos sale de los archivos ───────── */
console.log('1. Los números de «Qué tiene cada destino» salen de los archivos de datos')
const fuentes = cargarFuentes()
const filas = filasDeDestinos(fuentes)
const lanzamiento = leerJson('data/primera_vez/destinos.json')
debe(filas.length === 14 && lanzamiento.salida.length === 11 && lanzamiento.proximamente.length === 3, 'tabla', `14 filas: los 11 del lanzamiento y los 3 de Próximamente (${filas.length})`)
debe(filas.map((f) => f.nombre).join('|') === TABLA.join('|'), 'tabla', `son Roma, París, Londres, Madrid, Barcelona, Lisboa, Ámsterdam, Praga, Lanzarote, Nueva York, Cancún y Florencia, Berlín, Cartagena de Indias`)
for (const f of filas) {
  const esperado = ESTADO_ESPERADO[f.nombre] ?? 'preparacion'
  debe(f.estado === esperado, 'estado', `${f.nombre}: estado «${f.estado}» (debe ser «${esperado}»)`)
}
const curados = fs.readdirSync('data/dias').filter((k) => fs.existsSync(`data/dias/${k}/listas.json`) && fs.existsSync(`data/dias/${k}/_mapa.json`))
debe(curados.join(',') === 'lanzarote,roma' && !/\['lanzarote'\]/.test(leer('server/destinosCurados.js')), 'estado', 'los destinos con datos son solo Roma y Lanzarote, y (V77) Lanzarote ya no está en la lista de ocultos de la app (server/destinosCurados.js: por defecto ninguno oculto)')
for (const clave of ['roma', 'lanzarote']) {
  const d = leerJson(`data/logros/${clave}.json`)
  const dias = Object.keys(leerJson(`data/dias/${clave}/listas.json`).dias).filter((k) => /^D\d+$/.test(k) && k !== 'D0')
  const f = filas.find((x) => x.clave === clave)
  debe(f.sitios === Object.keys(d.sitios).length, 'numeros', `${clave}: sitios ${f.sitios} = los de data/logros/${clave}.json (${Object.keys(d.sitios).length})`)
  const grados = d.sellos.reduce((s, x) => s + x.grados.length, 0)
  debe(f.medallas === grados, 'medallas', `${clave}: medallas ${f.medallas} = los grados de todos sus sellos (${grados})`)
  debe(f.colecciones === d.colecciones.length && f.emblemas === d.emblemas.length, 'numeros', `${clave}: colecciones ${f.colecciones} y emblemas ${f.emblemas} = los del archivo`)
  debe(f.maravillas === Object.values(d.sitios).filter((s) => s.maravilla).length, 'numeros', `${clave}: maravillas ${f.maravillas} = los sitios marcados como maravilla`)
  debe(f.dias_ruta === dias.length, 'numeros', `${clave}: días de ruta ${f.dias_ruta} = las rutas D1…Dn de listas.json (${dias.length})`)
  const p = paginaDeDestino(fuentes, clave)
  debe(p.sellos.reduce((s, x) => s + x.grados.length, 0) === f.medallas, 'medallas', `${clave}: las medallas que se ven dentro (${p.sellos.reduce((s, x) => s + x.grados.length, 0)}) son las de la columna (${f.medallas})`)
}
debe(filas.find((f) => f.clave === 'roma').maravillas === 1, 'numeros', 'Roma tiene 1 maravilla (el Coliseo)')
debe(filas.filter((f) => !f.con_datos).every((f) => f.sitios === null && f.medallas === null && f.emblemas === null && f.dias_ruta === null), 'numeros', 'lo que no existe en los datos es nulo («—» en pantalla), nunca un 0 inventado')
{
  const romaP = paginaDeDestino(fuentes, 'roma')
  debe(romaP.emblemas.filter((e) => e.etiqueta === 'MARAVILLA').length === 1 && romaP.emblemas.find((e) => e.id === 'coliseo')?.etiqueta === 'MARAVILLA', 'emblemas', 'el emblema del Coliseo lleva MARAVILLA (el sitio tiene la marca de maravilla en los datos)')
  debe(paginaDeDestino(fuentes, 'paris') === null, 'pagina', 'un destino sin datos no tiene página')
}

console.log('1b. La pestaña «Logros»: números de la tabla de logros y el sorteo')
{
  const datos = cargarDatos()
  const r = resumenDeLogros({
    filas: [
      { user_id: 'a', destino: 'roma', logro: 'sello', escalon: 'roma:bronce', ganado_en: '2026-11-10T10:00:00Z' },
      { user_id: 'b', destino: 'roma', logro: 'sello', escalon: 'roma:bronce', ganado_en: '2026-11-11T10:00:00Z' },
      { user_id: 'a', destino: 'roma', logro: 'sello', escalon: 'roma:plata', ganado_en: '2026-11-12T10:00:00Z' },
      { user_id: 'a', destino: 'roma', logro: 'coleccion', escalon: 'imprescindibles', ganado_en: '2026-11-12T10:00:00Z' },
      { user_id: 'b', destino: 'roma', logro: 'pedazo', escalon: 'imprescindibles:coliseo', ganado_en: '2026-11-12T10:00:00Z' },
      { user_id: 'c', destino: 'roma', logro: 'pedazo', escalon: 'imprescindibles:panteon', ganado_en: '2026-10-01T10:00:00Z' },
      { user_id: 'b', destino: 'roma', logro: 'emblema', escalon: 'coliseo', ganado_en: '2026-09-01T10:00:00Z' },
      { user_id: 'a', destino: '*', logro: 'viajero:probador', escalon: '', ganado_en: '2026-11-12T10:00:00Z' },
    ],
    datos,
    destino: 'roma',
    desde: '2026-11-01T00:00:00Z',
    cuentas: 10,
  })
  debe(r.medallas.find((m) => m.grado === 'bronce').personas === 2 && r.medallas.find((m) => m.grado === 'plata').personas === 1 && r.medallas.find((m) => m.grado === 'oro').personas === 0, 'logros', 'las medallas cuentan personas distintas por grado')
  const imp = r.colecciones.find((c) => c.id === 'imprescindibles')
  debe(imp.completadas === 1 && imp.en_curso === 1, 'logros', `colecciones: 1 completada (a) y 1 en curso (b; c fue antes del periodo) → ${imp.completadas}/${imp.en_curso}`)
  debe(r.logros_ganados === 4 && r.personas === 2, 'logros', `no cuenta los pedazos ni «Probador», ni lo de antes del periodo: 4 logros de 2 personas (${r.logros_ganados} / ${r.personas})`)
  debe(r.emblemas.find((e) => e.id === 'coliseo').personas === 1, 'logros', 'los emblemas se cuentan desde siempre (el del Coliseo es de septiembre y sale)')
  debe(r.cuentas === 10 && r.mas_ganado?.personas === 2, 'logros', 'el más ganado: la medalla de bronce, con 2 personas')
  const s = sorteoDeDatos(datos)
  const exp = leerJson('data/logros/exp.json').sorteo
  debe(s.premio === exp.edicion.premio && s.cierre === exp.edicion.cierre && s.nivel_minimo === exp.nivel_minimo && s.viajes_con_hoy_minimos === exp.viajes_con_hoy_minimos, 'sorteo', 'el premio, el cierre y la regla del sorteo salen de data/logros/exp.json › sorteo')
  const sinPremio = sorteoDeDatos({ exp: { ...datos.exp, sorteo: { ...datos.exp.sorteo, edicion: { ...datos.exp.sorteo.edicion, premio: '' } } } })
  debe(sinPremio.premio === null, 'sorteo', 'sin premio puesto, el servidor lo dice con null (la pantalla enseña «Premio: sin decidir»)')
  const mes = rangoDePeriodo('mes', new Date('2026-11-20T12:00:00Z'))
  debe(mes.desde === '2026-11-01T00:00:00.000Z' && rangoDePeriodo('todo').desde === null, 'periodo', '«Este mes» empieza el día 1 y «Todo» no tiene límite')
}

/* ───────── 2. El código: lo viejo fuera, Sonidos tal cual ───────── */
console.log('2. El código: las 4 pestañas, sin lo que ya tiene su sitio, Sonidos sin tocar')
const carpeta = fs.readdirSync('src/components/panel/logros').map((f) => `src/components/panel/logros/${f}`)
const todo = carpeta.map(leer).join('\n')
const shell = leer('src/components/panel/logros/LogrosYSonidos.tsx')
debe(/id: 'logros', nombre: 'Logros'/.test(shell) && /nombre: 'Qué tiene cada destino'/.test(shell) && /nombre: 'Sonidos'/.test(shell) && /nombre: 'Herramientas'/.test(shell) && !/Elegir fotos'/.test(shell.split('\n').filter((l) => !l.startsWith(' *')).join('\n')), 'pestanas', 'el código tiene las 4 pestañas de Design y ninguna «Elegir fotos»')
debe(/<AdminSonidos embebido \/>/.test(shell), 'sonidos', 'la pestaña Sonidos monta <AdminSonidos embebido /> sin tocarlo')
debe(!/AvisosDeViajeros|DestinosPedidos|Avisos de viajeros'/.test(todo.replace(/\/\*\*[\s\S]*?\*\//g, '')), 'quitado', 'no queda «Avisos de viajeros» ni «Destinos pedidos» en esta sección')
debe(!fs.existsSync('src/components/logros/AdminLogros.tsx'), 'quitado', 'el panel viejo (AdminLogros.tsx) ya no existe: no hay dos versiones')
debe(!/\bBandera\b[^;]*linear-gradient/.test(todo) && /from '\.\.\/banderas'/.test(todo), 'banderas', 'las banderas salen de la pieza compartida (banderas.tsx), no dibujadas a mano')
debe(leer('server/panel/index.js').includes('registrarRutasLogrosPanel(app, { admin, conAdmin, ahora, env }) // (V35A logros)'), 'servidor', 'las rutas nuevas se montan en server/panel/index.js con el guardián conAdmin')
debe(/conAdmin\(/.test(leer('server/panel/logrosPanel.js')) && (leer('server/panel/logrosPanel.js').match(/app\.get\(/g) ?? []).length === (leer('server/panel/logrosPanel.js').match(/conAdmin\(async/g) ?? []).length, 'servidor', 'todas las rutas nuevas pasan por conAdmin')
debe(/hoy_prueba/.test(leer('server/logros/reiniciar.js')) && /día de prueba de HOY/.test(leer('src/components/panel/logros/Herramientas.tsx')) && /viajes \(con sus reservas, gastos y fotos\)/.test(leer('src/components/panel/logros/Herramientas.tsx')), 'borra', 'las líneas de «qué borra» dicen lo que de verdad borran (reiniciar.js y empezar_de_cero)')
{
  const lista = [...leer('supabase/migrations/0089_viajero_primera_vez.sql').matchAll(/\('([a-z_]+)', '[a-z_]+'\)/g)].map((m) => m[1])
  debe(['trips', 'trip_photos', 'achievements', 'passes', 'logro_perfil', 'viajero_primera_vez'].every((t) => lista.includes(t)) && !lista.includes('hoy_prueba'), 'borra', 'la última empezar_de_cero (0089) borra viajes, fotos, logros, pases, EXP y las respuestas de la primera vez, y NO borra hoy_prueba')
}

/* ───────── 3. La pantalla (ordenador, 1280) ───────── */
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la V35A (logros): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}
console.log('3. La pantalla en el ordenador (1280): pestañas, Logros, tabla y página de destino, Sonidos y Herramientas')
const reglaTexto = (txt, donde) => {
  debe(!/\beur\b/i.test(txt) && !/\bduo\b/i.test(txt) && !/\buno\b/.test(txt), 'textos', `${donde}: no sale «eur», «duo» ni «uno»`)
}
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-pestanas]'))", 120), 'pestanas', 'el panel abre «Logros y sonidos»')
    const nombres = await J(a, "JSON.stringify([...document.querySelectorAll('[data-pestanas] [role=tab]')].map((x) => x.textContent.trim()))")
    debe(nombres.join('|') === 'Logros|Qué tiene cada destino|Sonidos|Herramientas', 'pestanas', `las 4 pestañas con sus nombres: ${nombres.join(' · ')}`)
    const textoSeccion = () => a.evaluar("document.querySelector('[data-logros-pestana]')?.parentElement?.innerText ?? ''")

    // — Logros
    debe(await esperar(a, "document.querySelectorAll('[data-emblema-logros]').length >= 11", 120), 'logros', 'la pestaña Logros enseña los emblemas de Roma')
    const lg = await J(a, `JSON.stringify((() => {
      const emb = [...document.querySelectorAll('[data-emblema-logros]')]
      return {
        n: emb.length,
        cifras: [...document.querySelectorAll('[data-cifra]')].map((x) => x.getAttribute('data-cifra')),
        preguntas: document.querySelector('[data-bloque="emblemas"]').innerText.includes('?') && !document.querySelector('[data-bloque="emblemas"]').innerText.replace(/¿demasiado escondido\\?/g, '').includes('?') ? 0 : document.querySelector('[data-bloque="emblemas"]').innerText.replace(/¿demasiado escondido\\?/g, '').split('?').length - 1,
        dibujos: emb.map((x) => { const d = x.querySelector('[data-emblema-dibujo]'); const r = d.firstElementChild.getBoundingClientRect(); return { id: x.getAttribute('data-emblema-logros'), alto: Math.round(r.height), pintado: d.querySelectorAll('svg,img,canvas,[style*=gradient]').length }}),
        nadie: [...document.querySelectorAll('[data-emblema-logros][data-personas="0"]')].map((x) => x.getAttribute('data-emblema-logros') + ':' + x.innerText.includes('Nadie todavía · ¿demasiado escondido?')),
        medallas: [...document.querySelectorAll('[data-medalla-grado]')].map((x) => x.getAttribute('data-medalla-grado')),
        cols: document.querySelectorAll('[data-coleccion-fila]').length,
        premio: document.querySelector('[data-sorteo-premio]').innerText,
        titulo: document.querySelector('[data-sorteo-titulo]').innerText,
        regla: document.querySelector('[data-sorteo-regla]').innerText,
        destinos: [...document.querySelectorAll('[data-destino-logros]')].map((x) => x.textContent.trim()),
        banderasSin: document.querySelectorAll('[data-bandera="sin"]').length,
      }
    })())`)
    const roma = leerJson('data/logros/roma.json')
    const exp = leerJson('data/logros/exp.json').sorteo
    debe(lg.n === roma.emblemas.length, 'logros', `salen los ${roma.emblemas.length} emblemas de Roma (${lg.n})`)
    debe(lg.cifras.join('|') === 'Logros ganados|Personas con algún logro|El más ganado', 'logros', `las 3 cifras de Design: ${lg.cifras.join(' · ')}`)
    debe(lg.preguntas === 0, 'emblemas', `ningún emblema sale con «?»: se dibujan de verdad (${lg.preguntas} «?»)`)
    debe(lg.dibujos.every((d) => d.alto > 20) && lg.dibujos.every((d) => d.pintado > 0), 'emblemas', `cada emblema tiene su dibujo con cuerpo (${lg.dibujos.filter((d) => d.pintado === 0 || d.alto <= 20).map((d) => d.id).join(', ') || 'todos'})`)
    debe(lg.nadie.length >= 2 && lg.nadie.every((x) => x.endsWith(':true')), 'emblemas', `los que no ha encontrado nadie dicen «Nadie todavía · ¿demasiado escondido?» (${lg.nadie.join(', ')})`)
    debe(lg.medallas.join('|') === 'bronce|plata|oro|diamante', 'logros', 'medallas: bronce, plata, oro y diamante')
    debe(lg.cols === roma.colecciones.length, 'logros', `una fila por colección de Roma (${lg.cols})`)
    debe(lg.premio === `Premio: ${exp.edicion.premio}`, 'sorteo', `el premio sale de exp.json: «${lg.premio}»`)
    debe(/cierra el 31 de agosto de 2027/.test(lg.titulo) && /personas? entra/.test(lg.titulo), 'sorteo', `el cierre sale de exp.json: «${lg.titulo}»`)
    debe(new RegExp(`Nivel ${exp.nivel_minimo} o más y un viaje acabado usando HOY la mitad de los días`).test(lg.regla), 'sorteo', `el nivel sale de exp.json: «${lg.regla}»`)
    debe(lg.destinos.join('|') === 'Roma|Lanzarote', 'logros', `el selector de destino: ${lg.destinos.join(' · ')}`)
    debe(lg.banderasSin === 0, 'banderas', 'ninguna bandera en blanco en Logros')
    await clic(a, '[data-sorteo-ver]')
    await a.esp(400)
    const ver = await J(a, "JSON.stringify({ n: document.querySelectorAll('[data-sorteo-lista] li').length, href: document.querySelector('[data-sorteo-ficha]')?.getAttribute('href') ?? '' })")
    debe(ver.n >= 1 && /^\/admin\/usuarios\?ficha=/.test(ver.href), 'sorteo', `[Ver quién entra] abre la lista (${ver.n}) con enlace a la ficha: ${ver.href}`)
    await clic(a, '[data-sorteo-ver]')
    // Cambio de periodo y de destino
    await clic(a, '[data-periodo-id="todo"]')
    await a.esp(700)
    const todoP = await J(a, "JSON.stringify({ pie: document.querySelector('[data-cifra=\"Logros ganados\"]').innerText })")
    debe(/Desde siempre/.test(todoP.pie), 'periodo', 'al elegir «Todo» la cifra lo dice')
    await clic(a, '[data-destino-logros="lanzarote"]')
    await a.esp(800)
    const lz = await J(a, "JSON.stringify({ n: document.querySelectorAll('[data-emblema-logros]').length, preguntas: (document.querySelector('[data-bloque=emblemas]').innerText.replace(/¿demasiado escondido\\?/g, '').match(/\\?/g) || []).length, dib: [...document.querySelectorAll('[data-emblema-dibujo]')].every((d) => d.querySelectorAll('svg,img,canvas,[style*=gradient]').length > 0) })")
    debe(lz.n === leerJson('data/logros/lanzarote.json').emblemas.length && lz.preguntas === 0 && lz.dib, 'emblemas', `Lanzarote: sus ${lz.n} emblemas, también dibujados`)
    await clic(a, '[data-destino-logros="roma"]')
    await clic(a, '[data-periodo-id="mes"]')
    await a.esp(900)
    reglaTexto(await textoSeccion(), 'Logros')
    await capturaEntera(a, 'P7', 1280)
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })

    // — Qué tiene cada destino: la tabla
    await pestana(a, 'destinos')
    debe(await esperar(a, "document.querySelectorAll('[data-destino-fila]').length === 14", 60), 'tabla', 'la tabla tiene 14 filas')
    await a.esp(600)
    const tb = await J(a, `JSON.stringify([...document.querySelectorAll('[data-destino-fila]')].map((f) => { const c = [...f.children].map((x) => x.innerText.trim()); return { nombre: c[0], n: c.slice(1, 7), estado: f.getAttribute('data-estado'), texto: c[7], bandera: f.querySelector('[data-bandera]')?.getAttribute('data-bandera') } }))`)
    debe(tb.map((x) => x.nombre).join('|') === TABLA.join('|'), 'tabla', 'los nombres y el orden de las 14 filas')
    for (const [i, f] of filas.entries()) {
      const esperado = [f.sitios, f.medallas, f.colecciones, f.emblemas, f.maravillas, f.dias_ruta].map((v) => (v === null ? '—' : String(v)))
      debe(tb[i].n.join(',') === esperado.join(','), 'tabla', `${f.nombre}: sitios · medallas · colecc. · emblemas · maravillas · días ruta = ${esperado.join(' · ')} (${tb[i].n.join(' · ')})`)
    }
    const textos = { publicado: 'Publicado', oculto: 'Solo administradores', preparacion: 'En preparación', proximamente: 'Próximamente' }
    debe(tb.every((x) => x.texto === textos[x.estado]) && tb.filter((x) => x.estado === 'publicado').length === 2 && tb.filter((x) => x.estado === 'oculto').length === 0 && tb.filter((x) => x.estado === 'proximamente').length === 3 && tb.filter((x) => x.estado === 'preparacion').length === 9, 'estado', 'estados en pantalla (V77, Lanzarote visible para todos): 2 Publicado (Roma y Lanzarote), 0 ocultos, 9 En preparación y 3 Próximamente')
    const iso = ['it', 'fr', 'gb', 'es', 'es', 'pt', 'nl', 'cz', 'es', 'us', 'mx', 'it', 'de', 'co']
    debe(tb.every((x, i) => x.bandera === iso[i]), 'banderas', `cada fila con su bandera de verdad (${tb.map((x) => x.bandera).join(',')})`)
    debe((await a.evaluar('document.querySelectorAll("[data-bandera=sin]").length')) === 0, 'banderas', 'ninguna bandera en blanco (data-bandera="sin") en las 14 filas')
    reglaTexto(await textoSeccion(), 'la tabla')
    await capturaEntera(a, 'P7d', 1280)
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })

    // — Roma por dentro
    await clic(a, '[data-destino-fila="roma"]')
    debe(await esperar(a, "document.querySelector('[data-destino-pagina=\"roma\"]') && document.querySelectorAll('[data-emblema]').length >= 14", 80), 'pagina', 'al tocar Roma se abre «Roma por dentro»')
    await a.esp(900)
    const rp = await J(a, `JSON.stringify({
      chips: [...document.querySelectorAll('[data-chip]')].map((x) => x.innerText.replace(/\\s+/g, ' ').trim()),
      medallas: document.querySelectorAll('[data-medalla]').length,
      cols: document.querySelectorAll('[data-coleccion]').length,
      emb: document.querySelectorAll('[data-emblema]').length,
      preguntas: (document.querySelector('[data-bloque="emblemas-destino"]').innerText.match(/\\?/g) || []).length,
      maravilla: document.querySelector('[data-emblema="coliseo"]').innerText.includes('MARAVILLA'),
      secretos: [...document.querySelectorAll('[data-emblema]')].filter((x) => x.innerText.includes('SECRETO')).length,
      pat: document.querySelector('[data-bloque="patrimonio"]')?.innerText ?? '',
      avisos: document.querySelector('[data-avisos-de-datos]')?.innerText ?? '',
      dibujos: [...document.querySelectorAll('[data-bloque="medallas-destino"] [data-medalla]')].every((m) => m.querySelectorAll('svg,img,canvas').length > 0 || m.querySelector('span')?.firstElementChild?.getBoundingClientRect().height > 20),
      insignias: [...document.querySelectorAll('[data-coleccion]')].every((m) => m.firstElementChild.firstElementChild?.getBoundingClientRect().height > 20),
      banderasSin: document.querySelectorAll('[data-bandera="sin"]').length,
    })`)
    const fr = filas.find((f) => f.clave === 'roma')
    debe(rp.chips.join(',') === [`${fr.sitios} sitios`, `${fr.medallas} medallas`, `${fr.colecciones} colecciones`, `${fr.emblemas} emblemas`, `${fr.maravillas} maravillas`, `${fr.dias_ruta} días de ruta`].join(','), 'pagina', `las pastillas de arriba son las de la tabla: ${rp.chips.join(' · ')}`)
    debe(rp.medallas === fr.medallas, 'medallas', `las medallas que se ven dentro (${rp.medallas}) son las de la columna (${fr.medallas}): los grados de cada sello`)
    debe(rp.cols === roma.colecciones.length && rp.emb === roma.emblemas.length, 'pagina', `${rp.cols} colecciones y ${rp.emb} emblemas, los de roma.json`)
    debe(rp.preguntas === 0 && rp.maravilla && rp.secretos === roma.emblemas.filter((e) => e.tipo === 'sitio').length - 1, 'emblemas', 'emblemas dibujados (sin «?»), el del Coliseo con MARAVILLA y los demás de sitio con SECRETO')
    debe(rp.dibujos && rp.insignias, 'pagina', 'los sellos y las insignias de colección se dibujan con las piezas de la app')
    debe(/Centro histórico de Roma/.test(rp.pat) && /Ciudad del Vaticano/.test(rp.pat), 'pagina', 'el Patrimonio UNESCO sale de los datos')
    debe(/por revisar/.test(rp.avisos) && /Falta la foto de/.test(rp.avisos), 'pagina', `la franja rosa de avisos de datos (${rp.avisos.split('\n')[0]})`)
    debe(rp.banderasSin === 0, 'banderas', 'la bandera de Roma no sale en blanco')
    reglaTexto(await textoSeccion(), 'Roma por dentro')
    await capturaEntera(a, 'P7e', 1280)
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
    await clic(a, '[data-volver-destinos]')

    // Lanzarote: oculto, y su página lo dice
    await esperar(a, "document.querySelectorAll('[data-destino-fila]').length === 14", 40)
    await clic(a, '[data-destino-fila="lanzarote"]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-destino-pagina=\"lanzarote\"]'))", 60), 'pagina', 'también se abre Lanzarote')
    await a.esp(600)
    debe(!/solo lo ven los administradores/.test(await textoSeccion()), 'estado', '(V77) la página de Lanzarote ya no dice que está oculto: es visible para todos')

    // — Sonidos
    await pestana(a, 'sonidos')
    debe(await esperar(a, "Boolean(document.querySelector('[data-admin-sonidos]')) && document.querySelectorAll('[data-animacion-tarjeta]').length >= 20", 120), 'sonidos', 'la pestaña Sonidos monta el estudio de sonidos con todas sus tarjetas')
    await a.esp(1500)
    await capturaEntera(a, 'P7b', 1280)
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })

    // — Herramientas
    await pestana(a, 'herramientas')
    debe(await esperar(a, "Boolean(document.querySelector('[data-herramienta=\"mis-pruebas\"]'))", 60), 'herramientas', 'la pestaña Herramientas sale')
    await esperar(a, "Boolean(document.querySelector('[data-empezar-de-cero-boton]'))", 40)
    const hr = await J(a, `JSON.stringify({
      probador: document.querySelector('[data-herramienta="probador"]').innerText,
      botones: [...document.querySelectorAll('[data-herramienta="mis-pruebas"] button')].map((b) => b.innerText.trim()),
      cero: document.querySelector('[data-que-borra="cero"]')?.innerText ?? '',
      reinicio: document.querySelector('[data-que-borra="reinicio"]')?.innerText ?? '',
      codePlegado: document.querySelector('[data-para-code-boton]')?.getAttribute('aria-expanded'),
      codeContenido: Boolean(document.querySelector('[data-para-code-contenido]')),
      orden: [...document.querySelectorAll('[data-herramienta], [data-para-code]')].map((x) => x.getAttribute('data-herramienta') ?? 'para-code'),
    })`)
    debe(/Dar «Probador»/.test(hr.probador) && /correo de la cuenta/.test(hr.probador) && /Dar insignia Probador/.test(hr.probador), 'herramientas', 'Dar «Probador»: correo e insignia')
    debe(hr.botones.join('|') === 'Ver la app sin pase|Empezar de cero|Reiniciar mis pruebas', 'herramientas', `Mis pruebas: ${hr.botones.join(' · ')}`)
    debe(/viajes/.test(hr.cero) && /logros/.test(hr.cero) && /pases/.test(hr.cero) && /La cuenta se queda/.test(hr.cero), 'borra', `debajo de [Empezar de cero]: «${hr.cero.slice(0, 90)}…»`)
    debe(/día de prueba de HOY/.test(hr.reinicio) && /No toca tus viajes/.test(hr.reinicio), 'borra', `debajo de [Reiniciar mis pruebas]: «${hr.reinicio.slice(0, 90)}…»`)
    debe(hr.orden.join('|') === 'probador|mis-pruebas|cuentas-que-no-cuentan|para-code' && hr.codePlegado === 'false' && !hr.codeContenido, 'herramientas', '«Para Code» está plegado y al final')
    // Los dos botones de borrar piden confirmar y [Cancelar] no borra
    await clic(a, '[data-reiniciar-boton]')
    await a.esp(300)
    const c1 = await J(a, "JSON.stringify({ dialogo: document.querySelector('[data-reiniciar-dialogo]')?.innerText ?? '' })")
    debe(/¿Seguro\? «Reiniciar mis pruebas» borra/.test(c1.dialogo) && /Cancelar/.test(c1.dialogo) && /Sí, reiniciar/.test(c1.dialogo), 'confirmacion', 'Reiniciar mis pruebas pide confirmar (Cancelar / Sí, reiniciar)')
    await capturaEntera(a, 'P7c', 1280)
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
    await clic(a, '[data-reiniciar-no]')
    await clic(a, '[data-empezar-de-cero-boton]')
    await a.esp(300)
    debe(/¿Seguro\?/.test(await a.evaluar("document.querySelector('[data-empezar-de-cero-dialogo]')?.innerText ?? ''")), 'confirmacion', 'Empezar de cero pide confirmar')
    await clic(a, '[data-empezar-de-cero-no]')
    await clic(a, '[data-para-code-boton]')
    await a.esp(700)
    debe(Boolean(await a.evaluar("Boolean(document.querySelector('[data-para-code-contenido]'))")), 'herramientas', '«Para Code» se despliega')
    reglaTexto(await textoSeccion(), 'Herramientas')
    debe(!/Avisos de viajeros|Destinos pedidos/.test(await textoSeccion()), 'quitado', 'en la sección ya no salen «Avisos de viajeros» ni «Destinos pedidos»')
  } finally {
    a.cerrar()
  }
}

/* ───────── 4. El móvil (390): sin desplazamiento lateral, y las capturas M7, M7b, M7c ───────── */
console.log('4. El móvil (390): sin desplazamiento a los lados')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "document.querySelectorAll('[data-emblema-logros]').length >= 11", 120), 'movil', 'Logros sale en el móvil')
    await a.esp(800)
    debe(await sinScrollLateral(a), 'movil', 'Logros: sin desplazamiento lateral a 390')
    await capturaEntera(a, 'M7', 390)
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await pestana(a, 'destinos')
    await esperar(a, "document.querySelectorAll('[data-destino-fila]').length === 14", 60)
    debe(await sinScrollLateral(a), 'movil', 'la tabla: sin desplazamiento lateral a 390 ')
    await capturaEntera(a, 'M7b', 390)
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await clic(a, '[data-destino-fila="roma"]')
    await esperar(a, "document.querySelectorAll('[data-emblema]').length >= 14", 80)
    await a.esp(900)
    debe(await sinScrollLateral(a), 'movil', 'Roma por dentro: sin desplazamiento lateral a 390')
    await capturaEntera(a, 'M7c', 390)
    await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await pestana(a, 'sonidos')
    await esperar(a, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20", 120)
    await a.esp(800)
    debe(await sinScrollLateral(a), 'movil', 'Sonidos: sin desplazamiento lateral a 390')
    await pestana(a, 'herramientas')
    await esperar(a, "Boolean(document.querySelector('[data-empezar-de-cero-boton]'))", 40)
    await a.esp(500)
    debe(await sinScrollLateral(a), 'movil', 'Herramientas: sin desplazamiento lateral a 390')
    await clic(a, '[data-para-code-boton]')
    await a.esp(800)
    debe(await sinScrollLateral(a), 'movil', '«Para Code» abierto: sin desplazamiento lateral a 390')
    await clic(a, '[data-para-code-boton]')
    await capturaEntera(a, 'M7d', 390)
  } finally {
    a.cerrar()
  }
}

{
  // La dirección de siempre de Sonidos (/admin/sonidos) abre la pestaña Sonidos de «Logros y sonidos»; y la vieja /?admin=logros lleva a /admin/logros.
  const a = await abrirApp(APP, { ruta: '/admin/sonidos?cuentas=off&logros=on&logrosDemo=1&apertura=0', ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-logros-pestana=\"sonidos\"] [data-admin-sonidos]'))", 120), 'sonidos', '/admin/sonidos abre la pestaña Sonidos de «Logros y sonidos»')
  } finally {
    a.cerrar()
  }
  const v = await abrirApp(APP, { ruta: '/?admin=logros&cuentas=off&logros=on&logrosDemo=1&apertura=0', ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(v, "location.pathname === '/admin/logros' && Boolean(document.querySelector('[data-pestanas]'))", 120), 'viejo', 'la dirección vieja /?admin=logros lleva a /admin/logros')
  } finally {
    v.cerrar()
  }
}

/* ───────── 5. Solo administradores ───────── */
console.log('5. Sin ser administrador: la pantalla no se ve y el servidor da 401/403')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 800, sinEsperarRoot: true, esperaFija: 5, antes: "try{sessionStorage.setItem('trazo:demo-no-admin','1')}catch(e){}" })
  try {
    const sale = await esperar(a, "Boolean(document.querySelector('[data-solo-administradores]'))", 80)
    debe(sale && !(await a.evaluar("Boolean(document.querySelector('[data-pestanas]'))")), 'solo_admin', 'sin ser administrador, el panel dice «solo para administradores» y no enseña nada')
  } finally {
    a.cerrar()
  }
}
for (const ruta of ['/api/admin/logros-panel/destinos', '/api/admin/logros-panel/destino/roma', '/api/admin/logros-panel/resumen']) {
  const r = await fetch(`${APP}${ruta}`).catch(() => null)
  debe(r !== null && [401, 403, 503].includes(r.status), 'solo_admin', `${ruta} sin sesión da ${r?.status ?? 'sin respuesta'} (401/403, nunca los datos)`)
}

console.log(`\nPrueba de la V35A (logros): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  - [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
