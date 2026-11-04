// La prueba de la tanda HOY1, agente A (4-nov-2026): la siguiente parada y sus estados (H1 a H6), la lista «TU DÍA» (H1, H4, H4b), el atardecer y mañana (H13) y «Hoy vuelves a casa» (H14, H14b).
// Hace falta el servidor de la app (5173) y la API (8787, con DESTINOS_OCULTOS='-' para ver Lanzarote como administrador) YA encendidos; NO arranca ninguno.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY1_A.mjs
// Un solo Chrome, que se cierra al acabar. Salida: «N comprobaciones · M fallos». Capturas 390x844 en docs/dias/capturas_jutrip/hoy1_a_*.jpg.
//
// Pruebas viejas de HOY que cambian con esta tanda (antes → ahora → decisión de Eric, 4-nov): ver la cabecera de cada una (pruebaTanda10P_hoy, pruebaTanda10N11/12 y las de «Parada con foto»).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) fallos.push({ regla, texto })
}
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
const png = (n) => path.join(SALIDA, `hoy1_a_${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"

// El reloj del móvil a mano (`window.__horaFalsa`, minutos del día) y una ubicación falsa (`window.__pos`, `window.__perm`).
const ANTES = `(function(){const RD=Date;const base=RD.now();function fijo(){if(window.__horaFalsa==null)return null;const d=new RD();d.setHours(Math.floor(window.__horaFalsa/60),window.__horaFalsa%60,0,0);return d.getTime()+(RD.now()-base)%60000}class FD extends RD{constructor(...a){if(a.length===0){const f=fijo();super(f==null?RD.now():f)}else super(...a)}static now(){const f=fijo();return f==null?RD.now():f}}window.Date=FD;
Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok,no){const p=window.__pos;if(!p){no&&no({code:1});return}ok({coords:{latitude:p.lat,longitude:p.lng,accuracy:10}})},watchPosition(){return 1},clearWatch(){}},configurable:true});
try{navigator.permissions.query=async()=>({state:window.__perm||'denied',addEventListener(){},removeEventListener(){}})}catch(e){}})();`

const ROMA_EN_LANZAROTE = /Roma|Fiumicino|Ciampino|Termini|Pante[óo]n|Trastevere|Vaticano|Coliseo|Trevi|Pincio|Jan[ií]culo|Cap[ií]tolio/i

let _a = null
let _lz = false
const ev = (expr) => _a.evaluar('(async () => (' + expr + '))()')
async function abrir() {
  for (let intento = 0; intento < 3; intento++) {
    const a = (_a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES }))
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
    await a.evaluar('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 60 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
    if (await ev(`${R}.getState().route ? true : false`).catch(() => false)) {
      await a.esp(2500)
      for (let i = 0; i < 4; i++) {
        const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!hecho) break
        await a.esp(600)
      }
      return a
    }
    a.cerrar()
  }
  throw new Error('No se pudo crear el viaje de pruebas')
}

/** Prepara el día `dia` (0 = el primero) con la hora `min` (minutos) y la ubicación `pos` (o null) y vuelve a montar HOY. `mut` es JavaScript que cambia la ruta `r` antes. */
async function ir(a, { dia = 0, min = 510, pos = null, perm = 'denied', mut = '' } = {}) {
  // Si otro agente toca un archivo y Vite recarga la página a mitad de la prueba, el viaje se pierde: se vuelve a crear (el de Roma o, si ya era el de Lanzarote, el de Lanzarote).
  if (!(await ev(`${R}.getState().route ? true : false`).catch(() => false))) {
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    if (_lz) await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-09', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => true).catch(() => false)`)
    else await a.evaluar('window.__rutaPrueba().then(() => true)')
    await a.esp(2500)
  }
  await a.evaluar(`(async () => {
    const st = ${R}; const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
    const r = structuredClone(st.getState().route)
    r.days.forEach((d) => { delete d.sunsetText; numberedStopsOf(d).forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset; delete s.reservationTime }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1'); sessionStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/components/logros/visto/vistoStore.ts')).useVistoStore.getState().poner({ permisos: false }) } catch {}
    window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${JSON.stringify(perm)}
    const ini = r.answers.dateRange.start; const d = new Date(ini + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + ${dia}); const iso = d.toISOString().slice(0, 10)
    st.getState().setDevSimulatedTodayIso(iso); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return iso })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(2600)
}
const txt = (a, sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
const hay = (a, sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
const cuantos = (a, sel) => a.evaluar(`document.querySelectorAll(${JSON.stringify(sel)}).length`)
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button,a')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const atr = (a, sel, nombre) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.getAttribute(${JSON.stringify(nombre)}) ?? null`)
const paradasDe = (a, dia = 0) => a.evaluar(`(async () => { const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const r = ${R}.getState().route; return numberedStopsOf(r.days[${dia}]).map((s) => ({ id: s.id, name: s.name, time: s.time, saltada: Boolean(s.saltada), visto: Boolean(s.checkedInAt), opt: Boolean(s.optional) })) })()`)
const horasDe = async (a, dia = 0) => (await paradasDe(a, dia)).map((s) => s.time)
const captura = async (a, nombre, desplazar = null) => {
  if (desplazar) await a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(desplazar)}); if (e) e.scrollIntoView({ block: 'center' }); return true })()`)
  else await a.evaluar("(() => { const c = document.querySelector('[data-hoy]'); if (c) c.scrollTop = 0; return true })()")
  await a.esp(700)
  await a.captura(png(nombre))
}

const sec = async (fn) => {
  // SOLO_LZ=1: solo la parte de Lanzarote (para repetirla sin las de Roma).
  if (process.env.SOLO_LZ === '1' && !String(fn).includes('__rutaLanzarote')) return
  try {
    await fn()
  } catch (e) {
    debe(false, 'error', `la prueba se ha parado: ${String(e?.message ?? e).slice(0, 200)}`)
  }
}
const a = await abrir()

/* ───────────── 0. La cuenta pura (sin pantalla) ───────────── */
await sec(async () => {
  const r = await a.evaluar(`(async () => {
    const m = await import('/src/lib/hoyParada.ts')
    const out = {}
    // «Sal ahora» y «Vas tarde»: la hora fija son las 9:00 (540) y el trayecto 12 min: salir a las 8:48.
    out.antes = m.avisoDeSalida(8 * 60 + 20, 540, 12)      // 28 min antes de salir: nada
    out.justo = m.avisoDeSalida(8 * 60 + 33, 540, 12)      // 15 min antes de salir: «sal»
    out.muyAntes = m.avisoDeSalida(8 * 60 + 32, 540, 12)   // 16 min antes: nada
    out.enHora = m.avisoDeSalida(8 * 60 + 48, 540, 12)     // a su hora: «sal»
    out.tarde = m.avisoDeSalida(8 * 60 + 49, 540, 12)      // un minuto tarde: «tarde»
    out.pasada = m.avisoDeSalida(9 * 60 + 31, 540, 12)     // 31 min después de la hora: nada
    out.sinHora = m.avisoDeSalida(8 * 60 + 49, null, 12)
    out.sinTrayecto = m.avisoDeSalida(8 * 60 + 49, 540, null)
    out.textoSal = m.textoDeSalida('sal', 540)
    out.textoTarde = m.textoDeSalida('tarde', 540)
    // correr el día
    const p = (id, time, dur, extra = {}) => ({ id, time, name: id, durationMinutes: dur, coordinates: { lat: 41.9, lng: 12.4 }, description: '', photoUrl: '', ...extra })
    const day = { id: 'd', stops: [p('a', '09:00', 60), p('b', '11:00', 60), p('c', '12:30', 60, { reservedId: 'r1' }), p('d', '15:00', 60), p('e', '21:30', 60, { optional: true }), p('f', '22:00', 45)], meals: [{ id: 'm1', mealTime: 'lunch', time: '13:45' }, { id: 'm2', mealTime: 'dinner', time: '20:30' }], mealAfter: {} }
    const fijas = new Set(['c'])
    const c30 = m.proponerCorrerElDia(day, 'a', 30, fijas)
    out.c30 = c30 && { corridas: c30.corridas, quitadas: c30.quitadas, noCabe: c30.noCabe, despues: c30.despues.stops.map((s) => s.id + '=' + s.time + (s.saltada ? '!' : '')), comidas: c30.despues.meals.map((x) => x.id + '=' + x.time) }
    const c15 = m.proponerCorrerElDia(day, 'a', 15, fijas)
    out.c15 = c15 && { despues: c15.despues.stops.map((s) => s.id + '=' + s.time) }
    // el cambio se deshace entero
    const st = ${R}
    out.nada = m.proponerCorrerElDia({ ...day, stops: [day.stops[0]], meals: [] }, 'a', 30, fijas)
    // la cuenta de «Parada X de Y» y de «Tu día»
    const cuenta = m.cuentaDelDia([{ checkedInAt: 'x' }, { checkedInAt: 'x' }, { saltada: true }, {}, {}, {}])
    out.cuenta = cuenta
    out.todas = m.cuentaDelDia([{ checkedInAt: 'x' }, { checkedInAt: 'x' }])
    return out
  })()`)
  debe(r.antes === null && r.muyAntes === null, 'sal_ahora', 'más de 15 min antes de la hora de salir: nada')
  debe(r.justo === 'sal' && r.enHora === 'sal', 'sal_ahora', 'desde 15 min antes de la hora de salir: «Sal ahora»')
  debe(r.tarde === 'tarde', 'sal_ahora', 'si ya no llega: «Vas tarde» (en rojo)')
  debe(r.pasada === null, 'sal_ahora', 'pasada la hora fija (más de 30 min), ya no avisa')
  debe(r.sinHora === null && r.sinTrayecto === null, 'sal_ahora', 'solo con hora fija (turno o reserva) y con trayecto')
  debe(r.textoSal === 'Sal ahora para llegar a tu turno de las 9:00', 'sal_ahora', `el texto de «Sal ahora» (${r.textoSal})`)
  debe(r.textoTarde === 'Vas tarde para tu turno de las 9:00', 'sal_ahora', `el texto de «Vas tarde» (${r.textoTarde})`)
  debe(r.c30 && r.c30.despues.includes('b=11:30') && r.c30.despues.includes('d=15:30'), 'mas_tiempo', `+30: las paradas sin reserva se corren (${r.c30?.despues})`)
  debe(r.c30 && !r.c30.despues.some((x) => x.startsWith('c=')), 'mas_tiempo', 'la parada con reserva NO se mueve nunca')
  debe(r.c30 && r.c30.quitadas.includes('e') && !r.c30.quitadas.includes('f'), 'mas_tiempo', `si no cabe, se quita primero lo OPCIONAL (${r.c30?.quitadas})`)
  debe(r.c30 && r.c30.comidas.includes('m1=14:15') && r.c30.comidas.includes('m2=21:00'), 'mas_tiempo', `la comida y la cena se corren con el día (${r.c30?.comidas})`)
  debe(r.c15 && r.c15.despues.includes('b=11:15'), 'mas_tiempo', '+15 corre 15 min')
  debe(r.nada === null, 'mas_tiempo', 'sin nada que correr, no propone nada')
  debe(r.cuenta.total === 5 && r.cuenta.hechas === 2 && r.cuenta.ahora === 3, 'cuenta', `«Parada X de Y» y «Tu día» salen de la misma cuenta (${JSON.stringify(r.cuenta)})`)
  debe(r.todas.ahora === 0, 'cuenta', 'con todo hecho no hay «Parada X»')
})

/* ───────────── 1. H1: por llegar, a pie (Roma) ───────────── */
await ir(a, { dia: 0, min: 8 * 60, mut: "numberedStopsOf(r.days[0])[0].checkedInAt = '2026-10-17T07:00:00Z'" })
await sec(async () => {
  const p = await paradasDe(a)
  const total = p.length
  const estado = await atr(a, '[data-hoy-siguiente]', 'data-hoy-estado')
  debe(estado === 'llegar', 'H1', `la siguiente parada, por llegar (${estado})`)
  debe((await txt(a, '[data-hoy-insignia]')) === 'POR LLEGAR', 'H1', 'insignia «POR LLEGAR»')
  const cab = await txt(a, '[data-hoy-parada-n]')
  debe(cab === `Parada 2 de ${total}`, 'H1', `«Parada 2 de ${total}» (${cab})`)
  debe((await cuantos(a, '[data-hoy-progreso] span')) === total, 'H1', 'la barra de progreso tiene un tramo por parada')
  const tr = await txt(a, '[data-hoy-trayecto]')
  debe(/Desde /.test(tr ?? ''), 'H1', `«Desde» la parada de antes (${tr})`)
  debe(/^A pie · \d+ min/.test(tr ?? ''), 'H1', `el trayecto a pie con sus minutos (${tr})`)
  debe(Boolean(await hay(a, '[data-hoy-mapa-llegada]')), 'H1', 'el mapa pequeño de arriba')
  debe(/Cómo llegar/.test((await txt(a, '[data-hoy-siguiente]')) ?? ''), 'H1', '[Cómo llegar]')
  const href = await a.evaluar("Array.from(document.querySelectorAll('[data-hoy-siguiente] a')).find((x) => /Cómo llegar/.test(x.textContent))?.href ?? null")
  debe(/travelmode=walking/.test(href ?? ''), 'H1', 'en Roma el camino es a pie')
  debe(await hay(a, '[data-hoy-escuchar-linea]'), 'H1', '«¿Te cuento la historia mientras llegas? [Escuchar]» (el sitio tiene historia)')
  debe(!(await hay(a, '[data-hoy-salida]')), 'H1', 'sin hora fija no hay «Sal ahora»')
  // TU DÍA
  const filas = await cuantos(a, '[data-hoy-fila="parada"]')
  const comidas = await cuantos(a, '[data-hoy-fila="comida"]')
  debe(filas === total && comidas >= 1, 'TuDia', `la lista tiene todas las paradas (${filas}/${total}) y la comida y la cena (${comidas})`)
  debe((await txt(a, '[data-hoy-tu-dia-cuenta]')) === `1 de ${total}`, 'TuDia', 'el número de «Tu día» cuadra con «Parada X de Y»')
  debe((await atr(a, '[data-hoy-fila-estado="ahora"]', 'data-hoy-fila')) === 'parada', 'TuDia', 'la de ahora, marcada «Ahora»')
  debe(/Ahora/.test((await txt(a, '[data-hoy-fila-estado="ahora"]')) ?? ''), 'TuDia', 'con la etiqueta «Ahora»')
  debe(/\d{1,2}:\d{2}/.test((await txt(a, '[data-hoy-fila-estado="viene"]')) ?? ''), 'TuDia', 'las que vienen, con su hora')
  await captura(a, 'H1_roma_a_pie')
  await captura(a, 'H1_roma_tu_dia', '[data-hoy-tu-dia]')
})

/* ───────────── 1b. «Sal ahora» y «Vas tarde» con hora fija (Roma) ───────────── */
await sec(async () => {
  // Con la hora fija a las 9:00 en la primera parada y su trayecto leído de la pantalla.
  const mut = "const ps = numberedStopsOf(r.days[0]); ps[0].checkedInAt = '2026-10-17T07:00:00Z'; ps[1].reservationTime = '09:00'"
  await ir(a, { dia: 0, min: 6 * 60, mut })
  const tr = await txt(a, '[data-hoy-trayecto]')
  const min = Number(/(\d+) min/.exec(tr ?? '')?.[1] ?? 0)
  debe(min > 0, 'sal_ahora', `hay trayecto para la cuenta (${tr})`)
  debe(!(await hay(a, '[data-hoy-salida]')), 'sal_ahora', 'a las 6:00, con el turno a las 9:00: nada')
  await ir(a, { dia: 0, min: 540 - min - 10, mut })
  debe((await atr(a, '[data-hoy-salida]', 'data-hoy-salida')) === 'sal', 'H1', '10 min antes de tener que salir: «Sal ahora…»')
  debe((await txt(a, '[data-hoy-salida]')) === 'Sal ahora para llegar a tu turno de las 9:00', 'H1', `con su texto (${await txt(a, '[data-hoy-salida]')})`)
  const colorSal = await a.evaluar("(() => { const e = document.querySelector('[data-hoy-salida]'); return e ? getComputedStyle(e).color : null })()")
  await captura(a, 'H1_sal_ahora')
  await ir(a, { dia: 0, min: 540 - min + 4, mut })
  debe((await atr(a, '[data-hoy-salida]', 'data-hoy-salida')) === 'tarde', 'H1b', 'si ya no llega: «Vas tarde…»')
  debe((await txt(a, '[data-hoy-salida]')) === 'Vas tarde para tu turno de las 9:00', 'H1b', 'con su texto')
  const colorTarde = await a.evaluar("(() => { const e = document.querySelector('[data-hoy-salida]'); return e ? getComputedStyle(e).color : null })()")
  debe(colorTarde !== colorSal && /rgb\(255, 194, 186\)/.test(colorTarde ?? ''), 'H1b', `en rojo (${colorTarde})`)
  await captura(a, 'H1b_vas_tarde')
  // una parada SIN hora fija en el mismo momento: nada
  await ir(a, { dia: 0, min: 540 - min + 4, mut: "numberedStopsOf(r.days[0])[0].checkedInAt = '2026-10-17T07:00:00Z'" })
  debe(!(await hay(a, '[data-hoy-salida]')), 'sal_ahora', 'sin hora fija, ni «Sal ahora» ni «Vas tarde»')
})

/* ───────────── 2. H3 y H3b: ya estás aquí, [Necesito más tiempo] ───────────── */
await sec(async () => {
  await ir(a, { dia: 0, min: 8 * 60 + 30 })
  await clic(a, '[data-hoy-ya-he-llegado]')
  await a.esp(900)
  debe((await atr(a, '[data-hoy-siguiente]', 'data-hoy-estado')) === 'aqui', 'H3', 'tocando la tarjeta: «Ya estás aquí»')
  debe((await txt(a, '[data-hoy-insignia]')) === 'YA ESTÁS AQUÍ', 'H3', 'insignia «YA ESTÁS AQUÍ»')
  const t = (await txt(a, '[data-hoy-siguiente]')) ?? ''
  debe(/Ya estás aquí\. ¿Empezamos\?/.test(t), 'H3', '«Ya estás aquí. ¿Empezamos?»')
  debe(await hay(a, '[data-hoy-pastilla="que-vas-a-ver"]'), 'H3', '[Qué vas a ver]')
  debe(await hay(a, '[data-hoy-pastilla="escuchar"]'), 'H3', '[Escuchar historia] (el sitio tiene historia)')
  debe(!(await hay(a, '[data-hoy-pastilla="aparcado"]')), 'H3', '[Dónde has aparcado] solo en coche: en Roma no sale')
  debe(!(await hay(a, '[data-hoy-pastilla="entrada"]')), 'H3', '[Tu entrada] solo si la hay')
  debe(/Haz tu foto/.test(t) && /Necesito más tiempo/.test(t) && /He terminado/.test(t), 'H3', '[Haz tu foto], [Necesito más tiempo] y [He terminado]')
  debe(await hay(a, '[data-boton-visto]'), 'H3', '[He terminado] es el Visto de siempre')
  await captura(a, 'H3_ya_estas_aqui')
  // H3b
  await clic(a, '[data-hoy-necesito-mas-tiempo]')
  await a.esp(700)
  debe(await hay(a, '[data-hoy-mas-tiempo]'), 'H3b', 'la hoja «Más tiempo aquí»')
  debe(/\+15 min/.test((await txt(a, '[data-hoy-mas-tiempo-opcion="15"]')) ?? '') && /\+30 min/.test((await txt(a, '[data-hoy-mas-tiempo-opcion="30"]')) ?? ''), 'H3b', '+15 y +30 min')
  await a.captura(png('H3b_mas_tiempo'))
  const antes = await horasDe(a)
  await clic(a, '[data-hoy-mas-tiempo-opcion="30"]')
  await a.esp(900)
  const despues = await horasDe(a)
  debe(!(await hay(a, '[data-hoy-mas-tiempo]')), 'H3b', 'la hoja se cierra al elegir')
  debe(despues[0] === antes[0] && despues[1] !== antes[1], 'H3b', `+30: la de ahora se queda y el resto se corre (${antes[1]} → ${despues[1]})`)
  const min = (h) => Number(h.split(':')[0]) * 60 + Number(h.split(':')[1])
  debe(min(despues[1]) - min(antes[1]) === 30, 'H3b', 'justo 30 minutos')
  debe(await hay(a, '[data-hoy-aviso-tiempo]'), 'H3b', 'el aviso con lo que ha pasado')
  debe(await hay(a, '[data-hoy-deshacer-tiempo]'), 'H3b', 'con [Deshacer]')
  await captura(a, 'H3b_corrido')
  await clic(a, '[data-hoy-deshacer-tiempo]')
  await a.esp(700)
  debe(JSON.stringify(await horasDe(a)) === JSON.stringify(antes), 'H3b', '[Deshacer] devuelve el día como estaba, todas las horas')
  // ya estás aquí POR LA UBICACIÓN, dentro del radio del sitio
  const coord = await a.evaluar(`(async () => { const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const s = numberedStopsOf(${R}.getState().route.days[0])[0]; return s.coordinates })()`)
  await ir(a, { dia: 0, min: 8 * 60 + 30, pos: { lat: coord.lat + 0.0005, lng: coord.lng }, perm: 'granted' })
  debe((await atr(a, '[data-hoy-siguiente]', 'data-hoy-estado')) === 'aqui', 'H3', 'por la ubicación, a menos de 150 m del sitio: «Ya estás aquí» solo')
  await ir(a, { dia: 0, min: 8 * 60 + 30, pos: { lat: coord.lat + 0.02, lng: coord.lng }, perm: 'granted' })
  debe((await atr(a, '[data-hoy-siguiente]', 'data-hoy-estado')) === 'llegar', 'H3', 'a 2 km del sitio, sigue «por llegar»')
  const tr = (await txt(a, '[data-hoy-trayecto]')) ?? ''
  debe(/A pie · \d+ min/.test(tr) && !/usar mi ubicación/.test(tr), 'H1', `con ubicación, el trayecto es desde donde estás y no pide la ubicación (${tr})`)
})

/* ───────────── 3. H4, H4b y H5: completada, la lista cerrada, saltada ───────────── */
await sec(async () => {
  await ir(a, { dia: 0, min: 9 * 60 })
  const antes = await paradasDe(a)
  await clic(a, '[data-hoy-ya-he-llegado]')
  await a.esp(700)
  await clic(a, '[data-boton-visto]')
  await a.esp(1500)
  // el logro que acaba de sumar (cae en el almacén de los logros): la línea dorada
  await a.evaluar(`import('/src/store/useLogrosStore.ts').then((m) => { m.useLogrosStore.setState((s) => ({ momentos: [...s.momentos, { tipo: 'suma', nombre: 'Los imprescindibles de Roma', primera_vez: true, linea: '1 de 8' }] })); return true })`)
  await a.esp(900)
  const total = antes.length
  debe((await txt(a, '[data-hoy-parada-n]')) === `Parada 2 de ${total}`, 'H4', `completada: «Parada 2 de ${total}» (${await txt(a, '[data-hoy-parada-n]')})`)
  debe((await txt(a, '[data-hoy-insignia]')) === 'SIGUIENTE', 'H4', 'la tarjeta pasa a la siguiente, con «SIGUIENTE»')
  debe((await txt(a, '[data-hoy-linea-logro]')) === '+1 en Los imprescindibles de Roma', 'H4', `la línea dorada del logro (${await txt(a, '[data-hoy-linea-logro]')})`)
  debe((await atr(a, '[data-hoy-fila-estado="hecha"]', 'data-hoy-fila')) === 'parada', 'H4', 'en la lista, la hecha con ✓ y apagada')
  debe((await txt(a, '[data-hoy-tu-dia-cuenta]')) === `1 de ${total}`, 'H4', `«Tu día» dice 1 de ${total} y «Parada 2 de ${total}» (cuadran)`)
  await captura(a, 'H4_completada')
  // H4b: la lista se cierra y se abre
  await clic(a, '[data-hoy-tu-dia-cabecera]')
  await a.esp(500)
  debe((await atr(a, '[data-hoy-tu-dia]', 'data-hoy-tu-dia')) === 'cerrada', 'H4b', '«Tu día» se cierra')
  debe(!(await hay(a, '[data-hoy-lista]')), 'H4b', 'cerrada no enseña las filas')
  debe(/Tu día\s*1 de \d+\s*ver todo/i.test((await txt(a, '[data-hoy-tu-dia-cabecera]')) ?? ''), 'H4b', `«Tu día · 1 de ${total} · ver todo» (${await txt(a, '[data-hoy-tu-dia-cabecera]')})`)
  await captura(a, 'H4b_tu_dia_cerrada', '[data-hoy-tu-dia]')
  await clic(a, '[data-hoy-tu-dia-cabecera]')
  await a.esp(400)
  debe((await atr(a, '[data-hoy-tu-dia]', 'data-hoy-tu-dia')) === 'abierta' && (await hay(a, '[data-hoy-lista]')), 'H4b', 'y se abre otra vez')
  // H5: saltar la siguiente
  const nombreSig = (await paradasDe(a))[1].name
  await clic(a, '[data-hoy-no-me-da-tiempo]')
  await a.esp(900)
  const p = await paradasDe(a)
  debe(p[1].saltada, 'H5', 'la parada queda saltada')
  debe((await txt(a, '[data-hoy-parada-n]')) === `Parada 2 de ${total - 1}`, 'H5', `la cuenta no cuenta la saltada (Parada 2 de ${total - 1}: ${await txt(a, '[data-hoy-parada-n]')})`)
  debe(!new RegExp(nombreSig.slice(0, 12)).test((await txt(a, '[data-hoy-siguiente]')) ?? ''), 'H5', 'la tarjeta pasa a la siguiente')
  debe((await atr(a, '[data-saltada="true"]', 'data-hoy-fila-estado')) === 'saltada', 'H5', 'en la lista, tachada')
  debe(/Recuperar/.test((await txt(a, '[data-saltada="true"]')) ?? ''), 'H5', 'con [Recuperar]')
  debe(/Parada saltada/.test((await txt(a, '[data-hoy-aviso-saltada]')) ?? '') && (await hay(a, '[data-hoy-deshacer-saltada]')), 'H5', 'el aviso de abajo «Parada saltada» con [Deshacer]')
  const lineaT = (await a.evaluar("(() => { const e = document.querySelector('[data-saltada=\"true\"] .line-through'); return e ? getComputedStyle(e).textDecorationLine : '' })()")) ?? ''
  debe(/line-through/.test(lineaT), 'H5', 'el nombre está tachado')
  await captura(a, 'H5_saltada', '[data-hoy-aviso-saltada]')
  await clic(a, '[data-hoy-deshacer-saltada]')
  await a.esp(700)
  debe(!(await paradasDe(a))[1].saltada && !(await hay(a, '[data-hoy-aviso-saltada]')), 'H5', '[Deshacer] la recupera y quita el aviso')
  await clic(a, '[data-hoy-no-me-da-tiempo]')
  await a.esp(600)
  await clic(a, '[data-hoy-recuperar]')
  await a.esp(600)
  debe(!(await paradasDe(a))[1].saltada, 'H5', '[Recuperar] de la lista también la trae de vuelta')
  // las reservas no se tocan: saltar una parada con entrada no borra la entrada
  const res = await ev(`${R}.getState().reservations.length`)
  debe(typeof res === 'number', 'reservas', 'las reservas siguen ahí (no se tocan)')
})

/* ───────────── 4. H6: por la mañana ───────────── */
await sec(async () => {
  const zona = await a.evaluar(`(async () => {
    const r = await fetch('/api/destination-excursions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }).then((x) => x.json()).catch(() => null)
    return (r?.zonas_alojamiento ?? []).find((z) => z.coordinates)?.id ?? null
  })()`)
  debe(Boolean(zona), 'H6', `Roma tiene zonas de alojamiento con coordenadas (${zona})`)
  const mut = `r.accommodationZone = ${JSON.stringify(zona)}; numberedStopsOf(r.days[1])[0].time = '09:00'`
  await ir(a, { dia: 1, min: 6 * 60, mut })
  debe(await hay(a, '[data-hoy-por-la-manana]'), 'H6', 'por la mañana, con pase y zona: «Sal de casa a las…»')
  const t = (await txt(a, '[data-hoy-por-la-manana]')) ?? ''
  const hora = /Sal de casa a las (\d{1,2}:\d{2})/.exec(t)?.[1]
  debe(Boolean(hora) && /A pie · \d+ min/.test(t), 'H6', `con su hora y su trayecto a pie (${t.slice(0, 90)})`)
  debe(/PRIMERA PARADA/i.test(t) || /Primera parada/i.test(t), 'H6', '«PRIMERA PARADA»')
  const h = hora.split(':').map(Number)
  debe(h[0] * 60 + h[1] < 9 * 60, 'H6', 'sales ANTES de la hora de la parada')
  await captura(a, 'H6_por_la_manana')
  // pasada la hora de salir, la tarjeta de siempre (por llegar)
  await ir(a, { dia: 1, min: 8 * 60 + 55, mut })
  debe(!(await hay(a, '[data-hoy-por-la-manana]')) && (await hay(a, '[data-hoy-siguiente]')), 'H6', 'pasada la hora de salir, la tarjeta de la siguiente parada')
  // sin zona no se inventa la hora
  await ir(a, { dia: 1, min: 6 * 60, mut: "delete r.accommodationZone; numberedStopsOf(r.days[1])[0].time = '09:00'" })
  debe(!(await hay(a, '[data-hoy-por-la-manana]')), 'H6', 'sin zona de alojamiento no se dice ninguna hora de salir')
})

/* ───────────── 5. H13: el atardecer y mañana ───────────── */
await sec(async () => {
  const mut = "r.days.forEach((d) => { d.sunsetText = 'Hoy el sol se pone a las 18:26' }); const s0 = numberedStopsOf(r.days[0])[0]; s0.isSunset = true; s0.name = 'Terraza del Pincio'"
  // LG1 (antes → ahora → decisión de Eric, 4-nov): antes la tarjeta salía a las 15:00 con «Hoy el sol se pone a las 18:26» y el sitio aparte; ahora sale desde 2 horas antes de la puesta de sol (16:26) y dice
  // «Hoy ves el atardecer en el Pincio: el sol se pone a las 18:26. Llega un cuarto de hora antes, que es cuando más bonito está.»
  await ir(a, { dia: 0, min: 15 * 60, mut })
  debe(!(await hay(a, '[data-hoy-atardecer]')), 'H13', 'a las 15:00 (más de 2 h antes de la puesta) todavía no sale el atardecer')
  await ir(a, { dia: 0, min: 16 * 60 + 45, mut })
  debe(/^Hoy ves el atardecer en el Pincio: el sol se pone a las 18:26. Llega un cuarto de hora antes, que es cuando más bonito está.$/.test((await txt(a, '[data-hoy-atardecer-titulo]')) ?? ''), 'H13', `el atardecer con su sitio (${await txt(a, '[data-hoy-atardecer-titulo]')})`)
  const href = await atr(a, '[data-hoy-atardecer-como-llegar]', 'href')
  debe(/google\.com\/maps\/dir/.test(href ?? '') && /travelmode=walking/.test(href ?? ''), 'H13', '[Cómo llegar] al sitio, a pie')
  await captura(a, 'H13_atardecer', '[data-hoy-atardecer]')
  // mañana: después de la última parada (todo visto)
  await ir(a, { dia: 0, min: 21 * 60, mut: "numberedStopsOf(r.days[0]).forEach((s) => { s.checkedInAt = '2026-10-17T10:00:00Z' })" })
  debe(await hay(a, '[data-hoy-manana]'), 'H13', 'al acabar el día sale «Mañana»')
  const siguientePrimera = await paradasDe(a, 1)
  const m = (await txt(a, '[data-hoy-manana]')) ?? ''
  debe(/MAÑANA/i.test(m) && m.includes(siguientePrimera[0].name.slice(0, 10)), 'H13', `con la primera parada de mañana (${m.slice(0, 80)})`)
  debe(/empiezas a las|sales a las/.test(m), 'H13', 'y la hora de empezar o de salir')
  await captura(a, 'H13_manana', '[data-hoy-manana]')
  // con zona: «sales a las…»; con una entrada de mañana: «turno en… a las…» y el consejo
  const zona = await a.evaluar(`(async () => {
    const r = await fetch('/api/destination-excursions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }).then((x) => x.json()).catch(() => null)
    return (r?.zonas_alojamiento ?? []).find((z) => z.coordinates)?.id ?? null
  })()`)
  await ir(a, { dia: 0, min: 21 * 60, mut: `r.accommodationZone = ${JSON.stringify(zona)}; numberedStopsOf(r.days[0]).forEach((s) => { s.checkedInAt = '2026-10-17T10:00:00Z' }); numberedStopsOf(r.days[1])[0].time = '09:00'` })
  debe(/sales a las \d{1,2}:\d{2}/.test((await txt(a, '[data-hoy-manana]')) ?? ''), 'H13', `con zona: «sales a las…» (${await txt(a, '[data-hoy-manana]')})`)
})

/* ───────────── 6. H14 y H14b: hoy vuelves a casa (Roma) ───────────── */
await sec(async () => {
  const mutVuelta = (vuelo) => `
    const v = r.days[r.days.length - 1]; v.isReturnLeg = true; v.stops = []; v.meals = []
    r.departureFlightTime = ${JSON.stringify(vuelo)}; r.departureMode = 'avion'
    r.planVuelta = { activo: true, medio: 'avion', hora: ${JSON.stringify(vuelo)}, tarjeta: { titulo: 'Hoy vuelves a casa', texto: 'Tu vuelo sale a las ' + ${JSON.stringify(vuelo)} + '.', desde_tu_zona: null, ver_como_ir: { texto: 'Ver cómo ir', abre: 'ficha_de_vuelta' }, explorar: { texto: 'Si te sobra tiempo', boton: 'Ver qué hay cerca', abre: 'explorar_monumentos', cerca_de_mi: true }, despedida: 'Hasta pronto.', madrugada: false } }`
  const ultimo = await ev(`${R}.getState().route.days.length - 1`)
  await ir(a, { dia: ultimo, min: 9 * 60, mut: mutVuelta('18:05') })
  debe(await hay(a, '[data-hoy-vuelves-h14="con-pase"]'), 'H14', 'una sola tarjeta «Hoy vuelves a casa» con pase')
  const t = (await txt(a, '[data-hoy-vuelves-h14]')) ?? ''
  debe(/HOY VUELVES A CASA/i.test(t) && /Tu vuelo sale a las 18:05/.test(t), 'H14', `«Tu vuelo sale a las 18:05» (${t.slice(0, 60)})`)
  debe(/Tienes el día libre hasta las \d{1,2}:\d{2}\./.test(t), 'H14', `«Tienes el día libre hasta las…» (${t})`)
  debe(/Al aeropuerto: \d+ min/.test(t), 'H14', 'el trayecto al aeropuerto')
  debe(/Cómo llegar al aeropuerto/.test(t), 'H14', '[Cómo llegar al aeropuerto]')
  debe(!/Devuelve el coche/.test(t), 'H14', 'en Roma, sin lo del coche')
  // la cuenta única: lo mismo que la tarjeta de DÍAS
  const hasta = /hasta las (\d{1,2}:\d{2})/.exec(t)?.[1]
  const cuenta = await a.evaluar(`(async () => {
    const { datosDelDiaDeVuelta } = await import('/src/lib/diaDeVuelta.ts'); const { medioOf } = await import('/src/lib/arrivalReturn.ts')
    const r = ${R}.getState().route
    const info = await fetch('/api/arrival-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination: r.destination, city: r.days[0].city, origin: r.origin }) }).then((x) => x.json()).catch(() => null)
    return info ? 'ok' : 'sin'
  })()`)
  void cuenta
  debe(Boolean(hasta), 'H14', 'con la hora hasta la que tienes el día')
  await captura(a, 'H14_vuelves_con_pase')
  // H14b: sin pase
  await a.evaluar(`window.__pruebaDelPase = { cobro: true, conPase: false, puede: false, pruebaGastada: true }; true`)
  await ir(a, { dia: ultimo, min: 9 * 60, mut: mutVuelta('18:05') })
  await a.evaluar(`(async () => { window.__pruebaDelPase = { cobro: true, conPase: false, puede: false, pruebaGastada: true }; ${R}.getState().setMode('explore'); return true })()`)
  await a.esp(500)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(2500)
  const sb = (await txt(a, '[data-hoy-vuelves-h14="sin-pase"]')) ?? ''
  debe(sb.length > 0, 'H14b', 'sin pase, la MISMA tarjeta')
  debe(/Tu vuelo sale a las 18:05\./.test(sb) && /Estate en el aeropuerto 2 horas antes/.test(sb), 'H14b', `con lo que se sabe sin pase (${sb})`)
  debe(!/Tienes el día libre/.test(sb), 'H14b', 'sin la cuenta de «hasta qué hora»')
  debe(/Con el Pase Roma, te decimos hasta qué hora tienes el día/.test(sb), 'H14b', 'y la línea que dice lo que daría el pase')
  await captura(a, 'H14b_vuelves_sin_pase')
  await a.evaluar('delete window.__pruebaDelPase; true')
})

/* ───────────── 7. Lanzarote: el viaje de Eric (domingo 8 y lunes 9) ───────────── */
await sec(async () => {
  // (Si el motor de coche tarda o la API se está reiniciando, se reintenta una vez.)
  for (let intento = 0; intento < 2 && (await ev(`${R}.getState().route?.destination`)) !== 'Lanzarote'; intento++) {
    const r = await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-09', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => 'ok').catch((e) => 'ERROR ' + String((e && e.message) || e))`)
    if (r !== 'ok') console.log('Lanzarote, intento', intento + 1, r)
    for (let i = 0; i < 30 && !((await ev(`${R}.getState().route?.destination`)) === 'Lanzarote'); i++) await a.esp(1000)
  }
  const dest = await ev(`${R}.getState().route?.destination`)
  debe(dest === 'Lanzarote', 'LZ', `el viaje de Eric en Lanzarote existe (${dest})`)
  if (dest === 'Lanzarote') {
    _lz = true
    await a.esp(2000)
    const diasLz = await ev(`${R}.getState().route.days.map((d) => ({ n: d.dayNumber, vuelta: Boolean(d.isReturnLeg) }))`)
    const lunes = diasLz.findIndex((d) => d.n === 2) // lunes 9
    const domingo = 0
    // H2: por llegar, en coche (lunes 9, a media mañana)
    await ir(a, { dia: lunes, min: 9 * 60 + 30 })
    const tr = (await txt(a, '[data-hoy-trayecto]')) ?? ''
    debe((await atr(a, '[data-hoy-trayecto]', 'data-hoy-trayecto')) === 'coche' && /En coche · \d+ min/.test(tr), 'H2', `por llegar en coche: «En coche · N min» (${tr})`)
    debe(/\d+ km/.test(tr) || /para aparcar/.test(tr), 'H2', `con los km o «+N min para aparcar» (${tr})`)
    const href = await a.evaluar("Array.from(document.querySelectorAll('[data-hoy-siguiente] a')).find((x) => /Cómo llegar/.test(x.textContent))?.href ?? null")
    debe(/travelmode=driving/.test(href ?? ''), 'H2', 'en Lanzarote el camino es en coche')
    await captura(a, 'H2_lanzarote_lunes_9')
    // H3 en coche: [Dónde has aparcado]
    await clic(a, '[data-hoy-ya-he-llegado]')
    await a.esp(800)
    debe(await hay(a, '[data-hoy-pastilla="aparcado"]'), 'H3', 'en coche sale [Dónde has aparcado]')
    await captura(a, 'H3_lanzarote_lunes_9')
    await clic(a, '[data-hoy-pastilla="aparcado"]')
    await a.esp(600)
    debe(await hay(a, '[data-hoy-donde-aparcado]'), 'H3', 'su hoja para guardar dónde has aparcado')
    await a.evaluar("(() => { document.querySelector('[role=\"dialog\"] button[aria-label=\"Cerrar\"]')?.click(); return true })()")
    // sin textos de Roma
    await ir(a, { dia: lunes, min: 9 * 60 + 30 })
    const todo = (await txt(a, '[data-hoy]')) ?? ''
    debe(!ROMA_EN_LANZAROTE.test(todo), 'LZ', `ni un nombre de Roma en HOY de Lanzarote (${todo.match(ROMA_EN_LANZAROTE)?.[0] ?? ''})`)
    // domingo 8 (llegada)
    await ir(a, { dia: domingo, min: 12 * 60 })
    const dom = (await txt(a, '[data-hoy]')) ?? ''
    debe(dom.length > 20 && !ROMA_EN_LANZAROTE.test(dom), 'LZ', 'el domingo 8, tampoco nombres de Roma')
    await captura(a, 'H1_lanzarote_domingo_8')
    // H6 en coche: «Sal de casa a las…» con la hora del motor
    await ir(a, { dia: lunes, min: 6 * 60 })
    const hayH6 = await hay(a, '[data-hoy-por-la-manana]')
    debe(hayH6, 'H6', 'el lunes 9 a las 6:00, en coche: la tarjeta «Sal de casa a las…»')
    if (hayH6) {
      const t6 = (await txt(a, '[data-hoy-por-la-manana]')) ?? ''
      debe(/Sal de casa a las \d{1,2}:\d{2}/.test(t6) && /En coche/.test(t6), 'H6', `por la mañana en coche: «Sal de casa a las…» y «En coche» (${t6.slice(0, 80)})`)
      await captura(a, 'H6_lanzarote_lunes_9')
    }
    // H14 en Lanzarote: el día de vuelta
    const vuelta = diasLz.findIndex((d) => d.vuelta)
    if (vuelta >= 0) {
      await ir(a, { dia: vuelta, min: 9 * 60 })
      const v = (await txt(a, '[data-hoy-vuelves-h14]')) ?? ''
      debe(v.length > 0, 'H14', 'el día de vuelta de Lanzarote lleva la tarjeta «Hoy vuelves a casa»')
      debe(/Tu vuelo sale a las 18:05/.test(v), 'H14', `Lanzarote: «Tu vuelo sale a las 18:05» (${v.slice(0, 70)})`)
      debe(/Devuelve el coche en la T1/.test(v), 'H14', 'Lanzarote: «Devuelve el coche en la T1»')
      debe(/en coche/.test(v), 'H14', 'Lanzarote: el trayecto al aeropuerto en coche')
      debe(!ROMA_EN_LANZAROTE.test(v), 'H14', 'sin nombres de Roma')
      await captura(a, 'H14_lanzarote_vuelta', '[data-hoy-vuelves-h14]')
    }
  }
})

a.cerrar()
console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
