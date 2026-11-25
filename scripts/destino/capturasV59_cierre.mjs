// V59 (partes 1 y 2): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV59_cierre.mjs roma|lanza|design [caso]
// Guarda docs/dias/V59_capturas/<id>_app.jpg (la app) y <id>_design.jpg (su dibujo de Design) y escribe docs/dias/V59_log_<modo>.json con el texto de cada pantalla.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'
import { capturarDesign } from './capturaDesign.mjs'

const CAP = path.resolve('docs/dias/V59_capturas')
fs.mkdirSync(CAP, { recursive: true })
const MODO = process.argv[2] ?? 'roma'
const SOLO = process.argv[3] ?? null

if (MODO === 'design') {
  // Cada tablero de «Cierre del dia.dc.html» se deja solo, a 390 de ancho, arriba a la izquierda.
  for (const id of ['H1', 'H2', 'H3', 'H4', 'H5', 'R1', 'R1b', 'R2', 'L1', 'L2']) {
    if (SOLO && SOLO !== id) continue
    const js = `(() => {
      const tabl = [...document.querySelectorAll('div')].filter((d) => d.style && d.style.width === '390px' && d.firstElementChild && /^${id} · /.test((d.firstElementChild.textContent || '').trim()))[0]
      if (!tabl) return 'sin tablero'
      const grid = tabl.parentElement
      ;[...grid.children].forEach((c) => { if (c !== tabl) c.style.display = 'none' })
      grid.style.gridTemplateColumns = '390px'
      let p = grid.parentElement; p.style.padding = '0'; p.style.minHeight = '0'
      ;[...p.children].forEach((c) => { if (c !== grid) c.style.display = 'none' })
      tabl.style.padding = '8px'
      document.documentElement.style.background = '#E7DCC6'
      window.scrollTo(0, 0)
      return 'ok'
    })()`
    await capturarDesign('Cierre del dia.dc.html', path.join(CAP, `${id}_design.jpg`), { despues: js, ancho: 390, alto: 900 })
    console.log('design', id)
  }
  process.exit(0)
}

const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
// Las hojas de cierre (H1 a H5) se capturan con los logros apagados (si no, al marcar paradas desde fuera sale «Guarda un recuerdo»); el resumen (R1, R2), con los logros de ejemplo.
const conLogros = /^L?R/.test(SOLO ?? '')
const RUTA = `/?cuentas=off&logros=${conLogros ? 'on&logrosDemo=1' : 'off'}&apertura=0&hoy2=on&version=pago`
const lanza = MODO === 'lanza'
const IDA = lanza ? '2026-11-08' : '2026-10-17'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, antes: ANTES, ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
const dia = (n) => {
  const d = new Date(IDA + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n - 1)
  return d.toISOString().slice(0, 10)
}
try {
  for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
  await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.evaluar(`(async () => { window.__base = JSON.stringify(${R}.getState().route); return true })()`)
  console.log('viaje', await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ n: d.dayNumber, ret: !!d.isReturnLeg, tipo: d.dayType ?? null, stops: d.stops.filter((s) => !s.isArrival).map((s) => (s.time || '?') + ' ' + s.name.slice(0, 18)) })))`))

  /** Pone el viaje base, marca como vistas las `hechas` primeras paradas del día `marcar` y pone el día simulado y la hora. */
  const montar = async ({ iso, min, marcar = null, hechas = 0, setup = '', noche = false }) => {
    await a.evaluar(`(async () => {
      const st = ${R}
      try { (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI.getState().cerrarResumenDia(); sessionStorage.clear() } catch {}
      st.getState().setDevSimulatedTodayIso('${iso}')
      const r = JSON.parse(window.__base)
      ${marcar ? `{ const d = r.days.find((x) => x.dayNumber === ${marcar}); let n = 0; for (const s of d.stops) { if (n >= ${hechas}) break; if (s.isArrival || s.isBreak || s.isZoneWalk || s.isFreeWalk || s.isFreeTime || s.passThrough || s.isNightExperience || s.isNightView) continue; s.checkedInAt = '${iso}T09:30:00.000Z'; n++ } ${noche ? "for (const s of d.stops) if (s.isNightExperience || s.isNightView) s.checkedInAt = '" + iso + "T21:30:00.000Z'" : ''} }` : ''}
      st.setState({ route: r, reservations: [], screen: 'route' })
      window.__pruebaDelPase = undefined
      ${setup}
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:') || k.startsWith('trazo:hoy2') || k.startsWith('trazo:logros:resumendia')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await a.esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(2500)
    // Al marcar paradas desde fuera, la app abre «Guarda un recuerdo» y sus sorpresas (los logros de ejemplo): se cierran para ver solo la hoja que se quiere capturar.
    let libres = 0
    for (let i = 0; i < 16 && libres < 3; i++) {
      const hay = await a.evaluar(`(async () => {
        const lg = (await import('/src/store/useLogrosStore.ts')).useLogrosStore; lg.setState({ momentos: [], exp: null })
        const ui = (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI; ui.setState({ ronda: null, rondaExp: null, fila: { mostrando: null, esperan: [] } })
        const d = [...document.querySelectorAll('[data-visto=capa]')][0]
        const c = d && d.querySelector('[aria-label=Cerrar]'); if (c) c.click()
        return Boolean(d) })()`)
      libres = hay ? 0 : libres + 1
      await a.esp(900)
    }
    await a.esp(1500)
    for (let i = 0; i < 3; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(700)
    }
  }
  const sacar = async (id, sel = null) => {
    await a.esp(1500)
    await a.captura(path.join(CAP, `${id}_app.jpg`))
    log[id] = await a.evaluar(`(document.querySelector('${sel ?? '[role=dialog]'}') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, 1400)`)
    console.log('captura', id, '|', String(log[id]).slice(0, 300))
  }
  const clic = (texto) => a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim().startsWith(${JSON.stringify(texto)})); if (!b) return false; b.click(); return true })()`)
  const pre = lanza ? 'L' : ''
  // Para que se vea a qué días se pasan los sitios, el día 3 del viaje de ejemplo se deja con pocas paradas (las capturas solo; el viaje de verdad no se toca).
  const HUECO = "const rr = JSON.parse(JSON.stringify(st.getState().route)); const d3 = rr.days.find((x) => x.dayNumber === 3); if (d3) d3.stops = d3.stops.slice(0, 3); st.setState({ route: rr })"
  const D2 = dia(2)
  const D3 = dia(3)

  if (!SOLO || SOLO === 'H1') {
    await montar({ iso: D2, min: 14 * 60 + 30, setup: HUECO })
    await sacar(`${pre}H1`)
  }
  if (!SOLO || SOLO === 'H2') {
    await montar({ iso: D2, min: 22 * 60 + 15, marcar: 2, hechas: 2, setup: HUECO, noche: true })
    await sacar(`${pre}H2`)
    // R1 tras cerrar la hoja con [Dejarlo como está]
    if (SOLO === 'H2') {
      console.log('dejar', await clic('Dejarlo como está'))
      await a.esp(2500)
      await sacar(`${pre}H2_despues`)
    }
  }
  if (!SOLO || SOLO === 'H3') {
    await montar({ iso: D3, min: 9 * 60, marcar: 2, hechas: 2, setup: HUECO })
    await sacar(`${pre}H3`)
  }
  // H4 y H5: [Cambiar plan] › [Voy con retraso] con la primera parada ya hecha; H4 con poco retraso y H5 con mucho.
  const retraso = async (id, min, hechas = 1, n = 2, setup = '') => {
    await montar({ iso: dia(n), min, marcar: n, hechas, setup })
    console.log('cambiar plan', await clic('Cambiar plan'))
    await a.esp(1200)
    console.log('voy con retraso', await a.evaluar("(() => { const b = document.querySelector('[data-cambiar-opcion=retraso]'); if (!b) return false; b.click(); return true })()"))
    await sacar(id, '[data-hoja-cierre]')
  }
  if (!SOLO || SOLO === 'H4') await retraso(`${pre}H4`, Number(process.env.MIN4 ?? 9 * 60 + 40))
  if (!SOLO || SOLO === 'H5') await retraso(`${pre}H5`, Number(process.env.MIN5 ?? 10 * 60 + 10), Number(process.env.HECHAS5 ?? 2), Number(process.env.DIA5 ?? 2), "{ " + HUECO + " } { const rr = JSON.parse(JSON.stringify(st.getState().route)); const b = rr.days.find((x) => x.dayNumber === 2).stops.find((x) => /Borghese/.test(x.name)); b.time = '10:40'; b.reservationTime = '10:40'; b.reservedId = 'r-borghese'; st.setState({ route: rr }) }")

  // El resumen del día con muchas cosas (R1) y a la mañana siguiente (R2): datos de ejemplo del servidor (solo en desarrollo) y fotos de ejemplo.
  const LISTA = lanza
    ? [['sello', 'lanzarote:bronce'], ['pedazo', 'lz_imprescindibles:montanas_del_fuego'], ['pedazo', 'cesar_manrique:jameos_del_agua'], ['emblema', 'timanfaya'], ['viajero:con_quien_amigos', '1', '*']]
    : [['sello', 'roma:oro'], ['pedazo', 'imprescindibles:coliseo'], ['pedazo', 'cuatro_joyas:panteon'], ['pedazo', 'roma_antigua:foro_romano_y_palatino'], ['emblema', 'coliseo'], ['emblema', 'fontana_de_trevi'], ['pais', 'Italia', '*'], ['destino_nuevo', 'roma', '*'], ['maravilla', 'coliseo', '*'], ['patrimonio', 'centro_historico_de_roma'], ['viajero:con_quien_amigos', '1', '*'], ['viajero:patrimonios', '1', '*']]
  const CATS = {}
  for (const [l] of LISTA) CATS[l.startsWith('viajero:') ? 'viajero' : l] = (CATS[l.startsWith('viajero:') ? 'viajero' : l] ?? 0) + 1
  const COLS = lanza
    ? [['lz_imprescindibles', 'Los imprescindibles de Lanzarote', ['montanas_del_fuego', 'jameos_del_agua', 'cueva_de_los_verdes', 'mirador_del_rio'], 1], ['cesar_manrique', 'César Manrique', ['jameos_del_agua', 'mirador_del_rio', 'jardin_de_cactus'], 1]]
    : [['imprescindibles', 'Los imprescindibles', ['coliseo', 'foro_romano_y_palatino', 'fontana_de_trevi', 'panteon', 'piazza_navona', 'plaza_de_espana', 'castillo_de_santangelo', 'trastevere'], 5], ['cuatro_joyas', 'Las 4 joyas', ['coliseo', 'fontana_de_trevi', 'panteon', 'museos_vaticanos'], 3], ['roma_antigua', 'La Roma antigua', ['coliseo', 'foro_romano_y_palatino', 'largo_di_torre_argentina', 'castillo_de_santangelo', 'circo_maximo', 'termas_de_caracalla'], 2]]
  const resumenDe = async (id, manana) => {
    await montar({ iso: manana ? D3 : D2, min: manana ? 9 * 60 : 22 * 60 + 30 })
    await a.evaluar(`(async () => {
      const api = await import('/src/components/logros/momentos/api.ts')
      const en = '2026-10-14T09:12:00.000Z'
      const g = (logro, escalon, destino = 'roma') => ({ clave: destino + '|' + logro + '|' + escalon, logro, escalon, destino, en })
      const ciudad = ${lanza ? "'Lanzarote'" : "'Roma'"}
      const dest = ${lanza ? "'lanzarote'" : "'roma'"}
      const lista = ${JSON.stringify(LISTA)}
      const cols = ${JSON.stringify(COLS)}
      api.datosDePrueba.estado = { ok: true, destino: dest, ciudad, sellos: [{ id: dest, nombre: ciudad, grado: ${lanza ? "'bronce'" : "'oro'"}, nombre_grado: 'x', linea: null, n: 6, total: 8, siguiente: null, alcanzados: [] }],
        colecciones: cols.map(([id, nombre, sitios, n]) => ({ id, nombre, n, total: sitios.length, completa: false, en_tu_ruta: true, nuevo_hoy: true, sitios: sitios.map((x, i) => ({ sitio: x, visto: i < n })) })),
        secretos: { total: ${lanza ? 11 : 14}, encontrados: ${lanza ? 3 : 5}, texto: '', encontrados_lista: [] }, pendiente: { sorpresas: 0, pedazos: 0, dias_para_reclamar: null, texto: null }, puntito: false, viaje: { id: 'demo', inicio: '${IDA}', fin: ${lanza ? "'2026-11-13'" : "'2026-10-20'"}, hoy: '${manana ? D3 : D2}' } }
      api.datosDePrueba.resumen = { ok: true, ganado: lista.map(([l, e, d]) => ({ ...g(l, e, d ?? dest), ...(l === 'patrimonio' ? { nombre: 'Centro histórico de Roma' } : {}), ...(l === 'maravilla' ? { nombre: 'Coliseo' } : {}) })), por_categoria: ${JSON.stringify(CATS)}, pendiente: { sorpresas: 0, pedazos: 0, dias_para_reclamar: null, texto: null }, texto_viaje: '', texto_viaje_tipo: 'con_ganas' }
      api.datosDePruebaViajero.v = { ok: true, logros: [{ id: 'con_quien_amigos', grupo: 'como_viajas', nombre: null, linea: null, escalones: [{ n: 1, nombre: 'La pandilla viaja', ganado: true }] }, { id: 'patrimonios', grupo: 'mundo', nombre: null, linea: null, escalones: [{ n: 1, nombre: 'Testigo de la historia', ganado: true }] }] }
      api.datosDePrueba.fotos = ['E0B890', '9DB4D8', 'C8B090', 'E8C89A', 'A8683A', '7A4E2E', '3E5A7A', '5A3A2A', 'C9A27A'].map((c) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"92\" height=\"92\"><rect width=\"92\" height=\"92\" fill=\"#' + c + '\"/></svg>'))
      const ui = (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI
      ui.getState().abrirResumenDia({ iso: '${manana ? D2 : D2}', manana: ${manana} })
      return true })()`)
    await a.esp(3500)
    console.log('estado', await a.evaluar(`(async () => { const u = (await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI.getState(); return JSON.stringify({ r: u.resumenDia, fila: u.fila, dlg: document.querySelectorAll('[role=dialog]').length, logros: (await import('/src/lib/logros.ts')).logrosActivos() }) })()`))
    await sacar(id, '[data-resumen-del-dia]')
    await a.evaluar("(() => { const h = document.querySelector('[data-resumen-del-dia]'); const sc = h && [...h.children].find((c) => c.scrollHeight > c.clientHeight + 4); if (sc) sc.scrollTop = sc.scrollHeight; return true })()")
    await a.esp(800)
    await a.captura(path.join(CAP, `${id}_app_abajo.jpg`))
  }
  if (!SOLO || SOLO === 'R1') await resumenDe(`${pre}R1`, false)
  if (!SOLO || SOLO === 'R2') await resumenDe(`${pre}R2`, true)
  fs.writeFileSync(`docs/dias/V59_log_${MODO}.json`, JSON.stringify(log, null, 1))
} finally {
  a.cerrar()
}
