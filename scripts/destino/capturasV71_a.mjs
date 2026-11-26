// V71 (apartados 1 y 2): SOLO capturas (no es una prueba) en modo iPhone (390x844) de la secuencia de Eric en el viaje de prueba de Lanzarote (y en Roma). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV71_a.mjs <caso> [antes|despues]
// Casos de Lanzarote (la API con DESTINOS_OCULTOS='-'; el servidor de logros es el de mentira de desarrollo, con La Geria, El Golfo, Jameos y Timanfaya añadidos):
//   geria      La Geria: [Ya he llegado] → hoja del emblema; [He terminado] → NO vuelve a salir.
//   golfo      El Golfo (última parada del día): [Ya he llegado], la foto, [He terminado]: ni segunda hoja ni nada raro.
//   timanfaya  Timanfaya: el sonido de lo ganado suena CON su pantalla (no cuando contesta el servidor).
//   jameos     Jameos del Agua (primera parada del día, el emblema aún no se tiene): ¿sale la hoja al llegar?
// Casos de Roma:
//   roma         la Basílica de San Pedro como PRIMERA parada del día.
//   roma_ultima  la Basílica de San Pedro como ÚLTIMA parada, con foto y con la cuenta (para que salga el resumen del día): la foto, las pantallas de lo ganado y el resumen al final.
// Guarda docs/dias/V71_capturas/<caso>_<n>_<antes|despues>_<etiqueta>.jpg y escribe una LÍNEA DE TIEMPO (qué hay en pantalla, qué hay en la fila y cuándo suena cada sonido).
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V71_capturas')
fs.mkdirSync(CAP, { recursive: true })
const CASO = process.argv[2] ?? 'geria'
const ETQ = process.argv[3] ?? 'despues'
const roma = CASO.startsWith('roma')
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=pago'
// El día y la parada se buscan por NOMBRE (la ruta de Lanzarote no sale idéntica cada vez).
const OBJETIVO = { geria: 'Geria', golfo: 'Golfo', directo: 'Golfo', timanfaya: 'Timanfaya', jameos: 'Jameos', roma: 'Museos Vaticanos', roma_ultima: 'Basílica de San Pedro' }[CASO]
const SITIO = { geria: ['la_geria_y_sus_bodegas', 'La Geria'], golfo: ['el_golfo_y_el_charco_de_los_clicos', 'El Golfo'], jameos: ['jameos_del_agua', 'Jameos del Agua'], roma: ['museos_vaticanos_y_capilla_sixtina', 'Museos Vaticanos'], roma_ultima: ['basilica_de_san_pedro', 'Basílica de San Pedro'] }[CASO] ?? [null, null]
const ULTIMA = CASO === 'golfo' || CASO === 'roma_ultima'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
let n = 0
const sacar = async (etiqueta) => {
  await a.esp(900)
  n += 1
  const f = `${CASO}_${String(n).padStart(2, '0')}_${ETQ}_${etiqueta}.jpg`
  await a.captura(path.join(CAP, f))
  console.log('captura', f)
}
const clic = (re) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button, label')).find((x) => ${re}.test((x.textContent || '').trim()) && x.offsetParent !== null); if (!b) return false; b.click(); return true })()`)
const esperarClic = async (re, veces = 40) => {
  for (let i = 0; i < veces; i++) {
    if (await clic(re)) return true
    await a.esp(500)
  }
  return false
}
const hay = (js) => a.evaluar(js).catch(() => false)
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${roma ? '__rutaPrueba' : '__rutaLanzarote'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(roma ? 'window.__rutaPrueba().then(() => true)' : "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }).then(() => true)")
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    if (!(await clic(/^(Siguiente|Entendido|Vale|Cerrar)$/))) break
    await a.esp(600)
  }
  const hora = ULTIMA || CASO === 'directo' ? 16 * 60 : roma ? 8 * 60 + 30 : 10 * 60 + 30
  // Las paradas que se dan por hechas al montar el día son un [Visto] más para la app: con el servidor «sin cobertura» no abren ninguna hoja ni dan nada (se vuelve a encender antes de la prueba).
  await a.evaluar('window.__demo?.sinCobertura(true); true')
  await a.evaluar(`(async () => {
    const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
    r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada; delete s.isSunset }) })
    const dia = r.days.find((d) => d.stops.some((s) => /${OBJETIVO}/.test(s.name)))
    const iso = (n) => { const d = new Date(r.answers.dateRange.start + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n - 1); return d.toISOString().slice(0, 10) }
    window.__isoDeHoy = iso(dia.dayNumber)
    ${CASO === 'roma_ultima' ? `const k = dia.stops.findIndex((s) => /Basílica de San Pedro/.test(s.name)); const [pedro] = dia.stops.splice(k, 1); dia.stops.push(pedro);` : ''}
    window.__emblemaDemo = {}
    for (const s of dia.stops) for (const [re, id] of [[/Geria/, 'la_geria_y_sus_bodegas'], [/Golfo/, 'el_golfo_y_el_charco_de_los_clicos'], [/Jameos/, 'jameos_del_agua'], [/Basílica de San Pedro/, 'basilica_de_san_pedro'], [/Museos Vaticanos/, 'museos_vaticanos_y_capilla_sixtina']]) if (re.test(s.name)) window.__emblemaDemo[s.name] = { sitio: id, nombre: s.name, en_sitio: 'en ' + s.name, a_sitio: 'a ' + s.name, metros: 0, radio_m: 150, al_borde_m: 0, dentro: true, en_ruta_hoy: true, hay_emblema: true, emblema_nombre: 'Oculto', hay_pedazo: false, coleccion_nombre: null }
    dia.stops.slice(0, dia.stops.findIndex((s) => /${OBJETIVO}/.test(s.name))).forEach((s) => { s.checkedInAt = new Date().toISOString() })
    st.setState({ route: r, screen: 'route' })
    try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('trazo:hoy2:') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy1:juego:') || k.startsWith('trazo:hoy2b:') || k.startsWith('trazo:logros:con-foto') || k.startsWith('trazo:logros:pendientes') || k.startsWith('trazo:logros:resumendia:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1'); localStorage.setItem('trazo:logros:primerdia', 'si') } catch {}
    window.__horaFalsa = ${hora}; window.__pos = null; window.__perm = 'denied'
    st.getState().setDevSimulatedTodayIso(window.__isoDeHoy); st.getState().setActiveDayId(null); st.getState().setMode('explore')
    return true })()`)
  await a.esp(700)
  await ev(`${R}.getState().setMode('today')`)
  await a.esp(3500)
  for (let i = 0; i < 3; i++) {
    if (!(await clic(/^Continuar$/))) break
    await a.esp(700)
  }
  await a.esp(7500)
  await a.evaluar('window.__demo?.sinCobertura(false); document.querySelectorAll("[data-visto=capa] button[aria-label=Cerrar]").forEach((b) => b.click()); true')
  // Con cuenta (la del servidor de mentira) el resumen del día puede salir: se pone un viaje activo (como hace pruebaV3), DESPUÉS de montar el día. (En Lanzarote poner un viaje activo cambia la ruta: ahí no hay resumen.)
  await a.esp(1200)
  console.log('RUTA', await ev(`JSON.stringify({ sim: ${R}.getState().dev_simulated_today_iso, hechas: ${R}.getState().route.days.map((d) => d.dayNumber + ':' + d.stops.map((x) => (x.checkedInAt ? 'V' : '-')).join('')) })`))
  // La línea de tiempo: cada 120 ms mira qué hay en pantalla y anota los cambios; y cada sonido que arranca.
  await a.evaluar(`(async () => {
    const UI = (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI; const LG = (await import('/src/store/useLogrosStore.ts')).useLogrosStore; const VS = (await import('/src/components/logros/visto/vistoStore.ts')).useVistoStore; const RS = (await import('/src/store/useRouteStore.ts')).useRouteStore
    window.__linea = []; const t0 = performance.now()
    const marca = () => { const t = document.body.innerText || ''; return [/Lo que te llevas de hoy/.test(t) && 'RESUMEN', document.querySelector('[data-juego=llegada]') && 'HOJA_EMBLEMA', document.querySelector('[data-visto=hoja-oculto]') && 'HOJA_VIEJA_OCULTO', document.querySelector('[data-visto=hoja-recuerdo]') && 'HOJA_RECUERDO', document.querySelector('[data-visto=hoja-ganado]') && 'HOJA_GANADO', /¡Eh! Aquí hay/.test(t) && 'ALGO_AQUI', !document.querySelector('[data-juego=llegada]') && /^Seguir$/m.test(t) && 'LOGRO(Seguir)', document.querySelector('[data-juego=brilla],[data-juego=mas_cerca]') && 'BRILLA'].filter(Boolean).join('+') + ' [fila=' + UI.getState().fila.mostrando + ' espera=' + UI.getState().fila.esperan.join('/') + ' momentos=' + LG.getState().momentos.length + ' ocupado=' + VS.getState().ocupado + ' V=' + RS.getState().route.days.flatMap((d) => d.stops).filter((x) => x.checkedInAt).length + ']' }
    let ultimo = ''
    setInterval(() => { const m = marca(); if (m !== ultimo) { ultimo = m; window.__linea.push(Math.round(performance.now() - t0) + 'ms ' + m) } }, 120)
    const orig = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...x) { window.__linea.push(Math.round(performance.now() - t0) + 'ms SONIDO (en pantalla: ' + marca() + ')'); return orig.apply(this, x) }
    return true })()`)
  await sacar('hoy')

  if (CASO === 'geria' || CASO === 'jameos' || CASO === 'roma') {
    console.log('Ya he llegado:', await esperarClic(/Ya he llegado/))
    for (let i = 0; i < 40 && !(await hay("Boolean(document.querySelector('[data-juego=llegada]'))")); i++) await a.esp(500)
    console.log('hoja de llegada al llegar:', await hay("Boolean(document.querySelector('[data-juego=llegada]'))"))
    await sacar('ya_he_llegado')
    await a.evaluar("document.querySelector('[data-juego-boton=cerrar]')?.click(); true")
    await a.esp(800)
    console.log('He terminado:', await esperarClic(/He terminado/))
    await a.esp(7000)
    await sacar('he_terminado')
    console.log('hoja vieja:', await hay("Boolean(document.querySelector('[data-visto=hoja-oculto]'))"), '| hoja nueva otra vez:', await hay("Boolean(document.querySelector('[data-juego=llegada]'))"))
  }
  if (ULTIMA) {
    console.log('Ya he llegado:', await esperarClic(/Ya he llegado/))
    for (let i = 0; i < 40 && !(await hay("Boolean(document.querySelector('[data-juego=llegada]'))")); i++) await a.esp(500)
    console.log('hoja de llegada al llegar:', await hay("Boolean(document.querySelector('[data-juego=llegada]'))"))
    await sacar('ya_he_llegado')
    // La foto: la misma ruta que [Elegir de la galería] (la cámara de viaje con una foto ya elegida), con la parada.
    await a.evaluar(`(async () => {
      const c = await import('/src/lib/camaraViaje.ts')
      const rt = ${R}.getState().route; const dia = rt.days.find((d) => d.stops.some((x) => /${OBJETIVO}/.test(x.name))); const s = dia.stops.find((x) => /${OBJETIVO}/.test(x.name))
      const f = new File([new Blob(['x'])], 'foto.jpg', { type: 'image/jpeg', lastModified: Date.now() })
      document.querySelector('[data-juego-boton=cerrar]')?.click()
      c.useCamaraViajeStore.getState().abrir({ sitio: '${SITIO[0]}', nombre: '${SITIO[1]}', oculto: true, stopId: s.id, archivo: f })
      return true })()`)
    await a.esp(2500)
    await sacar('foto_hecha')
    await esperarClic(/Descubrirlo/, 12)
    // La animación del emblema es larga (más con el Chrome sin tarjeta gráfica): se espera al [Seguir] de verdad.
    await a.esp(2500)
    await sacar('emblema_ganado_animacion')
    console.log('Seguir del emblema:', await esperarClic(/^Seguir$/, 150))
    await a.esp(2500)
    await sacar('despues_del_emblema')
    // Se pasan las pantallas que quedan de la foto (emblema, EXP) hasta que se ve la parada; entonces [He terminado].
    let termino = false
    for (let i = 0; i < 120 && !termino; i++) {
      if (await hay("Array.from(document.querySelectorAll('button')).some((b) => /He terminado/.test(b.textContent || ''))")) {
        // Con cuenta (la del servidor de mentira) el resumen del día puede salir: un viaje activo justo antes de [He terminado] (más tarde la app recarga la ruta y se pierde lo montado).
        termino = await a.evaluar("import('/src/store/useSyncStore.ts').then((m) => { m.useSyncStore.setState({ activeTripId: 'demo-v71' }); const b = Array.from(document.querySelectorAll('button')).find((x) => /He terminado/.test(x.textContent || '')); if (!b) return false; b.click(); return true })")
      }
      if (!termino) { await clic(/^Seguir$/); await a.esp(1000) }
    }
    console.log('He terminado:', termino)
    await a.esp(1500)
    await sacar('he_terminado_a_los_2s')
    // Lo que sale después, una pantalla cada vez: se captura cada una y se pulsa [Seguir] (o la X del resumen) hasta que no queda nada.
    let vacias = 0
    for (let i = 0; i < 150 && vacias < 12; i++) {
      const hayBoton = await clic(/^(Seguir|Cerrar|Listo)$/)
      if (hayBoton) { vacias = 0; await a.esp(2500); await sacar('paso_' + i) } else { vacias += 1; await a.esp(1000) }
    }
  }
  if (CASO === 'directo') {
    // [He terminado] SIN [Ya he llegado] en la última parada del día (con cuenta): sale la hoja del emblema UNA vez y el resumen del día espera a que se cierre.
    console.log('He terminado (el mismo gesto que el botón: marcar la parada como vista):', await a.evaluar("import('/src/store/useSyncStore.ts').then(async (m) => { m.useSyncStore.setState({ activeTripId: 'demo-v71' }); const st = (await import('/src/store/useRouteStore.ts')).useRouteStore; const rt = st.getState().route; const d = rt.days.find((x) => x.stops.some((y) => /Golfo/.test(y.name))); const p = d.stops.find((y) => /Golfo/.test(y.name)); st.getState().setStopVisto(d.id, p.id, true); return true })"))
    for (let i = 0; i < 40 && !(await hay("Boolean(document.querySelector('[data-juego=llegada],[data-visto=hoja-oculto]'))")); i++) await a.esp(500)
    await a.esp(2500)
    await sacar('hoja_del_emblema')
    console.log('hoja abierta; resumen a la vez:', await hay("/Lo que te llevas de hoy/.test(document.body.innerText)"))
    await a.evaluar("(document.querySelector('[data-juego-boton=cerrar]') ?? document.querySelector('[data-visto=capa] button[aria-label=Cerrar]'))?.click(); true")
    await a.esp(9000)
    await sacar('tras_cerrar_la_hoja')
  }
  if (CASO === 'timanfaya') {
    await esperarClic(/Ya he llegado/)
    await a.esp(1200)
    console.log('He terminado:', await esperarClic(/He terminado/))
    await a.esp(7500)
    await sacar('tras_he_terminado_hoja_abierta')
    // Se cierra la hoja de «Guarda un recuerdo»: ahora sí salen las pantallas de logros, una a una.
    await a.evaluar('document.querySelector("[data-visto=capa] button[aria-label=Cerrar]")?.click(); true')
    await a.esp(9000)
    await sacar('logros_tras_cerrar_la_hoja')
    for (let i = 0; i < 10; i++) {
      if (!(await clic(/^(Seguir|Cerrar|Listo|Entendido)$/))) {
        await a.esp(1500)
        if (!(await clic(/^(Seguir|Cerrar|Listo|Entendido)$/))) break
      }
      await a.esp(1800)
      await sacar(`paso_${i}`)
    }
  }
  await a.esp(1000)
  console.log('LINEA_DE_TIEMPO\n' + (await a.evaluar('window.__linea.join("\\n")')))
} finally {
  a.cerrar()
}
