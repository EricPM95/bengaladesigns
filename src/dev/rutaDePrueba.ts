/**
 * EL VIAJE DE PRUEBAS, UNO SOLO (Tanda 8B3; con ruta del motor desde la 8B4). Solo en desarrollo. `await window.__rutaPrueba()` crea siempre el mismo viaje, para que TODAS las pruebas y
 * capturas (HOY v2, el Visto, las series de sorpresas) salgan de la misma ruta, con las mismas fechas y el mismo día:
 *   - Roma, del 17 al 20 de octubre de 2026 (4 días; el 20 es el de la vuelta), y «hoy» fijado en el 17 (sábado);
 *   - las paradas las pone EL MOTOR de rutas (la misma petición que hace el formulario: /api/generate-skeleton y siguientes); nada a mano;
 *   - sin foto en ninguna parada: la app las pide al servidor por el nombre, como en el viaje de verdad (así sale la foto propia del Coliseo, etc.).
 * Hace falta estar en la pantalla de inicio (la de «Dev: ruta rápida»), o tener ya un viaje abierto. Devuelve el viaje creado.
 * Si una serie necesita un caso especial (un sitio que el motor no ha puesto ese día), se hace APARTE y a la vista con `__rutaPrueba.conParada('Coliseo', 1)`.
 */
import { useRouteStore } from '../store/useRouteStore'
import { enrichRoutePhotos } from '../lib/placePhoto'
import { runGeneration } from '../lib/routeGenerationOrchestrator'
import { mapGeneratedRouteToRoute } from '../lib/mapGeneratedRoute'
import type { GenerationResumeState } from '../lib/routeGenerationOrchestrator'
import type { QuestionnaireAnswers, Route, Stop } from '../lib/types'

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

function escribir(campo: HTMLInputElement, valor: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(campo, valor)
  campo.dispatchEvent(new Event('input', { bubbles: true }))
}
const boton = (texto: string) => Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes(texto))

export async function crearRutaDePrueba(): Promise<Route> {
  // (no dejar un «hoy» fingido de otra prueba: mandaría sobre el de este viaje)
  delete (window as unknown as { __demoHoy?: string }).__demoHoy
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
  const base = useRouteStore.getState().route
  if (!base) throw new Error('No se ha podido crear el viaje de pruebas.')
  const respuestas: QuestionnaireAnswers = {
    ...base.answers,
    origin: 'Madrid',
    days: 4,
    dateRange: { start: '2026-10-17', end: '2026-10-20' },
    month: 9,
    companion: 'couple',
    experiences: [],
    experiencesPositive: ['imprescindibles'],
    experiencesNegative: [],
    chronotype: 'normal',
    budgetLevel: 'comfortable',
  }
  // La misma generación que hace la app al terminar el formulario, con el motor (Roma es un destino curado).
  let final: GenerationResumeState | null = null
  const params = { destination: 'Roma', answers: respuestas, transportContext: base.transportContext, mustIncludePlaces: [] }
  await runGeneration(params, null, async (cp) => {
    if (cp.phase === 'done') final = cp
  })
  if (!final) throw new Error('El motor no ha devuelto la ruta de prueba.')
  const hecho = final as GenerationResumeState
  const ruta = mapGeneratedRouteToRoute(hecho.generated, 'Roma', respuestas, base.transportContext)
  ruta.id = base.id
  ruta.createdAt = base.createdAt
  for (const dia of ruta.days) if (!dia.countryCode) dia.countryCode = 'it'
  // Las fotos, como en un viaje de verdad: las pide la app al servidor por el nombre de cada parada (8B3).
  await enrichRoutePhotos(ruta)
  useRouteStore.setState({ route: ruta, dev_simulated_today_iso: '2026-10-17' } as never)
  await espera(800)
  return ruta
}

/** (Caso especial, a la vista) Añade una parada con el nombre dado al día indicado del viaje de pruebas, SOLO si el motor no la ha puesto ya en el viaje. Devuelve true si la añadió. */
crearRutaDePrueba.conParada = async function conParada(nombre: string, dia: number, lat: number, lng: number): Promise<boolean> {
  const ruta = structuredClone(useRouteStore.getState().route)
  if (!ruta) throw new Error('Crea antes el viaje de pruebas.')
  if (ruta.days.some((d) => d.stops.some((x) => x.name === nombre))) return false
  const d = ruta.days.find((x) => x.dayNumber === dia)
  if (!d) throw new Error(`No hay día ${dia}.`)
  const parada = { id: `esp-${Date.now()}`, time: '18:00', name: nombre, description: 'Parada especial de la prueba (no la puso el motor).', durationMinutes: 45, coordinates: { lat, lng }, photoUrl: '' } as unknown as Stop
  d.stops.push(parada)
  await enrichRoutePhotos(ruta)
  useRouteStore.setState({ route: ruta } as never)
  return true
}

if (typeof window !== 'undefined') (window as unknown as { __rutaPrueba: typeof crearRutaDePrueba }).__rutaPrueba = crearRutaDePrueba
