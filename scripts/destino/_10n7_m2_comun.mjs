// Ayudante de las pruebas de la Tanda 10N7 (M2): abre el viaje de prueba, pone gente (servidor de mentira del presupuesto compartido) y el modo de las cuentas, y abre el presupuesto.
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

export const APP = process.env.APP_URL ?? 'http://localhost:5173'
export const SALIDA = path.resolve('docs/dias/capturas_jutrip')
export const foto = (n) => path.join(SALIDA, `10n7_${n}.jpg`)

const RESERVAS = (extra = []) => [
  { id: 'r1', kind: 'entrada', refId: 'Coliseo', name: 'Coliseo, Foro y Palatino', placeNames: ['Coliseo'], dateIso: '2026-11-12', dayNumber: null, time: '09:15', precio: { amount: 100, currency: 'EUR' }, paraQuien: ['eric', 'ana'] },
  ...extra,
]

export async function abrir({ ancho = 390, alto = 844 } = {}) {
  const a = await abrirApp(APP, { ancho, alto, ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0' })
  const ev = (js) => a.evaluar(js)
  for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
  for (let i = 0; i < 4; i++) {
    try {
      await ev('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (i === 3) throw e
      await a.esp(3000)
    }
  }
  for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await ev("import('/src/dev/gastosFalsos.ts').then(() => true)").catch(() => false)
  await ev("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useLoSuyo.ts'), import('/src/store/useMisReservas.ts'), import('/src/store/usePresupuestoUi.ts'), import('/src/store/useGastosCompartidos.ts')]).then(() => true)")
  const tienda = (modulo, nombre, js) =>
    ev(`(async () => {
      const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes(${JSON.stringify(modulo)})))]
      const tiendas = []
      for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u))[${JSON.stringify(nombre)}])
      if (!tiendas.length) tiendas.push((await import(${JSON.stringify(modulo)}))[${JSON.stringify(nombre)}])
      let r
      for (const st of new Set(tiendas)) { r = await (async (s) => { ${js} })(st) }
      return r ?? true
    })()`)
  /** Pone a la gente (yo = quien mira) y el modo de las cuentas ('conjunta' | 'cada_uno' | null = sin elegir), y las reservas. */
  const preparar = async ({ yo = 'eric', gente = ['eric', 'ana'], modo = 'conjunta', reservas = RESERVAS(), gastosExtras = [], permiso = null } = {}) => {
    await ev(`window.__ruta.setState((s) => ({ reservations: ${JSON.stringify(reservas)}, accommodationSelections: {}, transportBookings: {}, insuranceBooking: null, rentalVehicleBooking: null, esimPrecios: {}, route: { ...s.route, arrivalPrecio: null, departurePrecio: null, gastosExtras: ${JSON.stringify(gastosExtras)}, cuentasEntre: undefined, modoCuentas: ${modo ? JSON.stringify(modo) : 'undefined'}, modoElegidoCon: ${modo ? gente.length : 'undefined'}, nombreCuenta: undefined, answers: { ...s.route.answers, companion: ${modo === 'conjunta' ? "'couple'" : modo === 'cada_uno' ? "'group'" : "'solo'"} } } })); true`)
    if (permiso) await ev(`try { sessionStorage.setItem('trazo:invitado', '1'); sessionStorage.setItem('trazo:permiso', '${permiso}') } catch (e) {} ; true`)
    else await ev("try { sessionStorage.removeItem('trazo:invitado'); sessionStorage.removeItem('trazo:permiso') } catch (e) {} ; true")
    if (yo) await ev(`window.__gastosFalsos.reiniciar(); window.__gastosFalsos.usar(${JSON.stringify(yo)}, ${JSON.stringify(gente)}).then(() => true)`)
    else await ev('window.__gastosFalsos.reiniciar(); true')
    await tienda('/src/store/useLoSuyo.ts', 'useLoSuyo', 's.setState({ mio: { vuelo: null, alojamiento: null }, grupo: {}, entradas: [] })')
    await a.esp(1200)
  }
  const abrirPresupuesto = async () => {
    await tienda('/src/store/usePresupuestoUi.ts', 'usePresupuestoUi', 's.getState().abrir()')
    await a.esp(1500)
  }
  const cerrarPresupuesto = async () => {
    await tienda('/src/store/usePresupuestoUi.ts', 'usePresupuestoUi', 's.getState().cerrar()')
    await a.esp(500)
  }
  const texto = (sel = '[aria-labelledby="titulo-presupuesto"]') => ev(`(document.querySelector('${sel}')?.innerText ?? 'SIN PANTALLA').replace(/\\s+/g, ' ')`)
  const clic = (re, dentro = 'document') => ev(`(() => { const b = Array.from(${dentro}.querySelectorAll('button, [role="button"], [role="radio"]')).find((x) => ${re}.test((x.textContent || '') + ' ' + (x.getAttribute('aria-label') || ''))); if (!b) return false; b.click(); return true })()`)
  const gasto = (g) => tienda('/src/store/useGastosCompartidos.ts', 'useGastosCompartidos', `return s.getState().anadir(${JSON.stringify(g)})`)
  return { a, ev, tienda, preparar, abrirPresupuesto, cerrarPresupuesto, texto, clic, gasto, RESERVAS }
}
