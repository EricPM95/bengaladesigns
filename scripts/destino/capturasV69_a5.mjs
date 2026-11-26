// V69 (apartado 5, «Lugares pendientes» en DÍAS, L5): SOLO capturas (no es una prueba), modo iPhone 390x844, un Chrome que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV69_a5.mjs <lista|pasartodos|vacio>
// Roma, ANTES del viaje (julio de 2027): tres sitios que no cupieron (`spareStops` de sus días, como los deja Reorganizar) → DÍAS, bajando hasta el final de la lista. Guarda docs/dias/V69_capturas/a5_<caso>.jpg
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/V69_capturas')
fs.mkdirSync(CAP, { recursive: true })
const CASO = process.argv[2] ?? 'lista'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', ancho: 390, alto: 844 })
const ev = (e) => a.evaluar('(async () => (' + e + '))()')
try {
  for (let i = 0; i < 80 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 4; i++) {
    const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.evaluar(`(async () => {
    const st = ${R}
    const r = JSON.parse(JSON.stringify(st.getState().route))
    r.answers = { ...r.answers, dateRange: { start: '2027-07-13', end: '2027-07-16' } }
    if ('${CASO}' !== 'vacio') {
      // Tres sitios que no cupieron: de la mañana del día 1, de la tarde del día 2 y de la mañana del día 3 (como los deja Reorganizar).
      const saca = (d, re) => { const i = d.stops.findIndex((s) => re.test(s.name)); if (i < 0) return; const [s] = d.stops.splice(i, 1); d.spareStops = [...(d.spareStops || []), { ...s, spareReason: 'Con tu vuelo no te da tiempo ese día.' }] }
      saca(r.days[0], /Castillo/); saca(r.days[0], /Basílica de San Pedro/); saca(r.days[1], /Plaza de España/)
      // Para la hoja «Pasar todos»: el día 3 y el 4 con hueco (los otros están llenos y no cabría ninguno).
      if ('${CASO}' === 'pasartodos') { r.days[2].stops = r.days[2].stops.slice(0, 3) }
    }
    st.setState({ route: r, reservations: [], screen: 'route', dev_simulated_today_iso: '2027-07-01' })
    st.getState().setActiveDayId(null); st.getState().setMode('days')
    return true
  })()`)
  await a.esp(2500)
  await a.evaluar("(() => { const e = document.querySelector('[data-dias-pendientes]'); if (e) e.scrollIntoView({ block: 'end' }); return !!e })()")
  await a.esp(1200)
  console.log('pendientes:', await ev("(document.querySelector('[data-dias-pendientes]')?.innerText ?? 'SIN BLOQUE').split(String.fromCharCode(10)).join(' | ')"))
  if (CASO === 'pasartodos') {
    await ev("(() => { document.querySelector('[data-hoy-pendientes-pasar-todos]')?.click(); return true })()")
    await a.esp(2500)
    console.log('hoja:', await ev("(document.querySelector('[data-hoy-pendientes-resumen]')?.innerText ?? 'SIN HOJA').split(String.fromCharCode(10)).join(' | ')"))
  }
  await a.captura(path.join(CAP, `a5_${CASO}.jpg`))
} finally {
  a.cerrar()
}
