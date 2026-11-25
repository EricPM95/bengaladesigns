// V58 punto 7: «Guarda un recuerdo de {sitio}» al momento, solo en HOY, y se cierra sola al cambiar de pestaña. Por la cola:
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV58_recuerdo.mjs [sufijo=despues]
import fs from 'node:fs'
import path from 'node:path'
import { abrir, ponerReservas, hoy, modo, texto, clicTexto } from './viajero_roma_comun.mjs'

const SUF = process.argv[2] ?? 'despues'
const CAP = path.resolve('docs/dias/V58_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}_${SUF}.jpg`)
const log = {}
const c = await abrir()
const { a } = c
const tipoHoja = () => a.evaluar("document.querySelector('[data-visto^=hoja-]')?.getAttribute('data-visto') ?? null")
const hay = async () => (await tipoHoja()) === 'hoja-recuerdo'
try {
  await ponerReservas(c)
  await hoy(c, '2026-10-18', 9 * 60 + 40)
  // Un [He terminado] de una parada «sin nada que ganar» (Plaza Venecia): el mismo camino que el botón (procesarVisto), con la hora medida.
  await a.evaluar("(async () => { localStorage.setItem('trazo:logros:permisos-vistos', '1'); return true })()")
  const t0 = Date.now()
  log.lanzado = await a.evaluar(`(async () => {
    const st = (await import('/src/store/useRouteStore.ts')).useRouteStore.getState(); const r = st.route
    const dia = r.days.find((d) => d.dateIso === '2026-10-18') ?? r.days[1]; const parada = dia.stops.find((x) => /Venecia/.test(x.name))
    const { useSyncStore } = await import('/src/store/useSyncStore.ts')
    const { procesarVisto } = await import('/src/components/logros/visto/VistoFlujo.tsx')
    st.setStopVisto(dia.id, parada.id, true)
    void procesarVisto({ tripId: useSyncStore.getState().activeTripId ?? r.id, dayId: dia.id, stopId: parada.id, nombre: parada.name })
    return parada.name })()`)
  let ms = null
  for (let q = 0; q < 80 && ms === null; q++) {
    await a.esp(100)
    if (await hay()) ms = Date.now() - t0
  }
  log.ms_hasta_la_hoja = ms
  await a.esp(400)
  await a.captura(png('7-al-momento'))
  log.texto_hoja = await texto(a, 500)
  // Cambiar de pestaña: se cierra sola.
  await modo(c, 'days', 1500)
  log.en_dias = await hay()
  await a.captura(png('7-solo-en-hoy'))
  await modo(c, 'today', 1500)
  log.al_volver_a_hoy = await hay()
  fs.writeFileSync(path.join(CAP, `_log_recuerdo_${SUF}.json`), JSON.stringify(log, null, 1))
  console.log(JSON.stringify(log, null, 1))
} finally {
  a.cerrar()
}
