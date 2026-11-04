// Capturas 390x844 de la tanda LL, parte 2 (Roma): el día de llegada con la llegada a las 9:00, 11:30, 14:30, 17:00 y 20:00 (Fiumicino, con pase, tras «Sí, adaptarlos») y el día de vuelta.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/_ll_roma_capturas.mjs
import fs from 'node:fs'
import path from 'node:path'
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
const s = (cuerpo) => `${store}.then(async (R) => { const st = () => R.getState(); ${cuerpo} })`
const antes = "try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; try{sessionStorage.removeItem('trazo:version')}catch(x){}"
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=off&version=completa&apertura=0', antes, ancho: 390, alto: 844 })
const informe = {}
try {
  const ev = (js) => a.evaluar(js)
  for (let i = 0; i < 120 && !(await ev("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  const cerrar = async () => {
    for (let i = 0; i < 5; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|De acuerdo|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await a.esp(500)
    }
  }
  const horas = ['09:00', '11:30', '14:30', '17:00', '20:00']
  for (const h of horas) {
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 90 && !(await ev(s('return Boolean(st().route)'))); i++) await a.esp(1000)
    await a.esp(2500)
    await cerrar()
    await ev(s(`st().setArrivalFlightTime(${JSON.stringify(h)}); st().setDepartureFlightTime('18:00'); const m = await import('/src/lib/adaptarVuelos.ts'); m.olvidarRespuestasDelMotor(); await m.alCambiarElVuelo({ que: 'hora', mitad: 'arrival' }); await m.alCambiarElVuelo({ que: 'hora', mitad: 'departure' }); return true`))
    for (let i = 0; i < 100 && !(await ev("Boolean(document.querySelector('[data-alerta-adaptar]'))")); i++) { await cerrar(); await a.esp(500) }
    await ev("document.querySelector('[data-adaptar-si]')?.click(); true")
    await a.esp(4000)
    await cerrar()
    informe[h] = JSON.parse(await ev(s("return JSON.stringify(st().route.days.map((d) => ({ n: d.dayNumber, ret: Boolean(d.isReturnLeg), paradas: d.stops.map((x) => `${x.time} ${x.name}`) })))")))
    await ev(s("st().setMode('days'); st().setActiveDayId(st().route.days[0].id); return true"))
    await a.esp(2500)
    await cerrar()
    await a.captura(path.join(SALIDA, `ll_roma_llegada_${h.replace(':', '')}_1.jpg`))
    if (h === '14:30') {
      await ev(s("const d = st().route.days.find((x) => x.isReturnLeg) ?? st().route.days.at(-1); st().setMode('days'); st().setActiveDayId(d.id); return true"))
      await a.esp(2500)
      await cerrar()
      await a.captura(path.join(SALIDA, 'll_roma_vuelta_1800_1.jpg'))
    }
  }
} finally {
  fs.writeFileSync('docs/dias/_ll_roma_capturas.json', JSON.stringify(informe, null, 1))
  await a.cerrar()
}
console.log('listo')
