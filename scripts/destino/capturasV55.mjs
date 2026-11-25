// V55: SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   FASE=antes|despues APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV55.mjs [hoja]
// Guarda docs/dias/V55_capturas/<hoja>_<fase>.jpg. Hojas: retraso comer anadir saltar yanodatiempo mastiempo horario horario_grupo peligro quehago comovais lluvia_roma lluvia_lanza reorganizar reorganizar_mas lanza_otro_dia lanza_retraso
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const FASE = process.env.FASE ?? 'despues'
const CAP = path.resolve('docs/dias/V55_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}_${FASE}.jpg`)
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const SOLO = process.argv[2] ?? null
const toca = (n) => !SOLO || SOLO === n
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago'

async function abrir(extra = {}) {
  const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844, ...extra })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  const lanza = extra.lanza
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  return { a, ev }
}
const montarHoy = async ({ a, ev }, min, mut = '', iso = '2026-10-17') => {
  await a.evaluar(`(async () => {
    const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
    r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('trazo:hoy2:') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy1:juego:') || k.startsWith('trazo:hoy2b:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
    window.__horaFalsa = ${min}
    st.getState().setDevSimulatedTodayIso('${iso}'); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3500)
  for (let i = 0; i < 3; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^Continuar$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(700)
  }
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const clicTexto = (a, re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => ${re}.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()`)
const hoja = (a) => a.evaluar("(document.querySelector('[data-cambiar-hoja], [data-hoja], [role=dialog]')?.innerText ?? document.body.innerText).replace(/\\s+/g, ' ').slice(0, 420)")
const botones = (a) => a.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-cambiar-hoja] button, [data-alerta-reorganizar] button')).map((b) => b.textContent.trim()).filter(Boolean))")
const arriba = async (a) => {
  await a.evaluar('window.scrollTo(0, 0); document.querySelectorAll("*").forEach((e) => { if (e.scrollTop > 0 && e.scrollHeight > e.clientHeight + 40) e.scrollTop = 0 }); true')
  await a.esp(500)
}
const sacar = async (a, nombre, nota) => {
  await a.esp(1500)
  console.log(nombre, FASE, '|', nota ?? '', '|', await hoja(a), '|', await botones(a))
  await a.captura(png(nombre))
}
// La 1.ª parada ya hecha: la siguiente es la 2.ª
const YA_HECHA = "{ const d0 = r.days.find((d) => !d.isReturnLeg); d0.stops.filter((s) => !s.isArrival)[0].checkedInAt = new Date().toISOString() }"
// Día con una entrada con hora en la 2.ª parada; la 1.ª de 60 min a las 8:30
const ENTRADA = (nombre, hora, extra = '') => `const d0 = r.days.find((d) => !d.isReturnLeg); const S = d0.stops; const todas = r.days.flatMap((d) => d.stops); const real = todas.find((x) => /Arco de Constantino/.test(x.name)) ?? todas.find((x) => /Pante|Navona|Trevi/.test(x.name)); if (real) { S[0] = { ...JSON.parse(JSON.stringify(real)), id: 'v55-antes' }; delete S[0].checkedInAt; delete S[0].saltada; delete S[0].reservationTime; delete S[0].reservedId } S[0].time = '08:30'; S[0].durationMinutes = 60; S[0].hoursData = null; const E = S[1]; E.name = ${JSON.stringify(nombre)}; E.reservationTime = ${JSON.stringify(hora)}; E.time = ${JSON.stringify(hora)}; E.durationMinutes = 90; E.hoursData = null; window.__pos = { lat: E.coordinates.lat + 0.03, lng: E.coordinates.lng }; window.__perm = 'granted'; ${extra}`
const LIBRE_EL_SIGUIENTE = "const dd = r.days.filter((d) => !d.isReturnLeg); if (dd[1]) dd[1].stops = dd[1].stops.slice(0, 2)"

if (toca('retraso') || toca('comer') || toca('anadir') || toca('saltar')) {
  const c = await abrir()
  const { a } = c
  try {
    if (toca('retraso')) {
      // 2.ª parada de la mañana con retraso: se ajusta el día
      await montarHoy(c, 12 * 60 + 20, '')
      await clicTexto(a, /Dejarlo como está/)
      await a.esp(600)
      await clic(a, '[data-hoy-cambiar-plan]')
      await a.esp(800)
      await clic(a, '[data-cambiar-opcion="retraso"]')
      await sacar(a, 'retraso')
    }
    if (toca('comer')) {
      await montarHoy(c, 13 * 60 + 10, '')
      await clic(a, '[data-hoy-cambiar-plan]')
      await a.esp(800)
      await clic(a, '[data-cambiar-opcion="comer"]')
      await a.esp(3500)
      await clic(a, '[data-comer-ir-aqui]')
      await sacar(a, 'comer')
    }
    if (toca('anadir')) {
      await montarHoy(c, 10 * 60 + 5, '')
      await clic(a, '[data-hoy-cambiar-plan]')
      await a.esp(800)
      await clic(a, '[data-cambiar-opcion="anadir"]')
      await a.esp(2500)
      await clic(a, '[data-anadir-elegir]')
      await sacar(a, 'anadir')
    }
    if (toca('saltar')) {
      await montarHoy(c, 8 * 60 + 40, ENTRADA('Coliseo', '09:15', YA_HECHA))
      await clic(a, '[data-hoy-cambiar-plan]')
      await a.esp(800)
      await clic(a, '[data-cambiar-opcion="saltar"]')
      await sacar(a, 'saltar')
    }
  } finally {
    a.cerrar()
  }
}

if (toca('yanodatiempo') || toca('mastiempo') || toca('peligro') || toca('horario') || toca('horario_grupo')) {
  const c = await abrir()
  const { a } = c
  try {
    if (toca('yanodatiempo')) {
      await montarHoy(c, 15 * 60, '')
      await a.esp(1500)
      await clic(a, '[data-ya-no-pasar]')
      await sacar(a, 'yanodatiempo')
    }
    if (toca('mastiempo')) {
      await montarHoy(c, 9 * 60 + 35, ENTRADA('Coliseo', '10:15', LIBRE_EL_SIGUIENTE))
      await clic(a, '[data-hoy-ya-he-llegado]')
      await a.esp(1200)
      await clic(a, '[data-hoy-necesito-mas-tiempo]')
      await a.esp(800)
      await clic(a, '[data-hoy-mas-tiempo-opcion="30"]')
      await a.esp(1500)
      await clic(a, '[data-mas-tiempo-ver-solucion]')
      await sacar(a, 'mastiempo')
    }
    if (toca('peligro')) {
      await montarHoy(c, 8 * 60 + 40, ENTRADA('Coliseo', '09:15', LIBRE_EL_SIGUIENTE))
      await arriba(a)
      await clic(a, '[data-peligro-ver-solucion]')
      await sacar(a, 'peligro')
    }
    if (toca('horario')) {
      // Foro: cierra; un sitio que ya no llega: «Pasarlo a otro día»
      await montarHoy(c, 19 * 60 + 45, `const d0 = r.days.find((d) => !d.isReturnLeg); const q = d0.stops[0]; q.name = 'Museos Capitolinos'; q.fullName = q.name; q.reservationTime = undefined; q.reservedId = undefined; q.hoursData = null; q.time = '19:00'; q.durationMinutes = 40; window.__pos = null; window.__perm = 'denied'`)
      await clicTexto(a, /Dejarlo como está/)
      await a.esp(800)
      await arriba(a)
      await clic(a, '[data-horario-ver-solucion]')
      await sacar(a, 'horario')
    }
    if (toca('horario_grupo')) {
      await montarHoy(c, 19 * 60 + 45, `const d0 = r.days.find((d) => !d.isReturnLeg); const S = d0.stops; ['Museos Capitolinos', 'Museos Vaticanos y Capilla Sixtina', 'Galería Borghese'].forEach((n, i) => { const q = S[i]; q.name = n; q.fullName = n; q.reservationTime = undefined; q.reservedId = undefined; q.hoursData = null; q.time = ['19:00', '19:20', '19:40'][i]; q.durationMinutes = 40 }); window.__pos = null; window.__perm = 'denied'`)
      await clicTexto(a, /Dejarlo como está/)
      await a.esp(800)
      await arriba(a)
      await clic(a, '[data-horario-ver-grupo]')
      await sacar(a, 'horario_grupo')
    }
  } finally {
    a.cerrar()
  }
}

if (toca('quehago') || toca('comovais') || toca('lluvia_roma')) {
  const c = await abrir()
  const { a } = c
  try {
    if (toca('quehago')) {
      await montarHoy(c, 11 * 60, "const d0 = r.days.find((d) => !d.isReturnLeg); d0.stops.filter((s) => !s.isArrival).forEach((s, i) => { s.checkedInAt = i < 2 ? new Date().toISOString() : undefined }); window.__pos = null")
      console.log('quehago botón', await clic(a, '[data-hoy-que-hago-ahora]'))
      await a.esp(900)
      await clic(a, '[data-que-hago-anadir]')
      await sacar(a, 'quehago')
    }
    if (toca('comovais')) {
      // «Cansados» (el aviso real depende de la hora de comer y de las sugerencias): la hoja real con la propuesta REAL de `responderCansados`
      await montarHoy(c, 15 * 60 + 20, "const d0 = r.days.find((d) => !d.isReturnLeg); d0.stops.filter((s) => !s.isArrival).slice(0, 2).forEach((s) => { s.checkedInAt = new Date().toISOString() }); window.__pos = null")
      await a.evaluar(`(async () => {
        const st = ${R}; const r = st.getState().route; const d = r.days.find((x) => !x.isReturnLeg)
        const reactM = await import('/node_modules/.vite/deps/react.js'); const React = reactM.default ?? reactM
        const rdc = await import('/node_modules/.vite/deps/react-dom_client.js'); const createRoot = rdc.createRoot ?? rdc.default?.createRoot
        const { HojaPropuesta } = await import('/src/components/route/hoy/v2/CambiarPlan.tsx')
        const { responderCansados } = await import('/src/lib/hoyComoVais.ts')
        const ctx = { fijasDe: () => new Set(), datos: { importanciaPorSitio: {}, nivelPorSitio: {} }, enCoche: false, etiquetaDia: () => 'sábado' }
        const h = responderCansados({ route: r, day: d, ctx, ahoraMin: 15 * 60 + 20, ubicacion: null, enCoche: false, dateIso: '2026-10-17', lugares: [] })
        window.__cansados = h ? h.caso : 'nada'
        if (!h || !h.propuesta) return false
        const cont = document.createElement('div'); cont.id = 'v55-montaje'; cont.style.cssText = 'position:fixed;inset:0;z-index:300'
        document.body.appendChild(cont)
        createRoot(cont).render(React.createElement(HojaPropuesta, { titulo: h.caso === 'calma' ? 'Vamos con calma' : h.caso === 'opcional' ? 'Por hoy' : 'Aguantad un poco', propuestas: [h.propuesta], indice: 0, etiquetaAplicar: h.caso === 'opcional' ? 'Terminar el día' : 'Hacerlo así', onOtra: () => {}, onAplicar: () => {}, onCerrar: () => {} }))
        return true })()`)
      console.log('cansados caso', await a.evaluar('window.__cansados'))
      await sacar(a, 'comovais')
    }
    if (toca('lluvia_roma')) {
      // El plan de lluvia de Roma montado con la pieza real (el aviso real pide la previsión de internet)
      await montarHoy(c, 10 * 60, '')
      await a.evaluar(`(async () => {
        const st = ${R}; const r = st.getState().route; const d = r.days.find((x) => !x.isReturnLeg)
        const reactM = await import('/node_modules/.vite/deps/react.js'); const React = reactM.default ?? reactM
        const rdc = await import('/node_modules/.vite/deps/react-dom_client.js'); const createRoot = rdc.createRoot ?? rdc.default?.createRoot
        const { HojaPropuesta } = await import('/src/components/route/hoy/v2/CambiarPlan.tsx')
        const { proponerSiLlueveRoma } = await import('/src/lib/hoyLluvia.ts')
        const dia = { ...d, rainPlan: { text: 'Va a llover esta tarde. Te proponemos un plan a cubierto.', remove: [d.stops.filter((s) => !s.isArrival)[2]?.name ?? ''], add: [{ ...JSON.parse(JSON.stringify(d.stops.filter((s) => !s.isArrival)[0])), id: 'lluvia-x', name: 'Museos Capitolinos', time: '16:00', fixedPhotoUrl: undefined, photoUrl: undefined }] } }
        const ctx = { fijasDe: () => new Set(), datos: { importanciaPorSitio: {}, nivelPorSitio: {} }, enCoche: false, etiquetaDia: () => 'sábado' }
        const props = proponerSiLlueveRoma({ day: dia, ctx })
        const cont = document.createElement('div'); cont.id = 'v55-montaje'; cont.style.cssText = 'position:fixed;inset:0;z-index:300'
        document.body.appendChild(cont)
        createRoot(cont).render(React.createElement(HojaPropuesta, { titulo: 'Plan de lluvia', propuestas: props, indice: 0, vacio: 'nada', onOtra: () => {}, onAplicar: () => {}, onCerrar: () => {} }))
        return true })()`)
      await sacar(a, 'lluvia_roma')
    }
  } finally {
    a.cerrar()
  }
}

if (toca('lluvia_lanza') || toca('lanza_otro_dia') || toca('lanza_retraso')) {
  const c = await abrir({ lanza: true })
  const { a } = c
  try {
    if (toca('lanza_retraso')) {
      await montarHoy(c, 12 * 60 + 20, '', '2026-11-08')
      await clicTexto(a, /Dejarlo como está/)
      await a.esp(600)
      await clic(a, '[data-hoy-cambiar-plan]')
      await a.esp(800)
      await clic(a, '[data-cambiar-opcion="retraso"]')
      await sacar(a, 'lanza_retraso')
    }
    if (toca('lanza_otro_dia')) {
      await montarHoy(c, 10 * 60, '', '2026-11-08')
      await clic(a, '[data-hoy-cambiar-plan]')
      await a.esp(800)
      await clic(a, '[data-cambiar-opcion="otro_dia"]')
      await a.esp(1500)
      await a.evaluar("(() => { const b = document.querySelector('[data-dia-de-la-lista]'); b?.click(); return Boolean(b) })()")
      await sacar(a, 'lanza_otro_dia')
    }
    if (toca('lluvia_lanza')) {
      const por = (fn) => Array.from({ length: 24 }, (_, h) => fn(h))
      const lluvia = { probability: por((h) => (h >= 13 && h <= 19 ? 90 : 0)), precipitation: por((h) => (h >= 13 && h <= 19 ? 1.2 : 0)), cloud: por(() => 10), gust: por(() => 15) }
      await montarHoy(c, 10 * 60, '', '2026-11-08')
      await a.evaluar(`window.__hoy1HoraLocal = 10; window.__hoy1Tiempo = ${JSON.stringify(lluvia)}; window.dispatchEvent(new Event('hoy1-tiempo')); true`)
      await a.esp(1500)
      await a.evaluar("(() => { document.querySelector('[data-hoy-aviso-mas]')?.click(); return true })()")
      await a.esp(500)
      console.log('lluvia lanza botón', await clic(a, '[data-ver-alternativa]'))
      await sacar(a, 'lluvia_lanza')
    }
  } finally {
    a.cerrar()
  }
}

if (toca('reorganizar') || toca('reorganizar_mas')) {
  const c = await abrir()
  const { a, ev } = c
  try {
    await ev(`${R}.getState().setMode('route')`)
    await a.esp(1500)
    const poner = (n) => a.evaluar(`(async () => {
      const { useReorganizarStore } = await import('/src/store/useReorganizarStore.ts'); const r = ${R}.getState().route
      const d = r.days.find((x) => !x.isReturnLeg)
      const ids = d.stops.filter((s) => !s.isArrival).map((s) => s.id)
      const orden = [...ids].reverse().slice(0, ${n}).concat(ids.slice(0, Math.max(0, ids.length - ${n})))
      const st = useReorganizarStore.getState()
      st.poner([d.id], [d.id], [{ dayId: d.id, dayNumber: d.dayNumber, order: orden, mealAfter: {}, movidas: orden.filter((id, i) => id !== ids[i]) }]); st.abrirAlerta(); return orden.length })()`)
    if (toca('reorganizar')) {
      await poner(2)
      await sacar(a, 'reorganizar')
    }
    if (toca('reorganizar_mas')) {
      await a.evaluar("(async () => { (await import('/src/store/useReorganizarStore.ts')).useReorganizarStore.getState().cerrarAlerta(); return true })()")
      await a.esp(500)
      await poner(7)
      await sacar(a, 'reorganizar_mas')
    }
  } finally {
    a.cerrar()
  }
}
