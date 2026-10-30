// Tanda 10S3b (agente E): el Free Tour NUNCA rehace ni mueve días (ni al reservarlo, ni al cambiarle la hora, ni al rehacer otros días después por `reservasParaMotor`).
//   1 · el código: `reservasParaMotor` deja fuera el Free Tour (solo la generación desde cero lo pide con `conFreeTour`); el almacén no rehace días con su reserva.
//   2 · el servidor: /api/reservation-plan con el Free Tour no cambia nada ni da mensaje.
//   3 · en la app: viaje con el Free Tour ya puesto; se reserva a otra hora en su día y se le cambia la hora: NINGÚN día cambia (mismas paradas, mismo orden en todos los días),
//       no sale el mensaje de mover días, y al rehacer los demás días después (rehacerDiasSinTocar) ninguna petición al motor lleva el Free Tour en `reservas`.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S3_E.mjs
// Imprime «N comprobaciones, M fallos» y sale con 1 si falla.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

const APP = process.env.APP_URL ?? 'http://localhost:5173'
const API = process.env.API_URL ?? 'http://localhost:8787'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

console.log('1. El código')
{
  const er = sinComentarios(leer('src/lib/engineReservas.ts'))
  debe(/conFreeTour\?: boolean/.test(er) && /opciones\.conFreeTour \|\| !esFreeTour\(reservation\)/.test(er), 'ft', 'reservasParaMotor deja fuera el Free Tour salvo con conFreeTour')
  debe(/reservasParaMotor\(useRouteStore\.getState\(\)\.reservations, \{ conFreeTour: true \}\)/.test(er), 'ft', 'solo reservasActuales (generar el viaje desde cero) lo lleva')
  for (const f of ['src/lib/rebuildDay.ts', 'src/lib/dayInterruptor.ts', 'src/hooks/useAvisosDeVuelo.ts', 'src/components/route/reservas/AddReservationSheet.tsx']) {
    debe(!/conFreeTour/.test(sinComentarios(leer(f))), 'ft', `${f} no pide el Free Tour al motor`)
  }
  const plan = sinComentarios(leer('server/engine/reservationPlan.js'))
  debe(/grande === destData\.default_free_tour\?\.name\) return base/.test(plan), 'ft', 'el plan de reservas del servidor devuelve «sin cambios» para el Free Tour')
  const mod = await import('../../src/lib/engineReservas.ts').catch(() => null)
  if (mod) {
    const ft = { id: 'a', kind: 'entrada', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: ['Free Tour por Roma'], dateIso: '2026-11-27', dayNumber: null, time: '17:00' }
    const pan = { id: 'b', kind: 'entrada', refId: 'Panteón', name: 'Panteón', placeNames: ['Panteón'], dateIso: '2026-11-27', dayNumber: null, time: '10:00' }
    debe(mod.reservasParaMotor([ft, pan]).length === 1 && mod.reservasParaMotor([ft, pan])[0].placeNames[0] === 'Panteón', 'ft', 'reservasParaMotor: el Panteón pasa, el Free Tour no')
    debe(mod.reservasParaMotor([ft, pan], { conFreeTour: true }).length === 2, 'ft', 'con conFreeTour pasan los dos')
  }
}

console.log('2. El plan de reservas del servidor')
{
  const body = {
    destination: 'Roma',
    answers: { dateRange: { start: '2026-11-26', end: '2026-11-29' }, month: 11, experiencesPositive: ['imprescindibles', 'free_tour'] },
    all_days: [1, 2, 3, 4].map((n) => ({ day_number: n, city: 'Roma' })),
    must_include_places: [],
    inside_names: [],
    reserva: { placeNames: ['Free Tour por Roma'], dateIso: '2026-11-27', dayNumber: null, time: '17:00' },
    reservas: [{ placeNames: ['Free Tour por Roma'], dateIso: '2026-11-27', dayNumber: null, time: '17:00' }],
    reservas_antes: [{ placeNames: ['Free Tour por Roma'], dateIso: '2026-11-27', dayNumber: null, time: '10:00' }],
  }
  const r = await fetch(`${API}/api/reservation-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((x) => x.json()).catch((e) => ({ error: String(e) }))
  debe(r.cambia === false && !r.mensaje && !(r.cambios ?? []).length, 'ft', `cambiar la hora del Free Tour (10:00 → 17:00): sin cambios ni mensaje (${JSON.stringify(r).slice(0, 160)})`)
}

console.log('3. En la app')
let app = null
try {
  app = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=completa' })
  for (let i = 0; i < 240 && !(await app.evaluar("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await app.esp(500)
  for (let intento = 0; intento < 8; intento++) {
    const ok = await app.evaluar('window.__rutaPrueba().then(() => true, (e) => String(e && e.message))').catch((e) => String(e))
    if (ok === true) break
    await app.esp(1500)
  }
  for (let i = 0; i < 90 && !(await app.evaluar("import('/src/store/useRouteStore.ts').then((m) => Boolean(m.useRouteStore.getState().route))")); i++) await app.esp(1000)
  await app.esp(2500)
  const ev = (js) => app.evaluar(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const route = () => R.useRouteStore.getState().route; const st = () => R.useRouteStore.getState(); ${js} })()`)
  const foto = `const r = route(); return JSON.stringify(r.days.map((x) => ({ n: x.dayNumber, id: x.id, stops: x.stops.map((y) => y.name) })))`

  const montado = await ev(`
    const F = await import('/src/lib/freeTourEnDia.ts')
    const r = route()
    const dia = r.days.filter((d) => !d.isReturnLeg && B.dateOfDay(r, d))[1] ?? r.days.find((d) => !d.isReturnLeg)
    const res = await F.anadirFreeTourEnDia(dia.id, { llevar: false })
    return { ok: res.ok, texto: res.texto ?? null, dayId: dia.id, dateIso: B.dateOfDay(r, dia) }
  `)
  debe(montado.ok === true, 'ft', `el viaje lleva el Free Tour (${montado.texto})`)
  await app.esp(1500)
  // Espía de las peticiones al motor y de los avisos.
  await ev(`window.__espia = []; const f = window.fetch; window.fetch = function (u, o) { try { const url = String(u && u.url || u); if (/\\/api\\/(rebuild-day|reservation-plan|generate)/.test(url)) window.__espia.push({ url, body: String(o && o.body || '') }) } catch (e) {} return f.apply(this, arguments) }; return true`)
  const base = await ev(foto)
  const avisosAntes = await ev('const N = await import("/src/store/useNoticesStore.ts"); return N.useNoticesStore.getState().pushed.length')
  const reservar = (hora) => ev(`
    const parada = route().days.flatMap((d) => d.stops).find((s) => s.isFreeTour)
    const res = { id: 'res-ft-10s3b', kind: 'entrada', refId: 'Free Tour', name: 'Free Tour por Roma', placeNames: [parada.name], shortName: null, dateIso: ${JSON.stringify(montado.dateIso)}, dayNumber: null, time: ${JSON.stringify(hora)} }
    st().addReservation(res, null, null)
    return true
  `)
  await reservar('10:00')
  await app.esp(3000)
  const tras1 = await ev(foto)
  debe(tras1 === base, 'ft', 'reservar el Free Tour a las 10:00 en su día: ningún día cambia (mismas paradas y orden en todos)')
  await reservar('17:00')
  await app.esp(3000)
  const tras2 = await ev(foto)
  debe(tras2 === base, 'ft', 'cambiarle la hora (17:00): ningún día cambia')
  const peticiones = await ev('return window.__espia.length')
  debe(peticiones === 0, 'ft', `reservar o cambiar la hora del Free Tour no pide nada al motor (${peticiones} peticiones)`)
  const avisosDespues = await ev('const N = await import("/src/store/useNoticesStore.ts"); return N.useNoticesStore.getState().pushed.length')
  const dialogo = await ev("return Boolean(document.querySelector('#move-day-heading')) || /vamos a mover el día|Hemos puesto el día/.test(document.body.innerText)")
  debe(avisosDespues === avisosAntes && !dialogo, 'ft', `no sale ningún mensaje ni aviso (avisos ${avisosAntes} → ${avisosDespues})`)
  const pTiempo = await ev(`const s = route().days.flatMap((d) => d.stops).find((x) => x.isFreeTour); return { time: s.time, reservedId: s.reservedId ?? null }`)
  debe(pTiempo.time === '17:00' && Boolean(pTiempo.reservedId), 'ft', `la parada lleva la hora nueva (${JSON.stringify(pTiempo)})`)

  // Y después, rehacer otros días (lo que hace cualquier otro cambio): el Free Tour no viaja al motor.
  await ev(`const M = await import('/src/lib/rebuildDay.ts'); await M.rehacerDiasSinTocar(null, { mantenerOrden: true }); return true`)
  await app.esp(1500)
  const espia = await ev('return window.__espia')
  const reb = espia.filter((p) => /rebuild-day/.test(p.url))
  debe(reb.length > 0, 'ft', `al rehacer los días se pidió algo al motor (${reb.length} peticiones)`)
  debe(reb.every((p) => !/Free Tour/i.test(JSON.parse(p.body || '{}').reservas ? JSON.stringify(JSON.parse(p.body).reservas) : '')), 'ft', 'ninguna petición al motor lleva el Free Tour en `reservas` (no se lo convierte en «Free Tour puesto» ni mueve días)')
} catch (e) {
  debe(false, 'ft', `la prueba falló: ${e && e.message}`)
} finally {
  try { await app?.cerrar?.() } catch { /* ya cerrada */ }
}
console.log(`${comprobaciones} comprobaciones, ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
