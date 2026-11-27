// V77 (apartados 1, 3 y 4): SOLO capturas (no es una prueba) en modo iPhone (390x844). Un solo Chrome por vez, que se cierra al acabar. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV77_a.mjs visible|atardecer|pendientes
// Casos: visible (la primera pantalla SIN ser administrador: Lanzarote en el mapa y en la fila de DESTINO), atardecer (el día 1 de Lanzarote con «Atardecer en El Golfo», en DÍAS y en HOY),
//        pendientes (un sitio que antes era «Si te sobra tiempo» en «Lugares pendientes»: HOY, DÍAS al final y el día de DÍAS sin «Si te sobra tiempo»).
// Guarda docs/dias/V77_capturas/<caso>_*.jpg y docs/dias/V77_log_a_<caso>.json con el texto de la pantalla.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V77_capturas')
fs.mkdirSync(CAP, { recursive: true })
const CASO = process.argv[2] ?? 'visible'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
const RUTA = CASO === 'visible' ? '/?cuentas=off' : '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago'
const IDA = '2026-11-08'

const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: RUTA, ...(CASO === 'visible' ? {} : { antes: ANTES }), ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
const log = {}
const cap = async (id) => { await a.esp(1500); await a.captura(path.join(CAP, `${CASO}_${id}.jpg`)) }
const texto = (sel, n = 700) => a.evaluar(`(document.querySelector('${sel}') ?? document.body).innerText.replace(/\\s+/g, ' ').slice(0, ${n})`)
try {
  if (CASO === 'visible') {
    for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
    await a.esp(3500)
    log.pines = await a.evaluar("Array.from(document.querySelectorAll('[data-pin]')).map((e) => e.getAttribute('data-pin'))")
    console.log('pines', log.pines)
    await cap('mapa')
    await a.evaluar("(() => { const e = document.querySelector('[data-campo-destino]'); e.click(); e.focus(); return true })()")
    await a.esp(1500)
    log.tarjetas = await a.evaluar("Array.from(document.querySelectorAll('[data-destino-card]')).map((e) => e.getAttribute('data-destino-card'))")
    console.log('tarjetas', log.tarjetas)
    await cap('destino')
  } else {
    for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
    await a.evaluar("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)")
    for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
    await a.esp(2500)
    for (let i = 0; i < 4; i++) {
      const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(600)
    }
    const hoyDe = async (iso, min) => {
      await a.evaluar(`(async () => { const st = ${R}; try { sessionStorage.clear() } catch {}; st.getState().setDevSimulatedTodayIso('${iso}'); try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}; window.__horaFalsa = ${min}; window.__pos = null; return true })()`)
      await a.esp(700)
      await ev(`${R}.getState().setMode('today')`)
      await a.esp(4500)
      for (let i = 0; i < 3; i++) {
        const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Continuar|Entendido)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!h) break
        await a.esp(700)
      }
    }
    const diaIso = (n) => new Date(new Date(IDA + 'T12:00:00Z').getTime() + (n - 1) * 86400000).toISOString().slice(0, 10)
    if (CASO === 'atardecer') {
      const info = JSON.parse(await ev(`JSON.stringify(${R}.getState().route.days.map((d) => ({ id: d.id, n: d.dayNumber, stops: d.stops.map((s) => s.time + ' ' + s.name) })))`))
      log.dias = info
      const d1 = info.find((d) => d.stops.some((s) => /Atardecer en El Golfo/.test(s)))
      console.log('día con el atardecer', d1?.n, d1?.stops?.join(' | '))
      log.diaAtardecer = d1
      await a.evaluar(`(async () => { const st = ${R}; st.getState().setMode('days'); st.getState().setActiveDayId('${d1.id}'); return true })()`)
      await a.esp(3500)
      await a.evaluar("(() => { const e = Array.from(document.querySelectorAll('*')).filter((x) => x.children.length < 4 && /Atardecer en El Golfo/.test(x.textContent || '')).pop(); if (e) e.scrollIntoView({ block: 'center' }); return true })()")
      await cap('dias_atardecer')
      log.diasTexto = await texto('body', 1500)
      await hoyDe(diaIso(d1.n), 17 * 60 + 20)
      await a.esp(2000)
      await cap('hoy_atardecer')
      log.hoyTexto = await texto('body', 1500)
    }
    if (CASO === 'pendientes') {
      // El último sitio del día 2 pasa a «Lugares pendientes» (antes «Si te sobra tiempo»: es el mismo dato, `spareStops`, con el motivo que le pone el motor).
      await a.evaluar(`(async () => { const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route)); const d = r.days.find((x) => x.dayNumber === 2)
        const i = d.stops.map((s) => !s.isArrival && !s.isBreak && !s.passThrough && !s.pass_through).lastIndexOf(true); const [s] = d.stops.splice(i, 1); s.spareReason = 'Para otro momento'; d.spareStops = [s]
        st.setState({ route: r, screen: 'route' }); window.__sobraNombre = s.name; return true })()`)
      log.sitio = await ev('window.__sobraNombre')
      await hoyDe(diaIso(2), 9 * 60 + 30)
      log.hay = await a.evaluar("({ sobraTiempo: Boolean(document.querySelector('[data-hoy-sobra-tiempo]')), pendientes: document.querySelector('[data-hoy-pendientes]')?.getAttribute('data-hoy-pendientes') ?? null })")
      console.log('HOY', JSON.stringify(log.hay))
      await a.evaluar("(() => { const c = document.querySelector('[data-hoy-pendientes-cabecera]'); if (c && document.querySelector('[data-hoy-pendientes-estado=\"cerrada\"]')) c.click(); return true })()")
      await a.esp(600)
      await a.evaluar("(() => { const c = document.querySelector('[data-hoy-pendientes]'); if (c) c.scrollIntoView({ block: 'center' }); return true })()")
      await cap('hoy_pendientes')
      log.hoyTexto = await texto('[data-hoy-pendientes]', 600)
      console.log('hoy', log.hoyTexto)
      await a.evaluar("(() => { document.querySelector('[data-hoy-pendiente-mas]')?.click(); return true })()")
      await a.esp(900)
      await cap('hoy_pendientes_menu')
      log.menu = await a.evaluar("document.querySelector('[data-hoy-pendiente-menu]')?.innerText.replace(/\\s+/g, ' ') ?? null")
      console.log('menu', log.menu)
      // DÍAS: la lista, con el bloque al final encima de «Añadir día»; y el día 2 sin «Si te sobra tiempo».
      await a.evaluar(`(async () => { const st = ${R}; st.getState().setMode('days'); st.getState().setActiveDayId(null); return true })()`)
      await a.esp(3500)
      await a.evaluar("(() => { const c = document.querySelector('[data-pendientes-modo=\"dias\"]'); if (c) c.scrollIntoView({ block: 'center' }); return true })()")
      await cap('dias_pendientes')
      log.diasTexto = await texto('[data-pendientes-modo="dias"]', 600)
      console.log('dias', log.diasTexto)
      await a.evaluar(`(async () => { const st = ${R}; const d = st.getState().route.days.find((x) => x.dayNumber === 2); st.getState().setActiveDayId(d.id); return true })()`)
      await a.esp(3500)
      log.diaSinSobra = await a.evaluar("({ sobraTiempo: Boolean(document.querySelector('[data-sobra-tiempo]')), texto: /Si te sobra tiempo/.test(document.body.innerText) })")
      console.log('día 2', JSON.stringify(log.diaSinSobra))
      await a.evaluar("(() => { window.scrollTo(0, document.body.scrollHeight); document.querySelectorAll('*').forEach((e) => { if (e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY !== 'visible') e.scrollTop = e.scrollHeight }); return true })()")
      await cap('dias_dia2_sin_sobra')
    }
  }
  fs.writeFileSync(`docs/dias/V77_log_a_${CASO}.json`, JSON.stringify(log, null, 2))
} finally {
  a.cerrar()
}
process.exit(0)
