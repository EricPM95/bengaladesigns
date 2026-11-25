// V60: comprobación (no es una prueba) de la hora recomendada en Lanzarote (en coche): la misma función pura con la hora útil real de Lanzarote (`_llegada.json`).
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasV60_lanza_calculo.mjs
import { abrirApp } from './_enLaApp.mjs'
const a = await abrirApp(process.env.APP_URL ?? 'http://localhost:5173', { ruta: '/?cuentas=off&apertura=0', ancho: 390, alto: 844 })
try {
  const r = await a.evaluar(`(async () => {
    const { recomendarHora } = await import('/src/lib/civitatis.ts')
    const { horaUtilDeBillete } = await import('/shared/arrival/horaUtil.js')
    const info = await fetch('/data/dias/lanzarote/_llegada.json').then((x) => x.json())
    const dias = ['2026-11-08', '2026-11-09', '2026-11-10']
    const mk = (sin) => ({ actividadId: 1, conHorasFijas: true, dias: { '2026-11-08': { sinPlazas: sin, horas: sin ? [] : [{ hora: '10:00', plazas: null, aviso: null }, { hora: '15:00', plazas: null, aviso: null }, { hora: '17:00', plazas: null, aviso: null }] }, '2026-11-09': { sinPlazas: false, horas: [{ hora: '10:00', plazas: null, aviso: null }, { hora: '15:00', plazas: null, aviso: null }] }, '2026-11-10': { sinPlazas: false, horas: [{ hora: '11:00', plazas: null, aviso: null }] } } })
    const out = []
    for (const [vuelo, sin] of [['10:30', false], ['13:30', false], ['17:20', false], ['10:30', true]]) {
      const u = horaUtilDeBillete({ info, medio: 'avion', puntoId: 'ace', zona: 'costa_teguise', hora: vuelo })
      const rec = recomendarHora(mk(sin), '2026-11-08', '16:00', dias, { fechaLlegada: '2026-11-08', horaUtilMin: u.min, aterrizaHHMM: vuelo })
      out.push({ vuelo, sinPlazas: sin, libreHacia: Math.floor(u.min / 60) + ':' + String(u.min % 60).padStart(2, '0'), cuando: rec && rec.cuando, franja: rec && rec.franja && rec.franja.texto, porque: rec && rec.porque, grisa: rec && rec.pasaAlDia })
    }
    return JSON.stringify(out, null, 1) })()`)
  console.log(r)
} finally {
  a.cerrar()
}
