// La prueba de la Tanda V38 (parte «resumen»): la hoja de fechas sin chocar con la X, la hoja «sorpresas por reclamar» con su X entera, el Resumen del viaje (tocar un logro de viajero abre SU ficha,
// la misma pieza que la pestaña Logros) y los días con nombre con sentido (punto 5).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV38_resumen.mjs        (CAP=antes para las capturas de antes; por defecto «despues»)
// Ninguna parte toca el Supabase de producción (el Chrome de prueba lo bloquea) y la app usa el servidor de mentira de la demo (?logrosDemo=1). Capturas en docs/dias/V38_capturas/.
import fs from 'node:fs'
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
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const CAP = process.env.CAP ?? 'despues'
const CAPTURAS = 'docs/dias/V38_capturas'
fs.mkdirSync(CAPTURAS, { recursive: true })

/* ───────── 1. El código ───────── */
console.log('1. El código')
{
  const aviso = leer('src/components/route/AvisoDeFechaTarjeta.tsx')
  const season = leer('src/components/route/SeasonCard.tsx')
  const resumen = leer('src/components/logros/momentos/ResumenViaje.tsx')
  debe(!/whitespace-nowrap[^"]*uppercase[^"]*[^"]*">\s*\n\s*Hemos preparado/.test(aviso) && /data-titulo-fechas/.test(aviso) && /data-titulo-fechas/.test(season), 'titulo', 'el título «Hemos preparado tu viaje…» ya no es de una línea sin salida: lleva hueco para la X y puede ir en dos líneas (las dos tarjetas)')
  debe(/<HojasDeLogros g=\{ganados\} \/>/.test(resumen) && /import \{ HojasDeLogros \}/.test(resumen), 'ficha', 'el Resumen del viaje usa HojasDeLogros/FichaHoja de la pestaña Logros (la misma pieza)')
  debe(!/function FichaDeViajero|const FichaViajero/.test(resumen), 'ficha', 'el Resumen no lleva una copia de la ficha')
  debe(/Ver mi sello/.test(resumen) && /Estampar mi sello/.test(resumen), 'sello', 'el botón «Ver mi sello» del pasaporte se queda')
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la Tanda V38 (resumen): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────── 2. En pantalla ───────── */
console.log('2. En pantalla (demo de logros; ningún Supabase de verdad)')
const app = await abrirApp(APP, { ancho: 390, alto: 844, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=completa&apertura=0', antes: 'performance.setResourceTimingBufferSize(20000)' })
const ev = (js) => app.evaluar(js)
const J = async (js) => {
  const r = await ev(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const esperar = async (js, intentos = 40, ms = 400) => {
  for (let i = 0; i < intentos; i++) {
    if (await ev(js).catch(() => false)) return true
    await app.esp(ms)
  }
  return false
}
const tamano = (ancho, alto = 844) => app.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: true })
try {
  for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  await ev("window.__imp = (p) => { const e = performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.includes(p)).pop(); return import(e ?? p) }; true")
  // (La API puede no estar encendida: no se genera ningún viaje con el motor; se crea el viaje base con la pantalla «Dev: ruta rápida», que no llama a nada.)
  await ev("__imp('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setScreen('devQuickRoute'); return true })")
  await esperar("Array.from(document.querySelectorAll('input')).some((x) => x.placeholder === 'Madrid')", 120, 500)
  await ev(`(() => { const poner = (c, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(c, v); c.dispatchEvent(new Event('input', { bubbles: true })) }; const c = Array.from(document.querySelectorAll('input')); poner(c.find((x) => x.placeholder === 'Madrid'), 'Madrid'); poner(c.find((x) => /Parada 1/.test(x.placeholder)), 'Roma'); return true })()`)
  await esperar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent.includes('Continuar')); return Boolean(b && !b.disabled && (b.click(), true)) })()", 60, 500)
  await esperar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent.includes('Crear ruta')); return Boolean(b && !b.disabled && (b.click(), true)) })()", 60, 500)
  await esperar("__imp('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))", 90, 1000)
  await app.esp(3000)
  for (let i = 0; i < 6; i++) {
    const hecho = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Empezar mi día)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!hecho) break
    await app.esp(700)
  }

  /* ── 2a. La hoja de fechas: el título no choca con la X (320, 375, 430; y en pantalla baja) ── */
  console.log('  2a. Hoja de fechas')
  const poner = `__imp('/src/store/useRouteStore.ts').then((m) => { const s = m.useRouteStore.getState(); m.useRouteStore.setState({ route: { ...s.route, dateNoticesSeenKey: 'x', dateNotices: [{ id: 'cierre-prueba', dayNumber: 4, dateIso: '2026-11-29', icon: 'cerrado', title: 'Los domingos cierran los Museos Vaticanos', tag: 'Domingo', texts: ['Ese día los Museos Vaticanos están cerrados.'], kind: 'auto' }] } }); m.useRouteStore.getState().setOpenDateNoticeId('cierre-prueba'); return true })`
  const medirTitulo = `(() => {
    const p = document.querySelector('[data-aviso-tarjeta] [data-titulo-fechas]') ?? Array.from(document.querySelectorAll('[data-aviso-tarjeta] p')).find((x) => /Hemos preparado/i.test(x.textContent))
    const panel = document.querySelector('.trazo-notice-panel'); const x = panel?.querySelector('[data-cruz-de-hoja]')
    if (!p || !panel || !x) return JSON.stringify({ falta: true })
    const r = document.createRange(); r.selectNodeContents(p)
    const rects = Array.from(r.getClientRects()).filter((q) => q.width > 1)
    const xr = x.getBoundingClientRect(), pr = panel.getBoundingClientRect()
    const choca = rects.some((q) => q.left < xr.right && q.right > xr.left && q.top < xr.bottom && q.bottom > xr.top)
    const fuera = rects.some((q) => q.left < pr.left - 0.5 || q.right > pr.right + 0.5)
    return JSON.stringify({ lineas: new Set(rects.map((q) => Math.round(q.top))).size, choca, fuera, alto: innerHeight, ancho: innerWidth })
  })()`
  await ev(poner)
  await esperar("Boolean(document.querySelector('[data-aviso-tarjeta]'))", 30, 300)
  for (const [ancho, alto] of [[320, 568], [375, 667], [430, 932], [390, 844], [375, 600]]) {
    await tamano(ancho, alto)
    await app.esp(500)
    const m = await J(medirTitulo)
    debe(!m.falta && !m.choca && !m.fuera, 'titulo', `el título de la hoja de fechas no choca con la X ni se sale de la hoja a ${ancho}x${alto} (${JSON.stringify(m)})`)
    if (ancho === 375 && alto === 600) await app.captura(`${CAPTURAS}/titulo_fechas_${CAP}.jpg`)
  }
  await tamano(390, 844)
  await app.esp(300)
  await ev("__imp('/src/store/useRouteStore.ts').then((m) => { m.useRouteStore.getState().setOpenDateNoticeId(null); m.useRouteStore.setState({ route: { ...m.useRouteStore.getState().route, dateNotices: [] } }); return true })")
  await app.esp(400)

  /* ── 2b. El Resumen del viaje: la hoja de sorpresas y la ficha del logro de viajero ── */
  console.log('  2b. Resumen del viaje')
  const estado = JSON.parse(leer('src/dev/escaparates/datos/hoja_lz_completa.json'))
  const demo = JSON.parse(leer('src/lib/logrosDemo_ganados_datos.json')).lleno
  const itemsV = demo.items.filter((i) => i.tipo === 'viajero' && !i.superado).slice(0, 6)
  const ganado = itemsV.map((i, k) => ({ clave: i.clave, logro: i.logro, escalon: i.escalon, destino: i.destino ?? '*', en: '2026-11-13T10:00:00Z' + k }))
  const defs = demo.viajero.flatMap((g) => g.filas).map((f) => ({ id: f.id, grupo: f.grupo, nombre: f.nombre, linea: f.linea ?? '', escalones: [] }))
  const resumenDemo = { ok: true, ganado, por_categoria: {}, pendiente: { sorpresas: 4, pedazos: 4, dias_para_reclamar: 20, texto: null, pendientes: [
    { fecha: '2026-11-11', dia: 8, sitio: 'haria_pueblo', nombre: 'Haría', falta: ['pedazo'], colecciones: ['Los pueblos con alma'] },
    { fecha: '2026-11-11', dia: 3, sitio: 'casa_museo_cesar_manrique', nombre: 'Casa-Museo César Manrique', falta: ['pedazo'], colecciones: ['Manrique'] },
    { fecha: '2026-11-12', dia: 4, sitio: 'el_golfo_pueblo', nombre: 'El Golfo', falta: ['pedazo'], colecciones: ['Fuego y mar'] },
    { fecha: '2026-11-12', dia: 4, sitio: 'charco_de_los_clicos', nombre: 'Charco de los Clicos', falta: ['pedazo'], colecciones: ['Fuego y mar'] },
    { fecha: '2026-11-13', dia: 5, sitio: 'timanfaya', nombre: 'Parque Nacional de Timanfaya', falta: ['pedazo'], colecciones: ['Tierra de fuego', 'Los imprescindibles'] },
    { fecha: '2026-11-13', dia: 5, sitio: 'jameos', nombre: 'Jameos del Agua', falta: ['pedazo'], colecciones: ['Manrique'] },
  ] }, texto_viaje: 'Un viaje', texto_viaje_tipo: 'wow' }
  await ev(`window.__demoGanados.poner('lleno'); Promise.all([__imp('/src/components/logros/momentos/api.ts'), __imp('/src/components/logros/momentos/useMomentosUI.ts'), __imp('/src/components/logros/pantallas/todos/api.ts')]).then(([api, ui, g]) => { api.datosDePrueba.estado = ${JSON.stringify(estado)}; api.datosDePrueba.resumen = ${JSON.stringify(resumenDemo)}; api.datosDePruebaViajero.v = ${JSON.stringify({ ok: true, logros: defs })}; g.useGanados.setState({ datos: null, estado: 'sin_pedir' }); ui.useMomentosUI.getState().abrirResumenViaje(); return true })`)
  debe(await esperar("Boolean(document.querySelector('[data-resumen-viajero] [data-chapa-igual]'))", 60, 400), 'resumen', 'el Resumen del viaje sale con sus logros de viajero')
  if (fallos.some((x) => x.regla === 'resumen')) console.log('   diag:', JSON.stringify(await ev("__imp('/src/components/logros/momentos/api.ts').then((m) => JSON.stringify({ est: Boolean(m.datosDePrueba.estado), res: Boolean(m.datosDePrueba.resumen), v: Boolean(m.datosDePruebaViajero.v), res_ganado: m.datosDePrueba.resumen?.ganado?.length, url: performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.includes('momentos/api')) }))")))
  await app.esp(2500)

  // La hoja de sorpresas: su X entera, con contraste, y el título que no queda debajo.
  const medirSorpresas = `(() => {
    const d = document.querySelector('[data-hoja-sorpresas]'); if (!d) return JSON.stringify({ falta: true })
    const x = d.querySelector('[data-cruz-de-hoja]'); const circ = x?.firstElementChild
    const t = Array.from(d.querySelectorAll('span')).find((s) => /por reclamar/.test(s.textContent) && s.children.length === 0)
    const xr = x.getBoundingClientRect(), cr = circ.getBoundingClientRect(), tr = t.getBoundingClientRect()
    const rg = document.createRange(); rg.selectNodeContents(t); const rects = Array.from(rg.getClientRects()).filter((q) => q.width > 1)
    const chocaTitulo = rects.some((q) => q.left < xr.right && q.right > xr.left && q.top < xr.bottom && q.bottom > xr.top)
    const cs = getComputedStyle(circ), color = getComputedStyle(circ).backgroundColor
    const trazo = getComputedStyle(circ.querySelector('svg')).color
    return JSON.stringify({ x: { l: Math.round(cr.left), t: Math.round(cr.top), r: Math.round(cr.right), b: Math.round(cr.bottom), w: Math.round(cr.width), h: Math.round(cr.height) }, entera: cr.top >= 0 && cr.left >= 0 && cr.right <= innerWidth && cr.bottom <= innerHeight, chocaTitulo, fondo: color, trazo, ancho: innerWidth, titulo: { t: Math.round(tr.top), b: Math.round(tr.bottom) } })
  })()`
  await ev("document.querySelector('[data-sorpresas-por-reclamar]').scrollIntoView({ block: 'center' }); document.querySelector('[data-sorpresas-por-reclamar]').click(); true")
  debe(await esperar("Boolean(document.querySelector('[data-hoja-sorpresas]'))", 30, 300), 'sorpresas', 'tocar la tarjeta abre la hoja de sorpresas')
  await app.esp(900)
  for (const [ancho, alto] of [[390, 844], [320, 568], [375, 667], [430, 932]]) {
    await tamano(ancho, alto)
    await app.esp(500)
    const s = await J(medirSorpresas)
    debe(!s.falta && s.entera && !s.chocaTitulo && s.x.w >= 36 && s.x.h >= 36, 'sorpresas', `la X de «sorpresas por reclamar» se ve entera y el título no queda debajo a ${ancho}x${alto} (${JSON.stringify(s.x)}, entera=${s.entera}, choca=${s.chocaTitulo})`)
    if (ancho === 390) {
      debe(/^rgb\(/.test(s.fondo) && !/rgba/.test(s.fondo) && s.fondo !== 'rgb(255, 253, 248)', 'sorpresas', `la X tiene su círculo con contraste sobre la hoja (${s.fondo}, trazo ${s.trazo})`)
      await app.captura(`${CAPTURAS}/sorpresas_${CAP}.jpg`)
    }
  }
  await tamano(390, 844)
  await app.esp(300)
  // Punto 5: el número del día sale de las fechas del viaje, no del «número» guardado (con un viaje de fechas cambiadas salía «Día 8» el cuarto día).
  const filasDia = await J("JSON.stringify(Array.from(document.querySelectorAll('[data-hoja-sorpresas] [data-sorpresa]')).map((e) => e.innerText.split(String.fromCharCode(10)).join(' | ')))")
  const dif = (f) => Math.round((Date.parse(f + 'T12:00:00Z') - Date.parse(estado.viaje.inicio + 'T12:00:00Z')) / 86400000) + 1
  debe(filasDia[0]?.includes(`Día ${dif('2026-11-11')} · mié 11`) && !/Día 8/.test(filasDia[0]), 'nombres', `la hoja de sorpresas cuenta el día por las fechas del viaje (el servidor mandó 8): «${filasDia[0]}»`)
  await ev("document.querySelector('[data-hoja-sorpresas] [data-cruz-de-hoja]').click(); true")
  await app.esp(500)
  debe(!(await ev("Boolean(document.querySelector('[data-hoja-sorpresas]'))")), 'sorpresas', 'tocar la X cierra la hoja de sorpresas')

  // Tocar un logro de viajero abre su ficha (la misma pieza de la pestaña Logros).
  const botones = await J("JSON.stringify(Array.from(document.querySelectorAll('[data-resumen-viajero] [data-logro-de-viajero]')).map((b) => ({ id: b.dataset.logroDeViajero, texto: b.innerText.trim() })))")
  debe(botones.length >= 3, 'ficha', `los logros de viajero del resumen se tocan (${botones.length}: ${botones.map((b) => b.texto).join(' / ')})`)
  if (CAP === 'antes') {
    await app.captura(`${CAPTURAS}/ficha_logro_viajero_${CAP}.jpg`)
  } else {
    await ev("(() => { const b = document.querySelector('[data-resumen-viajero] [data-logro-de-viajero=\"viajes\"]') ?? document.querySelector('[data-resumen-viajero] [data-logro-de-viajero]'); b.scrollIntoView({ block: 'center' }); b.click(); return true })()")
    debe(await esperar("Boolean(document.querySelector('[data-ficha-del-resumen] [data-ficha]'))", 30, 300), 'ficha', 'tocar un logro de viajero abre su ficha')
    await app.esp(900)
    const f = await J(`(() => { const d = document.querySelector('[data-ficha-del-resumen] [data-ficha]'); if (!d) return JSON.stringify({}); const t = d.innerText; return JSON.stringify({ texto: t, dibujo: Boolean(d.querySelector('svg, img, [data-chapa-igual], canvas')), compartir: Array.from(d.querySelectorAll('button')).some((b) => /Compartir/.test(b.textContent)) }) })()`)
    debe(/(CÓMO VIAJAS|EL MUNDO|COLECCIONISTA|EL TIEMPO|EXCLUSIVO)/i.test(f.texto ?? ''), 'ficha', `la ficha dice su grupo (la pieza de la pestaña Logros dice «CÓMO VIAJAS · VIAJES») (${(f.texto ?? '').split('\n').slice(0, 3).join(' | ')})`)
    debe(/Conseguido el \d/.test(f.texto ?? ''), 'ficha', 'la ficha dice «Conseguido el…»')
    debe(f.compartir && f.dibujo, 'ficha', 'la ficha lleva el dibujo grande y [Compartir]')
    await app.captura(`${CAPTURAS}/ficha_logro_viajero_${CAP}.jpg`)
    // Es la misma pieza: la ficha de la pestaña Logros, abierta con la misma clave, dice lo mismo.
    const clave = await ev("document.querySelector('[data-ficha-del-resumen] [data-ficha]').dataset.ficha")
    await ev("__imp('/src/components/logros/pantallas/todos/api.ts').then((m) => { m.useHojasDeLogros.getState().cerrarFicha(); return true })")
    await app.esp(400)
    debe(!(await ev("Boolean(document.querySelector('[data-ficha-del-resumen] [data-ficha]'))")), 'ficha', 'la ficha se cierra')
    await ev(`__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().abrir({ t: 'ficha', clave: ${JSON.stringify(clave)} }); return true })`)
    await esperar("Boolean(document.querySelector('[data-pantalla-logros=\"FichaDeLogro\"] [data-ficha]'))", 30, 300)
    const g = await ev("document.querySelector('[data-pantalla-logros=\"FichaDeLogro\"] [data-ficha]')?.innerText ?? ''")
    debe(g === f.texto, 'ficha', 'la ficha del Resumen y la de la pestaña Logros son la misma pieza (mismo texto)')
    await ev("__imp('/src/components/logros/pantallas/useLogrosPantallas.ts').then((m) => { m.useLogrosPantallas.getState().cerrarTodo(); return true })")
  }
  const verSello = await ev("document.querySelector('[data-estampar-sello]')?.innerText ?? null")
  debe(verSello === null || /mi sello/i.test(verSello), 'sello', `el botón del pasaporte se queda (${verSello})`)
  await ev("__imp('/src/components/logros/momentos/useMomentosUI.ts').then((ui) => { ui.useMomentosUI.getState().cerrarResumenViaje(); return true })")
  await app.esp(300)

  /* ── 2c. Los días con nombre con sentido (punto 5) ── */
  console.log('  2c. Nombres de los días')
  // (Se rellena en la parte del punto 5.)
  const regla = await J(`__imp('/src/lib/nombreDeDia.ts').then((m) => { const r = { answers: { dateRange: { start: '2026-11-26', end: '2026-11-30' } } }; return JSON.stringify([m.esNombreDeOtroDia(r, { dayNumber: 4, title: 'Día 8' }), m.esNombreDeOtroDia(r, { dayNumber: 8, title: 'Día 8' }), m.esNombreDeOtroDia(r, { dayNumber: 4, title: 'Día 8', nameByUser: true }), m.esNombreDeOtroDia(r, { dayNumber: 4, title: 'Mi día en Roma' })]) })`)
  debe(regla[0] === true && regla[1] === false && regla[2] === false && regla[3] === false, 'nombres', `un día llamado «Día 8» siendo el cuarto no enseña ese nombre; si el viajero lo escribió, sí (${JSON.stringify(regla)})`)
  const dias = await J("__imp('/src/store/useRouteStore.ts').then((m) => JSON.stringify((m.useRouteStore.getState().route?.days ?? []).map((d) => ({ n: d.dayNumber, titulo: d.title ?? d.name ?? null }))))")
  debe(dias.length > 0 && dias.every((d) => !/^Día \d+$/i.test(String(d.titulo ?? '').trim()) || d.titulo === `Día ${d.n}`), 'nombres', `ningún día se llama «Día N» con un N que no es el suyo (${dias.map((d) => d.titulo).join(' / ')})`)
} finally {
  app.cerrar()
}
console.log(`\nPrueba de la Tanda V38 (resumen): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
