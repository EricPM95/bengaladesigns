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

/** (Tanda 10S) Espera DE VERDAD a que algo ocurra (con tope), en lugar de una espera fija que bajo carga se queda corta. Devuelve lo que devuelve `buscar` en cuanto no sea falso. */
async function hasta<T>(buscar: () => T | null | undefined | false, segundos: number): Promise<T | null> {
  const limite = Date.now() + segundos * 1000
  for (;;) {
    const r = buscar()
    if (r) return r
    if (Date.now() > limite) return null
    await espera(100)
  }
}

let enCurso: Promise<Route> | null = null

/** Una sola creación a la vez por página: si una prueba la vuelve a pedir mientras la primera sigue (esperas largas por la carga), recibe la misma y no se crea un segundo viaje. */
export function crearRutaDePrueba(): Promise<Route> {
  enCurso ??= crear().finally(() => {
    enCurso = null
  })
  return enCurso
}

async function crear(): Promise<Route> {
  // (no dejar un «hoy» fingido de otra prueba: mandaría sobre el de este viaje)
  delete (window as unknown as { __demoHoy?: string }).__demoHoy
  if (!useRouteStore.getState().route) {
    // (Si la app aún no ha pintado su primera pantalla, ella misma volvería a poner la suya encima de la nuestra: se espera a que salga, hasta 60 s.)
    await hasta(() => document.querySelector('[data-primera-pantalla]'), 60)
    useRouteStore.getState().setScreen('devQuickRoute')
    // (La pantalla se carga bajo demanda y, con un Vite frío o la CPU ocupada, tarda: se espera a que salgan sus campos, hasta 240 s con un Vite frío y la CPU ocupada, y no 800 ms.)
    const campos = await hasta(() => {
      const c = Array.from(document.querySelectorAll('input'))
      return c.some((x) => x.placeholder === 'Madrid') && c.some((x) => /Parada 1/.test(x.placeholder)) ? c : null
    }, 240)
    const origen = campos?.find((c) => c.placeholder === 'Madrid')
    const ciudad = campos?.find((c) => /Parada 1/.test(c.placeholder))
    if (!origen || !ciudad) throw new Error('Abre la pantalla de inicio (la de «Dev: ruta rápida») antes de crear el viaje de pruebas (los campos no salieron en 240 s).')
    escribir(origen, 'Madrid')
    escribir(ciudad, 'Roma')
    const continuar = await hasta(() => {
      const b = boton('Continuar')
      return b && !b.disabled ? b : null
    }, 30)
    continuar?.click()
    const crearBtn = await hasta(() => {
      const b = boton('Crear ruta')
      return b && !b.disabled ? b : null
    }, 60)
    crearBtn?.click()
    await hasta(() => useRouteStore.getState().route, 120)
  }
  const base = useRouteStore.getState().route
  if (!base) throw new Error('No se ha podido crear el viaje de pruebas (la pantalla «Dev: ruta rápida» no llegó a crear la ruta en 120 s).')
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
