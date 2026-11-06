// Las capturas de móvil del REPASO del arreglo del formulario y de RESERVAS (6-nov): el bloque del coche sin y con reserva, el vuelo con [Buscar vuelos] y un trayecto en coche con «Rutas».
// Necesita Vite 5173 y API 8787 con DESTINOS_OCULTOS='-'. Un solo Chrome, que se cierra al acabar.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/capturasArregloCoche.mjs
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const a = await abrirApp('http://localhost:5173', { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', ancho: 390, alto: 844 })
const ev = (js) => a.evaluar(js)
const cierraAvisos = async () => {
  for (let i = 0; i < 5; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar|Ahora no)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(500)
  }
}
const alVer = (sel) => ev(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.scrollIntoView({ block: 'center' }); return true })()`)
try {
  for (let i = 0; i < 60 && !(await ev("typeof window.__rutaLanzarote === 'function'").catch(() => false)); i++) await a.esp(500)
  await ev("window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08', vuelos: { llegada: '08:25', vuelta: '19:40' } }).then(() => true)")
  await cierraAvisos()

  // 1. RESERVAS: el vuelo sin reservar con [Buscar vuelos] (sin las horas de los vuelos puestas: con ellas el vuelo ya cuenta como hecho y no hace falta buscarlo)
  await ev("(() => { const st = window.__ruta; const r = structuredClone(st.getState().route); r.arrivalFlightTime = null; r.departureFlightTime = null; st.setState({ route: r }); st.getState().setMode('bookings'); return true })()")
  await a.esp(2200)
  await cierraAvisos()
  // El bloque de vuelos entra plegado: se despliega tocando su cabecera.
  await ev("(() => { const c = Array.from(document.querySelectorAll('[data-cabecera-bloque]')).find((x) => /vuelo|llegada/i.test(x.innerText || '')); c?.click(); return true })()")
  await a.esp(900)
  // Si al desplegar se abre la hoja «Tu vuelo» (falta una mitad), se cierra para ver el bloque.
  await ev("(() => { const xs = Array.from(document.querySelectorAll('button')).filter((b) => /^cerrar/i.test(b.getAttribute('aria-label') || '')); const hoja = document.body.innerText.includes('Tu vuelo') && xs.length > 1; if (hoja) xs[xs.length - 1].click(); return true })()")
  await a.esp(900)
  console.log('buscar vuelos:', await alVer('[data-buscar-vuelos]'))
  await a.esp(600)
  await a.captura(path.join(SALIDA, 'arreglo_coche_vuelo_buscar_vuelos.jpg'))

  // 2. El bloque del coche, sin reserva
  console.log('bloque coche:', await alVer('[data-bloque-coche]'))
  await a.esp(600)
  await a.captura(path.join(SALIDA, 'arreglo_coche_bloque_sin_reserva.jpg'))

  // 3. El bloque del coche, con la reserva puesta («Listo»)
  await ev(`(() => { window.__ruta.getState().setRentalVehicleBooking({ provider: 'Cicar', startDate: '2026-11-08', endDate: '2026-11-13', precio: { amount: 212, currency: 'EUR' }, coche: 'Fiat 500 o similar', lugarRecogida: 'Aeropuerto de Lanzarote', horaRecogida: '10:00', lugarDevolucion: 'Aeropuerto de Lanzarote', horaDevolucion: '15:30', codigo: 'CIC-48213' }); return true })()`)
  await a.esp(1500)
  await alVer('[data-bloque-coche]')
  await a.esp(600)
  await a.captura(path.join(SALIDA, 'arreglo_coche_bloque_con_reserva.jpg'))

  // 4. DÍAS: un trayecto en coche con «Rutas» (y sin «+5 min para aparcar»), y la hoja abierta
  await ev("(() => { const s = window.__ruta.getState(); s.setMode('days'); s.setActiveDayId(s.route.days[2].id); return true })()")
  await a.esp(2500)
  await cierraAvisos()
  console.log('rutas:', await alVer('[data-rutas-coche]'))
  await a.esp(600)
  await a.captura(path.join(SALIDA, 'arreglo_coche_dias_rutas.jpg'))
  await ev("document.querySelector('[data-rutas-coche]')?.click(); true")
  await a.esp(1800)
  await a.captura(path.join(SALIDA, 'arreglo_coche_dias_rutas_hoja.jpg'))
  const hoja = await ev("(() => { const h = document.querySelector('[data-abrir-ruta-en]'); return h ? Array.from(h.querySelectorAll('a')).map((x) => x.getAttribute('href')) : null })()")
  console.log('enlaces de la hoja:', JSON.stringify(hoja))
  const aparcar = await ev("/para aparcar/.test(document.body.innerText)")
  console.log('«para aparcar» a la vista:', aparcar)
} finally {
  a.cerrar()
}
