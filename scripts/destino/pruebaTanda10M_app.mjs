// La prueba de la parte de la APP de la Tanda 10M: las tres tarjetas especiales, la ventana de avisos en el centro, DÍAS sin pastillas ni «el sol se pone» y la campana.
// Hace falta `npm run server` y `npm run dev` (abre un Chrome sin ventana: scripts/destino/_enLaApp.mjs).
//   node scripts/destino/pruebaTanda10M_app.mjs
// Con datos de ejemplo puestos en el almacén (window.__ruta): el contrato del motor es `route.seasonNote` = { season, title, text } y cada aviso de fecha lleva `cierran` y `campana`.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })

/* ───────────────────────── 1. Lo que se ve en el código ───────────────────────── */
{
  const dayList = sinComentarios(leer('src/components/route/DayList.tsx'))
  debe(!/DateNoticeTag|noticeIsForDay/.test(dayList), 'dias', 'DÍAS ya no pinta las pastillas de los avisos de fechas')
  const panel = sinComentarios(leer('src/components/route/dayDetail/DayDetailPanel.tsx'))
  debe(!/sunsetText/.test(panel), 'dias', 'DÍAS ya no pinta «Hoy el sol se pone a las…» en la cabecera del día')
  const modal = sinComentarios(leer('src/components/route/DateNoticesModal.tsx'))
  debe(!/items-end|rounded-t-\[28px\]|md:items-center/.test(modal) && /items-center justify-center/.test(modal), 'ventana', 'la ventana de avisos ya no sube desde abajo como una hoja: sale en el centro')
  const tarjeta = sinComentarios(leer('src/components/route/SeasonCard.tsx'))
  debe(!/note\?\.season === 'navidad'/.test(tarjeta), 'tarjetas', 'SeasonCard ya no tiene la guardia de solo Navidad')
  const lib = leer('src/lib/seasonCard.ts')
  debe(/cumpleanos_ciudad/.test(lib) && /semana_santa/.test(lib) && /navidad/.test(lib), 'tarjetas', 'se aceptan las claves navidad, semana_santa, cumpleanos y cumpleanos_ciudad')
  debe(/cierran\?: string\[\]/.test(leer('src/lib/types.ts')) && /campana\?: string/.test(leer('src/lib/types.ts')), 'contrato', 'DateNotice lleva `cierran` y `campana`')
  debe(/notice\.campana/.test(leer('src/lib/mapGeneratedRoute.ts')) && /notice\.cierran/.test(leer('src/lib/mapGeneratedRoute.ts')), 'contrato', 'mapGeneratedRoute lleva `cierran` y `campana` a la ruta')
}

const TEXTOS = {
  navidad: '¡Vas a vivir Roma en Navidad! Uno de los momentos más bonitos del año para recorrerla. Te hemos preparado la mejor ruta para que disfrutes cada rincón de la ciudad.',
  semana_santa: '¡Vas a vivir Roma en Semana Santa! Uno de los momentos más especiales del año en la ciudad. Te hemos preparado la mejor ruta para que lo vivas todo.',
  cumpleanos: '¡Estás en Roma el día de su cumpleaños! El 21 de abril la ciudad celebra su fundación, hace más de 2.700 años. Te hemos preparado la mejor ruta para que lo disfrutes.',
}

/* ───────────────────────── 2. Las tres tarjetas (la vista previa de desarrollo) ───────────────────────── */
const huellas = {}
for (const [clave, texto] of Object.entries(TEXTOS)) {
  const a = await abrirApp('http://localhost:5173', { ruta: `/?tarjeta=${clave}` })
  await a.esp(1500)
  const r = await a.evaluar(`(() => {
    const t = document.querySelector('[data-tarjeta-especial]')
    if (!t) return null
    const panel = t.querySelector('.trazo-notice-panel')
    const caja = panel.getBoundingClientRect()
    return {
      season: t.getAttribute('data-tarjeta-especial'),
      textos: Array.from(t.querySelectorAll('[data-tarjeta-texto]')).map((p) => p.textContent),
      parrafos: panel.querySelectorAll('p').length,
      titulo: t.querySelector('h2')?.textContent,
      boton: Array.from(t.querySelectorAll('button')).map((b) => b.textContent),
      ancho: Math.round(caja.width),
      centroX: Math.round(caja.left + caja.width / 2),
      centroY: Math.round(caja.top + caja.height / 2),
      vw: innerWidth, vh: innerHeight,
      svgs: t.querySelectorAll('svg').length,
      canvas: Boolean(t.querySelector('canvas')),
      fondo: getComputedStyle(t.querySelector('.relative.h-\\\\[300px\\\\]')).backgroundImage.slice(0, 80),
    }
  })()`)
  debe(r?.season === clave, 'tarjetas', `${clave}: sale su tarjeta`)
  debe(r?.textos?.length === 1 && r.textos[0] === texto, 'tarjetas', `${clave}: un solo texto, el del motor`)
  debe(r?.parrafos === 2, 'tarjetas', `${clave}: solo el rótulo y el texto (sin variantes)`)
  debe(r?.boton?.length === 1 && r.boton[0] === 'Entendido', 'tarjetas', `${clave}: el botón es «Entendido»`)
  debe(r?.ancho === 390 || r?.ancho === r?.vw - 32, 'tarjetas', `${clave}: tarjeta de 390 px (${r?.ancho})`)
  debe(Math.abs(r.centroX - r.vw / 2) <= 2 && Math.abs(r.centroY - r.vh / 2) <= 4, 'tarjetas', `${clave}: en el centro de la pantalla`)
  debe(r?.canvas && r.svgs >= 1, 'tarjetas', `${clave}: lleva su dibujo y su efecto`)
  huellas[clave] = r?.fondo
  await a.captura(path.join(SALIDA, `tarjeta_${clave}.jpg`))
  a.cerrar()
}
debe(new Set(Object.values(huellas)).size === 3, 'tarjetas', 'cada tarjeta tiene su propio cielo (los tres degradados son distintos)')

/* ───────────────────────── 3. La ventana de avisos, DÍAS y la campana, con datos de ejemplo ───────────────────────── */
const AVISOS = [
  { id: 'a-15ago', dayNumber: 1, dateIso: '2026-10-17', icon: 'cierre', title: '15 de agosto · Ferragosto', tag: 'Panteón cerrado', texts: ['Es festivo y cierran los Museos Vaticanos y muchos comercios.', 'Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.'], kind: 'auto', cierran: ['Museos Vaticanos', 'Foro Romano', 'Coliseo', 'Panteón'], campana: 'Museos Vaticanos, Foro Romano y 2 lugares más cierran el 15 de agosto.' },
  { id: 'b-domingo3', dayNumber: 2, dateIso: '2026-10-18', icon: 'entrada', title: 'Domingo 3 · Borghese gratis', tag: 'Horario especial', texts: ['La Galería Borghese es gratis el primer domingo de mes, con reserva.', 'Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.'], kind: 'curado', cierran: [], campana: 'Domingo 3 · La Galería Borghese, gratis' },
  { id: 'c-ano', dayNumber: 3, dateIso: '2026-10-19', icon: 'fiesta', title: '1 de enero · Año Nuevo', tag: 'Año Nuevo', texts: ['Año Nuevo: muchos restaurantes cierran y el transporte va reducido.', 'Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.'], kind: 'mixto', cierran: ['Coliseo', 'Foro Romano'], campana: '1 de enero · Año Nuevo: el Coliseo y el Foro Romano cierran' },
]
const EXTRA = [
  { id: 'd-nuevo', dayNumber: 4, dateIso: '2026-10-20', icon: 'religioso', title: 'Lunes · La Borghese cierra', tag: 'Borghese cerrada', texts: ['Los lunes cierra la Galería Borghese.', 'Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.'], kind: 'auto', cierran: ['Galería Borghese'], campana: 'La Galería Borghese cierra los lunes.' },
  { id: 'e-otro', dayNumber: 4, dateIso: '2026-10-20', icon: 'musica', title: 'Concierto en las Termas', tag: 'Concierto', texts: ['Esa noche hay concierto en las Termas de Caracalla.', 'Hemos preparado tu ruta para que disfrutes de todo lo que está abierto y tengas una experiencia fantástica.'], kind: 'curado', cierran: [], campana: 'Concierto en las Termas de Caracalla' },
]
const R = 'window.__ruta'
const ev = (a, js) => a.evaluar(js)
const estado = (a) => ev(a, `(() => { const r = ${R}.getState().route; return { leidos: r.dateNoticesRead ?? null, clave: r.dateNoticesSeenKey ?? null, ids: (r.dateNotices ?? []).map((n) => n.id), descartada: Boolean(r.seasonNoteDismissed) } })()`)
const ventana = (a) =>
  ev(a, `(() => {
    const v = document.querySelector('[data-ventana-avisos]')
    if (!v) return null
    const p = v.querySelector('.trazo-notice-panel').getBoundingClientRect()
    return {
      modo: v.getAttribute('data-ventana-avisos'),
      ancho: Math.round(p.width), centroX: Math.round(p.left + p.width / 2), centroY: Math.round(p.top + p.height / 2), vw: innerWidth, vh: innerHeight,
      flechas: Array.from(v.querySelectorAll('[data-aviso-flecha]')).map((b) => b.getAttribute('data-aviso-flecha')),
      puntos: v.querySelectorAll('[data-aviso-punto]').length,
      contador: v.querySelector('[data-aviso-contador]')?.textContent ?? null,
      boton: v.querySelector('[data-aviso-boton]')?.textContent ?? null,
      iconos: Array.from(v.querySelectorAll('[data-aviso-icono]')).map((e) => e.getAttribute('data-aviso-icono')),
      mas: Array.from(v.querySelectorAll('[data-aviso-mas]')).length,
      titulos: Array.from(v.querySelectorAll('[data-aviso-titulo]')).map((e) => e.textContent),
      textoVentana: v.innerText,
      sabana: Boolean(v.querySelector('.rounded-t-\\\\[28px\\\\]')),
    }
  })()`)
const clic = (a, sel, texto) =>
  ev(a, `(() => { const b = Array.from(document.querySelectorAll(${JSON.stringify(sel)})).find((x) => ${texto ? `(x.textContent || '').trim() === ${JSON.stringify(texto)}` : 'true'}); if (!b) return false; b.click(); return true })()`)
const campana = (a) =>
  ev(a, `(() => ({
    etiqueta: document.querySelector('button[aria-label^="Avisos"]')?.getAttribute('aria-label'),
    // Los avisos que no son de fechas y nunca se leen (el «Cambios sin guardar» que aparece solo, sin nube, cuando le toca): no dependen de las fechas, así que no cuentan en lo que se prueba.
    fijos: Array.from(document.querySelectorAll('#notices-heading ~ div > div:not([data-aviso-fecha])')).filter((e) => /^(ERROR|AVISO)/i.test(e.innerText.trim())).length,
    cuenta: Number(/\\((\\d+) nuevos\\)/.exec(document.querySelector('button[aria-label^="Avisos"]')?.getAttribute('aria-label') ?? '')?.[1] ?? 0),
    otros: Array.from(document.querySelectorAll('#notices-heading ~ div > div:not([data-aviso-fecha])')).map((e) => e.innerText.replace(/\\s+/g, ' ').slice(0, 90)),
    filas: Array.from(document.querySelectorAll('[data-aviso-fecha]')).map((e) => ({ id: e.getAttribute('data-aviso-fecha'), estado: e.getAttribute('data-aviso-fecha-estado'), frase: e.querySelector('[data-aviso-fecha-frase]')?.textContent })),
  }))()`)
const abrirCampana = async (a) => {
  await clic(a, 'button[aria-label^="Avisos"]')
  await a.esp(700)
}
const cerrarCampana = async (a) => {
  await clic(a, 'button[aria-label="Cerrar"]')
  await a.esp(500)
}
const poner = (a, parche) =>
  ev(a, `(() => { const r = structuredClone(${R}.getState().route); Object.assign(r, ${JSON.stringify(parche)}); ${R}.setState({ route: r, openDateNoticeId: null, mode: 'route' }); return true })()`)

// La previsión de lluvia llega de la red y, según el día, mete un aviso «Mañana llueve…» en la campana (con razón: es un aviso nuevo de verdad). Para que el numerito dependa solo de los avisos de fechas, la prueba corta esa llamada: sin previsión, ningún aviso de lluvia.
const SIN_PREVISION = "(() => { const f = window.fetch.bind(window); window.fetch = (u, ...r) => (String(u instanceof Request ? u.url : u).includes('/api/tiempo/') ? Promise.reject(new Error('sin previsión (prueba)')) : f(u, ...r)) })()"
const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&apertura=0', antes: SIN_PREVISION })
for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function' && Boolean(window.__ruta)")); i++) await a.esp(500)
await ev(a, 'window.__rutaPrueba().then(() => true)')
for (let i = 0; i < 120 && !(await ev(a, `Boolean(${R}.getState().route)`)); i++) await a.esp(1000)
await a.esp(2500)
debe(await ev(a, `Boolean(${R}.getState().route)`), 'viaje', 'el viaje de prueba está abierto')
// El viaje de prueba empieza sin avisos de fechas ni tarjeta que estorben.
await poner(a, { dateNotices: [], dateNoticesRead: undefined, dateNoticesSeenKey: null, seasonNote: null, seasonNoteDismissed: false })
await a.esp(600)

/* 3a. Tarjeta especial primero y, al cerrarla, la ventana de avisos en el centro */
await poner(a, { seasonNote: { season: 'semana_santa', title: 'Semana Santa en Roma', text: TEXTOS.semana_santa }, seasonNoteDismissed: false, dateNotices: AVISOS, dateNoticesSeenKey: null, dateNoticesRead: undefined })
await a.esp(900)
{
  const tarjeta = await ev(a, "document.querySelector('[data-tarjeta-especial]')?.getAttribute('data-tarjeta-especial') ?? null")
  debe(tarjeta === 'semana_santa', 'orden', 'al abrir la ruta sale primero la tarjeta especial')
  debe((await ventana(a)) === null, 'orden', 'la ventana de avisos espera a que se cierre la tarjeta')
  await clic(a, '[data-tarjeta-especial] button', 'Entendido')
  await a.esp(900)
  const v = await ventana(a)
  debe(v?.modo === 'todos', 'orden', 'al cerrar la tarjeta sale la ventana de avisos')
  debe(v && Math.abs(v.centroX - v.vw / 2) <= 2 && Math.abs(v.centroY - v.vh / 2) <= 6 && !v.sabana, 'ventana', `la ventana sale en el centro, no como hoja desde abajo (centro ${v?.centroX},${v?.centroY} de ${v?.vw}x${v?.vh})`)
  debe(v?.ancho === Math.min(390, v.vw - 32), 'ventana', `mismo ancho que la tarjeta especial: 390 px, o el ancho menos el margen en un móvil (${v?.ancho})`)
  debe(v?.iconos?.join() === 'cierre,entrada,fiesta', 'ventana', `cada tarjeta lleva el icono de su aviso (${v?.iconos?.join()})`)
  debe(v?.flechas?.join() === 'prev,next' && v.puntos === 3 && v.contador === '1 de 3' && v.boton === 'Siguiente', 'ventana', `flechas ‹ ›, 3 puntitos, «1 de 3» y «Siguiente» (${JSON.stringify([v?.flechas, v?.puntos, v?.contador, v?.boton])})`)
  await a.captura(path.join(SALIDA, 'ventana_avisos_1.jpg'))
  await clic(a, '[data-aviso-boton]')
  await a.esp(800)
  const v2 = await ventana(a)
  debe(v2?.contador === '2 de 3' && v2.boton === 'Siguiente', 'ventana', 'el botón «Siguiente» pasa a la 2 de 3')
  await clic(a, '[data-aviso-boton]')
  await a.esp(800)
  const v3 = await ventana(a)
  debe(v3?.contador === '3 de 3' && v3.boton === 'Entendido', 'ventana', 'en la última, «Entendido»')
  // Los avisos todavía no se han dado por vistos: no cuentan como leídos hasta que se cierra la ventana.
  debe(((await estado(a)).leidos ?? []).length === 0, 'campana', 'mientras la ventana está abierta, nada está leído todavía')
  await clic(a, '[data-aviso-boton]')
  await a.esp(700)
  debe((await ventana(a)) === null, 'ventana', '«Entendido» cierra la ventana')
  const s = await estado(a)
  debe(s.descartada && AVISOS.every((n) => s.leidos?.includes(n.id)) && Boolean(s.clave), 'campana', 'lo que vio en la ventana queda guardado en la ruta como leído (dateNoticesRead)')
  // Se queda en la campana como leído.
  await abrirCampana(a)
  const c = await campana(a)
  debe(c.filas.length === 3 && c.filas.every((f) => f.estado === 'leido'), 'campana', `los 3 avisos están en la campana ya como leídos (${JSON.stringify(c.filas.map((f) => f.estado))})`)
  debe(c.filas.map((f) => f.frase).join('|') === AVISOS.map((n) => n.campana).join('|'), 'campana', 'cada aviso entra con su frase corta (`campana`)')
  debe(c.cuenta - c.fijos === 0, 'campana', `el numerito de la campana no cuenta lo ya visto (${c.etiqueta}; otros: ${JSON.stringify(c.otros)})`)
  await a.captura(path.join(SALIDA, 'campana_leidos.jpg'))
  await cerrarCampana(a)
}

/* 3b. Reabrir la ruta no vuelve a sacar la ventana; un aviso nuevo entra como NUEVO, arriba, y al abrirlo deja de contar y se queda */
{
  // Un aviso nuevo en la ruta (la ventana ya se vio con los 3 de antes: se pone la firma al día para probar solo la campana).
  await ev(a, `(async () => { const { dateNoticesKey } = await import('/src/lib/dateNotices.ts'); const r = structuredClone(${R}.getState().route); r.dateNotices = ${JSON.stringify([...AVISOS, EXTRA[0]])}; r.dateNoticesSeenKey = dateNoticesKey(r.dateNotices); r.dateNoticesRead = ${JSON.stringify(AVISOS.map((n) => n.id))}; ${R}.setState({ route: r, openDateNoticeId: null }); return true })()`)
  await a.esp(600)
  debe((await ventana(a)) === null, 'campana', 'con la firma al día, la ventana no vuelve a salir')
  await abrirCampana(a)
  let c = await campana(a)
  debe(c.filas.length === 4 && c.filas[0].id === 'd-nuevo' && c.filas[0].estado === 'nuevo', 'campana', `el aviso nuevo entra como NUEVO y arriba, encima de los leídos (${JSON.stringify(c.filas.map((f) => `${f.id}:${f.estado}`))})`)
  debe(c.cuenta - c.fijos === 1, 'campana', `el numerito cuenta el nuevo (${c.etiqueta}, fijos ${c.fijos})`)
  await a.captura(path.join(SALIDA, 'campana_nuevo_y_leidos.jpg'))
  await clic(a, '[data-aviso-fecha="d-nuevo"]')
  await a.esp(900)
  const uno = await ventana(a)
  debe(uno?.modo === 'uno' && uno.flechas.length === 0 && uno.puntos === 0 && uno.contador === null && uno.boton === 'Entendido', 'campana', 'al tocarlo se abre su tarjeta, completa y sin flechas ni puntitos')
  debe(uno?.titulos?.[0] === EXTRA[0].title && EXTRA[0].texts.every((t) => uno.textoVentana.includes(t)), 'campana', 'la tarjeta lleva todo lo de esa fecha (título y textos)')
  debe(uno && Math.abs(uno.centroX - uno.vw / 2) <= 2 && uno.ancho === Math.min(390, uno.vw - 32), 'campana', 'la tarjeta abierta desde la campana es la misma: centrada y de 390 px')
  await a.captura(path.join(SALIDA, 'campana_tarjeta_abierta.jpg'))
  debe((await estado(a)).leidos?.includes('d-nuevo'), 'campana', 'abrirlo lo marca como leído')
  await clic(a, '[data-ventana-avisos] [data-aviso-boton]')
  await a.esp(600)
  await abrirCampana(a)
  c = await campana(a)
  debe(c.filas.length === 4 && c.filas.find((f) => f.id === 'd-nuevo')?.estado === 'leido' && c.cuenta - c.fijos === 0, 'campana', `leído: deja de contar pero se queda en la lista (${c.etiqueta}, fijos ${c.fijos})`)
  await cerrarCampana(a)
}

/* 3c. Cambiar las fechas (setRoute con la ruta rehecha): los que siguen tocando se quedan leídos, el nuevo entra como nuevo, el que ya no toca se va */
{
  const resultado = await ev(a, `(() => {
    const s = ${R}.getState()
    const nueva = structuredClone(s.route)
    nueva.dateNotices = [...nueva.dateNotices.filter((n) => n.id !== 'a-15ago'), ${JSON.stringify(EXTRA[1])}]
    nueva.dateNoticesRead = undefined
    nueva.dateNoticesSeenKey = null
    nueva.seasonNoteDismissed = false
    ${R}.setState({ keepBookingsOnNextRoute: true })
    s.setRoute(nueva)
    const r = ${R}.getState().route
    return { ids: r.dateNotices.map((n) => n.id), leidos: r.dateNoticesRead, clave: r.dateNoticesSeenKey, descartada: r.seasonNoteDismissed }
  })()`)
  debe(resultado.ids.includes('e-otro') && !resultado.ids.includes('a-15ago'), 'fechas', 'la ruta rehecha trae los avisos de las fechas nuevas')
  debe(resultado.leidos?.includes('b-domingo3') && resultado.leidos.includes('d-nuevo') && !resultado.leidos.includes('e-otro') && !resultado.leidos.includes('a-15ago'), 'fechas', `los leídos que siguen tocando se quedan leídos; el nuevo no (${JSON.stringify(resultado.leidos)})`)
  await a.esp(900)
  debe((await ventana(a)) === null && (await ev(a, "document.querySelector('[data-tarjeta-especial]')")) === null, 'fechas', 'al cambiar las fechas no se vuelve a abrir la ventana ni la tarjeta cerrada')
  await abrirCampana(a)
  const c = await campana(a)
  debe(c.filas[0]?.id === 'e-otro' && c.filas[0].estado === 'nuevo', 'fechas', `el aviso de las fechas nuevas entra como NUEVO y arriba (${JSON.stringify(c.filas.map((f) => `${f.id}:${f.estado}`))})`)
  debe(!c.filas.some((f) => f.id === 'a-15ago'), 'fechas', 'el aviso de una fecha que ya no está en el viaje se quita de la campana')
  debe(c.cuenta - c.fijos === 1, 'fechas', `solo el nuevo cuenta en el numerito (${c.etiqueta}, fijos ${c.fijos})`)
  await cerrarCampana(a)
}

/* 3d. Sin tarjeta especial, los avisos salen directamente; con más de 3, la tercera dice «y N más» */
{
  await poner(a, { seasonNote: null, seasonNoteDismissed: false, dateNotices: [...AVISOS, ...EXTRA], dateNoticesSeenKey: null, dateNoticesRead: undefined })
  await a.esp(900)
  const v = await ventana(a)
  debe(v?.modo === 'todos' && (await ev(a, "document.querySelector('[data-tarjeta-especial]')")) === null, 'orden', 'sin tarjeta especial, los avisos salen directamente')
  debe(v?.contador === '1 de 3' && v.puntos === 3, 'ventana', 'con 5 avisos, como mucho 3 tarjetas')
  await clic(a, '[data-aviso-boton]')
  await a.esp(700)
  await clic(a, '[data-aviso-boton]')
  await a.esp(900)
  const t = await ventana(a)
  debe(t?.contador === '3 de 3' && t.titulos.includes('y 3 más') && t.mas === 3 && t.boton === 'Entendido', 'ventana', `la tercera dice «y 3 más» y los lista (${JSON.stringify([t?.contador, t?.titulos, t?.mas])})`)
  await a.captura(path.join(SALIDA, 'ventana_avisos_y_mas.jpg'))
  await clic(a, '[data-aviso-boton]')
  await a.esp(600)
  const s = await estado(a)
  debe([...AVISOS, ...EXTRA].every((n) => s.leidos?.includes(n.id)), 'campana', 'los 5 (también los que iban en «y 3 más») entran como leídos')
}

/* 3e. Una a una, las tres tarjetas dentro de la app: la clave `cumpleanos_ciudad` también vale; una estación de antes no saca nada */
{
  for (const [season, clave] of [['cumpleanos_ciudad', 'cumpleanos'], ['navidad', 'navidad'], ['cumpleanos', 'cumpleanos'], ['primavera', null]]) {
    await poner(a, { seasonNote: { season, title: 'X', text: TEXTOS[clave ?? 'navidad'] }, seasonNoteDismissed: false, dateNotices: [] })
    await a.esp(500)
    const t = await ev(a, "document.querySelector('[data-tarjeta-especial]')?.getAttribute('data-tarjeta-especial') ?? null")
    debe(t === clave, 'tarjetas', `season «${season}» saca ${clave ? `la de ${clave}` : 'ninguna tarjeta'} (${t})`)
  }
  await poner(a, { seasonNote: null, seasonNoteDismissed: false })
}

/* 3f. DÍAS: sin pastillas de avisos y sin «el sol se pone» */
{
  const dia1 = await ev(a, `${R}.getState().route.days[0].id`)
  await ev(a, `(async () => {
    const { dateNoticesKey } = await import('/src/lib/dateNotices.ts')
    const r = structuredClone(${R}.getState().route)
    r.dateNotices = ${JSON.stringify(AVISOS.map((n, i) => ({ ...n, dateIso: ['2026-10-17', '2026-10-18', '2026-10-19'][i], dayNumber: i + 1 })))}
    r.dateNoticesSeenKey = dateNoticesKey(r.dateNotices)
    r.days.forEach((d) => { d.sunsetText = 'Hoy el sol se pone a las 17:05' })
    ${R}.setState({ route: r, openDateNoticeId: null })
    ${R}.getState().setMode('days')
    ${R}.getState().setActiveDayId(${JSON.stringify(dia1)})
    return true
  })()`)
  await a.esp(1500)
  const html = await ev(a, 'document.body.innerText')
  debe(!/Panteón cerrado|Horario especial|Año Nuevo|Foro Romano cerrado|Coliseo cerrado|Museos Vaticanos cerrados/.test(html), 'dias', 'DÍAS no enseña ninguna pastilla de los avisos de fechas')
  debe(!/el sol se pone/i.test(html), 'dias', 'DÍAS no enseña «Hoy el sol se pone a las…» (con el día abierto)')
  debe(await ev(a, "document.querySelectorAll('[data-titulo-del-dia]').length > 0"), 'dias', 'DÍAS se ve (hay títulos de día)')
  await a.captura(path.join(SALIDA, 'dias_sin_pastillas.jpg'))
}

a.cerrar()

console.log(`Tanda 10M (app): ${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
