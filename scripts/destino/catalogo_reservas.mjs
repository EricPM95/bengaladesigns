// CATALOGO · RESERVAS: el aviso naranja de un documento, el mensaje de los días que cambian (E1) y el de «Reorganizar». Por la cola (UN Chrome):
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/catalogo_reservas.mjs [naranja e1 reorganizar]
import { abrir, anotar, clicTexto, cuerpo, foto, nada, R } from './catalogo_comun.mjs'

const quiero = new Set(process.argv.slice(2))
const va = (s) => quiero.size === 0 || quiero.has(s)
const VUELO = "(() => { const st = window.__ruta.getState(); const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:15', departureFlightTime: '19:05', arrivalPointId: 'fco', departurePointId: 'fco', arrivalOtroPunto: 'BCN', departureOtroPunto: 'BCN', arrivalOtraHora: '08:30', departureOtraHora: '21:10', arrivalCodigo: 'VY6102', departureCodigo: 'VY6105' } }); return true })()"
const TARJETA = `(async () => { const B = await import('/src/store/useBilleteStore.ts'); const S = await import('/src/store/useSyncStore.ts'); const tripId = S.useSyncStore.getState().activeTripId; const ahora = new Date().toISOString(); const dibujo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1zM10 10h2v2h-2zM14 14h5v2h-5zM10 16h3v3h-3z" fill="#111"/></svg>'; const g = (h) => ({ horaRoma: h, localizador: 'XK29PQ', terminal: null, asiento: '12A', coche: null, codigo: { texto: 'M1TEST', formato: 'qr', imagen: null, dibujo }, dueno: null, actualizado: ahora }); B.useBilleteStore.setState({ tripId, datos: { arrival: g('11:15'), departure: g('19:05') } }); return true })()`

// 1 · El aviso naranja DENTRO de la tarjeta de embarque (una tarjeta de otro día)
if (va('naranja')) {
  const { a, ev } = await abrir()
  try {
    await a.evaluar(VUELO)
    await a.evaluar(TARJETA)
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(2000)
    await a.evaluar(`(() => { const h = Array.from(document.querySelectorAll('button, [role=button]')).filter((x) => /Llegada y vuelta/.test(x.textContent || '')).sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0]; h?.click(); return Boolean(h) })()`)
    await a.esp(2500)
    await a.evaluar(`(async () => { const M = await import('/src/lib/avisoDeDocumento.ts'); const S = await import('/src/store/useSyncStore.ts'); M.ponerAvisoDeDocumento(S.useSyncStore.getState().activeTripId, 'arrival', 'Esta tarjeta de embarque es del lunes 19 de octubre; tu vuelo es el sábado 17. ¿Es correcta?'); return true })()`)
    await a.esp(1500)
    await a.evaluar("document.querySelector('[data-aviso-de-documento], [data-aviso-documento]')?.scrollIntoView({ block: 'center' }); window.scrollBy(0, 0); true")
    const t = await cuerpo(a, 900)
    if (/Es correcta/.test(t)) await foto(a, 'reservas_aviso_naranja_documento', { texto: t.slice(0, 400) })
    else {
      await foto(a, 'reservas_aviso_naranja_documento', { texto: t.slice(0, 400), dudoso: true })
      console.log('aviso: no se ve «Es correcta» en la pantalla; revisar la captura')
    }
  } catch (e) {
    nada('reservas_aviso_naranja_documento', e.message)
  } finally {
    a.cerrar()
  }
}

// 2 · E1: la excursión guardada en otro día → «Tus días han cambiado» (con [De acuerdo] y [Deshacer])
if (va('e1')) {
  const { a, ev } = await abrir()
  try {
    await a.evaluar(`(() => { const st = window.__ruta.getState(); const r = st.route; const base = r.days.find((x) => !x.isReturnLeg && x.dayNumber === 2); const mk = (n, extra = {}) => ({ ...JSON.parse(JSON.stringify(base)), id: 'dia-cat-' + n, dayNumber: n, ...extra }); const exc = { id: 'pompeya', title: 'Excursión a Pompeya', durationHours: 13, durationLabel: '13 h', meetingPoint: null, halfDay: false, priceLabel: '', page: null }; const dias = [mk(1), mk(2), mk(3), mk(4, { dayType: 'excursion', stops: [], meals: [], excursions: [exc], selectedExcursionId: 'pompeya' }), mk(5)]; const vuelta = r.days.filter((x) => x.isReturnLeg).map((x) => ({ ...x, dayNumber: 6 })); window.__ruta.setState({ route: { ...r, days: [...dias, ...vuelta], answers: { ...r.answers, dateRange: { start: '2026-11-25', end: '2026-11-29' } } } }); st.setMode('bookings'); return true })()`)
    await a.esp(2500)
    await ev(`${R}.getState().setMode('bookings')`)
    await a.esp(1500)
    await a.evaluar(`(() => { const b = document.querySelector('[data-blk="excursiones"]'); b?.querySelector('[data-cabecera-clara]')?.click(); return true })()`)
    await a.esp(2000)
    const abre = await clicTexto(a, '/Ya la tengo/')
    await a.esp(2000)
    await a.evaluar(`(() => { const b = Array.from(document.querySelectorAll('[role="dialog"] [role="group"] button')).find((x) => !/En tu ruta/.test(x.textContent || '')); b?.click(); return Boolean(b) })()`)
    await a.esp(1500)
    await a.evaluar(`(() => { const b = document.querySelector('[data-guardar-reserva]'); b?.click(); return Boolean(b) })()`)
    await a.esp(2000)
    const hay = await a.evaluar("Boolean(document.querySelector('[data-aviso-dias-cambian]'))")
    if (!hay) throw new Error(`el aviso E1 no salió (abre la hoja: ${abre})`)
    await foto(a, 'reservas_e1_dias_cambian', { texto: await a.evaluar("(document.querySelector('[data-aviso-dias-cambian]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 400)") })
  } catch (e) {
    nada('reservas_e1_dias_cambian', e.message)
  } finally {
    a.cerrar()
  }
}

// 3 · «Reorganizar»: el botón redondo, la alerta «¿Reorganizamos tu día?» y el aviso tras reorganizar (con [Deshacer])
if (va('reorganizar')) {
  const { a, ev } = await abrir()
  try {
    await a.evaluar(`(() => { const st = window.__ruta.getState(); const r = st.route; window.__ruta.setState({ route: { ...r, origin: 'Barcelona', originPlace: undefined, accommodationZone: 'espana', answers: { ...r.answers, month: 12, dateRange: { start: '2026-12-01', end: '2026-12-05' }, experiencesPositive: ['free_tour'] }, transportContext: { ...r.transportContext, transport_option: { ...(r.transportContext.transport_option ?? {}), id: 'plane' } }, arrivalFlightTime: '11:15', arrivalPointId: 'fco', arrivalOtroPunto: 'El Prat', arrivalOtraHora: '08:30', arrivalCodigo: 'VY6102' } }); st.setMode('days'); return true })()`)
    await a.esp(2500)
    const dia = await ev(`${R}.getState().route.days.find((x) => !x.isReturnLeg).id`)
    await a.evaluar(`(async () => { const S = (await import('/src/store/useReorganizarStore.ts')).useReorganizarStore; S.setState({ dias: [${JSON.stringify(dia)}] }); return true })()`)
    await a.esp(1500)
    const boton = await a.evaluar("Boolean(document.querySelector('[data-boton-reorganizar]'))")
    if (boton) await foto(a, 'reservas_reorganizar_boton', { texto: 'el botón redondo de Reorganizar en la columna flotante' })
    else nada('reservas_reorganizar_boton', 'el botón no salió (¿hace falta el pase o poder editar?)')
    await a.evaluar("(() => { const b = document.querySelector('[data-boton-reorganizar]'); b?.click(); return Boolean(b) })()")
    await a.esp(1500)
    const alerta = await a.evaluar("Boolean(document.querySelector('[data-alerta-reorganizar]'))")
    if (alerta) await foto(a, 'reservas_reorganizar_alerta', { texto: await a.evaluar("(document.querySelector('[data-alerta-reorganizar]')?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 300)") })
    else nada('reservas_reorganizar_alerta', 'la alerta «¿Reorganizamos tu día?» no se abrió al tocar el botón')
    await a.evaluar("document.querySelector('[data-reorganizar-si]')?.click(); true")
    await a.esp(4500)
    await foto(a, 'reservas_reorganizar_hecho', { texto: await cuerpo(a, 500) })
  } catch (e) {
    nada('reservas_reorganizar_error', e.message)
  } finally {
    a.cerrar()
  }
}
console.log('reservas hecho')
