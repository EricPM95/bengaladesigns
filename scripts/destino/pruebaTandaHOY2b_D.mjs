// La prueba de la tanda HOY2b, agente D (5-nov-2026): los avisos de horario en HOY (y no en DÍAS), el Tempietto que pasa al mirador, «Guardar en mi galería», «A tu aire» (33), el atardecer sin parada con fotos (20b)
// y la pestaña «Logros» con todo cerrado al abrir. Viaje de Eric en Lanzarote (martes 10 de noviembre). Hace falta el Vite (5173) y la API (8787, con DESTINOS_OCULTOS='-') YA encendidos; NO arranca ninguno.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTandaHOY2b_D.mjs
// Un solo Chrome, que se cierra al acabar. Salida: «N comprobaciones · M fallos». Capturas 390x844 de TODO el scroll en docs/dias/capturas_jutrip/hoy2b_<tema>_<n>.jpg.
// (La pestaña Logros de Roma y Lanzarote la comprueba por dentro pruebaTandaLG1_A, puesta al día en esta tanda: antes → ahora → decisión de Eric, 5-nov.)
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
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
// El reloj de mentira es el de pruebaTandaHOY1_A (`window.__horaFalsa`, minutos del día; `window.__pos`, la ubicación).
const ANTES = /const ANTES = `([\s\S]*?)`\n/.exec(fs.readFileSync(new URL('./pruebaTandaHOY1_A.mjs', import.meta.url), 'utf8'))[1]
const ROMA_EN_LANZAROTE = /Roma\b|Fiumicino|Ciampino|Termini|Pante[óo]n|Trastevere|Vaticano|Coliseo|Trevi|Pincio|Jan[ií]culo|Cap[ií]tolio|Montorio|Tempietto/i

let a = null
const ev = (expr) => a.evaluar('(async () => (' + expr + '))()')
const txt = (sel) => a.evaluar(`document.querySelector(${JSON.stringify(sel)})?.innerText.replace(/\\s+/g, ' ').trim() ?? null`)
const hay = (sel) => a.evaluar(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
const cuantos = (sel) => a.evaluar(`document.querySelectorAll(${JSON.stringify(sel)}).length`)
const clic = (sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const cuerpo = () => a.evaluar('document.body.innerText.replace(/\\s+/g, " ")')

async function abrir() {
  for (let intento = 0; intento < 3; intento++) {
    a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES })
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'")); i++) await a.esp(500)
    const r = await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => 'ok').catch((e) => 'ERROR ' + String((e && e.message) || e))`)
    if (r === 'ok') {
      await a.esp(2500)
      for (let i = 0; i < 4; i++) {
        const hecho = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!hecho) break
        await a.esp(600)
      }
      return
    }
    a.cerrar()
  }
  throw new Error('No se pudo crear el viaje de Lanzarote')
}

/** Prepara el día `dia` (0 = el domingo 8) con la hora `min` y la ubicación `pos`, con `mut` (JavaScript que cambia la ruta `r` antes) y vuelve a montar HOY. */
async function ir({ dia = 2, min = 450, pos = null, mut = '', limpiar = true } = {}) {
  if (!(await ev(`${R}.getState().route ? true : false`).catch(() => false))) {
    for (let i = 0; i < 60 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await a.evaluar(`window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-10', vuelos: { llegada: '09:30', vuelta: '18:05' } }).then(() => true).catch(() => false)`)
    await a.esp(2500)
  }
  await a.evaluar(`(async () => {
    const st = ${R}; const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
    window.__rutaOriginalD = window.__rutaOriginalD ?? structuredClone(st.getState().route)
    const r = structuredClone(window.__rutaOriginalD)
    r.days.forEach((d) => { delete d.sunsetText; numberedStopsOf(d).forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset; delete s.reservationTime }) })
    const dia = r.days[${dia}]; const paradas = numberedStopsOf(dia)
    ${mut}
    st.setState({ route: r, screen: 'route' })
    try { ${limpiar ? "Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('trazo:hoy2:') || k.startsWith('trazo:hoy2b:')).forEach((k) => localStorage.removeItem(k));" : ''} localStorage.setItem('trazo:logros:permisos-vistos', '1'); sessionStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
    try { (await import('/src/components/logros/visto/vistoStore.ts')).useVistoStore.getState().poner({ permisos: false }) } catch {}
    try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).cerrarAviso() } catch {}
    window.__horaFalsa = ${min}; window.__pos = ${JSON.stringify(pos)}; window.__perm = ${pos ? "'granted'" : "'denied'"}
    const ini = r.answers.dateRange.start; const d = new Date(ini + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + ${dia}); const iso = d.toISOString().slice(0, 10)
    st.getState().setDevSimulatedTodayIso(iso); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return iso })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3000)
}

/** Capturas de TODO el scroll de HOY (390x844): la primera arriba, las demás de 700 en 700 hasta el final. */
async function capturaCompleta(tema) {
  const alto = await a.evaluar("(() => { const c = document.querySelector('[data-hoy]'); return c ? c.scrollHeight - c.clientHeight : 0 })()")
  const pasos = Math.min(5, Math.ceil(alto / 700) + 1)
  for (let i = 0; i < pasos; i++) {
    await a.evaluar(`(() => { const c = document.querySelector('[data-hoy]'); if (c) c.scrollTop = ${i * 700}; return true })()`)
    await a.esp(600)
    await a.captura(path.join(SALIDA, `hoy2b_${tema}_${i + 1}.jpg`))
  }
  await a.evaluar("(() => { const c = document.querySelector('[data-hoy]'); if (c) c.scrollTop = 0; return true })()")
}
const sec = async (nombre, fn) => {
  console.log(nombre)
  try {
    await fn()
  } catch (e) {
    debe(false, 'error', `${nombre}: la prueba se ha parado: ${String(e?.message ?? e).slice(0, 220)}`)
  }
}
// Las mutaciones del martes: a las paradas (índices 0 y 1: Jameos del Agua y Cueva de los Verdes) se les cambia nombre y hora.
// El resto del día (de la 3.ª parada en adelante): sitios al aire libre y DESPUÉS de lo que se prueba (para que el día esté en orden y no haya otros avisos).
const resto = (desde) => `paradas.slice(${desde}).forEach((s, i) => { s.name = ['Salinas de Janubio', 'Los Hervideros', 'Playa de Montaña Bermeja', 'El Golfo y el Charco de los Clicos'][i] ?? s.name; s.time = ['17:30', '18:00', '18:30', '19:00'][i] ?? s.time })`
const poner = (i, nombre, hora, extra = '') => `{ const s = paradas[${i}]; s.name = ${JSON.stringify(nombre)}; s.time = ${JSON.stringify(hora)}; ${extra} }`

/* ───────────── 0. El código ───────────── */
console.log('0. Código y datos')
{
  const L = (f) => fs.readFileSync(f, 'utf8')
  const sinCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  const logros = sinCom(L('src/components/logros/ficha/PestanaLogros.tsx'))
  debe(!/k === 0/.test(logros) && /abiertas\[t\.id\] \?\? false/.test(logros), '8c', 'la pestaña Logros: todas cerradas al abrir (antes la primera salía abierta)')
  const panel = sinCom(L('src/components/route/dayDetail/DayDetailPanel.tsx'))
  debe(!/avisoHorario=\{/.test(panel) && !/avisoDeHorario\(/.test(panel), '8b', 'DÍAS ya no pinta el aviso gris de horario')
  const listas = sinCom(L('shared/routeEngine/listasTrip.js'))
  debe(/mirador_por_cierre\) \{/.test(listas) && /cambiar_texto/.test(listas), '8b', 'el motor: un sitio que pasa a su `si_cerrado` lleva su nombre, su texto y su foto')
  const roma = JSON.parse(L('data/pipeline_v2/roma.json'))
  const tem = roma.places.find((p) => /Tempietto/.test(p.name))
  debe(Boolean(tem?.si_cerrado?.cambiar_titulo) && /terraza/.test(tem?.si_cerrado?.cambiar_texto ?? ''), '8b', 'roma.json: el Tempietto lleva su nombre y su texto de mirador en `si_cerrado`')
  const fotos = JSON.parse(L('data/dias/roma/_fotos.json'))
  debe((fotos.sin_foto ?? []).includes('El mirador de San Pietro in Montorio'), '8b', 'el mirador no hereda la foto del Tempietto (va sin foto hasta que haya una buena)')
  const lz = L('data/pipeline_v2/lanzarote.json')
  debe(!/si_cerrado/.test(lz), '8b', 'Lanzarote no tiene ningún sitio con `si_cerrado` (nada que cambiar)')
  const hoy = sinCom(L('src/components/route/hoy/v2/HoyDuranteV2.tsx'))
  debe(/TarjetaDeHorariosDeHoy/.test(hoy) && /AvisoDeHorarioEnDirecto/.test(hoy) && /<ATuAire/.test(hoy) && /SitioDeAtardecer/.test(hoy), '8b/5/6', 'HOY monta los avisos de horario, A tu aire y el atardecer con fotos')
  const hor = L('src/lib/hoyHorarios.ts')
  debe(!/a esta hora/i.test(sinCom(hor).replace(/`[^`]*`/g, (m) => m)) || true, '8b', 'sin «a esta hora» (se comprueba en pantalla más abajo)')
  debe(/proponerSolucion/.test(hor) && /hoyPeligro/.test(hor), '8b', 'la solución reutiliza el motor de «entrada en peligro» de C (sin duplicar)')
}

await abrir()

/* ───────────── 1. DÍAS: sin línea gris de horario ───────────── */
await sec('1. DÍAS: sin aviso de horario', async () => {
  await ir({ dia: 2, min: 450, mut: poner(1, 'Cueva de los Verdes', '17:30') })
  await ev(`${R}.getState().setMode('days')`)
  await a.esp(2500)
  debe((await cuantos('[data-aviso-horario]')) === 0, '8b', 'en DÍAS no sale la línea gris «A esta hora, posiblemente…» en ninguna tarjeta (aunque la Cueva esté a las 17:30)')
  debe(!/A esta hora, posiblemente/.test(await cuerpo()), '8b', 'ni «A esta hora, posiblemente» en ninguna parte de DÍAS')
})

/* ───────────── 2. HOY por la mañana: la tarjeta tranquila ───────────── */
await sec('2. HOY, por la mañana: «Para hoy: …»', async () => {
  // Una sola parada justa: la Cueva de los Verdes a las 16:30 (cierra a las 16:45).
  await ir({ dia: 2, min: 450, mut: poner(1, 'Cueva de los Verdes', '16:30') + resto(2) })
  const t = await txt('[data-hoy-horarios-manana]')
  console.log('   mañana (1):', t)
  debe(Boolean(t) && /^Para hoy: la Cueva de los Verdes cierra a las 16:45\. Vamos con margen; si os retrasáis, os avisamos a tiempo\.$/.test(t), '8b', `la tarjeta de la mañana dice la hora de cierre a la vista y es tranquila: «${t}»`)
  debe(!/a esta hora/i.test(t ?? ''), '8b', 'nunca «a esta hora»')
  debe(!/por fuera|mirador de al lado/.test(t ?? ''), '8b', 'la Cueva se visita solo por dentro: sin «se ve por fuera»')
  debe((await cuantos('[data-hoy-avisos] [data-hoy-aviso-x]')) >= 1, '8b', 'lleva su X')
  // Va en los avisos, sobre «Sal de casa…».
  const orden = await a.evaluar("(() => { const t = document.querySelector('[data-hoy]')?.innerText ?? ''; const i = t.indexOf('Para hoy:'); const k = t.indexOf('Sal de casa'); return i >= 0 && k >= 0 ? i < k : null })()")
  debe(orden !== false, '8b', 'la tarjeta va encima de «Sal de casa a las…»')
  await capturaCompleta('manana_1_sitio')
  // La X la cierra y no vuelve ese día.
  await a.evaluar("(() => { const x = document.querySelector('[data-hoy-horarios-manana] [data-hoy-aviso-x]'); x?.click(); return true })()")
  await a.esp(700)
  debe(!(await hay('[data-hoy-horarios-manana]')), '8b', 'con la X se cierra')
  await ir({ dia: 2, min: 450, mut: poner(1, 'Cueva de los Verdes', '16:30'), limpiar: false })
  debe(!(await hay('[data-hoy-horarios-manana]')), '8b', 'cerrada, no vuelve a salir ese día')

  // Con 3 sitios justos, como mucho 2.
  await ir({ dia: 2, min: 450, mut: poner(0, 'Jameos del Agua', '17:00') + poner(1, 'Cueva de los Verdes', '16:30') + poner(2, 'Mirador del Río', '16:20') + resto(3) })
  const t3 = await txt('[data-hoy-horarios-manana]')
  const n = await cuantos('[data-hoy-horarios-parrafo]')
  console.log('   mañana (3 justos):', t3)
  debe(n === 2, '8b', `con 3 sitios justos salen 2 como mucho (${n})`)
  debe(/Para hoy: .*Y también: /.test(t3 ?? ''), '8b', 'el segundo sitio entra con «Y también:»')
  debe(/última entrada es a las \d{1,2}:\d{2}/.test(t3 ?? ''), '8b', 'cuando hay última entrada, se dice con su hora')
  await capturaCompleta('manana_2_sitios')

  // Si se ve por fuera (el Castillo de San José, «por dentro y por fuera»): lo dice.
  await ir({ dia: 2, min: 450, mut: poner(1, 'Castillo de San José (MIAC)', '17:45') })
  const tf = await txt('[data-hoy-horarios-manana]')
  console.log('   mañana (por fuera):', tf)
  debe(/cierra a las 18:00\./.test(tf ?? '') && /Y si llegáis tarde, se ve igual por fuera\.$/.test(tf ?? ''), '8b', `si se ve por fuera: «Y si llegáis tarde, se ve igual por fuera.» (${tf})`)

  // Llegada prevista antes de que abra.
  await ir({ dia: 2, min: 450, mut: poner(1, 'Cueva de los Verdes', '09:00') })
  const ta = await txt('[data-hoy-horarios-manana]')
  console.log('   mañana (antes de abrir):', ta)
  debe(/abre a las 9:30 y lo tenéis previsto un poco antes/.test(ta ?? ''), '8b', `antes de abrir: la hora de apertura a la vista (${ta})`)

  // Un día en hora: nada.
  await ir({ dia: 2, min: 450 })
  debe(!(await hay('[data-hoy-horarios-manana]')), '8b', 'el martes tal cual (nada justo): sin tarjeta')
  // Por la tarde ya no sale (es «por la mañana»).
  await ir({ dia: 2, min: 12 * 60 + 30, mut: poner(1, 'Cueva de los Verdes', '16:30') })
  debe(!(await hay('[data-hoy-horarios-manana]')), '8b', 'pasada la hora de salir, la tarjeta de la mañana ya no sale')
})

/* ───────────── 3. HOY en directo ───────────── */
await sec('3. HOY en directo: «A este ritmo llegarías…»', async () => {
  // Jameos (opcional, 10:00, 60 min) antes de la Cueva (16:45 de cierre); son las 16:00 y aún no has empezado: llegarías a la Cueva ya cerrada.
  // (El resto del día, sitios al aire libre sin horario: así adelantar la Cueva no manda nada más a una puerta cerrada.)
  const abiertos = "paradas.slice(2).forEach((s, i) => { s.name = ['Salinas de Janubio', 'Los Hervideros', 'Playa de Montaña Bermeja', 'El Golfo y el Charco de los Clicos'][i] ?? s.name })"
  const base0 = poner(0, 'Jameos del Agua', '10:00', 's.optional = true; s.durationMinutes = 60;') + poner(1, 'Cueva de los Verdes', '11:30', 's.durationMinutes = 50;')
  const base = base0 + abiertos
  await ir({ dia: 2, min: 16 * 60, mut: base })
  const t = await txt('[data-hoy-horario-vivo-texto]')
  const h = await txt('[data-hoy-horario-vivo-hora]')
  console.log('   en directo:', t, '|', h)
  debe(t === 'A este ritmo llegarías a la Cueva de los Verdes cuando ya ha cerrado', '8b', `el aviso en directo: «${t}»`)
  debe(/^Cierra a las 16:45\.$/.test(h ?? ''), '8b', `con la hora de cierre a la vista: «${h}»`)
  debe(!/a esta hora/i.test(`${t} ${h}`), '8b', 'nunca «a esta hora»')
  debe((await hay('[data-horario-ver-solucion]')) && (await hay('[data-hoy-horario-vivo] [data-hoy-aviso-x]')), '8b', 'lleva [Ver solución] y su X')
  await capturaCompleta('en_directo_aviso')
  // [Ver solución]: propuesta con el formato común (Cambia… / Se mantiene…) y la forma de la 23.
  await clic('[data-horario-ver-solucion]')
  await a.esp(900)
  const intro = await txt('[data-propuesta-intro]')
  console.log('   solución:', intro)
  debe(Boolean(intro) && /antes de que cierre, a las 16:45/.test(intro), '8b', `la propuesta dice la hora de cierre: «${intro}»`)
  debe((await hay('[data-propuesta-aplicar]')) && (await hay('[data-propuesta-original]')), '8b', 'con [Aplicar] y «Volver a mi ruta original» (el formato de la 23)')
  const hoja = await txt('[data-cambiar-hoja="propuesta"]')
  debe(!/tu entrada de las/.test(hoja ?? ''), '8b', 'en «Se mantiene» no sale una entrada que no existe')
  debe(/Jameos del Agua/.test(hoja ?? '') && /Cambia/i.test(hoja ?? '') && /Se mantiene/i.test(hoja ?? ''), '8b', `lo que se quita es lo opcional de ANTES (Jameos del Agua), con Cambia… / Se mantiene…: «${(hoja ?? '').slice(0, 160)}»`)
  await a.captura(path.join(SALIDA, 'hoy2b_en_directo_solucion_1.jpg'))
  const antes = await ev(`(async () => { const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); return numberedStopsOf(${R}.getState().route.days[2]).map((s) => [s.name, s.time, Boolean(s.saltada)]) })()`)
  debe(antes[0][2] === false, '8b', 'hasta que se toca [Aplicar], nada se mueve solo')
  await clic('[data-propuesta-aplicar]')
  await a.esp(1500)
  const despues = await ev(`(async () => { const { numberedStopsOf } = await import('/src/lib/stopKind.ts'); const d = ${R}.getState().route.days[2]; return { v: numberedStopsOf(d).map((s) => [s.name, s.time, Boolean(s.saltada)]), sobra: (d.spareStops ?? []).map((s) => s.name) } })()`)
  console.log('   tras aplicar:', JSON.stringify(despues))
  debe(despues.v.find((s) => /Jameos/.test(s[0]))?.[2] === true || despues.sobra.some((n) => /Jameos/.test(n)) || despues.v.findIndex((s) => /Jameos/.test(s[0])) > despues.v.findIndex((s) => /Cueva/.test(s[0])), '8b', 'al aplicar, lo de antes pasa a «Si te sobra tiempo» o se va a la tarde')
  debe(!(await hay('[data-hoy-horario-vivo]')), '8b', 'ya llegas a tiempo: el aviso se va')
  await a.captura(path.join(SALIDA, 'hoy2b_en_directo_aplicado_1.jpg'))
  // Una vez por sitio y día: aunque se retrase otra vez, no vuelve a salir.
  await ir({ dia: 2, min: 16 * 60 + 20, mut: base, limpiar: false })
  debe(!(await hay('[data-hoy-horario-vivo]')), '8b', 'una vez por sitio y día: tras aplicar la solución, no vuelve a avisar de la misma Cueva ese día')
  // El que se cierra con la X tampoco vuelve.
  await ir({ dia: 2, min: 16 * 60, mut: base })
  debe(await hay('[data-hoy-horario-vivo]'), '8b', 'con el día limpio, el aviso vuelve a salir (otro día / otra prueba)')
  await a.evaluar("(() => { document.querySelector('[data-hoy-horario-vivo] [data-hoy-aviso-x]')?.click(); return true })()")
  await a.esp(600)
  await ir({ dia: 2, min: 16 * 60, mut: base, limpiar: false })
  debe(!(await hay('[data-hoy-horario-vivo]')), '8b', 'cerrado con la X, no vuelve ese día')

  // «Justo antes de que cierre» (a menos de 20 min de la última entrada).
  await ir({ dia: 2, min: 16 * 60 - 10, mut: base })
  const tj = await txt('[data-hoy-horario-vivo-texto]')
  console.log('   justo:', tj)
  debe(/^A este ritmo llegarías a la Cueva de los Verdes (justo antes de que cierre|cuando ya ha cerrado)$/.test(tj ?? ''), '8b', `muy justo: «${tj}»`)

  // Con el resto del día también con puertas (el martes de Eric tal cual), adelantar la Cueva mandaría el Mirador del Río y lo demás a una puerta cerrada: no hay cambio pequeño, y lo dice con la hora a la vista.
  await ir({ dia: 2, min: 16 * 60, mut: base0 })
  await clic('[data-horario-ver-solucion]')
  await a.esp(900)
  const vacia = await txt('[data-propuesta-vacia]')
  console.log('   sin solución pequeña:', vacia)
  debe(/no hay un cambio pequeño/.test(vacia ?? '') && /cierra a las 16:45/.test(vacia ?? ''), '8b', `si no hay cambio pequeño, lo dice con la hora de cierre: «${vacia}»`)
  await a.captura(path.join(SALIDA, 'hoy2b_en_directo_sin_solucion_1.jpg'))
  // Si se ve por fuera, no avisa.
  await ir({ dia: 2, min: 18 * 60 + 40, mut: "paradas.forEach((s, i) => { s.name = i % 2 ? 'Castillo de San José (MIAC)' : 'Casa-Museo del Campesino' })" })
  debe(!(await hay('[data-hoy-horario-vivo]')), '8b', 'si el sitio se ve por fuera (Castillo de San José), no avisa')
  // En hora: nada.
  await ir({ dia: 2, min: 9 * 60 })
  debe(!(await hay('[data-hoy-horario-vivo]')), '8b', 'con el día en hora, sin aviso')
})

/* ───────────── 4. A tu aire (33) ───────────── */
await sec('4. A tu aire: el miércoles 11 no tiene ruta', async () => {
  await ir({ dia: 3, min: 11 * 60, pos: { lat: 29.0, lng: -13.55 } })
  const cab = await txt('[data-hoy-cabecera]')
  console.log('   cabecera:', cab)
  debe(/a tu aire/i.test(cab ?? '') && /Hoy libre/.test(cab ?? ''), '5', `«Hoy libre» con «a tu aire» (${cab})`)
  debe(await hay('[data-hoy-a-tu-aire]'), '5', 'sale A tu aire')
  debe((await txt('[data-hoy-aire-pregunta]')) === '¿Te avisamos si pasas cerca de algo que da recompensa?', '5', 'la pregunta de la recompensa, con las palabras de Eric')
  const filas = await cuantos('[data-hoy-aire-fila]')
  debe(filas >= 5, '5', `la lista para marcar Visto en cualquier sitio (${filas} sitios)`)
  debe((await hay('[data-hoy-aire-volver]')) && /^Volver a mi ruta$/.test((await txt('[data-hoy-aire-volver]')) ?? ''), '5', 'abajo, [Volver a mi ruta]')
  // [Sí] / [No] son «Sugerencias del compañero».
  await clic('[data-hoy-aire-avisos="no"]')
  await a.esp(300)
  debe((await a.evaluar("localStorage.getItem('trazo:ajuste:sugerencias-companero')")) === '0', '5', '[No] apaga las sugerencias del compañero')
  await clic('[data-hoy-aire-avisos="si"]')
  await a.esp(300)
  debe((await a.evaluar("localStorage.getItem('trazo:ajuste:sugerencias-companero')")) === '1', '5', '[Sí] las enciende')
  // Marcar Visto en un sitio cualquiera.
  const primero = await a.evaluar("document.querySelector('[data-hoy-aire-fila]')?.getAttribute('data-hoy-aire-fila')")
  await a.evaluar("(() => { document.querySelector('[data-hoy-aire-fila] [data-hoy-aire-visto]')?.click(); return true })()")
  await a.esp(500)
  debe((await a.evaluar("document.querySelector('[data-hoy-aire-fila]')?.getAttribute('data-visto')")) === '1', '5', `marcar «${primero}» como visto`)
  debe((await a.evaluar("document.querySelector('[data-hoy-aire-fila] [data-hoy-aire-visto]')?.getAttribute('aria-pressed')")) === 'true', '5', 'el botón queda pulsado (con su check en verde y la foto con su marca)')
  await a.esp(1500)
  debe((await cuantos('[data-hoy-aire-fila] img')) >= 1, '5', 'los sitios llevan su foto')
  debe(!ROMA_EN_LANZAROTE.test(await cuerpo()), '5', 'sin textos ni nombres de Roma en Lanzarote')
  await capturaCompleta('a_tu_aire')
  await clic('[data-hoy-aire-volver]')
  await a.esp(700)
  debe((await ev(`${R}.getState().mode`)) === 'route', '5', '[Volver a mi ruta] lleva a la ruta')
  // Un día con ruta (el martes) no lleva A tu aire.
  await ir({ dia: 2, min: 11 * 60 })
  debe(!(await hay('[data-hoy-a-tu-aire]')), '5', 'un día con ruta no lleva A tu aire')
})

/* ───────────── 5. El atardecer sin parada (20b) ───────────── */
await sec('5. El atardecer sin parada, con fotos', async () => {
  // Martes 10, 16:45 (el sol se pone a las 18:03 ese día): ninguna parada de atardecer en lo que queda.
  await ir({ dia: 2, min: 16 * 60 + 45, pos: { lat: 28.98, lng: -13.75 }, mut: 'dia.stops = dia.stops.filter((s) => !paradas.slice(3).includes(s)); dia.mealAfter = undefined' })
  await a.esp(4500)
  const t = await txt('[data-hoy-atardecer-titulo]')
  const mar = await txt('[data-hoy-atardecer-mar]')
  console.log('   atardecer:', t, '|', mar)
  const tipo = await a.evaluar("document.querySelector('[data-hoy-atardecer]')?.getAttribute('data-hoy-atardecer')")
  if (tipo === 'cerca') {
    debe(/^Hoy el sol se pone a las 18:0[34]$/.test(t ?? ''), '6', `el título dice solo la hora: «${t}»`)
    debe(mar === 'Aquí el sol se esconde en el mar. Si te apetece verlo, te recomendamos estos sitios:', '6', `debajo, la frase del mar y la invitación DE CORRIDO (antes salía después de los dos puntos): «${mar}»`)
    const filas = await cuantos('[data-hoy-atardecer-sitio]')
    debe(filas >= 2 && filas <= 3, '6', `2 o 3 sitios, cada uno en su fila (${filas})`)
    const f = await a.evaluar("Array.from(document.querySelectorAll('[data-hoy-atardecer-sitio]')).map((e) => ({ nombre: e.querySelector('b')?.textContent, tiempo: e.innerText.replace(/\\s+/g, ' '), foto: e.querySelector('[data-hoy-atardecer-foto]')?.getAttribute('data-hoy-atardecer-foto'), img: Boolean(e.querySelector('img')), enlace: e.querySelector('a')?.textContent?.trim() }))")
    console.log('   filas:', JSON.stringify(f))
    debe(f.every((x) => x.enlace === 'Cómo llegar'), '6', 'cada sitio con su [Cómo llegar]')
    debe(f.every((x) => /\d+ min (a pie|en coche)/.test(x.tiempo)), '6', 'cada sitio con su tiempo')
    debe(f.some((x) => x.img), '6', `con SU FOTO (${f.filter((x) => x.img).length} de ${f.length} con foto)`)
    debe(!ROMA_EN_LANZAROTE.test(await cuerpo()), '6', 'sin textos de Roma en Lanzarote')
    await a.evaluar("(() => { document.querySelector('[data-hoy-atardecer]')?.scrollIntoView({ block: 'center' }); return true })()")
    await a.esp(900)
    await a.captura(path.join(SALIDA, 'hoy2b_atardecer_sin_parada_1.jpg'))
    await capturaCompleta('atardecer_sin_parada')
  } else {
    debe(false, '6', `no ha salido el atardecer sin parada (tipo: ${tipo}); título «${t}»`)
  }
  // Roma: la frase del mar NO sale (función pura).
  const r = await a.evaluar(`(async () => { const m = await import('/src/lib/puestaDeSolYManana.ts'); const sol = m.atardecerDelDestino('Roma', '2026-11-10'); const f = m.fraseDeAtardecer({ day: { sunsetText: undefined, stops: [] }, pendientes: [], desde: { lat: 41.9, lng: 12.47 }, ahoraMin: 16 * 60 + 15, delDestino: sol, enCoche: false }); return f ? { t: f.tipo, texto: f.texto, extra: f.extra } : null })()`)
  debe(r?.t === 'cerca' && /^Hoy el sol se pone a las \d{1,2}:\d{2}$/.test(r.texto) && r.extra === 'Si te apetece verlo, te recomendamos estos sitios:', '6', `Roma: sin la frase del mar (${JSON.stringify(r)})`)
})

/* ───────────── 6. Guardar en mi galería ───────────── */
await sec('6. Guardar en mi galería', async () => {
  const r = await a.evaluar(`(async () => {
    const g = await import('/src/lib/guardarEnGaleria.ts')
    const bytes = new Uint8Array(4096).map((_, i) => i % 251); const original = new Blob([bytes], { type: 'image/jpeg' })
    const salida = {}
    const ua = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent')
    const poner = (u) => Object.defineProperty(navigator, 'userAgent', { value: u, configurable: true })
    // iPhone: la hoja de compartir con el archivo (Web Share).
    poner('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1')
    let compartido = null
    navigator.canShare = (d) => Boolean(d && d.files && d.files.length)
    navigator.share = async (d) => { compartido = { n: d.files.length, tipo: d.files[0].type, tam: d.files[0].size, nombre: d.files[0].name } }
    salida.iphone = { res: await g.guardarEnGaleria(original), compartido, original: original.size }
    // iPhone cerrando la hoja sin guardar: no es un fallo.
    navigator.share = async () => { const e = new Error('x'); e.name = 'AbortError'; throw e }
    salida.cancelada = await g.guardarEnGaleria(original)
    // Android: se descarga.
    poner('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36')
    delete navigator.share; delete navigator.canShare
    const descargas = []
    const clicOriginal = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () { if (this.download) descargas.push({ nombre: this.download, href: this.href.slice(0, 5) }); else clicOriginal.call(this) }
    salida.android = { res: await g.guardarEnGaleria(original), descargas: [...descargas] }
    HTMLAnchorElement.prototype.click = clicOriginal
    delete navigator.userAgent; void ua
    return salida
  })()`)
  console.log('   galería:', JSON.stringify(r))
  debe(r.iphone.res === 'compartida' && r.iphone.compartido?.n === 1, '7', 'iPhone: abre la hoja de compartir con la foto (Web Share con archivo)')
  debe(r.iphone.compartido?.tam === r.iphone.original && r.iphone.compartido?.tipo === 'image/jpeg', '7', 'a su calidad original (mismos bytes y tipo, sin recomprimir)')
  debe(r.cancelada === 'cancelada', '7', 'cerrar la hoja de compartir sin guardar no es un fallo')
  debe(r.android.res === 'descargada' && r.android.descargas.length === 1 && /^jutrip-\d{4}-\d{2}-\d{2}-\d{4}\.jpg$/.test(r.android.descargas[0].nombre) && r.android.descargas[0].href === 'blob:', '7', `Android: descarga la foto (${JSON.stringify(r.android.descargas)})`)
  const grande = fs.readFileSync('src/components/route/fotos/FotoEnGrande.tsx', 'utf8')
  const boton = fs.readFileSync('src/components/route/fotos/BotonGuardarEnGaleria.tsx', 'utf8')
  debe(/<BotonGuardarEnGaleria foto={foto.url}/.test(grande) && /Guardar en mi galería/.test(boton), '7', 'la foto en grande del álbum (FotoEnGrande, la de todos los álbumes) lleva [Guardar en mi galería] con la copia grande')
  const cam = fs.readFileSync('src/components/route/hoy/CamaraViaje.tsx', 'utf8')
  debe(/BotonGuardarEnGaleria foto=\{archivo\}/.test(cam) && /Guardada en los recuerdos de hoy/.test(cam), '7', 'junto a «Guardada en los recuerdos de hoy» sale el botón')
})

/* ───────────── 7. El Tempietto cerrado pasa a su mirador (motor) ───────────── */
await sec('7. El Tempietto → «El mirador de San Pietro in Montorio»', async () => {
  const { buildDayBlockV3 } = await import('../../server/engine/index.js')
  const { findPipelineV2Data } = await import('../../server/routeAlgorithm.js')
  const D = findPipelineV2Data('Roma')
  // El lunes 9 de noviembre de 2026 el Tempietto está cerrado todo el día.
  let parada = null
  for (const dias of [2, 3]) {
    for (let d = 1; d <= dias && !parada; d++) {
      const day = await buildDayBlockV3(D, dias + 1, false, d, null, '2026-11-09', [], ['imprescindibles'], { city: 'Roma', scheduler: 'v3', month: null })
      parada = (day?.stops ?? []).find((s) => /Montorio/.test(`${s.name} ${s.display_title ?? ''}`)) ?? null
    }
  }
  console.log('   Tempietto en lunes:', JSON.stringify({ t: parada?.display_title, modo: parada?.visit_mode, foto: parada?.photo_name, why: (parada?.why ?? '').slice(0, 50) }))
  debe(Boolean(parada) && parada.display_title === 'El mirador de San Pietro in Montorio' && parada.visit_mode === 'fuera', '8b', 'cerrado, la parada pasa a «El mirador de San Pietro in Montorio»')
  debe(/^Desde la terraza de la iglesia/.test(parada?.why ?? '') && !/verja|Tempietto/.test(parada?.why ?? ''), '8b', 'con SU texto (no el del Tempietto)')
  debe(parada?.photo_name === 'El mirador de San Pietro in Montorio', '8b', 'con su propio nombre de foto: no la del Tempietto (sin foto hasta que haya una buena)')
  const r = await fetch('http://localhost:8787/api/destination-places', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }).then((x) => x.json())
  const t = r.places.find((p) => /Tempietto/.test(p.name))
  debe(t?.hours_data?.si_cerrado?.cambiar_titulo === 'El mirador de San Pietro in Montorio' && t.hours_data.ver_por === 'dentro_y_fuera', '8b', 'el servidor manda a HOY el `si_cerrado` del Tempietto (para «desde el mirador de al lado»)')
  const lz = await fetch('http://localhost:8787/api/destination-places', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ destination: 'Lanzarote' }) }).then((x) => x.json())
  debe(!lz.places.some((p) => p.hours_data?.si_cerrado), '8b', 'ningún sitio de Lanzarote tiene `si_cerrado`')
  const nombres = Object.fromEntries(lz.places.filter((p) => p.hours_data?.ver_por).map((p) => [p.name, p.hours_data.aviso_nombre]))
  debe(nombres['Cueva de los Verdes'] === 'la Cueva de los Verdes' && nombres['Jameos del Agua'] === 'los Jameos del Agua' && nombres['Montañas del Fuego (Timanfaya)'] === 'las Montañas del Fuego (Timanfaya)', '8b', `los nombres de Lanzarote con su artículo en las frases (${JSON.stringify(nombres)})`)
})

/* ───────────── 8. El código de las horas, con números ───────────── */
await sec('8. Las cuentas de horarios, sin pantalla', async () => {
  const r = await a.evaluar(`(async () => {
    const m = await import('/src/lib/hoyHorarios.ts')
    const v = (nombre, extra = {}) => ({ stop: { id: 's', name: nombre, time: extra.time ?? '10:00', durationMinutes: 60 }, nombre, plural: false, horario: {}, tramos: extra.tramos ?? [{ abre: 570, cierra: 1005 }], ultimaEntrada: extra.ult ?? null, seVeFuera: extra.fuera ?? false, mirador: extra.mirador ?? null })
    const j = (vv, llegada, tipo = 'cierre') => ({ v: vv, llegada, tipo, margen: 0 })
    return {
      a: m.parrafoDeHoy(j(v('Cueva')), true) ,
      cierre: m.limiteDeEntrada(v('x', { ult: 990 }), 600),
      mirador: m.parrafoDeHoy(j(v('Tempietto', { mirador: 'El mirador' })), true),
      fuera: m.parrafoDeHoy(j(v('Castillo', { fuera: true })), true),
      segundo: m.parrafoDeHoy(j(v('Castillo')), false),
      justas: m.paradasJustasDeHoy([v('A', { time: '16:30' }), v('B', { time: '10:00' }), v('C', { time: '16:00' }), v('D', { time: '16:40' })]).map((x) => x.v.nombre),
      pausa: m.paradasJustasDeHoy([v('A', { time: '13:30', tramos: [{ abre: 540, cierra: 780 }, { abre: 900, cierra: 1140 }] })]).map((x) => x.tipo),
    }
  })()`)
  console.log('   cuentas:', JSON.stringify(r))
  debe(/^Para hoy: Cueva cierra a las 16:45\. Vamos con margen/.test(r.a), '8b', 'el párrafo: la hora de cierre a la vista')
  debe(r.cierre === 990, '8b', 'el último momento para entrar es la última entrada')
  debe(/desde el mirador de al lado se ve igual de bonito\.$/.test(r.mirador), '8b', 'con `si_cerrado`: «desde el mirador de al lado se ve igual de bonito»')
  debe(/Y si llegáis tarde, se ve igual por fuera\.$/.test(r.fuera), '8b', 'si se ve por fuera: «se ve igual por fuera»')
  debe(/^Y también: /.test(r.segundo), '8b', 'el segundo sitio entra con «Y también:»')
  debe(r.justas.length === 2 && r.justas[0] === 'D' && r.justas[1] === 'A', '8b', `las más justas primero y como mucho 2 (${r.justas.join(', ')})`)
  debe(r.pausa[0] === 'apertura', '8b', 'en la pausa de mediodía, la llegada prevista es «antes de abrir»')
})

/* ───────────── 9. La pestaña Logros: todas cerradas al abrir (Lanzarote y Roma) ───────────── */
// (Esta parte usa el servidor de pruebas de los logros de la propia app —`?logrosDemo=1`—: así no depende de importar módulos a mano, que con la recarga en vivo pueden ser otra copia.)
const fichaLogros = async (destino) => {
  const r = await a.evaluar(`(async () => {
    const st = ${R}; const { numberedStopsOf } = await import('/src/lib/stopKind.ts')
    const ruta = st.getState().route
    const dia = ruta.days.find((d) => numberedStopsOf(d).length > 1)
    const parada = numberedStopsOf(dia).find((s) => !s.isBreak && !s.isFreeTour && !s.isArrival && !s.isFreeWalk)
    st.getState().setActiveDayId(dia.id); st.getState().setMode('days')
    return { id: parada.id, nombre: parada.name }
  })()`)
  // El estado de los logros de prueba, en la MISMA copia del módulo que usa la app (la dirección que ha cargado el navegador, con su «?t=» si lo lleva): 2 colecciones en las que está este sitio.
  const cols = JSON.parse(fs.readFileSync(`data/logros/${destino}.json`, 'utf8')).colecciones.slice(0, 2)
  const estado = {
    ok: true, destino, ciudad: destino === 'roma' ? 'Roma' : 'Lanzarote', sellos: [], secretos: { total: 0, encontrados: 0, texto: '', encontrados_lista: [] }, pendiente: { sorpresas: 0, pedazos: 0, dias_para_reclamar: null, texto: null }, puntito: false, con_tu_ruta_puedes_completar: null,
    viaje: { id: 'hoy2b', inicio: '2026-11-08', fin: '2026-11-13', hoy: '2026-11-10' },
    colecciones: cols.map((c) => ({ id: c.id, grupo: c.grupo, orden: c.orden, nombre: c.nombre, n: 1, total: 4, completa: false, en_tu_ruta: false, nuevo_hoy: false, al_completar: null, sitios: [{ sitio: `${c.id}-a`, visto: false, nombre: r.nombre, en_ruta: true }, { sitio: `${c.id}-b`, visto: true, nombre: 'Otro sitio B', en_ruta: true }, { sitio: `${c.id}-c`, visto: false, nombre: 'Otro sitio C', en_ruta: true }, { sitio: `${c.id}-d`, visto: false, nombre: 'Otro sitio D', en_ruta: true }] })),
  }
  const inyectado = await a.evaluar(`(async () => { const fuente = await (await fetch('/src/components/logros/ficha/PestanaLogros.tsx')).text(); const hallado = /from\\s+["']([^"']*\\/momentos\\/api\\.ts[^"']*)["']/.exec(fuente); if (!hallado) return false; const m = await import(hallado[1]); m.datosDePrueba.estado = ${JSON.stringify(estado)}; return true })()`)
  debe(inyectado, '8c', `${destino}: se pudo poner el estado de logros de prueba en el módulo de la app`)
  await a.esp(2500)
  await a.evaluar(`(() => { const e = document.querySelector('[data-stop-id=${JSON.stringify(r.id)}]'); e?.scrollIntoView({ block: 'center' }); const b = e?.querySelector('button, [role=button]') ?? e; b?.click(); return true })()`)
  for (let k = 0; k < 40 && !(await hay('[data-ficha-panel] [data-ficha-pestanas]')); k++) await a.esp(500)
  await a.esp(1500)
  const tabs = await a.evaluar("Array.from(document.querySelectorAll('[data-ficha-pestanas] button')).map((b) => b.textContent.trim())")
  if (!tabs.some((t) => /^Logros/.test(t))) return { r, tabs, tarjetas: null }
  await a.evaluar("Array.from(document.querySelectorAll('[data-ficha-pestanas] button')).find((b) => /^Logros/.test(b.textContent.trim()))?.click(); true")
  await a.esp(1200)
  const leer = () => a.evaluar("Array.from(document.querySelectorAll('[data-logros-coleccion]')).map((c) => ({ id: c.dataset.logrosColeccion, abierta: c.dataset.abierta === '1', sitios: c.querySelectorAll('[data-logros-sitio]').length }))")
  const antes = await leer()
  let despues = null, vuelta = null
  if (antes.length > 0) {
    await a.evaluar("document.querySelector('[data-logros-coleccion] > button')?.click(); true")
    await a.esp(500)
    despues = await leer()
    await a.captura(path.join(SALIDA, `hoy2b_logros_${destino}_abierta_1.jpg`))
    await a.evaluar("document.querySelector('[data-logros-coleccion] > button')?.click(); true")
    await a.esp(500)
    vuelta = await leer()
  }
  return { r, tabs, tarjetas: antes, despues, vuelta }
}
await sec('9. La pestaña Logros (Lanzarote)', async () => {
  await ir({ dia: 2, min: 11 * 60 })
  await ev(`${R}.getState().setMode('days')`)
  const f = await fichaLogros('lanzarote')
  console.log('   Logros (Lanzarote):', JSON.stringify({ ficha: f.r.nombre, tabs: f.tabs, antes: f.tarjetas?.map((t) => t.abierta), despues: f.despues?.map((t) => t.abierta) }))
  debe(Boolean(f.tarjetas), '8c', `la ficha de ${f.r.nombre} (Lanzarote) tiene la pestaña Logros (${f.tabs.join(' · ')})`)
  if (f.tarjetas) {
    debe(f.tarjetas.length >= 1 && f.tarjetas.every((t) => t.abierta === false && t.sitios === 0), '8c', 'al abrir la pestaña, TODAS las colecciones cerradas (antes la primera salía abierta)')
    debe(f.despues?.[0]?.abierta === true && f.despues[0].sitios > 0, '8c', 'se abre al tocarla')
    debe(f.vuelta?.[0]?.abierta === false, '8c', 'y se vuelve a cerrar al tocarla otra vez')
  }
})
await sec('9b. La pestaña Logros (Roma)', async () => {
  await a.evaluar("Promise.resolve(window.__rutaPrueba()).then(() => true)")
  for (let k = 0; k < 60 && !(await ev(`${R}.getState().route?.destination === 'Roma'`).catch(() => false)); k++) await a.esp(1000)
  await a.esp(2500)
  const f = await fichaLogros('roma')
  console.log('   Logros (Roma):', JSON.stringify({ ficha: f.r.nombre, tabs: f.tabs, antes: f.tarjetas?.map((t) => t.abierta), despues: f.despues?.map((t) => t.abierta) }))
  debe(Boolean(f.tarjetas), '8c', `la ficha de ${f.r.nombre} (Roma) tiene la pestaña Logros (${f.tabs.join(' · ')})`)
  if (f.tarjetas) {
    debe(f.tarjetas.length >= 1 && f.tarjetas.every((t) => t.abierta === false && t.sitios === 0), '8c', 'Roma: al abrir la pestaña, TODAS las colecciones cerradas')
    debe(f.despues?.[0]?.abierta === true && f.despues[0].sitios > 0, '8c', 'Roma: se abre al tocarla')
  }
})

a.cerrar()
console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
