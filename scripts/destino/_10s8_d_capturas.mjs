// Capturas 390x844 de «Entradas y Free Tour» y «Alojamiento» (10S8, agente D). Un Chrome por la cola:
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/_10s8_d_capturas.mjs [gratis|pago]
import fs from 'node:fs'
import path from 'node:path'
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const version = process.argv[2] ?? 'pago'
const sin = version === 'gratis'
const DIBUJO = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#fff"/><path d="M0 0h3v3H0zM5 0h3v3H5zM0 5h3v3H0zM4 4h1v1H4zM6 5h2v1H6zM5 7h1v1H5z" fill="#111"/></svg>').toString('base64')
const a = await abrirApp(APP, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=${version}`, ancho: 390, alto: 844 })
try {
  const ev = (js) => a.evaluar(js)
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await ev('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await ev('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
  await a.esp(2500)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  const base = await R(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; const s = d.stops.find((p) => !p.isFreeTour && !p.isNightExperience && !p.passThrough && !p.isBreak && p.name); return { dateIso: B.dateOfDay(r, d), nombre: s.name }`)
  console.log('sitio', base)
  await R(`st().addReservation({ id: 'res-10s8-d', kind: 'entrada', refId: ${JSON.stringify(base.nombre)}, name: ${JSON.stringify(base.nombre)}, placeNames: [${JSON.stringify(base.nombre)}], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '09:15', precio: { amount: 50, currency: 'EUR' } }, null, null); return true`)
  const ir = async (nombre) => {
    await ev(`document.querySelector('${nombre}')?.scrollIntoView({ block: 'start' }); true`)
    await a.esp(500)
  }
  const verBloque = async (b) => {
    await R("st().setMode('bookings'); return true")
    await a.esp(1800)
    await ev(`(() => { const b = document.querySelector('[data-blk="${b}"]'); if (b && b.querySelectorAll('[data-tarjeta-crema]').length === 0) b.firstElementChild?.click(); return true })()`)
    await a.esp(1200)
  }
  await verBloque('entradas')
  await ir('[data-blk="entradas"]')
  await a.captura(path.join(SALIDA, `10s8_entradas_${version}_e1.jpg`))
  // E2: con su billete
  await ev(`(async () => { const S = await import('/src/store/useBilleteStore.ts'); const st = S.useBilleteStore.getState(); st.ponerEntrada(st.tripId, ${JSON.stringify(base.nombre)}, { personas: 2, localizador: 'ABC123', codigo: { texto: 'COLOSSEUM|ABC123', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(DIBUJO)} }, dueno: null }); return true })()`)
  await a.esp(1500)
  await ir('[data-blk="entradas"]')
  await a.captura(path.join(SALIDA, `10s8_entradas_${version}_e2.jpg`))
  // E5: el lápiz del bloque de datos
  await ev(`document.querySelector('[data-lapiz="entrada-datos"]')?.click(); true`)
  await a.esp(1500)
  await a.captura(path.join(SALIDA, `10s8_entradas_${version}_e5.jpg`))
  await ev(`document.querySelector('[role=dialog] button[aria-label=Cerrar]')?.click(); true`)
  await a.esp(600)
  // Alojamiento
  await R(`const r = route(); st().setAccommodationHotel(r.days[0].id, { name: 'Hotel Palatino', precio: { amount: 280, currency: 'EUR' } }); ${sin ? '' : "R.useRouteStore.setState({ route: { ...route(), accommodationZone: 'centro', accommodationAddress: 'Via Cavour 12, Roma' } });"} return true`)
  await a.esp(1500)
  await ev(`(() => { const b = document.querySelector('[data-blk="aloj"] [data-aloj-cabecera] [data-cabecera-clara]'); if (!document.querySelector('[data-blk="aloj"] [data-alojamiento-caja]')) b?.click(); return true })()`)
  await a.esp(800)
  await ir('[data-blk="aloj"]')
  await a.captura(path.join(SALIDA, `10s8_alojamiento_${version}_a1.jpg`))
  // A2: con reserva
  await R(`const r = route(); const id = r.days[0].id; const h = st().accommodationSelections[id]; st().setAccommodationHotel(id, { ...h, reserva: { direccion: 'Via Cavour 12, Roma', entrada: '2026-11-26', salida: '2026-11-29', noches: 3, horaEntrada: '15:00', horaSalida: '11:00', telefono: '+39 06 1234 5678', localizador: null } }); await (await import('/src/store/useBilleteStore.ts')).useBilleteStore.getState().ponerAlojamiento((await import('/src/store/useBilleteStore.ts')).useBilleteStore.getState().tripId, id, 'HX48K2'); return true`)
  await a.esp(1500)
  await ir('[data-blk="aloj"]')
  await a.captura(path.join(SALIDA, `10s8_alojamiento_${version}_a2.jpg`))
  await ev(`document.querySelector('[data-lapiz="aloj-datos"]')?.click(); true`)
  await a.esp(1500)
  await a.captura(path.join(SALIDA, `10s8_alojamiento_${version}_a3.jpg`))
  console.log('hecho', version)
} finally {
  a.cerrar()
}
