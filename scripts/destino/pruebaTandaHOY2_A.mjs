// La prueba de la tanda HOY2, agente A (5-nov-2026): HOY completa (Completa 1 a 10) y lo de después de cambiar (la ficha completa y «Si te sobra tiempo»).
// Orden de los bloques · avisos por urgencia con su X · «Tu día» sin horas y por franjas · «Por llegar» con foto (sin mapa) · el día acabado · el de llegada · el último día · sin pase (HoySinPase con la lista nueva)
// · el día de prueba sin candados · la ficha completa al tocar la tarjeta · «Si te sobra tiempo» abajo del todo.
// Hace falta el servidor de la app (5173) y la API (8787, con DESTINOS_OCULTOS='-') YA encendidos; NO arranca ninguno.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY2_A.mjs
// Un solo Chrome, que se cierra al acabar. Salida: «N comprobaciones · M fallos». Capturas 390 de ancho, de TODO el scroll, en docs/dias/capturas_jutrip/hoy2_completa_*.jpg.
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
const png = (n) => path.join(SALIDA, `hoy2_completa_${n}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const leer = (f) => fs.readFileSync(path.resolve(f), 'utf8')

// El reloj del móvil a mano (`window.__horaFalsa`, minutos del día) y una ubicación falsa (`window.__pos`, `window.__perm`).
const ANTES = `(function(){const RD=Date;const base=RD.now();function fijo(){if(window.__horaFalsa==null)return null;const d=new RD();d.setHours(Math.floor(window.__horaFalsa/60),window.__horaFalsa%60,0,0);return d.getTime()+(RD.now()-base)%60000}class FD extends RD{constructor(...a){if(a.length===0){const f=fijo();super(f==null?RD.now():f)}else super(...a)}static now(){const f=fijo();return f==null?RD.now():f}}window.Date=FD;
Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok,no){const p=window.__pos;if(!p){no&&no({code:1});return}ok({coords:{latitude:p.lat,longitude:p.lng,accuracy:10}})},watchPosition(){return 1},clearWatch(){}},configurable:true});
try{navigator.permissions.query=async()=>({state:window.__perm||'denied',addEventListener(){},removeEventListener(){}})}catch(e){}})();`
const ROMA_EN_LANZAROTE = /Roma|Fiumicino|Ciampino|Termini|Pante[óo]n|Trastevere|Vaticano|Coliseo|Trevi|Pincio|Jan[ií]culo|Cap[ií]tolio/i
const HORA_EN_TEXTO = /\b\d{1,2}:\d{2}\b/g

let _a = null
let _dest = 'roma'
const ev = (expr) => _a.evaluar('(async () => (' + expr + '))()')
const LZ = `window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => true).catch(() => false)`
async function abrir(version = 'completa') {
  for (let intento = 0; intento < 3; intento++) {
    const a = (_a = await abrirApp('http://localhost:5173', { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=${version}`, antes: ANTES }))
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
async function ponerLanzarote(a) {
  for (let intento = 0; intento < 2 && (await ev(`${R}.getState().route?.destination`).catch(() => null)) !== 'Lanzarote'; intento++) {
    const r = await a.evaluar(`${LZ}.then((x) => x ? 'ok' : 'ERROR')`)
    if (r !== 'ok') console.log('Lanzarote, intento', intento + 1, r)
    for (let i = 0; i < 30 && !((await ev(`${R}.getState().route?.destination`).catch(() => null)) === 'Lanzarote'); i++) await a.esp(1000)
  }
  _dest = (await ev(`${R}.getState().route?.destination`)) === 'Lanzarote' ? 'lanzarote' : 'roma'
  await a.esp(2000)
}

/** Prepara el día `dia` (0 = el primero) con la hora `min` y la ubicación `pos` y vuelve a montar HOY. `mut` cambia la ruta `r` antes. `limpiar:false` no borra lo cerrado de «trazo:hoy».  */
async function ir(a, { dia = 0, min = 570, pos = null, perm = 'denied', mut = '', limpiar = true, tiempo = null, horaLocal = 12 } = {}) {
  if (!(await ev(`${R}.getState().route ? true : false`).catch(() => false))) {
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    if (_dest === 'lanzarote') await a.evaluar(LZ)
    else await a.evaluar('window.__rutaPrueba().then(() => true)')
    await a.esp(2500)
  }
  await a.evaluar(`(async () => {
    const st = ${R}; const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
    const r = structuredClone(st.getState().route)
    r.days.forEach((d) => { delete d.sunsetText; d.spareStops = []; numberedStopsOf(d).forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset; delete s.reservationTime }); d.stops.forEach((s) => { delete s.saltada }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { ${limpiar ? "Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy')).forEach((k) => localStorage.removeItem(k));" : ''} localStorage.setItem('trazo:logros:permisos-vistos', '1'); sessionStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/components/logros/visto/vistoStore.ts')).useVistoStore.getState().poner({ permisos: false }) } catch {}
    window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${JSON.stringify(perm)}
    window.__hoy1HoraLocal = ${horaLocal}; window.__hoy1Tiempo = ${JSON.stringify(tiempo ?? { probability: Array(24).fill(0), precipitation: Array(24).fill(0), cloud: Array(24).fill(10), gust: Array(24).fill(15) })}
    const ini = r.answers.dateRange.start; const d = new Date(ini + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + ${dia}); const iso = d.toISOString().slice(0, 10)
    st.getState().setDevSimulatedTodayIso('2000-01-01'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    await new Promise((x) => setTimeout(x, 300))
    st.getState().setDevSimulatedTodayIso(iso)
    return iso })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(2800)
}
const txt = (a, sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
const hay = (a, sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
const cuantos = (a, sel) => a.evaluar(`document.querySelectorAll(${JSON.stringify(sel)}).length`)
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button,a')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const paradasDe = (a, dia = 0) => a.evaluar(`(async () => { const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const r = ${R}.getState().route; return numberedStopsOf(r.days[${dia}]).map((s) => ({ id: s.id, name: s.name, time: s.time, saltada: Boolean(s.saltada), visto: Boolean(s.checkedInAt) })) })()`)
const diasDe = (a) => a.evaluar(`(async () => ${R}.getState().route.days.map((d) => ({ n: d.dayNumber, vuelta: Boolean(d.isReturnLeg), ll: Boolean(d.arrivalDay?.es_dia_1) })))()`)
/** Los bloques de HOY en el orden en que salen en pantalla (por la posición en el DOM). */
const ordenDeBloques = (a) =>
  a.evaluar(`(() => {
    const sels = { cabecera: '[data-hoy-parada-cabecera],[data-hoy-cabecera]', avisos: '[data-hoy-avisos]', principal: '[data-hoy-siguiente],[data-hoy-por-la-manana],[data-hoy-bienvenida],[data-hoy-vuelves-h14],[data-hoy-todo-visto]', hueco: '[data-hoy-hueco-que-hago-ahora]', cerca: '[data-cerca-de-ti]', tuDia: '[data-hoy-tu-dia]', sobra: '[data-hoy-sobra-tiempo]' }
    const raiz = document.querySelector('[data-hoy-v2]')
    const todos = Array.from(raiz.querySelectorAll('*'))
    const out = []
    for (const [k, s] of Object.entries(sels)) { const e = raiz.querySelector(s); if (e) out.push([k, todos.indexOf(e)]) }
    return out.sort((x, y) => x[1] - y[1]).map((x) => x[0])
  })()`)
/** La captura de TODO el scroll de HOY (390 de ancho): se estira la ventana a lo que mide el contenido y se vuelve a 844. */
const capturaEntera = async (a, nombre) => {
  // (las hojas de «Guarda un recuerdo» y los avisos de abajo salen al marcar paradas a mano en la prueba: se quitan para la captura)
  await a.evaluar("(() => { document.querySelectorAll('[role=dialog] button[aria-label=Cerrar], button[aria-label=Cerrar]').forEach((b) => { if (!b.closest('[data-hoy-v2]')) b.click() }); return true })()")
  await a.esp(5600)
  await a.evaluar("(() => { const c = document.querySelector('[data-hoy-v2]'); if (c) c.scrollTop = 0; return true })()")
  const alto = await a.evaluar("(() => { const c = document.querySelector('[data-hoy-v2]'); if (!c) return 844; const r = c.getBoundingClientRect(); return Math.ceil(c.scrollHeight + r.top + (window.innerHeight - r.bottom)) })()")
  await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: Math.max(844, Math.min(alto, 7000)), deviceScaleFactor: 1, mobile: true })
  await a.esp(900)
  await a.captura(png(nombre))
  await a.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await a.esp(400)
}
const sec = async (fn) => {
  try {
    await fn()
  } catch (e) {
    debe(false, 'error', `la prueba se ha parado: ${String(e?.message ?? e).slice(0, 220)}`)
  }
}

/* ───────────── 0. El código (sin pantalla) ───────────── */
await sec(async () => {
  const hoy = leer('src/components/route/hoy/v2/HoyDuranteV2.tsx')
  const parada = leer('src/components/route/hoy/v2/ParadaHoy.tsx')
  debe(/conPase=\{pagoActivo\(\)\}/.test(hoy), 'prueba', 'HoyDuranteV2: «Cerca de ti» con `conPase={pagoActivo()}` (el día de prueba, sin candados)')
  debe(!/MapaDeLlegada|data-hoy-mapa-llegada/.test(parada) && /FotoDeLaParada/.test(parada), 'por_llegar', 'ParadaHoy: fuera `MapaDeLlegada`; la foto del lugar `FotoDeLaParada`')
  debe(!/HojaSobreEsteLugar/.test(hoy) && /FichaCompletaDeHoy/.test(hoy), 'ficha', 'HoyDuranteV2: tocar la tarjeta abre `FichaCompletaDeHoy`, no «Sobre este lugar»')
  const nuevoOrden = ['{cabeceraDeHoy}', '{zonaDeAvisos}', '{principal}', 'data-hoy-hueco-que-hago-ahora', '<CercaDeTiFila', '<TuDia', '<SiTeSobraTiempoHoy']
  const pos = nuevoOrden.map((t) => hoy.lastIndexOf(t))
  debe(pos.every((p, i) => p > 0 && (i === 0 || p > pos[i - 1])), 'orden', `HoyDuranteV2: el orden de los bloques en el código (${pos.join(' < ')})`)
  const sin = leer('src/components/route/hoy/HoySinPase.tsx')
  debe(/tarjetasDeHoy2\(destino\)/.test(sin) && !/TARJETAS_DE_HOY/.test(sin), 'sin_pase', 'HoySinPase: la lista nueva (`tarjetasDeHoy2`)')
  const avisos = leer('src/components/route/hoy/AvisosDelTiempo.tsx') + leer('src/components/route/today/RainAlert.tsx') + leer('src/components/route/hoy/JuegoCerca.tsx') + leer('src/components/route/hoy/FueraDeRuta.tsx') + leer('src/components/route/hoy/TarjetaDeLaPrueba.tsx')
  debe((avisos.match(/CruzDeAviso|data-hoy-aviso-x/g) ?? []).length >= 6, 'x', 'la X (`CruzDeAviso`) en los avisos del tiempo, la lluvia de Roma, el reto, fuera de ruta y el día de prueba')
})

/* ───────────── 1. Roma, antes de nada: la lista nueva sin pase (se hace con otro Chrome luego) ───────────── */

const a = await abrir('completa')

/* ───────────── 2. Lanzarote, el viaje de Eric ───────────── */
await sec(async () => {
  await ponerLanzarote(a)
  debe(_dest === 'lanzarote', 'LZ', 'el viaje de Eric en Lanzarote existe')
  if (_dest !== 'lanzarote') return
  const dias = await diasDe(a)
  const idxMartes = dias.findIndex((d) => d.n === 3)
  const idxDomingo = 0
  const idxVuelta = dias.findIndex((d) => d.vuelta)

  // ── Completa 2: martes 10, por llegar, en coche, a media mañana ──
  await ir(a, { dia: idxMartes, min: 10 * 60 })
  const orden = await ordenDeBloques(a)
  debe(orden.join(' ') === 'cabecera avisos principal hueco cerca tuDia' || orden.join(' ') === 'cabecera principal hueco cerca tuDia', 'orden', `Completa 2: cabecera · avisos · tarjeta · ¿Qué hago ahora? · Cerca de ti · Tu día (sale: ${orden.join(' · ')})`)
  debe(await hay(a, '[data-hoy-siguiente] [data-hoy-foto-parada]'), 'por_llegar', 'Por llegar: arriba de la tarjeta, la foto del lugar')
  debe(!(await hay(a, '[data-hoy-mapa-llegada]')) && (await cuantos(a, '[data-hoy-siguiente] img[alt*="Mapa"]')) === 0, 'por_llegar', 'Por llegar: sin mapa')
  debe(/POR LLEGAR/.test((await txt(a, '[data-hoy-siguiente]')) ?? ''), 'por_llegar', 'Por llegar: la etiqueta «POR LLEGAR» sobre la foto')
  const t = (await txt(a, '[data-hoy-siguiente]')) ?? ''
  debe(/Cómo llegar/.test(t) && /ya he llegado/i.test(t), 'por_llegar', 'Por llegar lleva [Cómo llegar] y la línea [Ya he llegado] (LG1)')
  debe(!ROMA_EN_LANZAROTE.test((await txt(a, '[data-hoy-v2]')) ?? ''), 'LZ', 'Lanzarote, martes 10: ni un nombre de Roma')
  // Tu día: franjas, sin horas
  const franjas = await a.evaluar("Array.from(document.querySelectorAll('[data-hoy-franja]')).map((e) => e.getAttribute('data-hoy-franja'))")
  debe(franjas[0] === 'manana' && franjas.includes('tarde') && franjas.every((f, i) => i === 0 || ['manana', 'tarde', 'noche'].indexOf(f) > ['manana', 'tarde', 'noche'].indexOf(franjas[i - 1])), 'tu_dia', `«Tu día» por franjas, en orden (${franjas.join(', ')})`)
  const lista = (await txt(a, '[data-hoy-lista]')) ?? ''
  const horas = lista.match(HORA_EN_TEXTO) ?? []
  const hechoRes = await a.evaluar("Array.from(document.querySelectorAll('[data-hoy-lista] [data-hoy-fila-hora]')).map((e) => e.getAttribute('data-hoy-fila-hora'))")
  debe(horas.length === hechoRes.length, 'tu_dia', `«Tu día» sin horas, salvo lo fijo (reservas y atardecer): ${horas.join(' ') || 'ninguna'} (fijas: ${hechoRes.length})`)
  debe(!/Comida\s*\d|Cena\s*\d/.test(lista) && (await cuantos(a, '[data-hoy-fila="comida"]')) >= 1, 'tu_dia', 'la comida y la cena en «Tu día», sin hora')
  const cabeceraTxt = (await txt(a, '[data-hoy-parada-cabecera]')) ?? ''
  debe(/Parada \d+ de \d+/.test(cabeceraTxt), 'cabecera', `la cabecera: «Parada X de Y» (${cabeceraTxt})`)
  debe((await a.evaluar("getComputedStyle(document.querySelector('[data-hoy-v2]')).rowGap")) === '18px', 'aire', 'aire entre bloques: 18 px, como en Design')
  await capturaEntera(a, '02_lz_martes10_por_llegar')

  // ── Completa 1: por la mañana, «Sal de casa a las…» ──
  await ir(a, { dia: idxMartes, min: 6 * 60 })
  debe(await hay(a, '[data-hoy-por-la-manana]'), 'por_la_manana', 'Completa 1: por la mañana, la tarjeta «Sal de casa a las…»')
  const ord1 = await ordenDeBloques(a)
  debe(ord1[0] === 'cabecera' && ord1.indexOf('principal') < ord1.indexOf('cerca') && ord1.indexOf('cerca') < ord1.indexOf('tuDia'), 'orden', `Completa 1: el mismo orden (${ord1.join(' · ')})`)
  debe(/Sal de casa a las \d{1,2}:\d{2}/.test((await txt(a, '[data-hoy-por-la-manana]')) ?? ''), 'por_la_manana', '«Sal de casa a las…» con su hora')
  await capturaEntera(a, '01_lz_martes10_por_la_manana')
  await ir(a, { dia: idxMartes, min: 10 * 60 })

  // ── Completa 3: ya estás aquí ──
  await clic(a, '[data-hoy-ya-he-llegado]')
  await a.esp(900)
  debe((await atrEstado(a)) === 'aqui' && (await hay(a, '[data-hoy-siguiente] [data-hoy-foto-parada]')), 'ya_aqui', 'Ya estás aquí: con la foto arriba, sin mapa')
  debe((await cuantos(a, '[data-hoy-pastilla]')) >= 2 && (await hay(a, '[data-hoy-he-terminado]')) && (await hay(a, '[data-hoy-haz-tu-foto],[data-hoy-siguiente] button')), 'ya_aqui', 'Ya estás aquí: las pastillas de la H3 y [He terminado]')
  await capturaEntera(a, '03_lz_martes10_ya_estas_aqui')

  // ── La ficha completa (tocar la tarjeta) ──
  await ir(a, { dia: idxMartes, min: 10 * 60 })
  await clic(a, '[data-hoy-titulo]')
  await a.esp(2500)
  const ficha = await a.evaluar("({ sobre: Boolean(document.querySelector('[role=dialog][aria-label=\"Sobre este lugar\"]')), cuerpo: document.body.innerText.replace(/\\s+/g, ' ') })")
  debe(!ficha.sobre, 'ficha', 'tocar la tarjeta ya no abre «Sobre este lugar»')
  debe(/Resumen/.test(ficha.cuerpo) && /(Qué vas a ver|Cómo llegar|Horario)/.test(ficha.cuerpo), 'ficha', 'tocar la tarjeta abre la ficha completa de DÍAS (pestaña Resumen con Qué vas a ver / Horario / Cómo llegar)')
  await a.captura(png('04_lz_ficha_completa'))
  await a.evaluar("(() => { const b = document.querySelector('button[aria-label=\"Volver\"],button[aria-label=\"Cerrar\"]'); if (b) b.click(); return true })()")
  await a.esp(800)
  await clic(a, '[data-hoy-fila="parada"]')
  await a.esp(1800)
  debe(/Resumen/.test(await a.evaluar("document.body.innerText")), 'ficha', 'tocar una fila de «Tu día» también abre la ficha completa')
  await a.evaluar("(() => { const b = document.querySelector('button[aria-label=\"Volver\"],button[aria-label=\"Cerrar\"]'); if (b) b.click(); return true })()")

  // ── Avisos: la X, como mucho 2 a la vista, «1 aviso más» ──
  const por = (fn) => Array.from({ length: 24 }, (_, h) => fn(h))
  const LLUVIA = { probability: por((h) => (h >= 8 && h <= 22 ? 90 : 0)), precipitation: por((h) => (h >= 8 && h <= 22 ? 1.2 : 0)), cloud: por(() => 95), gust: por(() => 70) }
  await ir(a, { dia: idxMartes, min: 10 * 60, tiempo: LLUVIA })
  await a.esp(1500)
  const av = await a.evaluar("Array.from(document.querySelectorAll('[data-aviso-tiempo]')).map((e) => e.getAttribute('data-aviso-tiempo'))")
  const nAvisos = await cuantos(a, '[data-hoy-avisos] [data-hoy-aviso-x]')
  if (av.length < 1) console.log('DEBUG avisos', JSON.stringify(await a.evaluar(`(async () => { const A = await import('/src/lib/avisosDelTiempo.ts'); const d = ${R}.getState().route.days[${idxMartes}]; return { stops: d.stops.map((s) => [s.name, s.time, s.durationMinutes, Boolean(s.reservedId), Boolean(s.checkedInAt)]), avisos: A.calcularAvisos(d, window.__hoy1Tiempo, true).map((x) => x.id), meteo: Object.keys(window.__hoy1Tiempo || {}), html: document.querySelector('[data-hoy-v2]').innerHTML.length } })()`)))
  debe(av.length >= 1, 'avisos', `con lluvia, nubes y viento hay avisos del tiempo (${av.join(', ')})`)
  const masTxt = await txt(a, '[data-hoy-aviso-mas]')
  const visibles = av.length
  debe(visibles <= 2, 'avisos', `como mucho 2 avisos a la vista (${visibles})`)
  if (masTxt) {
    debe(/^\d+ avisos? más$/.test(masTxt) || masTxt === '1 aviso más', 'avisos', `el resto, plegado: «${masTxt}»`)
    await clic(a, '[data-hoy-aviso-mas]')
    await a.esp(500)
    debe((await cuantos(a, '[data-aviso-tiempo]')) > visibles, 'avisos', 'al tocar «N avisos más» salen todos')
  }
  const ordenAvisos = await ordenDeBloques(a)
  debe(ordenAvisos.indexOf('avisos') < ordenAvisos.indexOf('principal'), 'orden', 'los avisos van encima de la tarjeta principal')
  debe(nAvisos >= 1, 'x', `cada aviso lleva su X (${nAvisos})`)
  await capturaEntera(a, '05_lz_martes10_avisos_tiempo')
  const antes = await cuantos(a, '[data-aviso-tiempo]')
  await clic(a, '[data-aviso-tiempo] [data-hoy-aviso-x]')
  await a.esp(600)
  const despues = await cuantos(a, '[data-aviso-tiempo]')
  debe(despues < antes || (masTxt && despues <= antes), 'x', `la X cierra el aviso (${antes} → ${despues})`)
  // el que se cierra no vuelve ese día (se vuelve a montar HOY sin borrar lo cerrado)
  const idCerrado = antes
  await ir(a, { dia: idxMartes, min: 10 * 60, tiempo: LLUVIA, limpiar: false })
  await a.esp(1200)
  const trasVolver = await cuantos(a, '[data-aviso-tiempo]') + (await cuantos(a, '[data-tiempo-cambiado]'))
  debe(trasVolver <= despues + 1 && trasVolver <= idCerrado, 'x', `el aviso cerrado no vuelve ese día (${trasVolver})`)
  // Los avisos sin motivo: nada
  await ir(a, { dia: idxMartes, min: 10 * 60 })
  debe((await cuantos(a, '[data-aviso-tiempo]')) === 0, 'avisos', 'con el cielo despejado, ningún aviso del tiempo')
  // «Sin conexión»: una línea fina siempre encima de los avisos
  await a.evaluar("(() => { window.dispatchEvent(new Event('offline')); return true })()")
  await a.esp(500)
  const ordSin = await a.evaluar(`(() => { const raiz = document.querySelector('[data-hoy-v2]'); const todos = Array.from(raiz.querySelectorAll('*')); const s = raiz.querySelector('[data-sin-conexion]'); const av = raiz.querySelector('[data-hoy-avisos]'); const t = raiz.querySelector('[data-hoy-siguiente],[data-hoy-por-la-manana]'); return { sin: Boolean(s), a: s ? todos.indexOf(s) : -1, av: av ? todos.indexOf(av) : 9e9, t: t ? todos.indexOf(t) : -1, alto: s ? s.getBoundingClientRect().height : null } })()`)
  debe(ordSin.sin && ordSin.a < ordSin.t && ordSin.a < ordSin.av && ordSin.alto < 40, 'sin_conexion', `«Sin conexión»: una línea fina (${ordSin.alto}px) encima de todo lo demás`)
  await a.evaluar("(() => { window.dispatchEvent(new Event('online')); return true })()")

  // ── Completa 6: el atardecer ──
  await ir(a, {
    dia: idxMartes,
    min: 16 * 60 + 40,
    mut: `const dd = r.days[${idxMartes}]; const ps = numberedStopsOf(dd); ps.slice(0, -1).forEach((s) => { s.checkedInAt = '2026-11-10T10:00:00Z' }); ps[ps.length - 1].isSunset = true; dd.sunsetText = 'Hoy el sol se pone a las 18:04'`,
  })
  debe(await hay(a, '[data-hoy-atardecer]'), 'atardecer', 'Completa 6: la tarjeta del atardecer')
  const tAt = (await txt(a, '[data-hoy-v2]')) ?? ''
  debe(/18:04/.test(tAt), 'atardecer', 'la hora del atardecer es de las pocas que se enseñan')
  debe((await a.evaluar("Boolean(document.querySelector('[data-hoy-fila-hora=atardecer]'))")) === true, 'tu_dia', '«Tu día»: el atardecer lleva su hora')
  await capturaEntera(a, '06_lz_martes10_atardecer')

  // ── Completa 7: el día acabado ──
  await ir(a, { dia: idxMartes, min: 20 * 60, mut: `numberedStopsOf(r.days[${idxMartes}]).forEach((s, i, l) => { s.checkedInAt = '2026-11-10T10:00:00Z'; if (i === l.length - 1) s.isSunset = true })` })
  debe(await hay(a, '[data-hoy-todo-visto]'), 'dia_acabado', 'Completa 7: «Todo visto por hoy»')
  const cab7 = (await txt(a, '[data-hoy-parada-cabecera]')) ?? ''
  debe(/al acabar el día/i.test(cab7) && /Todo visto por hoy/.test(cab7), 'dia_acabado', `la cabecera: «AL ACABAR EL DÍA · Todo visto por hoy» (${cab7})`)
  debe(/Hoy has visto el atardecer/.test((await txt(a, '[data-hoy-todo-visto]')) ?? ''), 'dia_acabado', 'la tarjeta: «Hoy has visto el atardecer»')
  debe((await a.evaluar("document.querySelector('[data-hoy-tu-dia]')?.getAttribute('data-hoy-tu-dia')")) === 'cerrada', 'dia_acabado', '«Tu día» sale plegado («4 de 4 · ver todo»)')
  debe(await hay(a, '[data-hoy-hasta-aqui]'), 'dia_acabado', '«Hasta aquí, hoy»')
  const man = (await txt(a, '[data-hoy-manana]')) ?? ''
  debe(/^MAÑANA Mañana, [a-záéíóú]+ \d+ · /i.test(man) || /Mañana, [a-záéíóú]+ \d+ · /.test(man), 'dia_acabado', `la tarjeta oscura «Mañana, miércoles 11 · …» (${man.slice(0, 90)})`)
  debe(!(await hay(a, '[data-cerca-de-ti]')), 'dia_acabado', 'el día acabado no lleva «Cerca de ti» (Completa 7)')
  await capturaEntera(a, '07_lz_martes10_dia_acabado')
  // lo de mañana, solo sin paradas pendientes: a la hora de la cena con paradas por hacer, nada
  await ir(a, { dia: idxMartes, min: 21 * 60 })
  debe(!(await hay(a, '[data-hoy-manana]')) && !(await hay(a, '[data-hoy-hasta-aqui]')), 'dia_acabado', 'con paradas por hacer (aunque sea la hora de la cena) no sale lo de mañana')

  // ── Completa 8: el día de llegada (domingo 8) ──
  await ir(a, { dia: idxDomingo, min: 8 * 60 })
  debe(await hay(a, '[data-hoy-bienvenida]'), 'llegada', 'Completa 8: la tarjeta de bienvenida')
  const cab8 = (await txt(a, '[data-hoy-cabecera]')) ?? ''
  debe(/Bienvenido a Lanzarote/.test(cab8) && /llegada a Lanzarote/i.test(cab8), 'llegada', `«Bienvenido a Lanzarote» (${cab8})`)
  const b8 = (await txt(a, '[data-hoy-bienvenida]')) ?? ''
  debe(/Aterrizas a las 9:30/.test(b8), 'llegada', `con el vuelo: «Aterrizas a las 9:30» (${b8.slice(0, 80)})`)
  debe(/Recoge tu coche en el aeropuerto/.test(b8), 'llegada', 'Recoge tu coche en el aeropuerto')
  debe(/Empiezas hacia las \d{1,2}:\d{2}/.test(b8), 'llegada', `la hora útil de la LL: «Empiezas hacia las…» (${b8.match(/Empiezas hacia las \d{1,2}:\d{2}/)?.[0]})`)
  const href8 = await a.evaluar("document.querySelector('[data-hoy-bienvenida-coche]')?.href ?? null")
  debe(/google\.com\/maps/.test(href8 ?? '') && /Alquiler/i.test(decodeURIComponent(href8 ?? '')), 'llegada', '[Cómo llegar al coche de alquiler] abre Maps')
  debe(/Cómo llegar al coche de alquiler/.test(b8), 'llegada', 'el botón dice «Cómo llegar al coche de alquiler»')
  const ord8 = await ordenDeBloques(a)
  debe(ord8[0] === 'cabecera' && ord8.includes('principal') && ord8.indexOf('cerca') > ord8.indexOf('principal') && ord8.indexOf('tuDia') > ord8.indexOf('cerca'), 'orden', `el día de llegada sigue el orden (${ord8.join(' · ')})`)
  debe(!ROMA_EN_LANZAROTE.test((await txt(a, '[data-hoy-v2]')) ?? ''), 'LZ', 'domingo 8: ni un nombre de Roma')
  await capturaEntera(a, '08_lz_domingo8_llegada')
  // en cuanto llega la hora útil, empieza la primera parada
  await ir(a, { dia: idxDomingo, min: 13 * 60 })
  // HOY2 (C, 5-nov): antes → ahora → decisión de Eric: a las 13:00 del domingo salía la tarjeta de la primera parada → a esa hora toca la comida (13:03), y la tarjeta de arriba es «Tu restaurante está a N minutos» (Completa 4); las dos valen.
  debe(!(await hay(a, '[data-hoy-bienvenida]')) && (await hay(a, '[data-hoy-siguiente],[data-hoy-por-la-manana],[data-hoy-comida]')), 'llegada', 'pasada la hora útil, la tarjeta de la primera parada (o la de la comida, si ya toca comer)')

  // ── Completa 9: el último día ──
  if (idxVuelta >= 0) {
    await ir(a, { dia: idxVuelta, min: 9 * 60 })
    const cab9 = (await txt(a, '[data-hoy-cabecera]')) ?? ''
    debe(/Hoy vuelves a casa/.test(cab9) && /último día/i.test(cab9), 'ultimo', `Completa 9: «ÚLTIMO DÍA · Hoy vuelves a casa» (${cab9})`)
    const v9 = (await txt(a, '[data-hoy-vuelves-h14]')) ?? ''
    debe(/Tu vuelo sale a las 18:05/.test(v9) && /Tienes el día libre hasta las/.test(v9) && /Devuelve el coche en la T1/.test(v9), 'ultimo', `con los datos de la LL (${v9.slice(0, 100)})`)
    debe(/Cómo llegar al aeropuerto/.test(v9), 'ultimo', '[Cómo llegar al aeropuerto]')
    const ord9 = await ordenDeBloques(a)
    debe(ord9[0] === 'cabecera' && ord9.indexOf('principal') < ord9.indexOf('tuDia'), 'orden', `el último día: la tarjeta de vuelta va ANTES de «Tu día» (${ord9.join(' · ')})`)
    debe(!ROMA_EN_LANZAROTE.test((await txt(a, '[data-hoy-v2]')) ?? ''), 'LZ', 'último día: ni un nombre de Roma')
    await capturaEntera(a, '09_lz_ultimo_dia')
  }

  // ── «Si te sobra tiempo»: abajo del todo, plegada, solo si hay algo; lo saltado y lo quitado con [Recuperar] y [Pasar a otro día] ──
  await ir(a, { dia: idxMartes, min: 9 * 60 + 30 })
  debe(!(await hay(a, '[data-hoy-sobra-tiempo]')), 'sobra', 'sin nada saltado ni quitado, no sale «Si te sobra tiempo»')
  await ir(a, {
    dia: idxMartes,
    min: 9 * 60 + 30,
    mut: `const dd = r.days[${idxMartes}]; const ps = numberedStopsOf(dd); ps[1].saltada = true; const q = structuredClone(ps[ps.length - 1]); q.id = 'sobra-x'; q.name = 'Mirador de prueba'; q.spareReason = 'No cabía en tu tarde'; dd.spareStops = [q]`,
  })
  debe(await hay(a, '[data-hoy-sobra-tiempo]'), 'sobra', 'con algo saltado o quitado sale «Si te sobra tiempo»')
  const ordS = await ordenDeBloques(a)
  debe(ordS[ordS.length - 1] === 'sobra', 'sobra', `abajo del todo (${ordS.join(' · ')})`)
  const rcSobra = await a.evaluar("(() => { const e = document.querySelector('[data-hoy-sobra-tiempo]'); const r = document.querySelector('[data-hoy-v2]'); const t = document.querySelector('[data-hoy-tu-dia]'); return { plegada: !document.querySelector('[data-hoy-sobra-lista]'), debajoDeTuDia: e.getBoundingClientRect().top > t.getBoundingClientRect().bottom - 1, n: e.getAttribute('data-hoy-sobra-tiempo') } })()")
  debe(rcSobra.plegada && rcSobra.debajoDeTuDia && rcSobra.n === '2', 'sobra', `plegada y debajo de «Tu día» (${JSON.stringify(rcSobra)})`)
  await clic(a, '[data-hoy-sobra-tiempo-cabecera]')
  await a.esp(500)
  debe((await cuantos(a, '[data-hoy-sobra-item]')) === 2 && (await cuantos(a, '[data-hoy-sobra-item] [data-hoy-recuperar]')) === 2 && (await cuantos(a, '[data-hoy-sobra-item] [data-hoy-pasar-otro-dia]')) === 2, 'sobra', 'lo saltado y lo quitado, cada uno con [Recuperar] y [Pasar a otro día]')
  debe(!(await hay(a, '[data-hoy-fila-estado="saltada"]')), 'sobra', 'lo saltado ya no se queda tachado en «Tu día»')
  await capturaEntera(a, '10_lz_sobra_tiempo_abierta')
  await clic(a, '[data-hoy-sobra-item="saltada"] [data-hoy-recuperar]')
  await a.esp(600)
  const trasRec = await paradasDe(a, idxMartes)
  debe(trasRec.every((s) => !s.saltada), 'sobra', '[Recuperar] devuelve lo saltado a su sitio')
  await clic(a, '[data-hoy-sobra-item="sobra"] [data-hoy-recuperar]')
  await a.esp(600)
  const trasRec2 = await paradasDe(a, idxMartes)
  debe(trasRec2.some((s) => s.name === 'Mirador de prueba') && !(await hay(a, '[data-hoy-sobra-tiempo]')), 'sobra', '[Recuperar] de lo quitado lo añade al día y la lista desaparece cuando se queda vacía')
  // [Pasar a otro día] de lo saltado
  await ir(a, { dia: idxMartes, min: 9 * 60 + 30, mut: `numberedStopsOf(r.days[${idxMartes}])[1].saltada = true` })
  await clic(a, '[data-hoy-sobra-tiempo-cabecera]')
  await a.esp(400)
  const antesN = (await paradasDe(a, idxMartes)).length
  await clic(a, '[data-hoy-pasar-otro-dia]')
  await a.esp(800)
  debe(await hay(a, '[data-lista-de-dias]'), 'sobra', '[Pasar a otro día] abre la lista de días de siempre')
  await a.evaluar("(() => { const b = document.querySelector('[data-dia-de-la-lista]:not([disabled])'); if (b) b.click(); return true })()")
  await a.esp(900)
  debe((await paradasDe(a, idxMartes)).length === antesN - 1, 'sobra', 'elegir un día pasa la parada a ese día')
})

a.cerrar()

/* ───────────── 3. Roma: el orden, la llegada sin coche y lo de sin pase ───────────── */
await sec(async () => {
  const r = await abrir('completa')
  _dest = 'roma'
  await ir(r, { dia: 1, min: 10 * 60 })
  const o = await ordenDeBloques(r)
  debe(o[0] === 'cabecera' && o.indexOf('principal') < o.indexOf('cerca') && o.indexOf('cerca') < o.indexOf('tuDia'), 'orden', `Roma: el mismo orden (${o.join(' · ')})`)
  const lista = (await txt(r, '[data-hoy-lista]')) ?? ''
  debe((lista.match(HORA_EN_TEXTO) ?? []).length === (await cuantos(r, '[data-hoy-lista] [data-hoy-fila-hora]')), 'tu_dia', 'Roma: «Tu día» sin horas salvo lo fijo')
  await capturaEntera(r, '11_roma_por_llegar')
  // Roma, día de llegada: sin coche
  await ir(r, { dia: 0, min: 6 * 60, mut: `r.arrivalFlightTime = '09:30'; r.days[0].arrivalDay = { ...(r.days[0].arrivalDay ?? {}), es_dia_1: true }` })
  const bR = (await txt(r, '[data-hoy-bienvenida]')) ?? ''
  debe(/Aterrizas a las 9:30/.test(bR) && !/coche/i.test(bR) && !(await hay(r, '[data-hoy-bienvenida-coche]')), 'llegada', `Roma: «Aterrizas a las…» y sin coche ni [Cómo llegar al coche de alquiler] (${bR.slice(0, 90)})`)
  debe(/Bienvenido a Roma/.test((await txt(r, '[data-hoy-cabecera]')) ?? ''), 'llegada', 'Roma: «Bienvenido a Roma»')
  await capturaEntera(r, '12_roma_llegada')
  r.cerrar()
})

/* ───────────── 4. Sin pase: HoySinPase con la lista nueva (no la Completa 10) ───────────── */
await sec(async () => {
  const g = await abrir('gratis')
  _dest = 'roma'
  await ir(g, { dia: 1, min: 10 * 60 })
  debe(await hay(g, '[data-hoy-sin-pase]'), 'sin_pase', 'sin pase, durante el viaje: `HoySinPase`')
  debe(!(await hay(g, '[data-hoy-siguiente]')) && !(await hay(g, '[data-cerca-de-ti]')) && !(await hay(g, '[data-candado]')), 'sin_pase', 'sin pase NO sale HOY con candados (la Completa 10): ni tarjeta de parada ni «Cerca de ti» con candados')
  const puntos = await a_(g, "Array.from(document.querySelectorAll('[data-hoy-sin-pase-punto]')).map((e) => e.getAttribute('data-hoy-sin-pase-punto'))")
  const esperados = ['Tu día, paso a paso', 'Cambiar plan', 'Los avisos del tiempo', 'Cerca de ti', 'La cámara y los logros', 'Las historias, para escuchar', 'Tus entradas, sin internet', 'Avisos en el móvil bloqueado']
  debe(JSON.stringify(puntos) === JSON.stringify(esperados), 'sin_pase', `la lista nueva de lo que trae HOY (${puntos.join(' | ')})`)
  const textoSin = (await txt(g, '[data-hoy-sin-pase]')) ?? ''
  debe(/«Ya estás aquí»/.test(textoSin) && /sin mover nada sin tu permiso/i.test(textoSin) && /Ver el Pase Roma/.test(textoSin) && !/Tu siguiente parada, en grande/.test(textoSin), 'sin_pase', 'los textos nuevos y la invitación al pase')
  await a_(g, "document.querySelector('[data-hoy-sin-pase]')?.scrollIntoView(); true")
  await g.captura(png('13_sin_pase_lista'))

  // El día de prueba: HOY entero y sin un solo candado
  await g.evaluar(`(async () => {
    const st = ${R}; const r = st.getState().route
    const iso = (() => { const d = new Date(r.answers.dateRange.start + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10) })()
    const sync = (await import('/src/store/useSyncStore.ts')).useSyncStore; sync.getState().setActiveTripId('viaje-de-esta-prueba'); const tripId = 'viaje-de-esta-prueba'
    window.__pruebaDelPase = { cobro: true, conPase: false, puede: true, pruebaGastada: false, prueba: { estado: 'pendiente', fecha: iso, tripId } }
    st.getState().setDevSimulatedTodayIso('2000-01-01'); await new Promise((x) => setTimeout(x, 400)); st.getState().setDevSimulatedTodayIso(iso)
    return true })()`)
  await g.esp(3500)
  debe(await hay(g, '[data-franja-prueba]'), 'prueba', 'el día de prueba: HOY entero con su franja de arriba')
  if (await hay(g, '[data-franja-prueba]')) {
    debe((await hay(g, '[data-hoy-v2]')) && (await hay(g, '[data-cerca-de-ti="con-pase"]')), 'prueba', 'el día de prueba: «Cerca de ti» abierto (`con-pase`)')
    debe((await cuantos(g, '[data-candado]')) === 0 && (await cuantos(g, '[data-hoy-v2] [data-candado-dentro]')) === 0, 'prueba', 'el día de prueba: ni un solo candado en HOY')
    debe((await cuantos(g, '[data-hoy-franja-x],[data-hoy-avisos] [data-hoy-aviso-x]')) >= 1, 'x', 'la franja del día de prueba lleva su X')
    await capturaEntera(g, '14_dia_de_prueba')
    await clic(g, '[data-franja-prueba] [data-hoy-aviso-x]')
    await g.esp(500)
    debe(!(await hay(g, '[data-franja-prueba]')), 'x', 'la X cierra la franja del día de prueba')
  }
  g.cerrar()
})

console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)

async function atrEstado(a) {
  return a.evaluar("document.querySelector('[data-hoy-siguiente]')?.getAttribute('data-hoy-estado') ?? null")
}
function a_(app, js) {
  return app.evaluar(js)
}
