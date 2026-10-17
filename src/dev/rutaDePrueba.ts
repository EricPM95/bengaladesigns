/**
 * EL VIAJE DE PRUEBAS, UNO SOLO (Tanda 8B3). Solo en desarrollo. `await window.__rutaPrueba()` crea con la pantalla «Dev: ruta rápida» un viaje Madrid → Roma y le pone las paradas de
 * siempre, para que TODAS las pruebas y capturas (HOY v2, el Visto, las series de sorpresas) salgan del mismo viaje, con las mismas fechas y el mismo día:
 *   - fechas del 17 al 20 de octubre de 2026 (el día 1 es el sábado 17, «Centro histórico»; el 20 es el día de la vuelta), y «hoy» fijado en el 17;
 *   - día 1: Fontana de Trevi, Plaza Navona, Panteón, Basílica de San Pedro, Coliseo; día 2: Foro Romano, Museos Vaticanos;
 *   - sin foto en ninguna parada: la app las pide al servidor por el nombre, como en el viaje de verdad (así sale la foto propia del Coliseo, etc.).
 * Hace falta estar en la pantalla de inicio (la de «Dev: ruta rápida»). Devuelve el viaje creado.
 */
import { useRouteStore } from '../store/useRouteStore'
import { enrichRoutePhotos } from '../lib/placePhoto'

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

function escribir(campo: HTMLInputElement, valor: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(campo, valor)
  campo.dispatchEvent(new Event('input', { bubbles: true }))
}
const boton = (texto: string) => Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes(texto))

const parada = (id: string, hora: string, nombre: string, lat: number, lng: number, min = 45) => ({ id, time: hora, name: nombre, description: 'Parada de prueba.', durationMinutes: min, coordinates: { lat, lng }, photoUrl: '' })

export async function crearRutaDePrueba() {
  if (!useRouteStore.getState().route) {
    boton('Dev: ruta rápida')?.click()
    await espera(800)
    const campos = Array.from(document.querySelectorAll('input'))
    const origen = campos.find((c) => c.placeholder === 'Madrid')
    const ciudad = campos.find((c) => /Parada 1/.test(c.placeholder))
    if (!origen || !ciudad) throw new Error('Abre la pantalla de inicio (la de «Dev: ruta rápida») antes de crear el viaje de pruebas.')
    escribir(origen, 'Madrid')
    escribir(ciudad, 'Roma')
    await espera(300)
    boton('Continuar')?.click()
    await espera(1200)
    boton('Crear ruta')?.click()
    await espera(3500)
  }
  const estado = useRouteStore.getState()
  const ruta = structuredClone(estado.route)
  if (!ruta) throw new Error('No se ha podido crear el viaje de pruebas.')
  ruta.answers = { ...ruta.answers, dateRange: { start: '2026-10-17', end: '2026-10-20' } }
  ruta.days[0].stops = [
    parada('p1', '09:00', 'Fontana de Trevi', 41.9009, 12.4833),
    parada('p2', '10:15', 'Plaza Navona', 41.8992, 12.4731),
    parada('p3', '11:30', 'Panteón', 41.8986, 12.4769),
    parada('p4', '13:30', 'Basílica de San Pedro', 41.9022, 12.4539, 60),
    parada('p5', '16:00', 'Coliseo', 41.8902, 12.4922, 90),
  ]
  if (ruta.days[1]) ruta.days[1].stops = [parada('p6', '09:00', 'Foro Romano', 41.8925, 12.4853, 90), parada('p7', '11:30', 'Museos Vaticanos', 41.9065, 12.4536, 120)]
  // Las fotos, como en un viaje de verdad: las pide la app al servidor por el nombre de cada parada (8B3).
  await enrichRoutePhotos(ruta)
  useRouteStore.setState({ route: ruta, dev_simulated_today_iso: '2026-10-17' } as never)
  await espera(800)
  return ruta
}

if (typeof window !== 'undefined') (window as unknown as { __rutaPrueba: typeof crearRutaDePrueba }).__rutaPrueba = crearRutaDePrueba
